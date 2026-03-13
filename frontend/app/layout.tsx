import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        </main>

        {/* Footer nằm ở dưới cùng */}
        <Footer />
      </body>
    </html>
  );
}