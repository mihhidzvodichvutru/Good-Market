import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-12 text-gray-400 mt-auto">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-extrabold text-blue-400 tracking-wider flex items-center gap-2 mb-4">
              <span className="text-white">BODOI</span> Exhibition
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Nền tảng Marketplace phi tập trung tiên phong dành cho cộng đồng yêu thích nghệ thuật số. Giao dịch an toàn, minh bạch và lưu trữ vĩnh viễn trên IPFS.
            </p>
          </div>

          {/* Cột 2: Đường dẫn nhanh */}
          <div>
            <h3 className="text-white font-semibold mb-4">Khám phá</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="hover:text-blue-400 transition-colors">Tất cả NFT</Link></li>
              <li><Link href="/explore" className="hover:text-blue-400 transition-colors">Nghệ thuật</Link></li>
              <li><Link href="/explore" className="hover:text-blue-400 transition-colors">Nhiếp ảnh</Link></li>
            </ul>
          </div>

          {/* Cột 3: Liên kết / Hỗ trợ */}
          <div>
            <h3 className="text-white font-semibold mb-4">Cộng đồng</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Twitter (X)</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Discord Server</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">GitHub Dự án</a></li>
            </ul>
          </div>
        </div>

        {/* Dòng bản quyền dưới cùng */}
        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>© {new Date().getFullYear()} BODOI Std. Đã đăng ký bản quyền.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}