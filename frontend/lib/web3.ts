import { ethers, Eip1193Provider } from "ethers";
import MarketplaceABI from "../contracts/NFTMarketplace.json";
// BẮT BUỘC THÊM DÒNG NÀY: Gọi ABI của file BODOINFT
import NFT_ABI from "../contracts/BODOINFT.json"; 
import Addresses from "../contracts/addresses.json";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

/**
 * Lấy Instance của Chợ
 */
export const getMarketplaceContract = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(Addresses.NFTMarketplace, MarketplaceABI.abi, signer);
  }
  throw new Error("Chưa cài MetaMask!");
};

/**
 * Lấy Instance của NFT (Để đúc và cấp quyền)
 */
export const getNFTContract = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    // Đảm bảo file addresses.json có dòng: "BODOINFT": "0x..."
    return new ethers.Contract(Addresses.BODOINFT, NFT_ABI.abi, signer); 
  }
  throw new Error("Chưa cài MetaMask!");
};

/**
 * KẾT NỐI VÍ
 */
export const connectWallet = async (): Promise<string | null> => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      return accounts[0] || null;
    } catch (error: unknown) {
      console.error("Đại ca từ chối kết nối:", error);
      return null;
    }
  }
  return null;
};

/**
 * CHỐT ĐƠN (Mua NFT)
 */
export const buyMarketItem = async (itemId: number) => {
  try {
    const contract = await getMarketplaceContract();
    const totalPriceInWei: bigint = await contract.getTotalPrice(itemId);
    
    const transaction = await contract.buyNFT(itemId, { value: totalPriceInWei });
    console.log("Đang chờ thợ mỏ xác nhận mua...");
    const receipt = await transaction.wait();
    return receipt;
  } catch (error: unknown) {
    let errorMessage = "Giao dịch thất bại rồi đại ca!";
    if (error instanceof Error) errorMessage = error.message;
    throw new Error(errorMessage);
  }
};

/**
 * LIÊN HOÀN 3 CHIÊU: ĐÚC & NIÊM YẾT NFT LÊN CHỢ
 */
export const createMarketItem = async (tokenURI: string, price: string) => {
  try {
    const nftContract = await getNFTContract();
    const marketplaceContract = await getMarketplaceContract();

    // CHIÊU 1: ĐÚC TÁC PHẨM (MINT)
    console.log("1. Đang đúc NFT...");
    const mintTx = await nftContract.mint(tokenURI);
    const mintReceipt = await mintTx.wait();

    // Truy tìm cái Token ID vừa được đúc từ trong biên lai (Logs) của thợ mỏ
    let tokenId = null;
    // Truy tìm cái Token ID...
  
    for (const log of mintReceipt.logs) { // ĐÃ SỬA: 'let' thành 'const'
      try {
        const parsedLog = nftContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "Transfer") {
          tokenId = parsedLog.args[2]; 
          break;
        }
      } catch (_e) { // ĐÃ SỬA: Thêm dấu gạch dưới vào trước chữ 'e' để báo là ta cố tình không dùng nó
        continue;
      }
    }

    if (tokenId === null) {
      throw new Error("Đúc xong nhưng không tìm thấy Token ID!");
    }

    // CHIÊU 2: CẤP GIẤY PHÉP BÁN HÀNG (APPROVE)
    // Cho phép địa chỉ của Chợ được quyền chuyển nhượng cái NFT này
    console.log(`2. Đang cấp quyền bán cho NFT ID: ${tokenId}...`);
    const approveTx = await nftContract.setApprovalForAll(Addresses.NFTMarketplace, true);
    await approveTx.wait();

    // CHIÊU 3: LÊN KỆ (LIST)
    console.log("3. Đang đăng bán lên chợ...");
    const priceInWei = ethers.parseEther(price.toString());
    const listTx = await marketplaceContract.listNFT(Addresses.BODOINFT, tokenId, priceInWei);
    await listTx.wait();

    console.log("HOÀN TẤT LIÊN HOÀN 3 CHIÊU!");
    return listTx;

  } catch (error: unknown) {
    let errorMessage = "Lỗi khi đúc và đăng bán NFT!";
    if (error instanceof Error) errorMessage = error.message;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};