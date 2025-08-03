"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2, TrendingUp, Search, Award, Calendar, AlertTriangle } from "lucide-react"
import { fetchStudentResults, type StudentResult } from "@/lib/graphql"

export function StudentDashboard() {
  const { address } = useAccount()
  const [results, setResults] = useState<StudentResult[]>([])
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (address) {
      loadStudentResults()
    }
  }, [address])

  useEffect(() => {
    const filtered = results.filter(
      (result) =>
        result.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.session.includes(searchTerm),
    )
    setFilteredResults(filtered)
  }, [results, searchTerm])

  const loadStudentResults = async () => {
    if (!address) return

    try {
      setLoading(true)
      const studentResults = await fetchStudentResults(address)
      setResults(studentResults)

      if (studentResults.length > 0) {
        toast({
          title: "Results Loaded",
          description: `Found ${studentResults.length} validated results`,
        })
      }
    } catch (error) {
      console.error("Error loading student results:", error)
      toast({
        title: "Error",
        description: "Failed to load your results from subgraph",
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

  const getHighestScore = (results: StudentResult[]) => {
    if (results.length === 0) return 0
    return Math.max(...results.map((r) => r.score))
  }

  // Group results by session and semester
  const groupedResults = filteredResults.reduce(
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
        <span className="ml-2 text-gray-400">Loading your academic records from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">My Academic Results</h2>
        <span className="text-gray-400">- Blockchain Verified</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-white">{results.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Average Score</p>
                <p className="text-3xl font-bold text-white">{calculateGPA(results)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Highest Score</p>
                <p className="text-3xl font-bold text-white">{getHighestScore(results)}%</p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Sessions</p>
                <p className="text-3xl font-bold text-white">{Object.keys(groupedResults).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by course code, title, or session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results by Session */}
      {Object.keys(groupedResults).length === 0 ? (
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center">
              {results.length === 0 ? (
                <>
                  <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No validated results found</p>
                  <p className="text-gray-500 text-sm">
                    Your results will appear here once they are uploaded by lecturers and validated on the blockchain
                  </p>
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg max-w-md mx-auto">
                    <p className="text-blue-300 text-sm">
                      <strong>Your Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <p className="text-blue-400 text-xs mt-1">
                      Make sure this address is registered with your institution
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No results match your search</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                </>
              )}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-xl flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        {sessionSemester}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {sessionResults.length} course{sessionResults.length !== 1 ? "s" : ""} • Average:{" "}
                        {calculateGPA(sessionResults)}%
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      ✓ Blockchain Verified
                    </Badge>
                  </div>
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
                          <TableRow key={result.id} className="border-gray-600 hover:bg-gray-700/50">
                            <TableCell className="text-gray-300 font-medium">{result.courseCode}</TableCell>
                            <TableCell className="text-gray-300">{result.courseTitle || "N/A"}</TableCell>
                            <TableCell className="text-white font-bold text-lg">{result.score}%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getGradeColor(result.score)}>
                                {getGrade(result.score)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{result.lecturer || "N/A"}</TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {new Date(result.validationDate).toLocaleDateString()}
                            </TableCell>
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
