<script setup>
import { computed, watch } from 'vue'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
import { formatEther } from 'viem'
import { bookingContract } from '../lib/contract'
import { formatDateTime, formatTime, nowTs } from '../lib/time'
import AvatarBadge from '../components/AvatarBadge.vue'

const { address, isConnected } = useAccount()

const { data: rooms } = useReadContract({ ...bookingContract, functionName: 'getRooms' })
const roomName = (id) =>
  (rooms.value ?? []).find((r) => r.id === id)?.name ?? `ห้อง #${id}`

const { data: bookings, refetch } = useReadContract({
  ...bookingContract,
  functionName: 'getUserBookings',
  args: computed(() => [address.value]),
  query: { enabled: computed(() => !!address.value) },
})

const sorted = computed(() =>
  [...(bookings.value ?? [])].sort((a, b) => Number(b.startTime - a.startTime))
)

function statusOf(b) {
  const now = nowTs()
  if (b.cancelled) {
    return b.cancelledByAdmin
      ? { label: '🏪 ร้านยกเลิก — คืนเงินเต็มแล้ว', cls: 'inactive' }
      : { label: 'ยกเลิกแล้ว', cls: 'inactive' }
  }
  if (Number(b.endTime) <= now) return { label: 'ใช้งานเสร็จแล้ว', cls: '' }
  if (Number(b.startTime) <= now) return { label: 'กำลังใช้งาน', cls: '' }
  return { label: 'กำลังจะถึง', cls: '' }
}

const canCancel = (b) => !b.cancelled && Number(b.startTime) > nowTs()

const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

function cancel(b) {
  writeContract({
    ...bookingContract,
    functionName: 'cancelBooking',
    args: [b.id],
  })
}

watch(isSuccess, (ok) => ok && refetch())
</script>

<template>
  <div class="container page">
    <h1>การจองของฉัน</h1>

    <div v-if="!isConnected" class="notice">เชื่อมต่อ wallet ก่อน เพื่อดูประวัติการจองของคุณ</div>

    <template v-else>
      <p class="avatar-badge" style="margin: 8px 0">
        <AvatarBadge :address="address" :size="36" />
      </p>

      <div v-if="isSuccess" class="notice ok">✅ ยกเลิกสำเร็จ — ถ้ายกเลิกล่วงหน้าพอ เงินคืนเข้ากระเป๋าแล้ว</div>
      <div v-if="writeError" class="notice error">
        ❌ {{ writeError.shortMessage ?? writeError.message }}
      </div>

      <div v-if="!sorted.length" class="notice">ยังไม่มีการจอง — ไปเลือกห้องที่หน้าแรกได้เลย</div>

      <div v-else class="card" style="margin-top: 12px">
        <table class="table">
          <thead>
            <tr>
              <th>ห้อง</th><th>วัน-เวลาเริ่ม</th><th>ถึง</th><th>ราคา</th><th>สถานะ</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in sorted" :key="b.id">
              <td><b>{{ roomName(b.roomId) }}</b></td>
              <td>{{ formatDateTime(b.startTime) }}</td>
              <td>{{ formatTime(b.endTime) }}</td>
              <td class="price">{{ formatEther(b.totalPrice) }} ETH</td>
              <td><span class="badge" :class="statusOf(b).cls">{{ statusOf(b).label }}</span></td>
              <td>
                <button v-if="canCancel(b)" class="btn danger small"
                  :disabled="isPending || isConfirming" @click="cancel(b)">
                  ยกเลิก
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
