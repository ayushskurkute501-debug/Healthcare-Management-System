package com.healthcare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String name;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "doctors"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String availabilityStatus = "AVAILABLE";

    @Column
    private String availabilityDate;

    @Column
    private String leaveStartDate;

    @Column
    private String leaveEndDate;

    public Doctor() {
    }

    public Doctor(String name, Department department, String password) {
        this.name = name;
        this.department = department;
        this.password = password;
        this.availabilityStatus = "AVAILABLE";
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus == null ? "AVAILABLE" : availabilityStatus;
        if ("AVAILABLE".equalsIgnoreCase(this.availabilityStatus)) {
            this.availabilityDate = null;
            this.leaveStartDate = null;
            this.leaveEndDate = null;
        }
    }

    public String getAvailabilityDate() {
        return availabilityDate;
    }

    public void setAvailabilityDate(String availabilityDate) {
        this.availabilityDate = availabilityDate;
        if (availabilityDate != null && !availabilityDate.isBlank()) {
            this.leaveStartDate = availabilityDate;
            this.leaveEndDate = availabilityDate;
        }
    }

    public String getLeaveStartDate() {
        return leaveStartDate;
    }

    public void setLeaveStartDate(String leaveStartDate) {
        this.leaveStartDate = leaveStartDate;
        if (leaveStartDate != null && !leaveStartDate.isBlank()) {
            if (this.leaveEndDate == null || this.leaveEndDate.isBlank()) {
                this.leaveEndDate = leaveStartDate;
            }
            this.availabilityDate = leaveStartDate;
        }
    }

    public String getLeaveEndDate() {
        return leaveEndDate;
    }

    public void setLeaveEndDate(String leaveEndDate) {
        this.leaveEndDate = leaveEndDate;
        if (leaveEndDate != null && !leaveEndDate.isBlank()) {
            if (this.leaveStartDate == null || this.leaveStartDate.isBlank()) {
                this.leaveStartDate = leaveEndDate;
            }
            this.availabilityDate = this.leaveStartDate;
        }
    }

    public boolean isOnLeaveForDate(String targetDate) {
        if (targetDate == null || targetDate.isBlank() || !"ON_LEAVE".equalsIgnoreCase(this.availabilityStatus)) {
            return false;
        }

        if (this.leaveStartDate == null || this.leaveStartDate.isBlank()) {
            return this.availabilityDate != null && this.availabilityDate.equals(targetDate);
        }

        try {
            LocalDate start = LocalDate.parse(this.leaveStartDate);
            LocalDate end = (this.leaveEndDate == null || this.leaveEndDate.isBlank()) ? start : LocalDate.parse(this.leaveEndDate);
            LocalDate target = LocalDate.parse(targetDate);
            return !target.isBefore(start) && !target.isAfter(end);
        } catch (Exception ignored) {
            return this.availabilityDate != null && this.availabilityDate.equals(targetDate);
        }
    }

    public String getLeaveDurationLabel() {
        if (leaveStartDate == null || leaveStartDate.isBlank()) {
            return "0 days";
        }

        try {
            LocalDate start = LocalDate.parse(leaveStartDate);
            LocalDate end = (leaveEndDate == null || leaveEndDate.isBlank()) ? start : LocalDate.parse(leaveEndDate);
            long days = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
            return days + (days == 1 ? " day" : " days");
        } catch (Exception ignored) {
            return "1 day";
        }
    }
}
