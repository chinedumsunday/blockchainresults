"use client"

import { useState } from "react"
import { ethers } from "ethers"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import mammoth from "mammoth"
import * as pdfjsLib from "pdfjs-dist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText } from "lucide-react"
import { generateMerkleRoot } from "@/lib/utils"
import { uploadToIPFS } from "@/lib/ipfs"

interface LecturerPageProps {
  contract: ethers.Contract
  account: string
}

export function LecturerPage({ contract }: LecturerPageProps) {
  const [session, setSession] = useState("")
  const [semester, setSemester] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [resultsData, setResultsData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let results: any[] = []

    if (file.name.endsWith(".csv")) {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true })
      results = parsed.data.map((row: any) => ({
        address: row.student || row.address,
        score: Number(row.score),
      }))
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)
      results = json.map((row: any) => ({
        address: row.student || row.address,
        score: Number(row.score),
      }))
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer })
      const lines = value.trim().split("\n")
      for (let i = 1; i < lines.length; i++) {
        const [address, score] = lines[i].split(/\s+/)
        results.push({ address, score: Number(score) })
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
        const [address, score] = lines[i].trim().split(/\s+/)
        results.push({ address, score: Number(score) })
      }
    } else if (file.name.endsWith(".json")) {
      const text = await file.text()
      results = JSON.parse(text)
    }

    setResultsData(results)
  }

  const uploadResults = async () => {
    if (!session || !semester || !courseCode || resultsData.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and upload results",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      for (const result of resultsData) {
        if (!ethers.utils.isAddress(result.address) || typeof result.score !== "number") {
          throw new Error("Invalid result format")
        }
      }

      const ipfsHash = await uploadToIPFS(resultsData)
      const merkleRoot = generateMerkleRoot(resultsData)

      const tx = await contract.uploadResults(session, semester, courseCode, ipfsHash, merkleRoot)
      await tx.wait()

      toast({
        title: "Results Uploaded",
        description: `Successfully uploaded results for ${courseCode}`,
      })

      setSession("")
      setSemester("")
      setCourseCode("")
      setResultsData([])
    } catch (error) {
      console.error("Error uploading results:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Lecturer Dashboard</h2>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Student Results
          </CardTitle>
          <CardDescription className="text-gray-400">Upload student results for validation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="session" className="text-white">Session</Label>
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
                  <SelectItem value="first">First Semester</SelectItem>
                  <SelectItem value="second">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-code" className="text-white">Course Code</Label>
              <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="CS101"
                className="bg-gray-700 border-gray-600 text-white" />
            </div>
          </div>

          <div>
            <Label className="text-white">Upload Results File</Label>
            <Input type="file" accept=".csv,.xlsx,.xls,.docx,.pdf,.json"
              onChange={handleFileUpload}
              className="bg-gray-700 border-gray-600 text-white" />
          </div>

          {resultsData.length > 0 && (
            <Textarea
              readOnly
              value={JSON.stringify(resultsData, null, 2)}
              className="bg-gray-900 border-gray-700 text-white min-h-32"
            />
          )}

          <Button onClick={uploadResults} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Uploading..." : "Upload Results"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
