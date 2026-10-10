package com.healthcare.repository;

import com.healthcare.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientName(String patientName);
    List<Appointment> findByDoctorName(String doctorName);
    List<Appointment> findByStatus(String status);
    Optional<Appointment> findByDoctorNameAndAppointmentDate(String doctorName, String appointmentDate);
}
