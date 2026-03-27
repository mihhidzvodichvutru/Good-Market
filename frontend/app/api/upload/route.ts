import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export async function POST(request: Request) {
  // 1. Lấy chìa khóa
  const rawJwt = process.env.PINATA_JWT || "";
  const cleanJwt = rawJwt.replace(/["']/g, "").trim();

  // 2. Khởi tạo SDK
  const pinata = new PinataSDK({
    pinataJwt: cleanJwt,
    pinataGateway: "moccasin-given-monkey-514.mypinata.cloud",
  });

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const name = data.get("name") as string;
    const description = data.get("description") as string;

    // 3. Upload File MP3/Ảnh
    const fileUpload = await pinata.upload.public.file(file);
    const fileCid = fileUpload.cid;

    // 4. Upload Metadata JSON
    const metadata = {
      name: name,
      description: description,
      image: `ipfs://${fileCid}` 
    };
    const jsonUpload = await pinata.upload.public.json(metadata);

    return NextResponse.json({ ipfsUrl: `ipfs://${jsonUpload.cid}` }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}