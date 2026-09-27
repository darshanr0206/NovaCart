package com.novacart.service.impl;

import com.novacart.dto.request.SellerRegisterRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.SellerResponse;
import com.novacart.entity.RoleName;
import com.novacart.entity.Seller;
import com.novacart.entity.SellerStatus;
import com.novacart.entity.User;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.SellerRepository;
import com.novacart.repository.UserRepository;
import com.novacart.service.EmailService;
import com.novacart.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerServiceImpl implements SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public SellerResponse register(String email, SellerRegisterRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (sellerRepository.findByUserId(user.getId()).isPresent()) {
            throw new BadRequestException("You already have a seller profile");
        }

        Seller seller = Seller.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .businessEmail(request.getBusinessEmail())
                .businessPhone(request.getBusinessPhone())
                .businessAddress(request.getBusinessAddress())
                .businessInfo(request.getBusinessInfo())
                .status(SellerStatus.PENDING)
                .build();
        seller = sellerRepository.save(seller);

        user.getRoles().add(RoleName.SELLER);
        userRepository.save(user);

        return toResponse(seller);
    }

    @Override
    public PageResponse<SellerResponse> getAll(SellerStatus status, Pageable pageable) {
        Page<Seller> page = status != null
                ? sellerRepository.findByStatus(status, pageable)
                : sellerRepository.findAll(pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Override
    public SellerResponse getById(Long id) {
        return toResponse(sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found")));
    }

    @Override
    @Transactional
    public SellerResponse updateStatus(Long id, SellerStatus status) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        seller.setStatus(status);
        sellerRepository.save(seller);
        emailService.sendSellerApprovalEmail(seller.getBusinessEmail(), status == SellerStatus.APPROVED);
        return toResponse(seller);
    }

    @Override
    public SellerResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Seller seller = sellerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You do not have a seller profile yet"));
        return toResponse(seller);
    }

    private SellerResponse toResponse(Seller s) {
        return SellerResponse.builder()
                .id(s.getId())
                .businessName(s.getBusinessName())
                .businessEmail(s.getBusinessEmail())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                .build();
    }
}
