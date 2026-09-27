package com.novacart.controller;

import com.novacart.dto.request.AddressRequest;
import com.novacart.entity.Address;
import com.novacart.entity.User;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.AddressRepository;
import com.novacart.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Address>> getMyAddresses(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(addressRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Address> create(Authentication auth, @Valid @RequestBody AddressRequest request) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Address> existing = addressRepository.findByUserId(user.getId());
        boolean makeDefault = request.isDefault() || existing.isEmpty();
        if (makeDefault) {
            for (Address a : existing) {
                if (a.isDefault()) {
                    a.setDefault(false);
                    addressRepository.save(a);
                }
            }
        }
        Address address = Address.builder()
                .user(user).label(request.getLabel()).recipientName(request.getRecipientName())
                .phone(request.getPhone()).line1(request.getLine1()).line2(request.getLine2())
                .city(request.getCity()).state(request.getState()).postalCode(request.getPostalCode())
                .country(request.getCountry()).isDefault(makeDefault)
                .build();
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<Address> setDefault(Authentication auth, @PathVariable Long id) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Address> list = addressRepository.findByUserId(user.getId());
        Address target = null;
        for (Address a : list) {
            if (a.getId().equals(id)) {
                a.setDefault(true);
                target = a;
            } else if (a.isDefault()) {
                a.setDefault(false);
            }
        }
        if (target == null) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.saveAll(list);
        return ResponseEntity.ok(target);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        Address address = addressRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.delete(address);
        return ResponseEntity.noContent().build();
    }
}
