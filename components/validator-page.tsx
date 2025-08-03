"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Eye } from "lucide-react"
import { uploadToIPFS } from "@/lib/ipfs"

interface ValidatorPageProps {
  contract: ethers.Contract
  account: string
}

interface ResultBatch {
  batchId: string
  session: string
  semester: string
  courseCode: string
  uploader: string
  ipfsHash: string
  merkleRoot: string
  isValidated: boolean
  results?: any[]
}

export function ValidatorPage({ contract }: ValidatorPageProps) {
  const [batches, setBatches] = useState<ResultBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [viewingResults, setViewingResults] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadUnvalidatedBatches()
  }, [contract])

  const loadUnvalidatedBatches = async () => {
    try {
      // Listen for ResultUploaded events
      const filter = contract.filters.ResultUploaded()
      const events = await contract.queryFilter(filter)

      const batchPromises = events.map(async (event) => {
        const { batchId, session, semester, courseCode, uploader, ipfsHash, merkleRoot } = event.args!

        // Check if batch is validated
        const batchData = await contract.batches(batchId)

        return {
          batchId: batchId.toString(),
          session,
          semester,
          courseCode,
          uploader,
          ipfsHash,
          merkleRoot: merkleRoot.toString(),
          isValidated: batchData.isFullyValidated,
        }
      })

      const batchResults = await Promise.all(batchPromises)
      setBatches(batchResults.filter((batch) => !batch.isValidated))
    } catch (error) {
      console.error("Error loading batches:", error)
      toast({
        title: "Error",
        description: "Failed to load result batches",
        variant: "destructive",
      })
    }
  }

  const viewResults = async (batch: ResultBatch) => {
    setLoading(true)
    try {
      const results = await fetchFromIPFS(batch.ipfsHash)
      setBatches((prev) => prev.map((b) => (b.batchId === batch.batchId ? { ...b, results } : b)))
      setViewingResults(batch.batchId)
    } catch (error) {
      console.error("Error fetching results:", error)
      toast({
        title: "Error",
        description: "Failed to fetch results from IPFS",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateResults = async (batch: ResultBatch) => {
    setLoading(true)
    try {
      const tx = await contract.validateResults(batch.session, batch.semester, batch.courseCode)
      await tx.wait()

      toast({
        title: "Results Validated",
        description: `Successfully validated results for ${batch.courseCode}`,
      })

      // Remove from unvalidated list
      setBatches((prev) => prev.filter((b) => b.batchId !== batch.batchId))
    } catch (error) {
      console.error("Error validating results:", error)
      toast({
        title: "Validation Failed",
        description: "Failed to validate results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Validator Dashboard</h2>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Validations</CardTitle>
          <CardDescription className="text-gray-400">Review and validate uploaded results</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending validations</p>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Card key={batch.batchId} className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          {batch.courseCode} - {batch.session}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {batch.semester} Semester • Uploaded by {batch.uploader.slice(0, 6)}...
                          {batch.uploader.slice(-4)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => viewResults(batch)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </Button>
                      <Button
                        onClick={() => validateResults(batch)}
                        disabled={loading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validate
                      </Button>
                    </div>

                    {viewingResults === batch.batchId && batch.results && (
                      <div className="mt-4">
                        <h4 className="text-white font-medium mb-2">Student Results:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-600">
                              <TableHead className="text-gray-300">Student Address</TableHead>
                              <TableHead className="text-gray-300">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batch.results.map((result, index) => (
                              <TableRow key={index} className="border-gray-600">
                                <TableCell className="text-gray-300 font-mono">
                                  {result.address.slice(0, 6)}...{result.address.slice(-4)}
                                </TableCell>
                                <TableCell className="text-gray-300">{result.score}</TableCell>
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
