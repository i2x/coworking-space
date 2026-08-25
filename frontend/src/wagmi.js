import { http, createConfig } from '@wagmi/vue'
import { sepolia, hardhat } from '@wagmi/vue/chains'
import { injected } from '@wagmi/vue/connectors'

// รองรับทั้ง Sepolia (ของจริงบน testnet) และ Hardhat local node (ตอน dev)
export const config = createConfig({
  chains: [sepolia, hardhat],
  connectors: [injected()],
  transports: {
    // ระบุ RPC ชัด ๆ — ตัว default ของ viem เป็น RPC สาธารณะที่โดน rate limit ง่าย
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})
