"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, Clock, Music, Play, Video as VideoIcon, Camera } from "lucide-react"; 
import { supabase } from "../../lib/supabase"; 

interface NFT {
  id: number;
  name: string;
  price: number;
  owner: string;
  image: string; 
  coverImage?: string;
  mediaType: "image" | "video" | "audio";
  isTrending: boolean;
  createdAt: string; 
}

export default function Explore() {
  const [nfts, setNfts] = useState<NFT[]>([]); 
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("latest");

  // BƯỚC 1: HÀM GIẢI MÃ LINK IPFS (ĐÃ NÂNG CẤP LÊN CỔNG VIP)
  const resolveIpfsUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      // Gọi cổng VIP từ biến môi trường. Nếu quên chưa cài thì nó xài tạm cổng Public chống cháy
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
      return url.replace("ipfs://", `${gateway}/ipfs/`);
    }
    return url; 
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('nfts')
          .select('*')
          .order('id', { ascending: false });

        if (error) {
          console.error("Lỗi Supabase:", error.message);
          return;
        }

        if (data) {
          const formattedData: NFT[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            owner: item.owner,
            image: item.image,
            coverImage: item.cover_image, // <--- THÊM DÒNG NÀY
            mediaType: item.media_type || "image", 
            isTrending: item.is_trending,
            createdAt: item.created_at,
          }));

          setNfts(formattedData);
          setFilteredNfts(formattedData);
        }
      } catch (err) {
        console.error("Lỗi không xác định:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  useEffect(() => {
    let result = [...nfts];
    if (searchQuery) {
      result = result.filter(nft => nft.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeFilter === "trending") {
      result = result.filter(nft => nft.isTrending);
    } else if (activeFilter === "price_asc") {
      result = result.sort((a, b) => a.price - b.price); 
    } else if (activeFilter === "latest") {
      result = result.sort((a, b) => b.id - a.id); 
    }
    setFilteredNfts(result);
  }, [searchQuery, activeFilter, nfts]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Khám phá Tác phẩm
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Sàn giao dịch đa phương tiện: Hình ảnh, Video, Âm thanh độc bản trên Blockchain.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm tên tác phẩm..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl pl-12 pr-4 py-3 focus:border-blue-500 outline-none transition-all"/>
          </div>
          <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button onClick={() => setActiveFilter("trending")} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "trending" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}> <TrendingUp size={18} /> Đang Hot</button>
            <button onClick={() => setActiveFilter("latest")} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "latest" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}> <Clock size={18} /> Mới nhất</button>
            <button onClick={() => setActiveFilter("price_asc")} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors ${activeFilter === "price_asc" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}> <Filter size={18} /> Giá thấp tới cao</button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-700/50"></div>
                <div className="p-5 space-y-2"> <div className="h-6 bg-gray-700/50 rounded-md w-3/4"></div> <div className="h-4 bg-gray-700/50 rounded-md w-1/2 mb-6"></div> <div className="border-t border-gray-700 pt-4 flex justify-between items-end"><div className="h-5 bg-gray-700/50 rounded-md w-1/3"></div> <div className="h-8 bg-gray-700/50 rounded-md w-1/4"></div></div></div>
              </div>
            ))}
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center"> <Search className="h-16 w-16 text-gray-600 mb-4" /> <h3 className="text-2xl font-bold text-gray-300">Không tìm thấy tác phẩm</h3></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <Link href={`/explore/${nft.id}`} key={nft.id} className="group flex flex-col rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all duration-300">
                
                <div className="aspect-square bg-gray-700 relative overflow-hidden flex items-center justify-center">
                  
                  {nft.mediaType === "image" && (
                    <div className="w-full h-full relative">
                      <img 
                        // BƯỚC 2: BỌC HÀM XỬ LÝ VÀO LINK ẢNH
                        src={resolveIpfsUrl(nft.image)} 
                        alt={nft.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white"> <Camera size={16}/> </div>
                    </div>
                  )}

                  {nft.mediaType === "video" && (
                    <div className="w-full h-full relative">
                      <video 
                        src={resolveIpfsUrl(nft.image)} 
                        poster={resolveIpfsUrl(nft.coverImage)} // <--- TRỌNG TÂM: Gắn ảnh bìa làm thumbnail
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover"
                        onMouseOver={(e) => {
                          const video = e.target as HTMLVideoElement;
                          video.play().catch(() => {}); // Bắt đầu phát khi hover
                        }}
                        onMouseOut={(e) => {
                          const video = e.target as HTMLVideoElement;
                          video.pause(); // 1. Dừng phát
                          video.currentTime = 0; // 2. Tua lại về giây số 0 (để lần sau hover nó chạy từ đầu)
                          video.load(); // 3. VŨ KHÍ TỐI THƯỢNG: Reset lại thẻ video để ép hiện lại Poster!
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white backdrop-blur-sm"> 
                        <VideoIcon size={16}/> 
                      </div>
                    </div>
                  )}

                  {nft.mediaType === "audio" && (
                    <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-900 group">
                      {/* GỌI ẢNH BÌA RA Ở ĐÂY */}
                      {nft.coverImage ? (
                        <img 
                          src={resolveIpfsUrl(nft.coverImage)} 
                          alt="Audio Cover" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-70 group-hover:opacity-100" 
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-green-500/30 animate-spin-slow">
                           <Music className="text-green-400" size={32} />
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white backdrop-blur-sm"> <Music size={16}/> </div>
                      
                      {/* Hiệu ứng Nút Play khi Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-16 h-16 rounded-full bg-blue-500/90 backdrop-blur-sm flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-all">
                               <Play className="fill-white text-white ml-1" size={28} />
                           </div>
                       </div>
                    </div>
                  )}

                  {nft.isTrending && (
                    <div className="absolute top-3 left-3 bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1">
                      <TrendingUp size={12} /> Hot
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-1">{nft.name}</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">Sở hữu: {formatAddress(nft.owner)}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium mb-1">Giá</span>
                      <span className="font-extrabold text-white text-lg flex items-center gap-1">
                        <span className="text-blue-500">♦</span> {nft.price.toFixed(3)} ETH
                      </span>
                    </div>
                    <button className="text-sm font-bold bg-gray-700/50 text-blue-400 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Xem
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