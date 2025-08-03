"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Eye, Loader2 } from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseAbi } from "viem"

const CONTRACT_ABI = parseAbi(["function validateResults(string session, string semester, string courseCode) external"])

const CONTRACT_ADDRESS = "0x68a80b0cde61a60c21298ec8edf60e9cd9af3a38" as const

interface ResultBatch {
  id: string
  session: string
  semester: string
  courseCode: string
  uploader: string
  uploadDate: string
  studentsCount: number
  results: Array<{
    address: string
    name: string
    score: number
  }>
}

export function ValidatorTab() {
  const [batches, setBatches] = useState<ResultBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingBatch, setViewingBatch] = useState<string | null>(null)
  const { toast } = useToast()

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    loadPendingBatches()
  }, [])

  const loadPendingBatches = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual GraphQL query
      const mockBatches: ResultBatch[] = [
        {
          id: "batch_1",
          session: "2023/2024",
          semester: "First",
          courseCode: "CS101",
          uploader: "0x1234567890abcdef1234567890abcdef12345678",
          uploadDate: "2024-01-15",
          studentsCount: 45,
          results: [
            { address: "0x1111111111111111111111111111111111111111", name: "Alice Johnson", score: 85 },
            { address: "0x2222222222222222222222222222222222222222", name: "Bob Smith", score: 78 },
            { address: "0x3333333333333333333333333333333333333333", name: "Carol Davis", score: 92 },
            { address: "0x4444444444444444444444444444444444444444", name: "David Wilson", score: 67 },
            { address: "0x5555555555555555555555555555555555555555", name: "Eva Brown", score: 89 },
          ],
        },
        {
          id: "batch_2",
          session: "2023/2024",
          semester: "First",
          courseCode: "MATH201",
          uploader: "0x9876543210fedcba9876543210fedcba98765432",
          uploadDate: "2024-01-12",
          studentsCount: 38,
          results: [
            { address: "0x6666666666666666666666666666666666666666", name: "Frank Miller", score: 74 },
            { address: "0x7777777777777777777777777777777777777777", name: "Grace Lee", score: 88 },
            { address: "0x8888888888888888888888888888888888888888", name: "Henry Taylor", score: 91 },
          ],
        },
      ]

      setBatches(mockBatches)
    } catch (error) {
      console.error("Error loading batches:", error)
      toast({
        title: "Error",
        description: "Failed to load pending batches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateBatch = async (batch: ResultBatch) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "validateResults",
        args: [batch.session, batch.semester, batch.courseCode],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate batch",
        variant: "destructive",
      })
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: "Batch validated successfully",
      })
      // Reload batches to remove validated one
      loadPendingBatches()
    }
  }, [isSuccess])

  const toggleViewBatch = (batchId: string) => {
    setViewingBatch(viewingBatch === batchId ? null : batchId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-gray-400">Loading pending batches...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Pending Validations</CardTitle>
          <CardDescription className="text-gray-400">
            Review and validate uploaded result batches from The Graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No pending validations</p>
              <p className="text-gray-500 text-sm">All result batches have been validated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Card key={batch.id} className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          {batch.courseCode} - {batch.session}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {batch.semester} Semester • {batch.studentsCount} students • Uploaded by{" "}
                          {batch.uploader.slice(0, 6)}...{batch.uploader.slice(-4)}
                        </CardDescription>
                        <p className="text-gray-500 text-sm">Upload Date: {batch.uploadDate}</p>
                      </div>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => toggleViewBatch(batch.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {viewingBatch === batch.id ? "Hide" : "View"} Results
                      </Button>
                      <Button
                        onClick={() => validateBatch(batch)}
                        disabled={isPending || isConfirming}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isPending ? (
                          "Confirming..."
                        ) : isConfirming ? (
                          "Processing..."
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Validate
                          </>
                        )}
                      </Button>
                    </div>

                    {viewingBatch === batch.id && (
                      <div className="mt-4">
                        <h4 className="text-white font-medium mb-3">Student Results:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-600">
                              <TableHead className="text-gray-300">Student Address</TableHead>
                              <TableHead className="text-gray-300">Name</TableHead>
                              <TableHead className="text-gray-300">Score</TableHead>
                              <TableHead className="text-gray-300">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batch.results.map((result, index) => (
                              <TableRow key={index} className="border-gray-600">
                                <TableCell className="text-gray-300 font-mono text-sm">
                                  {result.address.slice(0, 6)}...{result.address.slice(-4)}
                                </TableCell>
                                <TableCell className="text-gray-300">{result.name}</TableCell>
                                <TableCell className="text-gray-300 font-bold">{result.score}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`${
                                      result.score >= 80
                                        ? "text-green-400 border-green-400"
                                        : result.score >= 70
                                          ? "text-blue-400 border-blue-400"
                                          : result.score >= 60
                                            ? "text-yellow-400 border-yellow-400"
                                            : "text-red-400 border-red-400"
                                    }`}
                                  >
                                    {result.score >= 80
                                      ? "A"
                                      : result.score >= 70
                                        ? "B"
                                        : result.score >= 60
                                          ? "C"
                                          : result.score >= 50
                                            ? "D"
                                            : "F"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
