"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import mammoth from "mammoth"
import * as pdfjsLib from "pdfjs-dist"
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
  const [resultsData, setResultsData] = useState<any[]>([])
  const [merkleRoot, setMerkleRoot] = useState("")
  const [ipfsHash, setIpfsHash] = useState("")
  const [pastUploads, setPastUploads] = useState<ResultBatch[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const { toast } = useToast()

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let results: any[] = []

    if (file.name.endsWith(".csv")) {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true })
      results = parsed.data.map((row: any) => ({
        address: row.address || row.wallet || row.student,
        score: Number(row.score || row.grade),
        name: row.name || "",
      }))
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)
      results = json.map((row: any) => ({
        address: row.address || row.wallet || row.student,
        score: Number(row.score || row.grade),
        name: row.name || "",
      }))
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer })
      const lines = value.trim().split("\n")
      for (let i = 1; i < lines.length; i++) {
        const [address, score, name] = lines[i].split(/\s+/)
        results.push({ address, score: Number(score), name })
      }
    } else if (file.name.endsWith(".pdf")) {
      const pdfjsLib = await import("pdfjs-dist")
      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
      let text = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => item.str).join(" ") + "\n"
      }
      const lines = text.trim().split("\n")
      for (let i = 1; i < lines.length; i++) {
        const [address, score, name] = lines[i].trim().split(/\s+/)
        results.push({ address, score: Number(score), name })
      }
    } else if (file.name.endsWith(".json")) {
      const text = await file.text()
      results = JSON.parse(text)
    }

    if (results.length > 0) {
      setResultsData(results)
      const root = generateMerkleRoot(results)
      setMerkleRoot(root)
      toast({ title: "Success", description: `Parsed ${results.length} student results` })
    }
  }

  const uploadResults = async () => {
    if (!session || !semester || !courseCode || resultsData.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and upload results",
        variant: "destructive",
      })
      return
    }

    try {
      toast({ title: "Uploading to IPFS", description: "Please wait..." })
      const hash = await uploadToIPFS(resultsData)
      setIpfsHash(hash)

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

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Success", description: "Results uploaded to blockchain" })
      setSession("")
      setSemester("")
      setCourseCode("")
      setResultsData([])
      setMerkleRoot("")
      setIpfsHash("")
      setTimeout(loadPastUploads, 3000)
    }
  }, [isSuccess])

  const getStatusBadge = (upload: ResultBatch) =>
    upload.isValidated ? (
      <Badge className="bg-green-600 text-white">✓ Validated</Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
        ⏳ Pending ({upload.validationCount || 0})
      </Badge>
    )

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
          <CardDescription className="text-gray-400">Upload and submit student results for validation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Academic Session</Label>
              <Input value={session} onChange={(e) => setSession(e.target.value)} placeholder="2023/2024"
                className="bg-gray-700 border-gray-600 text-white" />
            </div>
            <div>
              <Label className="text-white">Semester</Label>
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
              <Label className="text-white">Course Code</Label>
              <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="CS101"
                className="bg-gray-700 border-gray-600 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-white">Upload Results File</Label>
              <Button
                asChild
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <a href="/templates/result-template.xlsx" download>
                  Download Template
                </a>
              </Button>
            </div>

            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.docx,.pdf,.json"
              onChange={handleFileUpload}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>


          {resultsData.length > 0 && (
            <Textarea
              readOnly
              value={JSON.stringify(resultsData, null, 2)}
              className="bg-gray-900 border-gray-700 text-white min-h-32"
            />
          )}

          <div className="flex gap-2">
            <Button
              onClick={uploadResults}
              disabled={isPending || isConfirming || resultsData.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Upload to Blockchain
                </>
              )}
            </Button>
          </div>

          {merkleRoot && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700 rounded-lg">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Merkle Root
                </Label>
                <code className="text-xs text-green-400 break-all block mt-1">{merkleRoot}</code>
              </div>
              {ipfsHash && (
                <div>
                  <Label className="text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> IPFS Hash
                  </Label>
                  <code className="text-xs text-blue-400 break-all block mt-1">{ipfsHash}</code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Results */}
      {resultsData.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Preview Results ({resultsData.length} students)</CardTitle>
            <CardDescription className="text-gray-400">Review parsed data before upload</CardDescription>
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
                {resultsData.slice(0, 10).map((result, i) => (
                  <TableRow key={i} className="border-gray-600">
                    <TableCell className="text-gray-300">{result.address}</TableCell>
                    <TableCell className="text-gray-300">{result.name}</TableCell>
                    <TableCell className="text-gray-300">{result.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {resultsData.length > 10 && (
              <p className="text-gray-400 text-sm mt-2">Showing first 10 of {resultsData.length} results</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Uploads */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Your Upload History</CardTitle>
          <CardDescription className="text-gray-400">Track your previous result submissions</CardDescription>
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
                    <TableCell className="text-gray-300">{upload.courseCode}</TableCell>
                    <TableCell className="text-gray-300">{upload.studentsCount}</TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(upload.uploadDate).toLocaleDateString()}
                    </TableCell>
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
