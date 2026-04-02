import { expect } from "chai";
import { ethers } from "hardhat";

describe("Dự án NFT Marketplace - BODOI Std", function () {
  let nft: any;
  let market: any;
  let chuSan: any; // Trùm cuối lập ra sàn (nhận 1% thuế)
  let nhat: any;   // Người bán 
  let hai: any;    // Khách hàng 

  beforeEach(async function () {
    // Kéo 3 ví ra đóng vai
    [chuSan, nhat, hai] = await ethers.getSigners();

    // 1. Dựng Xưởng đúc 
    nft = await ethers.deployContract("BODOINFT");

    // 2. Dựng Chợ 
    market = await ethers.deployContract("NFTMarketplace");
  });

  it("Bài Test 1: Khởi tạo 2 hợp đồng thành công", async function () {
    expect(nft.target).to.not.be.undefined;
    expect(market.target).to.not.be.undefined;
    
    // Kiểm tra xem thuế 1% có cài chuẩn chưa
    expect(await market.feePercent()).to.equal(1n);
  });

  it("Bài Test 2: Kịch bản Đúc (Mint), Lên kệ (List) và Chốt đơn (Buy)", async function () {
    const giaBan = ethers.parseEther("1.0"); // Huynh Nhật muốn bán giá 1 ETH
    const linkAnh = "https://ipfs.io/ipfs/AnhCuaNhat";

    // ==========================================
    // HỒI 1: HUYNH NHẬT ĐÚC HÀNG VÀ ỦY QUYỀN
    // ==========================================
    // 1. Huynh Nhật đúc NFT (Token ID sẽ là 0 vì _nextTokenId bắt đầu từ 0)
    await nft.connect(nhat).mint(linkAnh);
    
    // 2. Ký giấy ủy quyền cho Sàn được phép chuyển NFT đi
    await nft.connect(nhat).setApprovalForAll(market.target, true);

    // ==========================================
    // HỒI 2: LÊN KỆ CHỢ
    // ==========================================
    // Gọi hàm listNFT: truyền địa chỉ hợp đồng BODOINFT, tokenId = 0, và giá = 1 ETH
    await market.connect(nhat).listNFT(nft.target, 0, giaBan);

    // Trọng tài kiểm tra: NFT đã bị chuyển từ túi huynh Nhật sang kho của Sàn chưa?
    expect(await nft.ownerOf(0)).to.equal(market.target);
    
    // Trọng tài kiểm tra: Chợ đã ghi nhận món hàng Item ID 1 chưa?
    const monHang = await market.items(1);
    expect(monHang.itemId).to.equal(1n);
    expect(monHang.sold).to.be.false;

    // ==========================================
    // HỒI 3: XUỐNG TIỀN MUA
    // ==========================================
    // Hệ thống tính toán tổng tiền Huynh Hải phải trả (1 ETH + 1% phí sàn)
    const tongTienPhaiTra = await market.getTotalPrice(1);

    //  đo lường dòng tiền: 
    // - mua mất tổng tiền
    // - bán nhận đúng 1 ETH
    // - Chủ sàn nhận được phần chênh lệch (phí 1%)
    await expect(market.connect(hai).buyNFT(1, { value: tongTienPhaiTra }))
      .to.changeEtherBalances(
        [hai, nhat, chuSan], 
        [-tongTienPhaiTra, giaBan, tongTienPhaiTra - giaBan] 
      );

    // ==========================================
    // NGHIỆM THU SAU GIAO DỊCH
    // ==========================================
    // 1. Sổ đỏ NFT đã sang tên khách chưa
    expect(await nft.ownerOf(0)).to.equal(hai.address);
    // 2. Món hàng trên sàn đã được chốt sổ (sold = true) chưa?
    const monHangSauKhiBan = await market.items(1);
    expect(monHangSauKhiBan.sold).to.be.true;
  });
}); 