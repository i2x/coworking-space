// avatar จาก address แบบ deterministic: address เดิม → ตัวเดิม สีเดิม เสมอ
// sprite sheet: 8 คอลัมน์ × 4 แถว = 32 ตัว (src/assets/avatar-sprite.png)
const COLS = 8
const ROWS = 4
const TOTAL = COLS * ROWS
const COLORS = [
  '#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0',
  '#DDD6FE', '#FED7AA', '#A5F3FC', '#FECACA',
]

export function addressAvatar(address) {
  if (!address) return { x: 0, y: 0, color: '#E5E7EB' }
  const n = parseInt(address.slice(2, 10), 16)
  const idx = n % TOTAL
  return {
    // เป็น % สำหรับ CSS background-position
    x: (idx % COLS) * (100 / (COLS - 1)),
    y: Math.floor(idx / COLS) * (100 / (ROWS - 1)),
    color: COLORS[Math.floor(n / TOTAL) % COLORS.length],
  }
}

export function shortAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
