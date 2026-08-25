<script setup>
import { computed } from 'vue'
import { useAccount, useReadContract } from '@wagmi/vue'
import { bookingContract } from '../lib/contract'
import { nowTs } from '../lib/time'
import RoomCard from '../components/RoomCard.vue'
import AvatarParade from '../components/AvatarParade.vue'

const { data: rooms, isLoading, error } = useReadContract({
  ...bookingContract,
  functionName: 'getRooms',
})

// โชว์ทุกห้องเรียงตามเดิม — ห้องที่ปิดแสดงแบบ disabled อยู่ที่เดิม ไม่ย้ายไม่หาย
const allRooms = computed(() => rooms.value ?? [])

// การจองของเรา → แปะแสตมป์บนการ์ดห้องที่จองไว้ ให้กวาดตาหาเจอง่าย
const { address, isConnected } = useAccount()
const { data: myBookings } = useReadContract({
  ...bookingContract,
  functionName: 'getUserBookings',
  args: computed(() => [address.value]),
  query: { enabled: computed(() => isConnected.value && !!address.value) },
})

// roomId → จำนวนใบจองของเราที่ยังไม่จบและไม่ถูกยกเลิก
const myRoomCounts = computed(() => {
  const counts = {}
  for (const b of myBookings.value ?? []) {
    if (!b.cancelled && Number(b.endTime) > nowTs()) {
      const id = Number(b.roomId)
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
})
</script>

<template>
  <div class="container page">
    <div class="hero">
      <h1>เลือกมุมโปรดของคุณ<br />แล้ว<span class="hl">จองด้วย ETH</span> ได้เลย ☕</h1>
      <p class="muted">จองเป็นรายชั่วโมง จ่ายผ่าน MetaMask บน Sepolia testnet</p>
      <AvatarParade />
    </div>

    <div v-if="isLoading" class="notice">กำลังโหลดรายการห้องจาก blockchain...</div>
    <div v-else-if="error" class="notice error">
      อ่านข้อมูลไม่สำเร็จ — เช็คว่า MetaMask อยู่บน network เดียวกับที่ deploy contract ไว้
    </div>

    <div class="room-grid">
      <RoomCard
        v-for="room in allRooms"
        :key="room.id"
        :room="room"
        :my-count="myRoomCounts[Number(room.id)] ?? 0"
        :address="address"
      />
    </div>
  </div>
</template>
