import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Nhận thêm biến actionIntent từ Frontend
    const { nftId, walletAddress, signature, actionIntent } = await req.json();

    // 1. Kiểm tra chữ ký chống Spam (Khớp 100% với Frontend)
    const actionText = actionIntent === 'unlike' ? "BỎ Like" : "Like";
    const message = `Tôi xác nhận ${actionText} tác phẩm NFT ID: ${nftId}`;
    
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Chữ ký không hợp lệ hoặc bị giả mạo!" }, { status: 403 });
    }

    // 2. Kiểm tra xem user đã like chưa
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('nft_id', nftId)
      .eq('user_wallet', walletAddress.toLowerCase())
      .single();

    if (existingLike) {
      // Đã like -> Bấm phát nữa là BỎ LIKE (Xóa khỏi DB)
      await supabaseAdmin.from('likes').delete().eq('id', existingLike.id);
      return NextResponse.json({ success: true, action: 'unliked' });
    } else {
      // Chưa like -> THÊM LIKE
      await supabaseAdmin.from('likes').insert({
        nft_id: nftId,
        user_wallet: walletAddress.toLowerCase()
      });
      return NextResponse.json({ success: true, action: 'liked' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}