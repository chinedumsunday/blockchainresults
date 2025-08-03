"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Hash, Cloud, BookOpen, Loader2 } from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract"
import { uploadToIPFS } from "@/lib/ipfs"
import { fetchLecturerUploads, type ResultBatch } from "@/lib/graphql"
import { generateMerkleRoot } from "@/lib/utils"

export function LecturerDashboard() {
  const { address } = useAccount()
  const [session, setSession] = useState("")
  const [semester, setSemester] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [resultsData, setResultsData] = useState("")
  const [parsedResults, setParsedResults] = useState<any[]>([])
  const [merkleRoot, setMerkleRoot] = useState("")
  const [ipfsHash, setIpfsHash] = useState("")
  const [pastUploads, setPastUploads] = useState<ResultBatch[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const { toast } = useToast()

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Load lecturer's past uploads
  useEffect(() => {
    if (address) {
      loadPastUploads()
    }
  }, [address])

  const loadPastUploads = async () => {
    if (!address) return

    try {
      setLoadingUploads(true)
      const uploads = await fetchLecturerUploads(address)
      setPastUploads(uploads)
    } catch (error) {
      console.error("Error loading past uploads:", error)
      toast({
        title: "Error",
        description: "Failed to load your past uploads",
        variant: "destructive",
      })
    } finally {
      setLoadingUploads(false)
    }
  }

  const parseResults = () => {
    try {
      let results: any[] = []

      if (resultsData.trim().startsWith("[")) {
        // JSON format
        results = JSON.parse(resultsData)
      } else {
        // CSV format
        const lines = resultsData.trim().split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim())
          const result: any = {}
          headers.forEach((header, index) => {
            result[header] = values[index]
          })
          results.push({
            address: result.address || result.wallet || result.student,
            score: Number.parseInt(result.score || result.grade),
            name: result.name || `Student ${i}`,
          })
        }
      }

      // Validate results
      const validResults = results.filter((result) => {
        return (
          result.address &&
          result.address.match(/^0x[a-fA-F0-9]{40}$/) &&
          typeof result.score === "number" &&
          result.score >= 0 &&
          result.score <= 100
        )
      })

      if (validResults.length === 0) {
        throw new Error("No valid results found")
      }

      setParsedResults(validResults)

      // Generate Merkle root
      const root = generateMerkleRoot(validResults)
      setMerkleRoot(root)

      toast({
        title: "Success",
        description: `Parsed ${validResults.length} valid student results`,
      })
    } catch (error) {
      console.error("Parse error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse results. Check the format.",
        variant: "destructive",
      })
    }
  }

  const uploadResults = async () => {
    if (!session || !semester || !courseCode || parsedResults.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and parse results first",
        variant: "destructive",
      })
      return
    }

    try {
      // Upload to IPFS first
      toast({
        title: "Uploading to IPFS",
        description: "Please wait while we upload your data...",
      })

      const hash = await uploadToIPFS(parsedResults)
      setIpfsHash(hash)

      toast({
        title: "IPFS Upload Complete",
        description: `Data uploaded with hash: ${hash}`,
      })

      // Submit to smart contract
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "uploadResults",
        args: [session, semester, courseCode, hash, merkleRoot as `0x${string}`],
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload results",
        variant: "destructive",
      })
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: "Results uploaded and submitted to blockchain successfully!",
      })
      // Reset form
      setSession("")
      setSemester("")
      setCourseCode("")
      setResultsData("")
      setParsedResults([])
      setMerkleRoot("")
      setIpfsHash("")
      // Reload past uploads
      setTimeout(loadPastUploads, 3000) // Wait for subgraph to index
    }
  }, [isSuccess])

  const getStatusBadge = (upload: ResultBatch) => {
    if (upload.isValidated) {
      return <Badge className="bg-green-600 text-white">✓ Validated</Badge>
    }
    return (
      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
        ⏳ Pending ({upload.validationCount || 0} validations)
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Lecturer Dashboard</h2>
        <span className="text-gray-400">- Upload & Manage Results</span>
      </div>

      {/* Upload Form */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-400" />
            Upload Student Results
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload and submit student results for validation on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="session" className="text-white">
                Academic Session
              </Label>
              <Input
                id="session"
                placeholder="2023/2024"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="semester" className="text-white">
                Semester
              </Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="First">First Semester</SelectItem>
                  <SelectItem value="Second">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course" className="text-white">
                Course Code
              </Label>
              <Input
                id="course"
                placeholder="CS101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="results" className="text-white">
              Results Data (JSON or CSV)
            </Label>
            <Textarea
              id="results"
              placeholder='JSON: [{"address": "0x123...", "score": 85, "name": "John Doe"}]&#10;CSV: address,score,name&#10;0x123...,85,John Doe'
              value={resultsData}
              onChange={(e) => setResultsData(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-32"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={parseResults}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-600"
              disabled={!resultsData.trim()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Parse & Preview
            </Button>
            <Button
              onClick={uploadResults}
              disabled={isPending || isConfirming || parsedResults.length === 0}
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
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Blockchain
                </>
              )}
            </Button>
          </div>

          {/* Merkle Root & IPFS Hash Display */}
          {merkleRoot && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700 rounded-lg">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Merkle Root
                </Label>
                <code className="text-xs text-green-400 break-all block mt-1">{merkleRoot}</code>
              </div>
              {ipfsHash && (
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    IPFS Hash
                  </Label>
                  <code className="text-xs text-blue-400 break-all block mt-1">{ipfsHash}</code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedResults.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Preview Results ({parsedResults.length} students)</CardTitle>
            <CardDescription className="text-gray-400">
              Review the parsed data before uploading to blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {parsedResults.slice(0, 10).map((result, index) => (
                  <TableRow key={index} className="border-gray-600">
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {result.address?.slice(0, 6)}...{result.address?.slice(-4)}
                    </TableCell>
                    <TableCell className="text-gray-300">{result.name}</TableCell>
                    <TableCell className="text-gray-300 font-bold">{result.score}%</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          result.score >= 70
                            ? "text-green-400 border-green-400"
                            : result.score >= 60
                              ? "text-blue-400 border-blue-400"
                              : result.score >= 50
                                ? "text-yellow-400 border-yellow-400"
                                : "text-red-400 border-red-400"
                        }
                      >
                        {result.score >= 70 ? "A" : result.score >= 60 ? "B" : result.score >= 50 ? "C" : "F"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedResults.length > 10 && (
              <p className="text-gray-400 text-sm mt-2">Showing first 10 of {parsedResults.length} results</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Uploads */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Your Upload History</CardTitle>
          <CardDescription className="text-gray-400">
            Track your previous result submissions and their validation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUploads ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">Loading your uploads...</span>
            </div>
          ) : pastUploads.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No uploads found</p>
              <p className="text-gray-500 text-sm">Your uploaded results will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Session</TableHead>
                  <TableHead className="text-gray-300">Semester</TableHead>
                  <TableHead className="text-gray-300">Course</TableHead>
                  <TableHead className="text-gray-300">Students</TableHead>
                  <TableHead className="text-gray-300">Upload Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastUploads.map((upload) => (
                  <TableRow key={upload.id} className="border-gray-600">
                    <TableCell className="text-gray-300">{upload.session}</TableCell>
                    <TableCell className="text-gray-300">{upload.semester}</TableCell>
                    <TableCell className="text-gray-300 font-medium">{upload.courseCode}</TableCell>
                    <TableCell className="text-gray-300">{upload.studentsCount}</TableCell>
                    <TableCell className="text-gray-300">{new Date(upload.uploadDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(upload)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
