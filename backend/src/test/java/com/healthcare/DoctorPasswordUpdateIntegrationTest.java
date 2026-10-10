package com.healthcare;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.entity.Department;
import com.healthcare.entity.Doctor;
import com.healthcare.repository.DepartmentRepository;
import com.healthcare.repository.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DoctorPasswordUpdateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void doctorPasswordShouldBeUpdated() throws Exception {
        Department department = departmentRepository.save(new Department("Cardiology Password Test"));
        Doctor doctor = doctorRepository.save(new Doctor("Dr. Test Doctor", department, "oldPassword"));

        DoctorPasswordUpdateRequest request = new DoctorPasswordUpdateRequest("oldPassword", "newPassword");

        mockMvc.perform(put("/api/doctors/{id}/password", doctor.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.password").value("newPassword"));
    }

    public record DoctorPasswordUpdateRequest(String currentPassword, String newPassword) {
    }
}
