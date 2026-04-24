"use client";

import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../../lib/contract";
import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { UserCircle, Tag, Clock, Package, ArrowLeft, Loader2, DollarSign, History, Music, Play, Pause, Volume2, Video as VideoIcon, Camera, Heart, Edit } from "lucide-react";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

// 1. Cập nhật Model dữ liệu (Thêm coverImage)
interface NFT {
  id: number;
  token_id?: number | null;
  name: string;
  description: string;
  price: number;
  owner: string;
  creator: string; 
  creatorName?: string; 
  image: string; // Media gốc (mp3, mp4, ảnh)
  coverImage?: string; // Ảnh bìa album/thumbnail
  mediaType: "image" | "video" | "audio";
  isTrending: boolean;
  createdAt: string; 
}
interface Activity {
  id: string;
  action_type: 'MINTED' | 'LISTED' | 'PRICE_CHANGED' | 'SOLD' | 'DELISTED';
  from_wallet: string;
  to_wallet?: string;
  price?: number;
  created_at: string;
}

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
      setIsPlaying(false); // Cập nhật state NGAY khi pause
    } else {
      // Ép trình duyệt đợi hàm play() chạy xong rồi mới cập nhật state
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error("Lỗi phát nhạc:", error.message);
          setIsPlaying(false); // Reset lại nút bấm nếu lỗi
        });
      }
    }
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

// Component chính
export default function NFTDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
          }
        } catch (err) {
          console.error("Lỗi lấy thông tin ví:", err);
        }
      }
    };
    checkWallet();
  }, []);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      setIsLoading(true);
      try {
        // Lần hỏi 1: Lấy thông tin NFT
        const { data: nftData, error: nftError } = await supabase
          .from('nfts')
          .select('*')
          .eq('id', id)
          .single();

        if (nftError) {
          console.error("Lỗi khi tải chi tiết NFT:", nftError.message);
          return;
        }

        if (nftData) {
          const creatorAddress = nftData.creator || nftData.owner;
          let fetchedCreatorName = "Nghệ sĩ Ẩn danh"; // Tên mặc định

          // Lần hỏi 2: Cầm cái ví creator sang bảng users hỏi tên
          if (creatorAddress) {
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .ilike('wallet_address', creatorAddress) // Dùng ilike để không phân biệt chữ hoa/thường
              .single();
            
            if (userData && userData.username) {
              fetchedCreatorName = userData.username;
            }
          }

          const formattedNft: NFT = {
            id: nftData.id,
            token_id: nftData.token_id,
            name: nftData.name,
            description: nftData.description,
            price: parseFloat(nftData.price),
            owner: nftData.owner,
            creator: creatorAddress,
            creatorName: fetchedCreatorName, // Nhét cái tên vừa lấy được vào đây
            image: nftData.image,
            coverImage: nftData.cover_image,
            mediaType: nftData.media_type || "image", 
            isTrending: nftData.is_trending,
            createdAt: nftData.created_at,
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

  // --- HÀM 1: Lấy tổng số Like và xem user đã like chưa ---
  useEffect(() => {
    const fetchLikes = async () => {
      if (!nft) return;
      // Đếm tổng số tim
      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('nft_id', nft.id);
      setLikesCount(count || 0);

      // Kiểm tra xem ví hiện tại đã thả tim chưa
      if (currentAccount) {
        const { data } = await supabase.from('likes').select('id').eq('nft_id', nft.id).eq('user_wallet', currentAccount.toLowerCase()).single();
        setIsLiked(!!data);
      }
    };
    fetchLikes();
  }, [nft, currentAccount]);

  const fetchActivityHistory = async () => {
  if (!nft) return;
  setIsHistoryLoading(true);
  try {
    const { data, error } = await supabase
      .from('activity_history')
      .select('*')
      .eq('nft_id', nft.id)
      .order('created_at', { ascending: false }); // Mới nhất hiện lên đầu

    if (error) throw error;
    setActivities(data || []);
  } catch (err) {
    console.error("Lỗi tải lịch sử:", err);
  } finally {
    setIsHistoryLoading(false);
  }
};

// Gọi hàm này trong useEffect khi nft.id thay đổi
useEffect(() => {
  fetchActivityHistory();
}, [nft?.id]);

  // --- HÀM 2: Giao tiếp MetaMask khi bấm thả tim (Đã fix UX) ---
  const handleLike = async () => {
    if (!currentAccount) return toast.error("Vui lòng kết nối ví để thả tim!");
    if (!nft) return;

    setIsLiking(true);
    
    // 1. Phân loại hành động để hiện chữ cho đúng
    const isUnliking = isLiked; // Nếu đang có tim -> Hành động là Bỏ tim
    const actionText = isUnliking ? "BỎ Like" : "Like";
    const toastMessage = isUnliking ? "để hủy like..." : "để like...";
    
    const toastId = toast.loading(`🦊 Ký xác nhận trên MetaMask ${toastMessage}`);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // 2. Chữ ký giờ đã tự động đổi theo trạng thái
      const message = `Tôi xác nhận ${actionText} tác phẩm NFT ID: ${nft.id}`;
      const signature = await signer.signMessage(message);

      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nftId: nft.id, 
          walletAddress: currentAccount, 
          signature,
          actionIntent: isUnliking ? 'unlike' : 'like' // Báo cho Backend biết ông đang ký câu nào
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Cập nhật giao diện
      if (data.action === 'liked') {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast.success("❤️ Like thành công!", { id: toastId });
      } else {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
        toast.success("💔 Đã bỏ like!", { id: toastId });
      }
    } catch (error: any) {
      if (error.code === 4001) toast.error("Bạn đã hủy ký.", { id: toastId });
      else toast.error("Lỗi: " + error.message, { id: toastId });
    } finally {
      setIsLiking(false);
    }
  };

  // --- HÀM XỬ LÝ MUA NFT ---
  const handleBuyNFT = async () => {
    if (!nft) return;
    
    if (!currentAccount) {
      return toast.error("Vui lòng kết nối ví MetaMask trước khi mua!");
    }

    // Kiểm tra nháp off-chain (token_id bị NULL)
    if (nft.token_id === null || nft.token_id === undefined) {
      return toast.error("❌ Tác phẩm này chỉ là bản nháp off-chain (chưa có token_id)!");
    }

    if (currentAccount.toLowerCase() === (nft.owner || "").toLowerCase()) {
      return toast.error("Đại ca không thể tự mua lại tác phẩm của chính mình!");
    }

    setIsBuying(true);
    const loadingToast = toast.loading("🦊 Đang gọi MetaMask để chốt đơn...");
    
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      // Nhớ đảm bảo CONTRACT_ADDRESS và CONTRACT_ABI đã được import ở đầu file nhé!
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);

      const priceInWei = ethers.parseEther(nft.price.toString());

      const transaction = await contract.buyNFT(nft.token_id, { 
        value: priceInWei 
      });

      toast.loading("🔗 Đang chờ Blockchain xác nhận (khoảng 10s)...", { id: loadingToast });
      await transaction.wait(); 

      toast.loading("💾 Đang đồng bộ sổ đỏ lên hệ thống...", { id: loadingToast });

      const { error: updateError } = await supabase
        .from('nfts')
        .update({ 
          owner_address: currentAccount.toLowerCase(), 
          price: 0, 
          sold: true 
        })
        .eq('id', nft.id); 

      if (updateError) throw updateError;

      await supabase.from('activity_history').insert({
        nft_id: nft.id,
        action_type: 'SOLD',
        from_wallet: nft.owner.toLowerCase(),
        to_wallet: currentAccount.toLowerCase(),
        price: nft.price
      });
      

      toast.success("🎉 Chốt đơn thành công! Tác phẩm đã về tay!", { id: loadingToast });
      setTimeout(() => router.push('/profile'), 2000);

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.code === 'ACTION_REJECTED' 
        ? "Bạn đã từ chối giao dịch trên MetaMask" 
        : error.reason || "Giao dịch bị hủy do lỗi mạng hoặc thiếu ETH";
      toast.error("Thất bại: " + errorMessage, { id: loadingToast });
    } finally { 
      setIsBuying(false); 
    }
  };

  // 1. Hàm thực thi việc Xóa (Chỉ chạy khi người dùng bấm "Đồng ý" trên Toast)
  const executeDelete = async () => {
    if (!nft) return;
    const loadingToast = toast.loading("⏳ Đang dọn dẹp dữ liệu trên IPFS và Database...");

    try {
      const cidsToDelete = [nft.image]; 
      if (nft.coverImage) cidsToDelete.push(nft.coverImage); 

      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cids: cidsToDelete })
      });

      const { error: dbError } = await supabase
        .from('nfts')
        .delete()
        .eq('id', nft.id);

      if (dbError) throw dbError;

      toast.success("🗑️ Đã xóa sạch bong kin kít!", { id: loadingToast });
      
      // Đợi 1.5 giây cho người dùng nhìn thấy thông báo rồi mới đẩy về trang chủ
      setTimeout(() => {
        window.location.href = '/explore';
      }, 1500);

    } catch (error: any) {
      console.error("Lỗi khi xóa:", error);
      toast.error("Lỗi khi xóa: " + error.message, { id: loadingToast });
    }
  };

  // 2. Hàm kích hoạt Pop-up hỏi xác nhận (Thay thế cho window.confirm)
  const handleDeleteNFT = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-800 shadow-2xl rounded-2xl border border-gray-700 pointer-events-auto flex flex-col overflow-hidden`}>
        {/* Tiêu đề & Nội dung */}
        <div className="p-5">
          <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
            🚨 Xác nhận thu hồi?
          </h3>
          <p className="text-sm text-gray-400">
            Hành động này sẽ xóa dữ liệu trên Database và Unpin toàn bộ file gốc trên IPFS. <b className="text-red-400">Không thể hoàn tác!</b>
          </p>
        </div>
        
        {/* Khu vực Nút bấm */}
        <div className="flex border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={() => {
              toast.dismiss(t.id); // Đóng pop-up
              executeDelete();     // Gọi hàm xóa ở trên
            }}
            className="w-full border-r border-gray-700 p-4 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            Chắc chắn Xóa
          </button>
          <button
            onClick={() => toast.dismiss(t.id)} // Chỉ đóng pop-up, không làm gì cả
            className="w-full p-4 text-sm font-bold text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    ), { duration: Infinity }); // Đặt Infinity để pop-up không tự tắt, bắt người dùng phải bấm nút
  };

  const handleSaveEdit = async () => {
    if (!nft || !currentAccount) return;
    
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error("Giá bán phải lớn hơn 0!");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("🦊 Vui lòng ký xác nhận trên MetaMask...");

    try {
      // 1. Gọi MetaMask lên ký xác nhận
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // Câu thần chú này phải khớp 100% với bên Backend
      const message = "Tôi xác nhận cập nhật thông tin và đăng bán lại NFT này";
      const signature = await signer.signMessage(message);

      // 2. Gửi lên API để kiểm duyệt và lưu
      toast.loading("Đang đồng bộ dữ liệu lên hệ thống...", { id: toastId });
      
      const res = await fetch('/api/update-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId: nft.id,
          walletAddress: currentAccount,
          newPrice: editPrice,
          newDescription: editDescription,
          signature
        })
      });

      // 1. Chờ Backend trả lời và kiểm tra lỗi TRƯỚC TIÊN
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Cập nhật giao diện thành công
      toast.success("Đăng bán lại thành công!", { id: toastId });
      setNft({ ...nft, price: parseFloat(editPrice), description: editDescription });
      setIsEditing(false);

      // 3. Tải lại lịch sử SAU KHI Backend đã tự động ghi log xong
      fetchActivityHistory();

    } catch (error: any) {
      console.error(error);
      if (error.code === 4001 || error.message.includes("user rejected")) {
        toast.error("Bạn đã hủy ký xác nhận.", { id: toastId });
      } else {
        toast.error(error.message || "Lỗi khi lưu!", { id: toastId });
      }
    } finally {
      setIsSaving(false);
    }
  };

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
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />  Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />  Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- CỘT TRÁI: HIỂN THỊ ĐA PHƯƠNG TIỆN BỰ CHÀ BÁ --- */}
          <div className="relative aspect-square rounded-3xl bg-gray-800 border border-gray-700 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
            
            {/* TRƯỜNG HỢP 1: LÀ HÌNH ẢNH (Up 1 file ảnh gốc) */}
            {nft.mediaType === "image" && (
              <img src={resolveIpfsUrl(nft.image)} alt={nft.name} className="w-full h-full object-cover" />
            )}

            {/* TRƯỜNG HỢP 2: LÀ VIDEO (Up 2 file: cover chui vào `poster`, mp4 chui vào `src`) */}
            {nft.mediaType === "video" && (
              <video 
                src={resolveIpfsUrl(nft.image)} 
                // controls 
                autoPlay 
                muted // Cần muted để autoplay trơn tru trên trình duyệt
                loop 
                playsInline // Quan trọng cho iOS
                className="w-full h-full object-contain bg-black" 
                poster={resolveIpfsUrl(nft.coverImage)} // 3. Nâng cấp Video: Gắn ảnh bìa làm thumbnail (poster)
              />
            )}

            {/* TRƯỜNG HỢP 3: LÀ ÂM THANH (Up 2 file: cover làm hình nền, mp3 để phát custom) */}
            {nft.mediaType === "audio" && (
              <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                {/* 3. Nâng cấp Audio: Hiển thị Ảnh bìa nếu có */}
                {nft.coverImage ? (
                  <img src={resolveIpfsUrl(nft.coverImage)} alt={`${nft.name} Cover`} className="w-full h-full object-cover" />
                ) : (
                  // Giao diện mặc định nếu không có cover image
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-6 relative">
                    <div className="w-48 h-48 bg-gradient-to-tr from-green-500 to-blue-500 rounded-full animate-spin-slow flex items-center justify-center border-2 border-green-500/50 shadow-lg">
                        <div className="w-12 h-12 bg-gray-900 rounded-full"></div>
                    </div>
                    <Music className="text-green-400 absolute opacity-10" size={128} />
                  </div>
                )}
                 
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
              <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex-1">
                  {nft.name}
                </h1>
                
                {/* NÚT THẢ TIM CHỐNG BOT */}
                <button 
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border-2 transition-all shrink-0 ${
                    isLiked 
                      ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' 
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <Heart size={24} className={`transition-transform ${isLiked ? 'fill-red-500 scale-110' : 'scale-100 hover:scale-110'}`} />
                  <span className="text-lg">{likesCount}</span>
                </button>
              </div>
              <div className="mb-6 text-lg flex items-center gap-2">
                <span className="text-gray-400 font-medium">Tạo bởi</span>
                <Link 
                  href={`/profile/${nft.creator}`} 
                  className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {nft.creatorName && nft.creatorName !== "Nghệ sĩ Ẩn danh" 
                    ? nft.creatorName 
                    : formatAddress(nft.creator)}
                </Link>
              </div>
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

            {/* --- 4. KHU VỰC ĐẶC BIỆT CHO ÂM THANH: TRÌNH PHÁT CUSTOM GIỐNG SPOTIFY --- */}
            {nft.mediaType === "audio" && (
              <AudioPlayer src={resolveIpfsUrl(nft.image)} />
            )}

            {/* --- 1. KHU VỰC MÔ TẢ --- */}
            <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-3 text-gray-200">Mô tả chi tiết</h3>
              {isEditing ? (
                // Nếu đang Edit -> Hiện ô Textarea để gõ
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  rows={4}
                  placeholder="Nhập mô tả mới cho tác phẩm..."
                />
              ) : (
                // Nếu bình thường -> Hiện chữ tĩnh
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {nft.description || "Tác giả chưa cung cấp mô tả cho tác phẩm này."}
                </p>
              )}
            </div>

            {/* --- 2. KHU VỰC GIÁ VÀ NÚT HÀNH ĐỘNG --- */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl mt-6">
              <p className="text-sm text-gray-400 mb-2 font-medium">Giá hiện tại</p>
              
              {isEditing ? (
                // Nếu đang Edit -> Hiện ô Input nhập số
                <div className="mb-6 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">♦</span>
                  <input 
                    type="number" 
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full text-3xl font-extrabold bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ví dụ: 0.5"
                    step="0.001"
                  />
                </div>
              ) : (
                // Nếu bình thường -> Hiện số tĩnh (Giữ nguyên phần tính USD của ông)
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-5xl font-extrabold text-white">♦ {nft.price.toFixed(3)}</span>
                  <span className="text-xl text-gray-400 font-bold mb-1">ETH</span>
                  <span className="text-lg text-green-400 font-medium mb-1 ml-2">
                    (~$ {(nft.price * 3500).toLocaleString('en-US', {maximumFractionDigits: 0})})
                  </span>
                </div>
              )}
              
              {/* --- 3. ĐIỀU KIỆN HIỂN THỊ NÚT BẤM THEO PHÂN QUYỀN --- */}
              {currentAccount?.toLowerCase() === nft.owner.toLowerCase() ? (
                // LÀ CHỦ SỞ HỮU
                isEditing ? (
                  // Trạng thái 1: Đang bật form chỉnh sửa
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="py-4 rounded-xl font-bold text-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="py-4 rounded-xl font-bold text-lg text-white bg-blue-600 hover:bg-blue-500 flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={20}/> : "Lưu & Đăng bán"}
                    </button>
                  </div>
                ) : (
                  // Trạng thái 2: Hiển thị bình thường (như cũ)
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        // Đổ dữ liệu cũ vào state trước khi bật form
                        setEditPrice(nft.price.toString());
                        setEditDescription(nft.description || "");
                        setIsEditing(true);
                      }}
                      className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gray-700 hover:bg-gray-600 transition-colors shadow-lg"
                    >
                      ✏️ Chỉnh sửa & Bán
                    </button>
                    <button 
                      onClick={handleDeleteNFT}
                      className="w-full py-4 rounded-xl font-bold text-lg text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-lg"
                    >
                      🗑️ Thu hồi & Xóa 
                    </button>
                  </div>
                )
              ) : (
                // KHÁCH XEM -> Hiện Mua / Đề nghị giá
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleBuyNFT} 
                    disabled={isBuying}
                    className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg text-white transform transition-all ${
                      isBuying 
                        ? "bg-gray-600 cursor-not-allowed opacity-70" 
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:-translate-y-1 shadow-[0_10px_20px_rgba(37,99,235,0.3)]"
                    }`}
                  >
                    {isBuying ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> 
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <DollarSign size={20} /> 
                        Mua ngay
                      </>
                    )}
                  </button>
                  <button className="w-full py-4 rounded-xl font-bold text-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                    Đề nghị giá
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700">
  <h3 className="text-lg font-bold mb-4 text-gray-200 flex items-center gap-2">
    <History size={18} className="text-blue-400" /> Lịch sử hoạt động
  </h3>

  <div className="space-y-4">
    {isHistoryLoading ? (
      // 1. KHI ĐANG TẢI: Hiện 2 khung xương nhấp nháy
      [1, 2].map((i) => (
        <div key={i} className="h-16 bg-gray-800/50 animate-pulse rounded-xl w-full"></div>
      ))
    ) : (
      <>
        {/* 2. RENDER LỊCH SỬ TỪ DATABASE (Thay đổi giá, Đã bán,...) */}
        {activities.map((act) => {
          let icon = <Tag size={16} />;
          let label = "Hoạt động";
          let colorClass = "text-gray-400";

          switch (act.action_type) {
            case 'MINTED':
              icon = <Package size={16} />;
              label = "Đã đúc (Minted)";
              colorClass = "text-green-400";
              break;
            case 'LISTED':
              icon = <Tag size={16} />;
              label = "Đã niêm yết";
              colorClass = "text-blue-400";
              break;
            case 'PRICE_CHANGED':
              icon = <Edit size={16} />;
              label = "Thay đổi giá";
              colorClass = "text-yellow-400";
              break;
            case 'SOLD':
              icon = <DollarSign size={16} />;
              label = "Đã bán";
              colorClass = "text-purple-400";
              break;
          }

          return (
            <div key={act.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-900 ${colorClass}`}>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-xs text-gray-500">
                    bởi <span className="text-blue-400">{act.from_wallet.slice(0, 6)}...{act.from_wallet.slice(-4)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                {act.price && (
                  <p className="font-black text-white text-sm">♦ {act.price} ETH</p>
                )}
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {new Date(act.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          );
        })}

        {/* 3. DÒNG "ĐÃ ĐÚC" CHỐT SỔ (Dành cho các NFT cũ chưa có log MINTED trong DB) */}
        {!activities.some(act => act.action_type === 'MINTED') && (
          <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-900 text-green-400">
                <Package size={16} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Đã đúc (Minted)</p>
                <p className="text-xs text-gray-500">
                  bởi <span className="text-blue-400">{nft?.creator?.slice(0, 6) || "0x000"}...</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {nft?.createdAt ? new Date(nft.createdAt).toLocaleDateString('vi-VN') : "Vừa xong"}
              </p>
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}