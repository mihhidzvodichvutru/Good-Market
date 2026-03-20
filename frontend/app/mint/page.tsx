"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, Video, Music } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation"; 

export default function MintNFT() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Thêm State để lưu trữ loại file đang upload
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isMinting, setIsMinting] = useState(false); 

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleSetFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleSetFile(e.dataTransfer.files[0]);
  };

// LOGIC NHẬN DIỆN LOẠI FILE VÀ TỰ ĐỘNG ĐIỀN TÊN
  const handleSetFile = (selectedFile: File) => {
    const fileType = selectedFile.type;
    
    if (fileType.startsWith("image/")) {
      setMediaType("image");
    } else if (fileType.startsWith("video/")) {
      setMediaType("video");
    } else if (fileType.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      alert("Chỉ hỗ trợ file Hình ảnh, Video hoặc Âm thanh!");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // 1. Lấy tên gốc của file
    const originalName = selectedFile.name; 
    
    // 2. Cắt bỏ đuôi mở rộng (VD: "bức tranh đẹp.png" -> "bức tranh đẹp")
    // Dùng Regex tìm dấu chấm cuối cùng và xóa mọi thứ sau nó
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, ""); 
    
    // 3. Tự động ném vào ô Tên tác phẩm (nếu người dùng chưa nhập gì)
    // Dùng if (!name) để tránh việc vô tình xóa mất tên người dùng đã lỡ gõ trước đó
    if (!name) {
      setName(nameWithoutExtension);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !price) {
      alert("Vui lòng điền đầy đủ thông tin và chọn file!");
      return;
    }

    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          alert("🦊 Vui lòng kết nối ví MetaMask!");
          return;
        }

        setIsMinting(true);

        // --- GIẢ LẬP TRẢ VỀ LINK IPFS TƯƠNG ỨNG VỚI LOẠI FILE ---
        // (Để web hiển thị đúng trước khi BE làm xong API)
        let fakeIpfsLink = "";
        if (mediaType === "image") fakeIpfsLink = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=500";
        if (mediaType === "video") fakeIpfsLink = "https://www.w3schools.com/html/mov_bbb.mp4"; // Link video test
        if (mediaType === "audio") fakeIpfsLink = "https://www.w3schools.com/html/horse.ogg"; // Link audio test
        
        // GHI DỮ LIỆU VÀO SUPABASE (Gửi kèm media_type)
        const { error } = await supabase
          .from('nfts')
          .insert([
            {
              name: name,
              price: parseFloat(price),
              owner: accounts[0],
              image: fakeIpfsLink, 
              media_type: mediaType, // <--- THÊM DÒNG NÀY ĐỂ LƯU PHÂN LOẠI
              is_trending: false
            }
          ]);

        if (error) throw error;

        alert(`🎉 Đúc tác phẩm ${mediaType.toUpperCase()} thành công!`);
        router.push('/explore'); 
        
      } catch (error: any) {
        console.error("Lỗi:", error);
        alert("Có lỗi: " + error.message);
        setIsMinting(false);
      }
    } else {
      alert("Vui lòng cài đặt MetaMask!");
    }
  };

  // Hàm render giao diện xem trước (Preview) tùy theo loại file
  const renderPreview = () => {
    if (!previewUrl) return null;

    return (
      <div className="relative w-full h-full group flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden">
        {mediaType === "image" && (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        )}
        {mediaType === "video" && (
          <video src={previewUrl} controls className="w-full h-full object-contain bg-black" />
        )}
        {mediaType === "audio" && (
          <div className="flex flex-col items-center gap-4 p-6 w-full">
            <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full animate-[spin_4s_linear_infinite] flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
            </div>
            <audio src={previewUrl} controls className="w-full max-w-[250px]" />
          </div>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={removeFile} className="bg-red-500/80 text-white p-2 rounded-full hover:bg-red-500 hover:scale-110">
            <X size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Đúc tác phẩm mới</h1>
          <p className="text-gray-400 text-lg">Hỗ trợ Ảnh, Video và Âm thanh. Kích thước tối đa 100MB.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* CỘT TRÁI: Khu vực kéo thả */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UploadCloud className="text-blue-400" /> Tệp đa phương tiện <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4 flex gap-3">
              <span className="flex items-center gap-1"><ImageIcon size={14}/> JPG/PNG</span>
              <span className="flex items-center gap-1"><Video size={14}/> MP4</span>
              <span className="flex items-center gap-1"><Music size={14}/> MP3/WAV</span>
            </p>

            <div
              className={`relative flex flex-col items-center justify-center w-full aspect-square md:aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-300 ${
                isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              {/* Cập nhật accept để lấy mọi định dạng */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*,audio/*"
              />
              
              {previewUrl ? renderPreview() : (
                <div className="flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <div className="flex gap-2 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><ImageIcon className="text-blue-400" /></div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><Video className="text-purple-400" /></div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><Music className="text-green-400" /></div>
                  </div>
                  <p className="text-lg font-bold text-gray-200">Nhấp để chọn tệp</p>
                  <p className="text-sm text-gray-400">hoặc kéo thả vào đây</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Form (Giữ nguyên) */}
          <div className="flex flex-col space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Tên tác phẩm <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bản nhạc mùa đông" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Mô tả chi tiết</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Câu chuyện đằng sau tác phẩm..." rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" />
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
                isMinting ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02]"
              }`}
            >
              {isMinting ? "Đang xử lý tải lên..." : "Đúc tác phẩm (Mint)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}