const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const HOUR = 3600n;

describe("CoworkBooking", function () {
  let booking, owner, alice, bob, charlie;
  let price; // ราคา/ชม. ของโซน hot desk (ห้อง 1)
  let meetPrice; // ราคา/ชม. ห้องประชุม (ห้อง 2)

  // คืน timestamp ต้นชั่วโมงถัดไป +N ชั่วโมง
  async function futureSlot(hoursAhead = 24n) {
    const now = BigInt(await time.latest());
    return ((now / HOUR) + 1n + hoursAhead) * HOUR;
  }

  beforeEach(async () => {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CoworkBooking");
    booking = await F.deploy();
    price = ethers.parseEther("0.001");
    meetPrice = ethers.parseEther("0.003");
    // ห้อง 1: โซน hot desk รับพร้อมกัน 2 ที่นั่งต่อ slot
    await booking.addRoom("Hot Desk A1", "hotdesk", 2, 2, price, "hotdesk");
    // ห้อง 2: ห้องประชุม จองแล้วได้ทั้งห้อง (units = 1)
    await booking.addRoom("Meeting Room M1", "meeting", 4, 1, meetPrice, "meeting");
  });

  describe("rooms", () => {
    it("owner เพิ่มห้องได้ และอ่านรายการห้องได้", async () => {
      const rooms = await booking.getRooms();
      expect(rooms.length).to.equal(2);
      expect(rooms[0].name).to.equal("Hot Desk A1");
      expect(rooms[0].units).to.equal(2);
      expect(rooms[1].units).to.equal(1);
    });

    it("คนอื่นเพิ่มห้องไม่ได้", async () => {
      await expect(
        booking.connect(alice).addRoom("X", "hotdesk", 1, 1, price, "x")
      ).to.be.revertedWith("not owner");
    });
  });

  describe("bookRoom", () => {
    it("จองสำเร็จเมื่อจ่ายครบ และ slot นับสิทธิ์ถูก", async () => {
      const start = await futureSlot();
      await expect(
        booking.connect(alice).bookRoom(1, start, 2, { value: price * 2n })
      )
        .to.emit(booking, "RoomBooked")
        .withArgs(1, 1, alice.address, start, start + 2n * HOUR, price * 2n);

      // โซน 2 ที่นั่ง มีคนจอง 1 → ยังว่าง
      expect(await booking.isSlotFree(1, start)).to.equal(true);
      expect(await booking.seatsLeft(1, start)).to.equal(1);
    });

    it("hot desk: หลายคนจอง slot เดียวกันได้จนเต็ม แล้วคนถัดไป revert", async () => {
      const start = await futureSlot();
      await booking.connect(alice).bookRoom(1, start, 1, { value: price });
      await booking.connect(bob).bookRoom(1, start, 1, { value: price });
      expect(await booking.seatsLeft(1, start)).to.equal(0);
      await expect(
        booking.connect(charlie).bookRoom(1, start, 1, { value: price })
      ).to.be.revertedWith("slot full");
    });

    it("ห้องประชุม (units=1): จองแล้วได้ทั้งห้อง คนอื่นจองซ้อนไม่ได้", async () => {
      const start = await futureSlot();
      await booking.connect(alice).bookRoom(2, start, 2, { value: meetPrice * 2n });
      // bob จองคร่อมชั่วโมงที่สองของ alice
      await expect(
        booking.connect(bob).bookRoom(2, start + HOUR, 1, { value: meetPrice })
      ).to.be.revertedWith("slot full");
      // แต่ห้องอื่น slot เดียวกันจองได้
      await booking.connect(bob).bookRoom(1, start, 1, { value: price });
    });

    it("จ่ายไม่ตรงราคา ต้อง revert", async () => {
      const start = await futureSlot();
      await expect(
        booking.connect(alice).bookRoom(1, start, 2, { value: price })
      ).to.be.revertedWith("wrong payment");
    });

    it("จองล่วงหน้าเกิน 3 วัน ต้อง revert — ในขอบเขตจองได้ปกติ", async () => {
      const tooFar = await futureSlot(73n); // ~74 ชม. > 72 ชม.
      await expect(
        booking.connect(alice).bookRoom(1, tooFar, 1, { value: price })
      ).to.be.revertedWith("too far ahead");
      const okSlot = await futureSlot(70n); // ~71 ชม. < 72 ชม.
      await booking.connect(alice).bookRoom(1, okSlot, 1, { value: price });
    });

    it("เวลาไม่ตรงต้นชั่วโมง / ย้อนอดีต ต้อง revert", async () => {
      const start = await futureSlot();
      await expect(
        booking.connect(alice).bookRoom(1, start + 1n, 1, { value: price })
      ).to.be.revertedWith("start must align to hour");
      const past = ((BigInt(await time.latest()) / HOUR) - 5n) * HOUR;
      await expect(
        booking.connect(alice).bookRoom(1, past, 1, { value: price })
      ).to.be.revertedWith("start in past");
    });
  });

  describe("cancelBooking", () => {
    it("ยกเลิกล่วงหน้าพอ ได้เงินคืนเต็ม และคืนที่นั่งให้ slot", async () => {
      const start = await futureSlot(24n);
      await booking.connect(alice).bookRoom(1, start, 1, { value: price });
      await booking.connect(bob).bookRoom(1, start, 1, { value: price });
      expect(await booking.seatsLeft(1, start)).to.equal(0);

      await expect(
        booking.connect(alice).cancelBooking(1)
      ).to.changeEtherBalances([alice, booking], [price, -price]);

      // ที่นั่งของ alice ถูกคืน → charlie จองแทนได้
      expect(await booking.seatsLeft(1, start)).to.equal(1);
      await booking.connect(charlie).bookRoom(1, start, 1, { value: price });
    });

    it("ยกเลิกกระชั้นชิด (< cancelWindow) ไม่ได้เงินคืน แต่คืนที่นั่ง", async () => {
      const start = await futureSlot(24n);
      await booking.connect(alice).bookRoom(1, start, 1, { value: price });
      await time.increaseTo(start - HOUR); // เหลือ 1 ชม. < window 2 ชม.

      await expect(booking.connect(alice).cancelBooking(1)).to.changeEtherBalances(
        [alice, booking],
        [0n, 0n]
      );
      expect(await booking.seatsLeft(1, start)).to.equal(2);
    });

    it("คนอื่นยกเลิกแทนไม่ได้ / ยกเลิกหลังเริ่มไม่ได้", async () => {
      const start = await futureSlot(24n);
      await booking.connect(alice).bookRoom(1, start, 1, { value: price });
      await expect(booking.connect(bob).cancelBooking(1)).to.be.revertedWith(
        "not your booking"
      );
      await time.increaseTo(start + 1n);
      await expect(booking.connect(alice).cancelBooking(1)).to.be.revertedWith(
        "already started"
      );
    });
  });

  describe("withdraw", () => {
    it("เงินการจองที่ยังไม่เริ่ม ถอนไม่ได้เลย — ปลดล็อกเมื่อบริการเริ่มแล้ว", async () => {
      const start = await futureSlot(24n);
      await booking.connect(alice).bookRoom(1, start, 1, { value: price });

      expect(await booking.withdrawableBalance()).to.equal(0n);
      await expect(booking.withdraw()).to.be.revertedWith("nothing to withdraw");

      // พ้นช่วงยกเลิกของลูกค้าแล้ว แต่ยังไม่เริ่ม → ยังถอนไม่ได้ (กันเงินไว้เผื่อร้านปิดห้อง)
      await time.increaseTo(start - HOUR);
      expect(await booking.withdrawableBalance()).to.equal(0n);

      // เริ่มใช้งานแล้ว → ปลดล็อกให้ร้าน
      await time.increaseTo(start + 1n);
      expect(await booking.withdrawableBalance()).to.equal(price);
      await expect(booking.withdraw()).to.changeEtherBalances(
        [owner, booking],
        [price, -price]
      );
    });

    it("คนอื่นถอนไม่ได้", async () => {
      await expect(booking.connect(alice).withdraw()).to.be.revertedWith("not owner");
    });
  });

  describe("ปิดห้อง = คืนเงินการจองอนาคตอัตโนมัติ", () => {
    // helper: ปิดห้อง 1 (ค่าห้องคงเดิม เปลี่ยนแค่ active)
    async function closeRoom(id = 1) {
      const r = await booking.getRoom(id);
      return booking.updateRoom(id, r.name, r.roomType, r.capacity, r.units, r.pricePerHour, r.imageURI, false);
    }

    it("ปิดห้องแล้ว การจองอนาคตถูกยกเลิก+คืนเงินเต็มทันที แม้อยู่ในช่วงกระชั้นชิด", async () => {
      const start = await futureSlot(1n); // อีก ~1 ชม. (< cancelWindow — ลูกค้ายกเลิกเองจะไม่ได้เงินคืน)
      await booking.connect(alice).bookRoom(1, start, 2, { value: price * 2n });
      await booking.connect(bob).bookRoom(1, start, 1, { value: price });

      // แต่ร้านปิดห้อง → ทุกคนได้คืนเต็ม
      await expect(closeRoom()).to.changeEtherBalances(
        [alice, bob, booking],
        [price * 2n, price, -(price * 3n)]
      );

      const a = await booking.getBooking(1);
      expect(a.cancelled).to.equal(true);
      expect(a.cancelledByAdmin).to.equal(true);
      expect(await booking.getSlots(1, start, 2)).to.deep.equal([0n, 0n]);
    });

    it("การจองที่เริ่มไปแล้ว ไม่ถูกแตะและไม่คืนเงิน", async () => {
      const start = await futureSlot(2n);
      await booking.connect(alice).bookRoom(1, start, 2, { value: price * 2n });
      await time.increaseTo(start + 1n); // กำลังใช้งานอยู่

      await expect(closeRoom()).to.changeEtherBalances([alice, booking], [0n, 0n]);
      const b = await booking.getBooking(1);
      expect(b.cancelled).to.equal(false);
    });

    it("ปิดห้องหนึ่ง ไม่กระทบการจองของห้องอื่น", async () => {
      const start = await futureSlot(24n);
      await booking.connect(alice).bookRoom(2, start, 1, { value: meetPrice });
      await expect(closeRoom(1)).to.changeEtherBalances([alice], [0n]);
      expect((await booking.getBooking(1)).cancelled).to.equal(false);
    });

    it("คนอื่นปิดห้องไม่ได้", async () => {
      const r = await booking.getRoom(1);
      await expect(
        booking.connect(alice).updateRoom(1, r.name, r.roomType, r.capacity, r.units, r.pricePerHour, r.imageURI, false)
      ).to.be.revertedWith("not owner");
    });
  });

  describe("transferOwnership", () => {
    it("owner โอนสิทธิ์ได้ — คนใหม่เป็น admin, คนเก่าหมดสิทธิ์", async () => {
      await expect(booking.transferOwnership(alice.address))
        .to.emit(booking, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);
      expect(await booking.owner()).to.equal(alice.address);

      // คนใหม่ใช้สิทธิ์ admin ได้
      await booking.connect(alice).addRoom("X", "hotdesk", 1, 1, price, "x");
      // คนเก่าโดนปฏิเสธ
      await expect(
        booking.addRoom("Y", "hotdesk", 1, 1, price, "y")
      ).to.be.revertedWith("not owner");
    });

    it("คนอื่นโอนไม่ได้ / โอนไป address ศูนย์ไม่ได้", async () => {
      await expect(
        booking.connect(alice).transferOwnership(alice.address)
      ).to.be.revertedWith("not owner");
      await expect(
        booking.transferOwnership("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("zero address");
    });
  });

  describe("views", () => {
    it("getUserBookings คืนเฉพาะของ user นั้น และ getSlots นับจำนวนจองถูก", async () => {
      const start = await futureSlot();
      await booking.connect(alice).bookRoom(1, start, 2, { value: price * 2n });
      await booking.connect(bob).bookRoom(1, start, 1, { value: price });

      const aliceBookings = await booking.getUserBookings(alice.address);
      expect(aliceBookings.length).to.equal(1);
      expect(aliceBookings[0].roomId).to.equal(1);

      const slots = await booking.getSlots(1, start, 3);
      expect(slots[0]).to.equal(2); // alice + bob
      expect(slots[1]).to.equal(1); // alice คนเดียว (จอง 2 ชม.)
      expect(slots[2]).to.equal(0); // ว่าง
    });
  });
});
