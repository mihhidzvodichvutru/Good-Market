// --- Trong hàm main() của indexer.js ---

// 1. Nghe sự kiện Niêm yết (Offered)
marketContract.on("Offered", async (itemId, nft, tokenId, price, seller) => {
    const priceEth = ethers.formatEther(price);
    
    // Cập nhật giá và trạng thái ở bảng nfts
    await supabase.from('nfts').update({ 
        price: priceEth,
        is_trending: true // Ví dụ: cứ lên sàn là cho vào trending
    }).eq('id', Number(tokenId));

    // Ghi lại lịch sử: LIST
    await supabase.from('transactions').insert({
        nft_id: Number(tokenId),
        from_address: seller.toLowerCase(),
        price: priceEth,
        event_type: 'LIST'
    });
    console.log(`[LIST] NFT #${tokenId} lên sàn giá ${priceEth} ETH`);
});

// 2. Nghe sự kiện Mua bán (Bought)
marketContract.on("Bought", async (itemId, nft, tokenId, price, seller, buyer) => {
    const priceEth = ethers.formatEther(price);

    // Cập nhật chủ sở hữu mới ở bảng nfts
    await supabase.from('nfts').update({ 
        owner: buyer.toLowerCase(),
        price: 0 // Reset giá về 0 vì đã bán xong
    }).eq('id', Number(tokenId));

    // Ghi lại lịch sử: SALE
    await supabase.from('transactions').insert({
        nft_id: Number(tokenId),
        from_address: seller.toLowerCase(),
        to_address: buyer.toLowerCase(),
        price: priceEth,
        event_type: 'SALE'
    });
    console.log(`[SALE] NFT #${tokenId} đã đổi chủ: ${seller} -> ${buyer}`);
});