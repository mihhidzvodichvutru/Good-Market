"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Camera, Music, Play, Video as VideoIcon, ArrowLeft, Search, TrendingUp, Clock, Filter, RefreshCw } from "lucide-react";
import { supabase } from "../../../lib/supabase"; 

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

export default function VideoExplorePage() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("latest");

  const resolveIpfsUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
      return url.replace("ipfs://", `${gateway}/ipfs/`);
    }
    return url; 
  };

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      // Chỉ lấy những NFT có media_type là 'image'
      const { data } = await supabase
        .from('nfts')
        .select('*')
        .eq('media_type', 'video') 
        .order('id', { ascending: false });

      if (data) {
        setNfts(data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          owner: item.owner_address || item.owner,
          image: item.image,
          coverImage: item.cover_image,
          mediaType: item.media_type,
          isTrending: item.is_trending,
        })));
      }
      setIsLoading(false);
    };
    fetchImages();
  }, []);

  useEffect(() => {
    let result = [...nfts];

    // Lọc theo chữ tìm kiếm
    if (searchQuery) {
      result = result.filter(nft => nft.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Lọc theo các nút bấm
    if (activeFilter === "trending") {
      result = result.filter(nft => nft.isTrending);
    } else if (activeFilter === "price_asc") {
      result = result.sort((a, b) => a.price - b.price); 
    } else if (activeFilter === "price_desc") {
      result = result.sort((a, b) => b.price - a.price);
    } else if (activeFilter === "latest") {
      result = result.sort((a, b) => b.id - a.id); 
    }

    setFilteredNfts(result);
  }, [searchQuery, activeFilter, nfts]);

  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

// 📦 HÀM DÀNH RIÊNG CHO TRANG VIDEO
  const renderNFTCard = (nft: NFT) => (
    <Link href={`/explore/${nft.id}`} key={`video-card-${nft.id}`} className="group flex flex-col rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all duration-300">
      
      {/* Khu vực hiển thị Video */}
      <div className="aspect-square bg-gray-700 relative overflow-hidden flex items-center justify-center">
        <div className="w-full h-full relative">
          <video 
            src={resolveIpfsUrl(nft.image)} 
            poster={resolveIpfsUrl(nft.coverImage)} 
            muted loop playsInline className="w-full h-full object-cover"
            onMouseOver={(e) => { (e.target as HTMLVideoElement).play().catch(() => {}); }}
            onMouseOut={(e) => {
              const video = e.target as HTMLVideoElement;
              video.pause(); video.currentTime = 0; video.load(); 
            }}
          />
          <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white backdrop-blur-sm"> 
            <VideoIcon size={16}/> 
          </div>
        </div>
      </div>

      {/* Khu vực thông tin giữ nguyên như cũ */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors line-clamp-1">{nft.name}</h3>
          <p className="text-sm text-gray-400 font-mono mt-1">Sở hữu: {formatAddress(nft.owner)}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium mb-1">Giá</span>
            <span className="font-extrabold text-white text-lg flex items-center gap-1"> 
              <span className="text-blue-500">♦</span> {nft.price.toFixed(3)} ETH 
            </span>
          </div>
          <button className="text-sm font-bold bg-gray-700/50 text-purple-400 px-4 py-2 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors"> Xem </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        
        {/* Nút Quay lại & Tiêu đề */}
        <div className="mb-10">
          <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} /> Quay lại trang Tổng hợp
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 flex items-center gap-4">
            <VideoIcon size={40} className="text-purple-400" /> Video Bùng nổ
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Khám phá bộ sưu tập Video nghệ thuật độc bản được lưu trữ trên Blockchain.
          </p>
        </div>

        {/* Khu vực Tìm kiếm và Bộ Lọc */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm tên tác phẩm..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl pl-12 pr-4 py-3 focus:border-blue-500 outline-none transition-all"/>
          </div>
          <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button onClick={() => setActiveFilter("trending")} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors whitespace-nowrap ${activeFilter === "trending" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}> <TrendingUp size={18} /> Đang Hot</button>
            <button onClick={() => setActiveFilter("latest")} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-colors whitespace-nowrap ${activeFilter === "latest" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}> <Clock size={18} /> Mới nhất</button>
            {/* Nút Lọc Giá (Tích hợp 2 chiều có Toggle) */}
            <button 
              onClick={() => {
                // Đảo chiều nếu đang ở nút Giá, nếu không thì mặc định là Thấp tới Cao
                if (activeFilter === "price_asc") setActiveFilter("price_desc");
                else setActiveFilter("price_asc");
              }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
                activeFilter.includes("price") 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
              }`}
            > 
              <Filter size={18} /> 
              {activeFilter === "price_desc" ? "Giá cao tới thấp" : "Giá thấp tới cao"}
              <RefreshCw 
                size={14} 
                className={`ml-1 transition-transform duration-300 ${activeFilter === 'price_desc' ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Lưới hiển thị */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden animate-pulse h-[400px]"></div>
            ))}
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center"> 
            <VideoIcon className="h-16 w-16 text-gray-600 mb-4" /> 
            <h3 className="text-2xl font-bold text-gray-300">Chưa có Video nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNfts.map(renderNFTCard)}
          </div>
        )}

      </div>
    </div>
  );
}
