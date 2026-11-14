package com.lms.controller;

import com.lms.dto.CourseDto;
import com.lms.dto.CoursePageDto;
import com.lms.dto.ReviewSummaryDto;
import com.lms.service.CourseService;
import com.lms.service.ReviewService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final ReviewService reviewService;

    public CourseController(CourseService courseService, ReviewService reviewService) {
        this.courseService = courseService;
        this.reviewService = reviewService;
    }

    @GetMapping
    public CoursePageDto browse(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String category,
                                @RequestParam(required = false) String sort,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "12") int size) {
        return courseService.browse(search, category, sort, page, size);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return courseService.categories();
    }

    @GetMapping("/{courseId}")
    public CourseDto getCourse(@PathVariable Long courseId, Authentication authentication) {
        return courseService.getVisible(courseId, authentication);
    }

    @GetMapping("/{courseId}/reviews")
    public ReviewSummaryDto reviews(@PathVariable Long courseId, Authentication authentication) {
        return reviewService.getForCourse(courseId, authentication);
    }
}
