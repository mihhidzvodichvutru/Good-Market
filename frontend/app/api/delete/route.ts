// File: app/api/delete/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cid } = await request.json();

    if (!cid) {
      return NextResponse.json({ error: "Thiếu mã CID" }, { status: 400 });
    }

    // Xử lý an toàn: Nếu Frontend gửi lên "ipfs://bafk..." thì mình tự động cắt lấy mã CID thôi
    const cleanCid = cid.replace("ipfs://", "");

    // Đã thêm dấu backtick (`) ở link fetch và chuỗi Bearer
    const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cleanCid}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    if (!res.ok) {
      // Đọc thêm chi tiết lỗi từ Pinata để dễ debug hơn
      const errorData = await res.text();
      throw new Error(`Lỗi từ Pinata khi xóa file: ${errorData}`);
    }

    return NextResponse.json({ success: true, message: "Đã xóa thành công khỏi kho Pinata!" });
  } catch (error: any) {
    console.error("Lỗi xóa IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}