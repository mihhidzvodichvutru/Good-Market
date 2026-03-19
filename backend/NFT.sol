// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BODOINFT is ERC721URIStorage {
    uint256 private _nextTokenId;
    
    // Khởi tạo tên Token và Mã giao dịch cho sàn của team mình
    constructor() ERC721("BODOI NFT", "BFT") {}

    // Hàm đúc NFT mới, nhận vào đường dẫn IPFS (chứa hình ảnh & metadata)
    function mint(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId); // Đúc và giao quyền sở hữu cho người gọi hàm
        _setTokenURI(tokenId, tokenURI); // Gắn link IPFS vào token
        
        return tokenId;
    }
}