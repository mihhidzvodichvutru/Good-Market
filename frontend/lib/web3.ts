import { ethers, Eip1193Provider } from "ethers";

// 1. Dạy cho TypeScript biết trình duyệt (Window) có cài ví MetaMask
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const connectWallet = async () => {
  // 2. Bây giờ gọi window.ethereum nó sẽ không chửi nữa
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Bắt MetaMask hiện lên
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log("Đã kết nối thành công ví của đại ca:", address);
      
      return { provider, signer, address };
    } catch (error) {
      console.error("Khách hủy kết nối hoặc có lỗi:", error);
      return null;
    }
  } else {
    alert("Đại ca ơi, khách chưa cài ví MetaMask!");
    return null;
  }
};