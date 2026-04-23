// "use client"; // Câu thần chú bắt buộc của Next.js App Router cho UI có tương tác

// import { useState } from "react";
// import { connectWallet } from "../lib/web3"; // Gọi bùa kết nối ví ra

// export default function ConnectWallet() {
//   const [address, setAddress] = useState("");

//   const handleConnect = async () => {
//     const data = await connectWallet();
//     if (data && data.address) {
//       setAddress(data.address);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center p-4">
//       {address ? (
//         // Nếu đã nối ví thành công, hiện địa chỉ rút gọn kiểu 0x123...ABCD
//         <button className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-md cursor-default">
//           ✅ Đã nối ví: {address.slice(0, 6)}...{address.slice(-4)}
//         </button>
//       ) : (
//         // Nếu chưa nối, hiện nút bấm chà bá kêu gọi khách
//         <button 
//           onClick={handleConnect}
//           className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all"
//         >
//           🦊 Kết Nối Ví MetaMask
//         </button>
//       )}
//     </div>
//   );
// }
// components/ConnectWallet.tsx
"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { connectWallet } from "@/lib/web3"; // Import hàm từ file anh em mình vừa sửa

export default function ConnectWallet() {
  // Đại ca để kiểu là string | null thôi nhé
  const [account, setAccount] = useState<string | null>(null);

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setAccount(address); // Lưu thẳng cái address vào state
    }
  };

  // Hàm rút gọn địa chỉ cho đẹp (0x123...456)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
    >
      <Wallet size={20} />
      {/* CHỖ NÀY LÀ THEN CHỐT: 
          Đại ca dùng 'account' trực tiếp, KHÔNG dùng 'account.address' 
      */}
      {account ? formatAddress(account) : "Kết nối Ví"}
    </button>
  );
}