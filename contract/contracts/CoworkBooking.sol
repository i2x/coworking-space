// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CoworkBooking - ระบบจองห้อง Co-Working Space จ่ายด้วย ETH (สำหรับ testnet)
/// @notice จองเป็นช่วงชั่วโมง (slot ละ 1 ชม.)
///   - ห้องส่วนตัว/ห้องประชุม: units = 1 → จองแล้วได้ทั้งห้อง (exclusive)
///   - โซน hot desk: units = จำนวนที่นั่ง → หลายคนจอง slot เดียวกันพร้อมกันได้จนเต็ม
contract CoworkBooking {
    // ---------- Types ----------

    struct Room {
        uint256 id;
        string name; // เช่น "Hot Desk A1"
        string roomType; // เช่น "hotdesk" | "meeting" | "office"
        uint8 capacity; // ความจุคน (ไว้แสดงผล)
        uint16 units; // จำนวนการจองที่รับได้พร้อมกันต่อ slot (1 = จองทั้งห้อง)
        uint256 pricePerHour; // wei ต่อ 1 สิทธิ์ (hot desk = ต่อที่นั่ง)
        string imageURI; // key รูปฝั่ง frontend หรือ ipfs://
        bool active;
    }

    struct Booking {
        uint256 id;
        uint256 roomId;
        address user;
        uint256 startTime; // unix ts, ต้องหาร 1 ชม. ลงตัว
        uint256 endTime; // startTime + hours*1h
        uint256 totalPrice; // wei ที่จ่ายมา
        bool cancelled;
        bool cancelledByAdmin; // true = ร้านยกเลิก (ปิดห้อง) — คืนเงินเต็มแล้ว
    }

    // ---------- State ----------

    address public owner;
    uint256 public constant SLOT = 1 hours;
    uint256 public constant MAX_HOURS = 12;
    /// จองล่วงหน้าได้ไม่เกิน 3 วัน — กันคนกวนจองยาว ๆ ล็อก slot/ทำให้ loop คืนเงินบวม
    uint256 public constant MAX_ADVANCE = 3 days;
    /// ยกเลิกได้ฟรี (คืนเงินเต็ม) ถ้ายกเลิกก่อนเวลาเริ่มอย่างน้อยเท่านี้
    /// ตั้งใจเป็น constant: กติกาที่ลูกค้าเห็นตอนจอง = กติกาที่ได้จริงตลอดไป admin แก้ย้อนหลังไม่ได้
    uint256 public constant CANCEL_WINDOW = 2 hours;

    Room[] private rooms;
    Booking[] private bookings;

    /// roomId => slotTimestamp => จำนวนการจองใน slot นั้น (เต็มเมื่อ == units ของห้อง)
    mapping(uint256 => mapping(uint256 => uint256)) private slotBooked;

    bool private locked; // reentrancy guard

    // ---------- Events ----------

    event RoomAdded(uint256 indexed roomId, string name, uint256 pricePerHour);
    event RoomUpdated(uint256 indexed roomId);
    event RoomBooked(
        uint256 indexed bookingId,
        uint256 indexed roomId,
        address indexed user,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPrice
    );
    event BookingCancelled(uint256 indexed bookingId, address indexed user, uint256 refund);
    event Withdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ---------- Modifiers ----------

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "reentrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---------- Admin ----------

    function addRoom(
        string calldata name,
        string calldata roomType,
        uint8 capacity,
        uint16 units,
        uint256 pricePerHour,
        string calldata imageURI
    ) external onlyOwner returns (uint256 roomId) {
        require(units >= 1, "units >= 1");
        roomId = rooms.length + 1;
        rooms.push(
            Room({
                id: roomId,
                name: name,
                roomType: roomType,
                capacity: capacity,
                units: units,
                pricePerHour: pricePerHour,
                imageURI: imageURI,
                active: true
            })
        );
        emit RoomAdded(roomId, name, pricePerHour);
    }

    /// กติกาแฟร์: ปิดห้องเมื่อไหร่ การจองอนาคตทุกใบของห้องนั้น
    /// ถูกยกเลิกและคืนเงินเต็มทันทีใน transaction เดียวกัน
    function updateRoom(
        uint256 roomId,
        string calldata name,
        string calldata roomType,
        uint8 capacity,
        uint16 units,
        uint256 pricePerHour,
        string calldata imageURI,
        bool active
    ) external onlyOwner nonReentrant {
        require(units >= 1, "units >= 1");
        Room storage r = _room(roomId);
        bool closing = r.active && !active;
        r.name = name;
        r.roomType = roomType;
        r.capacity = capacity;
        r.units = units;
        r.pricePerHour = pricePerHour;
        r.imageURI = imageURI;
        r.active = active;
        if (closing) {
            _refundFutureBookings(roomId);
        }
        emit RoomUpdated(roomId);
    }

    /// ยกเลิก + คืนเงินเต็ม ทุกการจองของห้องที่ยังไม่ถึงเวลาเริ่ม
    /// (ใบที่เริ่มไปแล้ว/จบแล้ว ไม่แตะ — บริการเกิดขึ้นแล้ว)
    function _refundFutureBookings(uint256 roomId) internal {
        for (uint256 i = 0; i < bookings.length; i++) {
            Booking storage b = bookings[i];
            if (b.roomId == roomId && !b.cancelled && b.startTime > block.timestamp) {
                b.cancelled = true;
                b.cancelledByAdmin = true;
                for (uint256 t = b.startTime; t < b.endTime; t += SLOT) {
                    slotBooked[roomId][t] -= 1;
                }
                (bool ok, ) = b.user.call{value: b.totalPrice}("");
                require(ok, "refund failed");
                emit BookingCancelled(b.id, b.user, b.totalPrice);
            }
        }
    }

    /// โอนสิทธิ์ admin ให้ address ใหม่ (เผื่อย้ายกระเป๋า/กู้สถานการณ์ key เดิมไม่ปลอดภัย)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// ถอนได้เฉพาะส่วนที่ไม่ติดภาระคืนเงิน (การจองในอนาคตที่ยังยกเลิกได้)
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = withdrawableBalance();
        require(amount > 0, "nothing to withdraw");
        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdrawn(owner, amount);
    }

    // ---------- Booking ----------

    /// จอง 1 สิทธิ์ (hot desk = 1 ที่นั่ง / ห้อง units=1 = ทั้งห้อง)
    function bookRoom(
        uint256 roomId,
        uint256 startTime,
        uint256 numHours
    ) external payable nonReentrant returns (uint256 bookingId) {
        Room storage r = _room(roomId);
        require(r.active, "room inactive");
        require(numHours >= 1 && numHours <= MAX_HOURS, "1-12 hours");
        require(startTime % SLOT == 0, "start must align to hour");
        require(startTime >= block.timestamp, "start in past");
        require(startTime <= block.timestamp + MAX_ADVANCE, "too far ahead");

        uint256 price = r.pricePerHour * numHours;
        require(msg.value == price, "wrong payment");

        bookingId = bookings.length + 1;
        uint256 endTime = startTime + numHours * SLOT;

        // เช็คและนับสิทธิ์รายชั่วโมง — เต็มเมื่อครบ units ของห้อง
        for (uint256 t = startTime; t < endTime; t += SLOT) {
            require(slotBooked[roomId][t] < r.units, "slot full");
            slotBooked[roomId][t] += 1;
        }

        bookings.push(
            Booking({
                id: bookingId,
                roomId: roomId,
                user: msg.sender,
                startTime: startTime,
                endTime: endTime,
                totalPrice: price,
                cancelled: false,
                cancelledByAdmin: false
            })
        );

        emit RoomBooked(bookingId, roomId, msg.sender, startTime, endTime, price);
    }

    /// ยกเลิกก่อนเวลาเริ่ม: คืนเงินเต็มถ้ายกเลิกล่วงหน้า >= CANCEL_WINDOW, ไม่งั้นไม่คืน
    function cancelBooking(uint256 bookingId) external nonReentrant {
        Booking storage b = _booking(bookingId);
        require(b.user == msg.sender, "not your booking");
        require(!b.cancelled, "already cancelled");
        require(block.timestamp < b.startTime, "already started");

        b.cancelled = true;

        // คืนสิทธิ์ให้ slot
        for (uint256 t = b.startTime; t < b.endTime; t += SLOT) {
            slotBooked[b.roomId][t] -= 1;
        }

        uint256 refund = 0;
        if (block.timestamp + CANCEL_WINDOW <= b.startTime) {
            refund = b.totalPrice;
        }
        if (refund > 0) {
            (bool ok, ) = msg.sender.call{value: refund}("");
            require(ok, "refund failed");
        }
        emit BookingCancelled(bookingId, msg.sender, refund);
    }

    // ---------- Views ----------

    function getRooms() external view returns (Room[] memory) {
        return rooms;
    }

    function getRoom(uint256 roomId) external view returns (Room memory) {
        return _room(roomId);
    }

    function roomCount() external view returns (uint256) {
        return rooms.length;
    }

    function bookingCount() external view returns (uint256) {
        return bookings.length;
    }

    function getBooking(uint256 bookingId) external view returns (Booking memory) {
        return _booking(bookingId);
    }

    /// การจองทั้งหมด (สำหรับ admin dashboard — ปริมาณ demo ไม่เยอะ ดึงทีเดียวได้)
    function getAllBookings() external view returns (Booking[] memory) {
        return bookings;
    }

    /// การจองของ user คนเดียว (สำหรับหน้า My Bookings)
    function getUserBookings(address user) external view returns (Booking[] memory result) {
        uint256 n = 0;
        for (uint256 i = 0; i < bookings.length; i++) {
            if (bookings[i].user == user) n++;
        }
        result = new Booking[](n);
        uint256 j = 0;
        for (uint256 i = 0; i < bookings.length; i++) {
            if (bookings[i].user == user) {
                result[j] = bookings[i];
                j++;
            }
        }
    }

    /// จำนวนการจองของแต่ละ slot ต่อเนื่อง `count` ช่อง เริ่มที่ fromTime
    /// (frontend เอาไปเทียบกับ units ของห้อง → เหลือกี่ที่)
    function getSlots(
        uint256 roomId,
        uint256 fromTime,
        uint256 count
    ) external view returns (uint256[] memory result) {
        require(fromTime % SLOT == 0, "align to hour");
        require(count <= 168, "max 1 week"); // กัน query ใหญ่เกิน
        result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = slotBooked[roomId][fromTime + i * SLOT];
        }
    }

    /// ยังมีที่ว่างใน slot นี้ไหม
    function isSlotFree(uint256 roomId, uint256 slotTime) external view returns (bool) {
        return slotBooked[roomId][slotTime] < _room(roomId).units;
    }

    /// จำนวนที่ว่างที่เหลือใน slot
    function seatsLeft(uint256 roomId, uint256 slotTime) external view returns (uint256) {
        return _room(roomId).units - slotBooked[roomId][slotTime];
    }

    /// ยอดที่ owner ถอนได้ = balance - เงินสำรองของ "ทุกการจองที่ยังไม่เริ่ม"
    /// (เงินปลดล็อกให้ร้านเมื่อบริการเริ่มแล้วเท่านั้น → เงินคืนมีหนุนหลังเสมอ 100%)
    function withdrawableBalance() public view returns (uint256) {
        uint256 reserved = 0;
        for (uint256 i = 0; i < bookings.length; i++) {
            Booking storage b = bookings[i];
            if (!b.cancelled && b.startTime > block.timestamp) {
                reserved += b.totalPrice;
            }
        }
        uint256 bal = address(this).balance;
        return bal > reserved ? bal - reserved : 0;
    }

    // ---------- Internal ----------

    function _room(uint256 roomId) internal view returns (Room storage) {
        require(roomId >= 1 && roomId <= rooms.length, "no such room");
        return rooms[roomId - 1];
    }

    function _booking(uint256 bookingId) internal view returns (Booking storage) {
        require(bookingId >= 1 && bookingId <= bookings.length, "no such booking");
        return bookings[bookingId - 1];
    }
}
