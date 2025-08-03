"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Eye, Loader2, Shield, RefreshCw } from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract"
import { fetchPendingBatches, exploreSubgraphSchema, type ResultBatch } from "@/lib/graphql"
import { fetchFromIPFS } from "@/lib/ipfs"

export function ValidatorDashboard() {
  const { address } = useAccount()
  const [batches, setBatches] = useState<ResultBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingBatch, setViewingBatch] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<Record<string, any[]>>({})
  const [loadingResults, setLoadingResults] = useState<string | null>(null)
  const { toast } = useToast()

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    loadPendingBatches()
    // Explore the subgraph schema on first load
    exploreSubgraphSchema()
  }, [])

  const loadPendingBatches = async () => {
    try {
      setLoading(true)
      const pendingBatches = await fetchPendingBatches()
      setBatches(pendingBatches)

      if (pendingBatches.length > 0) {
        toast({
          title: "Batches Loaded",
          description: `Found ${pendingBatches.length} pending validation${pendingBatches.length !== 1 ? "s" : ""}`,
        })
      }
    } catch (error) {
      console.error("Error loading batches:", error)
      toast({
        title: "Info",
        description: "Using demo data - subgraph schema needs to be configured",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const viewResults = async (batch: ResultBatch) => {
    if (batchResults[batch.id]) {
      // Toggle view if already loaded
      setViewingBatch(viewingBatch === batch.id ? null : batch.id)
      return
    }

    setLoadingResults(batch.id)
    try {
      const results = await fetchFromIPFS(batch.ipfsHash)
      setBatchResults((prev) => ({ ...prev, [batch.id]: results }))
      setViewingBatch(batch.id)
      toast({
        title: "Results Loaded",
        description: `Loaded ${results.length} student results from IPFS`,
      })
    } catch (error) {
      console.error("Error fetching results:", error)
      // Use mock data for demo
      const mockResults = [
        { address: "0x1111111111111111111111111111111111111111", name: "Alice Johnson", score: 85 },
        { address: "0x2222222222222222222222222222222222222222", name: "Bob Smith", score: 78 },
        { address: "0x3333333333333333333333333333333333333333", name: "Carol Davis", score: 92 },
        { address: "0x4444444444444444444444444444444444444444", name: "David Wilson", score: 67 },
        { address: "0x5555555555555555555555555555555555555555", name: "Eva Brown", score: 89 },
      ]
      setBatchResults((prev) => ({ ...prev, [batch.id]: mockResults }))
      setViewingBatch(batch.id)
      toast({
        title: "Demo Results Loaded",
        description: `Showing ${mockResults.length} demo student results`,
      })
    } finally {
      setLoadingResults(null)
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
      console.error("Validation error:", error)
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
        description: "Batch validated successfully on blockchain!",
      })
      // Reload batches after successful validation
      setTimeout(loadPendingBatches, 3000) // Wait for subgraph to index
    }
  }, [isSuccess])

  const getGrade = (score: number) => {
    if (score >= 70) return "A"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    return "F"
  }

  const getGradeColor = (score: number) => {
    if (score >= 70) return "text-green-400 border-green-400"
    if (score >= 60) return "text-blue-400 border-blue-400"
    if (score >= 50) return "text-yellow-400 border-yellow-400"
    return "text-red-400 border-red-400"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <span className="ml-2 text-gray-400">Loading pending validations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Validator Dashboard</h2>
          <span className="text-gray-400">- Validate Result Batches</span>
        </div>
        <Button
          onClick={loadPendingBatches}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Pending Validations</CardTitle>
          <CardDescription className="text-gray-400">
            Review and validate uploaded result batches (Currently showing demo data)
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
                        <p className="text-gray-500 text-sm">
                          Upload Date: {new Date(batch.uploadDate).toLocaleDateString()} • Validations:{" "}
                          {batch.validationCount || 0}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          ⏳ Pending Validation
                        </Badge>
                        {batch.validationCount > 0 && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {batch.validationCount} validations
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => viewResults(batch)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        disabled={loadingResults === batch.id}
                      >
                        {loadingResults === batch.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            {viewingBatch === batch.id ? "Hide" : "View"} Results
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => validateBatch(batch)}
                        disabled={isPending || isConfirming}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Confirming...
                          </>
                        ) : isConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Validate on Blockchain
                          </>
                        )}
                      </Button>
                    </div>

                    {/* IPFS and Merkle Root Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-xs">IPFS Hash:</p>
                        <code className="text-blue-400 text-xs break-all">{batch.ipfsHash}</code>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Merkle Root:</p>
                        <code className="text-green-400 text-xs break-all">{batch.merkleRoot}</code>
                      </div>
                    </div>

                    {viewingBatch === batch.id && batchResults[batch.id] && (
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
                            {batchResults[batch.id].map((result, index) => (
                              <TableRow key={index} className="border-gray-600">
                                <TableCell className="text-gray-300 font-mono text-sm">
                                  {result.address.slice(0, 6)}...{result.address.slice(-4)}
                                </TableCell>
                                <TableCell className="text-gray-300">{result.name || "N/A"}</TableCell>
                                <TableCell className="text-gray-300 font-bold">{result.score}%</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getGradeColor(result.score)}>
                                    {getGrade(result.score)}
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
