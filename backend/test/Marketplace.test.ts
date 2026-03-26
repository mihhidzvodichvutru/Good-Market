import { expect } from "chai";
import { ethers } from "hardhat";

describe("Dự án NFT Marketplace - BODOI Std", function () {
  let market: any;
  let nhat: any;   // Chủ sàn
  let hai: any;    // Khách hàng 1
  let giang: any;  // Khách hàng 2

  beforeEach(async function () {
    [nhat, hai, giang] = await ethers.getSigners();

    // ĐÃ ĐỒNG BỘ: Dùng cú pháp đời mới y hệt bên Counter!
    // Lưu ý: Đảm bảo trong file .sol, đại ca ghi chính xác là "contract NFTMarketplace {"
    market = await ethers.deployContract("NFTMarketplace");
  });

  it("Bài Test 1: Khởi tạo thành công, hợp đồng đã lên sóng", async function () {
    // ĐÃ ĐỒNG BỘ: Bắt thẳng vào thuộc tính .target của bản Ethers v6
    expect(market.target).to.not.be.undefined;
    expect(market.target).to.be.a('string');
  });

  it("Bài Test 2: Kịch bản đúc (Mint) và Mua Bán sòng phẳng", async function () {
    // Để trống chờ đại ca ném file .sol lên
  });
});