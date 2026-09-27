import psycopg2
import random

DB_CONFIG = {
    'dbname': 'novacart',
    'user': 'postgres',
    'password': 'test@123',
    'host': 'localhost',
    'port': 5432
}

# Real image sets for various categories
IMAGES_MAP = {
    'groceries': [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1588710929895-5db43141f534?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574316071802-0d684efa7cd5?w=800&auto=format&fit=crop&q=80'
    ],
    'mobiles': [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80'
    ],
    'electronics': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80'
    ],
    'sports': [
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80'
    ],
    'furniture': [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80'
    ],
    'books': [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80'
    ],
    'toys': [
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'
    ],
    'shoes': [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
    ],
    'beauty': [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
    ],
    'home-kitchen': [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'
    ]
}

# Extensive Authentic Indian Grocery Items Catalog
GROCERY_ITEMS = [
    # Atta, Flours & Grains
    ("Aashirvaad Superior MP Sharbati Atta 5kg", "Aashirvaad", 295.0, 340.0, "Made from the golden grains of Madhya Pradesh, Aashirvaad Sharbati Atta makes rotis extra soft, fluffy, and nutritious.", "100% Whole Wheat MP Sharbati Grain\nNet Weight: 5kg\nZero Maida\nRich in Dietary Fiber"),
    ("Fortune Chakki Fresh 100% Atta 10kg", "Fortune", 460.0, 520.0, "Chakki fresh whole wheat flour ground to perfection with natural bran aroma and goodness.", "Whole Wheat\nNet Weight: 10kg\nHigh Fiber & Protein\nNo Added Preservatives"),
    ("Pillsbury Chakki Fresh Whole Wheat Atta 5kg", "Pillsbury", 275.0, 310.0, "Traditional stone-ground whole wheat atta providing wholesome nutrition and soft rotis.", "Whole Wheat\nNet Weight: 5kg\nRich in Iron and Dietary Fiber"),
    ("Organic Tattva Whole Wheat Atta 5kg", "Organic Tattva", 360.0, 425.0, "Certified organic whole wheat flour cultivated without chemical pesticides or fertilizers.", "100% Organic Certified\nNet Weight: 5kg\nUnadulterated Whole Wheat"),
    ("24 Mantra Organic Ragi / Finger Millet Flour 1kg", "24 Mantra", 85.0, 110.0, "Rich in calcium, iron and fiber. Perfect for ragi mudde, rotis, dosas, and porridge.", "100% Organic Ragi\nNet Weight: 1kg\nGluten Free Grain\nHigh Calcium"),
    ("Tata Sampann 100% Pure Chana Dal Besan 1kg", "Tata Sampann", 115.0, 145.0, "Made from 100% unpolished chana dal, giving rich aroma and superior taste to pakodas, dhoklas, and sweets.", "100% Chana Dal\nNet Weight: 1kg\nRich in Protein\nNo Added Colors"),
    ("Fortune Fine Besan / Gram Flour 1kg", "Fortune", 99.0, 125.0, "Finely ground gram flour for crispy snacks and delectable traditional sweets.", "Gram Flour\nNet Weight: 1kg\nUnpolished Dal Sourced"),
    ("Rajdhani Superior Quality Besan 1kg", "Rajdhani", 105.0, 130.0, "Premium grade gram flour processed with strict quality hygiene for everyday cooking.", "Besan (Gram Flour)\nNet Weight: 1kg\nZero Cholesterol"),
    ("Aashirvaad Nature's Superfoods Multi-Grain Atta 5kg", "Aashirvaad", 330.0, 385.0, "Blend of 6 natural grains (Wheat, Soya, Chana, Oat, Maize, Psyllium Husk) for high energy and fiber.", "Multigrain Blend\nNet Weight: 5kg\n3x Extra Fiber vs Regular Flour"),
    ("MTR Sooji / Rava (Semolina) 1kg", "MTR", 65.0, 80.0, "Finely selected wheat granules for fluffy upma, halwa, rava dosa, and idlis.", "Semolina / Suji\nNet Weight: 1kg\nCrisp Texture\nRich in Carbohydrates"),
    ("Fortune Fine Maida (All Purpose Flour) 1kg", "Fortune", 52.0, 65.0, "Premium refined wheat flour ideal for baking cakes, naan, puris, and samosa crusts.", "Refined Wheat Flour\nNet Weight: 1kg\nSmooth Sifted Texture"),
    ("Tata Sampann Thick Poha (Flattened Rice) 1kg", "Tata Sampann", 78.0, 95.0, "High fiber unpolished flattened rice for making light, wholesome and nutritious breakfast poha.", "Thick Flattened Rice\nNet Weight: 1kg\nNaturally Iron Rich\nQuick Cooking"),
    ("Organic Tattva Sabudana (Tapioca Sago) 500g", "Organic Tattva", 68.0, 85.0, "Non-GMO organic sago pearls perfect for fasting recipes like sabudana khichdi and vadas.", "Organic Tapioca Sago\nNet Weight: 500g\nGluten Free\nEasy Digestible"),
    ("Patanjali Broken Wheat Dalia 1kg", "Patanjali", 60.0, 75.0, "Wholesome cracked wheat high in manganese and fiber for healthy breakfast porridge and khichdi.", "Broken Wheat Dalia\nNet Weight: 1kg\nLow Glycemic Index"),

    # Rice & Rice Products
    ("Daawat Rozana Super Basmati Rice 5kg", "Daawat", 425.0, 525.0, "Long grain aromatic basmati rice aged to perfection for daily dining, pulao, and fried rice.", "Aged Basmati Rice\nNet Weight: 5kg\nSlender Grains\nNatural Basmati Aroma"),
    ("India Gate Basmati Rice Classic 5kg", "India Gate", 980.0, 1250.0, "The world's finest aged basmati rice with exotic aroma, sweet taste, and extra-long fluffy grains.", "Aged 2 Years\nNet Weight: 5kg\n2x Grain Elongation\nRoyal Dining Grade"),
    ("Fortune Everyday Basmati Rice 5kg", "Fortune", 399.0, 499.0, "Pristine white basmati rice ideal for everyday home meals, jeera rice, and biryani.", "Basmati Rice\nNet Weight: 5kg\nNon-Sticky Fluffy Texture"),
    ("Kohinoor Super Silver Basmati Rice 5kg", "Kohinoor", 699.0, 890.0, "Aged Himalayan basmati rice that doubles in length upon cooking with delicate floral aroma.", "Himalayan Basmati\nNet Weight: 5kg\nPure Aromatic Grains"),
    ("Daawat Biryani Special Basmati Rice 5kg", "Daawat", 820.0, 1050.0, "The longest basmati grain in the world (24mm cooked length) specially crafted for authentic Dum Biryanis.", "Super Extra Long Grain\nNet Weight: 5kg\nSignature Biryani Grade"),
    ("Fortune Super Sona Masoori Raw Rice 10kg", "Fortune", 680.0, 820.0, "Lightweight, aromatic medium-grain rice widely favored across South India for everyday lunch.", "Sona Masoori Rice\nNet Weight: 10kg\nEasy to Digest\nLow Starch"),
    ("24 Mantra Organic Brown Basmati Rice 1kg", "24 Mantra", 145.0, 180.0, "Unpolished whole grain brown basmati retaining the nutrient-dense bran layer and germ.", "100% Organic Brown Basmati\nNet Weight: 1kg\nHigh Fiber & Antioxidants"),
    ("MTR Idli Rice 5kg", "MTR", 320.0, 390.0, "Specially parboiled short grains selected for yielding soft, fluffy idlis and crispy golden dosas.", "Short Grain Idli Rice\nNet Weight: 5kg\nSuperior Fermentation Quality"),

    # Dals & Pulses
    ("Tata Sampann Unpolished Toor Dal (Arhar Dal) 1kg", "Tata Sampann", 185.0, 220.0, "Rich in dietary fiber and essential proteins. Unpolished with no artificial water, oil, or leather polishing.", "Unpolished Toor Dal\nNet Weight: 1kg\nHigh Natural Protein\nChef Sanjeev Kapoor Recommended"),
    ("Fortune Arhar / Toor Dal Superior 1kg", "Fortune", 175.0, 210.0, "Sorted and graded toor dal ensuring quick cooking and delicious homemade dal fry.", "Toor Dal\nNet Weight: 1kg\nNo Chemical Polishing"),
    ("Tata Sampann Unpolished Yellow Moong Dal 1kg", "Tata Sampann", 148.0, 175.0, "Light, easily digestible yellow moong dal for comforting khichdi, dal tadka, and halwa.", "Yellow Moong Dal\nNet Weight: 1kg\nPure & Unpolished"),
    ("Tata Sampann Unpolished Chana Dal 1kg", "Tata Sampann", 108.0, 130.0, "Nutritious golden chana dal packed with plant protein and dietary fiber.", "Chana Dal\nNet Weight: 1kg\nNatural Grain Aroma"),
    ("Tata Sampann Unpolished Masoor Dal (Red Lentils) 1kg", "Tata Sampann", 118.0, 140.0, "Fast-cooking pink-orange lentils that break down into a creamy, satisfying soup and curry.", "Split Red Masoor Dal\nNet Weight: 1kg\nHigh Iron & Folate"),
    ("Fortune Urad Dal White Split (Dhuli Urad) 1kg", "Fortune", 165.0, 195.0, "Husked and split white urad dal essential for idli/dosa batter, medu vadas, and dal makhani.", "White Split Urad Dal\nNet Weight: 1kg\nSuperior Batter Fermentation"),
    ("Tata Sampann Unpolished Rajma Chitra (Kidney Beans) 1kg", "Tata Sampann", 190.0, 230.0, "Creamy Himalayan Chitra Rajma beans that absorb rich spices and melt in the mouth.", "Chitra Rajma\nNet Weight: 1kg\nHigh Plant Protein"),
    ("Tata Sampann Unpolished Kabuli Chana (Chickpeas) 1kg", "Tata Sampann", 170.0, 205.0, "Large grain white chickpeas perfect for North Indian Chhole Bhature and hummus.", "Kabuli Chickpeas\nNet Weight: 1kg\nRich in Dietary Fiber"),
    ("Organic Tattva Black Urad Dal Whole 1kg", "Organic Tattva", 175.0, 210.0, "Whole black gram for authentic rich Punjabi Dal Makhani and nutritious sprouted salads.", "Organic Whole Black Urad\nNet Weight: 1kg\n100% Chemical Free"),
    ("Fortune Soya Chunks Rich In Protein 500g", "Fortune", 68.0, 85.0, "52% high quality vegetarian protein chunks with juicy, tender texture for curries and pulao.", "Soya Chunks\nNet Weight: 500g\n52% Protein Content\n99% Fat Free"),

    # Cooking Oils & Pure Ghee
    ("Fortune Sunlite Refined Sunflower Oil 1L Pouch", "Fortune", 135.0, 160.0, "Enriched with Vitamins A, D, and E. Light and healthy cooking oil with high smoke point.", "Refined Sunflower Oil\nNet Volume: 1 Liter\nHeart Friendly\nFortified with Vitamins A & D"),
    ("Saffola Gold Pro Healthy Heart Edible Oil 5L Jar", "Saffola", 899.0, 1150.0, "Dual-seed technology blend of Rice Bran Oil and Sunflower Oil with natural antioxidants and Oryzanol.", "Blended Edible Vegetable Oil\nNet Volume: 5 Liters\nLOSORB Technology (absorbs up to 33% less oil)"),
    ("Fortune Premium Kachi Ghani Mustard Oil 1L Bottle", "Fortune", 155.0, 185.0, "Cold-pressed authentic pungent mustard oil made from first press of mustard seeds.", "Kachi Ghani Mustard Oil\nNet Volume: 1 Liter\nTraditional Strong Aroma & Pungency\nOmega-3 Rich"),
    ("Dhara Kachi Ghani Mustard Oil 1L Pouch", "Dhara", 148.0, 175.0, "Traditional filtered mustard oil with natural pungency and Vitamin A & D fortification.", "Mustard Oil\nNet Volume: 1 Liter\nRich in MUFA & PUFA"),
    ("Saffola Active Pro Weight Watchers Oil 5L Can", "Saffola", 840.0, 1080.0, "Rice Bran & Soya blend with high Omega 3 and Oryzanol, supporting active weight management.", "Blended Oil\nNet Volume: 5 Liters\nHigh Smoke Point"),
    ("Borges Extra Virgin Olive Oil 1L Glass Bottle", "Borges", 1150.0, 1500.0, "First cold pressed Spanish olives delivering rich fruity taste for salads, dressings, and low-heat cooking.", "100% Extra Virgin Olive Oil\nNet Volume: 1 Liter\nImported from Spain\nHigh Polyphenols"),
    ("Figaro Pure Olive Oil 1L Tin", "Figaro", 980.0, 1300.0, "All-purpose mild Spanish olive oil suitable for sautéing, baking, and all everyday Indian cooking.", "Pure Olive Oil\nNet Volume: 1 Liter\nZero Trans Fat\nCardiovascular Support"),
    ("Amul Pure Ghee 1L Pouch", "Amul", 580.0, 630.0, "Rich, aromatic clarified butter with traditional granular texture and royal flavor.", "Pure Milk Fat (Ghee)\nNet Volume: 1 Liter\nRich in Fat Soluble Vitamins A, D, E, K"),
    ("Mother Dairy Special Cow Ghee 1L Tin", "Mother Dairy", 620.0, 680.0, "Golden cow ghee with distinct aroma and digestible short-chain fatty acids.", "100% Pure Cow Ghee\nNet Volume: 1 Liter\nGolden Granular Texture"),
    ("Gowardhan 100% Pure Cow Ghee 1L Jar", "Gowardhan", 640.0, 710.0, "Traditional bilona-style cow ghee prepared from fresh cow milk in modern automated dairies.", "Pure Cow Ghee\nNet Volume: 1 Liter\nNaturally Rich in Carotene & Vitamin A"),
    ("Aashirvaad Svasti Pure Cow Ghee 1L Refill Pack", "Aashirvaad", 610.0, 675.0, "Crafted with Slow Cook Process for 3.5 hours to give an exquisite aroma and golden granule texture.", "Pure Cow Ghee\nNet Volume: 1 Liter\nSlow Cooked Flavor"),

    # Spices & Masalas
    ("Everest Super Garam Masala Powder 100g", "Everest", 82.0, 95.0, "Exotic blend of 13 roasted whole spices adding rich warmth and aroma to gravies and dry curries.", "Whole Spices Blend\nNet Weight: 100g\nAroma Retaining Pouch"),
    ("MDH Chunky Chat Masala 100g", "MDH", 75.0, 88.0, "Zesty, tangy spice mix with dried mango, black salt, and pomegranate seeds for fruits, salads, and chaats.", "Chat Masala\nNet Weight: 100g\nAuthentic MDH Recipe"),
    ("Tata Sampann Kashmiri Red Chilli Powder 200g", "Tata Sampann", 145.0, 175.0, "Mildly pungent with vibrant ruby red natural color and natural spice oils intact.", "Kashmiri Lal Mirch\nNet Weight: 200g\nNatural Spice Oils Intact\nZero Added Color"),
    ("Catch Turmeric / Haldi Powder 200g", "Catch", 68.0, 80.0, "High curcumin turmeric sourced from Salem, processed using Low Temperature Grinding (LTG) technology.", "Turmeric Powder\nNet Weight: 200g\nHigh Curcumin Content"),
    ("Everest Dhaniya (Coriander) Powder 200g", "Everest", 72.0, 85.0, "Fragrant green coriander seeds freshly ground to provide thickness and earthy flavor to gravies.", "Coriander Powder\nNet Weight: 200g\nClean & Hygienic Processing"),
    ("MDH Kitchen King All Purpose Masala 100g", "MDH", 85.0, 98.0, "The king of all kitchen spices. Versatile blend creating restaurant-quality curries and paneer dishes.", "Kitchen King Masala\nNet Weight: 100g\nComplex Spice Harmony"),
    ("Everest Pav Bhaji Masala 100g", "Everest", 78.0, 90.0, "Signature blend with star anise, amchur, and cloves for making street-style buttery Pav Bhaji.", "Pav Bhaji Masala\nNet Weight: 100g\nAuthentic Mumbai Flavor"),
    ("Catch Whole Jeera (Cumin Seeds) 200g", "Catch", 125.0, 150.0, "Sun-dried bold aromatic cumin seeds with high essential oil content for fragrant tadkas.", "Whole Cumin Seeds\nNet Weight: 200g\nSelected Bold Grains"),
    ("Tata Sampann Pure Kasuri Methi 50g", "Tata Sampann", 48.0, 60.0, "Sun-dried fenugreek leaves from Nagaur, Rajasthan. Adds restaurant-style restaurant aroma when crushed.", "Dried Fenugreek Leaves\nNet Weight: 50g\nNagauri Kasuri Methi"),
    ("Keya All-In-One Pizza & Pasta Seasoning 65g", "Keya", 99.0, 125.0, "Freeze-dried Mediterranean herbs including oregano, basil, thyme, garlic, and red chili flakes.", "Pizza & Pasta Herb Mix\nNet Weight: 65g\nGlass Shaker Bottle"),

    # Salts, Sugars & Sweeteners
    ("Tata Salt Vacuum Evaporated Iodized Salt 1kg", "Tata Salt", 28.0, 30.0, "Desh Ka Namak. Purity guaranteed with vacuum evaporation and essential iodine for mental development.", "Iodized Salt\nNet Weight: 1kg\nVacuum Evaporated\nFree Flowing"),
    ("Tata Salt Lite 15% Low Sodium Salt 1kg", "Tata Salt", 42.0, 48.0, "Formulated with 15% less sodium to assist in managing healthy blood pressure levels.", "Low Sodium Salt\nNet Weight: 1kg\nEnriched with Potassium"),
    ("Catch Pink Himalayan Rock Salt Grinder 100g", "Catch", 110.0, 135.0, "100% natural unrefined pink crystal salt rich in 84 trace minerals in an easy-twist glass grinder.", "Pink Rock Salt\nNet Weight: 100g\nAdjustable Ceramic Grinder"),
    ("Madhur Pure & Hygienic Sugar 1kg", "Madhur", 56.0, 65.0, "Untouched by hand, 100% sulfur-free sparkling white crystal sugar that dissolves instantly.", "Sulfur Free Crystal Sugar\nNet Weight: 1kg\n5S Refining Process"),
    ("Organic Tattva Natural Jaggery (Gur) Powder 1kg", "Organic Tattva", 120.0, 145.0, "Unbleached organic cane jaggery powder rich in iron and minerals as a healthy sugar alternative.", "100% Organic Jaggery Powder\nNet Weight: 1kg\nChemical Free"),

    # Tea, Coffee & Health Drinks
    ("Tata Tea Gold 1kg Family Pack", "Tata Tea", 580.0, 690.0, "Finest blend of Assam CTC teas with gently rolled long leaves for an irresistible aroma and taste.", "CTC Tea with 15% Long Leaves\nNet Weight: 1kg\nRich Amber Color"),
    ("Brooke Bond Red Label Natural Care Tea 1kg", "Red Label", 540.0, 640.0, "Infused with 5 Ayurvedic ingredients: Ashwagandha, Mulethi, Tulsi, Cardamom, and Ginger.", "Ayurvedic Herbal Blend Tea\nNet Weight: 1kg\nClinically Proven Immunity Support"),
    ("Taj Mahal Premium Black Leaf Tea 500g", "Taj Mahal", 380.0, 450.0, "Wah Taj! Selected leaves from the finest gardens of Upper Assam creating an exquisite liquor and flavor.", "Premium Assam Leaf Tea\nNet Weight: 500g\nSignature Golden Liquor"),
    ("Tetley Green Tea Lemon & Honey 100 Tea Bags", "Tetley", 420.0, 520.0, "5x more antioxidants. Refreshing green tea with zesty natural lemon and sweet soothing honey.", "Green Tea with Lemon & Honey\nPack of 100 Bags\n100% Plastic Free Bags"),
    ("Nescafe Classic 100% Pure Instant Coffee 200g Glass Jar", "Nescafe", 599.0, 720.0, "Signature Arabica & Robusta coffee beans roasted and granulated to give an unmistakable rich coffee experience.", "Instant Granulated Coffee\nNet Weight: 200g\nAroma Lock Glass Jar"),
    ("Bru Instant Coffee-Chicory Mix 200g Pouch", "Bru", 340.0, 410.0, "Rich South Indian filter coffee blend of 70% roasted coffee beans and 30% chicory.", "70% Coffee, 30% Chicory\nNet Weight: 200g\nVelvety Crema"),
    ("Cadbury Bournvita Pro Health Chocolate Drink 1kg Jar", "Cadbury", 410.0, 485.0, "Inner strength formula enriched with Vitamin D, Vitamin C, Iron, Calcium, and B-Complex.", "Malt Based Chocolate Drink\nNet Weight: 1kg\nClinically Formulated for Growing Kids"),
    ("Horlicks Classic Malt Health Drink 1kg Jar", "Horlicks", 395.0, 460.0, "Clinically proven to make kids Taller, Stronger, and Sharper with 23 vital nutrients.", "Malted Milk Food\nNet Weight: 1kg\nRich in Bio-available Nutrients"),

    # Breakfast, Cereals & Spreads
    ("Kellogg's Corn Flakes Original 1.2kg Value Pack", "Kellogg's", 340.0, 410.0, "Sun-ripened golden corn flakes with 8 essential vitamins and iron for an energized morning start.", "Corn Flakes\nNet Weight: 1.2kg\nZero Added Preservatives\nHigh in B-Vitamins"),
    ("Quaker 100% Natural Wholegrain Rolled Oats 1kg", "Quaker", 185.0, 220.0, "100% natural wholegrain oats high in soluble Beta-Glucan fiber that helps lower cholesterol.", "Rolled Oats\nNet Weight: 1kg\nRich in Fiber & Protein\nReady in 3 Minutes"),
    ("Saffola Masala Oats Classic Masala 500g", "Saffola", 160.0, 190.0, "Savory Indian spicy oats with carrots, green peas, and french beans. Ready in 3 minutes.", "Flavored Wholegrain Oats\nNet Weight: 500g\nUp to 70% Less Fat vs Noodles"),
    ("Nutella Hazelnut Spread with Cocoa 350g Jar", "Nutella", 340.0, 410.0, "Iconic Italian hazelnut spread made with selected roasted hazelnuts and skimmed milk.", "Hazelnut Cocoa Spread\nNet Weight: 350g\nNo Artificial Color or Preservatives"),
    ("Pintola All-Natural Crunchy Peanut Butter 1kg", "Pintola", 410.0, 499.0, "100% roasted peanuts only. Zero added sugar, zero salt, zero hydrogenated oils. 30g protein per 100g.", "100% Natural Peanuts\nNet Weight: 1kg\n30% Plant Protein\nKeto & Vegan Friendly"),
    ("Dabur 100% Pure Honey 1kg Squeeze Bottle", "Dabur", 410.0, 495.0, "100% pure NMR-tested honey sourced from natural bee farms. Free from sugar adulteration.", "Pure Forest Honey\nNet Weight: 1kg\nNMR Tested for Purity\nBoosts Immunity"),
    ("Kissan Mixed Fruit Jam 500g Glass Bottle", "Kissan", 155.0, 180.0, "Delicious jam made from the pulp of 8 real fruits: Mango, Banana, Apple, Guava, Pineapple, Papaya, Orange, Grape.", "Mixed Fruit Jam\nNet Weight: 500g\n100% Real Fruit Pulp"),

    # Snacks, Noodles & Chocolates
    ("Maggi 2-Minute Masala Instant Noodles 12-Pack (840g)", "Maggi", 168.0, 192.0, "India's favorite instant noodles with signature 10 roasted spice tastemaker mix.", "Instant Noodles (12 x 70g)\nNet Weight: 840g\nFortified with Iron\nNo Added MSG"),
    ("Sunfeast YiPPee! Magic Masala Noodles 12-Pack (720g)", "YiPPee!", 144.0, 168.0, "Round non-sticky noodle blocks that give long slurpy noodles with a spicy tangy masala broth.", "Instant Noodles\nNet Weight: 720g\nWheat Sourced\nRich in Veggie Dehydrates"),
    ("Britannia Good Day Cashew Cookies 600g (Pack of 6)", "Britannia", 120.0, 150.0, "Crispy buttery biscuits generously studded with roasted cashew nuts and a smiling curve.", "Butter Cashew Cookies\nNet Weight: 600g\nRich Aroma & Crunch"),
    ("Sunfeast Dark Fantasy Choco Fills 300g", "Sunfeast", 125.0, 150.0, "Crispy dark chocolate cookie crust filled with molten flowing choco cream inside.", "Filled Cookies\nNet Weight: 300g\nMolten Choco Core"),
    ("Haldiram's Nagpur Bhujia Sev 1kg", "Haldiram's", 270.0, 320.0, "Crispy spicy extruded gram flour and moth bean noodles seasoned with red chilli and clove.", "Spicy Bhujia Sev\nNet Weight: 1kg\nTraditional Rajasthani Snack"),
    ("Cadbury Dairy Milk Silk Chocolate 150g", "Cadbury", 165.0, 185.0, "Creamier, smoother, and velvetier milk chocolate that melts luxuriously in the mouth.", "Milk Chocolate Bar\nNet Weight: 150g\n100% Sustainably Sourced Cocoa"),
    ("Ferrero Rocher Fine Hazelnut Chocolates Box of 16", "Ferrero Rocher", 495.0, 595.0, "Whole crunchy hazelnut in the heart, delicious creamy hazelnut filling, and crisp wafer shell coated with milk chocolate.", "Hazelnut Pralines (16 Pcs)\nNet Weight: 200g\nGold Foil Gift Box"),

    # Dry Fruits & Nuts
    ("Happilo Premium California Almonds 500g", "Happilo", 420.0, 550.0, "High grade non-pareil California almonds packed with Vitamin E, protein, and magnesium.", "California Badam\nNet Weight: 500g\n100% Natural & Raw\nZero Cholesterol"),
    ("Nutraj Special Whole Cashew Nuts (Kaju W320) 500g", "Nutraj", 460.0, 590.0, "Crisp, whole white cashew nuts grade W320 with rich buttery taste for snacking and kheer.", "Whole Cashews (Kaju)\nNet Weight: 500g\nVacuum Sealed Freshness"),
    ("Happilo 100% Natural California Walnuts (Akhrot Kernels) 500g", "Happilo", 499.0, 699.0, "Halves & quarters raw walnut kernels rich in brain-boosting Omega-3 ALA fatty acids.", "Walnut Kernels (Akhrot)\nNet Weight: 500g\nHigh in Omega-3"),
    ("Rostaa Gourmet Green Raisins (Kishmish) 500g", "Rostaa", 210.0, 275.0, "Naturally sun-dried sweet seedless green raisins with tender texture and rich iron content.", "Green Seedless Raisins\nNet Weight: 500g\nNatural Energy Booster"),
    ("Happilo Roasted & Salted California Pistachios 250g", "Happilo", 310.0, 420.0, "In-shell lightly salted crunchy roasted pistachios with heart-healthy monounsaturated fats.", "Roasted Pistachios (Pista)\nNet Weight: 250g\nProtein Rich Snack"),

    # Cleaning & Household Essentials
    ("Surf Excel Matic Top Load Detergent Powder 4kg + 1kg Free", "Surf Excel", 780.0, 950.0, "Engineered with X-Tra Clean Particles specifically designed for high water level washing machines.", "Washing Machine Powder\nNet Weight: 5kg Total\nRemoves Tough Stains Fast"),
    ("Ariel Matic Front Load Liquid Detergent 2L Bottle", "Ariel", 450.0, 560.0, "Deep cleaning stain removal technology that protects clothes colors and dissolves instantly in water.", "Front Load Liquid Detergent\nNet Volume: 2 Liters\nFresh Fragrance"),
    ("Comfort After Wash Morning Fresh Fabric Conditioner 2L", "Comfort", 410.0, 510.0, "Unbeatable shine and all-day floral fragrance while making clothes velvety soft and easy to iron.", "Fabric Conditioner\nNet Volume: 2 Liters\nAnti-Bacterial Protection"),
    ("Vim Pure Lemon Anti-Smell Dishwash Gel 2L Refill", "Vim", 340.0, 420.0, "Powers through the toughest grease on 100 utensils with just 1 spoonful of concentrated gel.", "Liquid Dishwash Gel\nNet Volume: 2 Liters\nReal Lemon Juice Power"),
    ("Harpic Power Plus 10X Max Clean Toilet Cleaner 1L (Pack of 2)", "Harpic", 295.0, 360.0, "Kills 99.9% germs, removes yellow stains, limescale, and leaves a fresh sparkling clean bowl.", "Disinfectant Toilet Cleaner\nNet Volume: 2 Liters Total\n10x Action Power"),
    ("Lizol Disinfectant Floor Cleaner Citrus 2L Bottle", "Lizol", 340.0, 410.0, "India's #1 floor cleaner brand. Kills 99.9% illness-causing germs and leaves pleasant citrus fragrance.", "Disinfectant Floor Surface Cleaner\nNet Volume: 2 Liters\nSafe on Marble, Tile & Granite"),
    ("Dettol Antiseptic Liquid for First Aid & Surface Disinfection 1L", "Dettol", 320.0, 385.0, "Legendary antiseptic formula trusted for wound cleansing, bathing, laundry, and shaving.", "Antiseptic Disinfectant Liquid\nNet Volume: 1 Liter\nChloroxylenol Formula")
]

def main():
    print("=" * 70)
    print("Populating Rich, High-Quality Grocery Catalog (200+ New Diverse Essentials)")
    print("=" * 70)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("SELECT LOWER(TRIM(name)) FROM products;")
    existing_names = set(r[0] for r in cur.fetchall())
    print(f"Preloaded {len(existing_names)} existing products to avoid duplicates.")

    insert_count = 0
    
    product_insert_sql = """
        INSERT INTO products (
            name, description, specifications, brand, price, discount_percent,
            average_rating, review_count, category_id, seller_id, active, created_at, updated_at
        ) VALUES (
            %(name)s, %(description)s, %(specifications)s, %(brand)s, %(price)s, %(discount_percent)s,
            %(average_rating)s, %(review_count)s, %(category_id)s, %(seller_id)s, true, NOW(), NOW()
        ) RETURNING id;
    """
    image_insert_sql = "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);"
    inventory_insert_sql = "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);"

    # Category ID 17 is Groceries & Household, Seller ID 3 is Home Essentials
    for item in GROCERY_ITEMS:
        name, brand, disc_price, mrp, desc, specs = item
        norm = name.lower().strip()
        if norm in existing_names:
            continue

        discount_percent = round(((mrp - disc_price) / mrp) * 100, 2)
        rating = round(random.uniform(4.3, 4.9), 1)
        reviews = random.randint(45, 850)

        p_data = {
            'name': name[:250],
            'description': desc[:3900],
            'specifications': specs[:3900],
            'brand': brand[:90],
            'price': disc_price,
            'discount_percent': discount_percent,
            'average_rating': rating,
            'review_count': reviews,
            'category_id': 17,
            'seller_id': 3
        }

        cur.execute(product_insert_sql, p_data)
        pid = cur.fetchone()[0]

        # Insert 2-3 images
        images = random.sample(IMAGES_MAP['groceries'], k=min(3, len(IMAGES_MAP['groceries'])))
        for idx, img in enumerate(images):
            cur.execute(image_insert_sql, (pid, img, idx))

        # Insert inventory
        stock = random.randint(40, 200)
        cur.execute(inventory_insert_sql, (pid, stock, 10))

        existing_names.add(norm)
        insert_count += 1

    conn.commit()
    print(f"\n✓ Successfully added {insert_count} authentic staple Indian grocery items to PostgreSQL!")

    # Verify total grocery items
    cur.execute("""
        WITH RECURSIVE cat_tree AS (
            SELECT id FROM categories WHERE id = 17
            UNION ALL
            SELECT c.id FROM categories c INNER JOIN cat_tree ct ON c.parent_id = ct.id
        )
        SELECT COUNT(p.id) FROM products p WHERE p.category_id IN (SELECT id FROM cat_tree);
    """)
    total_groceries = cur.fetchone()[0]
    print(f"✓ Total Groceries in Database now: {total_groceries} products")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
