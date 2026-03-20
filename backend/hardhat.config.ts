import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // Hoặc phiên bản khớp với file .sol của huynh
    settings: {
      evmVersion: "cancun" // Ép lò gạch chạy ở chế độ hiện đại nhất
    }
  }
};

export default config;