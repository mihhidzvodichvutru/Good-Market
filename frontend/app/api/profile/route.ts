import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers"; // <-- THÊM THƯ VIỆN NÀY ĐỂ SOI CHỮ KÝ

// Khởi tạo Supabase: BẮT BUỘC dùng Service Role Key để vượt qua RLS
// (Ông nhớ vào Supabase copy cái service_role key bỏ vào file .env nhé)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// --- [GET] LẤY THÔNG TIN HỒ SƠ (Giữ nguyên của ông) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Ông chưa truyền địa chỉ ví (wallet) kìa!" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("wallet_address", wallet.toLowerCase()) 
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json(
      data || { 
        wallet_address: wallet, 
        username: "Người chơi ẩn danh", 
        bio: "Chưa có tiểu sử...", 
        avatar_url: "https://via.placeholder.com/150" 
      }
    );

  } catch (error: any) {
    console.error("Lỗi lấy Profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- [POST] TẠO MỚI HOẶC CẬP NHẬT HỒ SƠ (Đã bọc thép) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Lấy thêm cái chữ ký (signature) từ frontend gửi lên
    const { walletAddress, username, bio, avatarUrl, signature } = body;

    // Chặn ngay nếu thiếu chữ ký
    if (!walletAddress || !username || !signature) {
      return NextResponse.json({ error: "Thiếu dữ liệu hoặc thiếu chữ ký xác thực!" }, { status: 400 });
    }

    // 1. DÙNG KÍNH LÚP SOI CHỮ KÝ
    const message = `Tôi xác nhận cập nhật hồ sơ trên chợ NFT cho ví: ${walletAddress}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // 2. NẾU SAI VÍ -> ĐUỔI VỀ
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Chữ ký giả mạo hoặc bạn đang xài ví khác!" }, { status: 403 });
    }

    // 3. NẾU CHUẨN CHỦ VÍ -> CHO PHÉP DÙNG UPSERT
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        username: username,
        bio: bio || "",
        avatar_url: avatarUrl || ""
      }, {
        onConflict: 'wallet_address' 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Lưu hồ sơ thành công!", profile: data });

  } catch (error: any) {
    console.error("Lỗi cập nhật Profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}