package com.novacart.config;

import com.novacart.entity.*;
import com.novacart.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final InventoryRepository inventoryRepository;

    private Category cat(String name, String slug, Category parent) {
        return categoryRepository.findBySlug(slug).orElseGet(() ->
            categoryRepository.save(Category.builder().name(name).slug(slug).parent(parent).build()));
    }

    private Product saveProduct(String name, String desc, String specs, BigDecimal price, BigDecimal discount,
                                String brand, String color, String size, Category category, Seller seller,
                                double rating, int reviews, int stock, String imageUrl) {
        Product p = Product.builder()
                .name(name).description(desc).specifications(specs)
                .price(price).discountPercent(discount)
                .brand(brand).color(color).size(size)
                .category(category).seller(seller)
                .active(true).averageRating(rating).reviewCount(reviews)
                .build();
        Inventory inv = Inventory.builder().product(p).stockQuantity(stock).build();
        p.setInventory(inv);
        ProductImage pi = ProductImage.builder().product(p).url(imageUrl).build();
        p.setImages(new ArrayList<>(List.of(pi)));
        return productRepository.save(p);
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (productRepository.count() > 0) return;

        Seller seller1, seller2, seller3, seller4;

        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .email("admin@novacart.app")
                    .passwordHash(passwordEncoder.encode("NovaCartAdmin2026!"))
                    .fullName("System Admin")
                    .roles(Set.of(RoleName.ADMIN))
                    .active(true).build());

            User u1 = userRepository.save(User.builder().email("retailer1@novacart.app")
                    .passwordHash(passwordEncoder.encode("SellerPass123!")).fullName("NovaTech Retail")
                    .roles(Set.of(RoleName.SELLER)).active(true).build());
            seller1 = sellerRepository.save(Seller.builder().user(u1).businessName("NovaTech Retail")
                    .businessEmail("retailer1@novacart.app").status(SellerStatus.APPROVED).build());

            User u2 = userRepository.save(User.builder().email("retailer2@novacart.app")
                    .passwordHash(passwordEncoder.encode("SellerPass123!")).fullName("Lifestyle Co.")
                    .roles(Set.of(RoleName.SELLER)).active(true).build());
            seller2 = sellerRepository.save(Seller.builder().user(u2).businessName("Lifestyle Co.")
                    .businessEmail("retailer2@novacart.app").status(SellerStatus.APPROVED).build());

            User u3 = userRepository.save(User.builder().email("retailer3@novacart.app")
                    .passwordHash(passwordEncoder.encode("SellerPass123!")).fullName("Home Essentials")
                    .roles(Set.of(RoleName.SELLER)).active(true).build());
            seller3 = sellerRepository.save(Seller.builder().user(u3).businessName("Home Essentials")
                    .businessEmail("retailer3@novacart.app").status(SellerStatus.APPROVED).build());

            User u4 = userRepository.save(User.builder().email("retailer4@novacart.app")
                    .passwordHash(passwordEncoder.encode("SellerPass123!")).fullName("FashionHub India")
                    .roles(Set.of(RoleName.SELLER)).active(true).build());
            seller4 = sellerRepository.save(Seller.builder().user(u4).businessName("FashionHub India")
                    .businessEmail("retailer4@novacart.app").status(SellerStatus.APPROVED).build());
        } else {
            List<Seller> sellers = sellerRepository.findAll();
            seller1 = sellers.get(0);
            seller2 = sellers.size() > 1 ? sellers.get(1) : seller1;
            seller3 = sellers.size() > 2 ? sellers.get(2) : seller1;
            seller4 = sellers.size() > 3 ? sellers.get(3) : seller1;
        }

        Map<String, Category> cats = new HashMap<>();
        // ─── MOBILES ───
        Category mobiles = cat("Mobiles", "mobiles", null);
        cats.put("mobiles", mobiles);
        Category smartphones = cat("Smartphones", "smartphones", mobiles);
        cats.put("smartphones", smartphones);
        Category feature_phones = cat("Feature Phones", "feature-phones", mobiles);
        cats.put("feature-phones", feature_phones);
        Category mobile_accessories = cat("Mobile Accessories", "mobile-accessories", mobiles);
        cats.put("mobile-accessories", mobile_accessories);
        Category cases_covers = cat("Cases & Covers", "cases-covers", mobiles);
        cats.put("cases-covers", cases_covers);
        Category chargers_cables = cat("Chargers & Cables", "chargers-cables", mobiles);
        cats.put("chargers-cables", chargers_cables);
        Category power_banks = cat("Power Banks", "power-banks", mobiles);
        cats.put("power-banks", power_banks);

        saveProduct("Samsung Galaxy S24 Ultra 5G",
                "Ultimate Galaxy AI smartphone.",
                "RAM: 12GB\nStorage: 256GB",
                new BigDecimal("124999"), new BigDecimal("10"),
                "Samsung", "Titanium Black", "256 GB", cats.get("smartphones"), seller1, 3.7, 2000, 173,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80");

        saveProduct("Apple iPhone 15 Pro Max",
                "Forged in titanium.",
                "RAM: 8GB\nStorage: 256GB",
                new BigDecimal("159900"), new BigDecimal("5"),
                "Apple", "Natural Titanium", "256 GB", cats.get("smartphones"), seller2, 4.5, 508, 134,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80");

        saveProduct("OnePlus 12 5G",
                "Smooth beyond belief.",
                "RAM: 12GB\nStorage: 256GB",
                new BigDecimal("64999"), new BigDecimal("8"),
                "OnePlus", "Flowy Emerald", "256 GB", cats.get("smartphones"), seller3, 3.8, 2813, 109,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80");

        saveProduct("Xiaomi 14 5G",
                "Leica optics.",
                "RAM: 12GB\nStorage: 512GB",
                new BigDecimal("69999"), new BigDecimal("12"),
                "Xiaomi", "Jade Green", "512 GB", cats.get("smartphones"), seller4, 3.8, 2501, 172,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80");

        saveProduct("Spigen Liquid Air Case for iPhone 15",
                "Slim protection.",
                "Material: TPU",
                new BigDecimal("1299"), new BigDecimal("20"),
                "Spigen", "Matte Black", "Standard", cats.get("cases-covers"), seller1, 4.1, 4321, 161,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1601593346740-925612772716?w=800&q=80");

        saveProduct("Anker 20000mAh Power Bank",
                "Fast charging portable charger.",
                "Capacity: 20000mAh",
                new BigDecimal("3499"), new BigDecimal("15"),
                "Anker", "Black", "20000mAh", cats.get("power-banks"), seller2, 3.6, 873, 175,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80");
        // ─── ELECTRONICS ───
        Category electronics = cat("Electronics", "electronics", null);
        cats.put("electronics", electronics);
        Category laptops = cat("Laptops", "laptops", electronics);
        cats.put("laptops", laptops);
        Category tablets = cat("Tablets", "tablets", electronics);
        cats.put("tablets", tablets);
        Category headphones = cat("Headphones", "headphones", electronics);
        cats.put("headphones", headphones);
        Category earbuds = cat("Earbuds", "earbuds", electronics);
        cats.put("earbuds", earbuds);
        Category tvs = cat("TVs", "tvs", electronics);
        cats.put("tvs", tvs);
        Category cameras = cat("Cameras", "cameras", electronics);
        cats.put("cameras", cameras);
        Category computer_accessories = cat("Computer Accessories", "computer-accessories", electronics);
        cats.put("computer-accessories", computer_accessories);
        Category smartwatches = cat("Smartwatches", "smartwatches", electronics);
        cats.put("smartwatches", smartwatches);

        saveProduct("Apple MacBook Pro M3",
                "Mind-blowing. Head-turning.",
                "RAM: 18GB\nStorage: 512GB",
                new BigDecimal("199900"), new BigDecimal("0"),
                "Apple", "Space Black", "14-inch", cats.get("laptops"), seller3, 3.9, 1465, 70,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80");

        saveProduct("Dell XPS 15 OLED",
                "Stunning display and performance.",
                "RAM: 16GB\nStorage: 1TB",
                new BigDecimal("175000"), new BigDecimal("10"),
                "Dell", "Platinum Silver", "15-inch", cats.get("laptops"), seller4, 4.5, 4072, 95,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80");

        saveProduct("Sony WH-1000XM5",
                "Industry leading noise cancellation.",
                "Battery: 30 hours",
                new BigDecimal("29990"), new BigDecimal("20"),
                "Sony", "Black", "Standard", cats.get("headphones"), seller1, 4.6, 514, 169,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80");

        saveProduct("Apple iPad Air",
                "Supercharged by M2.",
                "Storage: 128GB",
                new BigDecimal("59900"), new BigDecimal("5"),
                "Apple", "Blue", "11-inch", cats.get("tablets"), seller2, 4.0, 3733, 54,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80");

        saveProduct("Logitech MX Master 3S",
                "Performance wireless mouse.",
                "DPI: 8000",
                new BigDecimal("9999"), new BigDecimal("10"),
                "Logitech", "Graphite", "Standard", cats.get("computer-accessories"), seller3, 4.3, 1793, 111,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80");

        saveProduct("Samsung 55-inch Neo QLED 4K TV",
                "Brilliant 4K picture.",
                "Refresh Rate: 120Hz",
                new BigDecimal("124990"), new BigDecimal("15"),
                "Samsung", "Titan Black", "55-inch", cats.get("tvs"), seller4, 3.7, 4559, 132,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=800&q=80");
        // ─── GROCERIES & HOUSEHOLD ───
        Category groceries_household = cat("Groceries & Household", "groceries-household", null);
        cats.put("groceries-household", groceries_household);
        Category rice_flour_dal = cat("Rice, Flour & Dal", "rice-flour-dal", groceries_household);
        cats.put("rice-flour-dal", rice_flour_dal);
        Category cooking_oil = cat("Cooking Oil", "cooking-oil", groceries_household);
        cats.put("cooking-oil", cooking_oil);
        Category cleaning_supplies = cat("Cleaning Supplies", "cleaning-supplies", groceries_household);
        cats.put("cleaning-supplies", cleaning_supplies);
        Category detergents = cat("Detergents", "detergents", groceries_household);
        cats.put("detergents", detergents);
        Category snacks_beverages = cat("Snacks & Beverages", "snacks-beverages", groceries_household);
        cats.put("snacks-beverages", snacks_beverages);

        saveProduct("India Gate Basmati Rice",
                "Premium aged basmati rice.",
                "Weight: 5kg",
                new BigDecimal("699"), new BigDecimal("15"),
                "India Gate", "Standard", "5 kg", cats.get("rice-flour-dal"), seller1, 3.9, 3850, 139,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80");

        saveProduct("Fortune Sunlite Refined Sunflower Oil",
                "Light and healthy.",
                "Volume: 5L",
                new BigDecimal("750"), new BigDecimal("10"),
                "Fortune", "Standard", "5 L", cats.get("cooking-oil"), seller2, 4.4, 3063, 81,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80");

        saveProduct("Surf Excel Easy Wash Detergent",
                "Removes tough stains.",
                "Weight: 3kg",
                new BigDecimal("350"), new BigDecimal("5"),
                "Surf Excel", "Standard", "3 kg", cats.get("detergents"), seller3, 4.9, 1313, 76,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80");

        saveProduct("Lay's Classic Salted",
                "Crunchy potato chips.",
                "Weight: 100g",
                new BigDecimal("50"), new BigDecimal("0"),
                "Lay's", "Standard", "100 g", cats.get("snacks-beverages"), seller4, 4.7, 503, 178,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80");
        // ─── FASHION ───
        Category fashion = cat("Fashion", "fashion", null);
        cats.put("fashion", fashion);
        Category mens_fashion = cat("Men's Fashion", "mens-fashion", fashion);
        cats.put("mens-fashion", mens_fashion);
        Category womens_fashion = cat("Women's Fashion", "womens-fashion", fashion);
        cats.put("womens-fashion", womens_fashion);
        Category kids_fashion = cat("Kids Fashion", "kids-fashion", fashion);
        cats.put("kids-fashion", kids_fashion);
        Category traditional_wear = cat("Traditional Wear", "traditional-wear", fashion);
        cats.put("traditional-wear", traditional_wear);

        saveProduct("Levi's 511 Slim Fit Jeans",
                "Classic slim fit jeans.",
                "Material: Denim",
                new BigDecimal("3299"), new BigDecimal("25"),
                "Levi's", "Dark Blue", "32", cats.get("mens-fashion"), seller1, 4.7, 4985, 161,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80");

        saveProduct("H&M Women's Floral Dress",
                "Summer floral dress.",
                "Material: Cotton",
                new BigDecimal("1999"), new BigDecimal("10"),
                "H&M", "Pink", "M", cats.get("womens-fashion"), seller2, 4.0, 2990, 161,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80");

        saveProduct("Allen Solly Formal Shirt",
                "Crisp formal shirt for men.",
                "Material: 100% Cotton",
                new BigDecimal("1499"), new BigDecimal("15"),
                "Allen Solly", "White", "L", cats.get("mens-fashion"), seller3, 4.4, 4115, 141,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80");

        saveProduct("Fabindia Cotton Kurta",
                "Elegant traditional wear.",
                "Material: Cotton",
                new BigDecimal("2499"), new BigDecimal("5"),
                "Fabindia", "Teal", "L", cats.get("traditional-wear"), seller4, 4.2, 4499, 14,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80");
        // ─── SHOES & FOOTWEAR ───
        Category shoes_footwear = cat("Shoes & Footwear", "shoes-footwear", null);
        cats.put("shoes-footwear", shoes_footwear);
        Category mens_shoes = cat("Men's Shoes", "mens-shoes", shoes_footwear);
        cats.put("mens-shoes", mens_shoes);
        Category womens_shoes = cat("Women's Shoes", "womens-shoes", shoes_footwear);
        cats.put("womens-shoes", womens_shoes);
        Category sports_shoes = cat("Sports Shoes", "sports-shoes", shoes_footwear);
        cats.put("sports-shoes", sports_shoes);
        Category sandals_slippers = cat("Sandals & Slippers", "sandals-slippers", shoes_footwear);
        cats.put("sandals-slippers", sandals_slippers);

        saveProduct("Nike Air Max 270",
                "Iconic lifestyle shoe.",
                "Material: Mesh",
                new BigDecimal("12995"), new BigDecimal("10"),
                "Nike", "Black", "UK 9", cats.get("sports-shoes"), seller1, 4.0, 2519, 77,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80");

        saveProduct("Adidas Ultraboost Light",
                "Lightest Ultraboost ever.",
                "Material: Primeknit",
                new BigDecimal("16999"), new BigDecimal("15"),
                "Adidas", "White", "UK 8", cats.get("sports-shoes"), seller2, 4.1, 3775, 108,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80");

        saveProduct("Red Tape Formal Oxfords",
                "Genuine leather shoes.",
                "Material: Leather",
                new BigDecimal("2499"), new BigDecimal("50"),
                "Red Tape", "Brown", "UK 9", cats.get("mens-shoes"), seller3, 3.9, 1617, 139,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1614252209318-494a8616cda2?w=800&q=80");

        saveProduct("Crocs Classic Clog",
                "Comfortable daily wear.",
                "Material: Croslite",
                new BigDecimal("2995"), new BigDecimal("20"),
                "Crocs", "Navy", "UK 8", cats.get("sandals-slippers"), seller4, 4.5, 1247, 14,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80");
        // ─── BOOKS & STATIONERY ───
        Category books_stationery = cat("Books & Stationery", "books-stationery", null);
        cats.put("books-stationery", books_stationery);
        Category fiction = cat("Fiction", "fiction", books_stationery);
        cats.put("fiction", fiction);
        Category self_help = cat("Self Help & Personal Development", "self-help", books_stationery);
        cats.put("self-help", self_help);
        Category academic_reference = cat("Academic & Reference", "academic-reference", books_stationery);
        cats.put("academic-reference", academic_reference);
        Category stationery = cat("Stationery & Office Supplies", "stationery", books_stationery);
        cats.put("stationery", stationery);
        Category children_books = cat("Children's Books", "children-books", books_stationery);
        cats.put("children-books", children_books);

        saveProduct("Atomic Habits by James Clear",
                "Tiny changes, remarkable results.",
                "Format: Paperback",
                new BigDecimal("499"), new BigDecimal("25"),
                "Penguin", "Standard", "Paperback", cats.get("self-help"), seller1, 4.4, 3910, 93,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80");

        saveProduct("The Alchemist by Paulo Coelho",
                "A fable about following your dream.",
                "Format: Paperback",
                new BigDecimal("299"), new BigDecimal("10"),
                "HarperCollins", "Standard", "Paperback", cats.get("fiction"), seller2, 4.8, 3727, 62,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80");

        saveProduct("Classmate Notebooks (Pack of 6)",
                "Premium unruled notebooks.",
                "Pages: 120",
                new BigDecimal("250"), new BigDecimal("5"),
                "Classmate", "Assorted", "Standard", cats.get("stationery"), seller3, 3.8, 1448, 36,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80");
        // ─── HOME & KITCHEN ───
        Category home_kitchen = cat("Home & Kitchen", "home-kitchen", null);
        cats.put("home-kitchen", home_kitchen);
        Category cookware = cat("Cookware", "cookware", home_kitchen);
        cats.put("cookware", cookware);
        Category storage_organisation = cat("Storage & Organisation", "storage-organisation", home_kitchen);
        cats.put("storage-organisation", storage_organisation);
        Category kitchen_appliances = cat("Kitchen Appliances", "kitchen-appliances", home_kitchen);
        cats.put("kitchen-appliances", kitchen_appliances);
        Category bedding_pillows = cat("Bedding & Pillows", "bedding-pillows", home_kitchen);
        cats.put("bedding-pillows", bedding_pillows);

        saveProduct("Prestige Svachh Pressure Cooker 5L",
                "Spillage control pressure cooker.",
                "Capacity: 5L",
                new BigDecimal("1699"), new BigDecimal("20"),
                "Prestige", "Silver", "5 L", cats.get("cookware"), seller4, 4.3, 3031, 173,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80");

        saveProduct("Philips HD9200 Air Fryer",
                "Rapid Air Technology.",
                "Capacity: 4.1L",
                new BigDecimal("6995"), new BigDecimal("15"),
                "Philips", "Black", "4.1 L", cats.get("kitchen-appliances"), seller1, 3.6, 336, 80,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80");

        saveProduct("Wakefit Luxe Microfiber Pillow",
                "Soft and comfortable.",
                "Material: Microfiber",
                new BigDecimal("999"), new BigDecimal("30"),
                "Wakefit", "White", "Standard", cats.get("bedding-pillows"), seller2, 4.7, 2647, 23,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80");
        // ─── BEAUTY & PERSONAL CARE ───
        Category beauty_personal_care = cat("Beauty & Personal Care", "beauty-personal-care", null);
        cats.put("beauty-personal-care", beauty_personal_care);
        Category skincare = cat("Skincare", "skincare", beauty_personal_care);
        cats.put("skincare", skincare);
        Category haircare = cat("Hair Care", "haircare", beauty_personal_care);
        cats.put("haircare", haircare);
        Category makeup = cat("Makeup", "makeup", beauty_personal_care);
        cats.put("makeup", makeup);
        Category mens_grooming = cat("Men's Grooming", "mens-grooming", beauty_personal_care);
        cats.put("mens-grooming", mens_grooming);
        Category fragrances = cat("Fragrances", "fragrances", beauty_personal_care);
        cats.put("fragrances", fragrances);

        saveProduct("Minimalist 10% Niacinamide Serum",
                "Reduces acne marks.",
                "Volume: 30ml",
                new BigDecimal("599"), new BigDecimal("5"),
                "Minimalist", "Standard", "30 ml", cats.get("skincare"), seller3, 4.0, 3077, 111,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80");

        saveProduct("Cetaphil Gentle Skin Cleanser",
                "For sensitive skin.",
                "Volume: 250ml",
                new BigDecimal("350"), new BigDecimal("10"),
                "Cetaphil", "Standard", "250 ml", cats.get("skincare"), seller4, 4.7, 2074, 148,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80");

        saveProduct("Philips Multigroom Trimmer",
                "9-in-1 face & body trimmer.",
                "Runtime: 60 mins",
                new BigDecimal("1799"), new BigDecimal("15"),
                "Philips", "Black", "Standard", cats.get("mens-grooming"), seller1, 4.1, 1576, 59,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&q=80");
        // ─── FURNITURE & HOME DECOR ───
        Category furniture_home_decor = cat("Furniture & Home Decor", "furniture-home-decor", null);
        cats.put("furniture-home-decor", furniture_home_decor);
        Category seating_sofas = cat("Seating & Sofas", "seating-sofas", furniture_home_decor);
        cats.put("seating-sofas", seating_sofas);
        Category tables_chairs = cat("Tables & Chairs", "tables-chairs", furniture_home_decor);
        cats.put("tables-chairs", tables_chairs);
        Category home_decor_items = cat("Home Decor", "home-decor-items", furniture_home_decor);
        cats.put("home-decor-items", home_decor_items);
        Category lighting = cat("Lighting", "lighting", furniture_home_decor);
        cats.put("lighting", lighting);

        saveProduct("Wakefit Napper 3 Seater Sofa",
                "Premium fabric sofa.",
                "Material: Fabric",
                new BigDecimal("14999"), new BigDecimal("20"),
                "Wakefit", "Grey", "3 Seater", cats.get("seating-sofas"), seller2, 3.8, 4830, 134,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80");

        saveProduct("IKEA Lack Coffee Table",
                "Minimalist coffee table.",
                "Material: Engineered Wood",
                new BigDecimal("1490"), new BigDecimal("0"),
                "IKEA", "White", "Standard", cats.get("tables-chairs"), seller3, 4.2, 4182, 145,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80");

        saveProduct("Philips Smart Wi-Fi LED Bulb",
                "16 million colors.",
                "Wattage: 9W",
                new BigDecimal("699"), new BigDecimal("30"),
                "Philips", "Multicolor", "9W", cats.get("lighting"), seller4, 3.6, 4612, 136,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80");
        // ─── TOYS & KIDS ───
        Category toys_kids = cat("Toys & Kids", "toys-kids", null);
        cats.put("toys-kids", toys_kids);
        Category action_figures = cat("Action Figures", "action-figures", toys_kids);
        cats.put("action-figures", action_figures);
        Category board_games = cat("Board Games", "board-games", toys_kids);
        cats.put("board-games", board_games);
        Category learning_toys = cat("Learning Toys", "learning-toys", toys_kids);
        cats.put("learning-toys", learning_toys);
        Category outdoor_play = cat("Outdoor Play", "outdoor-play", toys_kids);
        cats.put("outdoor-play", outdoor_play);
        Category baby_toys = cat("Baby Toys", "baby-toys", toys_kids);
        cats.put("baby-toys", baby_toys);

        saveProduct("LEGO Classic Medium Creative Brick Box",
                "484 pieces of creative fun.",
                "Age: 4+",
                new BigDecimal("2499"), new BigDecimal("10"),
                "LEGO", "Multicolor", "Standard", cats.get("learning-toys"), seller1, 4.9, 3057, 125,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80");

        saveProduct("Hasbro Monopoly Board Game",
                "Classic family board game.",
                "Players: 2-6",
                new BigDecimal("999"), new BigDecimal("15"),
                "Hasbro", "Standard", "Standard", cats.get("board-games"), seller2, 4.3, 3716, 65,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1610890716171-6b1a0e1b12b5?w=800&q=80");

        saveProduct("Hot Wheels 5-Car Pack",
                "Die-cast toy cars.",
                "Age: 3+",
                new BigDecimal("699"), new BigDecimal("5"),
                "Mattel", "Assorted", "Standard", cats.get("outdoor-play"), seller3, 3.8, 2893, 194,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=80");
        // ─── SPORTS & FITNESS ───
        Category sports_fitness = cat("Sports & Fitness", "sports-fitness", null);
        cats.put("sports-fitness", sports_fitness);
        Category gym_fitness = cat("Gym & Fitness", "gym-fitness", sports_fitness);
        cats.put("gym-fitness", gym_fitness);
        Category yoga_meditation = cat("Yoga & Meditation", "yoga-meditation", sports_fitness);
        cats.put("yoga-meditation", yoga_meditation);
        Category cycling = cat("Cycling", "cycling", sports_fitness);
        cats.put("cycling", cycling);
        Category sportswear = cat("Sportswear", "sportswear", sports_fitness);
        cats.put("sportswear", sportswear);
        Category outdoor_sports = cat("Outdoor Sports", "outdoor-sports", sports_fitness);
        cats.put("outdoor-sports", outdoor_sports);

        saveProduct("Boldfit Yoga Mat with Strap",
                "Anti-slip yoga mat.",
                "Thickness: 6mm",
                new BigDecimal("799"), new BigDecimal("40"),
                "Boldfit", "Blue", "6mm", cats.get("yoga-meditation"), seller4, 4.5, 4053, 77,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1592432678016-e910b06b384e?w=800&q=80");

        saveProduct("Strauss Adjustable Dumbbell Set",
                "Home gym equipment.",
                "Weight: 15kg",
                new BigDecimal("1999"), new BigDecimal("25"),
                "Strauss", "Black", "15 kg", cats.get("gym-fitness"), seller1, 4.1, 4642, 192,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80");

        saveProduct("Nivia Football",
                "Standard size football.",
                "Size: 5",
                new BigDecimal("499"), new BigDecimal("10"),
                "Nivia", "White/Black", "Size 5", cats.get("outdoor-sports"), seller2, 3.7, 365, 77,
                "https://res.cloudinary.com/tp4r8zwj/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&q=80");

    }
}
