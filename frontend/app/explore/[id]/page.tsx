"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { UserCircle, Tag, Clock, Package, ArrowLeft, Loader2, DollarSign, History, Music, Play, Pause, Volume2, Video as VideoIcon, Camera } from "lucide-react";

// 1. Cập nhật Model dữ liệu
interface NFT {
  id: number;
  name: string;
  price: number;
  owner: string;
  image: string;
  mediaType: "image" | "video" | "audio";
  isTrending: boolean;
  createdAt: string; 
}

// 2. Component Trình phát nhạc custom - GIỐNG SPOTIFY
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Lấy tổng thời gian khi file load xong
    audio.onloadedmetadata = () => setDuration(audio.duration);
    // Cập nhật thời gian đang phát
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    // Xử lý khi nhạc hết
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error("Audio play interrupted:", error.message);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex flex-col gap-4 shadow-xl">
      <audio ref={audioRef} src={src} />
      
      {/* Thông tin bài nhạc */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30 animate-spin-slow">
            <Music className="text-green-400" size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-200">Đang phát tác phẩm âm nhạc</p>
          <p className="text-xs text-gray-400">Chất lượng cao trên IPFS</p>
        </div>
      </div>

      {/* Điều khiển */}
      <div className="flex items-center gap-4">
        <button 
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
        >
          {isPlaying ? <Pause className="fill-white text-white" size={24}/> : <Play className="fill-white text-white" size={24}/>}
        </button>
        
        <div className="flex-grow flex items-center gap-3">
          <span className="text-xs text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
          {/* Progress bar custom xịn xò */}
          <input 
            type="range" 
            min="0" 
            max={duration.toString()} 
            value={currentTime.toString()} 
            onChange={handleSeek} 
            className="flex-grow h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
        </div>

        <button className="text-gray-400 hover:text-white transition-colors"> <Volume2 size={18}/> </button>
      </div>
    </div>
  );
}

// 3. Component chính - BẮT BUỘC DÙNG 'use()' ĐỂ LẤY ID TRÊN NEXT.JS 15
export default function NFTDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // Mở hộp params
  const id = resolvedParams.id; // Lấy ID

  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('nfts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Lỗi khi tải chi tiết NFT:", error.message);
          return;
        }

        if (data) {
          const formattedNft: NFT = {
            id: data.id,
            name: data.name,
            price: parseFloat(data.price),
            owner: data.owner,
            image: data.image,
            // Ép kiểu phân loại dữ liệu
            mediaType: data.media_type || "image",
            isTrending: data.is_trending,
            createdAt: data.created_at,
          };
          setNft(formattedNft);
        }
      } catch (err) {
        console.error("Lỗi không xác định:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTDetails();
  }, [id]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-lg">Đang tải siêu phẩm...</p>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-4 text-center">
        <Package className="h-20 w-20 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-300">Ối! Tác phẩm không tồn tại</h1>
        <Link href="/explore" className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors">
          <ArrowLeft size={18} /> Quay lại trang Khám phá
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />  Quai lại danh sách
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- CỘT TRÁI: HIỂN THỊ ĐA PHƯƠNG TIỆN BỰ CHÀ BÁ --- */}
          <div className="relative aspect-square rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
            
            {/* TRƯỜNG HỢP 1: LÀ HÌNH ẢNH */}
            {nft.mediaType === "image" && (
              <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
            )}

            {/* TRƯỜNG HỢP 2: LÀ VIDEO -> HIỂN THỊ TRÌNH PHÁT VIDEO CHÍNH CHỦ CÓ ĐIỀU KHIỂN */}
            {nft.mediaType === "video" && (
              <video 
                src={nft.image} 
                controls 
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            )}

            {/* TRƯỜNG HỢP 3: LÀ ÂM THANH -> DỰNG ĐĨA XOAY/SPOTIFY VIBE */}
            {nft.mediaType === "audio" && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-6 relative">
                 <div className="w-48 h-48 bg-gradient-to-tr from-green-500 to-blue-500 rounded-full animate-spin-slow flex items-center justify-center border-2 border-green-500/50 shadow-lg">
                    <div className="w-12 h-12 bg-gray-900 rounded-full"></div>
                 </div>
                 <Music className="text-green-400 absolute opacity-10" size={128} />
                 
                 {/* Tag phân loại đa phương tiện */}
                 <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-bold border border-white/10 flex items-center gap-1.5">
                    <Music size={16} /> Âm thanh độc bản
                 </div>
              </div>
            )}
            
            {/* Tag "Hot" */}
            {nft.isTrending && (
              <div className="absolute top-6 right-6 bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-bold border border-white/10 flex items-center gap-1.5">
                <Tag size={16} /> Đang Hot
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Thông tin */}
          <div className="flex flex-col space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {nft.name}
              </h1>
              <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Chủ sở hữu hiện tại</p>
                    <p className="text-sm font-mono text-blue-400 font-medium">{formatAddress(nft.owner)}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-700 hidden md:block"></div>
                <div className="text-sm text-gray-400">
                  <Clock size={16} className="inline mr-1.5 text-gray-500" />
                  Đúc lúc: {new Date(nft.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* --- KHU VỰC ĐẶC BIỆT CHO ÂM THANH: TRÌNH PHÁT CUSTOM GIỐNG SPOTIFY --- */}
            {nft.mediaType === "audio" && (
              <AudioPlayer src={nft.image} />
            )}

            {/* Mô tả giả lập */}
            <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-3 text-gray-200">Mô tả</h3>
              <p className="text-gray-400 leading-relaxed">
                Tác phẩm nghệ thuật đa phương tiện này được lưu trữ an toàn trên mạng lưới IPFS và xác thực bởi Smart Contract trên Blockchain. Sở hữu tác phẩm này đồng nghĩa với việc bạn nắm giữ quyền sở hữu kỹ thuật số vĩnh viễn.
              </p>
            </div>

            {/* Giá và Nút hành động */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
              <p className="text-sm text-gray-400 mb-2 font-medium">Giá hiện tại</p>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-5xl font-extrabold text-white">♦ {nft.price.toFixed(3)}</span>
                <span className="text-xl text-gray-400 font-bold mb-1">ETH</span>
                <span className="text-lg text-green-400 font-medium mb-1 ml-2">(~$ {(nft.price * 3500).toLocaleString('en-US', {maximumFractionDigits: 0})})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => alert("Chức năng Mua sẽ được kích hoạt khi kết nối Smart Contract!")} className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transform hover:-translate-y-1 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)]"><DollarSign size={20} /> Mua ngay</button>
                <button className="w-full py-4 rounded-xl font-bold text-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">Đề nghị giá</button>
              </div>
            </div>
            
            <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700"> <h3 className="text-lg font-bold mb-4 text-gray-200 flex items-center gap-2"> <History size={18} className="text-blue-400" /> Lịch sử hoạt động </h3> <div className="space-y-3"> <div className="flex justify-between text-sm bg-gray-800 p-3 rounded-lg border border-gray-700"> <span className="text-green-400 font-medium">Minted (Đúc)</span> <span className="text-gray-400 font-mono">{formatAddress(nft.owner)}</span> <span className="text-gray-500">{new Date(nft.createdAt).toLocaleDateString('vi-VN')}</span> </div> </div> </div>

          </div>
        </div>
      </div>
    </div>
  );
}