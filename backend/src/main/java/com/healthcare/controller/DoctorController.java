package com.healthcare.controller;

import com.healthcare.entity.Department;
import com.healthcare.entity.Doctor;
import com.healthcare.repository.DepartmentRepository;
import com.healthcare.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    public DoctorController(DoctorRepository doctorRepository, DepartmentRepository departmentRepository) {
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/doctors")
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @PostMapping("/doctors")
    public Doctor createDoctor(@RequestBody DoctorRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank() || request.getDepartment() == null || request.getDepartment().isBlank() || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Doctor name, department, and password are required.");
        }

        Department department = departmentRepository.findByName(request.getDepartment())
                .orElseThrow(() -> new RuntimeException("Department not found: " + request.getDepartment()));

        Doctor doctor = new Doctor(request.getName(), department, request.getPassword());
        return doctorRepository.save(doctor);
    }

    @PutMapping("/doctors/{id}/password")
    public ResponseEntity<DoctorPasswordResponse> updatePassword(@PathVariable long id, @RequestBody DoctorPasswordUpdateRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getPassword().equals(request.getCurrentPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        doctor.setPassword(request.getNewPassword());
        Doctor savedDoctor = doctorRepository.save(doctor);
        return ResponseEntity.ok(new DoctorPasswordResponse(savedDoctor));
    }

    @PutMapping("/doctors/{id}/availability")
    public ResponseEntity<DoctorAvailabilityResponse> updateAvailability(@PathVariable long id, @RequestBody DoctorAvailabilityUpdateRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        String status = request.getStatus();
        doctor.setAvailabilityStatus(status);

        if ("AVAILABLE".equalsIgnoreCase(status)) {
            doctor.setAvailabilityDate(null);
            doctor.setLeaveStartDate(null);
            doctor.setLeaveEndDate(null);
        } else {
            String startDate = request.getStartDate() != null ? request.getStartDate() : request.getDate();
            String endDate = request.getEndDate() != null ? request.getEndDate() : startDate;

            doctor.setAvailabilityDate(startDate);
            doctor.setLeaveStartDate(startDate);
            doctor.setLeaveEndDate(endDate);
        }

        Doctor savedDoctor = doctorRepository.save(doctor);
        return ResponseEntity.ok(new DoctorAvailabilityResponse(savedDoctor));
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable long id) {
        doctorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public static class DoctorRequest {
        private String name;
        private String department;
        private String password;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDepartment() {
            return department;
        }

        public void setDepartment(String department) {
            this.department = department;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class DoctorPasswordUpdateRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class DoctorAvailabilityUpdateRequest {
        private String status;
        private String date;
        private String startDate;
        private String endDate;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }
    }

    public static class DoctorPasswordResponse {
        private long id;
        private String name;
        private String department;
        private String password;

        public DoctorPasswordResponse(Doctor doctor) {
            this.id = doctor.getId();
            this.name = doctor.getName();
            this.department = doctor.getDepartment() != null ? doctor.getDepartment().getName() : null;
            this.password = doctor.getPassword();
        }

        public long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getDepartment() {
            return department;
        }

        public String getPassword() {
            return password;
        }
    }

    public static class DoctorAvailabilityResponse {
        private long id;
        private String name;
        private String status;
        private String date;
        private String startDate;
        private String endDate;
        private String duration;

        public DoctorAvailabilityResponse(Doctor doctor) {
            this.id = doctor.getId();
            this.name = doctor.getName();
            this.status = doctor.getAvailabilityStatus();
            this.date = doctor.getAvailabilityDate();
            this.startDate = doctor.getLeaveStartDate();
            this.endDate = doctor.getLeaveEndDate();
            this.duration = doctor.getLeaveDurationLabel();
        }

        public long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getStatus() {
            return status;
        }

        public String getDate() {
            return date;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public String getDuration() {
            return duration;
        }
    }
}
