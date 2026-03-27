// Gọi 3 cái file JSON từ trong thư mục contracts ra
import addressesJson from "./contracts/addresses.json";
import nftJson from "./contracts/BODOINFT.json";
import marketplaceJson from "./contracts/NFTMarketplace.json";

// 1. Trích xuất Địa chỉ (Sổ đỏ)
// LƯU Ý: Đại ca mở file addresses.json ra xem tên biến bên trong nó ghi là gì 
// (ví dụ "NFTMarketplace" hay "Marketplace") để sửa chữ ở dưới cho khớp nhé!
export const NFT_ADDRESS = addressesJson.BODOINFT; 
export const MARKETPLACE_ADDRESS = addressesJson.NFTMarketplace;

// 2. Trích xuất ABI (Sách hướng dẫn sử dụng)
export const NFT_ABI = nftJson.abi || nftJson;
export const MARKETPLACE_ABI = marketplaceJson.abi || marketplaceJson;