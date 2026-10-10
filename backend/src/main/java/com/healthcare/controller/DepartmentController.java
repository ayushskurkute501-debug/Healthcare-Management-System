package com.healthcare.controller;

import com.healthcare.entity.Department;
import com.healthcare.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @PostMapping("/departments")
    public Department createDepartment(@RequestBody Department department) {
        if (department == null || department.getName() == null || department.getName().isBlank()) {
            throw new IllegalArgumentException("Department name is required.");
        }
        return departmentRepository.save(department);
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable long id) {
        departmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
