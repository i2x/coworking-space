<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// สไลด์นำเสนอวิชา Blockchain — เดโม แล้วอธิบายกติกาของ contract ตรง ๆ
const total = 12
const cur = ref(0)

function go(i) {
  cur.value = Math.min(Math.max(i, 0), total - 1)
}
function onKey(e) {
  if (['ArrowRight', 'Right', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur.value + 1) }
  else if (['ArrowLeft', 'Left', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur.value - 1) }
  else if (e.key === 'Home') go(0)
  else if (e.key === 'End') go(total - 1)
  else if (e.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  }
}
// navbar สูงไม่คงที่ (เมนู "เจ้าของห้อง" โผล่/ตัดบรรทัดตามจอ) — วัดของจริงมาคำนวณความสูงสไลด์
const navH = ref(68)
let navObserver
function measureNav() {
  navH.value = document.querySelector('.navbar')?.offsetHeight ?? 68
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  measureNav()
  const nav = document.querySelector('.navbar')
  if (nav && 'ResizeObserver' in window) {
    navObserver = new ResizeObserver(measureNav)
    navObserver.observe(nav)
  }
  window.addEventListener('resize', measureNav)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measureNav)
  navObserver?.disconnect()
})

const pct = computed(() => ((cur.value + 1) / total) * 100)
</script>

<template>
  <div class="deck" :style="{ '--nav-h': navH + 'px' }">
    <!-- 1 : ปก -->
    <section class="slide" :class="{ active: cur === 0, before: cur > 0 }">
      <div class="cup-bg">☕</div>
      <span class="kicker">วิชา Blockchain · Project Presentation</span>
      <h1 class="huge">CoWork Space<br /><span class="hl">จองห้องด้วย ETH</span></h1>
      <p class="lead">
        ระบบจองห้อง co-working รายชั่วโมง จ่ายด้วย ETH —
        หลังบ้านทั้งหมดคือ smart contract ตัวเดียวบน Sepolia testnet
      </p>
      <div class="chip-row">
        <span class="mono">🌐 202.151.182.123</span>
        <span class="mono">📜 0x31EC…6610</span>
        <span class="mono">Solidity 0.8.24 · Vue 3 + wagmi</span>
      </div>
    </section>

    <!-- 2 : เดโม -->
    <section class="slide" :class="{ active: cur === 1, before: cur > 1 }">
      <span class="kicker">Demo</span>
      <h1>🎬 ทบทวนจากเดโม</h1>
      <div class="grid c2">
        <div class="panel">
          <h3>สิ่งที่เดโมไป</h3>
          <ol class="steps">
            <li>ต่อกระเป๋า MetaMask</li>
            <li>เลือกห้อง ดูตารางว่างรายชั่วโมง</li>
            <li>จองและจ่าย ETH</li>
            <li>ดูรายการใน "การจองของฉัน" และยกเลิก</li>
            <li>มุมมองเจ้าของห้องในหน้า "เจ้าของห้อง"</li>
          </ol>
        </div>
        <div class="panel soft">
          <h3>จุดที่น่าสังเกต</h3>
          <ul class="marks">
            <li>ทุกครั้งที่จองหรือยกเลิก MetaMask ขอลายเซ็น — เพราะเป็นการเขียนลง blockchain จริง</li>
            <li>ตารางห้องว่างดูได้โดยไม่ต้อง login และไม่เสีย gas — เป็นการอ่านจาก contract ตรง ๆ</li>
            <li>ระบบนี้ไม่มี server หรือ database ของตัวเองเลย</li>
          </ul>
          <p style="margin-top: 8px">→ ที่เหลือของการนำเสนอ คือเบื้องหลังว่า contract ทำงานยังไง</p>
        </div>
      </div>
    </section>

    <!-- 3 : โครงสร้างระบบ -->
    <section class="slide" :class="{ active: cur === 2, before: cur > 2 }">
      <span class="kicker">โครงสร้างระบบ</span>
      <h1>ใครใช้อะไรบน contract ได้บ้าง</h1>
      <div class="arch">
        <div class="node">
          <div class="ic">🖥️</div>
          <h3>เว็บ (Vue 3)</h3>
          <p>แสดงผล + เตรียม transaction</p>
        </div>
        <div class="link">⇄</div>
        <div class="node">
          <div class="ic">🦊</div>
          <h3>MetaMask</h3>
          <p>เซ็นและส่ง transaction</p>
        </div>
        <div class="link">⇄</div>
        <div class="node hot">
          <div class="ic">📜</div>
          <h3>CoworkBooking.sol</h3>
          <p>กติกาและเงินทั้งหมดอยู่ที่นี่</p>
        </div>
      </div>
      <div class="grid c3">
        <div class="panel">
          <h3>👤 ลูกค้า</h3>
          <p><span class="mono sm">bookRoom</span> <span class="mono sm">cancelBooking</span></p>
        </div>
        <div class="panel">
          <h3>🔑 เจ้าของร้าน</h3>
          <p><span class="mono sm">updateRoom</span> (เปิด/ปิดห้อง) <span class="mono sm">withdraw</span></p>
        </div>
        <div class="panel">
          <h3>👀 ใครก็ได้ (อ่านฟรี)</h3>
          <p><span class="mono sm">getRooms</span> <span class="mono sm">getSlots</span> <span class="mono sm">getUserBookings</span></p>
        </div>
      </div>
    </section>

    <!-- 4 : กติกาทั้งหมด -->
    <section class="slide" :class="{ active: cur === 3, before: cur > 3 }">
      <span class="kicker">กติกาของสัญญา</span>
      <h1>กติกาหลักของสัญญา ประกาศไว้<span class="hl">ตายตัว</span></h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">CoworkBooking.sol — ส่วนหัวของสัญญา</div>
          <pre><span class="ty">uint256</span> <span class="kw">constant</span> SLOT          = <span class="num">1 hours</span>;
<span class="ty">uint256</span> <span class="kw">constant</span> MAX_HOURS     = <span class="num">12</span>;
<span class="ty">uint256</span> <span class="kw">constant</span> MAX_ADVANCE   = <span class="num">3 days</span>;
<span class="ty">uint256</span> <span class="kw">constant</span> CANCEL_WINDOW = <span class="num">2 hours</span>;</pre>
        </div>
        <div class="panel soft">
          <h3>แต่ละค่าหมายความว่าอะไร</h3>
          <ul class="marks">
            <li><b>SLOT = 1 ชั่วโมง</b> — จองเป็นรายชั่วโมง ทุกการจองอยู่บนตารางเดียวกัน</li>
            <li><b>MAX_HOURS = 12</b> — จองได้ครั้งละไม่เกิน 12 ชั่วโมง กันคนเดียวเหมาห้องทั้งวัน</li>
            <li><b>MAX_ADVANCE = 3 วัน</b> — จองล่วงหน้าได้ไม่เกิน 3 วัน กันการจองกั๊กที่ไว้นาน ๆ</li>
            <li><b>CANCEL_WINDOW = 2 ชั่วโมง</b> — ยกเลิกก่อนเวลาเริ่มอย่างน้อย 2 ชั่วโมง ได้เงินคืนเต็ม ช้ากว่านั้นไม่ได้คืน</li>
          </ul>
        </div>
      </div>
      <div class="grid c1">
        <div class="panel">
          <p>
            <b>ทำไมต้องประกาศเป็น <span class="mono sm">constant</span>:</b>
            ค่าพวกนี้ฝังอยู่ในโค้ดตั้งแต่วันติดตั้งสัญญา และไม่มีฟังก์ชันไหนแก้ได้
            แม้แต่เจ้าของร้านเอง — กติกาที่ลูกค้าเห็นตอนจอง จึงเป็นกติกาเดียวกับที่ใช้จริงตลอดไป
          </p>
        </div>
      </div>
    </section>

    <!-- 5 : โครงสร้างข้อมูล -->
    <section class="slide" :class="{ active: cur === 4, before: cur > 4 }">
      <span class="kicker">โครงสร้างข้อมูล</span>
      <h1>สัญญาเก็บข้อมูล<span class="hl">อะไรบ้าง</span></h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">state หลัก 3 ตัว</div>
          <pre><span class="ty">Room</span>[] rooms;       <span class="cmt">// ห้อง: name, pricePerHour,</span>
                    <span class="cmt">//       units, active</span>
<span class="ty">Booking</span>[] bookings; <span class="cmt">// ใบจอง: user, start, end,</span>
                    <span class="cmt">//        totalPrice, cancelled</span>

<span class="cmt">// ตัวนับต่อชั่วโมง — ใช้กันจองซ้อน</span>
<span class="kw">mapping</span>(roomId => <span class="kw">mapping</span>(ชั่วโมง => จำนวนจอง)) slotBooked;</pre>
        </div>
        <div class="panel soft">
          <h3><span class="mono sm">units</span> — แต่ละห้องรับจองได้กี่ที่ต่อชั่วโมง</h3>
          <p>ห้องประชุม/ออฟฟิศ: units = 1 → ใครจองก่อนได้ทั้งห้อง<br />
          โซน Hot desk: units = จำนวนที่นั่ง (เช่น 8) → ชั่วโมงเดียวกันจองพร้อมกันได้ 8 คน</p>
          <p style="margin-top: 8px"><b>ข้อดี:</b> ห้องทุกแบบใช้กติกาเดียวกัน — ตราบใดที่ยังจองไม่ครบ units ก็จองได้</p>
        </div>
      </div>
      <div class="slotrow">
        <div class="sc free"><i>09:00</i><b>0</b><span>ว่าง 8</span></div>
        <div class="sc some"><i>10:00</i><b>3</b><span>ว่าง 5</span></div>
        <div class="sc some"><i>11:00</i><b>6</b><span>ว่าง 2</span></div>
        <div class="sc full"><i>12:00</i><b>8</b><span>เต็ม</span></div>
        <div class="sc some"><i>13:00</i><b>2</b><span>ว่าง 6</span></div>
        <div class="sc free"><i>14:00</i><b>0</b><span>ว่าง 8</span></div>
      </div>
      <p class="muted" style="margin-top: 8px">
        <b>เหตุผลที่นับเป็นรายชั่วโมง:</b> อยากรู้ว่าชั่วโมงไหนว่างหรือเต็ม อ่านตัวเลขตัวเดียวก็รู้ —
        ไม่ต้องไล่เทียบเวลากับใบจองทุกใบ ค่า gas จึงถูกและคงที่
      </p>
    </section>

    <!-- 6 : bookRoom -->
    <section class="slide" :class="{ active: cur === 5, before: cur > 5 }">
      <span class="kicker">ฟังก์ชันหลัก 1/4</span>
      <h1><span class="mono lg">bookRoom()</span> — เงื่อนไขการจอง</h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">ต้องผ่านครบทุกข้อถึงจะรับเงิน — ผิดข้อเดียวถูกตีกลับทั้งรายการ</div>
          <pre><span class="kw">require</span>(r.active);
<span class="kw">require</span>(numHours >= <span class="num">1</span> && numHours <= MAX_HOURS);
<span class="kw">require</span>(startTime % SLOT == <span class="num">0</span>);
<span class="kw">require</span>(startTime >= <span class="kw">block.timestamp</span>);
<span class="kw">require</span>(startTime <= <span class="kw">block.timestamp</span> + MAX_ADVANCE);
<span class="mark"><span class="kw">require</span>(<span class="kw">msg.value</span> == pricePerHour * numHours);</span>
<span class="kw">for</span> (ทุกชั่วโมงที่จอง) {
<span class="mark">    <span class="kw">require</span>(slotBooked[roomId][t] < r.units);</span>    slotBooked[roomId][t] += <span class="num">1</span>;
}</pre>
        </div>
        <div class="panel soft">
          <h3>เช็คอะไรบ้าง (เรียงตามโค้ดซ้ายมือ)</h3>
          <ul class="marks tight">
            <li><b>ห้องต้องเปิดอยู่</b> — ห้องที่แอดมินปิดไว้ จองไม่ได้</li>
            <li><b>จองได้ครั้งละ 1–12 ชั่วโมง</b> — กันคนเดียวเหมาห้องยาวทั้งวัน</li>
            <li><b>เวลาเริ่มต้องตรงชั่วโมงพอดี</b> — 13:00 ได้ / 13:30 ไม่ได้ ทุกการจองจะได้อยู่บนตารางชั่วโมงเดียวกัน</li>
            <li><b>จองย้อนหลังไม่ได้ และล่วงหน้าได้ไม่เกิน 3 วัน</b> — กันการจองกั๊กที่ไว้นาน ๆ</li>
            <li><b>เงินที่โอนมาต้องเท่าราคาพอดี</b> — ขาดหรือเกินระบบไม่รับ จะได้ไม่มีเงินใครค้างอยู่ในระบบ</li>
            <li><b>ชั่วโมงที่เลือกต้องยังมีที่ว่าง</b> — ไล่เช็คทีละชั่วโมง ถ้ามีชั่วโมงไหนเต็มแล้ว จองไม่ได้</li>
          </ul>
          <p style="margin-top: 8px">
            <b>ผิดข้อใดข้อหนึ่ง → ระบบยกเลิกทั้งรายการทันที เงินไม่ถูกหักแม้แต่บาทเดียว</b>
            จึงไม่มีทางเกิดกรณี "จองติดแต่ยังไม่ได้จ่าย"
          </p>
        </div>
      </div>
    </section>

    <!-- 7 : cancelBooking -->
    <section class="slide" :class="{ active: cur === 6, before: cur > 6 }">
      <span class="kicker">ฟังก์ชันหลัก 2/4</span>
      <h1><span class="mono lg">cancelBooking()</span> — เงื่อนไขการยกเลิก</h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">cancelBooking(bookingId)</div>
          <pre><span class="kw">require</span>(b.user == <span class="kw">msg.sender</span>);
<span class="kw">require</span>(!b.cancelled);
<span class="kw">require</span>(<span class="kw">block.timestamp</span> < b.startTime);

b.cancelled = <span class="kw">true</span>;         <span class="cmt">// บันทึกก่อนโอน</span>
คืนสิทธิ์ให้ slotBooked ทุกชั่วโมง;

<span class="mark"><span class="kw">if</span> (<span class="kw">block.timestamp</span> + CANCEL_WINDOW <= b.startTime)</span>    คืนเงินเต็มจำนวน;
<span class="kw">else</span>
    ไม่คืน;</pre>
        </div>
        <div class="panel soft">
          <h3>กติกาการยกเลิก</h3>
          <ul class="marks tight">
            <li><b>ยกเลิกได้เฉพาะใบจองของตัวเอง</b> — คนอื่นมายกเลิกแทนไม่ได้</li>
            <li><b>ยกเลิกได้เฉพาะใบที่ยังไม่ถึงเวลาเริ่ม</b> — ใบที่เริ่มไปแล้วถือว่าใช้บริการแล้ว</li>
            <li><b>ยกเลิกก่อนเริ่มอย่างน้อย 2 ชั่วโมง → ได้เงินคืนเต็ม</b> — ร้านยังพอมีเวลาขายที่นั่งต่อ</li>
            <li><b>ยกเลิกกระชั้นกว่านั้น → ไม่ได้เงินคืน</b> — ที่นั่งถูกกันไว้จนขายต่อไม่ทันแล้ว</li>
            <li><b>ไม่ว่าจะได้เงินคืนหรือไม่ ที่นั่งกลับมาว่างเสมอ</b> — คนอื่นจองต่อได้ทันที</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 8 : withdraw -->
    <section class="slide" :class="{ active: cur === 7, before: cur > 7 }">
      <span class="kicker">ฟังก์ชันหลัก 3/4</span>
      <h1><span class="mono lg">withdraw()</span> — เงินก้อนเดียว แต่สถานะเปลี่ยนตามเวลา</h1>
      <p class="lead">เงินค่าจองทั้งหมดกองรวมอยู่ในสัญญาก้อนเดียว — แต่ตอนร้านกดถอน ระบบจะคิดก่อนว่าส่วนไหนอยู่ในสถานะถอนได้</p>
      <div class="moneybar">
        <div class="seg lock">
          <small>🔒 สถานะ: ยังถอนไม่ได้</small>
          <b>ส่วนของใบจองที่ "ยังไม่ถึงเวลาเริ่ม"</b>
        </div>
        <div class="seg open">
          <small>✅ สถานะ: ถอนได้</small>
          <b>ส่วนของใบจองที่ "เริ่มใช้บริการไปแล้ว"</b>
        </div>
      </div>
      <div class="grid c2">
        <div class="panel soft">
          <h3>กติกา</h3>
          <ul class="marks tight">
            <li><b>ใบจองที่ยังไม่เริ่ม → ส่วนนั้นยังถอนไม่ได้</b> เพราะลูกค้ายังมีสิทธิ์ยกเลิกแล้วขอเงินคืน สัญญาต้องกันเงินส่วนนี้ไว้ให้ครบ</li>
            <li><b>พอถึงเวลาเริ่มของใบจอง → ส่วนนั้นเปลี่ยนสถานะเป็นถอนได้เอง</b> ไม่ต้องมีใครกดอะไร เพราะทุกครั้งที่กดถอน ระบบคำนวณใหม่จากเวลาปัจจุบัน</li>
          </ul>
          <p style="margin-top: 8px"><b>ตัวอย่าง:</b> ในสัญญามี 10 ETH — เป็นของใบจองที่ยังไม่เริ่ม 6 ETH → ร้านกดถอนได้แค่ 4 ETH</p>
        </div>
        <div class="panel">
          <h3>เหตุผลที่ออกแบบแบบนี้</h3>
          <p>
            ถ้าปล่อยให้ร้านถอนได้ทั้งหมด ร้านอาจเอาเงินไปใช้ก่อน
            แล้วพอลูกค้ายกเลิก ก็ไม่มีเงินเหลือคืน
          </p>
          <p style="margin-top: 8px">
            กติกานี้การันตีว่า <b>เงินที่อาจต้องคืนลูกค้า มีอยู่ในสัญญาครบเสมอ</b>
            — และเป็นโค้ดบังคับ ไม่ใช่คำสัญญาของร้าน
          </p>
        </div>
      </div>
    </section>

    <!-- 9 : ปิดห้อง -->
    <section class="slide" :class="{ active: cur === 8, before: cur > 8 }">
      <span class="kicker">ฟังก์ชันหลัก 4/4</span>
      <h1><span class="mono lg">updateRoom()</span> — ปิดห้องต้องคืนเงิน</h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">ตอนแอดมินสั่งปิดห้อง (active = false)</div>
          <pre><span class="kw">if</span> (เดิมเปิด → สั่งปิด) {
    <span class="kw">for</span> (ทุกใบจองของห้องที่ยังไม่เริ่ม) {
        ยกเลิกใบจอง + คืน slot;
<span class="mark">        โอนคืนเต็มจำนวน — พลาดใบเดียว revert หมด;</span>    }
}</pre>
        </div>
        <div class="panel soft">
          <h3>กติกา</h3>
          <ul class="marks tight">
            <li><b>สั่งปิดห้องเมื่อไหร่ ระบบคืนเงินให้ทุกใบจองล่วงหน้าทันที</b> — สองอย่างนี้เกิดในรายการเดียวกัน แยกจากกันไม่ได้</li>
            <li><b>ถ้าคืนเงินใครสักคนไม่สำเร็จ ห้องจะไม่ถูกปิด</b> — เพราะฉะนั้น "ปิดห้องแล้วยึดเงินลูกค้า" จึงทำไม่ได้เลย</li>
            <li><b>ใบจองที่เริ่มไปแล้วไม่ถูกแตะ</b> — ถือว่าลูกค้าได้ใช้บริการแล้ว</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 10 : การป้องกัน -->
    <section class="slide" :class="{ active: cur === 9, before: cur > 9 }">
      <span class="kicker">ความปลอดภัย</span>
      <h1>ระบบป้องกันในสัญญา</h1>
      <div class="grid c3">
        <div class="panel">
          <h3>🔑 กันคนนอกสั่งงานแทนร้าน</h3>
          <p>
            ฟังก์ชันของร้าน (ปิดห้อง, ถอนเงิน) เช็คทุกครั้งว่า
            <b>คนที่กดคือเจ้าของร้านตัวจริงหรือเปล่า</b> — ถ้าไม่ใช่ ปฏิเสธทันที
          </p>
          <p style="margin-top: 6px" class="muted">ในโค้ด: <span class="mono sm">onlyOwner</span></p>
        </div>
        <div class="panel">
          <h3>🔒 กันถอนเงินซ้ำ</h3>
          <p>
            มีช่องโหว่ที่เจอบ่อยในสัญญาทั่วไป: ระหว่างที่สัญญากำลังโอนเงินคืน
            ผู้รับสามารถ<b>แทรกเข้ามาขอเงินซ้ำอีกรอบ</b>ก่อนรายการแรกจะเสร็จ
          </p>
          <p style="margin-top: 6px">
            เราใส่ตัวล็อกไว้: ถ้ายังทำรายการเดิมไม่เสร็จ ห้ามเริ่มรายการใหม่
          </p>
          <p style="margin-top: 6px" class="muted">ในโค้ด: <span class="mono sm">nonReentrant</span></p>
        </div>
        <div class="panel">
          <h3>📝 จดสถานะก่อนโอนเงิน</h3>
          <p>
            ตอนยกเลิก ระบบ<b>จดว่า "ใบนี้ยกเลิกแล้ว" ก่อน แล้วค่อยโอนเงินคืน</b>
          </p>
          <p style="margin-top: 6px">
            ใครพยายามยกเลิกใบเดิมซ้ำเพื่อเอาเงินคืนสองรอบ
            จะเจอว่าใบถูกยกเลิกไปแล้ว — ปฏิเสธตั้งแต่ด่านแรก
          </p>
        </div>
      </div>
    </section>

    <!-- 11 : events -->
    <section class="slide" :class="{ active: cur === 10, before: cur > 10 }">
      <span class="kicker">ความโปร่งใส</span>
      <h1>ทุกรายการมี event — ตรวจย้อนหลังได้</h1>
      <div class="grid c2">
        <div class="code">
          <div class="bar">events ในสัญญา</div>
          <pre><span class="kw">event</span> <span class="fn">RoomBooked</span>(bookingId, roomId, user,
                 startTime, endTime, totalPrice);
<span class="kw">event</span> <span class="fn">BookingCancelled</span>(bookingId, user, refund);
<span class="kw">event</span> <span class="fn">Withdrawn</span>(to, amount);
<span class="kw">event</span> <span class="fn">RoomAdded</span> / <span class="fn">RoomUpdated</span>(roomId);</pre>
        </div>
        <div class="panel soft">
          <h3>เอาไว้ทำอะไร</h3>
          <ul class="marks tight">
            <li>เป็นบันทึกถาวรบน blockchain — ลบหรือแก้ไม่ได้</li>
            <li>หน้าเว็บใช้อ่านความเคลื่อนไหวล่าสุด แทนการมี database ของตัวเอง</li>
            <li>คนนอกเปิดดูได้ว่าใครจอง ใครยกเลิก ร้านถอนเงินไปเท่าไร</li>
          </ul>
          <p class="mono sm" style="margin-top: 10px; word-break: break-all">
            sepolia.etherscan.io/address/0x31ECD71970E8a8366cbcd0B51024d6cde6466610
          </p>
        </div>
      </div>
    </section>

    <!-- 12 : สรุป -->
    <section class="slide" :class="{ active: cur === 11, before: cur > 11 }">
      <span class="kicker">สรุป · Q&A</span>
      <h1>สรุป</h1>
      <div class="grid c2">
        <div class="panel soft">
          <h3>กติกาทั้งหมดถูกบังคับด้วยโค้ด</h3>
          <ul class="marks">
            <li>เงื่อนไขจอง ยกเลิก ถอนเงิน เช็คกันใน contract ไม่ใช่ที่หน้าเว็บ</li>
            <li>ค่าสำคัญเป็น constant — ไม่มีใครแก้ทีหลังได้</li>
            <li>เงินค่าจองอยู่ในสัญญา ร้านถอนได้เฉพาะส่วนที่ให้บริการไปแล้ว</li>
            <li>ปิดห้องเมื่อไหร่ ต้องคืนเงินลูกค้าในรายการเดียวกันเสมอ</li>
          </ul>
        </div>
        <div class="panel">
          <h3>ข้อจำกัดของระบบ</h3>
          <ul class="marks">
            <li>บางฟังก์ชันไล่อ่านใบจองทุกใบ — พอไหวกับงานเดโม แต่ระบบใหญ่จริงต้องออกแบบใหม่</li>
            <li>ราคาเป็น ETH ซึ่งผันผวน — งานจริงควรใช้เหรียญที่มูลค่าคงที่ (stablecoin)</li>
            <li>เงินคืนมีแค่สองแบบคือคืนเต็มกับไม่คืน — ยังไม่มีแบบคืนบางส่วน</li>
          </ul>
        </div>
      </div>
      <p class="lead center" style="margin-top: 26px">ขอบคุณครับ ☕ — <b class="hl">Q&A</b></p>
    </section>

    <!-- controls -->
    <div class="progress"><div class="fill" :style="{ width: pct + '%' }"></div></div>
    <div class="hud">
      <button class="btn secondary small" :disabled="cur === 0" @click="go(cur - 1)">‹</button>
      <span class="counter">{{ cur + 1 }} / {{ total }}</span>
      <button class="btn small" :disabled="cur === total - 1" @click="go(cur + 1)">›</button>
    </div>
    <div class="hint muted">← → เปลี่ยนสไลด์ · F เต็มจอ</div>
  </div>
</template>

<style scoped>
.deck {
  position: relative;
  height: calc(100vh - var(--nav-h, 68px));
  overflow: hidden;
}

/* ---------- กลไกสไลด์ ---------- */
.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: clamp(20px, 4vh, 48px) clamp(24px, 6vw, 96px) clamp(64px, 9vh, 90px);
  opacity: 0; visibility: hidden; transform: translateX(46px);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 0.9, 0.3, 1), visibility 0.4s;
}
.slide.active { opacity: 1; visibility: visible; transform: none; z-index: 2; }
.slide.before { transform: translateX(-46px); }

.slide > * { opacity: 0; transform: translateY(12px); transition: opacity 0.45s ease, transform 0.45s ease; }
.slide.active > * { opacity: 1; transform: none; }
.slide.active > *:nth-child(2) { transition-delay: 0.08s; }
.slide.active > *:nth-child(3) { transition-delay: 0.16s; }
.slide.active > *:nth-child(4) { transition-delay: 0.24s; }
.slide.active > *:nth-child(5) { transition-delay: 0.32s; }
.slide .cup-bg, .slide.active > .cup-bg {
  position: absolute; right: -6vw; top: 50%; transform: translateY(-50%);
  font-size: clamp(260px, 40vw, 560px); opacity: 0.06; line-height: 1;
  pointer-events: none; user-select: none; transition: none;
}

/* ---------- ตัวหนังสือ ---------- */
.kicker {
  display: inline-flex; align-self: flex-start; align-items: center;
  font-family: 'Mitr', sans-serif; font-size: clamp(12px, 1.2vw, 14px); font-weight: 500;
  color: var(--brand-deep); background: var(--cream);
  border: 1.5px dashed var(--brand); border-radius: 999px;
  padding: 4px 16px; margin-bottom: 16px;
}
h1 { font-size: clamp(24px, 3.4vw, 42px); font-weight: 700; line-height: 1.3; margin-bottom: 10px; }
h1.huge { font-size: clamp(38px, 5.5vw, 68px); }
.hl { color: var(--brand-deep); position: relative; }
h1 .hl::after {
  content: ''; position: absolute; left: -2px; right: -2px; bottom: 4px;
  height: 0.28em; background: var(--pink); opacity: 0.45; z-index: -1;
  border-radius: 4px; transform: rotate(-1deg);
}
.lead { font-size: clamp(15px, 1.6vw, 19px); color: var(--ink); max-width: 70ch; }
.lead.center { text-align: center; max-width: none; }
.chip-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
.mono.sm { font-size: 12px; }
.mono.lg { font-size: 0.85em; padding: 4px 16px; }

/* ---------- layout ---------- */
.grid { display: grid; gap: clamp(12px, 1.8vw, 22px); margin-top: clamp(14px, 2.5vh, 24px); }
.grid.c1 { grid-template-columns: 1fr; }
.grid.c2 { grid-template-columns: 1fr 1fr; }
.grid.c3 { grid-template-columns: 1fr 1fr 1fr; }
.panel {
  background: var(--card); border: 2px solid var(--line); border-radius: var(--radius);
  padding: clamp(14px, 1.8vw, 22px); box-shadow: var(--shadow-soft);
}
.panel.soft { background: var(--cream); border-color: var(--brand); border-style: dashed; }
.panel h3 { font-size: clamp(15px, 1.5vw, 18px); margin-bottom: 8px; }
.panel p, .panel li { font-size: clamp(13px, 1.3vw, 15.5px); line-height: 1.65; }
.steps { padding-left: 22px; }
.steps li { margin-bottom: 6px; font-size: clamp(13px, 1.35vw, 16px); }
.marks { list-style: none; padding: 0; }
.marks li { padding-left: 20px; position: relative; margin-bottom: 8px; }
.marks li::before { content: '▸'; position: absolute; left: 2px; color: var(--brand-dark); }
.marks.tight li { margin-bottom: 5px; font-size: clamp(12.5px, 1.25vw, 15px); }

/* ---------- code ---------- */
.code {
  background: #3a2d23; border-radius: 18px; overflow-x: auto; flex-shrink: 0;
  border: 2px solid #57453a; box-shadow: var(--shadow-soft);
  font-family: ui-monospace, 'SF Mono', 'IBM Plex Mono', monospace;
  font-size: clamp(11.5px, 1.2vw, 14.5px); line-height: 1.75; color: #f6ead9;
}
.code.slim { margin-top: 6px; }
.code .bar {
  padding: 8px 16px; border-bottom: 1.5px dashed #57453a;
  font-family: 'Mitr', sans-serif; font-size: 12px; color: #c9b39d;
}
.code pre { padding: 12px 18px 16px; white-space: pre; margin: 0; }
.code .mark { display: block; background: rgb(255 159 90 / 0.14); border-left: 3px solid var(--brand); margin: 0 -18px; padding: 0 18px 0 15px; }
.kw { color: #ffab63; } .ty { color: #7fd4c0; } .fn { color: #ffd9a0; }
.str { color: #ffb8c8; } .num { color: #9cc8f5; } .cmt { color: #a58f7c; font-style: italic; }

/* ---------- diagrams ---------- */
.arch { display: flex; align-items: stretch; gap: 10px; margin-top: 18px; }
.arch .node {
  flex: 1; background: var(--card); border: 2px solid var(--line); border-radius: var(--radius);
  padding: 16px 14px; text-align: center; box-shadow: var(--shadow-soft);
}
.arch .node.hot { border-color: var(--brand); background: var(--cream); border-style: dashed; }
.arch .node .ic { font-size: 28px; }
.arch .node h3 { font-size: clamp(14px, 1.4vw, 17px); margin: 4px 0 2px; }
.arch .node p { font-size: clamp(12px, 1.2vw, 14px); color: var(--muted); }
.arch .link { align-self: center; color: var(--brand-dark); font-size: 22px; font-weight: 700; }

.slotrow { display: flex; gap: 10px; margin-top: 14px; }
.sc {
  flex: 1; text-align: center; border-radius: 16px; padding: 10px 4px;
  background: var(--card); border: 2px solid var(--line); box-shadow: 0 2px 0 var(--line);
}
.sc i { font-style: normal; font-size: 11.5px; color: var(--muted); font-family: 'Mitr', sans-serif; }
.sc b { display: block; font-size: clamp(18px, 2vw, 24px); font-family: 'Mitr', sans-serif; }
.sc span { font-size: 11.5px; font-weight: 600; }
.sc.free b, .sc.free span { color: var(--accent); }
.sc.some b, .sc.some span { color: var(--brand-dark); }
.sc.full { border-color: var(--danger); background: var(--pink-soft); box-shadow: 0 2px 0 var(--danger); }
.sc.full b, .sc.full span { color: var(--danger); }

.moneybar {
  display: flex; margin-top: 16px; border-radius: 18px; overflow: hidden;
  border: 2px solid var(--line); box-shadow: var(--shadow-soft);
}
.moneybar .seg { padding: 14px 18px; }
.moneybar .seg small { display: block; font-family: 'Mitr', sans-serif; font-weight: 600; font-size: 12px; margin-bottom: 2px; }
.moneybar .seg b { font-size: clamp(13px, 1.35vw, 15.5px); }
.moneybar .lock {
  flex: 1.2; color: var(--danger); border-right: 2px dashed var(--line);
  background: repeating-linear-gradient(-45deg, var(--pink-soft) 0 10px, #fff5f7 10px 20px);
}
.moneybar .open { flex: 1; background: var(--accent-soft); color: #2e8b78; }

/* ---------- controls ---------- */
.progress { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: var(--line); }
.progress .fill { height: 100%; background: linear-gradient(90deg, var(--brand), var(--brand-dark)); transition: width 0.35s ease; border-radius: 0 4px 4px 0; }
.hud {
  position: absolute; right: clamp(16px, 3vw, 36px); bottom: 16px; z-index: 5;
  display: flex; align-items: center; gap: 12px;
}
.counter { font-family: 'Mitr', sans-serif; font-weight: 600; color: var(--muted); font-size: 14px; }
.hint { position: absolute; left: clamp(16px, 3vw, 36px); bottom: 22px; font-size: 12px; }

@media (max-width: 900px) {
  .deck { height: auto; overflow: visible; }
  .slide { position: relative; inset: auto; opacity: 1; visibility: visible; transform: none; display: none; }
  .slide.active { display: flex; min-height: calc(100vh - var(--nav-h, 68px)); }
  .grid.c2, .grid.c3 { grid-template-columns: 1fr; }
  .arch { flex-direction: column; }
  .arch .link { transform: rotate(90deg); }
  .slotrow { flex-wrap: wrap; }
  .sc { min-width: 90px; }
  .hint { display: none; }
}
</style>
