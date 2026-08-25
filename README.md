# ☕ CoWork Space — จองห้อง Co-Working ด้วย Smart Contract (Ethereum Testnet)

dApp จองห้อง co-working space จ่ายด้วย ETH ผ่าน MetaMask
จองเป็นรายชั่วโมง กันจองซ้อนด้วย smart contract — ตัวตนผู้จองคือ wallet address
แสดงเป็น avatar สัตว์น่ารัก ๆ (derive จาก address แบบ deterministic)

## โครงสร้าง

```
contract/   Hardhat + Solidity — CoworkBooking.sol, เทสต์, deploy script
frontend/   Vite + Vue 3 + @wagmi/vue + viem — หน้าลูกค้า + admin dashboard
```

**ห้อง 6 ห้อง 3 แบบ** (ใส่ให้อัตโนมัติตอน deploy) — สองโมเดลการจอง:

| ห้อง | โมเดล | ราคา/ชม. |
|---|---|---|
| Hot Desk A1 (โต๊ะยาว 8 ที่), A2 (บาร์ 6 ที่), A3 (โซฟา 5 ที่) | **โซนนั่งรวม** — จองเป็นรายที่นั่ง หลายคนจอง slot เดียวกันได้จนเต็ม | 0.001 /ที่นั่ง |
| Private Office P1 | จองแล้วได้ทั้งห้อง | 0.002 |
| Meeting Room M1 (4 คน), M2 (6 คน) | จองแล้วได้**ทั้งห้อง** | 0.004 / 0.005 |

(ใน contract: ฟิลด์ `units` ของห้อง = จำนวนการจองพร้อมกันต่อ slot — hot desk = จำนวนที่นั่ง, ห้องอื่น = 1)

## รันบนเครื่องตัวเอง (local demo)

ต้องมี Node.js 18+ และ MetaMask ในเบราว์เซอร์

```bash
# 1) ติดตั้ง (ครั้งแรกครั้งเดียว)
cd contract && npm install
cd ../frontend && npm install

# 2) เปิด local blockchain (ปล่อยรันทิ้งไว้)
cd contract && npm run node

# 3) deploy contract + 6 ห้อง (terminal ใหม่)
cd contract && npm run deploy:local
#    → เขียน address + ABI ให้ frontend อัตโนมัติ

# 4) เปิดเว็บ
cd frontend && npm run dev
#    → http://localhost:5173
```

**ตั้งค่า MetaMask สำหรับ local:**
1. เพิ่ม network: RPC `http://127.0.0.1:8545`, Chain ID `31337`, สกุลเงิน ETH
2. Import account จาก private key ที่ `npm run node` พิมพ์ออกมา
   - Account #0 = **owner/admin** (เห็นเมนู Admin)
   - Account #1, #2, ... = ลูกค้า (มี 10000 ETH ปลอมให้ทดลองจอง)

> ถ้า restart node ต้อง deploy ใหม่ และใน MetaMask ให้ Clear activity tab data
> (Settings → Advanced) เพราะ nonce จะไม่ตรง

## Deploy ขึ้น Sepolia testnet

```bash
cd contract
cp .env.example .env    # เติม SEPOLIA_RPC_URL (Alchemy/Infura) + PRIVATE_KEY
npm run deploy:sepolia
cd ../frontend && npm run dev
```

- ขอ test ETH: Google "Sepolia faucet" (Alchemy / Google Cloud faucet)
- verify contract (ไม่บังคับ): เติม `ETHERSCAN_API_KEY` ใน .env แล้ว
  `npx hardhat verify --network sepolia <address>`

## เทสต์ contract

```bash
cd contract && npm test    # 13 เทสต์: จอง/โซนนั่งรวม/จองซ้อน/ยกเลิก+คืนเงิน/ถอนเงิน/สิทธิ์
```

## ฟีเจอร์

**ลูกค้า** — ดูห้อง+รูป+ราคา, เลือกวัน, คลิกเลือกช่วงเวลา (ติดกันหลาย ชม.),
จ่าย ETH ผ่าน MetaMask, ดู/ยกเลิกการจองตัวเอง (ยกเลิกล่วงหน้า ≥2 ชม. คืนเงินเต็ม),
slot ที่ถูกจองโชว์ avatar ของคนจอง

**Admin** (wallet ที่ deploy = owner) — รายได้สะสม, จำนวนการจอง,
เปิด/ปิด/เพิ่มห้อง, ดูการจองทุกคน, ถอนรายได้
(ยอดถอนได้ = balance − เงินสำรองคืนของการจองที่ยังยกเลิกได้)

**ความปลอดภัยใน contract** — `onlyOwner` กันคนอื่นจัดการห้อง/ถอนเงิน,
reentrancy guard ตอนโอนเงิน, กันจองซ้อนด้วย mapping ราย slot,
เช็คจำนวนเงินตรงราคาเป๊ะ

## แก้/ปรับแต่ง

- รายการห้องเริ่มต้น: `contract/scripts/deploy.js`
- นโยบายยกเลิก (`cancelWindow`): เรียก `setCancelWindow` หรือแก้ค่าเริ่มต้นใน contract
- รูปห้อง: `frontend/src/assets/rooms/` (map ใน `frontend/src/lib/rooms.js`)
- sprite avatar: `frontend/src/assets/avatar-sprite.png` (grid 8×4 — ห้ามสลับตำแหน่งตัวที่มีอยู่)
