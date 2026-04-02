"use client"; // Câu thần chú bắt buộc của Next.js App Router cho UI có tương tác

import { useState } from "react";
import { connectWallet } from "../lib/web3"; // Gọi bùa kết nối ví ra

export default function ConnectWallet() {
  const [address, setAddress] = useState("");

  const handleConnect = async () => {
    const data = await connectWallet();
    if (data && data.address) {
      setAddress(data.address);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      {address ? (
        // Nếu đã nối ví thành công, hiện địa chỉ rút gọn kiểu 0x123...ABCD
        <button className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-md cursor-default">
          ✅ Đã nối ví: {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      ) : (
        // Nếu chưa nối, hiện nút bấm chà bá kêu gọi khách
        <button 
          onClick={handleConnect}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all"
        >
          🦊 Kết Nối Ví MetaMask
        </button>
      )}
    </div>
  );
}