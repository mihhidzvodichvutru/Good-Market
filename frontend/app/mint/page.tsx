"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

export default function MintNFT() {
  // Các state lưu trữ dữ liệu form
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  // Quản lý trạng thái kéo thả
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn file bằng cách click
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSetFile(e.target.files[0]);
    }
  };

  // Xử lý khi người dùng thả file vào khung
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSetFile(e.dataTransfer.files[0]);
    }
  };

  // Hàm chung để set file và tạo link preview ảnh
  const handleSetFile = (selectedFile: File) => {
    // Kiểm tra định dạng ảnh cơ bản
    if (!selectedFile.type.includes("image")) {
      alert("Vui lòng chỉ tải lên file hình ảnh!");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // Xóa ảnh đã chọn
  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Xử lý khi bấm nút "Tạo NFT"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Kiểm tra Form đã điền đủ chưa
    if (!file || !name || !price) {
      alert("Vui lòng điền đầy đủ thông tin và chọn ảnh!");
      return;
    }

    // 2. KIỂM TRA ĐĂNG NHẬP VÍ METAMASK
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        // Hỏi MetaMask xem có tài khoản nào đang kết nối với web không
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length === 0) {
          // Nếu mảng rỗng -> Chưa kết nối
          alert("🦊 Vui lòng kết nối ví MetaMask ở góc phải màn hình trước khi tạo NFT!");
          return; // Chặn luôn, không cho chạy code bên dưới
        }

        const userAddress = accounts[0]; // Lấy địa chỉ ví của người dùng

        // 3. Nếu mọi thứ OK, tiến hành xử lý
        console.log("Đang xử lý tạo NFT...", { 
          owner: userAddress, 
          name, 
          description, 
          price, 
          file 
        });
        
        alert(`Hoàn hảo! NFT của bạn sẽ được đúc bởi ví: ${userAddress.substring(0, 6)}... Chờ BE nối API IPFS nhé!`);
        
      } catch (error) {
        console.error("Lỗi khi kiểm tra ví:", error);
      }
    } else {
      alert("Bạn chưa cài đặt MetaMask. Vui lòng cài đặt để sử dụng tính năng này!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Tiêu đề trang */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Đúc tác phẩm mới</h1>
          <p className="text-gray-400 text-lg">Tải ảnh của bạn lên hệ thống IPFS và tạo Smart Contract.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* CỘT TRÁI: Khu vực kéo thả ảnh */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="text-blue-400" /> Hình ảnh / Tác phẩm <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">Hỗ trợ JPG, PNG, GIF. Kích thước tối đa 10MB.</p>

            <div
              className={`relative flex flex-col items-center justify-center w-full aspect-square md:aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              {/* Input file bị ẩn đi */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />

              {previewUrl ? (
                // Nếu đã có ảnh thì hiển thị ảnh
                <div className="relative w-full h-full group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={removeFile}
                      className="bg-red-500/80 text-white p-3 rounded-full hover:bg-red-500 transition-transform hover:scale-110"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                // Giao diện khi chưa có ảnh
                <div className="flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={40} className="text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-200 mb-1">Nhấp để tải lên</p>
                  <p className="text-sm text-gray-400">hoặc kéo thả file vào khu vực này</p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Form nhập thông tin */}
          <div className="flex flex-col space-y-8">
            
            {/* Tên NFT */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Tên tác phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: BODOI Art #001"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            {/* Mô tả NFT */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Câu chuyện đằng sau tác phẩm của bạn là gì?"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Giá bán */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Giá niêm yết (ETH) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.05"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-16 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 font-bold">
                  ETH
                </div>
              </div>
            </div>

            {/* Đường kẻ phân cách */}
            <hr className="border-gray-800" />

            {/* Nút Submit */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transform hover:-translate-y-1 transition-all duration-200 shadow-[0_10px_20px_rgba(37,99,235,0.3)]"
            >
              Đúc tác phẩm (Mint)
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}