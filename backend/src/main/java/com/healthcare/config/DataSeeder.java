package com.healthcare.config;

import com.healthcare.entity.Appointment;
import com.healthcare.entity.Department;
import com.healthcare.entity.Doctor;
import com.healthcare.entity.Patient;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DepartmentRepository;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.PatientRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedDatabase(
            DepartmentRepository departmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository
    ) {
        return args -> {
            if (departmentRepository.count() == 0) {
                Department cardiology = departmentRepository.save(new Department("Cardiology"));
                Department neurology = departmentRepository.save(new Department("Neurology"));
                Department orthopedics = departmentRepository.save(new Department("Orthopedics"));
                Department generalMedicine = departmentRepository.save(new Department("General Medicine"));
                Department dermatology = departmentRepository.save(new Department("Dermatology"));
                Department pediatrics = departmentRepository.save(new Department("Pediatrics"));

                doctorRepository.save(new Doctor("Dr. Supriya Shinde (Sr. Cardiologist)", cardiology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Dharmendhar Pradhan (Interventional Cardiology)", cardiology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Rohit Sharma (Neurosurgeon)", neurology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Sneha Rao (Neurologist)", neurology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Kasab Qureshi (Joint Replacement)", orthopedics, "doc123"));
                doctorRepository.save(new Doctor("Dr. Pratiksha Awate (Spine Specialist)", orthopedics, "doc123"));
                doctorRepository.save(new Doctor("Dr. Tejas Zinjad (Consulting Physician)", generalMedicine, "doc123"));
                doctorRepository.save(new Doctor("Dr. Krishnan Iyer (Internal Medicine)", generalMedicine, "doc123"));
                doctorRepository.save(new Doctor("Dr. Priya Deshmukh (Cosmetic Dermatologist)", dermatology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Shubham Galande (Skin Specialist)", dermatology, "doc123"));
                doctorRepository.save(new Doctor("Dr. Aniket Awate  (Child Specialist)", pediatrics, "doc123"));
                doctorRepository.save(new Doctor("Dr. Amit Shah (Pediatric Cardiologist)", pediatrics, "doc123"));

                patientRepository.save(new Patient("Rahul Sharma", "patient123"));
                patientRepository.save(new Patient("Priya Singh", "patient123"));
                patientRepository.save(new Patient("Amit Verma", "patient123"));

                appointmentRepository.save(new Appointment("Rahul Sharma", "Cardiology", "Dr. Supriya Shinde (Sr. Cardiologist)", "2026-09-01T10:00", "PENDING"));
                appointmentRepository.save(new Appointment("Priya Singh", "Neurology", "Dr. Rohit Sharma (Neurosurgeon)", "2026-09-02T14:30", "APPROVED"));
                appointmentRepository.save(new Appointment("Amit Verma", "Dermatology", "Dr. Priya Deshmukh (Cosmetic Dermatologist)", "2026-09-03T11:15", "APPROVED"));
            }
        };
    }
}
