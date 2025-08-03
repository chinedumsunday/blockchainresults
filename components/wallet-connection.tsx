"use client"

import { useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export function WalletConnection() {
  const { connectors, connect, isPending } = useConnect()

  return (
    <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2 text-2xl">
          <Wallet className="w-8 h-8 text-blue-400" />
          Connect Wallet
        </CardTitle>
        <CardDescription className="text-gray-400 text-lg">
          Connect your wallet to access the Exam Result Validation System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            {isPending ? "Connecting..." : `Connect ${connector.name}`}
          </Button>
        ))}
        <div className="text-center text-sm text-gray-500">
          <p>Make sure you're connected to the correct network</p>
          <p>Contract: 0x68a8...3a38</p>
        </div>
      </CardContent>
    </Card>
  )
}