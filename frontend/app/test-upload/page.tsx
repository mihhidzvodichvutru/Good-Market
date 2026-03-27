"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Ê, bạn chưa chọn file kìa!");

    setUploading(true);
    setIpfsUrl("");

    try {
      // Đóng gói dữ liệu để gửi lên API của bạn
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);

      // Gọi vào cái API route.ts tụi mình viết ban nãy
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setIpfsUrl(data.ipfsUrl);
      } else {
        alert("Upload xịt rồi: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi kết nối mạng!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-900 text-white flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Test Upload lên Pinata IPFS 🚀</h1>
      
      <form onSubmit={handleUpload} className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md flex flex-col gap-4">
        <div>
          <label className="block mb-2 font-semibold">Tên bài nhạc / NFT:</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none" 
            placeholder="Ví dụ: Lời Hứa Cấp 3..."
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Mô tả:</label>
          <textarea 
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none" 
            placeholder="Cảm hứng sáng tác..."
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Chọn File (Ảnh hoặc MP3):</label>
          <input 
            type="file" 
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 cursor-pointer" 
          />
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className={`mt-4 p-3 rounded font-bold transition-all ${uploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
        >
          {uploading ? "Đang đẩy lên IPFS (đợi xíu nha)..." : "Bấm để Upload!"}
        </button>
      </form>

      {/* Khu vực hiển thị kết quả */}
      {ipfsUrl && (
        <div className="mt-8 p-4 bg-green-800 border border-green-500 rounded-lg w-full max-w-md break-words">
          <h2 className="font-bold text-xl mb-2 text-green-200">🎉 Thành công rực rỡ!</h2>
          <p>Link IPFS của bạn đây:</p>
          <a href={`https://moccasin-given-monkey-514.mypinata.cloud/ipfs/${ipfsUrl.replace("ipfs://", "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline font-mono text-sm">
            {ipfsUrl}
          </a>
        </div>
      )}
    </div>
  );
}