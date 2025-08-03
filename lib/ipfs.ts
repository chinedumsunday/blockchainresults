const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

export async function uploadToIPFS(data: any): Promise<string> {
  try {
    // For demo purposes, we'll simulate IPFS upload
    // In production, replace with actual IPFS service like Pinata

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY || "demo_key",
        pinata_secret_api_key: PINATA_SECRET_KEY || "demo_secret",
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `exam-results-${Date.now()}`,
        },
      }),
    })

    if (!response.ok) {
      // Fallback to mock IPFS for demo
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem(`ipfs_${mockHash}`, JSON.stringify(data))
      return mockHash
    }

    const result = await response.json()
    return result.IpfsHash
  } catch (error) {
    console.error("IPFS upload error:", error)
    // Fallback to localStorage for demo
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(`ipfs_${mockHash}`, JSON.stringify(data))
    return mockHash
  }
}

export async function fetchFromIPFS(hash: string): Promise<any> {
  try {
    // Try to fetch from actual IPFS
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`)

    if (!response.ok) {
      // Fallback to localStorage
      const data = localStorage.getItem(`ipfs_${hash}`)
      if (!data) {
        throw new Error("Data not found in IPFS or localStorage")
      }
      return JSON.parse(data)
    }

    return await response.json()
  } catch (error) {
    console.error("IPFS fetch error:", error)
    // Try localStorage fallback
    const data = localStorage.getItem(`ipfs_${hash}`)
    if (!data) {
      throw new Error("Data not found in IPFS or localStorage")
    }
    return JSON.parse(data)
  }
}
