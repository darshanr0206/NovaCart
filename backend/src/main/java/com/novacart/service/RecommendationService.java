package com.novacart.service;

import com.novacart.dto.response.ProductResponse;

import java.util.List;

public interface RecommendationService {

    /**
     * Finds smart similar products within the same strict category hierarchy,
     * prioritizing same brand, similar price range, and high ratings.
     */
    List<ProductResponse> getSimilarProducts(Long productId, int limit);

    /**
     * Personalized recommendations based on user browsing/order history,
     * or top-rated curated catalog fallback for new visitors.
     */
    List<ProductResponse> getRecommendedForYou(String userEmail, int limit);

    /**
     * Complementary outfit / gear builder:
     * - Shirt -> Jeans + Shoes + Watch + Jacket
     * - Smartphone -> Phone Case + Fast Charger + Power Bank + Earbuds
     * - Cricket Bat -> Leather Ball + Batting Gloves + Batting Pads + Kit Bag
     */
    List<ProductResponse> getCompleteTheLook(Long productId);

    /**
     * Smart accessory bundle recommendation with discounted bundle offer.
     */
    List<ProductResponse> getFrequentlyBoughtTogether(Long productId);
}
