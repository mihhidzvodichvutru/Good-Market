// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    uint256 public constant feePercent = 1;
    address payable public immutable feeAccount; 
    uint256 public itemCount;

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
    }

    mapping(uint256 => Item) public items;

    event Offered(uint256 itemId, address indexed nft, uint256 tokenId, uint256 price, address indexed seller);
    event Bought(uint256 itemId, address indexed nft, uint256 tokenId, uint256 price, address indexed seller, address indexed buyer);

    constructor() {
        feeAccount = payable(msg.sender);
    }

    function listNFT(IERC721 _nft, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be greater than 0");
        itemCount++;

        _nft.transferFrom(msg.sender, address(this), _tokenId);

        items[itemCount] = Item(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);
        
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    function buyNFT(uint256 _itemId) external payable nonReentrant {
        uint256 _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        
        require(_itemId > 0 && _itemId <= itemCount, "Item doesn't exist");
        require(msg.value >= _totalPrice, "Not enough ether to cover item price and market fee");
        require(!item.sold, "Item already sold");

        item.seller.transfer(item.price); 
        feeAccount.transfer(_totalPrice - item.price); 
        item.sold = true;
        item.nft.transferFrom(address(this), msg.sender, item.tokenId); 

        emit Bought(_itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender);
    }

    function getTotalPrice(uint256 _itemId) public view returns(uint256) {
        return (items[_itemId].price * (100 + feePercent)) / 100;
    }
}