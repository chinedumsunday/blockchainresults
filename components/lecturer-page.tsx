"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText } from "lucide-react"
import { uploadToIPFS, generateMerkleRoot } from "@/lib/utils"

interface LecturerPageProps {
  contract: ethers.Contract
  account: string
}

export function LecturerPage({ contract }: LecturerPageProps) {
  const [session, setSession] = useState("")
  const [semester, setSemester] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [resultsData, setResultsData] = useState("")
  const [uploadType, setUploadType] = useState<"json" | "csv">("json")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const parseResults = (data: string, type: "json" | "csv") => {
    try {
      if (type === "json") {
        return JSON.parse(data)
      } else {
        const lines = data.trim().split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())
        const results = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim())
          const result: any = {}
          headers.forEach((header, index) => {
            result[header] = values[index]
          })
          results.push({
            address: result.student || result.address,
            score: Number.parseInt(result.score),
          })
        }
        return results
      }
    } catch (error) {
      throw new Error("Invalid data format")
    }
  }

  const uploadResults = async () => {
    if (!session || !semester || !courseCode || !resultsData) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Parse results data
      const results = parseResults(resultsData, uploadType)

      // Validate results
      for (const result of results) {
        if (!ethers.isAddress(result.address) || typeof result.score !== "number") {
          throw new Error("Invalid result format")
        }
      }

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(results)

      // Generate Merkle root
      const merkleRoot = generateMerkleRoot(results)

      // Submit to smart contract
      const tx = await contract.uploadResults(session, semester, courseCode, ipfsHash, merkleRoot)
      await tx.wait()

      toast({
        title: "Results Uploaded",
        description: `Successfully uploaded results for ${courseCode}`,
      })

      // Clear form
      setSession("")
      setSemester("")
      setCourseCode("")
      setResultsData("")
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
                  <SelectItem value="first">First Semester</SelectItem>
                  <SelectItem value="second">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-code" className="text-white">
                Course Code
              </Label>
              <Input
                id="course-code"
                placeholder="CS101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="upload-type" className="text-white">
              Upload Format
            </Label>
            <Select value={uploadType} onValueChange={(value: "json" | "csv") => setUploadType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="json">JSON Format</SelectItem>
                <SelectItem value="csv">CSV Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="results-data" className="text-white">
              Results Data
            </Label>
            <Textarea
              id="results-data"
              placeholder={
                uploadType === "json"
                  ? '[{"address": "0x123...", "score": 78}, {"address": "0x456...", "score": 85}]'
                  : "student,score\n0x123...,78\n0x456...,85"
              }
              value={resultsData}
              onChange={(e) => setResultsData(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-32"
            />
          </div>

          <Button onClick={uploadResults} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Uploading..." : "Upload Results"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
