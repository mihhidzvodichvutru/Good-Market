import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // 1. Đọc địa chỉ 2 cái chợ đại ca vừa Deploy
  const frontendPath = path.join(__dirname, "../../frontend/contracts/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(frontendPath, "utf8"));

  const NFT = await ethers.getContractAt("BODOINFT", addresses.BODOINFT);
  const Marketplace = await ethers.getContractAt("NFTMarketplace", addresses.NFTMarketplace);

  // ⚠️ ĐẠI CA ĐIỀN CÁI SỐ ID CAO NHẤT CỦA SUPABASE VÀO ĐÂY NHÉ!
  const targetID = 41; 

  console.log(`🚀 Đang bơm ${targetID} món hàng vào Blockchain để khớp với Supabase...`);

  // Bắt đầu vòng lặp đúc hàng tốc độ cao
  for (let i = 0; i < targetID; i++) {
    // 1. Đúc NFT giả
    const mintTx = await NFT.mint("ipfs://bodoistd-dummy-data");
    await mintTx.wait();

    // 2. Cấp quyền bán
    const approveTx = await NFT.setApprovalForAll(addresses.NFTMarketplace, true);
    await approveTx.wait();

    // 3. Quăng lên kệ chợ với giá mặc định 0.001 ETH
    const listTx = await Marketplace.listNFT(addresses.BODOINFT, i, ethers.parseEther("0.001"));
    await listTx.wait();

    console.log(`✅ Đã bơm xong món hàng ID Blockchain = ${i + 1}`);
  }

  console.log("🎉 ĐẠI CÔNG CÁO THÀNH! Blockchain và Supabase đã ôm lấy nhau!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});