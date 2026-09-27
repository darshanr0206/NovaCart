package com.novacart.controller;

import com.novacart.dto.response.CategoryResponse;
import com.novacart.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @GetMapping("/tree")
    public ResponseEntity<List<CategoryResponse>> getTree() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> create(@RequestParam String name,
                                                    @RequestParam(required = false) String iconUrl,
                                                    @RequestParam(required = false) String description) {
        return ResponseEntity.ok(categoryService.create(name, iconUrl, description));
    }
}
