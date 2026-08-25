<script setup>
import spriteUrl from '../assets/avatar-sprite.png'

// ขบวนตัวการ์ตูนตกแต่ง hero — เลือก index จาก sprite sheet (8 คอลัมน์ × 4 แถว)
const CHARACTERS = [0, 1, 5, 6, 16, 18, 21, 31] // จิ้งจอก แพนด้า ยูนิคอร์น โคอาล่า วาฬ ผึ้ง กระต่าย เป็ด
const COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0', '#DDD6FE', '#FED7AA', '#A5F3FC', '#FECACA']

function styleOf(idx, i) {
  return {
    backgroundColor: COLORS[i % COLORS.length],
    backgroundImage: `url(${spriteUrl})`,
    backgroundPosition: `${(idx % 8) * (100 / 7)}% ${Math.floor(idx / 8) * (100 / 3)}%`,
    backgroundSize: '800% 400%',
  }
}
</script>

<template>
  <div class="avatar-parade">
    <span v-for="(idx, i) in CHARACTERS" :key="idx" class="avatar" :style="styleOf(idx, i)" />
    <span class="more-label">เพื่อน ๆ กำลังรอเจอคุณอยู่ที่นี่ ✨</span>
  </div>
</template>
