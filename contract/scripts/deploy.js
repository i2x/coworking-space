const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// รายการห้อง: 6 ห้อง 3 แบบ
// units = จำนวนการจองพร้อมกันต่อ slot (hot desk = ที่นั่งในโซน, ห้องประชุม/ส่วนตัว = 1 จองทั้งห้อง)
const ROOMS = [
  { name: "Hot Desk A1", type: "hotdesk", capacity: 8, units: 8, priceEth: "0.001", image: "hotdesk" },   // โต๊ะยาวกลางห้อง
  { name: "Hot Desk A2", type: "hotdesk", capacity: 6, units: 6, priceEth: "0.001", image: "hotdesk2" },  // บาร์ริมหน้าต่าง
  { name: "Hot Desk A3", type: "hotdesk", capacity: 5, units: 5, priceEth: "0.001", image: "hotdesk3" },  // มุมโซฟา
  { name: "Meeting Room M1", type: "meeting", capacity: 4, units: 1, priceEth: "0.004", image: "meeting" },
  { name: "Meeting Room M2", type: "meeting", capacity: 6, units: 1, priceEth: "0.005", image: "meeting2" },
  { name: "Private Office P1", type: "office", capacity: 1, units: 1, priceEth: "0.002", image: "office" },
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Booking = await hre.ethers.getContractFactory("CoworkBooking");
  const booking = await Booking.deploy();
  await booking.waitForDeployment();
  const address = await booking.getAddress();
  console.log("CoworkBooking deployed to:", address);

  for (const r of ROOMS) {
    const tx = await booking.addRoom(
      r.name,
      r.type,
      r.capacity,
      r.units,
      hre.ethers.parseEther(r.priceEth),
      r.image
    );
    await tx.wait();
    console.log(`  added: ${r.name} (${r.priceEth} ETH/hr, ${r.units} unit/slot)`);
  }

  // เขียน address + ABI ให้ frontend ใช้ต่อทันที
  const artifact = await hre.artifacts.readArtifact("CoworkBooking");
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);
  const outDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "CoworkBooking.json"),
    JSON.stringify({ address, chainId, abi: artifact.abi }, null, 2)
  );
  console.log("ABI + address written to frontend/src/contracts/CoworkBooking.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
