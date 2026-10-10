package com.healthcare.controller;

import com.healthcare.entity.Appointment;
import com.healthcare.entity.Doctor;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DoctorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentController(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    private boolean isWithinClinicHours(String appointmentDate) {
        try {
            LocalDateTime dateTime = LocalDateTime.parse(appointmentDate);
            LocalTime time = dateTime.toLocalTime();
            LocalTime clinicOpen = LocalTime.of(8, 0);
            LocalTime clinicClose = LocalTime.of(20, 0);
            return !time.isBefore(clinicOpen) && time.isBefore(clinicClose);
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
        if (appointment.getDoctorName() == null || appointment.getDoctorName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Doctor name is required."));
        }

        if (appointment.getAppointmentDate() == null || appointment.getAppointmentDate().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Appointment date and time is required."));
        }

        if (!isWithinClinicHours(appointment.getAppointmentDate())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Appointments are available only between 08:00 and 20:00."));
        }

        Doctor doctor = doctorRepository.findByName(appointment.getDoctorName()).orElse(null);
        if (doctor != null && doctor.isOnLeaveForDate(appointment.getAppointmentDate().substring(0, 10))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "This doctor is on leave for the selected date and cannot accept appointments."));
        }

        boolean exists = appointmentRepository
                .findByDoctorNameAndAppointmentDate(appointment.getDoctorName(), appointment.getAppointmentDate())
                .isPresent();

        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "This doctor already has an appointment at the selected date and time."));
        }

        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(request.status());
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @PutMapping("/appointments/{id}/diagnosis")
    public ResponseEntity<Appointment> updateDiagnosis(@PathVariable Long id, @RequestBody DiagnosisUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setDiagnosis(request.diagnosis());
        appointment.setPrescription(request.prescription());
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    public record StatusUpdateRequest(String status) {}
    public record DiagnosisUpdateRequest(String diagnosis, String prescription) {}
}
