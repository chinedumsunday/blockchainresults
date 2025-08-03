"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Upload, Users, BookOpen } from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseAbi } from "viem"

const CONTRACT_ABI = parseAbi([
  "function addValidator(address validator) external",
  "function admin() external view returns (address)",
  "function isValidator(address) external view returns (bool)",
])

const CONTRACT_ADDRESS = "0x68a80b0cde61a60c21298ec8edf60e9cd9af3a38" as const

export function AdminTab() {
  const [lecturerAddress, setLecturerAddress] = useState("")
  const [studentAddresses, setStudentAddresses] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [courseTitle, setCourseTitle] = useState("")
  const [selectedLecturer, setSelectedLecturer] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Mock data - in production, this would come from your backend/subgraph
  const lecturers = [
    { address: "0x1234...5678", name: "Dr. John Smith" },
    { address: "0x9876...4321", name: "Prof. Jane Doe" },
  ]

  const courses = [
    { code: "CS101", title: "Introduction to Computer Science", lecturer: "Dr. John Smith" },
    { code: "MATH201", title: "Calculus II", lecturer: "Prof. Jane Doe" },
  ]

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const addLecturer = async () => {
    if (!lecturerAddress) {
      toast({
        title: "Error",
        description: "Please enter a lecturer address",
        variant: "destructive",
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addValidator",
        args: [lecturerAddress as `0x${string}`],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lecturer",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: `Lecturer ${lecturerAddress} added successfully`,
      })
      setLecturerAddress("")
    }
  }, [isSuccess, lecturerAddress])

  const uploadStudents = async () => {
    if (!studentAddresses) {
      toast({
        title: "Error",
        description: "Please enter student addresses",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const addresses = studentAddresses.split("\n").filter((addr) => addr.trim())
      // Mock API call - replace with actual smart contract interaction
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Success",
        description: `${addresses.length} students uploaded successfully`,
      })
      setStudentAddresses("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addCourse = async () => {
    if (!courseCode || !courseTitle) {
      toast({
        title: "Error",
        description: "Please fill in all course details",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Mock API call - replace with actual smart contract interaction
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: `Course ${courseCode} added successfully`,
      })
      setCourseCode("")
      setCourseTitle("")
      setSelectedLecturer("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add Lecturer */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            Add Lecturer
          </CardTitle>
          <CardDescription className="text-gray-400">Add a new lecturer to the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lecturer-address" className="text-white">
              Lecturer Wallet Address
            </Label>
            <Input
              id="lecturer-address"
              placeholder="0x..."
              value={lecturerAddress}
              onChange={(e) => setLecturerAddress(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Button
            onClick={addLecturer}
            disabled={isPending || isConfirming}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Add Lecturer"}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Students */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Upload Students
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload student wallet addresses in bulk (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="student-addresses" className="text-white">
              Student Addresses (CSV)
            </Label>
            <Textarea
              id="student-addresses"
              placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
              value={studentAddresses}
              onChange={(e) => setStudentAddresses(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-32"
            />
          </div>
          <Button onClick={uploadStudents} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? "Uploading..." : "Upload Students"}
          </Button>
        </CardContent>
      </Card>

      {/* Add Course */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Add Course
          </CardTitle>
          <CardDescription className="text-gray-400">Create a new course and assign a lecturer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="course-title" className="text-white">
                Course Title
              </Label>
              <Input
                id="course-title"
                placeholder="Introduction to..."
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lecturer-select" className="text-white">
              Assign Lecturer
            </Label>
            <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a lecturer" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.address} value={lecturer.address}>
                    {lecturer.name} ({lecturer.address})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addCourse} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading ? "Adding..." : "Add Course"}
          </Button>
        </CardContent>
      </Card>

      {/* Current Courses */}
      <Card className="bg-gray-800 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-400" />
            Current Courses
          </CardTitle>
          <CardDescription className="text-gray-400">Overview of existing courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.code} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{course.code}</h4>
                    <p className="text-gray-300 text-sm">{course.title}</p>
                    <p className="text-gray-400 text-xs">Lecturer: {course.lecturer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
