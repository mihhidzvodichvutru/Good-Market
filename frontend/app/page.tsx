"use client"; // Bắt buộc phải có dòng này để dùng React Hooks và thao tác với trình duyệt

import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  // Biến lưu trữ địa chỉ ví của người dùng sau khi kết nối thành công
  const [walletAddress, setWalletAddress] = useState("");

  // Hàm xử lý khi người dùng bấm nút
  const connectWallet = async () => {
    // 1. Kiểm tra xem người dùng đã cài MetaMask chưa
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        // 2. Yêu cầu MetaMask mở popup đăng nhập
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });

        // 3. Lấy địa chỉ ví đầu tiên và lưu vào state
        setWalletAddress(accounts[0]);
        console.log("Kết nối thành công ví:", accounts[0]);
      } catch (error) {
        console.error("Người dùng từ chối kết nối hoặc có lỗi xảy ra:", error);
      }
    } else {
      // Nếu chưa cài tiện ích MetaMask
      alert("Bạn chưa cài đặt MetaMask. Vui lòng cài đặt để sử dụng chợ NFT!");
    }
  };

  // Hàm phụ: Rút gọn địa chỉ ví cho đẹp (ví dụ: 0x1234...abcd)
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white font-sans">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-blue-400 mb-6 drop-shadow-lg">
          BODOI Marketplace
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Nền tảng giao dịch nghệ thuật số phi tập trung
        </p>

        {/* Kiểm tra xem đã có ví chưa để hiển thị nút tương ứng */}
        {walletAddress === "" ? (
          <button
            onClick={connectWallet}
            className="rounded-full bg-blue-600 px-8 py-3 font-bold text-white transition-all hover:bg-blue-500 hover:scale-105 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          >
            🦊 Kết Nối Ví MetaMask
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-900/50 border border-green-500 px-6 py-2 text-green-400 font-mono">
              Đã kết nối: {formatAddress(walletAddress)}
            </div>
            <button 
              onClick={() => setWalletAddress("")}
              className="text-sm text-gray-500 hover:text-red-400 underline"
            >
              Ngắt kết nối
            </button>
          </div>
        )}
      </div>
    </div>
  );
}