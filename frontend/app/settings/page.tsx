"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Image as ImageIcon, Save, Loader2, Camera, ArrowLeft } from "lucide-react"; // Bổ sung ArrowLeft
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: ""
  });

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

  // Hàm xử lý Upload ảnh lên IPFS (Thông qua API ông bạn IPFS đã viết)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Đang tải ảnh lên IPFS...");

    try {
      const data = new FormData();
      data.append("file", file);

      // Gọi API upload của bên ông bạn IPFS
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();

      if (json.ipfsUrl) {
        setFormData(prev => ({ ...prev, avatar_url: json.ipfsUrl }));
        toast.success("Tải ảnh lên thành công!", { id: toastId });
      }
    } catch (error) {
      toast.error("Lỗi khi tải ảnh!", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentAccount) {
      toast.error("Vui lòng kết nối ví trước khi lưu hồ sơ!");
      return;
    }

    setIsSaving(true);
    try {
      // Ánh xạ dữ liệu sang chuẩn tên biến mà Backend yêu cầu
      const payload = {
        wallet_address: currentAccount,
        username: formData.username,
        bio: formData.bio,
        avatar_url: formData.avatar_url 
      };

      // Đổi method thành POST theo code mẫu
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Hồ sơ đã được lưu thành công!");
      } else {
        // Bắt lỗi từ backend trả về nếu có
        const errorData = await res.json();
        toast.error(`Lỗi: ${errorData.error || "Không thể lưu"}`);
      }
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      toast.error("Lỗi hệ thống khi lưu hồ sơ!");
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
        
        {/* 👇 KHU VỰC ĐIỀU HƯỚNG VÀ TIÊU ĐỀ 👇 */}
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <h1 className="text-4xl font-black mb-8">Cài đặt Hồ sơ</h1>
        {/* 👆 KẾT THÚC KHU VỰC TIÊU ĐỀ 👆 */}

        {/* Bọc 2 cột vào một div riêng để không bị lỗi layout */}
        <div className="flex flex-col md:flex-row gap-10">
          
          {/* Cột trái: Chỉnh ảnh đại diện */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-800 bg-gray-900 flex items-center justify-center">
                {formData.avatar_url ? (
                  <img src={resolveIpfs(formData.avatar_url)} className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-gray-700" />
                )}
                {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
              </div>
              <label className="absolute bottom-2 right-2 p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-all cursor-pointer shadow-lg">
                <Camera size={20} />
                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              </label>
            </div>
            <p className="mt-4 text-sm text-gray-500">Kích thước khuyến nghị: 500x500px</p>
          </div>

          {/* Cột phải: Form thông tin */}
          <div className="flex-1 bg-[#1a202c] border border-gray-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Thông tin cá nhân</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Nghệ danh</label>
                <input type="text" name="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Tiểu sử</label>
                <textarea name="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none resize-none" />
              </div>
              <button onClick={handleSave} disabled={isSaving || isUploading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Lưu thay đổi</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}