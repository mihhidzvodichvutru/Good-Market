"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase"; 
import { Copy, Check, Search, Filter, Grid, Image as ImageIcon, Video, Music, Loader2 } from "lucide-react";

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

export default function ProfilePage() {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"owned" | "created">("owned");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  
  const artistName = "Nghệ sĩ Ẩn danh";

  const resolveIpfsUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
      return url.replace("ipfs://", `${gateway}/ipfs/`);
    }
    return url;
  };

  // 1. Kết nối và lấy ví hiện tại
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0].toLowerCase());
          } else {
            setIsLoading(false); 
          }
        } catch (err) {
          console.error("Lỗi lấy thông tin ví:", err);
        }
      }
    };
    checkWallet();
  }, []);

// 2. CHỌC THẲNG DATABASE: Lấy tất cả NFT liên quan đến ví này
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!currentAccount) return;
      setIsLoading(true);
      
      try {
        // SỬA Ở ĐÂY: Dùng .ilike thay vì .or để không bị lỗi thiếu cột.
        // Tạm thời chỉ lọc theo cột 'owner' đã có sẵn trong Database.
        const { data, error } = await supabase
          .from('nfts')
          .select('*')
          .or(`owner.ilike.${currentAccount},creator.ilike.${currentAccount}`)
          .order('id', { ascending: false });

        if (error) {
          console.error("Chi tiết lỗi từ Supabase:", error); // In rõ lỗi ra console để dễ debug
          throw error;
        }

        if (data) {
          const formattedData: NFT[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            owner: (item.owner || "").toLowerCase(),
            // Vì database chưa có cột creator, ta tạm lấy owner làm creator luôn để giao diện không bị sập
            creator: (item.creator || item.owner || "").toLowerCase(), 
            image: item.image,
            coverImage: item.cover_image,
            mediaType: item.media_type || "image",
          }));
          setNfts(formattedData);
        }
      } catch (err) {
        console.error("Lỗi quá trình tải NFT:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserNFTs();
  }, [currentAccount]);

  // 3. TÁCH BẠCH 2 DANH SÁCH RÕ RÀNG THEO LUẬT CỦA BẠN
  // Lọc ra danh sách Đang Sở Hữu
  const ownedNfts = nfts.filter(nft => nft.owner === currentAccount);
  // Lọc ra danh sách Đã Tạo
  const createdNfts = nfts.filter(nft => nft.creator === currentAccount);

  // Tính toán số liệu hiển thị trên màn hình
  const totalOwnedValue = ownedNfts.reduce((sum, nft) => sum + nft.price, 0);

  // Chọn danh sách để render dựa trên Tab đang bấm
  const currentTabNfts = activeTab === "owned" ? ownedNfts : createdNfts;

  // Cuối cùng là bộ lọc thanh tìm kiếm
  const displayNfts = currentTabNfts.filter(nft => 
    nft.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAvatarGradient = (address: string) => {
    if (!address) return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    const color1 = `#${address.slice(2, 8)}`;
    const color2 = `#${address.slice(address.length - 6)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  if (!currentAccount && !isLoading) {
    return (
      <div className="min-h-screen bg-[#0e111a] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-2">Chưa kết nối ví</h1>
        <p className="text-gray-400 mb-8">Vui lòng kết nối ví MetaMask trên thanh Menu để xem hồ sơ của bạn.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e111a] text-white pb-20">
      
      {/* 1. BANNER */}
      <div className="w-full h-64 md:h-80 relative bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-[#0e111a] opacity-80"></div>
      </div>

      {/* 2. KHU VỰC THÔNG TIN */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:justify-between items-start">
          
          <div className="flex flex-col -mt-20 relative z-10 mb-6 md:mb-0">
            <div 
              className="w-36 h-36 rounded-full border-4 border-[#0e111a] shadow-2xl mb-4"
              style={{ background: generateAvatarGradient(currentAccount) }}
            ></div>
            
            <div className="mb-1">
              <h1 className="text-3xl font-black">{artistName}</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-800/60 rounded-full px-4 py-1.5 border border-gray-700/50 hover:bg-gray-700/60 cursor-pointer transition-colors" onClick={copyToClipboard}>
                <span className="font-mono text-gray-300 text-sm">
                  {currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : "Đang tải..."}
                </span>
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
              </div>
            </div>
          </div>

          <div className="flex gap-8 md:mt-6 bg-[#1a202c]/50 p-6 rounded-2xl border border-gray-800/50 backdrop-blur-sm">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tổng Giá Trị Tài Sản</span>
              <span className="text-2xl font-black text-white">{totalOwnedValue.toFixed(3)} ETH</span>
            </div>
          </div>
        </div>

        {/* 3. ĐIỀU HƯỚNG TABS (CÓ ĐẾM SỐ LƯỢNG RIÊNG) */}
        <div className="flex gap-6 border-b border-gray-800 mt-10">
          <button onClick={() => setActiveTab("owned")} className={`pb-4 font-bold text-lg transition-colors relative ${activeTab === "owned" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Sở hữu <span className="ml-1.5 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{ownedNfts.length}</span>
            {activeTab === "owned" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>}
          </button>
          
          <button onClick={() => setActiveTab("created")} className={`pb-4 font-bold text-lg transition-colors relative ${activeTab === "created" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Đã tạo <span className="ml-1.5 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{createdNfts.length}</span>
            {activeTab === "created" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>}
          </button>
        </div>

        {/* 4. THANH TÌM KIẾM */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài sản..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a202c] border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 5. LƯỚI HIỂN THỊ NFT */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-gray-400">Đang đồng bộ dữ liệu từ Database...</p>
          </div>
        ) : displayNfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-800 rounded-3xl">
            <Grid size={48} className="text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Chưa có tài sản nào ở mục này</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {displayNfts.map((nft) => (
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
                      <span className="text-xs text-gray-500 font-medium">Giá bán</span>
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
  );
}