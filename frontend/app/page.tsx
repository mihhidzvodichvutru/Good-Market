import Link from "next/link";
import { ShieldCheck, Zap, Database, Wallet, Upload, ShoppingCart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* SECTION 1: HERO (Màn hình chào mừng cũ - Giữ nguyên nhưng tinh chỉnh lại padding) */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-4 pt-20 pb-32">
        {/* Hiệu ứng ánh sáng nền mờ ảo (Glow effect) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Khám phá & Sưu tầm <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
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

      {/* SECTION 2: TẠI SAO CHỌN BODOI (Lùa bằng Công nghệ) */}
      <section className="py-24 bg-gray-950/50 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sức mạnh công nghệ vượt trội</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Chúng tôi xây dựng nền tảng dựa trên những công nghệ chuỗi khối tiên tiến nhất để bảo vệ quyền lợi của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Lưu trữ vĩnh cửu (IPFS)</h3>
              <p className="text-gray-400 leading-relaxed">
                Tác phẩm và siêu dữ liệu (Metadata) được phân mảnh và lưu trữ an toàn trên mạng lưới IPFS. Không một ai, kể cả chúng tôi, có thể xóa hay sửa đổi tác phẩm của bạn.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-purple-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Giao dịch Ký quỹ An toàn</h3>
              <p className="text-gray-400 leading-relaxed">
                Hợp đồng thông minh (Smart Contract) đóng vai trò trung gian minh bạch. Tiền trao cháo múc - Không sợ lừa đảo, không sợ bị giam vốn.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-pink-500/50 transition-colors group">
              <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-pink-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Phí Gas cực thấp</h3>
              <p className="text-gray-400 leading-relaxed">
                Tối ưu hóa mã nguồn hợp đồng để tiết kiệm tối đa chi phí giao dịch cho cả người mua và người bán khi hoạt động trên mạng lưới.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HƯỚNG DẪN THAM GIA (Lùa bằng sự dễ dàng) */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trở thành nhà sưu tầm trong 3 bước</h2>
            <p className="text-gray-400">Tham gia vào thế giới Web3 chưa bao giờ dễ dàng đến thế.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 border border-gray-700 shadow-lg relative">
                <Wallet className="text-gray-300" size={32} />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 font-bold flex items-center justify-center text-sm border-2 border-gray-900">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Kết nối ví</h3>
              <p className="text-gray-400 text-sm">Cài đặt MetaMask và kết nối chỉ bằng một cú click chuột để tạo danh tính ẩn danh.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 border border-gray-700 shadow-lg relative">
                <Upload className="text-gray-300" size={32} />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 font-bold flex items-center justify-center text-sm border-2 border-gray-900">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Tạo & Đúc NFT</h3>
              <p className="text-gray-400 text-sm">Tải hình ảnh của bạn lên IPFS, điền thông tin và đúc (Mint) thành tài sản số độc nhất.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 border border-gray-700 shadow-lg relative">
                <ShoppingCart className="text-gray-300" size={32} />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-pink-600 font-bold flex items-center justify-center text-sm border-2 border-gray-900">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Giao dịch</h3>
              <p className="text-gray-400 text-sm">Đăng bán tác phẩm của bạn hoặc tìm kiếm, thu thập những bộ sưu tập từ nghệ sĩ khác.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION (Chốt sale) */}
      <section className="py-20 bg-gradient-to-t from-blue-900/20 to-gray-900 border-t border-gray-800 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Bạn đã sẵn sàng bước vào không gian mới?</h2>
          <p className="text-gray-400 mb-8">Hàng ngàn tác phẩm kỹ thuật số đang chờ đợi chủ nhân đích thực. Đừng bỏ lỡ cơ hội định hình lại tương lai của nghệ thuật.</p>
          <Link 
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-gray-900 transition-all hover:bg-gray-200 hover:scale-105"
          >
            Bắt đầu giao dịch ngay
          </Link>
        </div>
      </section>

    </div>
  );
}