package com.lms.repository;

import com.lms.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCode(String code);

    List<Coupon> findAllByOrderByIdDesc();

    @Modifying
    @Query("""
            update Coupon c
            set c.usedCount = c.usedCount + 1
            where c.code = :code and c.usedCount < c.maxUses
            """)
    int incrementUsage(@Param("code") String code);
}