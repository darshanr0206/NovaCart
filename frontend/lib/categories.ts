export interface Subcategory {
  name: string;
  slug: string;
}

export interface ParentCategory {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  icon?: string;
  description: string;
  subcategories: Subcategory[];
}

export const CANONICAL_CATEGORIES: ParentCategory[] = [
  {
    id: 1,
    name: "Groceries & Household Essentials",
    slug: "groceries-household",
    emoji: "🛒",
    icon: "🛒",
    description: "Daily groceries, staples, packaged foods, snacks, beverages and household cleaning.",
    subcategories: [
      { name: "Packaged & Instant Foods", slug: "packaged-foods" },
      { name: "Snacks & Beverages", slug: "snacks-beverages" },
      { name: "Personal Hygiene", slug: "personal-hygiene" },
      { name: "Atta, Rice, Oil & Dals", slug: "atta-rice-oil-dals" },
      { name: "Cleaning & Household", slug: "cleaning-household" },
      { name: "Spices & Masalas", slug: "spices-dry-fruits" },
      { name: "Breakfast & Sauces", slug: "breakfast-sauces" },
      { name: "Dairy, Bread & Eggs", slug: "dairy-bread-eggs" },
    ],
  },
  {
    id: 2,
    name: "Mobiles",
    slug: "mobiles",
    emoji: "📱",
    icon: "📱",
    description: "Authentic mobile phones, 5G smartphones, flagship devices and budget phones.",
    subcategories: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "Flagship Phones", slug: "flagship-mobiles" },
      { name: "Budget Phones", slug: "budget-smartphones" },
    ],
  },
  {
    id: 3,
    name: "Electronics",
    slug: "electronics",
    emoji: "💻",
    icon: "💻",
    description: "Laptops, smart TVs, noise-canceling headphones, smartwatches, tablets, computer accessories and chargers.",
    subcategories: [
      { name: "Headphones & Earbuds", slug: "headphones" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Laptops & Computers", slug: "laptops" },
      { name: "Televisions & Home Audio", slug: "tvs" },
      { name: "Speakers & Soundbars", slug: "speakers" },
      { name: "Smartwatches", slug: "smartwatches" },
      { name: "Tablets & iPads", slug: "tablets" },
      { name: "Cameras & Photography", slug: "cameras" },
      { name: "Chargers & Cables", slug: "chargers-cables" },
      { name: "Cases & Covers", slug: "cases-covers" },
      { name: "Power Banks", slug: "power-banks" },
    ],
  },
  {
    id: 4,
    name: "Clothing & Fashion",
    slug: "fashion",
    emoji: "👕",
    icon: "👕",
    description: "Men's and women's clothing, ethnic wear, dresses, shirts, jeans, sleepwear & kidswear.",
    subcategories: [
      { name: "Women's Western & Dresses", slug: "womens-fashion" },
      { name: "Men's T-Shirts & Polos", slug: "mens-tshirts" },
      { name: "Men's Shirts", slug: "mens-shirts" },
      { name: "Women's Ethnic & Sarees", slug: "traditional-wear" },
      { name: "Men's Jeans & Trousers", slug: "mens-jeans" },
      { name: "Innerwear & Sleepwear", slug: "innerwear-sleepwear" },
      { name: "Kids Fashion", slug: "kids-fashion" },
      { name: "Watches & Accessories", slug: "watches-accessories" },
      { name: "Jackets & Hoodies", slug: "jackets-hoodies" },
      { name: "Handbags & Clutches", slug: "handbags-clutches" },
    ],
  },
  {
    id: 5,
    name: "Shoes & Footwear",
    slug: "shoes-footwear",
    emoji: "👟",
    icon: "👟",
    description: "Running shoes, sports sneakers, casual sneakers, formal shoes, sandals & slippers.",
    subcategories: [
      { name: "Men's Sports Shoes", slug: "sports-shoes" },
      { name: "Men's Formal Shoes", slug: "mens-formal-shoes" },
      { name: "Sandals & Slippers", slug: "sandals-slippers" },
      { name: "Women's Flats & Heels", slug: "womens-shoes" },
      { name: "Men's Casual Sneakers", slug: "mens-shoes" },
      { name: "Women's Sandals & Wedges", slug: "womens-sandals" },
    ],
  },
  {
    id: 6,
    name: "Books & Stationery",
    slug: "books-stationery",
    emoji: "📚",
    icon: "📚",
    description: "Bestselling books, self-help, business, fiction, academic textbooks, school bags and stationery.",
    subcategories: [
      { name: "School Bags & Supplies", slug: "school-bags" },
      { name: "Self-Help & Personal Growth", slug: "self-help" },
      { name: "Business & Finance", slug: "business-finance" },
      { name: "Fiction & Literature", slug: "fiction" },
      { name: "Academic & Reference", slug: "academic-reference" },
      { name: "Children's Books", slug: "children-books" },
      { name: "Stationery & Pens", slug: "stationery" },
    ],
  },
  {
    id: 7,
    name: "Home & Kitchen",
    slug: "home-kitchen",
    emoji: "🍳",
    icon: "🍳",
    description: "Refrigerators, kitchen appliances, cookware, dinnerware, bedding, pillows and home improvement.",
    subcategories: [
      { name: "Refrigerators & Freezers", slug: "refrigerators" },
      { name: "Home Improvement & Tools", slug: "home-improvement" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Bedding & Pillows", slug: "bedding-pillows" },
      { name: "Dinnerware & Cutlery", slug: "dinnerware" },
      { name: "Cookware & Non-Stick", slug: "cookware" },
      { name: "Storage & Organisation", slug: "storage-organisation" },
    ],
  },
  {
    id: 8,
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    emoji: "💄",
    icon: "💄",
    description: "Makeup & cosmetics, face serums, skincare, haircare, perfumes and grooming.",
    subcategories: [
      { name: "Makeup & Cosmetics", slug: "makeup" },
      { name: "Face Care & Serums", slug: "skincare" },
      { name: "Hair Care & Shampoos", slug: "haircare" },
      { name: "Cleansers & Face Wash", slug: "cleansers" },
      { name: "Men's Grooming", slug: "mens-grooming" },
      { name: "Fragrances & Perfumes", slug: "fragrances" },
      { name: "Bath & Body", slug: "bath-body" },
    ],
  },
  {
    id: 9,
    name: "Furniture & Home Decor",
    slug: "furniture-home-decor",
    emoji: "🛋️",
    icon: "🛋️",
    description: "Curtains, rugs, sofas, dining tables, study desks, beds, mattresses and lighting.",
    subcategories: [
      { name: "Curtains & Rugs", slug: "curtains-rugs" },
      { name: "Sofas & Seating", slug: "seating-sofas" },
      { name: "Tables & Desks", slug: "tables-chairs" },
      { name: "Home Decor & Wall Art", slug: "home-decor-items" },
      { name: "Beds & Mattresses", slug: "beds-mattresses" },
      { name: "Lighting & Lamps", slug: "lighting" },
    ],
  },
  {
    id: 10,
    name: "Toys & Kids",
    slug: "toys-kids",
    emoji: "🧸",
    icon: "🧸",
    description: "Baby care, educational toys, STEM learning, board games, action figures and toddler toys.",
    subcategories: [
      { name: "Baby Care & Essentials", slug: "baby-care" },
      { name: "Educational & STEM Toys", slug: "learning-toys" },
      { name: "Baby Toys & Toddlers", slug: "baby-toys" },
      { name: "Board Games & Puzzles", slug: "board-games" },
      { name: "Action Figures & Dolls", slug: "action-figures" },
      { name: "Remote Control Toys", slug: "rc-toys" },
    ],
  },
  {
    id: 11,
    name: "Sports & Fitness",
    slug: "sports-fitness",
    emoji: "🏋️",
    icon: "🏋️",
    description: "Cricket gear, badminton racquets, gym dumbbells, football, fitness accessories and yoga mats.",
    subcategories: [
      { name: "Cricket Equipment", slug: "cricket-gear" },
      { name: "Badminton & Tennis", slug: "badminton-sports" },
      { name: "Sports Accessories", slug: "sports-accessories" },
      { name: "Gym & Strength Training", slug: "gym-fitness" },
      { name: "Football & Team Sports", slug: "football-sports" },
      { name: "Resistance & Core Fitness", slug: "resistance-fitness" },
      { name: "Yoga & Meditation", slug: "yoga-meditation" },
    ],
  },
];

// Helper: map of slug -> display name
export const SLUG_TO_NAME_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const cat of CANONICAL_CATEGORIES) {
    map[cat.slug] = cat.name;
    for (const sub of cat.subcategories) {
      map[sub.slug] = sub.name;
    }
  }
  return map;
})();

// Helper: find parent category by any slug (parent or child)
export function getParentCategoryForSlug(slug: string): ParentCategory | undefined {
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.slug === clean) return cat;
    for (const sub of cat.subcategories) {
      if (sub.slug === clean) return cat;
    }
  }
  return undefined;
}

// Helper: get display name for any category/subcategory slug
export function getCategoryDisplayName(slug: string): string {
  if (!slug) return "All Products";
  const clean = slug.trim().toLowerCase();
  return SLUG_TO_NAME_MAP[clean] || clean.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
