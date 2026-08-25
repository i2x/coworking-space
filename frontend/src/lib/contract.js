import deployment from '../contracts/CoworkBooking.json'

export const contractAddress = deployment.address
export const contractAbi = deployment.abi
export const contractChainId = deployment.chainId

// ใช้ spread ในทุก useReadContract / writeContract
// ระบุ chainId เสมอ เพื่อให้อ่านถูก chain แม้ยังไม่ต่อ wallet
export const bookingContract = {
  address: contractAddress,
  abi: contractAbi,
  ...(contractChainId ? { chainId: contractChainId } : {}),
}
