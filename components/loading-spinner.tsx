"use client"

import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ message = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className={`animate-spin text-blue-400 ${sizeClasses[size]}`} />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}
