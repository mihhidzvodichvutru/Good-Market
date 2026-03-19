// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BODOINFT is ERC721URIStorage {
    uint256 private _nextTokenId;
    
    constructor() ERC721("BODOI NFT", "BFT") {}

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId); 
        _setTokenURI(tokenId, tokenURI); 
        
        return tokenId;
    }
}