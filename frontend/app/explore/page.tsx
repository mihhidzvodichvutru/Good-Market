"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, Clock, Loader2 } from "lucide-react";

// 1. RÀO TRƯỚC CẤU TRÚC BẢNG DB (Tương đương với các cột trong bảng NFTs trên Supabase)
interface NFT {
  id: number;
  name: string;
  price: number; // Để dạng số để dễ code logic sắp xếp
  owner: string;
  image: string;
  isTrending: boolean;
  createdAt: string; 
}

export default function Explore() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [nfts, setNfts] = useState<NFT[]>([]); // Chứa toàn bộ data gốc từ DB
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]); // Chứa data sau khi bị Search/Filter
  const [isLoading, setIsLoading] = useState(true); // Trạng thái chờ load DB

  // --- STATE QUẢN LÝ BỘ LỌC ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("latest"); // 'latest', 'trending', 'price_asc'

  // 2. GIẢ LẬP GỌI DATABASE (Sau này bạn sẽ thay đoạn này bằng hàm fetch từ Supabase)
  useEffect(() => {
    const fetchFakeDatabase = () => {
      setIsLoading(true);
      
      // Giả lập DB trả về sau 1.5 giây
      setTimeout(() => {
        const fakeData: NFT[] = [
          { id: 1, name: "Cyber BODOI #01", price: 0.15, owner: "0x1A2...3F4c", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500", isTrending: true, createdAt: "2026-03-20" },
          { id: 2, name: "Neon Phantom", price: 0.88, owner: "0x9B1...8A2d", image: "https://images.unsplash.com/photo-1614590767253-12502c38841d?q=80&w=500", isTrending: false, createdAt: "2026-03-19" },
          { id: 3, name: "Abstract Mind", price: 0.05, owner: "0x3C4...9E1f", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=500", isTrending: true, createdAt: "2026-03-18" },
          { id: 4, name: "Golden Ratio", price: 1.20, owner: "0x7D5...2B3a", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=500", isTrending: false, createdAt: "2026-03-17" },
          { id: 5, name: "Space Walker", price: 0.45, owner: "0x2E6...1C4b", image: "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=500", isTrending: true, createdAt: "2026-03-16" },
          { id: 6, name: "Digital Soul", price: 0.10, owner: "0x5F7...4D5e", image: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?q=80&w=500", isTrending: false, createdAt: "2026-03-15" },
        ];
        setNfts(fakeData);
        setFilteredNfts(fakeData);
        setIsLoading(false);
      }, 1500);
    };

    fetchFakeDatabase();
  }, []);

  // 3. LOGIC XỬ LÝ SEARCH & BỘ LỌC (Tự động chạy lại mỗi khi user gõ phím hoặc bấm nút lọc)
  useEffect(() => {
    let result = [...nfts];

    // Xử lý Search (Tìm theo tên)
    if (searchQuery) {
      result = result.filter(nft => 
        nft.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Xử lý Filter
    if (activeFilter === "trending") {
      result = result.filter(nft => nft.isTrending);
    } else if (activeFilter === "price_asc") {
      result = result.sort((a, b) => a.price - b.price); // Sắp xếp giá từ thấp tới cao
    } else if (activeFilter === "latest") {
      // Giả sử ID lớn hơn là mới hơn
      result = result.sort((a, b) => b.id - a.id); 
    }

    setFilteredNfts(result);
  }, [searchQuery, activeFilter, nfts]);


  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Khám phá Tác phẩm
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Hàng ngàn tác phẩm nghệ thuật số độc bản đang chờ bạn sở hữu. Giao dịch an toàn và minh bạch trên Blockchain.
          </p>
        </div>

        {/* Thanh công cụ: Tìm kiếm & Lọc */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10">
          
          {/* Ô Input Tìm kiếm */}
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tên tác phẩm..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Các nút Bộ lọc (Bấm vào sẽ đổi màu) */}
          <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button 
              onClick={() => setActiveFilter("trending")}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "trending" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}
            >
              <TrendingUp size={18} /> Đang Hot
            </button>
            <button 
              onClick={() => setActiveFilter("latest")}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "latest" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}
            >
              <Clock size={18} /> Mới nhất
            </button>
            <button 
              onClick={() => setActiveFilter("price_asc")}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "price_asc" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}
            >
              <Filter size={18} /> Giá: Thấp đến Cao
            </button>
          </div>
        </div>

        {/* Khu vực hiển thị NFT / Loading */}
        {isLoading ? (
          // 4. HIỂU ỨNG SKELETON KHI ĐANG TẢI DỮ LIỆU DB
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-700/50"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-700/50 rounded-md w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700/50 rounded-md w-1/2 mb-6"></div>
                  <div className="border-t border-gray-700 pt-4 flex justify-between items-end">
                    <div className="h-5 bg-gray-700/50 rounded-md w-1/3"></div>
                    <div className="h-8 bg-gray-700/50 rounded-md w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNfts.length === 0 ? (
          // Hiển thị khi tìm kiếm không ra kết quả
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-300">Không tìm thấy tác phẩm</h3>
            <p className="text-gray-500 mt-2">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          // HIỂN THỊ LƯỚI NFT ĐÃ ĐƯỢC LỌC
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <Link href={`/explore/${nft.id}`} key={nft.id} className="group flex flex-col rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all duration-300">
                <div className="aspect-square bg-gray-700 relative overflow-hidden">
                  <img src={nft.image} alt={nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  {nft.isTrending && (
                    <div className="absolute top-3 left-3 bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1">
                      <TrendingUp size={12} /> Hot
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-1">{nft.name}</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">Sở hữu: {nft.owner}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium mb-1">Giá niêm yết</span>
                      <span className="font-extrabold text-white text-lg flex items-center gap-1">
                        <span className="text-blue-500">♦</span> {nft.price.toFixed(2)} ETH
                      </span>
                    </div>
                    <button className="text-sm font-bold bg-gray-700/50 text-blue-400 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Mua
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}