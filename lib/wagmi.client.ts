// lib/wagmi.client.ts
"use client"

import { http, createConfig } from "wagmi"
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains"
import { injected, metaMask, walletConnect } from "wagmi/connectors"

const projectId = "21e320d2fe762630c030a5f9cb1368ea"

export const config = createConfig({
  chains: [baseSepolia, sepolia, base, mainnet],
  connectors: [injected(), metaMask(), walletConnect({ projectId })],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
