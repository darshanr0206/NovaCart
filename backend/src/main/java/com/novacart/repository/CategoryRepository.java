package com.novacart.repository;

import com.novacart.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findBySlugIn(List<String> slugs);
    List<Category> findByParentIsNullOrderByIdAsc();
    List<Category> findByParentIdOrderByNameAsc(Long parentId);

    @Query(value = "WITH RECURSIVE cat_tree AS (" +
            "SELECT id FROM categories WHERE id IN (:rootIds) " +
            "UNION ALL " +
            "SELECT c.id FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id" +
            ") SELECT DISTINCT id FROM cat_tree", nativeQuery = true)
    List<Long> findSelfAndDescendantIds(@Param("rootIds") List<Long> rootIds);
}
