"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { Bell, ArrowRightLeft, LogOut, User, Wallet, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { usePathname } from "next/navigation"; 

// 1. IMPORT SUPABASE 
import { supabase } from "../lib/supabase"; 

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Biến lưu Avatar
  const [avatarUrl, setAvatarUrl] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";   

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
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

  // 2. CHỌC THẲNG VÀO DATABASE SUPABASE LẤY AVATAR (Bỏ qua API)
  useEffect(() => {
    const fetchAvatarFromDB = async () => {
      if (!walletAddress) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('avatar_url')
          .ilike('wallet_address', walletAddress)
          .single();

        if (data && data.avatar_url) {
          const resolvedUrl = data.avatar_url.startsWith("ipfs://")
            ? data.avatar_url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
            : data.avatar_url;
          setAvatarUrl(resolvedUrl);
        }
      } catch (error) {
        console.error("Lỗi lấy avatar từ Database:", error);
      }
    };

    fetchAvatarFromDB();
  }, [walletAddress]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setAvatarUrl(""); // Reset ảnh khi đăng xuất
    setIsDropdownOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 3. HÀM TẠO MÀU ĐÃ ĐƯỢC CẬP NHẬT THEO YÊU CẦU CỦA ÔNG
  const generateAvatarGradient = (address: string, customImage?: string) => {
    if (customImage) {
      return `url('${customImage}') center/cover no-repeat`;
    }
    if (!address) return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    const color1 = `#${address.slice(2, 8)}`;
    const color2 = `#${address.slice(address.length - 6)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3">
        
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-extrabold text-blue-400 flex items-center gap-2">
            <span className="text-white">BODOI</span>Exhibition
          </Link>
          
          {!isLandingPage && (
            <div className="hidden md:flex items-center gap-6 font-bold">
              <Link 
                href="/explore" 
                className={`transition-colors ${pathname.startsWith("/explore") ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]" : "text-gray-400 hover:text-gray-200"}`}
              >
                Khám phá
              </Link>
              
              <Link 
                href="/stats" 
                className={`transition-colors ${pathname.startsWith("/stats") ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]" : "text-gray-400 hover:text-gray-200"}`}
              >
                Thống kê
              </Link>
              
              <Link 
                href="/mint" 
                className={`transition-colors ${pathname.startsWith("/mint") ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]" : "text-gray-400 hover:text-gray-200"}`}
              >
                Tạo NFT
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLandingPage ? (
            <Link href="/explore" className="rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/50 px-5 py-2 font-bold transition-all hover:bg-blue-600 hover:text-white hover:scale-105">
              Vào Ứng Dụng
            </Link>
          ) : (
            <>
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

              {walletAddress === "" ? (
                <button onClick={connectWallet} className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white transition-all hover:bg-blue-500 hover:scale-105">
                  Connect Wallet
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 rounded-[14px] bg-[#1a202c] p-1.5 pr-3 transition-all hover:bg-gray-800 border border-gray-700 hover:border-gray-500 shadow-sm"
                  >
                    {/* 4. TRUYỀN THÊM BIẾN AVATAR VÀO ĐÂY */}
                    <div 
                      className="w-7 h-7 rounded-[10px] shadow-inner"
                      style={{ background: generateAvatarGradient(walletAddress, avatarUrl) }}
                    ></div>
                    
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-bold text-gray-100">{balance} ETH</span>
                    </div>
                    {isDropdownOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-[20px] bg-[#1a202c] border border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                      
                      <div className="px-5 py-4 border-b border-gray-700/80 flex items-center gap-3 bg-gray-800/30">
                        {/* 5. TRUYỀN THÊM BIẾN AVATAR VÀO ĐÂY */}
                        <div 
                          className="w-11 h-11 rounded-full shadow-md"
                          style={{ background: generateAvatarGradient(walletAddress, avatarUrl) }}
                        ></div>
                        
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Đã kết nối</p>
                          <p className="text-sm font-bold text-white tracking-wide">{formatAddress(walletAddress)}</p>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col gap-1">
                        <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-colors">
                          <User size={18} /> Profile (Trang cá nhân)
                        </Link>
                        <Link href="/wallet" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-colors">
                          <Wallet size={18} /> Quản lý quỹ ví
                        </Link>
                        <Link href="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-colors">
                          <Settings size={18} /> Cài đặt
                        </Link>
                      </div>

                      <div className="p-2 border-t border-gray-700">
                        <button onClick={disconnectWallet} className="flex items-center gap-3 w-full px-3 py-3 text-sm font-bold text-[#ff6b6b] rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          <LogOut size={18} /> Log Out
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