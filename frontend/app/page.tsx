import Link from "next/link";
import { ShieldCheck, Zap, Database, Wallet, Upload, ShoppingCart } from "lucide-react";
import ConnectWallet from "@/components/ConnectWallet";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans overflow-hidden relative">
      
      {/* HEADER: Chứa Logo và Nút Kết nối ví ở góc phải */}
      <header className="absolute top-0 w-full flex items-center justify-between px-8 py-6 z-50">
        <div className="text-2xl font-black tracking-tighter">
          BODOI<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">.NFT</span>
        </div>
        
        <ConnectWallet />
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-4 pt-32 pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Khám phá & Sưu tầm <br/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-500 to-pink-500">
            Nghệ Thuật Số Độc Bản
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          BODOI Marketplace là nền tảng phi tập trung thế hệ mới. Giao dịch an toàn, minh bạch và lưu trữ tác phẩm của bạn vĩnh viễn trên không gian Web3.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/explore"
            className="rounded-full bg-blue-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-blue-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            🚀 Khám phá ngay
          </Link>
          <Link 
            href="/mint"
            className="rounded-full bg-gray-800/50 border border-gray-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-gray-800 hover:border-gray-400"
          >
            Đăng bán tác phẩm
          </Link>
        </div>
      </section>

      {/* SECTION 2: TẠI SAO CHỌN BODOI */}
      <section className="py-24 bg-gray-950/50 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sức mạnh công nghệ vượt trội</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Chúng tôi xây dựng nền tảng dựa trên những công nghệ chuỗi khối tiên tiến nhất để bảo vệ quyền lợi của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Lưu trữ vĩnh cửu (IPFS)</h3>
              <p className="text-gray-400 leading-relaxed">
                Tác phẩm và siêu dữ liệu (Metadata) được phân mảnh và lưu trữ an toàn trên mạng lưới IPFS. Không một ai, kể cả chúng tôi, có thể xóa hay sửa đổi tác phẩm của bạn.
              </p>
            </div>
            {/* Các tính năng khác đệ rút gọn ở đây cho đỡ dài, đại ca cứ copy full bộ đệ gửi lúc nãy nhé */}
          </div>
        </div>
      </section>
    </div>
  );
}