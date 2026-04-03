"use client";

import { useState, useEffect, useRef } from "react";
import { User, Image as ImageIcon, Save, Loader2, Camera, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // STATE MỚI: Dành cho luồng "Combo 2 API"
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Để hiển thị ảnh ngay lập tức chưa cần up
  
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) setCurrentAccount(accounts[0].toLowerCase());
      }
    };
    checkWallet();
  }, []);

  useEffect(() => {
    if (currentAccount) fetchProfile();
  }, [currentAccount]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile?wallet_address=${currentAccount}`);
      if (response.ok) {
        const data = await response.json();
        if (data) setFormData({
          username: data.username || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  // 1. NGƯỜI DÙNG CHỌN ẢNH -> CHỈ HIỂN THỊ PREVIEW, CHƯA UP LÊN IPFS
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // Tạo link ảo để xem trước ngay lập tức
  };

  // 2. BẤM NÚT LƯU -> CHẠY COMBO 2 API LIÊN HOÀN
  const handleSave = async () => {
    if (!currentAccount) {
      toast.error("Vui lòng kết nối ví trước khi lưu hồ sơ!");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Đang tiến hành lưu hồ sơ...");

    try {
      let finalAvatarUrl = formData.avatar_url; // Nếu không chọn ảnh mới, giữ nguyên link cũ

      // BƯỚC 1: UP ẢNH LÊN IPFS (Nếu có chọn ảnh mới)
      if (avatarFile) {
        toast.loading("1/2: Đang tải ảnh mới lên IPFS...", { id: toastId });
        const imgData = new FormData();
        imgData.append("file", avatarFile);

        // Gọi API upload-avatar của Backend
        const uploadRes = await fetch("/api/upload-avatar", { method: "POST", body: imgData });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(uploadJson.error || "Lỗi tải ảnh lên IPFS");
        finalAvatarUrl = uploadJson.avatarUrl; // Lấy link trả về từ Backend
      }

      // BƯỚC 2: GỌI API PROFILE ĐỂ LƯU DATABASE
      toast.loading("2/2: Đang lưu thông tin vào Database...", { id: toastId });
      
      const payload = {
        walletAddress: currentAccount,
        username: formData.username,
        bio: formData.bio,
        avatarUrl: finalAvatarUrl
      };

      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (profileRes.ok) {
        toast.success("Đã lưu hồ sơ và ảnh đại diện thành công!", { id: toastId });
        // Cập nhật lại form và xóa state file tạm
        setFormData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
        setAvatarFile(null);
        setPreviewUrl(null);
      } else {
        const errorData = await profileRes.json();
        toast.error(`Lỗi: ${errorData.error || "Không thể lưu"}`, { id: toastId });
      }

    } catch (error: any) {
      console.error("Lỗi khi lưu:", error);
      toast.error(`Lỗi hệ thống: ${error.message}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const resolveIpfs = (url: string) => {
    if (!url) return "";
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  };

  return (
    <div className="min-h-screen bg-[#0e111a] text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Nút Quay Lại & Tiêu đề */}
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>
        <h1 className="text-4xl font-black mb-8">Cài đặt Hồ sơ</h1>

        <div className="flex flex-col md:flex-row gap-10">
          
          {/* CỘT TRÁI: Chỉnh ảnh đại diện */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-800 bg-gray-900 flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                
                {/* Ưu tiên hiển thị Preview nếu vừa chọn ảnh, nếu không thì hiện ảnh từ DB */}
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : formData.avatar_url ? (
                  <img src={resolveIpfs(formData.avatar_url)} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User size={60} className="text-gray-700" />
                )}

              </div>
              <div className="absolute bottom-2 right-2 p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-all shadow-lg">
                <Camera size={20} />
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleAvatarSelect} accept="image/*" />
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">Kích thước khuyến nghị: 500x500px<br/>(Ảnh chưa được lưu cho đến khi bấm nút)</p>
          </div>

          {/* CỘT PHẢI: Form thông tin */}
          <div className="flex-1 bg-[#1a202c] border border-gray-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Thông tin cá nhân</h2>
            
            {isLoading ? (
               <div className="animate-pulse flex flex-col gap-4">
                 <div className="h-12 bg-gray-800 rounded-xl w-full"></div>
                 <div className="h-24 bg-gray-800 rounded-xl w-full"></div>
               </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Nghệ danh (Hiển thị trên sàn)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Ví dụ: CryptoPunk_99"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Tiểu sử ngắn (Bio)</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Kể cho mọi người nghe một chút về bạn..."
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-gray-800">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_5px_15px_rgba(37,99,235,0.3)]"
                  >
                    {isSaving ? <><Loader2 className="animate-spin" size={20}/> Đang lưu lên Blockchain...</> : <><Save size={20} /> Lưu toàn bộ thay đổi</>}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}