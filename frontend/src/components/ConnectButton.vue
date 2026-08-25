<script setup>
import { computed } from 'vue'
import { useAccount, useBalance, useConnect, useDisconnect } from '@wagmi/vue'
import { formatEther } from 'viem'
import AvatarBadge from './AvatarBadge.vue'

const { address, isConnected } = useAccount()
const { connect, connectors, isPending } = useConnect()
const { disconnect } = useDisconnect()

// ยอดเงินคงเหลือ — refresh เองทุก 15 วิ ไม่ต้องเปิด wallet ดู
const { data: balance } = useBalance({
  address,
  query: { refetchInterval: 15_000 },
})

const balanceText = computed(() => {
  if (!balance.value) return '...'
  const eth = Number(formatEther(balance.value.value))
  // ราคาห้องระดับ 0.000001 ETH — ต้องละเอียดถึง 7 ตำแหน่งถึงเห็นยอดขยับตอนจอง
  return `${eth.toFixed(7)} ETH`
})

function onConnect() {
  // injected = MetaMask/Rabby (หรือ wallet extension อื่นในเบราว์เซอร์)
  connect({ connector: connectors[0] })
}
</script>

<template>
  <div class="avatar-badge">
    <template v-if="isConnected">
      <span class="balance-chip" title="ยอดคงเหลือในกระเป๋า">💰 {{ balanceText }}</span>
      <AvatarBadge :address="address" />
      <button class="btn secondary small" @click="disconnect()">ออก</button>
    </template>
    <button v-else class="btn" :disabled="isPending" @click="onConnect">
      {{ isPending ? 'กำลังเชื่อมต่อ...' : '🦊 Connect Wallet' }}
    </button>
  </div>
</template>
