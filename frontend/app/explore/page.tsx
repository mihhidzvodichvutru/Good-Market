"use client";

import Link from "next/link";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, TrendingUp, Clock, Music, Play, Video as VideoIcon, Camera, RefreshCw } from "lucide-react"; 
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

// Hàm Việt hóa loại tác phẩm
  const translateMediaType = (type: string) => {
    switch (type) {
      case "image": return "Hình ảnh";
      case "video": return "Video"; // Tiếng Việt vẫn dùng chữ Video
      case "audio": return "Nhạc";
      default: return "Chưa rõ";
    }
  };

export default function Explore() {
  const [nfts, setNfts] = useState<NFT[]>([]); 
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("latest");

  // HÀM GIẢI MÃ LINK IPFS
  const resolveIpfsUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
      return url.replace("ipfs://", `${gateway}/ipfs/`);
    }
    return url; 
  };

  //State lưu tác phẩm cho Banner
  const [bannerNfts, setBannerNfts] = useState<NFT[]>([]); 
  
  // 1. SỬA LẠI ĐỘNG CƠ TRƯỢT: Thêm stopOnInteraction: false để nó KHÔNG BAO GIỜ dừng auto-play
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);

  // 2. THÊM CODE ĐIỀU KHIỂN DẤU CHẤM (PAGINATION DOTS)
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(); // Lấy vị trí ban đầu
    emblaApi.on('select', onSelect); // Lắng nghe mỗi khi banner trượt
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  //Hàm lấy ảnh đẹp nhất cho Banner
  const getBannerImage = (nft: NFT) => {
    if ((nft.mediaType === "video" || nft.mediaType === "audio") && nft.coverImage) {
      return resolveIpfsUrl(nft.coverImage);
    }
    return resolveIpfsUrl(nft.image);
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
            owner: item.owner_address || item.owner, // Xử lý đồng bộ tên cột từ DB
            image: item.image,
            coverImage: item.cover_image, 
            mediaType: item.media_type || "image", 
            isTrending: item.is_trending,
            createdAt: item.created_at,
          }));

          setNfts(formattedData);
          setFilteredNfts(formattedData);
          
          // VÁ LỖI SỐ 1: Trích xuất 5 tác phẩm mới nhất gán vào Banner
          setBannerNfts(formattedData.slice(0, 5));
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

  // 📦 HÀM DÙNG CHUNG: Hiển thị Thẻ NFT cho các cụm Featured
  const renderNFTCard = (nft: NFT) => (
    <Link href={`/explore/${nft.id}`} key={`featured-${nft.id}`} className="group flex flex-col rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all duration-300">
      <div className="aspect-square bg-gray-700 relative overflow-hidden flex items-center justify-center">
        {nft.mediaType === "image" && (
          <div className="w-full h-full relative">
            <img src={resolveIpfsUrl(nft.image)} alt={nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"/>
            <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white"> <Camera size={16}/> </div>
          </div>
        )}
        {nft.mediaType === "video" && (
          <div className="w-full h-full relative">
            <video src={resolveIpfsUrl(nft.image)} poster={resolveIpfsUrl(nft.coverImage)} muted loop playsInline className="w-full h-full object-cover" onMouseOver={(e) => { (e.target as HTMLVideoElement).play().catch(() => {}); }} onMouseOut={(e) => { const video = e.target as HTMLVideoElement; video.pause(); video.currentTime = 0; video.load(); }} />
            <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white backdrop-blur-sm"> <VideoIcon size={16}/> </div>
          </div>
        )}
        {nft.mediaType === "audio" && (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-900 group">
            {nft.coverImage ? ( <img src={resolveIpfsUrl(nft.coverImage)} alt="Audio Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-70 group-hover:opacity-100" /> ) : ( <div className="w-20 h-20 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-green-500/30 animate-spin-slow"> <Music className="text-green-400" size={32} /> </div> )}
            <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-lg text-white backdrop-blur-sm"> <Music size={16}/> </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <div className="w-16 h-16 rounded-full bg-blue-500/90 backdrop-blur-sm flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-all"> <Play className="fill-white text-white ml-1" size={28} /> </div> </div>
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
            <span className="font-extrabold text-white text-lg flex items-center gap-1"> <span className="text-blue-500">♦</span> {nft.price.toFixed(3)} ETH </span>
          </div>
          <button className="text-sm font-bold bg-gray-700/50 text-blue-400 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"> Xem </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        
        {/* Tiêu đề Trang */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Khám phá Tác phẩm
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Sàn giao dịch đa phương tiện: Hình ảnh, Video, Âm thanh độc bản trên Blockchain.
          </p>
        </div>

        {/* VÁ LỖI SỐ 2: CHÈN GIAO DIỆN BANNER VÀO ĐÂY */}
        {!isLoading && bannerNfts.length > 0 && (
          <div className="w-full mb-12 rounded-3xl overflow-hidden relative group border-2 border-gray-800" ref={emblaRef}>
            <div className="flex h-[450px]">
              {bannerNfts.map((nft) => (
                <div key={`banner-${nft.id}`} className="flex-[0_0_100%] min-w-0 relative h-full cursor-pointer" onClick={() => window.location.href = `/explore/${nft.id}`}>
                  
                  {/* Ảnh nền */}
                  <img 
                    src={getBannerImage(nft)} 
                    alt={nft.name} 
                    className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-[5s] ease-linear" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent"></div>

                  {/* Khối Nội Dung */}
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col md:flex-row items-end justify-between gap-6">
                    <div className="flex-1 w-full md:w-auto">
                      <h1 className="text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-lg truncate">
                        {nft.name}
                      </h1>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-lg uppercase">
                          {nft.owner ? nft.owner.slice(2, 4) : '??'}
                        </div>
                        <p className="text-lg text-gray-300 font-medium">
                          Owned by <span className="text-blue-400 font-bold">{formatAddress(nft.owner)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bảng Chỉ số */}
                    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl flex items-center divide-x divide-gray-700 shadow-2xl w-full md:w-auto">
                      <div className="px-5 md:px-6 py-4 flex flex-col items-center justify-center w-1/2 md:w-auto">
                        <span className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Giá</span>
                        <span className="text-lg md:text-xl font-bold text-white flex items-center gap-1.5">
                          {nft.price ? `${nft.price} ETH` : 'Not Listed'}
                        </span>
                      </div>
                      <div className="px-5 md:px-6 py-4 flex flex-col items-center justify-center w-1/2 md:w-auto">
                        <span className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Lượt xem 24h qua</span>
                        <span className="text-lg md:text-xl font-bold text-white flex items-center gap-1.5 text-green-400">
                           🔥 {Math.floor(Math.random() * 200) + 50}
                        </span>
                      </div>
                      <div className="px-6 py-4 flex-col items-center justify-center hidden sm:flex">
                        <span className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Loại</span>
                        <span className="text-lg md:text-xl font-bold text-white capitalize">{translateMediaType(nft.mediaType)}</span>
                      </div>
                      <div className="px-6 py-4 flex-col items-center justify-center hidden sm:flex">
                        <span className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Phiên bản</span>
                        <span className="text-lg md:text-xl font-bold text-white">Độc bản</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {bannerNfts.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Cực kỳ quan trọng: Ngăn không cho click nhầm vào ảnh để chuyển trang
                    scrollTo(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex 
                      ? "bg-blue-500 w-8 shadow-[0_0_10px_rgba(59,130,246,0.8)]" // Dấu chấm đang được chọn sẽ dài ra và sáng lên
                      : "bg-white/40 w-2 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

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

        {/* ========================================================= */}
        {/* 🌟 PHẦN FEATURED MỚI (CHIA THEO DANH MỤC) */}
        {/* ========================================================= */}
        {!isLoading && filteredNfts.length > 0 && (
          <div className="space-y-16 mb-20"> 
            
            {/* 1. CỤM HÌNH ẢNH */}
            {filteredNfts.filter(n => n.mediaType === "image").length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                    <Camera className="text-blue-400" size={32} /> Hình ảnh Nổi bật
                  </h2>
                  <Link href="/explore/image" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors group">
                    Xem tất cả <span className="text-xl group-hover:translate-x-1 transition-transform">›</span>
                  </Link>
                </div>
                {/* Chỉ lấy tối đa 4 tác phẩm mới nhất */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredNfts.filter(n => n.mediaType === "image").slice(0, 4).map(renderNFTCard)}
                </div>
              </section>
            )}

            {/* 2. CỤM VIDEO */}
            {filteredNfts.filter(n => n.mediaType === "video").length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                    <VideoIcon className="text-purple-400" size={32} /> Video Bùng nổ
                  </h2>
                  <Link href="/explore/video" className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors group">
                    Xem tất cả <span className="text-xl group-hover:translate-x-1 transition-transform">›</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredNfts.filter(n => n.mediaType === "video").slice(0, 4).map(renderNFTCard)}
                </div>
              </section>
            )}

            {/* 3. CỤM ÂM THANH */}
            {filteredNfts.filter(n => n.mediaType === "audio").length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                    <Music className="text-green-400" size={32} /> Âm thanh Độc quyền
                  </h2>
                  <Link href="/explore/audio" className="text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors group">
                    Xem tất cả <span className="text-xl group-hover:translate-x-1 transition-transform">›</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredNfts.filter(n => n.mediaType === "audio").slice(0, 4).map(renderNFTCard)}
                </div>
              </section>
            )}

          </div>
        )}

        

      </div>
    </div>
  );
}