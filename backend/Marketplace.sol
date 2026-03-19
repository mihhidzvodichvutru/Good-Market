// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    // Phí sàn (ví dụ 1%)
    uint256 public constant feePercent = 1;
    address payable public immutable feeAccount; // Tài khoản nhận phí của team BODOI
    uint256 public itemCount;

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
    }

    // Lưu trữ danh sách các NFT đang bán trên sàn
    mapping(uint256 => Item) public items;

    event Offered(uint256 itemId, address indexed nft, uint256 tokenId, uint256 price, address indexed seller);
    event Bought(uint256 itemId, address indexed nft, uint256 tokenId, uint256 price, address indexed seller, address indexed buyer);

    constructor() {
        feeAccount = payable(msg.sender);
    }

    // Hàm 1: Đưa NFT lên sàn (Listing)
    function listNFT(IERC721 _nft, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Gia phai lon hon 0");
        itemCount++;

        // Chuyển NFT từ ví người bán vào Smart Contract của sàn để giữ (Escrow)
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        items[itemCount] = Item(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);
        
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    // Hàm 2: Mua NFT (Buying)
    function buyNFT(uint256 _itemId) external payable nonReentrant {
        uint256 _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        
        require(_itemId > 0 && _itemId <= itemCount, "San pham khong ton tai");
        require(msg.value >= _totalPrice, "Khong du tien eth de mua");
        require(!item.sold, "San pham da duoc ban");

        item.seller.transfer(item.price); // Trả tiền cho người bán
        feeAccount.transfer(_totalPrice - item.price); // Trả phí sàn cho team
        item.sold = true;
        item.nft.transferFrom(address(this), msg.sender, item.tokenId); // Chuyển NFT cho người mua

        emit Bought(_itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender);
    }

    // Tính tổng tiền = Giá NFT + Phí sàn
    function getTotalPrice(uint256 _itemId) public view returns(uint256) {
        return (items[_itemId].price * (100 + feePercent)) / 100;
    }
}