<script setup>
import { computed } from 'vue'
import { addressAvatar, shortAddress } from '../lib/avatar'
import spriteUrl from '../assets/avatar-sprite.png'

const props = defineProps({
  address: { type: String, default: '' },
  size: { type: Number, default: 32 },
  showAddress: { type: Boolean, default: true },
})

const a = computed(() => addressAvatar(props.address))
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: a.value.color,
  backgroundImage: `url(${spriteUrl})`,
  backgroundPosition: `${a.value.x}% ${a.value.y}%`,
  backgroundSize: '800% 400%', // 8 คอลัมน์ × 4 แถว
}))
</script>

<template>
  <span class="avatar-badge">
    <span class="avatar" :style="style" :title="address" />
    <span v-if="showAddress" class="mono">{{ shortAddress(address) }}</span>
  </span>
</template>
