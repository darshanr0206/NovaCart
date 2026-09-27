package com.novacart.controller;

import com.novacart.dto.request.ReturnCreateRequest;
import com.novacart.dto.request.ReturnStatusUpdateRequest;
import com.novacart.dto.response.ReturnResponse;
import com.novacart.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    // ─── Customer Endpoints ───────────────────────────────────────────────────

    @PostMapping("/api/orders/{orderId}/return")
    public ResponseEntity<ReturnResponse> createReturn(
            Authentication auth,
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnCreateRequest request) {
        return ResponseEntity.ok(returnService.createReturnRequest(auth.getName(), orderId, request));
    }

    @GetMapping("/api/orders/{orderId}/return")
    public ResponseEntity<ReturnResponse> getOrderReturn(
            Authentication auth,
            @PathVariable Long orderId) {
        return ResponseEntity.ok(returnService.getOrderReturn(auth.getName(), orderId));
    }

    // ─── Admin Endpoints ──────────────────────────────────────────────────────

    @GetMapping("/api/admin/returns")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReturnResponse>> getAllReturns() {
        return ResponseEntity.ok(returnService.getAllReturns());
    }

    @PatchMapping("/api/admin/returns/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReturnResponse> updateReturnStatusPatch(
            @PathVariable Long id,
            @Valid @RequestBody ReturnStatusUpdateRequest request) {
        return ResponseEntity.ok(returnService.updateReturnStatus(id, request));
    }

    @PutMapping("/api/admin/returns/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReturnResponse> updateReturnStatusPut(
            @PathVariable Long id,
            @Valid @RequestBody ReturnStatusUpdateRequest request) {
        return ResponseEntity.ok(returnService.updateReturnStatus(id, request));
    }
}
