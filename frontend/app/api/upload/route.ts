import { NextResponse } from "next/server";

// --- [KHU VỰC 1: LÁ CHẮN CHỐNG SPAM (Rate Limiting)] ---
const rateLimitMap = new Map<string, { count: number; startTime: number }>();
const MAX_REQUESTS = 3; // Quá 3 lần/phút là sút
const TIME_WINDOW = 60 * 1000;

// --- [KHU VỰC 2: HÀM ĐẨY FILE LÊN IPFS] ---
async function uploadFileToPinata(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Lỗi đẩy file lên Pinata");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

// --- [KHU VỰC 3: XỬ LÝ CHÍNH] ---
export async function POST(request: Request) {
  try {
    // 🛡️ BƯỚC 1: KIỂM TRA BẢO MẬT
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown_ip";
    const currentTime = Date.now();
    const userRecord = rateLimitMap.get(ip) || { count: 0, startTime: currentTime };

    if (currentTime - userRecord.startTime > TIME_WINDOW) {
      userRecord.count = 1;
      userRecord.startTime = currentTime;
    } else {
      userRecord.count++;
      if (userRecord.count > MAX_REQUESTS) {
        console.warn(`🚨 Chặn IP: ${ip} vì spam nút Up đồ.`);
        return NextResponse.json(
          { error: "Thao tác quá nhanh người anh em! Đợi 1 phút rồi thử lại." },
          { status: 429 }
        );
      }
    }
    rateLimitMap.set(ip, userRecord);

    // 🚀 BƯỚC 2: BÊ NGUYÊN BẢN LÊN PINATA
    const data = await request.formData();
    const rawFile: File | null = data.get("file") as unknown as File;
    const rawCover: File | null = data.get("cover") as unknown as File;
    const name = data.get("name") as string;
    const description = data.get("description") as string;

    if (!rawFile) return NextResponse.json({ error: "Chưa chọn file!" }, { status: 400 });

    const isImage = rawFile.type.startsWith("image/");
    let coverUrl = "";
    let mediaUrl = "";

    if (isImage) {
      // Nếu là ảnh: Up thẳng bản gốc làm ảnh bìa luôn
      coverUrl = await uploadFileToPinata(rawFile);
    } else {
      // Nếu là Video/Nhạc: Bắt buộc phải có ảnh đại diện đi kèm
      if (!rawCover) return NextResponse.json({ error: "Video/Nhạc phải có ảnh bìa!" }, { status: 400 });
      coverUrl = await uploadFileToPinata(rawCover);
      mediaUrl = await uploadFileToPinata(rawFile); 
    }

    // ĐÓNG GÓI JSON METADATA CHUẨN WEB3
    const metadata: any = { name: name || "", description: description || "", image: coverUrl };
    if (mediaUrl) metadata.animation_url = mediaUrl;

    const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: JSON.stringify({ pinataContent: metadata, pinataMetadata: { name: `${name}_metadata.json` } }),
    });

    if (!jsonRes.ok) throw new Error("Lỗi đẩy file JSON lên kho!");
    const jsonData = await jsonRes.json();
    
    // Chốt đơn, nhả link IPFS về cho Frontend
    return NextResponse.json({ ipfsUrl: `ipfs://${jsonData.IpfsHash}` });
    
  } catch (error: any) {
    console.error("Lỗi Upload IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}