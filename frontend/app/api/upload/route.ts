// File: app/api/delete/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let cidsToDelete: string[] = [];

    // Hỗ trợ cả 2 chuẩn: Gửi 1 chuỗi 'cid' hoặc gửi 1 mảng 'cids'
    if (body.cid) cidsToDelete.push(body.cid);
    if (body.cids && Array.isArray(body.cids)) cidsToDelete = [...cidsToDelete, ...body.cids];

    if (cidsToDelete.length === 0) {
      return NextResponse.json({ error: "Thiếu danh sách mã CID cần xóa!" }, { status: 400 });
    }

    // Làm sạch toàn bộ danh sách (cắt bỏ chữ ipfs:// và lấy đúng mã hash)
    const cleanCids = cidsToDelete
      .filter(Boolean) // Loại bỏ các giá trị null/rỗng
      .map(cid => cid.replace("ipfs://", "").replace("https://gateway.pinata.cloud/ipfs/", "").split("/")[0]);

    // Chạy vòng lặp để "khai tử" từng file một trên Pinata
    for (const cid of cleanCids) {
      console.log(`Đang dọn dẹp rác: ${cid}`);
      const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });
      
      // Nếu file đã bị xóa từ trước rồi thì thôi, không báo lỗi làm sập web
      if (!res.ok) {
        console.warn(`Cảnh báo: Không thể xóa ${cid} (Có thể đã bị xóa từ trước).`);
      }
    }

    return NextResponse.json({ success: true, message: `Đã dọn dẹp sạch sẽ ${cleanCids.length} file khỏi Pinata!` });
  } catch (error: any) {
    console.error("Lỗi xóa IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}