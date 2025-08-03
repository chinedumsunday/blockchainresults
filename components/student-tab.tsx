"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2, TrendingUp } from "lucide-react"

interface StudentResult {
  id: string
  session: string
  semester: string
  courseCode: string
  courseTitle: string
  score: number
  lecturer: string
  validationDate: string
}

export function StudentTab() {
  const { address } = useAccount()
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (address) {
      loadStudentResults()
    }
  }, [address])

  const loadStudentResults = async () => {
    try {
      setLoading(true)

      // Mock data - replace with actual GraphQL query filtering by student address
      const mockResults: StudentResult[] = [
        {
          id: "result_1",
          session: "2023/2024",
          semester: "First",
          courseCode: "CS101",
          courseTitle: "Introduction to Computer Science",
          score: 85,
          lecturer: "Dr. John Smith",
          validationDate: "2024-01-20",
        },
        {
          id: "result_2",
          session: "2023/2024",
          semester: "First",
          courseCode: "MATH201",
          courseTitle: "Calculus II",
          score: 78,
          lecturer: "Prof. Jane Doe",
          validationDate: "2024-01-18",
        },
        {
          id: "result_3",
          session: "2022/2023",
          semester: "Second",
          courseCode: "CS102",
          courseTitle: "Data Structures",
          score: 92,
          lecturer: "Dr. Alice Johnson",
          validationDate: "2023-06-15",
        },
        {
          id: "result_4",
          session: "2022/2023",
          semester: "Second",
          courseCode: "MATH101",
          courseTitle: "Linear Algebra",
          score: 67,
          lecturer: "Prof. Bob Wilson",
          validationDate: "2023-06-12",
        },
      ]

      setResults(mockResults)
    } catch (error) {
      console.error("Error loading results:", error)
      toast({
        title: "Error",
        description: "Failed to load your results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getGrade = (score: number) => {
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  const getGradeColor = (score: number) => {
    if (score >= 80) return "text-green-400 border-green-400"
    if (score >= 70) return "text-blue-400 border-blue-400"
    if (score >= 60) return "text-yellow-400 border-yellow-400"
    if (score >= 50) return "text-orange-400 border-orange-400"
    return "text-red-400 border-red-400"
  }

  const calculateGPA = (results: StudentResult[]) => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, result) => sum + result.score, 0)
    return (total / results.length).toFixed(2)
  }

  // Group results by session and semester
  const groupedResults = results.reduce(
    (acc, result) => {
      const key = `${result.session} - ${result.semester} Semester`
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400">Loading your results...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white">{results.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-white">{calculateGPA(results)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Wallet Address</p>
                <p className="text-sm font-mono text-white">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">ME</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results by Session */}
      {Object.keys(groupedResults).length === 0 ? (
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No validated results found</p>
              <p className="text-gray-500 text-sm">Your results will appear here once they are validated</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults)
            .sort(([a], [b]) => b.localeCompare(a)) // Sort by session/semester (newest first)
            .map(([sessionSemester, sessionResults]) => (
              <Card key={sessionSemester} className="bg-gray-800 border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{sessionSemester}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {sessionResults.length} course{sessionResults.length !== 1 ? "s" : ""} • Average:{" "}
                    {calculateGPA(sessionResults)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-gray-300">Course Code</TableHead>
                        <TableHead className="text-gray-300">Course Title</TableHead>
                        <TableHead className="text-gray-300">Score</TableHead>
                        <TableHead className="text-gray-300">Grade</TableHead>
                        <TableHead className="text-gray-300">Lecturer</TableHead>
                        <TableHead className="text-gray-300">Validated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionResults
                        .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
                        .map((result) => (
                          <TableRow key={result.id} className="border-gray-600">
                            <TableCell className="text-gray-300 font-medium">{result.courseCode}</TableCell>
                            <TableCell className="text-gray-300">{result.courseTitle}</TableCell>
                            <TableCell className="text-white font-bold text-lg">{result.score}%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getGradeColor(result.score)}>
                                {getGrade(result.score)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{result.lecturer}</TableCell>
                            <TableCell className="text-gray-400 text-sm">{result.validationDate}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
