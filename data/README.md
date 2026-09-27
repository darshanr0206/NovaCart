# NovaCart Datasets Directory

This folder contains e-commerce sample datasets from Amazon India and Flipkart extracted for product catalog analysis, seeding, and category reference.

---

## 📂 Available Datasets

### 1. Amazon India Products Dataset
- **File**: [`amz_in_total_products_data_processed.csv`](file:///Users/Tarfeen/Downloads/NovaCart%20/data/amz_in_total_products_data_processed.csv)
- **Size**: ~639 MB (1,589,161 lines / ~500k+ products)
- **Schema**:
  - `asin`: Amazon Standard Identification Number
  - `title`: Product title / name
  - `imgUrl`: High-resolution product thumbnail/image URL
  - `productURL`: Direct product URL
  - `stars`: Customer star rating (0.0 – 5.0)
  - `reviews`: Total customer reviews count
  - `price`: Effective selling price in INR (₹)
  - `listPrice`: Maximum retail price (MRP)
  - `categoryName`: Sub-category / department
  - `isBestSeller`: Boolean flag
  - `boughtInLastMonth`: Estimated monthly velocity

---

### 2. Flipkart E-Commerce Sample Dataset
- **File**: [`flipkart_com-ecommerce_sample.csv`](file:///Users/Tarfeen/Downloads/NovaCart%20/data/flipkart_com-ecommerce_sample.csv)
- **Size**: ~36 MB (~42,950 lines / ~20,000 products)
- **Schema**:
  - `uniq_id` / `pid`: Unique product identifier
  - `crawl_timestamp`: Crawl timestamp
  - `product_url`: Product URL
  - `product_name`: Full product name
  - `product_category_tree`: Category hierarchy (e.g. `["Clothing >> Women's Clothing >> ..."]`)
  - `retail_price`: MRP / Retail price
  - `discounted_price`: Discounted offer price
  - `image`: JSON array of product image URLs
  - `is_FK_Advantage_product`: Flipkart advantage flag
  - `description`: Rich product description
  - `product_rating`: Average rating
  - `overall_rating`: Overall customer rating
  - `brand`: Brand name
  - `product_specifications`: Key-value product specifications JSON
