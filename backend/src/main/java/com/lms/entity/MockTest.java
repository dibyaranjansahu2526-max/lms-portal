package com.lms.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mock_tests")
public class MockTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private double totalMarks;

    @Column(nullable = false)
    private double marksPerCorrect;

    @Column(nullable = false)
    private double negativeMarks = 0;

    @Column(nullable = false)
    private boolean published = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "mockTest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<MockQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "mockTest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MockAttempt> attempts = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public double getMarksPerCorrect() {
        return marksPerCorrect;
    }

    public void setMarksPerCorrect(double marksPerCorrect) {
        this.marksPerCorrect = marksPerCorrect;
    }

    public double getNegativeMarks() {
        return negativeMarks;
    }

    public void setNegativeMarks(double negativeMarks) {
        this.negativeMarks = negativeMarks;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<MockQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<MockQuestion> questions) {
        this.questions = questions;
    }

    public List<MockAttempt> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<MockAttempt> attempts) {
        this.attempts = attempts;
    }
}
