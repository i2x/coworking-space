import hotdeskImg from '../assets/rooms/hotdesk.jpg'
import hotdesk2Img from '../assets/rooms/hotdesk2.jpeg'
import hotdesk3Img from '../assets/rooms/hotdesk3.jpeg'
import meetingImg from '../assets/rooms/meeting.jpeg'
import meeting2Img from '../assets/rooms/meeting2.jpeg'
import officeImg from '../assets/rooms/office.jpeg'

// contract เก็บ imageURI เป็น key สั้น ๆ → map เป็นรูปจริงฝั่ง frontend
const IMAGES = {
  hotdesk: hotdeskImg,
  hotdesk2: hotdesk2Img,
  hotdesk3: hotdesk3Img,
  meeting: meetingImg,
  meeting2: meeting2Img,
  office: officeImg,
}

const TYPE_LABELS = {
  hotdesk: 'Hot Desk',
  meeting: 'Meeting Room',
  office: 'Private Office',
}

export function roomImage(imageURI) {
  return IMAGES[imageURI] ?? hotdeskImg
}

export function roomTypeLabel(roomType) {
  return TYPE_LABELS[roomType] ?? roomType
}
