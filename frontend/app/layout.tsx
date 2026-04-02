import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

// Import các component dùng chung
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // Thêm dòng này

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BODOI Marketplace",
  description: "DApp Marketplace cho nghệ thuật số",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen flex flex-col`}>
        {/* Navbar ở trên cùng */}
        <Navbar />
        
        {/* Nội dung chính sẽ tự động co giãn để đẩy Footer xuống đáy */}
        <main className="flex-grow">
          {children}
          <Toaster 
          position="top-center" // CHÍNH GIỮA PHÍA TRÊN
          reverseOrder={false}
          toastOptions={{
            // Tùy chỉnh giao diện cho ngầu giống Web3
            style: {
              background: '#374151', // Màu xám tối giống theme web của bạn
              color: '#fff',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #4B5563',
            },
          }}
        />
        </main>

        {/* Footer nằm ở dưới cùng */}
        <Footer />
      </body>
    </html>
  );
}