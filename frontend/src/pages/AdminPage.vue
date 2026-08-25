<script setup>
import { computed, watch } from 'vue'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
import { formatEther } from 'viem'
import { bookingContract } from '../lib/contract'
import { useIsAdmin } from '../lib/useIsAdmin'
import { formatDateTime, formatTime, nowTs } from '../lib/time'
import { roomTypeLabel } from '../lib/rooms'
import AvatarBadge from '../components/AvatarBadge.vue'

const { isAdmin } = useIsAdmin()

const { data: rooms, refetch: refetchRooms } = useReadContract({
  ...bookingContract, functionName: 'getRooms',
})
const { data: bookings, refetch: refetchBookings } = useReadContract({
  ...bookingContract, functionName: 'getAllBookings',
})
const { data: withdrawable, refetch: refetchBalance } = useReadContract({
  ...bookingContract, functionName: 'withdrawableBalance',
})

const roomName = (id) => (rooms.value ?? []).find((r) => r.id === id)?.name ?? `#${id}`

const sortedBookings = computed(() =>
  [...(bookings.value ?? [])].sort((a, b) => Number(b.startTime - a.startTime))
)
const activeCount = computed(
  () => sortedBookings.value.filter((b) => !b.cancelled && Number(b.endTime) > nowTs()).length
)
const totalRevenue = computed(() =>
  sortedBookings.value
    .filter((b) => !b.cancelled)
    .reduce((sum, b) => sum + b.totalPrice, 0n)
)

// ---------- เขียน ----------
const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

watch(isSuccess, (ok) => {
  if (ok) { refetchRooms(); refetchBookings(); refetchBalance() }
})

function toggleRoom(r) {
  // ปิดห้อง = ยกเลิก+คืนเงินการจองอนาคตของห้องนี้ทั้งหมดทันที — ยืนยันก่อน
  if (r.active) {
    const ok = window.confirm(
      `ปิด "${r.name}"?\n\nการจองในอนาคตทั้งหมดของห้องนี้จะถูกยกเลิก และคืนเงินเต็มจำนวนให้ลูกค้าทันที`
    )
    if (!ok) return
  }
  writeContract({
    ...bookingContract,
    functionName: 'updateRoom',
    args: [r.id, r.name, r.roomType, r.capacity, r.units, r.pricePerHour, r.imageURI, !r.active],
  })
}

function withdraw() {
  writeContract({ ...bookingContract, functionName: 'withdraw' })
}
</script>

<template>
  <div class="container page">
    <h1>🔧 หน้าเจ้าของห้อง</h1>

    <div v-if="!isAdmin" class="notice error">
      หน้านี้สำหรับเจ้าของระบบ — เชื่อมต่อด้วย wallet ที่ deploy contract (owner) ก่อน
      <br /><span class="muted">ปุ่มด้านล่างจะถูก contract ปฏิเสธ (onlyOwner) ถ้าไม่ใช่ owner</span>
    </div>

    <template v-else>
      <div v-if="isSuccess" class="notice ok">✅ ทำรายการสำเร็จ</div>
      <div v-if="writeError" class="notice error">❌ {{ writeError.shortMessage ?? writeError.message }}</div>

      <div class="stat-row section">
        <div class="card stat">
          <div class="muted">รายได้สะสม (ไม่รวมที่ยกเลิก)</div>
          <div class="num">{{ formatEther(totalRevenue) }} ETH</div>
        </div>
        <div class="card stat">
          <div class="muted">การจองที่ยังไม่จบ</div>
          <div class="num">{{ activeCount }}</div>
        </div>
        <div class="card stat">
          <div class="muted">ยอดถอนได้ตอนนี้</div>
          <div class="num">{{ withdrawable != null ? formatEther(withdrawable) : '-' }} ETH</div>
          <button class="btn small" style="margin-top: 8px"
            :disabled="isPending || isConfirming || !withdrawable" @click="withdraw">
            ถอนเข้ากระเป๋า owner
          </button>
        </div>
      </div>

      <div class="section">
        <h2>จัดการห้อง</h2>
        <div class="card">
          <table class="table">
            <thead>
              <tr><th>ห้อง</th><th>แบบ</th><th>ความจุ</th><th>ที่นั่ง/slot</th><th>ราคา/ชม.</th><th>สถานะ</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="r in rooms ?? []" :key="r.id">
                <td><b>{{ r.name }}</b></td>
                <td>{{ roomTypeLabel(r.roomType) }}</td>
                <td>{{ r.capacity }}</td>
                <td>{{ Number(r.units) > 1 ? r.units : 'ทั้งห้อง' }}</td>
                <td class="price">{{ formatEther(r.pricePerHour) }} ETH</td>
                <td>
                  <span class="badge" :class="{ inactive: !r.active }">
                    {{ r.active ? 'เปิด' : 'ปิด' }}
                  </span>
                </td>
                <td>
                  <button class="btn secondary small" :disabled="isPending || isConfirming"
                    @click="toggleRoom(r)">
                    {{ r.active ? 'ปิดห้อง' : 'เปิดห้อง' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div class="section">
        <h2>การจองทั้งหมด</h2>
        <div v-if="!sortedBookings.length" class="notice">ยังไม่มีการจองเข้ามา</div>
        <div v-else class="card">
          <table class="table">
            <thead>
              <tr><th>#</th><th>ผู้จอง</th><th>ห้อง</th><th>เริ่ม</th><th>ถึง</th><th>ราคา</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
              <tr v-for="b in sortedBookings" :key="b.id">
                <td class="muted">{{ b.id }}</td>
                <td><AvatarBadge :address="b.user" :size="28" /></td>
                <td><b>{{ roomName(b.roomId) }}</b></td>
                <td>{{ formatDateTime(b.startTime) }}</td>
                <td>{{ formatTime(b.endTime) }}</td>
                <td class="price">{{ formatEther(b.totalPrice) }} ETH</td>
                <td>
                  <span class="badge" :class="{ inactive: b.cancelled }">
                    {{ b.cancelled
                      ? (b.cancelledByAdmin ? 'ร้านยกเลิก (คืนเงินแล้ว)' : 'ลูกค้ายกเลิก')
                      : Number(b.endTime) <= nowTs() ? 'จบแล้ว' : 'ใช้งาน' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
