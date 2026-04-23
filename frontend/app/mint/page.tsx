"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, Video, Music, ImagePlus, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation"; 
import toast from 'react-hot-toast';

// 1. NHẬP HÀM GỌI SMART CONTRACT TỪ WEB3
import { createMarketItem } from "../../lib/web3"; 

// 2. ĐỊNH NGHĨA KHUÔN MẪU ĐỂ CHỮA BỆNH "ANY" CỦA METAMASK
interface WindowEthereum {
  request: (args: { method: string }) => Promise<string[]>;
}

export default function MintNFT() {
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isMinting, setIsMinting] = useState(false); 

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleSetFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleSetFile(e.dataTransfer.files[0]);
  };

  const handleSetFile = (selectedFile: File) => {
    const fileType = selectedFile.type;
    
    if (fileType.startsWith("image/")) {
      setMediaType("image");
      removeCover(); 
    } else if (fileType.startsWith("video/")) {
      setMediaType("video");
    } else if (fileType.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      toast.error("Chỉ hỗ trợ file Hình ảnh, Video hoặc Âm thanh!");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, ""); 
    if (!name) setName(nameWithoutExtension);
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setMediaType("image");
    removeCover();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleSetCover(e.target.files[0]);
  };

  const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCover(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleSetCover(e.dataTransfer.files[0]);
  };

  const handleSetCover = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Ảnh bìa bắt buộc phải là file hình ảnh (JPG/PNG)!");
      return;
    }
    setCoverFile(selectedFile);
    setCoverPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreviewUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !name || !price) {
      toast.error("Vui lòng điền đầy đủ thông tin và chọn file gốc!");
      return;
    }

    if ((mediaType === "audio" || mediaType === "video") && !coverFile) {
      toast.error("🎧 Mảng Video/Âm thanh bắt buộc phải có Ảnh bìa (Thumbnail)!");
      return;
    }

    // ĐÃ SỬA: Loại bỏ lỗi 'any' bằng cách ép kiểu chuẩn (Dòng 124 cũ)
    const ethWindow = window as unknown as { ethereum?: WindowEthereum };

    // ĐÃ SỬA: Thay thế window.ethereum bằng ethWindow.ethereum (Dòng 127 cũ)
    if (typeof window !== "undefined" && ethWindow.ethereum) {
      const toastId = toast.loading("⏳ Đang khởi tạo và đẩy dữ liệu lên IPFS...");
      try {
        const accounts = await ethWindow.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          toast.error("🦊 Vui lòng kết nối ví MetaMask!");
          return;
        }

        setIsMinting(true);

        const formData = new FormData();
        formData.append("file", file); 
        formData.append("name", name);
        formData.append("description", description);
        
        if (coverFile) {
          formData.append("cover", coverFile);
        }

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorDetails = await uploadResponse.text();
          console.error("Chi tiết lỗi từ API/Pinata:", errorDetails);
          throw new Error(`Upload IPFS thất bại: ${errorDetails}`);
        }

        const uploadData = await uploadResponse.json();
        const metadataIpfsUrl = uploadData.ipfsUrl; 
        
        // --- 🚀 BƯỚC QUAN TRỌNG NHẤT: ĐÚC NFT LÊN BLOCKCHAIN ---
        toast.loading("💎 Đang khắc tác phẩm lên Blockchain...", { id: toastId });
        await createMarketItem(metadataIpfsUrl, price);
        // ------------------------------------------------------

        const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
        const gatewayUrl = metadataIpfsUrl.replace("ipfs://", `${gateway}/ipfs/`);
        
        const metadataResponse = await fetch(gatewayUrl);
        const metadataJson = await metadataResponse.json();

        const realCoverLink = metadataJson.image; 
        const realMediaLink = metadataJson.animation_url || metadataJson.image; 

        toast.loading("💾 Đang đồng bộ lên giao diện chợ...", { id: toastId });
        const { error: dbError } = await supabase
          .from('nfts')
          .insert([
            {
              name: name,
              description: description,
              price: parseFloat(price),
              owner: accounts[0],
              image: realMediaLink,      
              cover_image: realCoverLink, 
              media_type: mediaType,
              is_trending: false
            }
          ]);

        if (dbError) throw dbError;

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-800 shadow-2xl rounded-2xl border border-green-500/30 pointer-events-auto flex flex-col overflow-hidden`}>
            <div className="p-5 flex items-start gap-4 bg-gradient-to-b from-green-500/10 to-transparent">
              <div className="text-4xl animate-bounce">🎉</div>
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-1">
                  Đúc siêu phẩm thành công!
                </h3>
                {/* ĐÃ SỬA: Lỗi dấu ngoặc kép (unescaped entities) ở dòng 204 cũ */}
                <p className="text-sm text-gray-300 leading-relaxed">
                  Tác phẩm <span className="font-bold text-green-400">&quot;{name}&quot;</span> đã chính thức có mặt trên Blockchain!
                </p>
              </div>
            </div>
            
            <div className="flex border-t border-gray-700 bg-gray-900/80">
              <button
                onClick={() => {
                  toast.dismiss(t.id); 
                  window.location.href = '/explore'; 
                }}
                className="w-full border-r border-gray-700 p-4 text-sm font-bold text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex justify-center items-center gap-2"
              >
                🚀 Xem trên Chợ
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id); 
                }}
                className="w-full p-4 text-sm font-bold text-gray-400 hover:bg-gray-700 hover:text-white transition-all flex justify-center items-center gap-2"
              >
                🔄 Mint tiếp
              </button>
            </div>
          </div>
        ), { id: toastId, duration: Infinity });
        
      } catch (error: unknown) { // ĐÃ SỬA: Thay 'any' bằng 'unknown' (Dòng 234 cũ)
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";
        console.error("Lỗi:", errorMessage);
        toast.error("Có lỗi: " + errorMessage, { id: toastId });
      } finally {
        setIsMinting(false);
      }
    } else {
      toast.error("Vui lòng cài đặt MetaMask!");
    }
  };

  const renderPreview = () => {
    if (!previewUrl) return null;
    return (
      <div className="relative w-full h-full group flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden">
        {mediaType === "image" && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
        {mediaType === "video" && <video src={previewUrl} controls className="w-full h-full object-contain bg-black" />}
        {mediaType === "audio" && (
          <div className="flex flex-col items-center gap-4 p-6 w-full">
            <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full animate-spin-slow flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
            </div>
            <audio src={previewUrl} controls className="w-full max-w-[250px]" />
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={removeFile} className="bg-red-500/80 text-white p-2 rounded-full hover:bg-red-500 hover:scale-110"><X size={20} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3">
            <Sparkles className="text-blue-500" size={40} /> Đúc Tác Phẩm Mới
          </h1>
          <p className="text-gray-400 text-lg">Hỗ trợ Ảnh, Video và Âm thanh. Kích thước tối đa 25MB.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="flex flex-col gap-6">
            
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UploadCloud className="text-blue-400" /> Tệp gốc (Media) <span className="text-red-500">*</span>
              </h2>
              <div
                className={`relative flex flex-col items-center justify-center w-full aspect-square md:aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-300 ${
                  isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !previewUrl && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                {previewUrl ? renderPreview() : (
                  <div className="flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                    <div className="flex gap-2 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><ImageIcon className="text-blue-400" /></div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><Video className="text-purple-400" /></div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><Music className="text-green-400" /></div>
                    </div>
                    <p className="text-lg font-bold text-gray-200">Nhấp để chọn tệp gốc</p>
                  </div>
                )}
              </div>
            </div>

            {(mediaType === "audio" || mediaType === "video") && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-300">
                  <ImagePlus className="text-green-400" size={20} /> Ảnh bìa Album <span className="text-red-500">*</span>
                </h2>
                <div
                  className={`relative flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                    isDraggingCover ? "border-green-500 bg-green-500/10 scale-[1.02]" : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                  onDragLeave={() => setIsDraggingCover(false)}
                  onDrop={handleCoverDrop}
                  onClick={() => !coverPreviewUrl && coverInputRef.current?.click()}
                >
                  <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/*" />
                  {coverPreviewUrl ? (
                    <div className="relative w-full h-full group rounded-2xl overflow-hidden flex items-center justify-center bg-gray-900">
                      <img src={coverPreviewUrl} alt="Cover Preview" className="h-full object-contain" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={removeCover} className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-500 hover:scale-110"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 cursor-pointer text-gray-400">
                      <ImageIcon size={24} className="mb-2 text-gray-500" />
                      <p className="text-sm font-medium text-gray-300">Tải ảnh bìa (Vuông)</p>
                      <p className="text-xs mt-1">Sẽ dùng làm hình nền trên Spotify/Explore</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Tên tác phẩm <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên sẽ tự điền nếu để trống..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Mô tả tác phẩm</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Kể câu chuyện về tác phẩm của bạn, ý nghĩa, cảm hứng..." 
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Giá niêm yết (ETH) <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.05" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-16 py-3 text-white focus:border-blue-500 outline-none" required />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 font-bold">ETH</div>
              </div>
            </div>

            <hr className="border-gray-800" />

            <button
              type="submit"
              disabled={isMinting}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 ${
                isMinting ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
              }`}
            >
              {isMinting ? "Đang đúc tác phẩm..." : "Đúc tác phẩm (Mint)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}