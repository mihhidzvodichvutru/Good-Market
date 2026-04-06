"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trophy, TrendingUp, Users, Grid, ArrowLeft, Medal, Loader2, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Định nghĩa kiểu dữ liệu cho người dùng trong bảng xếp hạng
interface RankedUser {
  wallet: string;
  username: string;
  avatar_url: string;
  count: number;
  totalValue: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"creators" | "collectors">("creators");
  
  const [topCreators, setTopCreators] = useState<RankedUser[]>([]);
  const [topCollectors, setTopCollectors] = useState<RankedUser[]>([]);
  
  // Tổng quan sàn
  const [platformStats, setPlatformStats] = useState({
    totalVolume: 0,
    totalNFTs: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      setIsLoading(true);
      try {
        // 1. Tải toàn bộ NFT và User từ Database
        const [nftsRes, usersRes] = await Promise.all([
          supabase.from('nfts').select('*'),
          supabase.from('users').select('*')
        ]);

        const nfts = nftsRes.data || [];
        const users = usersRes.data || [];

        // 2. Tạo Map để tra cứu thông tin User nhanh
        const userMap: Record<string, any> = {};
        users.forEach(u => {
          if (u.wallet_address) userMap[u.wallet_address.toLowerCase()] = u;
        });

        // 3. Biến đếm
        let totalVol = 0;
        const creatorStats: Record<string, { count: number, value: number }> = {};
        const ownerStats: Record<string, { count: number, value: number }> = {};

        // 4. Quét qua toàn bộ NFT để cộng dồn số liệu
        nfts.forEach(nft => {
          const price = parseFloat(nft.price) || 0;
          totalVol += price;
          
          const creator = (nft.creator || nft.owner || "").toLowerCase();
          const owner = (nft.owner || "").toLowerCase();

          // Cộng dồn cho Tác giả (Creators)
          if (creator) {
            if (!creatorStats[creator]) creatorStats[creator] = { count: 0, value: 0 };
            creatorStats[creator].count += 1;
            creatorStats[creator].value += price;
          }

          // Cộng dồn cho Người sở hữu (Collectors)
          if (owner) {
            if (!ownerStats[owner]) ownerStats[owner] = { count: 0, value: 0 };
            ownerStats[owner].count += 1;
            ownerStats[owner].value += price;
          }
        });

       // 5. Hàm chuyển đổi Object thành Array, ghép tên/ảnh và Sắp xếp
        const formatAndSort = (statsObj: Record<string, any>, sortBy: "count" | "totalValue") => {
          return Object.entries(statsObj)
            .map(([wallet, stats]): RankedUser => ({ // Ép chuẩn kiểu RankedUser vào đây
              wallet,
              count: stats.count,
              totalValue: stats.value,
              username: userMap[wallet]?.username || "Nghệ sĩ Ẩn danh",
              avatar_url: userMap[wallet]?.avatar_url || ""
            }))
            .sort((a, b) => b[sortBy] - a[sortBy]) 
            .slice(0, 10); 
        };

        setTopCreators(formatAndSort(creatorStats, "count"));
        setTopCollectors(formatAndSort(ownerStats, "totalValue")); 
        
        setPlatformStats({
          totalVolume: totalVol,
          totalNFTs: nfts.length,
          totalUsers: users.length
        });

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAggregateData();
  }, []);

  const resolveIpfsUrl = (url: string) => {
    if (!url) return "";
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  };

  const generateAvatarGradient = (address: string) => {
    if (!address) return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    const color1 = `#${address.slice(2, 8)}`;
    const color2 = `#${address.slice(address.length - 6)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  const currentList = activeTab === "creators" ? topCreators : topCollectors;

  return (
    <div className="min-h-screen bg-[#0e111a] text-white py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4">
              <Trophy className="text-yellow-500" size={48} /> Bảng Xếp Hạng
            </h1>
            <p className="text-gray-400 mt-3 text-lg">Khám phá những nghệ sĩ và nhà sưu tập hàng đầu trên sàn.</p>
          </div>
        </div>

        {/* THẺ TỔNG QUAN SÀN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1a202c] border border-gray-800 rounded-3xl p-6 flex items-center gap-5 shadow-lg">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><TrendingUp size={32} /></div>
            <div>
              <p className="text-gray-400 font-bold text-sm">Tổng Khối Lượng</p>
              <h3 className="text-3xl font-black">{platformStats.totalVolume.toFixed(2)} ETH</h3>
            </div>
          </div>
          <div className="bg-[#1a202c] border border-gray-800 rounded-3xl p-6 flex items-center gap-5 shadow-lg">
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500"><Grid size={32} /></div>
            <div>
              <p className="text-gray-400 font-bold text-sm">Tổng Số NFT Đã Đúc</p>
              <h3 className="text-3xl font-black">{platformStats.totalNFTs}</h3>
            </div>
          </div>
          <div className="bg-[#1a202c] border border-gray-800 rounded-3xl p-6 flex items-center gap-5 shadow-lg">
            <div className="p-4 bg-green-500/10 rounded-2xl text-green-500"><Users size={32} /></div>
            <div>
              <p className="text-gray-400 font-bold text-sm">Thành Viên Hoạt Động</p>
              <h3 className="text-3xl font-black">{platformStats.totalUsers}</h3>
            </div>
          </div>
        </div>

        {/* KHU VỰC TABS & DANH SÁCH */}
        <div className="bg-[#1a202c] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setActiveTab("creators")}
              className={`flex-1 py-5 text-lg font-bold text-center transition-all ${activeTab === "creators" ? "text-white border-b-2 border-blue-500 bg-gray-800/30" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/10"}`}
            >
              Top Nghệ Sĩ Đúc NFT
            </button>
            <button 
              onClick={() => setActiveTab("collectors")}
              className={`flex-1 py-5 text-lg font-bold text-center transition-all ${activeTab === "collectors" ? "text-white border-b-2 border-blue-500 bg-gray-800/30" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/10"}`}
            >
              Top Đại Gia Sở Hữu
            </button>
          </div>

          <div className="p-6 md:p-8">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20">
                 <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                 <p className="text-gray-400 font-bold">Đang tính toán dữ liệu xếp hạng...</p>
               </div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Chưa có đủ dữ liệu để xếp hạng.</div>
            ) : (
              <div className="space-y-4">
                {/* TIÊU ĐỀ CỘT */}
                <div className="hidden md:flex items-center px-6 py-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                  <div className="w-16">Hạng</div>
                  <div className="flex-1">Thành viên</div>
                  <div className="w-32 text-center">Số Tác Phẩm</div>
                  <div className="w-40 text-right">Tổng Giá Trị</div>
                </div>

                {/* DANH SÁCH USER */}
                {currentList.map((user, index) => (
                  <Link href={`/profile/${user.wallet}`} key={index} className="flex items-center bg-gray-900/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 p-4 md:px-6 rounded-2xl transition-all group">
                    
                    {/* Hạng */}
                    <div className="w-12 md:w-16 font-black text-xl flex items-center justify-center md:justify-start">
                      {index === 0 ? <Crown className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={28} /> : 
                       index === 1 ? <Medal className="text-gray-300" size={24} /> : 
                       index === 2 ? <Medal className="text-amber-600" size={24} /> : 
                       <span className="text-gray-500">#{index + 1}</span>}
                    </div>

                    {/* Avatar & Tên */}
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-blue-500 transition-colors shadow-md">
                        {user.avatar_url ? (
                          <img src={resolveIpfsUrl(user.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: generateAvatarGradient(user.wallet) }}></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{user.username}</h3>
                        <p className="text-xs text-gray-500 font-mono hidden sm:block">
                          {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* Số liệu đếm */}
                    <div className="w-24 md:w-32 text-center font-bold text-gray-300">
                      {user.count} <span className="text-sm text-gray-500 font-normal">NFT</span>
                    </div>

                    {/* Giá trị */}
                    <div className="w-24 md:w-40 text-right">
                      <span className="font-black text-blue-400 block">{user.totalValue.toFixed(2)} ETH</span>
                    </div>

                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}