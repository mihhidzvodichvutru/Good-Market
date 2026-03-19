"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { Bell, ArrowRightLeft, LogOut, User, Wallet, ChevronDown, Settings } from "lucide-react";

// Import công cụ nhận diện đường dẫn hiện tại
import { usePathname } from "next/navigation"; 

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy đường dẫn hiện tại để kiểm tra Landing Page
  const pathname = usePathname();
  const isLandingPage = pathname === "/";   

  // 1. Dùng useEffect này để tự động kết nối lại ví khi người dùng F5 trang
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        // Nếu MetaMask báo là vẫn đang kết nối -> Tự động đổ dữ liệu vào Navbar
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const balanceWei = await provider.getBalance(accounts[0]);
          setBalance(parseFloat(ethers.formatEther(balanceWei)).toFixed(4));
        }
      }
    };
    checkConnection();
  }, []);

  // 2. Cái useEffect cũ (click ra ngoài để đóng Dropdown) giữ nguyên
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm kết nối ví và lấy số dư
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];
        setWalletAddress(address);

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const balanceWei = await provider.getBalance(address);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(parseFloat(balanceEth).toFixed(4)); 
        
      } catch (error) {
        console.error("Lỗi kết nối:", error);
      }
    } else {
      alert("Vui lòng cài đặt ví MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setBalance("0.00");
    setIsDropdownOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Tạo màu Avatar ngẫu nhiên
  const generateAvatarGradient = (address: string) => {
    if (!address) return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    const color1 = `#${address.slice(2, 8)}`;
    const color2 = `#${address.slice(address.length - 6)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3">
        
        {/* BÊN TRÁI: Logo & Tên */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-extrabold text-blue-400 flex items-center gap-2">
            <span className="text-white">BODOI</span>Exhibition
          </Link>
          
          {/* CHỈ HIỂN THỊ MENU NÀY NẾU KHÔNG PHẢI LANDING PAGE */}
          {!isLandingPage && (
            <div className="hidden md:flex items-center gap-6 font-semibold text-gray-300">
              <Link href="/explore" className="hover:text-white transition-colors">Khám phá</Link>
              <Link href="/stats" className="hover:text-white transition-colors">Thống kê</Link>
              <Link href="/mint" className="hover:text-white transition-colors">Tạo NFT</Link>
            </div>
          )}
        </div>

        {/* BÊN PHẢI: Icons & Kết nối ví */}
        <div className="flex items-center gap-3">
          
          {isLandingPage ? (
            /* HIỂN THỊ NÚT "VÀO ỨNG DỤNG" NẾU ĐANG Ở LANDING PAGE */
            <Link 
              href="/explore"
              className="rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/50 px-5 py-2 font-bold transition-all hover:bg-blue-600 hover:text-white hover:scale-105"
            >
              Vào Ứng Dụng
            </Link>
          ) : (
            /* HIỂN THỊ CHỨC NĂNG VÍ NẾU Ở CÁC TRANG KHÁC (Explore, Mint...) */
            <>
              {/* Nút Swap & Nút Chuông */}
              {walletAddress && (
                <>
                  <button className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors" title="Swap">
                    <ArrowRightLeft size={20} />
                  </button>
                  <button className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors relative" title="Notifications">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
                  </button>
                </>
              )}

              {/* Vùng Ví / Avatar */}
              {walletAddress === "" ? (
                <button
                  onClick={connectWallet}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white transition-all hover:bg-blue-500 hover:scale-105"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* Nút bấm để mở Dropdown */}
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-xl bg-gray-800 p-1 pr-3 transition-all hover:bg-gray-700 border border-gray-700 hover:border-gray-500"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg shadow-inner"
                      style={{ background: generateAvatarGradient(walletAddress) }}
                    ></div>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-white">{balance} ETH</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Bảng Menu Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-gray-800 border border-gray-700 shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                      
                      {/* Header của Dropdown */}
                      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-gray-600"
                            style={{ background: generateAvatarGradient(walletAddress) }}
                          ></div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Đã kết nối</p>
                            <p className="text-sm font-bold text-white font-mono">{formatAddress(walletAddress)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Các nút chức năng */}
                      <div className="px-2 py-2">
                        <Link href="/profile" className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-colors">
                          <User size={18} />
                          Profile (Trang cá nhân)
                        </Link>
                        <button className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-colors">
                          <Wallet size={18} />
                          Quản lý quỹ ví
                        </button>
                        <button className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-colors">
                          <Settings size={18} />
                          Cài đặt
                        </button>
                      </div>

                      {/* Nút Đăng xuất */}
                      <div className="px-2 pt-2 border-t border-gray-700">
                        <button 
                          onClick={disconnectWallet}
                          className="flex items-center gap-3 w-full px-3 py-3 text-sm font-bold text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={18} />
                          Log Out
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </nav>
  );
}