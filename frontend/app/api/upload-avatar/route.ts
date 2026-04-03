import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Chưa chọn ảnh đại diện!" }, { status: 400 });
    }

    // Đóng gói file gửi cho Pinata
    const pinataForm = new FormData();
    pinataForm.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: pinataForm,
    });

    if (!res.ok) throw new Error("Lỗi đẩy ảnh lên Pinata!");
    const pinataData = await res.json();

    // Trả về link chuẩn Web3
    return NextResponse.json({ avatarUrl: `ipfs://${pinataData.IpfsHash}` });

  } catch (error: any) {
    console.error("Lỗi Upload Avatar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}