"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap } from "lucide-react"
import { fetchFromIPFS } from "@/lib/utils"

interface StudentPageProps {
  contract: ethers.Contract
  account: string
}

interface StudentResult {
  session: string
  semester: string
  courseCode: string
  score: number
  lecturer: string
}

export function StudentPage({ contract, account }: StudentPageProps) {
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadStudentResults()
  }, [contract, account])

  const loadStudentResults = async () => {
    try {
      // Listen for ResultValidated events
      const filter = contract.filters.ResultValidated()
      const events = await contract.queryFilter(filter)

      const studentResults: StudentResult[] = []

      for (const event of events) {
        const { batchId } = event.args!

        // Get batch data
        const batchData = await contract.batches(batchId)

        if (batchData.isFullyValidated) {
          try {
            // Fetch results from IPFS
            const ipfsResults = await fetchFromIPFS(batchData.ipfsHash)

            // Find results for this student
            const studentResult = ipfsResults.find(
              (result: any) => result.address.toLowerCase() === account.toLowerCase(),
            )

            if (studentResult) {
              // Get lecturer info from localStorage
              const courses = JSON.parse(localStorage.getItem("courses") || "[]")
              const course = courses.find((c: any) => c.code === batchData.courseCode)

              studentResults.push({
                session: batchData.session,
                semester: batchData.semester,
                courseCode: batchData.courseCode,
                score: studentResult.score,
                lecturer: course?.lecturer || "Unknown",
              })
            }
          } catch (error) {
            console.error("Error fetching IPFS data:", error)
          }
        }
      }

      setResults(studentResults)
    } catch (error) {
      console.error("Error loading student results:", error)
      toast({
        title: "Error",
        description: "Failed to load your results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (score: number) => {
    if (score >= 70) return "text-green-400"
    if (score >= 60) return "text-blue-400"
    if (score >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  const getGrade = (score: number) => {
    if (score >= 70) return "A"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    if (score >= 45) return "D"
    return "F"
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      const key = `${result.session}-${result.semester}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(result)
      return acc
    },
    {} as Record<string, StudentResult[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading your results...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">My Results</h2>
      </div>

      {Object.keys(groupedResults).length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-12">
            <p className="text-gray-400 text-center">No validated results found for your account</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([sessionSemester, sessionResults]) => {
            const [session, semester] = sessionSemester.split("-")
            return (
              <Card key={sessionSemester} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {session} - {semester.charAt(0).toUpperCase() + semester.slice(1)} Semester
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {sessionResults.length} course{sessionResults.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-gray-300">Course Code</TableHead>
                        <TableHead className="text-gray-300">Score</TableHead>
                        <TableHead className="text-gray-300">Grade</TableHead>
                        <TableHead className="text-gray-300">Lecturer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionResults.map((result, index) => (
                        <TableRow key={index} className="border-gray-600">
                          <TableCell className="text-gray-300 font-medium">{result.courseCode}</TableCell>
                          <TableCell className={`font-bold ${getGradeColor(result.score)}`}>{result.score}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getGradeColor(result.score)} border-current`}>
                              {getGrade(result.score)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{result.lecturer}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
