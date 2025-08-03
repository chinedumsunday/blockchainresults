"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Hash, Cloud } from "lucide-react"
import { generateMerkleRoot } from "@/lib/utils"
import { uploadToIPFS } from "@/lib/ipfs"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseAbi } from "viem"

const CONTRACT_ABI = parseAbi([
  "function uploadResults(string session, string semester, string courseCode, string ipfsHash, bytes32 merkleRoot) external",
])

const CONTRACT_ADDRESS = "0x68a80b0cde61a60c21298ec8edf60e9cd9af3a38" as const

export function LecturerTab() {
  const [session, setSession] = useState("")
  const [semester, setSemester] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [resultsData, setResultsData] = useState("")
  const [parsedResults, setParsedResults] = useState<any[]>([])
  const [merkleRoot, setMerkleRoot] = useState("")
  const [ipfsHash, setIpfsHash] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Mock past uploads
  const pastUploads = [
    {
      id: "1",
      session: "2023/2024",
      semester: "First",
      courseCode: "CS101",
      uploadDate: "2024-01-15",
      status: "Validated",
      studentsCount: 45,
    },
    {
      id: "2",
      session: "2023/2024",
      semester: "First",
      courseCode: "MATH201",
      uploadDate: "2024-01-10",
      status: "Pending",
      studentsCount: 38,
    },
  ]

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
            address: result.address || result.wallet,
            score: Number.parseInt(result.score || result.grade),
            name: result.name || `Student ${i}`,
          })
        }
      }

      setParsedResults(results)

      // Generate Merkle root
      const root = generateMerkleRoot(results)
      setMerkleRoot(root)

      toast({
        title: "Success",
        description: `Parsed ${results.length} student results`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse results. Check the format.",
        variant: "destructive",
      })
    }
  }

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

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
      const hash = await uploadToIPFS(parsedResults)
      setIpfsHash(hash)

      // Submit to smart contract
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "uploadResults",
        args: [session, semester, courseCode, hash, merkleRoot as `0x${string}`],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload results",
        variant: "destructive",
      })
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: "Results uploaded and submitted to blockchain",
      })
      // Reset form
      setSession("")
      setSemester("")
      setCourseCode("")
      setResultsData("")
      setParsedResults([])
      setMerkleRoot("")
    }
  }, [isSuccess])

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-400" />
            Upload Student Results
          </CardTitle>
          <CardDescription className="text-gray-400">Upload and submit student results for validation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="session" className="text-white">
                Session
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
              placeholder='[{"address": "0x123...", "score": 85, "name": "John Doe"}] or CSV format'
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
            >
              <FileText className="w-4 h-4 mr-2" />
              Parse & Preview
            </Button>
            <Button
              onClick={uploadResults}
              disabled={isPending || isConfirming || parsedResults.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Upload to Blockchain"}
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
                <code className="text-xs text-green-400 break-all">{merkleRoot}</code>
              </div>
              {ipfsHash && (
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    IPFS Hash
                  </Label>
                  <code className="text-xs text-blue-400 break-all">{ipfsHash}</code>
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Student Address</TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedResults.slice(0, 10).map((result, index) => (
                  <TableRow key={index} className="border-gray-600">
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {result.address?.slice(0, 6)}...{result.address?.slice(-4)}
                    </TableCell>
                    <TableCell className="text-gray-300">{result.name}</TableCell>
                    <TableCell className="text-gray-300 font-bold">{result.score}</TableCell>
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
          <CardTitle className="text-white">Past Uploads</CardTitle>
          <CardDescription className="text-gray-400">Your previous result submissions</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="text-gray-300">{upload.courseCode}</TableCell>
                  <TableCell className="text-gray-300">{upload.studentsCount}</TableCell>
                  <TableCell className="text-gray-300">{upload.uploadDate}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        upload.status === "Validated" ? "bg-green-600 text-white" : "bg-yellow-600 text-white"
                      }`}
                    >
                      {upload.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
