// lib/contract.ts

// Chép chính xác cái địa chỉ 0xD1C... của ông trên Remix vào đây
export const BODOI_CONTRACT_ADDRESS = "0xD1C7c49886594F722747D5196394FBe19902C500";

// ABI rút gọn: Chỉ khai báo đúng 2 hàm mình cần dùng để code cực nhẹ
export const BODOI_CONTRACT_ABI = [
  "function mintNFT(string memory tokenURI, uint256 price) public returns (uint256)",
  "function buyNFT(uint256 tokenId) public payable"
];