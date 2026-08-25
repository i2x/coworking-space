<script setup>
import { useAccount, useConnect, useDisconnect } from '@wagmi/vue'
import AvatarBadge from './AvatarBadge.vue'

const { address, isConnected } = useAccount()
const { connect, connectors, isPending } = useConnect()
const { disconnect } = useDisconnect()

function onConnect() {
  // injected = MetaMask (หรือ wallet extension อื่นในเบราว์เซอร์)
  connect({ connector: connectors[0] })
}
</script>

<template>
  <div class="avatar-badge">
    <template v-if="isConnected">
      <AvatarBadge :address="address" />
      <button class="btn secondary small" @click="disconnect()">ออก</button>
    </template>
    <button v-else class="btn" :disabled="isPending" @click="onConnect">
      {{ isPending ? 'กำลังเชื่อมต่อ...' : '🦊 Connect Wallet' }}
    </button>
  </div>
</template>
