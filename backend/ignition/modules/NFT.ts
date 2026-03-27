// @ts-nocheck
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTModule = buildModule("NFTModule", (m) => {
  // Đã đổi "NFT" thành "BODOINFT" theo đúng tên trong file code của haicter
  const nft = m.contract("BODOINFT", []); 

  return { nft };
});

export default NFTModule;