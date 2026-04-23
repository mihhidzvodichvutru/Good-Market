"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { buyMarketItem } from "../../../lib/web3"; 
import { 
  UserCircle, Tag, Clock, Package, ArrowLeft, Loader2, 
  DollarSign, History, Music, Play, Pause, Volume2 
} from "lucide-react";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";

// --- ĐỊNH NGHĨA KHUÔN MẪU DỮ LIỆU ĐỂ TRỊ LỖI ANY ---
interface NFTItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  owner: string;
  creator: string;
  creatorName: string;
  image: string;
  cover_image?: string;
  media_type: "image" | "video" | "audio";
}

// --- GIẢI MÃ LINK IPFS ---
const resolveIpfsUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
    return url.replace("ipfs://", `${gateway}/ipfs/`);
  }
  return url; 
};

// --- TRÌNH PHÁT NHẠC CUSTOM ---
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
    return () => audio.pause();
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); } 
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex flex-col gap-4 shadow-xl">
      <audio ref={audioRef} src={src} />
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
          <Music className="text-green-400" size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-200">Đang phát tác phẩm âm nhạc</p>
          <p className="text-xs text-gray-400">Chất lượng cao trên IPFS</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all">
          {isPlaying ? <Pause className="fill-white text-white" size={24}/> : <Play className="fill-white text-white" size={24}/>}
        </button>
        <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => {if(audioRef.current) audioRef.current.currentTime = Number(e.target.value)}} className="flex-grow h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500" />
      </div>
    </div>
  );
}

// --- COMPONENT CHÍNH ---
export default function NFTDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [nft, setNft] = useState<NFTItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) setCurrentAccount(accounts[0]);
      }
    };
    checkWallet();
  }, []);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      setIsLoading(true);
      try {
        const { data: nftData } = await supabase.from('nfts').select('*').eq('id', id).single();
        if (nftData) {
          const creatorAddress = nftData.creator || nftData.owner;
          const { data: userData } = await supabase.from('users').select('username').ilike('wallet_address', creatorAddress).single();
          setNft({ ...nftData, creatorName: userData?.username || "Nghệ sĩ Ẩn danh" });
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchNFTDetails();
  }, [id]);

  const handleBuyNFT = async () => {
    if (!nft) return;
    
    // Đảm bảo phải có ví người mua mới cho chốt đơn
    if (!currentAccount) {
      toast.error("Vui lòng kết nối ví MetaMask trước khi mua!");
      return;
    }

    setIsBuying(true);
    const loadingToast = toast.loading("⏳ Đang gọi MetaMask để chốt đơn...");
    try {
      // 1. Chốt đơn trên Blockchain
      await buyMarketItem(nft.id);

      // 2. 🚀 CẬP NHẬT CHỦ SỞ HỮU MỚI TRÊN SUPABASE (ĐÂY LÀ ĐOẠN ĐÃ ĐƯỢC ĐỆ THÊM VÀO)
      const { error: updateError } = await supabase
        .from('nfts')
        .update({ 
          owner: currentAccount, // Đổi tên sổ đỏ sang ví của đại ca
          sold: true             // Đánh dấu đã bán
        })
        .eq('id', nft.id);

      if (updateError) {
        console.error("Lỗi cập nhật chủ sở hữu trên Supabase:", updateError.message);
        toast.success("Mua thành công nhưng lỗi hiển thị!", { id: loadingToast });
      } else {
        toast.success("🎉 Chốt đơn thành công! Tác phẩm đã về tay đại ca!", { id: loadingToast });
      }

      // Đẩy thẳng về trang Profile sau 2 giây để khoe chiến tích
      setTimeout(() => router.push('/profile'), 2000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Giao dịch bị hủy hoặc xảy ra lỗi";
      toast.error("Thất bại: " + errorMessage, { id: loadingToast });
    } finally { 
      setIsBuying(false); 
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Đang tải...</div>;
  if (!nft) return <div className="text-white text-center py-20">Không tìm thấy tác phẩm!</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* MEDIA HIỂN THỊ */}
          <div className="relative aspect-square rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center shadow-2xl">
            {nft.media_type === "image" && <img src={resolveIpfsUrl(nft.image)} className="w-full h-full object-cover" />}
            {nft.media_type === "video" && <video src={resolveIpfsUrl(nft.image)} autoPlay muted loop playsInline className="w-full h-full object-contain bg-black" poster={resolveIpfsUrl(nft.cover_image)} />}
            {nft.media_type === "audio" && (
              <div className="w-full h-full flex items-center justify-center bg-gray-950">
                {nft.cover_image ? <img src={resolveIpfsUrl(nft.cover_image)} className="w-full h-full object-cover opacity-50" /> : <Music size={100} className="text-blue-500/20" />}
              </div>
            )}
          </div>

          {/* THÔNG TIN CHI TIẾT */}
          <div className="flex flex-col space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-4">{nft.name}</h1>
              <p className="text-blue-400 font-bold mb-6">Tạo bởi {nft.creatorName}</p>
              <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                <p className="text-xs text-gray-500 uppercase">Chủ sở hữu</p>
                <p className="text-sm font-mono text-blue-400">{nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</p>
              </div>
            </div>

            {nft.media_type === "audio" && <AudioPlayer src={resolveIpfsUrl(nft.image)} />}

            <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-3">Mô tả</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{nft.description || "Chưa có mô tả."}</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
              <p className="text-sm text-gray-400 mb-2">Giá niêm yết</p>
              {/* Note: Fix lỗi string không có toFixed bằng cách parse float/number */}
              <div className="text-5xl font-extrabold mb-8">♦ {Number(nft.price).toFixed(3)} <span className="text-xl text-gray-500">ETH</span></div>
              
              {currentAccount?.toLowerCase() === nft.owner.toLowerCase() ? (
                <button className="w-full py-4 rounded-xl font-bold bg-gray-700 text-white cursor-not-allowed">Đây là tác phẩm của đại ca</button>
              ) : (
                <button 
                  onClick={handleBuyNFT}
                  disabled={isBuying}
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  <DollarSign size={20} /> {isBuying ? "Đang giao dịch..." : "Mua ngay"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}