package com.novacart.repository;

import com.novacart.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Product> {

    Page<Product> findBySellerId(Long sellerId, Pageable pageable);

    @Query(value = """
        select p from Product p
        left join fetch p.seller
        left join fetch p.category cat
        left join fetch p.inventory
        where p.active = true
          and (cast(:keyword as string) is null or (
                p.name        ilike concat('%', cast(:keyword as string), '%')
             or p.description ilike concat('%', cast(:keyword as string), '%')
             or p.brand       ilike concat('%', cast(:keyword as string), '%')
          ))
          and (:categoryIds is null or cat.id in :categoryIds)
          and (:minPrice   is null or p.price >= :minPrice)
          and (:maxPrice   is null or p.price <= :maxPrice)
          and (:sellerId   is null or p.seller.id = :sellerId)
          and (:minRating  is null or p.averageRating >= :minRating)
          and (cast(:brand as string) is null or lower(p.brand) = lower(cast(:brand as string)) or p.brand ilike concat('%', cast(:brand as string), '%'))
          and (cast(:color as string) is null or p.color ilike concat('%', cast(:color as string), '%'))
          and (cast(:size as string)  is null or p.size  ilike concat('%', cast(:size as string), '%') or p.specifications ilike concat('%', cast(:size as string), '%'))
          and (:minDiscount is null or p.discountPercent >= :minDiscount)
    """,
    countQuery = """
        select count(p) from Product p
        left join p.category cat
        where p.active = true
          and (cast(:keyword as string) is null or (
                p.name        ilike concat('%', cast(:keyword as string), '%')
             or p.description ilike concat('%', cast(:keyword as string), '%')
             or p.brand       ilike concat('%', cast(:keyword as string), '%')
          ))
          and (:categoryIds is null or cat.id in :categoryIds)
          and (:minPrice   is null or p.price >= :minPrice)
          and (:maxPrice   is null or p.price <= :maxPrice)
          and (:sellerId   is null or p.seller.id = :sellerId)
          and (:minRating  is null or p.averageRating >= :minRating)
          and (cast(:brand as string) is null or lower(p.brand) = lower(cast(:brand as string)) or p.brand ilike concat('%', cast(:brand as string), '%'))
          and (cast(:color as string) is null or p.color ilike concat('%', cast(:color as string), '%'))
          and (cast(:size as string)  is null or p.size  ilike concat('%', cast(:size as string), '%') or p.specifications ilike concat('%', cast(:size as string), '%'))
          and (:minDiscount is null or p.discountPercent >= :minDiscount)
    """)
    Page<Product> search(@Param("keyword")     String keyword,
                         @Param("categoryIds") List<Long> categoryIds,
                         @Param("minPrice")    BigDecimal minPrice,
                         @Param("maxPrice")    BigDecimal maxPrice,
                         @Param("sellerId")    Long sellerId,
                         @Param("minRating")   Double minRating,
                         @Param("brand")       String brand,
                         @Param("color")       String color,
                         @Param("size")        String size,
                         @Param("minDiscount") BigDecimal minDiscount,
                         Pageable pageable);

    @Query("""
        select p.brand, count(p) from Product p
        where p.active = true
          and p.category.id in :categoryIds
          and p.brand is not null
          and trim(p.brand) != ''
        group by p.brand
        order by count(p) desc
    """)
    List<Object[]> findBrandsWithCountByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query("""
        select p.brand, count(p) from Product p
        where p.active = true
          and p.brand is not null
          and trim(p.brand) != ''
        group by p.brand
        order by count(p) desc
    """)
    List<Object[]> findAllBrandsWithCount();

    @Query("""
        select p from Product p
        left join fetch p.seller
        left join fetch p.category cat
        left join fetch p.inventory
        where p.active = true
          and p.id != :excludeId
          and cat.id in :categoryIds
        order by 
          case when p.brand = :brand then 1 else 2 end,
          p.averageRating desc,
          p.reviewCount desc
    """)
    List<Product> findSimilarProducts(@Param("excludeId") Long excludeId,
                                      @Param("categoryIds") List<Long> categoryIds,
                                      @Param("brand") String brand,
                                      Pageable pageable);

    @Query("""
        select p from Product p
        left join fetch p.seller
        left join fetch p.category cat
        left join fetch p.inventory
        where p.active = true
          and cat.id in :categoryIds
          and p.id != :excludeId
        order by p.averageRating desc, p.reviewCount desc
    """)
    List<Product> findTopRatedInCategory(@Param("categoryIds") List<Long> categoryIds,
                                         @Param("excludeId") Long excludeId,
                                         Pageable pageable);

    @Query("""
        select p from Product p
        left join fetch p.seller
        left join fetch p.category cat
        left join fetch p.inventory
        where p.active = true
        order by p.averageRating desc, p.reviewCount desc
    """)
    List<Product> findTopRatedGlobal(Pageable pageable);

    @Query("""
        select p from Product p
        left join fetch p.category cat
        where p.active = true
          and (
             p.name ilike concat('%', cast(:query as string), '%')
          or p.brand ilike concat('%', cast(:query as string), '%')
          or cat.name ilike concat('%', cast(:query as string), '%')
          )
        order by
          case
            when p.name ilike concat(cast(:query as string), '%') then 1
            when p.brand ilike concat(cast(:query as string), '%') then 2
            when p.name ilike concat('%', cast(:query as string), '%') then 3
            else 4
          end,
          p.averageRating desc,
          p.reviewCount desc
    """)
    List<Product> findSearchSuggestions(@Param("query") String query, Pageable pageable);

    @Query("""
        select p from Product p
        left join fetch p.seller
        left join fetch p.category cat
        left join fetch p.inventory
        where p.active = true
          and p.id in :ids
    """)
    List<Product> findAllByIdIn(@Param("ids") List<Long> ids);
}
