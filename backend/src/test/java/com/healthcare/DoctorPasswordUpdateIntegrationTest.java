
package com.healthcare;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.entity.Appointment;
import com.healthcare.entity.Department;
import com.healthcare.entity.Doctor;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DepartmentRepository;
import com.healthcare.repository.DoctorRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Objects;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AppointmentSchedulingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void sameDoctorSameDateTimeShouldNotBeBookedTwice()
            throws Exception {

        appointmentRepository.deleteAll();

        Appointment existing = new Appointment(
                "Rahul Sharma",
                "Cardiology",
                "Dr. Supriya Shinde",
                "2026-10-10T10:30",
                "PENDING"
        );

        appointmentRepository.save(existing);

        AppointmentRequest request = new AppointmentRequest(
                "Priya Singh",
                "Cardiology",
                "Dr. Supriya Shinde",
                "2026-10-10T10:30",
                "PENDING",
                "",
                ""
        );

        mockMvc.perform(post("/api/appointments")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(objectMapper.writeValueAsString(request))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "This doctor already has an appointment at the selected date and time."));
    }

    @Test
    void appointmentOutsideClinicHoursShouldBeRejected()
            throws Exception {

        appointmentRepository.deleteAll();

        AppointmentRequest request = new AppointmentRequest(
                "Priya Singh",
                "Cardiology",
                "Dr. Supriya Shinde",
                "2026-10-10T20:30",
                "PENDING",
                "",
                ""
        );

        mockMvc.perform(post("/api/appointments")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Appointments are available only between 08:00 and 20:00."));
    }

    @Test
    void doctorOnLeaveShouldBlockAppointmentsForThatDate()
            throws Exception {

        appointmentRepository.deleteAll();
        departmentRepository.deleteAll();
        doctorRepository.deleteAll();

        Department department = departmentRepository.save(
                new Department("Cardiology-Leave-Test"));

        Doctor doctor = new Doctor(
                "Dr. Supriya Shinde", department, "doc123");

        doctor.setAvailabilityStatus("ON_LEAVE");
        doctor.setAvailabilityDate("2026-10-10");

        doctorRepository.save(doctor);

        AppointmentRequest request = new AppointmentRequest(
                "Priya Singh",
                "Cardiology-Leave-Test",
                "Dr. Supriya Shinde",
                "2026-10-10T10:00",
                "PENDING",
                "",
                ""
        );

        mockMvc.perform(post("/api/appointments")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "This doctor is on leave for the selected date and cannot accept appointments."));
    }

    @Test
    void doctorLeaveRangeShouldBlockAppointmentsAcrossConsecutiveDays()
            throws Exception {

        appointmentRepository.deleteAll();
        departmentRepository.deleteAll();
        doctorRepository.deleteAll();

        Department department = departmentRepository.save(
                new Department("Cardiology-Range-Test"));

        Doctor doctor = new Doctor(
                "Dr. Jane Smith", department, "doc123");

        doctor.setAvailabilityStatus("ON_LEAVE");
        doctor.setLeaveStartDate("2026-10-10");
        doctor.setLeaveEndDate("2026-10-12");

        doctorRepository.save(doctor);

        AppointmentRequest request = new AppointmentRequest(
                "Priya Singh",
                "Cardiology-Range-Test",
                "Dr. Jane Smith",
                "2026-10-11T10:00",
                "PENDING",
                "",
                ""
        );

        mockMvc.perform(post("/api/appointments")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "This doctor is on leave for the selected date and cannot accept appointments."));
    }

    public record AppointmentRequest(
            String patientName,
            String departmentName,
            String doctorName,
            String appointmentDate,
            String status,
            String diagnosis,
            String prescription) {
    }
}
