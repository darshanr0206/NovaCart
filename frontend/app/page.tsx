import { CompactHeroBanner } from "@/components/home/compact-hero-banner";
import { TopDealsSection } from "@/components/home/top-deals-section";
import { FlashSaleBanner } from "@/components/home/flash-sale-banner";
import { NewOnNovacartSection } from "@/components/home/new-on-novacart-section";
import { MoreProductsSection } from "@/components/home/more-products-section";
import { CustomerReviews } from "@/components/home/customer-reviews";

export default function HomePage() {
  return (
    <div className="w-full pb-24 md:pb-12 overflow-x-clip">
      <div className="container-content w-full py-3 sm:py-5 space-y-5 sm:space-y-7">

        {/* 1. Hero Banner — carousel with benefit badges */}
        <CompactHeroBanner />

        {/* 2. Top Deals for You — mixed-category horizontal carousel */}
        <TopDealsSection />

        {/* 3. Flash Sale — promotional banner only, NO product row below it */}
        <FlashSaleBanner />

        {/* 4. New on NovaCart — newest products carousel (API: sortBy=newest) */}
        <NewOnNovacartSection />

        {/* 5. More Products for You — popular mixed-category carousel (API: sortBy=popularity) */}
        <MoreProductsSection />

        {/* 6. Customer Reviews + Newsletter */}
        <CustomerReviews />

      </div>
    </div>
  );
}
