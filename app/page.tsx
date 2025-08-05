"use client"

import { useState, useEffect } from "react"
import { useRef } from "react"
import { useAccount, useDisconnect, useReadContract, useChainId } from "wagmi"
import { WalletConnection } from "@/components/wallet-connection"
import { AdminDashboard } from "@/components/admin-dashboard"
import { LecturerDashboard } from "@/components/lecturer-dashboard"
import { ValidatorDashboard } from "@/components/validator-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, GraduationCap, Shield, BookOpen, AlertTriangle, Network } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract"
import { fetchValidators, initializeSubgraph, fetchLecturers, fetchStudents } from "@/lib/graphql"
import { baseSepolia } from "wagmi/chains"

type UserRole = "admin" | "lecturer" | "validator" | "student" | "unauthorized"

export default function Dashboard() {
  const [showConnectWallet, setShowConnectWallet] = useState(false)
  const walletRef = useRef<HTMLDivElement>(null)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [validators, setValidators] = useState<string[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subgraphInitialized, setSubgraphInitialized] = useState(false)
  const { toast } = useToast()

   useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
      setShowConnectWallet(false)
    }
  }

  if (showConnectWallet) {
    document.addEventListener("mousedown", handleClickOutside)
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside)
  }
}, [showConnectWallet])

  // Check if on correct network
  const isCorrectNetwork = chainId === baseSepolia.id

  // Read admin address from contract
  const {
    data: adminAddress,
    isLoading: adminLoading,
    error: adminError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "admin",
    chainId: baseSepolia.id,
  })

  // Check if user is validator
  const {
    data: isValidator,
    isLoading: validatorLoading,
    error: validatorError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isValidator",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  })

  // Initialize subgraph and load validators
  useEffect(() => {
    const initSubgraph = async () => {
      if (isCorrectNetwork && !subgraphInitialized) {
        try {
          await initializeSubgraph()
          setSubgraphInitialized(true)

          // Load validators from The Graph
          const validatorList = await fetchValidators()
          setValidators(validatorList)

          // Load lecturers from The Graph
          const lecturerList = await fetchLecturers()
          setLecturers(lecturerList)

          // Load students from The Graph
          const studentList = await fetchStudents()
          setStudents(studentList)

          if (validatorList.length > 0) {
            toast({
              title: "Validators Loaded",
              description: `Found ${validatorList.length} validators from The Graph`,
            })
          } else {
            toast({
              title: "No Validators Found",
              description: "No validators found in subgraph. Add validators using admin panel.",
              variant: "default",
            })
          }
        } catch (error) {
          console.error("Error initializing subgraph:", error)
          toast({
            title: "Subgraph Connection",
            description: "Could not connect to The Graph. Check console for details.",
            variant: "destructive",
          })
        }
      }
    }

    initSubgraph()
  }, [isCorrectNetwork, subgraphInitialized])

  // Detect user role
  useEffect(() => {
    if (!address || !isCorrectNetwork) {
      setUserRole(null)
      setLoading(false)
      return
    }

    if (adminLoading || validatorLoading) {
      setLoading(true)
      return
    }

    setLoading(true)

    try {
      // Check demo mode first
      const demoAdmin = localStorage.getItem("demo_admin")
      if (demoAdmin && demoAdmin.toLowerCase() === address.toLowerCase()) {
        setUserRole("admin")
        toast({
          title: "Welcome Demo Admin",
          description: "You have demo administrative access",
        })
        setLoading(false)
        return
      }

      // Check if admin from contract
      if (adminAddress && adminAddress.toLowerCase() === address.toLowerCase()) {
        setUserRole("admin")
        toast({
          title: "Welcome Admin",
          description: "You have full administrative access",
        })
        setLoading(false)
        return
      }

      // Check if validator (from contract first)
      if (isValidator === true) {
        setUserRole("validator")
        toast({
          title: "Welcome Validator",
          description: "You can validate result batches (verified by contract)",
        })
        setLoading(false)
        return
      }

      // Check if validator (from The Graph subgraph)
      if (validators.length > 0 && validators.some((v) => v.toLowerCase() === address.toLowerCase())) {
        setUserRole("validator")
        toast({
          title: "Welcome Validator",
          description: "You can validate result batches (verified by The Graph)",
        })
        setLoading(false)
        return
      }

      // Check if lecturer (from The Graph subgraph)
      if (lecturers.length > 0 && lecturers.some((l) => l.address.toLowerCase() === address.toLowerCase())) {
        setUserRole("lecturer")
        toast({
          title: "Welcome Lecturer",
          description: "You can upload student results (verified by The Graph)",
        })
        setLoading(false)
        return
      }

      // Check if lecturer (stored in localStorage for demo)
      const lecturersStorage = JSON.parse(localStorage.getItem("lecturers") || "[]")
      const isLecturerInStorage = lecturersStorage.some(
        (lecturer: any) => lecturer.address && lecturer.address.toLowerCase() === address.toLowerCase(),
      )

      if (isLecturerInStorage) {
        setUserRole("lecturer")
        toast({
          title: "Welcome Lecturer",
          description: "You can upload student results (demo mode)",
        })
        setLoading(false)
        return
      }

      // Check if student (from The Graph subgraph)
      if (students.length > 0 && students.some((s) => s.address.toLowerCase() === address.toLowerCase())) {
        setUserRole("student")
        toast({
          title: "Welcome Student",
          description: "You can view your validated results (verified by The Graph)",
        })
        setLoading(false)
        return
      }

      // Check if student (stored in localStorage for demo)
      const studentsStorage = JSON.parse(localStorage.getItem("students") || "[]")
      const isStudentInStorage = studentsStorage.some(
        (student: any) => student.address && student.address.toLowerCase() === address.toLowerCase(),
      )

      if (isStudentInStorage) {
        setUserRole("student")
        toast({
          title: "Welcome Student",
          description: "You can view your validated results (demo mode)",
        })
        setLoading(false)
        return
      }

      // If no role found, mark as unauthorized
      setUserRole("unauthorized")
      setLoading(false)
    } catch (error) {
      console.error("Error detecting user role:", error)
      setUserRole("unauthorized")
      setLoading(false)
    }
  }, [
    address,
    adminAddress,
    isValidator,
    adminLoading,
    validatorLoading,
    validators,
    lecturers,
    students,
    isCorrectNetwork,
  ])

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Settings className="w-4 h-4" />
      case "lecturer":
        return <BookOpen className="w-4 h-4" />
      case "validator":
        return <Shield className="w-4 h-4" />
      case "student":
        return <GraduationCap className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "text-blue-400 border-blue-400"
      case "lecturer":
        return "text-green-400 border-green-400"
      case "validator":
        return "text-yellow-400 border-yellow-400"
      case "student":
        return "text-purple-400 border-purple-400"
      default:
        return "text-red-400 border-red-400"
    }
  }

  if (!isConnected) {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-800/30 rounded-full filter blur-3xl animate-pulse z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700/20 rounded-full filter blur-2xl animate-ping z-0" />

      {/* Top-right Connect Button */}
      {!showConnectWallet && (
        <div className="absolute top-4 right-6 z-50">
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 rounded-md shadow-md"
            onClick={() => setShowConnectWallet(true)}
          >
            Connect Wallet
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[70vh] px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-xl mb-4">
          Exam Result Validation System
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Transparent. Tamper-proof. On-chain academic records for the future.
        </p>

        {!showConnectWallet ? (
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-6 py-3 rounded-xl shadow-lg"
            onClick={() => setShowConnectWallet(true)}
          >
            Connect Wallet
          </Button>
        ) : (
          <div ref={walletRef} className="z-50">
            <WalletConnection />
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-20 text-center">
        {[
          {
            icon: <BookOpen className="w-6 h-6 text-blue-400 mb-3 mx-auto" />,
            title: "Upload",
            desc: "Lecturers securely upload result batches on-chain.",
          },
          {
            icon: <Shield className="w-6 h-6 text-yellow-400 mb-3 mx-auto" />,
            title: "Validate",
            desc: "Validators confirm authenticity and batch accuracy.",
          },
          {
            icon: <GraduationCap className="w-6 h-6 text-purple-400 mb-3 mx-auto" />,
            title: "View",
            desc: "Students access verifiable results using their wallet.",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="backdrop-blur-md bg-white/5 border border-gray-700 rounded-xl p-6 shadow-md hover:shadow-blue-500/20 transition duration-300"
          >
            {feature.icon}
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-gray-500 text-sm py-6 border-t border-gray-800 backdrop-blur-sm bg-white/5">
        Built for Nigerian institutions • Powered by Ethereum + The Graph
      </footer>
    </div>
  )
}

  // Wrong network warning
  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Exam Result Validation System</h1>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Disconnect
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-6">
            <Network className="w-24 h-24 text-orange-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Wrong Network</h2>
              <p className="text-gray-400 text-lg">Please switch to Base Sepolia network</p>
            </div>
            <Alert className="bg-orange-900/20 border-orange-500/50 max-w-md mx-auto">
              <Network className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                This application requires Base Sepolia network. Please switch your wallet to the correct network.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-gray-500 space-y-2">
              <p>Required Network: Base Sepolia (Chain ID: {baseSepolia.id})</p>
              <p>Current Network: {chainId}</p>
              <p>Contract: {shortenAddress(CONTRACT_ADDRESS)}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Detecting your role from blockchain and The Graph..." />
      </div>
    )
  }

  if (userRole === "unauthorized") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Exam Result Validation System</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Network className="w-3 h-3 mr-1" />
                Base Sepolia
              </Badge>
              <div className="text-sm text-gray-300">
                <code className="bg-gray-700 px-2 py-1 rounded text-xs">{shortenAddress(address!)}</code>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-6">
            <AlertTriangle className="w-24 h-24 text-red-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Access Denied</h2>
              <p className="text-gray-400 text-lg">Your wallet address is not registered in the system</p>
            </div>
            <Alert className="bg-red-900/20 border-red-500/50 max-w-md mx-auto">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Please contact an administrator to register your wallet address with the appropriate role.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-gray-500 space-y-2">
              <p>Contract: {shortenAddress(CONTRACT_ADDRESS)}</p>
              <p>Your Address: {shortenAddress(address!)}</p>
              <p>Admin Address: {adminAddress ? shortenAddress(adminAddress) : "Loading..."}</p>
              <p>Validators from The Graph: {validators.length}</p>
              <p>Lecturers from The Graph: {lecturers.length}</p>
              <p>Students from The Graph: {students.length}</p>
              <p>Network: Base Sepolia</p>
              <p>Subgraph: {subgraphInitialized ? "✅ Connected" : "❌ Not Connected"}</p>
              <p>Demo Admin: {localStorage.getItem("demo_admin") ? "✅ Set" : "❌ Not Set"}</p>
            </div>

            {/* Demo Mode Button */}
            <div className="mt-8 p-4 bg-blue-900/20 rounded-lg">
              <p className="text-blue-300 text-sm mb-3">For testing purposes, you can add yourself as admin:</p>
              <Button
                onClick={() => {
                  // Add current address as admin in localStorage for demo
                  localStorage.setItem("demo_admin", address!)
                  window.location.reload()
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Enable Demo Mode (Add as Admin)
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />
      case "lecturer":
        return <LecturerDashboard />
      case "validator":
        return <ValidatorDashboard />
      case "student":
        return <StudentDashboard />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">
              {userRole === "student" ? "Student Portal" : "Exam Result Management"}
            </h1>
            <Badge variant="outline" className={getRoleColor(userRole!)}>
              {getRoleIcon(userRole!)}
              <span className="ml-1 capitalize">{userRole}</span>
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Network className="w-3 h-3 mr-1" />
              Base Sepolia
            </Badge>
            <Badge
              variant="outline"
              className={subgraphInitialized ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}
            >
              The Graph: {subgraphInitialized ? "✅" : "❌"}
            </Badge>
            <div className="text-sm text-gray-300">
              <span className="text-gray-500">Contract:</span>{" "}
              <code className="bg-gray-700 px-2 py-1 rounded text-xs">{shortenAddress(CONTRACT_ADDRESS)}</code>
            </div>
            <div className="text-sm text-gray-300">
              <span className="text-gray-500">Wallet:</span>{" "}
              <code className="bg-gray-700 px-2 py-1 rounded text-xs">{shortenAddress(address!)}</code>
            </div>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{renderDashboard()}</main>
    </div>
  )
}
