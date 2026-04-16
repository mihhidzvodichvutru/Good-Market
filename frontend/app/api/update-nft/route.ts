import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

// Dùng chìa khóa vạn năng để ghi đè RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nftId, walletAddress, newPrice, newDescription, signature } = await req.json();

    // 1. Soi chữ ký xem có đúng ví gửi lên không
    const message = "Tôi xác nhận cập nhật thông tin và đăng bán lại NFT này";
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Chữ ký giả mạo!" }, { status: 403 });
    }

    // 2. BẢO MẬT KÉP: Kiểm tra xem ví này có đúng là CHỦ SỞ HỮU của NFT không
    const { data: nft, error: fetchError } = await supabaseAdmin
      .from('nfts')
      .select('owner')
      .eq('id', nftId)
      .single();

    if (fetchError || !nft) throw new Error("Không tìm thấy NFT trên hệ thống");

    if (nft.owner.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Ông không phải chủ sở hữu, đừng hòng sửa giá!" }, { status: 403 });
    }

    // 3. Chuẩn rồi thì cập nhật vào DB
    const { error: updateError } = await supabaseAdmin
      .from('nfts')
      .update({ 
        price: parseFloat(newPrice), 
        description: newDescription 
      })
      .eq('id', nftId);

    if (updateError) throw updateError;

    const { error: historyError } = await supabaseAdmin
  .from('activity_history')
  .insert({
    nft_id: nftId,
    action_type: 'PRICE_CHANGED',
    from_wallet: walletAddress.toLowerCase(),
    price: parseFloat(newPrice)
  });

if (historyError) console.error("Lỗi ghi log lịch sử:", historyError);

return NextResponse.json({ success: true, message: "Đăng bán thành công!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}