package com.lms.config;

import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.Lesson;
import com.lms.entity.LessonProgress;
import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.entity.Quiz;
import com.lms.entity.Review;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonProgressRepository;
import com.lms.repository.ReviewRepository;
import com.lms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Supplier;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           LessonProgressRepository lessonProgressRepository,
                           ReviewRepository reviewRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureUser("LMS Administrator", "admin@lms.com", "admin123", Role.ADMIN);
        ensureUser("Priya Sharma", "teacher1@lms.com", "teacher123", Role.TEACHER);
        ensureUser("Marcus Chen", "teacher2@lms.com", "teacher123", Role.TEACHER);
        ensureUser("Aarav Mehta", "student1@lms.com", "student123", Role.STUDENT);
        ensureUser("Sofia Ramirez", "student2@lms.com", "student123", Role.STUDENT);
        ensureUser("Daniel Okafor", "student3@lms.com", "student123", Role.STUDENT);

        User priya = userRepository.findByEmailIgnoreCase("teacher1@lms.com").orElseThrow();
        User marcus = userRepository.findByEmailIgnoreCase("teacher2@lms.com").orElseThrow();
        User aarav = userRepository.findByEmailIgnoreCase("student1@lms.com").orElseThrow();
        User sofia = userRepository.findByEmailIgnoreCase("student2@lms.com").orElseThrow();

        Course javaCourse = ensureCourse("Java Spring Boot Masterclass", () -> buildJavaCourse(priya));
        Course reactCourse = ensureCourse("Modern React & Tailwind CSS", () -> buildReactCourse(marcus));
        Course dsaCourse = ensureCourse("Data Structures Essentials", () -> buildDsaCourse(priya));

        ensureEnrollment(aarav, javaCourse);
        ensureEnrollment(sofia, reactCourse);
        ensureEnrollment(aarav, dsaCourse);

        ensureReview(aarav, javaCourse, 5,
                "Excellent structure and practical examples. The Spring Security and JWT sections helped me connect the backend concepts to a real project.");
        ensureReview(sofia, reactCourse, 5,
                "The React and Tailwind lessons are clear and easy to follow. I especially liked how the course builds a responsive interface step by step.");
        ensureReview(aarav, dsaCourse, 4,
                "Strong explanations of complexity and core data structures. The visual references made the tree and hash map lessons much easier to understand.");

        int teacherIndex = 0;
        for (CourseSeedCatalog.CourseSeed seed : CourseSeedCatalog.courses()) {
            User teacher = teacherIndex % 2 == 0 ? priya : marcus;
            seedAdditionalCourse(seed, teacher);
            teacherIndex++;
        }
    }

    private Course ensureCourse(String title, Supplier<Course> factory) {
        return courseRepository.findByTitleIgnoreCase(title)
                .orElseGet(() -> courseRepository.save(factory.get()));
    }

    private void ensureEnrollment(User student, Course course) {
        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            enroll(student, course);
        }
        if (course.getLessons().isEmpty()) {
            return;
        }
        Lesson firstLesson = course.getLessons().get(0);
        if (lessonProgressRepository.findByStudentIdAndLessonId(student.getId(), firstLesson.getId()).isEmpty()) {
            markFirstLessonComplete(student, course);
        }
    }

    private void ensureReview(User student, Course course, int rating, String comment) {
        if (reviewRepository.findByStudentIdAndCourseId(student.getId(), course.getId()).isPresent()) {
            return;
        }
        Review review = new Review();
        review.setStudent(student);
        review.setCourse(course);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now().minusDays(3));
        reviewRepository.save(review);
    }

    private void seedAdditionalCourse(CourseSeedCatalog.CourseSeed seed, User teacher) {
        if (courseRepository.findByTitleIgnoreCase(seed.title()).isPresent()) {
            return;
        }

        Course course = baseCourse(seed.title(), seed.description(), seed.category(), seed.imageUrl(), teacher);
        course.setCreatedAt(LocalDateTime.now().minusDays(5));

        int lessonOrder = 1;
        for (var lessonSeed : seed.lessons()) {
            addLesson(course, lessonSeed.title(), lessonSeed.content(), lessonSeed.videoUrl(), null, lessonOrder++);
        }

        List<QuizQuestion> quizQuestions = seed.questions().stream()
                .map(question -> new QuizQuestion(question.text(), question.options(), question.correctIndex()))
                .toList();
        addQuiz(course, seed.quizTitle(), seed.quizDescription(), 60, quizQuestions);

        courseRepository.save(course);
    }

    private User ensureUser(String name, String email, String password, Role role) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            return userRepository.save(user);
        });
    }

    private Enrollment enroll(User student, Course course) {
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now().minusDays(2));
        enrollment.setCompleted(false);
        return enrollmentRepository.save(enrollment);
    }

    private void markFirstLessonComplete(User student, Course course) {
        if (course.getLessons().isEmpty()) {
            return;
        }
        LessonProgress progress = new LessonProgress();
        progress.setStudent(student);
        progress.setLesson(course.getLessons().get(0));
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now().minusDays(1));
        lessonProgressRepository.save(progress);
    }

    private Course buildJavaCourse(User teacher) {
        Course course = baseCourse(
                "Java Spring Boot Masterclass",
                "Learn how to build secure, production-ready REST APIs with Java 17, Spring Boot 3, Spring Security, JWT and Spring Data JPA. This hands-on course takes you from project setup to a complete backend application.",
                "Programming",
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
                teacher
        );

        addLesson(course, "Welcome & Project Setup",
                "In this opening lesson we explore the course roadmap, install the required tools and generate a Spring Boot project with Maven. You will learn how auto-configuration works and why the layered architecture keeps applications maintainable.\n\nKey topics:\n- Spring Boot project structure\n- Maven dependencies\n- Application properties and profiles\n- Running your first endpoint",
                "https://www.youtube.com/watch?v=9SGDpanrc8U",
                "https://spring.io/guides/gs/spring-boot", 1);
        addLesson(course, "Building REST APIs",
                "Build clean REST controllers with validation, DTOs and meaningful HTTP status codes. We cover request mapping, JSON serialization, exception handling and how to test each endpoint with HTTP requests.\n\nYou will create course and lesson endpoints and connect them to a service layer.",
                "https://www.youtube.com/watch?v=vtPkZShrvXQ",
                "https://spring.io/guides/tutorials/rest", 2);
        addLesson(course, "Spring Data JPA & Relationships",
                "Model users, courses, lessons and enrollments with JPA. Learn entity relationships, repository query methods, transactions and the N+1 problem. We finish by persisting a complete course with lessons and quizzes.",
                "https://www.youtube.com/watch?v=8SGI_XS5OPw",
                "https://docs.spring.io/spring-data/jpa/reference/", 3);

        addQuiz(course, "Spring Boot Fundamentals Quiz",
                "Check your understanding of Spring Boot, REST controllers and JPA. You need 60% to pass.",
                60,
                List.of(
                        quizQuestion("Which annotation marks a Spring Boot application entry point?",
                                List.of("Application", "SpringBootApplication", "EnableAutoConfiguration", "RestController"), 1),
                        quizQuestion("Which layer should contain business logic?",
                                List.of("Controller", "Repository", "Service", "Entity"), 2),
                        quizQuestion("Which Spring Data interface provides common CRUD operations?",
                                List.of("CrudRepository", "RestController", "EntityManager", "BeanFactory"), 0)
                ));

        return course;
    }

    private Course buildReactCourse(User teacher) {
        Course course = baseCourse(
                "Modern React & Tailwind CSS",
                "A practical journey through modern React development. Build reusable components, manage application state, connect to REST APIs and create a polished responsive interface with Tailwind CSS.",
                "Web Development",
                "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
                teacher
        );

        addLesson(course, "React Fundamentals",
                "Understand components, props, JSX and the component lifecycle. We create a dashboard layout and break the interface into small, focused components that are easy to test and reuse.",
                "https://www.youtube.com/watch?v=SqcY0GlETPk",
                "https://react.dev/learn", 1);
        addLesson(course, "Hooks, State & Effects",
                "Manage local state with useState, share state with context and synchronize with APIs using useEffect. Learn the rules of hooks and patterns for keeping component logic predictable.",
                "https://www.youtube.com/watch?v=TNhaISOUy6Q",
                "https://react.dev/reference/react", 2);
        addLesson(course, "Responsive UI with Tailwind",
                "Design a responsive application with Tailwind utility classes. We cover spacing, grids, color systems, dark surfaces, hover states and mobile-first layouts.",
                "https://www.youtube.com/watch?v=pfaSUYaSgRo",
                "https://tailwindcss.com/docs/utility-first", 3);

        addQuiz(course, "React & Tailwind Checkpoint",
                "Test the core React and Tailwind concepts covered in this course. You need 67% to pass.",
                67,
                List.of(
                        quizQuestion("Which hook stores local component state?",
                                List.of("useEffect", "useState", "useMemo", "useRef"), 1),
                        quizQuestion("What prop should a list of rendered elements use?",
                                List.of("class", "style", "key", "id"), 2),
                        quizQuestion("Which Tailwind class creates a CSS grid?",
                                List.of("flex", "grid", "block", "inline"), 1)
                ));

        return course;
    }

    private Course buildDsaCourse(User teacher) {
        Course course = baseCourse(
                "Data Structures Essentials",
                "Build a strong foundation in data structures and algorithms. Explore arrays, linked lists, stacks, queues, trees and hash maps with clear explanations and interview-focused examples.",
                "Computer Science",
                "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80",
                teacher
        );

        addLesson(course, "Complexity & Big O",
                "Learn how to reason about time and space complexity. We compare common growth rates and practice analyzing loops, recursion and nested data operations.",
                "https://www.youtube.com/watch?v=Mo4vesaut8g",
                "https://www.bigocheatsheet.com/", 1);
        addLesson(course, "Stacks, Queues & Linked Lists",
                "Implement fundamental linear data structures and understand when each is the right tool. We walk through insertion, deletion, traversal and common interview problems.",
                "https://www.youtube.com/watch?v=wjI1WNcIntg",
                "https://visualgo.net/en/list", 2);
        addLesson(course, "Trees & Hash Maps",
                "Explore binary trees, binary search trees and hash maps. We discuss traversal strategies, balancing, collision handling and real-world lookup performance.",
                "https://www.youtube.com/watch?v=oSWTXtMglKE",
                "https://visualgo.net/en/bst", 3);

        addQuiz(course, "Data Structures Quiz",
                "Review the key data structure concepts from this course. You need 60% to pass.",
                60,
                List.of(
                        quizQuestion("What is the average lookup time of a hash map?",
                                List.of("O(n)", "O(log n)", "O(1)", "O(n log n)"), 2),
                        quizQuestion("Which data structure uses FIFO ordering?",
                                List.of("Stack", "Queue", "Tree", "Heap"), 1),
                        quizQuestion("Which traversal visits the root first?",
                                List.of("In-order", "Post-order", "Pre-order", "Level-order"), 2)
                ));

        return course;
    }

    private Course baseCourse(String title, String description, String category, String imageUrl, User teacher) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setCategory(category);
        course.setImageUrl(imageUrl);
        course.setPublished(true);
        course.setTeacher(teacher);
        course.setCreatedAt(LocalDateTime.now().minusDays(10));
        return course;
    }

    private void addLesson(Course course, String title, String content, String videoUrl, String materialUrl, int order) {
        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setContent(content);
        lesson.setVideoUrl(videoUrl);
        lesson.setMaterialUrl(materialUrl);
        lesson.setLessonOrder(order);
        lesson.setCourse(course);
        course.getLessons().add(lesson);
    }

    private void addQuiz(Course course, String title, String description, int passingScore,
                         List<QuizQuestion> quizQuestions) {
        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription(description);
        quiz.setPassingScore(passingScore);
        quiz.setCourse(course);

        int questionOrder = 1;
        for (QuizQuestion quizQuestion : quizQuestions) {
            Question question = new Question();
            question.setText(quizQuestion.text());
            question.setQuestionOrder(questionOrder++);
            question.setQuiz(quiz);

            int optionOrder = 1;
            for (int i = 0; i < quizQuestion.options().size(); i++) {
                QuestionOption option = new QuestionOption();
                option.setText(quizQuestion.options().get(i));
                option.setCorrect(i == quizQuestion.correctIndex());
                option.setOptionOrder(optionOrder++);
                option.setQuestion(question);
                question.getOptions().add(option);
            }
            quiz.getQuestions().add(question);
        }
        course.getQuizzes().add(quiz);
    }

    private QuizQuestion quizQuestion(String text, List<String> options, int correctIndex) {
        return new QuizQuestion(text, options, correctIndex);
    }

    private record QuizQuestion(String text, List<String> options, int correctIndex) {
    }
}
