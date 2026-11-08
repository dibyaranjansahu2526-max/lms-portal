package com.lms.service;

import com.lms.dto.WishlistDto;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.entity.Wishlist;
import com.lms.exception.ApiException;
import com.lms.repository.WishlistRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CourseService courseService;
    private final CurrentUserService currentUserService;

    public WishlistService(WishlistRepository wishlistRepository,
                           CourseService courseService,
                           CurrentUserService currentUserService) {
        this.wishlistRepository = wishlistRepository;
        this.courseService = courseService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<WishlistDto> list(Authentication authentication) {
        User student = currentUserService.get(authentication);
        return wishlistRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public WishlistDto add(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(courseId);
        if (!course.isPublished()) {
            throw ApiException.badRequest("This course is not available to save");
        }

        return wishlistRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .map(existing -> new WishlistDto(existing.getId(), courseService.toDto(course), existing.getCreatedAt()))
                .orElseGet(() -> {
                    Wishlist wishlist = new Wishlist();
                    wishlist.setStudent(student);
                    wishlist.setCourse(course);
                    wishlist = wishlistRepository.save(wishlist);
                    return new WishlistDto(wishlist.getId(), courseService.toDto(course), wishlist.getCreatedAt());
                });
    }

    @Transactional
    public void remove(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        wishlistRepository.deleteByStudentIdAndCourseId(student.getId(), courseId);
    }

    private WishlistDto toDto(Wishlist wishlist) {
        return new WishlistDto(
                wishlist.getId(),
                courseService.toDto(wishlist.getCourse()),
                wishlist.getCreatedAt()
        );
    }
}
