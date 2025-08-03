"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Upload, Settings, Users, RefreshCw, Loader2, BookOpen } from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract"
import {
  fetchValidators,
  fetchLecturers,
  fetchStudents,
  fetchCourseAssignments,
  type Lecturer,
  type Student,
  type CourseAssignment,
} from "@/lib/graphql"
import { isAddress } from "viem"

export function AdminDashboard() {
  const [validatorAddress, setValidatorAddress] = useState("")
  const [lecturerAddress, setLecturerAddress] = useState("")
  const [studentAddress, setStudentAddress] = useState("")
  const [bulkStudentData, setBulkStudentData] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [assignLecturerAddress, setAssignLecturerAddress] = useState("")

  const [validators, setValidators] = useState<string[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([])
  const [loadingData, setLoadingData] = useState<string | null>(null)
  const { toast } = useToast()

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read contract constants
  const { data: maxValidators } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "MAX_VALIDATORS",
  })

  const { data: requiredValidations } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "REQUIRED_VALIDATIONS",
  })

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([loadValidators(), loadLecturers(), loadStudents(), loadCourseAssignments()])
  }

  const loadValidators = async () => {
    setLoadingData("validators")
    try {
      console.log("🔄 Admin: Loading validators...")
      const validatorList = await fetchValidators()
      setValidators(validatorList)

      if (validatorList.length > 0) {
        toast({
          title: "Validators Loaded",
          description: `Found ${validatorList.length} validators from blockchain`,
        })
      }
    } catch (error) {
      console.error("Error loading validators:", error)
    } finally {
      setLoadingData(null)
    }
  }

  const loadLecturers = async () => {
    setLoadingData("lecturers")
    try {
      console.log("🔄 Admin: Loading lecturers...")
      const lecturerList = await fetchLecturers()
      setLecturers(lecturerList)

      if (lecturerList.length > 0) {
        toast({
          title: "Lecturers Loaded",
          description: `Found ${lecturerList.length} lecturers from blockchain`,
        })
      }
    } catch (error) {
      console.error("Error loading lecturers:", error)
    } finally {
      setLoadingData(null)
    }
  }

  const loadStudents = async () => {
    setLoadingData("students")
    try {
      console.log("🔄 Admin: Loading students...")
      const studentList = await fetchStudents()
      setStudents(studentList)

      if (studentList.length > 0) {
        toast({
          title: "Students Loaded",
          description: `Found ${studentList.length} students from blockchain`,
        })
      }
    } catch (error) {
      console.error("Error loading students:", error)
    } finally {
      setLoadingData(null)
    }
  }

  const loadCourseAssignments = async () => {
    setLoadingData("courses")
    try {
      console.log("🔄 Admin: Loading course assignments...")
      const assignments = await fetchCourseAssignments()
      setCourseAssignments(assignments)

      if (assignments.length > 0) {
        toast({
          title: "Course Assignments Loaded",
          description: `Found ${assignments.length} course assignments`,
        })
      }
    } catch (error) {
      console.error("Error loading course assignments:", error)
    } finally {
      setLoadingData(null)
    }
  }

  const addValidator = async () => {
    if (!validatorAddress || !isAddress(validatorAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    if (validators.includes(validatorAddress.toLowerCase())) {
      toast({
        title: "Error",
        description: "This address is already a validator",
        variant: "destructive",
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addValidator",
        args: [validatorAddress as `0x${string}`],
      })
    } catch (error) {
      console.error("Error adding validator:", error)
      toast({
        title: "Error",
        description: "Failed to add validator",
        variant: "destructive",
      })
    }
  }

  const addLecturer = async () => {
    if (!lecturerAddress || !isAddress(lecturerAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    if (lecturers.some((l) => l.address.toLowerCase() === lecturerAddress.toLowerCase())) {
      toast({
        title: "Error",
        description: "This address is already registered as a lecturer",
        variant: "destructive",
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addLecturer",
        args: [lecturerAddress as `0x${string}`],
      })
    } catch (error) {
      console.error("Error adding lecturer:", error)
      toast({
        title: "Error",
        description: "Failed to add lecturer",
        variant: "destructive",
      })
    }
  }

  const addStudent = async () => {
    if (!studentAddress || !isAddress(studentAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    if (students.some((s) => s.address.toLowerCase() === studentAddress.toLowerCase())) {
      toast({
        title: "Error",
        description: "This address is already registered as a student",
        variant: "destructive",
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addStudents",
        args: [[studentAddress as `0x${string}`]],
      })
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      })
    }
  }

  const addStudentsBatch = async () => {
    if (!bulkStudentData.trim()) {
      toast({
        title: "Error",
        description: "Please enter student addresses",
        variant: "destructive",
      })
      return
    }

    try {
      const addresses = bulkStudentData
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter((address) => address && isAddress(address))

      if (addresses.length === 0) {
        toast({
          title: "Error",
          description: "No valid addresses found. Please enter one address per line.",
          variant: "destructive",
        })
        return
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addStudents",
        args: [addresses as `0x${string}`[]],
      })
    } catch (error) {
      console.error("Error adding students batch:", error)
      toast({
        title: "Error",
        description: "Failed to add students batch",
        variant: "destructive",
      })
    }
  }

  const assignCourse = async () => {
    if (!courseCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course code",
        variant: "destructive",
      })
      return
    }

    if (!assignLecturerAddress || !isAddress(assignLecturerAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid lecturer address",
        variant: "destructive",
      })
      return
    }

    if (!lecturers.some((l) => l.address.toLowerCase() === assignLecturerAddress.toLowerCase())) {
      toast({
        title: "Error",
        description: "This address is not registered as a lecturer",
        variant: "destructive",
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "assignCourseToLecturer",
        args: [courseCode.trim(), assignLecturerAddress as `0x${string}`],
      })
    } catch (error) {
      console.error("Error assigning course:", error)
      toast({
        title: "Error",
        description: "Failed to assign course",
        variant: "destructive",
      })
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: "Transaction completed successfully!",
      })

      // Clear forms
      setValidatorAddress("")
      setLecturerAddress("")
      setStudentAddress("")
      setBulkStudentData("")
      setCourseCode("")
      setAssignLecturerAddress("")

      // Reload data after successful transaction
      setTimeout(loadAllData, 3000) // Wait for subgraph to index
    }
  }, [isSuccess])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <span className="text-gray-400">- Blockchain Management</span>
        </div>
        <Button
          onClick={loadAllData}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Contract Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Contract Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Contract Address</p>
            <p className="text-white font-mono text-xs">{CONTRACT_ADDRESS}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Max Validators</p>
            <p className="text-white font-bold text-lg">{maxValidators?.toString() || "Loading..."}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Required Validations</p>
            <p className="text-white font-bold text-lg">{requiredValidations?.toString() || "Loading..."}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Validators</p>
            <p className="text-white font-bold text-lg">{validators.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Lecturers</p>
            <p className="text-white font-bold text-lg">{lecturers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Students</p>
            <p className="text-white font-bold text-lg">{students.length}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="validators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="validators" className="data-[state=active]:bg-blue-600">
            Validators ({validators.length})
          </TabsTrigger>
          <TabsTrigger value="lecturers" className="data-[state=active]:bg-blue-600">
            Lecturers ({lecturers.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-blue-600">
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-blue-600">
            Courses ({courseAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validators">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Validator
                </CardTitle>
                <CardDescription className="text-gray-400">Add a new validator to the smart contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="validator-address" className="text-white">
                    Validator Address
                  </Label>
                  <Input
                    id="validator-address"
                    placeholder="0x..."
                    value={validatorAddress}
                    onChange={(e) => setValidatorAddress(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={addValidator}
                  disabled={isPending || isConfirming}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Add Validator"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Validators ({validators.length})
                  {loadingData === "validators" && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                <CardDescription className="text-gray-400">Validators from blockchain events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validators.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400">No validators registered yet.</p>
                    </div>
                  ) : (
                    validators.map((validator, index) => (
                      <div key={validator} className="bg-gray-700 p-3 rounded text-sm">
                        <p className="text-white font-mono">{validator}</p>
                        <p className="text-gray-400 text-xs">Validator #{index + 1}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lecturers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Lecturer
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Add a new lecturer to the blockchain (address only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lecturer-address" className="text-white">
                    Lecturer Address
                  </Label>
                  <Input
                    id="lecturer-address"
                    placeholder="0x..."
                    value={lecturerAddress}
                    onChange={(e) => setLecturerAddress(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Note: Only the address is stored on-chain. Names and departments can be managed off-chain.
                  </p>
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

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Lecturers ({lecturers.length})
                  {loadingData === "lecturers" && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                <CardDescription className="text-gray-400">Lecturers registered on blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lecturers.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No lecturers registered yet</p>
                  ) : (
                    lecturers.map((lecturer, index) => (
                      <div key={lecturer.id} className="bg-gray-700 p-2 rounded text-sm">
                        <p className="text-white font-mono">{lecturer.address}</p>
                        <p className="text-gray-500 text-xs">
                          Added: {new Date(lecturer.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Single Student */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Single Student
                  </CardTitle>
                  <CardDescription className="text-gray-400">Add one student address to the blockchain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="student-address" className="text-white">
                      Student Address
                    </Label>
                    <Input
                      id="student-address"
                      placeholder="0x..."
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={addStudent}
                    disabled={isPending || isConfirming}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Add Student"}
                  </Button>
                </CardContent>
              </Card>

              {/* Bulk Students */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Add Students Batch
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Add multiple student addresses (one per line)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-student-data" className="text-white">
                      Student Addresses
                    </Label>
                    <Textarea
                      id="bulk-student-data"
                      placeholder="0x123...&#10;0x456...&#10;0x789..."
                      value={bulkStudentData}
                      onChange={(e) => setBulkStudentData(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-32"
                    />
                    <p className="text-gray-500 text-xs mt-1">Enter one address per line</p>
                  </div>
                  <Button
                    onClick={addStudentsBatch}
                    disabled={isPending || isConfirming}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Add Students Batch"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Students ({students.length})
                  {loadingData === "students" && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                <CardDescription className="text-gray-400">Students registered on blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No students registered yet</p>
                  ) : (
                    students.map((student, index) => (
                      <div key={student.id} className="bg-gray-700 p-2 rounded text-sm">
                        <p className="text-white font-mono">{student.address}</p>
                        <p className="text-gray-500 text-xs">Added: {new Date(student.addedAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Assign Course to Lecturer
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Assign a course code to a registered lecturer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="assign-lecturer-address" className="text-white">
                    Lecturer Address
                  </Label>
                  <Input
                    id="assign-lecturer-address"
                    placeholder="0x..."
                    value={assignLecturerAddress}
                    onChange={(e) => setAssignLecturerAddress(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-gray-500 text-xs mt-1">Must be a registered lecturer address</p>
                </div>
                <Button
                  onClick={assignCourse}
                  disabled={isPending || isConfirming}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Assign Course"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Assignments ({courseAssignments.length})
                  {loadingData === "courses" && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                <CardDescription className="text-gray-400">Current course-lecturer assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {courseAssignments.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No course assignments yet</p>
                  ) : (
                    courseAssignments.map((assignment) => (
                      <div key={assignment.id} className="bg-gray-700 p-3 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{assignment.courseCode}</p>
                            <p className="text-gray-400 text-xs font-mono">{assignment.lecturer}</p>
                            <p className="text-gray-500 text-xs">
                              Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
