export const HOUR = 3600

// วันนี้ในรูปแบบ YYYY-MM-DD (local timezone)
export function todayStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 'YYYY-MM-DD' → unix ts ของเที่ยงคืนวันนั้น (local)
export function dateToTs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000)
}

export function formatDateTime(ts) {
  return new Date(Number(ts) * 1000).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatTime(ts) {
  return new Date(Number(ts) * 1000).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nowTs() {
  return Math.floor(Date.now() / 1000)
}
