<script setup>
import { computed } from 'vue'
import { useAccount, useSwitchChain } from '@wagmi/vue'
import ConnectButton from './components/ConnectButton.vue'
import { useIsAdmin } from './lib/useIsAdmin'
import { contractAddress, contractChainId } from './lib/contract'

const { isAdmin } = useIsAdmin()

// เตือน + ปุ่มสลับ network เมื่อกระเป๋าอยู่คนละ chain กับ contract
const { isConnected, chainId } = useAccount()
const { switchChain, isPending: isSwitching } = useSwitchChain()
const CHAIN_NAMES = { 1: 'Ethereum Mainnet', 11155111: 'Sepolia', 31337: 'Hardhat Local' }
const wrongChain = computed(
  () => isConnected.value && !!contractChainId && chainId.value !== contractChainId
)
const targetChainName = computed(() => CHAIN_NAMES[contractChainId] ?? `chain ${contractChainId}`)
const currentChainName = computed(() => CHAIN_NAMES[chainId.value] ?? `chain ${chainId.value}`)
</script>

<template>
  <nav class="navbar">
    <div class="container navbar-inner">
      <RouterLink to="/" class="logo"><span class="cup">☕</span> CoWork Space</RouterLink>
      <div class="nav-links">
        <RouterLink to="/">ห้องทั้งหมด</RouterLink>
        <RouterLink to="/my-bookings">การจองของฉัน</RouterLink>
        <RouterLink to="/present">📽️ นำเสนอ</RouterLink>
        <RouterLink v-if="isAdmin" to="/admin">🔧 เจ้าของห้อง</RouterLink>
      </div>
      <ConnectButton />
    </div>
  </nav>

  <div v-if="!contractAddress" class="container">
    <div class="notice error" style="margin-top:16px">
      ⚠️ ยังไม่ได้ deploy contract — รัน <code>npm run deploy:local</code> (หรือ
      <code>deploy:sepolia</code>) ในโฟลเดอร์ <code>contract/</code> ก่อน
      แล้วรีเฟรชหน้านี้
    </div>
  </div>

  <template v-else>
    <div v-if="wrongChain" class="container">
      <div class="notice error"
        style="display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:space-between">
        <span>
          🔀 กระเป๋าอยู่บน <b>{{ currentChainName }}</b> แต่ระบบนี้อยู่บน
          <b>{{ targetChainName }}</b> — สลับก่อนถึงจะทำรายการได้
        </span>
        <button class="btn small" :disabled="isSwitching"
          @click="switchChain({ chainId: contractChainId })">
          {{ isSwitching ? 'กำลังสลับ...' : `สลับไป ${targetChainName}` }}
        </button>
      </div>
    </div>
    <RouterView />
  </template>
</template>
