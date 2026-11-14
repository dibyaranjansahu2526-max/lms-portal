package com.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "mock_answers")
public class MockAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private MockAttempt attempt;

    @Column(nullable = false)
    private Long questionId;

    @Column(nullable = false, length = 1000)
    private String questionText;

    @Column(nullable = false)
    private int questionOrder;

    @Column
    private Long selectedOptionId;

    @Column(length = 500)
    private String selectedOptionText;

    @Column(nullable = false)
    private Long correctOptionId;

    @Column(nullable = false, length = 500)
    private String correctOptionText;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private boolean answered;

    @Column(nullable = false)
    private double marksAwarded;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MockAttempt getAttempt() {
        return attempt;
    }

    public void setAttempt(MockAttempt attempt) {
        this.attempt = attempt;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public int getQuestionOrder() {
        return questionOrder;
    }

    public void setQuestionOrder(int questionOrder) {
        this.questionOrder = questionOrder;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }

    public String getSelectedOptionText() {
        return selectedOptionText;
    }

    public void setSelectedOptionText(String selectedOptionText) {
        this.selectedOptionText = selectedOptionText;
    }

    public Long getCorrectOptionId() {
        return correctOptionId;
    }

    public void setCorrectOptionId(Long correctOptionId) {
        this.correctOptionId = correctOptionId;
    }

    public String getCorrectOptionText() {
        return correctOptionText;
    }

    public void setCorrectOptionText(String correctOptionText) {
        this.correctOptionText = correctOptionText;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public boolean isAnswered() {
        return answered;
    }

    public void setAnswered(boolean answered) {
        this.answered = answered;
    }

    public double getMarksAwarded() {
        return marksAwarded;
    }

    public void setMarksAwarded(double marksAwarded) {
        this.marksAwarded = marksAwarded;
    }
}
