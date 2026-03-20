import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("=========================================================");
  console.log("Starting deployment process...");
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log("=========================================================\n");

  // 1. Triển khai NFT
  console.log("Deploying BODOINFT contract...");
  const NFT = await hre.ethers.getContractFactory("BODOINFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment(); 
  const nftAddress = await nft.getAddress();
  console.log(`[+] BODOINFT deployed to: ${nftAddress}\n`);

  // 2. Triển khai Marketplace
  console.log("Deploying NFTMarketplace contract...");
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`[+] NFTMarketplace deployed to: ${marketplaceAddress}\n`);

  console.log("=========================================================");
  console.log("Deployment completed successfully.");
  console.log("=========================================================\n");

  // 3. Tự động xuất file cấu hình cho Frontend
  saveFrontendFiles(nftAddress, marketplaceAddress);
}

// Hàm phụ trợ tự động lấy ABI và Địa chỉ xuất ra file
function saveFrontendFiles(nftAddress: string, marketplaceAddress: string) {
  const contractsDir = path.join(__dirname, "..", "frontend-exports");

  // Tạo thư mục nếu chưa có
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  // 1. Lưu địa chỉ hợp đồng vào file addresses.json
  const addresses = {
    BODOINFT: nftAddress,
    NFTMarketplace: marketplaceAddress
  };
  fs.writeFileSync(
    path.join(contractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  // 2. Trích xuất và lưu file ABI
  const nftArtifact = hre.artifacts.readArtifactSync("BODOINFT");
  const marketplaceArtifact = hre.artifacts.readArtifactSync("NFTMarketplace");

  fs.writeFileSync(
    path.join(contractsDir, "BODOINFT.json"),
    JSON.stringify(nftArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "NFTMarketplace.json"),
    JSON.stringify(marketplaceArtifact, null, 2)
  );

  console.log("📦 Đã đóng gói thành công file ABI và Địa chỉ hợp đồng vào thư mục: backend/frontend-exports/");
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});