import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
        Khám phá & Sưu tầm <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Nghệ Thuật Số
        </span>
      </h1>
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
        BODOI Marketplace là nền tảng phi tập trung giúp bạn dễ dàng mua bán và lưu trữ vĩnh viễn các tác phẩm nghệ thuật trên mạng lưới IPFS.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/explore"
          className="rounded-full bg-blue-600 px-8 py-3 font-bold text-white transition-all hover:bg-blue-500"
        >
          Khám phá ngay
        </Link>
        <Link 
          href="/mint"
          className="rounded-full bg-transparent border border-gray-600 px-8 py-3 font-bold text-white transition-all hover:bg-gray-800"
        >
          Đăng bán tác phẩm
        </Link>
      </div>
    </div>
  );
}