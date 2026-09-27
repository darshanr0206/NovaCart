package com.novacart.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.novacart.entity.Product;
import com.novacart.entity.ProductImage;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Uploads a product image to Cloudinary and attaches it to the product.
 * Requires CLOUDINARY_* env vars to be set (see .env.example).
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final Cloudinary cloudinary;
    private final ProductRepository productRepository;

    @PostMapping("/products/{productId}/images")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductImage> uploadProductImage(@PathVariable Long productId,
                                                             @RequestParam("file") MultipartFile file) throws Exception {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", "novacart/products"));

        ProductImage image = ProductImage.builder()
                .product(product)
                .url((String) uploadResult.get("secure_url"))
                .publicId((String) uploadResult.get("public_id"))
                .sortOrder(product.getImages().size())
                .build();

        product.getImages().add(image);
        productRepository.save(product);

        return ResponseEntity.ok(image);
    }
}
