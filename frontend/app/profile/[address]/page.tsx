"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase"; // Chú ý chỉnh lại đường dẫn cho đúng
import { Copy, Check, ArrowLeft, Grid, Image as ImageIcon, Video, Music, Loader2 } from "lucide-react";

interface NFT {
  id: number;
  name: string;
  price: number;
  owner: string;
  creator: string;
  image: string;
  coverImage?: string;
  mediaType: "image" | "video" | "audio";
}

interface UserProfile {
  username: string;
  bio: string;
  avatar_url: string;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const address = (params.address as string).toLowerCase(); // Lấy địa chỉ ví từ URL

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"owned" | "created">("created"); // Mặc định vào xem là thấy đồ người ta "Đã tạo" trước
  const [copied, setCopied] = useState(false);

  const resolveIpfsUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
      return url.replace("ipfs://", `${gateway}/ipfs/`);
    }
    return url;
  };

  // 1. CHỌC DATABASE: Lấy Thông tin User & Danh sách NFT cùng lúc
  useEffect(() => {
    const fetchProfileAndNFTs = async () => {
      if (!address) return;
      setIsLoading(true);
      
      try {
        // Lấy thông tin Tên, Avatar, Bio từ bảng users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .ilike('wallet_address', address)
          .single();

        if (userData) {
          setUserProfile({
            username: userData.username || "Nghệ sĩ Ẩn danh",
            bio: userData.bio || "Người dùng này chưa cập nhật tiểu sử.",
            avatar_url: userData.avatar_url || ""
          });
        }

        // Lấy toàn bộ NFT mà ví này Sở hữu HOẶC Đã tạo
        const { data: nftData, error: nftError } = await supabase
          .from('nfts')
          .select('*')
          .or(`owner.ilike.${address},creator.ilike.${address}`)
          .order('id', { ascending: false });

        if (nftError) throw nftError;

        if (nftData) {
          const formattedData: NFT[] = nftData.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            owner: (item.owner || "").toLowerCase(),
            creator: (item.creator || item.owner || "").toLowerCase(),
            image: item.image,
            coverImage: item.cover_image,
            mediaType: item.media_type || "image",
          }));
          setNfts(formattedData);
        }
      } catch (err) {
        console.error("Lỗi tải trang Profile công khai:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndNFTs();
  }, [address]);

  // Lọc danh sách theo Tab
  const ownedNfts = nfts.filter(nft => nft.owner === address);
  const createdNfts = nfts.filter(nft => nft.creator === address);
  const currentTabNfts = activeTab === "owned" ? ownedNfts : createdNfts;

  const totalOwnedValue = ownedNfts.reduce((sum, nft) => sum + nft.price, 0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAvatarGradient = (walletAddress: string) => {
    if (!walletAddress) return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    const color1 = `#${walletAddress.slice(2, 8)}`;
    const color2 = `#${walletAddress.slice(walletAddress.length - 6)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  return (
    <div className="min-h-screen bg-[#0e111a] text-white pb-20">
      
      {/* 1. BANNER & NÚT BACK */}
      <div className="w-full h-64 md:h-80 relative bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-[#0e111a] opacity-80"></div>
        <button 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
      </div>

      {/* 2. KHU VỰC THÔNG TIN */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:justify-between items-start gap-8">
          
          <div className="flex flex-col -mt-20 relative z-10">
            {/* Ảnh đại diện (Lấy từ IPFS hoặc Gradient) */}
            <div className="w-36 h-36 rounded-full border-4 border-[#0e111a] shadow-2xl mb-4 bg-gray-800 overflow-hidden flex items-center justify-center">
              {userProfile?.avatar_url ? (
                 <img src={resolveIpfsUrl(userProfile.avatar_url)} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                 <div className="w-full h-full" style={{ background: generateAvatarGradient(address) }}></div>
              )}
            </div>
            
            {/* Tên & Copy Ví */}
            <div className="mb-2">
              <h1 className="text-3xl font-black">{userProfile?.username || "Nghệ sĩ Ẩn danh"}</h1>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-gray-800/60 rounded-full px-4 py-1.5 border border-gray-700/50 hover:bg-gray-700/60 cursor-pointer transition-colors" onClick={copyToClipboard}>
                <span className="font-mono text-gray-300 text-sm">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
              </div>
            </div>

            {/* Tiểu sử (Bio) */}
            <p className="text-gray-400 max-w-md leading-relaxed">
              {userProfile?.bio || "Người dùng này chưa cập nhật tiểu sử."}
            </p>
          </div>

          <div className="flex gap-8 md:mt-6 bg-[#1a202c]/50 p-6 rounded-2xl border border-gray-800/50 backdrop-blur-sm w-full md:w-auto">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tổng Giá Trị (Đang sở hữu)</span>
              <span className="text-2xl font-black text-white">{totalOwnedValue.toFixed(3)} ETH</span>
            </div>
          </div>
        </div>

        {/* 3. ĐIỀU HƯỚNG TABS */}
        <div className="flex gap-6 border-b border-gray-800 mt-10">
          <button onClick={() => setActiveTab("created")} className={`pb-4 font-bold text-lg transition-colors relative ${activeTab === "created" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Đã tạo <span className="ml-1.5 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{createdNfts.length}</span>
            {activeTab === "created" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>}
          </button>

          <button onClick={() => setActiveTab("owned")} className={`pb-4 font-bold text-lg transition-colors relative ${activeTab === "owned" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Đang sở hữu <span className="ml-1.5 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{ownedNfts.length}</span>
            {activeTab === "owned" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>}
          </button>
        </div>

        {/* 4. LƯỚI HIỂN THỊ NFT */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <p className="text-gray-400">Đang tải hồ sơ nghệ sĩ...</p>
            </div>
          ) : currentTabNfts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-800 rounded-3xl">
              <Grid size={48} className="text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Trống</h3>
              <p className="text-gray-500">Nghệ sĩ này chưa có tác phẩm nào ở mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {currentTabNfts.map((nft) => (
                <Link href={`/explore/${nft.id}`} key={nft.id} className="group flex flex-col rounded-2xl bg-[#1a202c] border border-gray-800 hover:border-gray-600 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="aspect-square bg-gray-800 relative overflow-hidden flex items-center justify-center">
                    {nft.mediaType === "image" && <img src={resolveIpfsUrl(nft.image)} alt={nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                    {nft.mediaType === "video" && <img src={resolveIpfsUrl(nft.coverImage || nft.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                    {nft.mediaType === "audio" && (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        {nft.coverImage ? <img src={resolveIpfsUrl(nft.coverImage)} className="w-full h-full object-cover opacity-80" /> : <Music size={40} className="text-green-500/50" />}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white backdrop-blur-md"> 
                      {nft.mediaType === 'image' && <ImageIcon size={14}/>}
                      {nft.mediaType === 'video' && <Video size={14}/>}
                      {nft.mediaType === 'audio' && <Music size={14}/>}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-base text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">{nft.name}</h3>
                    <div className="mt-auto pt-3 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium">Giá</span>
                        <span className="font-bold text-white flex items-center gap-1"> 
                          <span className="text-blue-500 text-xs">♦</span> {nft.price} 
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}