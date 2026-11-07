package com.lms.service;

import com.lms.dto.LessonDto;
import com.lms.dto.LessonRequest;
import com.lms.dto.ProgressDto;
import com.lms.entity.Course;
import com.lms.entity.Lesson;
import com.lms.entity.LessonProgress;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.LessonProgressRepository;
import com.lms.repository.LessonRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final CurrentUserService currentUserService;

    public LessonService(LessonRepository lessonRepository,
                         LessonProgressRepository lessonProgressRepository,
                         CourseService courseService,
                         EnrollmentService enrollmentService,
                         CurrentUserService currentUserService) {
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<LessonDto> getCourseLessonsForTeacher(Long courseId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        courseService.requireOwnedCourse(courseId, teacher);
        return lessonRepository.findByCourseIdOrderByLessonOrderAsc(courseId)
                .stream()
                .map(lesson -> toDto(lesson, false))
                .toList();
    }

    @Transactional
    public LessonDto addLesson(Long courseId, LessonRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = courseService.requireOwnedCourse(courseId, teacher);
        Lesson lesson = new Lesson();
        lesson.setCourse(course);
        applyRequest(lesson, request);
        lesson = lessonRepository.save(lesson);
        return toDto(lesson, false);
    }

    @Transactional
    public LessonDto updateLesson(Long lessonId, LessonRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Lesson lesson = findLesson(lessonId);
        courseService.requireOwnedCourse(lesson.getCourse().getId(), teacher);
        applyRequest(lesson, request);
        lesson = lessonRepository.save(lesson);
        return toDto(lesson, false);
    }

    @Transactional
    public void deleteLesson(Long lessonId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Lesson lesson = findLesson(lessonId);
        courseService.requireOwnedCourse(lesson.getCourse().getId(), teacher);
        lessonProgressRepository.deleteByLessonId(lessonId);
        lessonRepository.delete(lesson);
    }

    @Transactional
    public ProgressDto markComplete(Long lessonId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Lesson lesson = findLesson(lessonId);
        enrollmentService.requireEnrollment(student.getId(), lesson.getCourse().getId());

        LessonProgress progress = lessonProgressRepository
                .findByStudentIdAndLessonId(student.getId(), lessonId)
                .orElseGet(() -> {
                    LessonProgress row = new LessonProgress();
                    row.setStudent(student);
                    row.setLesson(lesson);
                    return row;
                });
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        lessonProgressRepository.save(progress);

        return enrollmentService.evaluateCompletion(student, lesson.getCourse());
    }

    public Lesson findLesson(Long lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> ApiException.notFound("Lesson not found"));
    }

    private void applyRequest(Lesson lesson, LessonRequest request) {
        lesson.setTitle(request.title().trim());
        lesson.setContent(request.content());
        lesson.setVideoUrl(blankToNull(request.videoUrl()));
        lesson.setMaterialUrl(blankToNull(request.materialUrl()));
        lesson.setLessonOrder(request.order());
    }

    private LessonDto toDto(Lesson lesson, boolean completed) {
        return new LessonDto(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getContent(),
                lesson.getVideoUrl(),
                lesson.getMaterialUrl(),
                lesson.getLessonOrder(),
                completed
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
