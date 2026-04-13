import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo kết nối Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // Lấy ID của NFT từ URL (ví dụ: /api/transactions?nft_id=1)
    const { searchParams } = new URL(request.url);
    const nftId = searchParams.get("nft_id");

    if (!nftId) {
      return NextResponse.json({ error: "Vui lòng cung cấp mã nft_id!" }, { status: 400 });
    }

    // Truy vấn dữ liệu từ bảng transactions, sắp xếp từ mới nhất đến cũ nhất
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("nft_id", Number(nftId))
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ transactions: data });

  } catch (error: any) {
    console.error("Lỗi khi lấy lịch sử giao dịch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}