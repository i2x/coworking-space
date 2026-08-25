const hre = require("hardhat");

// ราคาใหม่ (ETH ต่อ ชม.) — ลดลง 1000 เท่าจากของเดิม ให้เล่นบน testnet ได้เยอะ ๆ
const NEW_PRICES = {
  "Hot Desk A1": "0.000001",
  "Hot Desk A2": "0.000001",
  "Hot Desk A3": "0.000001",
  "Meeting Room M1": "0.000004",
  "Meeting Room M2": "0.000005",
  "Private Office P1": "0.000002",
};

async function main() {
  const deployment = require("../../frontend/src/contracts/CoworkBooking.json");
  const [signer] = await hre.ethers.getSigners();
  console.log("Using signer:", signer.address);
  console.log("Contract:", deployment.address);

  const booking = await hre.ethers.getContractAt("CoworkBooking", deployment.address);
  const rooms = await booking.getRooms();

  for (const r of rooms) {
    const priceEth = NEW_PRICES[r.name];
    if (!priceEth) {
      console.log(`  skip: ${r.name} (ไม่มีราคาใหม่กำหนดไว้)`);
      continue;
    }
    const newPrice = hre.ethers.parseEther(priceEth);
    if (r.pricePerHour === newPrice) {
      console.log(`  skip: ${r.name} (ราคาเท่าเดิมอยู่แล้ว)`);
      continue;
    }
    const tx = await booking.updateRoom(
      r.id,
      r.name,
      r.roomType,
      r.capacity,
      r.units,
      newPrice,
      r.imageURI,
      r.active
    );
    await tx.wait();
    console.log(`  updated: ${r.name} → ${priceEth} ETH/hr`);
  }
  console.log("done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
