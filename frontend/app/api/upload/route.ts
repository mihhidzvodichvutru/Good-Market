import { NextResponse } from "next/server";

// Hàm phụ trợ: Tái sử dụng để đẩy file (giữ nguyên không đổi)
async function uploadFileToPinata(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Lỗi đẩy file lên Pinata");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    // Nhận dữ liệu
    const file: File | null = data.get("file") as unknown as File; // File gốc (Ảnh/Nhạc/Video)
    const cover: File | null = data.get("cover") as unknown as File; // Ảnh bìa (Chỉ cần khi up Nhạc/Video)
    const name = data.get("name") as string;
    const description = data.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "Thiếu file tác phẩm gốc!" }, { status: 400 });
    }

    // TỰ ĐỘNG PHÂN LOẠI FILE DỰA VÀO ĐỊNH DẠNG
    const isImage = file.type.startsWith("image/");
    const isMedia = file.type.startsWith("video/") || file.type.startsWith("audio/");

    let coverUrl = "";
    let mediaUrl = "";

    // XỬ LÝ THEO KỊCH BẢN
    if (isImage) {
      // Kịch bản 1: Up Ảnh NFT (Không cần file cover phụ)
      console.log("Phát hiện up Ảnh! Đang đẩy lên IPFS...");
      coverUrl = await uploadFileToPinata(file); // Lấy luôn ảnh này làm cover
    } 
    else if (isMedia) {
      // Kịch bản 2: Up Video hoặc Âm thanh (Bắt buộc phải có ảnh cover)
      if (!cover) {
        return NextResponse.json({ error: "Tác phẩm Nhạc/Video bắt buộc phải có Ảnh bìa!" }, { status: 400 });
      }
      console.log("Phát hiện up Media! Đang đẩy ảnh bìa...");
      coverUrl = await uploadFileToPinata(cover);
      
      console.log("Đang đẩy file Media gốc...");
      mediaUrl = await uploadFileToPinata(file);
    } 
    else {
      // Chặn các file rác (như .exe, .pdf, .docx...)
      return NextResponse.json({ error: "Chỉ hỗ trợ up Ảnh, Nhạc và Video!" }, { status: 400 });
    }

    // ĐÓNG GÓI METADATA CHUẨN OPENSEA
    const metadata: any = {
      name: name || "Tác phẩm ẩn danh",
      description: description || "",
      image: coverUrl, // Luôn phải có khóa này (là ảnh gốc hoặc ảnh bìa)
    };

    // Chỉ khi nào có file Media thì mới thêm dòng "animation_url"
    if (mediaUrl) {
      metadata.animation_url = mediaUrl;
    }

    // Đẩy Metadata lên Pinata
    console.log("Đang đẩy Hộ chiếu (JSON Metadata)...");
    const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `${name}_metadata.json` },
      }),
    });

    if (!jsonRes.ok) throw new Error("Lỗi đẩy file JSON");
    const jsonData = await jsonRes.json();

    // Hoàn thành xuất sắc!
    return NextResponse.json({ ipfsUrl: `ipfs://${jsonData.IpfsHash}` });
    
  } catch (error: any) {
    console.error("Lỗi hệ thống IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}