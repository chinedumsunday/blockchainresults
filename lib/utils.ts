import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { keccak256, encodePacked } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate Merkle root for result verification
export function generateMerkleRoot(results: any[]): string {
  if (results.length === 0) return "0x0000000000000000000000000000000000000000000000000000000000000000"

  // Sort results by address for consistent ordering
  const sortedResults = [...results].sort((a, b) => a.address.localeCompare(b.address))

  // Create leaf nodes by hashing each result
  let nodes = sortedResults.map((result) => {
    const packed = encodePacked(["address", "uint256"], [result.address as `0x${string}`, BigInt(result.score)])
    return keccak256(packed)
  })

  // Build Merkle tree bottom-up
  while (nodes.length > 1) {
    const nextLevel: `0x${string}`[] = []

    for (let i = 0; i < nodes.length; i += 2) {
      if (i + 1 < nodes.length) {
        // Hash pair of nodes
        const packed = encodePacked(["bytes32", "bytes32"], [nodes[i], nodes[i + 1]])
        nextLevel.push(keccak256(packed))
      } else {
        // Odd number of nodes, promote the last one
        nextLevel.push(nodes[i])
      }
    }

    nodes = nextLevel
  }

  return nodes[0] || "0x0000000000000000000000000000000000000000000000000000000000000000"
}

// Utility to shorten addresses
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Utility to format dates
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
