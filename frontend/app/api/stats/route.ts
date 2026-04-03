import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // 1. Đếm tổng số lượng NFT trên sàn
    const { count: totalNFTs, error: countError } = await supabase
      .from("nfts")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // 2. Kéo cột category về để đếm phân loại (Ảnh, Video, Nhạc)
    const { data: categoryData, error: categoryError } = await supabase
      .from("nfts")
      .select("category");
    
    if (categoryError) throw categoryError;

    const stats = {
      image: categoryData?.filter(i => i.category === "image").length || 0,
      video: categoryData?.filter(i => i.category === "video").length || 0,
      audio: categoryData?.filter(i => i.category === "audio").length || 0,
    };

    // 3. Lấy Top 5 NFT đắt nhất (Sắp xếp theo cột price giảm dần)
    const { data: topNFTs, error: topError } = await supabase
      .from("nfts")
      .select("name, price, image")
      .order("price", { ascending: false })
      .limit(5);

    if (topError) throw topError;

    // 4. Trả về toàn bộ dữ liệu dưới dạng JSON
    return NextResponse.json({
      totalNFTs: totalNFTs || 0,
      distribution: stats,
      topSales: topNFTs || [],
    });

  } catch (error: any) {
    console.error("Lỗi API Stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}