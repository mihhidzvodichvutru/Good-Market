import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- [GET] LẤY THÔNG TIN HỒ SƠ ---
// Cách dùng: GET /api/profile?wallet=0xAbCd...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Ông chưa truyền địa chỉ ví (wallet) kìa!" }, { status: 400 });
    }

    // Lấy thông tin từ bảng users
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet.toLowerCase()) // Chuyển hết về chữ thường cho chuẩn chỉ
      .single();

    // Lỗi PGRST116 của Supabase nghĩa là "Không tìm thấy dữ liệu" (Ví mới tinh chưa tạo profile)
    if (error && error.code !== "PGRST116") throw error;

    // Nếu tìm thấy thì trả về data, chưa thấy thì trả về một profile rỗng mặc định
    return NextResponse.json(
      data || { 
        wallet_address: wallet, 
        username: "Người chơi ẩn danh", 
        bio: "Chưa có tiểu sử...", 
        avatar_url: "https://via.placeholder.com/150" // Ảnh mặc định 
      }
    );

  } catch (error: any) {
    console.error("Lỗi lấy Profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- [POST] TẠO MỚI HOẶC CẬP NHẬT HỒ SƠ ---
// Cách dùng: Gửi JSON body chứa { walletAddress, username, bio, avatarUrl }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, username, bio, avatarUrl } = body;

    if (!walletAddress || !username) {
      return NextResponse.json({ error: "Bắt buộc phải có địa chỉ ví và Tên hiển thị!" }, { status: 400 });
    }

    // Tuyệt kỹ UPSERT: Có rồi thì ghi đè, chưa có thì tạo mới
    const { data, error } = await supabase
      .from("users")
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        username: username,
        bio: bio || "",
        avatar_url: avatarUrl || "",
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address' // Báo cho Supabase biết lấy cột này ra làm chuẩn để xét xem nên Insert hay Update
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