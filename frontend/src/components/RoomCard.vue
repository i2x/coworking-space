<script setup>
import { formatEther } from 'viem'
import { roomImage, roomTypeLabel } from '../lib/rooms'

defineProps({ room: { type: Object, required: true } })
</script>

<template>
  <RouterLink :to="`/room/${room.id}`" class="card room-card" :class="{ closed: !room.active }">
    <div class="img-wrap">
      <img :src="roomImage(room.imageURI)" :alt="room.name" />
      <div v-if="!room.active" class="closed-overlay">
        <span class="closed-sign">🚧 ปิดให้บริการชั่วคราว</span>
      </div>
    </div>
    <div class="body">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <h3>{{ room.name }}</h3>
        <span class="badge" :class="{ inactive: !room.active }">
          {{ room.active ? roomTypeLabel(room.roomType) : 'ปิดชั่วคราว' }}
        </span>
      </div>
      <div class="muted">
        <template v-if="Number(room.units) > 1">โซนนั่งรวม {{ room.units }} ที่นั่ง — จองเป็นรายที่</template>
        <template v-else>จองได้ทั้งห้อง — ความจุ {{ room.capacity }} คน</template>
      </div>
      <div class="price">
        {{ formatEther(room.pricePerHour) }} ETH / ชม.{{ Number(room.units) > 1 ? ' / ที่นั่ง' : '' }}
      </div>
    </div>
  </RouterLink>
</template>
