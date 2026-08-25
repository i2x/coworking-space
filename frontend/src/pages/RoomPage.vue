<script setup>
import { computed, ref, watch } from 'vue'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
import { formatEther } from 'viem'
import { bookingContract } from '../lib/contract'
import { roomImage, roomTypeLabel } from '../lib/rooms'
import { HOUR, todayStr, dateToTs, nowTs } from '../lib/time'
import AvatarBadge from '../components/AvatarBadge.vue'

const props = defineProps({ id: { type: String, required: true } })
const roomId = computed(() => BigInt(props.id))

const { isConnected } = useAccount()

const { data: room } = useReadContract({
  ...bookingContract,
  functionName: 'getRoom',
  args: [roomId],
})

// ---------- ตารางเวลา ----------
const dateStr = ref(todayStr())
const dayStart = computed(() => BigInt(dateToTs(dateStr.value)))

const { data: slots, refetch: refetchSlots } = useReadContract({
  ...bookingContract,
  functionName: 'getSlots',
  args: computed(() => [roomId.value, dayStart.value, 24n]),
})

// เอาไว้โชว์ avatar คนจองบนแต่ละ slot
const { data: allBookings, refetch: refetchBookings } = useReadContract({
  ...bookingContract,
  functionName: 'getAllBookings',
})

// คนที่จองคร่อมช่วงเวลา ts ของห้องนี้
function bookersAt(ts) {
  return (allBookings.value ?? [])
    .filter(
      (b) =>
        b.roomId === roomId.value &&
        !b.cancelled &&
        Number(b.startTime) <= ts &&
        ts < Number(b.endTime)
    )
    .map((b) => b.user)
}

const MAX_ADVANCE = 3 * 24 * HOUR // ตรงกับ MAX_ADVANCE ใน contract

const hours = computed(() => {
  const list = []
  const now = nowTs()
  const units = room.value ? Number(room.value.units) : 1
  for (let i = 0; i < 24; i++) {
    const ts = Number(dayStart.value) + i * HOUR
    const booked = slots.value ? Number(slots.value[i]) : 0
    const left = Math.max(0, units - booked)
    list.push({
      i,
      ts,
      label: `${String(i).padStart(2, '0')}:00`,
      left,
      units,
      taken: left === 0, // เต็มทุกที่นั่งแล้ว
      bookers: booked > 0 ? bookersAt(ts) : [],
      // กดไม่ได้ทั้งชั่วโมงที่ผ่านไปแล้ว และที่ไกลเกินขอบเขตจองล่วงหน้า 3 วัน
      past: ts < now || ts > now + MAX_ADVANCE,
    })
  }
  return list
})

// ---------- เลือก slot ต่อเนื่อง ----------
const selected = ref([]) // เก็บ index ของชั่วโมงที่เลือก เรียงต่อเนื่องเสมอ

watch(dateStr, () => (selected.value = []))

function toggleSlot(h) {
  if (h.taken || h.past) return
  const sel = selected.value
  if (sel.includes(h.i)) {
    // คลิกขอบของช่วงที่เลือก = หด, คลิกกลาง = เริ่มใหม่
    if (h.i === sel[0] || h.i === sel[sel.length - 1]) {
      selected.value = sel.filter((x) => x !== h.i)
    } else {
      selected.value = [h.i]
    }
  } else if (sel.length === 0) {
    selected.value = [h.i]
  } else if (h.i === sel[0] - 1 || h.i === sel[sel.length - 1] + 1) {
    selected.value = [...sel, h.i].sort((a, b) => a - b)
  } else {
    selected.value = [h.i] // ไม่ติดกัน = เริ่มช่วงใหม่
  }
}

const totalPrice = computed(() => {
  if (!room.value) return 0n
  return room.value.pricePerHour * BigInt(selected.value.length)
})

// ---------- ส่งธุรกรรมจอง ----------
const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

function book() {
  const startTs = BigInt(Number(dayStart.value) + selected.value[0] * HOUR)
  writeContract({
    ...bookingContract,
    functionName: 'bookRoom',
    args: [roomId.value, startTs, BigInt(selected.value.length)],
    value: totalPrice.value,
  })
}

watch(isSuccess, (ok) => {
  if (ok) {
    selected.value = []
    refetchSlots()
    refetchBookings()
  }
})
watch(dateStr, () => reset())
</script>

<template>
  <div class="container page" v-if="room">
    <RouterLink to="/" class="muted">← กลับไปหน้าห้องทั้งหมด</RouterLink>

    <div class="card" style="margin-top: 12px">
      <img :src="roomImage(room.imageURI)" :alt="room.name"
        style="width:100%; max-height:340px; object-fit:cover" />
      <div style="padding: 20px">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px">
          <h1>{{ room.name }}</h1>
          <span class="badge" :class="{ inactive: !room.active }">
            {{ room.active ? roomTypeLabel(room.roomType) : 'ปิดชั่วคราว' }}
          </span>
        </div>
        <p class="muted">
          <template v-if="Number(room.units) > 1">
            โซนนั่งรวม {{ room.units }} ที่นั่ง — ต่างคนต่างจองที่ของตัวเองใน slot เดียวกันได้
          </template>
          <template v-else>จองแล้วได้ทั้งห้อง — ความจุ {{ room.capacity }} คน</template>
        </p>
        <p class="price" style="font-size: 20px">
          {{ formatEther(room.pricePerHour) }} ETH / ชั่วโมง{{ Number(room.units) > 1 ? ' / ที่นั่ง' : '' }}
        </p>
      </div>
    </div>

    <div class="section">
      <h2>เลือกวันและเวลา</h2>
      <div class="form-row">
        <label>วันที่:</label>
        <input type="date" v-model="dateStr" :min="todayStr()" :max="todayStr(3)" />
        <span class="muted">จองล่วงหน้าได้ไม่เกิน 3 วัน — คลิกช่องเวลาที่ว่าง (เลือกติดกันได้หลายชั่วโมง)</span>
      </div>

      <div class="slot-grid">
        <div v-for="h in hours" :key="h.i" class="slot"
          :class="{ taken: h.taken, selected: selected.includes(h.i), past: h.past }"
          @click="toggleSlot(h)">
          {{ h.label }}
          <span v-if="h.units > 1 && !h.past" class="seats-left" :class="{ full: h.taken }">
            {{ h.taken ? 'เต็ม' : `ว่าง ${h.left}` }}
          </span>
          <span v-if="h.bookers.length" class="slot-bookers">
            <AvatarBadge v-for="(u, idx) in h.bookers.slice(0, 3)" :key="idx"
              :address="u" :size="20" :show-address="false" />
            <span v-if="h.bookers.length > 3" class="more-bookers">+{{ h.bookers.length - 3 }}</span>
          </span>
        </div>
      </div>

      <div v-if="selected.length" class="card" style="padding: 16px">
        <p>
          จอง <b>{{ room.name }}</b>
          <template v-if="Number(room.units) > 1"> (1 ที่นั่งในโซน)</template>
          เวลา
          <b>{{ String(selected[0]).padStart(2, '0') }}:00 -
            {{ String(selected[selected.length - 1] + 1).padStart(2, '0') }}:00</b>
          ({{ selected.length }} ชั่วโมง)
        </p>
        <p class="price" style="font-size: 18px">รวม {{ formatEther(totalPrice) }} ETH</p>
        <button class="btn" style="margin-top: 8px"
          :disabled="!isConnected || isPending || isConfirming || !room.active"
          @click="book">
          <template v-if="isPending">รอยืนยันใน MetaMask...</template>
          <template v-else-if="isConfirming">รอ transaction ยืนยัน...</template>
          <template v-else-if="!isConnected">เชื่อมต่อ wallet ก่อนจอง</template>
          <template v-else>💳 จองและจ่าย {{ formatEther(totalPrice) }} ETH</template>
        </button>
      </div>

      <div v-if="isSuccess" class="notice ok">✅ จองสำเร็จ! ดูรายการได้ที่หน้า "การจองของฉัน"</div>
      <div v-if="writeError" class="notice error">
        ❌ ทำรายการไม่สำเร็จ: {{ writeError.shortMessage ?? writeError.message }}
      </div>
    </div>
  </div>
</template>
