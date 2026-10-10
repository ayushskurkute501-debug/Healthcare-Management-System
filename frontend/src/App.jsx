import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const ADMIN_USERNAME = 'healthcareadmin';
const ADMIN_PASSWORD = 'HealthCare@2026';

const defaultDepartments = [
  'Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Dermatology', 'Pediatrics'
];

const defaultDoctors = [
  { id: 1, name: 'Dr. Supriya Shinde (Sr. Cardiologist)', department: 'Cardiology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 2, name: 'Dr. Dharmendhar Pradhan (Interventional Cardiology)', department: 'Cardiology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 3, name: 'Dr. Rohit Sharma (Neurosurgeon)', department: 'Neurology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 4, name: 'Dr. Sneha Rao (Neurologist)', department: 'Neurology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 5, name: 'Dr. Kasab Qureshi (Joint Replacement)', department: 'Orthopedics', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 6, name: 'Dr. Pratiksha Awate (Spine Specialist)', department: 'Orthopedics', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 7, name: 'Dr. Tejas Zinjad (Consulting Physician)', department: 'General Medicine', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 8, name: 'Dr. Krishnan Iyer (Internal Medicine)', department: 'General Medicine', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 9, name: 'Dr. Priya Deshmukh (Cosmetic Dermatologist)', department: 'Dermatology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 10, name: 'Dr. Shubham Galande (Skin Specialist)', department: 'Dermatology', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 11, name: 'Dr. Aniket Awate (Child Specialist)', department: 'Pediatrics', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' },
  { id: 12, name: 'Dr. Amit Shah (Pediatric Cardiologist)', department: 'Pediatrics', password: 'doc123', availabilityStatus: 'AVAILABLE', availabilityDate: '', leaveStartDate: '', leaveEndDate: '' }
];

const defaultPatients = [
  { id: 1, name: 'Rahul Sharma', password: 'patient123' },
  { id: 2, name: 'Priya Singh', password: 'patient123' },
  { id: 3, name: 'Amit Verma', password: 'patient123' }
];

const STORAGE_KEY = 'healthcare-patients';
const SESSION_KEY = 'healthcare-session';

const safeReadStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn('Storage read failed:', error);
    return fallback;
  }
};

const safeWriteStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
};

const persistUserSession = (nextUser) => {
  if (nextUser) {
    safeWriteStorage(SESSION_KEY, nextUser);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const toArray = (value, fallback = []) => Array.isArray(value) ? value : fallback;

const createSlotDateTime = (dateValue, hour, minute) => {
  const paddedDate = dateValue || new Date().toISOString().slice(0, 10);
  return `${paddedDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatSlotTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsed);
};

const buildDoctorSlotsForDate = (dateValue) => {
  const slots = [];
  const startMinutes = 8 * 60;
  const endMinutes = 20 * 60;

  for (let totalMinutes = startMinutes; totalMinutes < endMinutes; totalMinutes += 30) {
    const slotStart = new Date(`${dateValue}T00:00:00`);
    slotStart.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
    slots.push({
      value: createSlotDateTime(dateValue, slotStart.getHours(), slotStart.getMinutes()),
      label: `${formatSlotTime(slotStart)} – ${formatSlotTime(slotEnd)}`
    });
  }

  return slots;
};

const isWithinClinicHours = (value) => {
  if (!value) return false;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return false;

  const minutesSinceMidnight = (parsedDate.getHours() * 60) + parsedDate.getMinutes();
  const clinicOpenMinutes = 8 * 60;
  const clinicCloseMinutes = 20 * 60;

  return minutesSinceMidnight >= clinicOpenMinutes && minutesSinceMidnight < clinicCloseMinutes;
};

const isDateInRange = (targetDate, startDate, endDate) => {
  if (!targetDate) return false;
  if (!startDate && !endDate) return false;

  const normalizedTarget = new Date(`${targetDate}T00:00:00`);
  const normalizedStart = new Date(`${startDate || targetDate}T00:00:00`);
  const normalizedEnd = new Date(`${endDate || startDate || targetDate}T00:00:00`);

  return normalizedTarget >= normalizedStart && normalizedTarget <= normalizedEnd;
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate) return 'No leave set';
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} → ${endDate}`;
};

const getLeaveDuration = (startDate, endDate) => {
  if (!startDate) return '0 days';

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
};

function App() {
  const [user, setUser] = useState(() => safeReadStorage(SESSION_KEY, null));
  const [authTab, setAuthTab] = useState('patient');
  const [adminTab, setAdminTab] = useState('appointments');
  const [doctorView, setDoctorView] = useState('appointments');
  const [patientRegister, setPatientRegister] = useState(false);
  const [departments, setDepartments] = useState(defaultDepartments);
  const [doctors, setDoctors] = useState(defaultDoctors);
  const [patients, setPatients] = useState(() => safeReadStorage(STORAGE_KEY, defaultPatients));
  const [appointments, setAppointments] = useState([]);
  const [doctorSelection, setDoctorSelection] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(defaultDepartments[0]);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [doctorAvailabilityDate, setDoctorAvailabilityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorLeaveStartDate, setDoctorLeaveStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorLeaveEndDate, setDoctorLeaveEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorAvailability, setDoctorAvailability] = useState({ status: 'AVAILABLE', date: '', startDate: '', endDate: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [diagnosis, setDiagnosis] = useState({
    id: null,
    patientName: '',
    diagnosis: '',
    prescription: ''
  });

  const patientDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.department === selectedDepartment),
    [doctors, selectedDepartment]
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (doctors.length > 0 && !doctorSelection) {
      setDoctorSelection(doctors[0].name);
    }
  }, [doctors, doctorSelection]);

  useEffect(() => {
    if (patientDoctors.length > 0 && (!selectedDoctorName || !patientDoctors.some((doctor) => doctor.name === selectedDoctorName))) {
      setSelectedDoctorName(patientDoctors[0].name);
    }
  }, [patientDoctors, selectedDoctorName]);

  useEffect(() => {
    if (selectedDepartment && !patientDoctors.some((doctor) => doctor.department === selectedDepartment)) {
      setSelectedDepartment(departments[0] || '');
    }
  }, [departments, patientDoctors, selectedDepartment]);

  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDoctorName, bookingDate]);

  useEffect(() => {
    const currentDoctor = doctors.find((doctor) => doctor.name === doctorSelection);
    if (!currentDoctor) return;

    const startDate = currentDoctor.leaveStartDate || currentDoctor.availabilityDate || doctorAvailabilityDate;
    const endDate = currentDoctor.leaveEndDate || startDate;

    setDoctorAvailabilityDate(startDate || doctorAvailabilityDate);
    setDoctorLeaveStartDate(startDate || doctorAvailabilityDate);
    setDoctorLeaveEndDate(endDate || startDate || doctorAvailabilityDate);
  }, [doctorSelection, doctors]);

  const selectedDoctorAvailability = useMemo(() => {
    const currentDoctor = doctors.find((doctor) => doctor.name === selectedDoctorName);
    if (!currentDoctor) return { status: 'AVAILABLE', date: bookingDate, startDate: '', endDate: false };

    const inLeaveWindow = currentDoctor.availabilityStatus === 'ON_LEAVE' && isDateInRange(bookingDate, currentDoctor.leaveStartDate || currentDoctor.availabilityDate, currentDoctor.leaveEndDate || currentDoctor.availabilityDate);

    if (inLeaveWindow) {
      return { status: 'ON_LEAVE', date: bookingDate, startDate: currentDoctor.leaveStartDate || currentDoctor.availabilityDate, endDate: currentDoctor.leaveEndDate || currentDoctor.availabilityDate, isInLeaveWindow: true };
    }

    return { status: currentDoctor.availabilityStatus || 'AVAILABLE', date: bookingDate, startDate: currentDoctor.leaveStartDate || currentDoctor.availabilityDate, endDate: currentDoctor.leaveEndDate || currentDoctor.availabilityDate, isInLeaveWindow: false };
  }, [bookingDate, doctors, selectedDoctorName]);

  const doctorDateSlots = useMemo(() => {
    if (!selectedDoctorName || !bookingDate) return [];

    const allSlots = buildDoctorSlotsForDate(bookingDate);

    if (selectedDoctorAvailability.status === 'ON_LEAVE') {
      return allSlots.map((slot) => ({
        ...slot,
        isBooked: true
      }));
    }

    return allSlots.map((slot) => ({
      ...slot,
      isBooked: appointments.some((appointment) => (
        (appointment.doctorName || appointment.doctor) === selectedDoctorName &&
        (appointment.appointmentDate || appointment.date) === slot.value
      ))
    }));
  }, [appointments, bookingDate, selectedDoctorAvailability.status, selectedDoctorName]);

  const loadDashboardData = async () => {
    try {
      const [departmentRes, doctorRes, patientRes, appointmentRes] = await Promise.all([
        axios.get(`${API_URL}/departments`).catch(() => ({ data: defaultDepartments.map((name) => ({ id: Date.now() + Math.random(), name })) })),
        axios.get(`${API_URL}/doctors`).catch(() => ({ data: defaultDoctors })),
        axios.get(`${API_URL}/patients`).catch(() => ({ data: defaultPatients })),
        axios.get(`${API_URL}/appointments`).catch(() => ({ data: [] }))
      ]);

      const backendDepartments = toArray(departmentRes?.data, defaultDepartments.map((name) => ({ id: Date.now() + Math.random(), name })));
      const backendDoctors = toArray(doctorRes?.data, defaultDoctors);
      const backendPatients = toArray(patientRes?.data, defaultPatients);

      setDepartments(backendDepartments.map((dept) => dept.name || dept));
      setDoctors(backendDoctors.map((doc) => ({
        id: doc.id,
        name: doc.name,
        department: doc.department?.name || doc.department,
        password: doc.password || 'doc123',
        availabilityStatus: doc.availabilityStatus || 'AVAILABLE',
        availabilityDate: doc.availabilityDate || doc.leaveStartDate || '',
        leaveStartDate: doc.leaveStartDate || doc.startDate || doc.availabilityDate || '',
        leaveEndDate: doc.leaveEndDate || doc.endDate || doc.leaveStartDate || doc.availabilityDate || ''
      })));

      setPatients((prev) => {
        const mergedPatients = [...backendPatients, ...prev];
        const uniquePatients = Array.from(new Map(
          mergedPatients.map((patient) => [patient.name.toLowerCase(), patient])
        ).values());

        safeWriteStorage(STORAGE_KEY, uniquePatients);
        return uniquePatients;
      });
      setAppointments(appointmentRes.data);
    } catch (error) {
      console.error('Could not load backend data. Falling back to default local data.', error);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const username = e.target.adminUser.value.trim();
    const password = e.target.adminPass.value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const loggedInUser = { role: 'admin', name: 'Administrator', username };
      setUser(loggedInUser);
      persistUserSession(loggedInUser);
    } else {
      alert('Invalid Admin credentials. Please try again.');
    }
  };

  const handleDoctorLogin = (e) => {
    e.preventDefault();
    const selectedDoctor = doctors.find((doctor) => doctor.name === doctorSelection);
    const password = e.target.doctorPass.value;

    if (selectedDoctor && selectedDoctor.password === password) {
      const loggedInUser = { role: 'doctor', name: selectedDoctor.name, username: selectedDoctor.name };
      setUser(loggedInUser);
      persistUserSession(loggedInUser);
      return;
    }

    alert('Invalid Password for selected doctor! Default: doc123');
  };

  const handlePatientLogin = (e) => {
    e.preventDefault();
    const name = e.target.patientLoginName.value.trim();
    const pass = e.target.patientLoginPass.value;
    const patient = patients.find((p) => p.name.toLowerCase() === name.toLowerCase());

    if (patient && patient.password === pass) {
      const loggedInUser = { role: 'patient', name: patient.name, username: patient.name };
      setUser(loggedInUser);
      persistUserSession(loggedInUser);
    } else {
      alert('Patient not found or invalid password! Try registering a new account.');
    }
  };

  const handlePatientRegister = (e) => {
    e.preventDefault();
    const name = e.target.patientRegName.value.trim();
    const pass = e.target.patientRegPass.value;

    if (patients.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      alert('An account with this name already exists. Please sign in.');
      return;
    }

    const newPatient = { id: Date.now(), name, password: pass };
    setPatients((prev) => {
      const updatedPatients = [...prev, newPatient];
      safeWriteStorage(STORAGE_KEY, updatedPatients);
      return updatedPatients;
    });

    const loggedInUser = { role: 'patient', name, username: name };
    setUser(loggedInUser);
    persistUserSession(loggedInUser);
  };

  const logout = () => {
    setUser(null);
    persistUserSession(null);
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/appointments/${id}/status`, { status });
    } catch (error) {
      console.error('Status update failed on backend', error);
    }

    setAppointments((prev) => prev.map((item) => (
      item.id === id ? { ...item, status } : item
    )));
  };

  const createDoctor = async (e) => {
    e.preventDefault();
    const payload = {
      name: e.target.docName.value.trim(),
      department: e.target.docDept.value,
      password: e.target.docPass.value
    };

    try {
      const response = await axios.post(`${API_URL}/doctors`, payload);
      setDoctors((prev) => [...prev, {
        id: response.data.id,
        name: response.data.name,
        department: response.data.department?.name || response.data.department,
        password: response.data.password,
        availabilityStatus: response.data.availabilityStatus || 'AVAILABLE',
        availabilityDate: response.data.availabilityDate || ''
      }]);
      e.target.reset();
      alert('Doctor saved successfully.');
    } catch (error) {
      console.error('Could not create doctor in backend', error);
      alert('Doctor saved locally only.');
      const newDoctor = {
        id: Date.now(),
        name: payload.name,
        department: payload.department,
        password: payload.password,
        availabilityStatus: 'AVAILABLE',
        availabilityDate: ''
      };
      setDoctors((prev) => [...prev, newDoctor]);
      e.target.reset();
    }
  };

  const createDepartment = async (e) => {
    e.preventDefault();
    const name = e.target.deptName.value.trim();
    if (!name || departments.includes(name)) return;

    try {
      const response = await axios.post(`${API_URL}/departments`, { name });
      setDepartments((prev) => [...prev, response.data.name || name]);
      e.target.reset();
    } catch (error) {
      console.error('Could not create department in backend', error);
      setDepartments((prev) => [...prev, name]);
      e.target.reset();
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await axios.delete(`${API_URL}/doctors/${id}`);
    } catch (error) {
      console.error('Delete doctor call failed', error);
    }
    setDoctors((prev) => prev.filter((d) => d.id !== id));
  };

  const deleteDepartment = async (index) => {
    const deptName = departments[index];

    try {
      const match = (await axios.get(`${API_URL}/departments`)).data.find((d) => d.name === deptName);
      if (match) {
        await axios.delete(`${API_URL}/departments/${match.id}`);
      }
    } catch (error) {
      console.error('Delete department call failed', error);
    }

    setDepartments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePatientBooking = async (e) => {
    e.preventDefault();

    const currentDoctor = doctors.find((doctor) => doctor.name === selectedDoctorName);
    if (currentDoctor && currentDoctor.availabilityStatus === 'ON_LEAVE' && isDateInRange(bookingDate, currentDoctor.leaveStartDate || currentDoctor.availabilityDate, currentDoctor.leaveEndDate || currentDoctor.availabilityDate)) {
      alert('This doctor is on leave for the selected date and is unavailable for appointments.');
      return;
    }

    if (!selectedSlot || !isWithinClinicHours(selectedSlot)) {
      alert('Please select a valid appointment slot between 08:00 and 20:00.');
      return;
    }

    const payload = {
      patientName: e.target.patientName.value,
      departmentName: e.target.patientDeptSelect.value,
      doctorName: selectedDoctorName,
      appointmentDate: selectedSlot,
      status: 'PENDING',
      diagnosis: '',
      prescription: ''
    };

    const isSlotBooked = appointments.some((appointment) => (
      (appointment.doctorName || appointment.doctor) === payload.doctorName &&
      (appointment.appointmentDate || appointment.date) === payload.appointmentDate
    ));

    if (isSlotBooked) {
      alert('This slot is already booked. Please choose a different time slot.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/appointments`, payload);
      setAppointments((prev) => [...prev, response.data]);
      setSelectedSlot('');
      alert('Appointment request submitted successfully! Pending admin approval.');
    } catch (error) {
      console.error('Booking failed in backend', error);

      const message = error?.response?.data?.message || 'This slot is already booked. Please choose another one.';
      alert(message);

      if (error?.response?.status !== 409) {
        setAppointments((prev) => [...prev, { id: Date.now(), ...payload }]);
      }
    }
  };

  const savePrescription = async (e) => {
    e.preventDefault();
    if (!diagnosis.id) return;

    try {
      await axios.put(`${API_URL}/appointments/${diagnosis.id}/diagnosis`, {
        diagnosis: diagnosis.diagnosis,
        prescription: diagnosis.prescription
      });
    } catch (error) {
      console.error('Diagnosis save failed on backend', error);
    }

    setAppointments((prev) => prev.map((item) => item.id === diagnosis.id
      ? { ...item, diagnosis: diagnosis.diagnosis, prescription: diagnosis.prescription }
      : item));
    setDiagnosis({ id: null, patientName: '', diagnosis: '', prescription: '' });
    alert('Medical record & prescription saved successfully!');
  };

  const openDiagnosis = (appointment) => {
    setDiagnosis({
      id: appointment.id,
      patientName: appointment.patientName || appointment.patient,
      diagnosis: appointment.diagnosis || '',
      prescription: appointment.prescription || ''
    });
  };

  const updateDoctorAvailability = async (status, startDate, endDate) => {
    const selectedDoctor = doctors.find((doctor) => doctor.name === doctorSelection);
    if (!selectedDoctor) {
      alert('Please select a doctor profile first.');
      return;
    }

    if (status === 'ON_LEAVE' && startDate && endDate && new Date(endDate) < new Date(startDate)) {
      alert('Leave end date cannot be earlier than the start date.');
      return;
    }

    try {
      const payload = status === 'AVAILABLE'
        ? { status, date: null, startDate: null, endDate: null }
        : { status, date: startDate || doctorAvailabilityDate, startDate: startDate || doctorAvailabilityDate, endDate: endDate || startDate || doctorAvailabilityDate };

      const response = await axios.put(`${API_URL}/doctors/${selectedDoctor.id}/availability`, payload);

      const nextStart = response.data.startDate || response.data.date || '';
      const nextEnd = response.data.endDate || nextStart;

      setDoctors((prev) => prev.map((doctor) =>
        doctor.id === selectedDoctor.id
          ? {
              ...doctor,
              availabilityStatus: response.data.status,
              availabilityDate: response.data.date || nextStart,
              leaveStartDate: nextStart,
              leaveEndDate: nextEnd
            }
          : doctor
      ));

      setDoctorAvailability({ status: response.data.status, date: response.data.date || nextStart, startDate: nextStart, endDate: nextEnd });
      setDoctorAvailabilityDate(nextStart || doctorAvailabilityDate);
      setDoctorLeaveStartDate(nextStart || doctorAvailabilityDate);
      setDoctorLeaveEndDate(nextEnd || nextStart || doctorAvailabilityDate);
      if (response.data.status === 'ON_LEAVE') {
        setSelectedSlot('');
      }
      alert(`Doctor status updated to ${status === 'AVAILABLE' ? 'Available' : 'On Leave'} for ${status === 'AVAILABLE' ? 'all dates' : formatDateRange(nextStart, nextEnd)}.`);
    } catch (error) {
      console.error('Availability update failed on backend', error);
      alert('Could not update doctor availability status.');
    }
  };

  const updateDoctorPassword = async (e) => {
    e.preventDefault();
    const selectedDoctor = doctors.find((doctor) => doctor.name === doctorSelection);

    if (!selectedDoctor) {
      alert('Please select a doctor profile first.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    try {
      await axios.put(`${API_URL}/doctors/${selectedDoctor.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setDoctors((prev) => prev.map((doctor) =>
        doctor.id === selectedDoctor.id
          ? { ...doctor, password: passwordForm.newPassword }
          : doctor
      ));

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully.');
    } catch (error) {
      alert('Password update failed. Please check your current password and try again.');
    }
  };

  const adminStats = [
    { label: 'Total Doctors', value: doctors.length, accent: 'cyan' },
    { label: 'Total Appointments', value: appointments.length, accent: 'purple' },
    { label: 'Pending Approvals', value: appointments.filter((a) => a.status === 'PENDING').length, accent: 'orange' }
  ];

  const renderAdmin = () => (
    <section className="dashboard-panel">
      <div className="top-row">
        <div>
          <p className="eyebrow">Admin Overview</p>
          <h2>Healthcare Administration</h2>
        </div>
        <button className="primary-btn">Export Report</button>
      </div>

      <div className="stats-grid">
        {adminStats.map((item) => (
          <div className={`stat-card accent-${item.accent}`} key={item.label}>
            <span className="stat-label">{item.label}</span>
            <strong>{item.value}</strong>
            <small>Updated today</small>
          </div>
        ))}
      </div>

      <div className="card modern-card">
        <div className="sub-nav">
          <button className={`sub-btn ${adminTab === 'appointments' ? 'active' : ''}`} onClick={() => setAdminTab('appointments')}>Appointment Management</button>
          <button className={`sub-btn ${adminTab === 'doctors' ? 'active' : ''}`} onClick={() => setAdminTab('doctors')}>Doctor Management</button>
          <button className={`sub-btn ${adminTab === 'departments' ? 'active' : ''}`} onClick={() => setAdminTab('departments')}>Department Management</button>
        </div>

        {adminTab === 'appointments' && (
          <div>
            <h3>All Appointment Requests</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td>{a.patientName || a.patient}</td>
                    <td>{a.departmentName || a.dept}</td>
                    <td>{a.doctorName || a.doctor}</td>
                    <td>{(a.appointmentDate || a.date || '').replace('T', ' ')}</td>
                    <td><span className={`badge badge-${(a.status || 'pending').toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'PENDING' ? (
                        <div className="inline-actions">
                          <button className="btn btn-success" onClick={() => updateAppointmentStatus(a.id, 'APPROVED')}>Approve</button>
                          <button className="btn btn-danger" onClick={() => updateAppointmentStatus(a.id, 'REJECTED')}>Reject</button>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === 'doctors' && (
          <div>
            <div className="panel-header-row">
              <h3>Doctors List</h3>
              <button className="primary-btn" onClick={() => document.getElementById('add-doctor-form')?.classList.toggle('hidden')}>+ Add New Doctor</button>
            </div>

            <form id="add-doctor-form" className="hidden advanced-form" onSubmit={createDoctor}>
              <div className="form-group">
                <label>Doctor Name</label>
                <input name="docName" type="text" className="form-control" required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select name="docDept" className="form-control" required>
                  {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Portal Password</label>
                <input name="docPass" type="password" className="form-control" required placeholder="doc123" />
              </div>
              <button type="submit" className="btn btn-success">Save Doctor</button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Leave Period</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>#{doctor.id}</td>
                    <td>{doctor.name}</td>
                    <td>{doctor.department}</td>
                    <td><span className={`badge badge-${(doctor.availabilityStatus || 'available').toLowerCase()}`}>{doctor.availabilityStatus || 'AVAILABLE'}</span></td>
                    <td>{doctor.availabilityStatus === 'ON_LEAVE' ? formatDateRange(doctor.leaveStartDate || doctor.availabilityDate, doctor.leaveEndDate || doctor.leaveStartDate || doctor.availabilityDate) : 'No leave scheduled'}</td>
                    <td>{doctor.availabilityStatus === 'ON_LEAVE' ? getLeaveDuration(doctor.leaveStartDate || doctor.availabilityDate, doctor.leaveEndDate || doctor.leaveStartDate || doctor.availabilityDate) : '0 days'}</td>
                    <td><button className="btn btn-danger" onClick={() => deleteDoctor(doctor.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === 'departments' && (
          <div>
            <div className="panel-header-row">
              <h3>Departments</h3>
              <form onSubmit={createDepartment} className="inline-form">
                <input name="deptName" type="text" className="form-control" placeholder="New Department" required />
                <button type="submit" className="primary-btn">Add</button>
              </form>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={dept + index}>
                    <td>{dept}</td>
                    <td><button className="btn btn-danger" onClick={() => deleteDepartment(index)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderDoctor = () => {
    const activeDoctor = doctors.find((doctor) => doctor.name === doctorSelection) || doctors[0];
    const activeDoctorStatus = activeDoctor?.availabilityStatus || 'AVAILABLE';
    const leaveSummaryText = activeDoctorStatus === 'ON_LEAVE'
      ? `Current leave: ${formatDateRange(activeDoctor?.leaveStartDate || doctorLeaveStartDate, activeDoctor?.leaveEndDate || doctorLeaveEndDate)} (${getLeaveDuration(activeDoctor?.leaveStartDate || doctorLeaveStartDate, activeDoctor?.leaveEndDate || doctorLeaveEndDate)})`
      : `Leave window: ${formatDateRange(doctorLeaveStartDate, doctorLeaveEndDate)}`;

    return (
      <section className="dashboard-panel">
        <div className="top-row">
          <div>
            <p className="eyebrow">Doctor Portal</p>
            <h2>Consultation Dashboard</h2>
          </div>
          <div className={`status-pill ${activeDoctorStatus === 'ON_LEAVE' ? 'on-leave' : 'available'}`}>
            {activeDoctorStatus === 'ON_LEAVE' ? 'On Leave' : 'On Duty'}
          </div>
        </div>

        <div className="doctor-layout">
          <aside className="doctor-sidebar card modern-card">
            <div className="form-group compact-form">
              <label>Active Doctor Profile</label>
              <select className="form-control" value={doctorSelection} onChange={(e) => setDoctorSelection(e.target.value)}>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.name}>{doctor.name} ({doctor.department})</option>
                ))}
              </select>
            </div>

            <div className="doctor-nav">
              <button
                type="button"
                className={`doctor-nav-btn ${doctorView === 'appointments' ? 'active' : ''}`}
                onClick={() => setDoctorView('appointments')}
              >
                Appointments
              </button>
              <button
                type="button"
                className={`doctor-nav-btn ${doctorView === 'password' ? 'active' : ''}`}
                onClick={() => setDoctorView('password')}
              >
                Change Password
              </button>
            </div>

            <div className="form-group compact-form leave-control-panel">
              <div className="leave-panel-header">
                <label>Availability Status</label>
                <span className={`badge badge-${activeDoctorStatus === 'ON_LEAVE' ? 'on_leave' : 'available'}`}>
                  {activeDoctorStatus === 'ON_LEAVE' ? 'ON LEAVE' : 'AVAILABLE'}
                </span>
              </div>

              <div className="form-group">
                <label>Leave Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={doctorLeaveStartDate}
                  onChange={(e) => {
                    setDoctorLeaveStartDate(e.target.value);
                    if (!doctorLeaveEndDate || new Date(e.target.value) > new Date(doctorLeaveEndDate)) {
                      setDoctorLeaveEndDate(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Leave End Date</label>
                <input
                  type="date"
                  className="form-control"
                  min={doctorLeaveStartDate}
                  value={doctorLeaveEndDate}
                  onChange={(e) => setDoctorLeaveEndDate(e.target.value)}
                />
              </div>
              <div className="availability-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${(activeDoctorStatus === 'AVAILABLE') ? 'active' : ''}`}
                  onClick={() => updateDoctorAvailability('AVAILABLE', doctorLeaveStartDate, doctorLeaveEndDate)}
                >
                  🟢 Available
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${(activeDoctorStatus === 'ON_LEAVE') ? 'active' : ''}`}
                  onClick={() => updateDoctorAvailability('ON_LEAVE', doctorLeaveStartDate, doctorLeaveEndDate)}
                >
                  🔴 On Leave
                </button>
              </div>

              <div className="leave-summary-box">
                <span className="summary-label">Leave Summary</span>
                <strong>{formatDateRange(doctorLeaveStartDate, doctorLeaveEndDate)}</strong>
                <small>{getLeaveDuration(doctorLeaveStartDate, doctorLeaveEndDate)}</small>
              </div>

              <small className="muted-note">{leaveSummaryText}</small>
            </div>
          </aside>

        <div className="doctor-main-panel">
            {doctorView === 'appointments' && (
              <div className="card modern-card">
                <h3>Approved Patient Appointments</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Appt ID</th>
                      <th>Patient Name</th>
                      <th>Date & Time</th>
                      <th>Medical Record / Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(appointments.filter((a) => a.doctorName === doctorSelection && a.status === 'APPROVED') || []).map((a) => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td>{a.patientName || a.patient}</td>
                        <td>{(a.appointmentDate || a.date || '').replace('T', ' ')}</td>
                        <td><button className="btn btn-primary" onClick={() => openDiagnosis(a)}>Diagnose / Prescribe</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {doctorView === 'password' && (
              <div className="card modern-card">
                <div className="password-panel">
                  <h3>Change Password</h3>
                  <form onSubmit={updateDoctorPassword} className="password-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {diagnosis.id && (
          <div className="card modern-card diagnosis-card">
            <h3>Prescription & Treatment Details</h3>
            <p><strong>Patient:</strong> {diagnosis.patientName} (Appt #{diagnosis.id})</p>
            <form onSubmit={savePrescription}>
              <div className="form-group">
                <label>Diagnosis</label>
                <textarea className="form-control" rows="2" required value={diagnosis.diagnosis} onChange={(e) => setDiagnosis({ ...diagnosis, diagnosis: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Treatment & Prescription Notes</label>
                <textarea className="form-control" rows="3" required value={diagnosis.prescription} onChange={(e) => setDiagnosis({ ...diagnosis, prescription: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-success">Save Record & Issue Prescription</button>
            </form>
          </div>
        )}
      </section>
    );
  };

  const renderPatient = () => (
    <section className="dashboard-panel">
      <div className="top-row">
        <div>
          <p className="eyebrow">Patient Dashboard</p>
          <h2>Welcome back, {user?.name}</h2>
        </div>
        <div className="status-pill success">Care Active</div>
      </div>

      <div className="two-column-layout">
        <div className="card modern-card">
          <h3>Book an Appointment</h3>
          <form onSubmit={handlePatientBooking}>
            <div className="form-group">
              <label>Patient Full Name</label>
              <input type="text" name="patientName" className="form-control" value={user?.name || ''} readOnly required />
            </div>
            <div className="form-group">
              <label>Select Department</label>
              <select name="patientDeptSelect" className="form-control" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} required>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Doctor</label>
              <select
                name="patientDocSelect"
                className="form-control"
                value={selectedDoctorName}
                onChange={(e) => setSelectedDoctorName(e.target.value)}
                required
              >
                {patientDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Date</label>
              <input
                type="date"
                className="form-control"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>
            {selectedDoctorAvailability.status === 'ON_LEAVE' && (
              <div className="form-group">
                <div className="doctor-unavailable-banner">
                  🔴 This doctor is on leave for the selected date and is not available for bookings.
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Available Slots</label>
              <div className="slot-legend">
                <span className="slot-legend-item"><span className="legend-dot legend-available" /> Available</span>
                <span className="slot-legend-item"><span className="legend-dot legend-booked" /> Booked</span>
              </div>
              <div className="slot-grid">
                {doctorDateSlots.length > 0 ? doctorDateSlots.map((slot) => {
                  const buttonClass = `slot-btn ${slot.isBooked ? 'slot-booked' : ''} ${selectedSlot === slot.value ? 'slot-selected' : ''}`;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      className={buttonClass}
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlot(slot.value)}
                    >
                      <span>{slot.label}</span>
                      <small>{slot.isBooked ? 'Booked' : 'Available'}</small>
                    </button>
                  );
                }) : <p className="slot-empty-state">No slots available for this doctor on the selected date.</p>}
              </div>
            </div>
            <input type="hidden" name="patientDate" value={selectedSlot} />
            <button type="submit" className="primary-btn full-width" disabled={!selectedSlot}>Submit Booking</button>
          </form>
        </div>

        <div className="card modern-card">
          <h3>Care Summary</h3>
          <div className="mini-summary">
            <div>
              <span>Appointments</span>
              <strong>{appointments.filter((a) => (a.patientName || a.patient) === user?.name).length}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{appointments.filter((a) => (a.patientName || a.patient) === user?.name && a.status === 'PENDING').length}</strong>
            </div>
            <div>
              <span>Prescription</span>
              <strong>{appointments.filter((a) => (a.patientName || a.patient) === user?.name && a.prescription).length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card modern-card" style={{ marginTop: '1.5rem' }}>
        <h3>My Medical History & Prescriptions</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Appt ID</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Status</th>
              <th>Diagnosis</th>
              <th>Prescription Notes</th>
            </tr>
          </thead>
          <tbody>
            {appointments.filter((a) => (a.patientName || a.patient) === user?.name).map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{a.doctorName || a.doctor}</td>
                <td>{(a.appointmentDate || a.date || '').replace('T', ' ')}</td>
                <td><span className={`badge badge-${(a.status || 'pending').toLowerCase()}`}>{a.status}</span></td>
                <td>{a.diagnosis || 'N/A'}</td>
                <td>{a.prescription || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <>
      {!user && (
        <div className="auth-page-shell">
          <div className="auth-visual-panel">
            <div className="floating-card glow-card">
              <div className="hospital-visual">
                <img
                  src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
                  alt="Modern hospital building"
                />
              </div>
              <span className="chip">24/7 Care</span>
              <h1>Smart Healthcare Management</h1>
              <p>Streamline patient care, doctor schedules, appointments, and prescriptions in one unified system.</p>
            </div>
          </div>

          <section className="auth-wrapper">
            <div className="auth-header">
              <h2>System Login</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            <div className="auth-tabs">
              <button className={`auth-tab-btn ${authTab === 'patient' ? 'active' : ''}`} onClick={() => setAuthTab('patient')}>Patient</button>
              <button className={`auth-tab-btn ${authTab === 'doctor' ? 'active' : ''}`} onClick={() => setAuthTab('doctor')}>Doctor</button>
              <button className={`auth-tab-btn ${authTab === 'admin' ? 'active' : ''}`} onClick={() => setAuthTab('admin')}>Admin</button>
            </div>

            <div className="auth-body">
              {authTab === 'patient' && (
                <div>
                  {!patientRegister ? (
                    <form onSubmit={handlePatientLogin}>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="patientLoginName" type="text" className="form-control" required placeholder="Rahul Sharma" />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input name="patientLoginPass" type="password" className="form-control" required placeholder="patient123" />
                      </div>
                      <button type="submit" className="primary-btn full-width">Sign In as Patient</button>
                      <p className="helper-text">
                        New user? <a href="#" onClick={(e) => { e.preventDefault(); setPatientRegister(true); }}>Create an Account</a>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handlePatientRegister}>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="patientRegName" type="text" className="form-control" required placeholder="Jane Doe" />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input name="patientRegPass" type="password" className="form-control" required placeholder="Create Password" />
                      </div>
                      <button type="submit" className="btn btn-success btn-block">Register & Login</button>
                      <p className="helper-text">
                        Already registered? <a href="#" onClick={(e) => { e.preventDefault(); setPatientRegister(false); }}>Sign In</a>
                      </p>
                    </form>
                  )}
                </div>
              )}

              {authTab === 'doctor' && (
                <form onSubmit={handleDoctorLogin}>
                  <div className="form-group">
                    <label>Select Doctor</label>
                    <select className="form-control" value={doctorSelection} onChange={(e) => setDoctorSelection(e.target.value)} required>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input name="doctorPass" type="password" className="form-control" required />
                  </div>
                  <button type="submit" className="primary-btn full-width">Sign In as Doctor</button>
                </form>
              )}

              {authTab === 'admin' && (
                <form onSubmit={handleAdminLogin}>
                  <div className="form-group">
                    <label>Username</label>
                    <input name="adminUser" type="text" className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input name="adminPass" type="password" className="form-control" required />
                  </div>
                  <button type="submit" className="primary-btn full-width">Sign In as Admin</button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}

      {user && (
        <>
          <nav className="navbar">
            <div className="brand-wrap">
              <div className="brand-badge">+</div>
              <h2>Healthcare System</h2>
            </div>
            <div className="nav-links">
              <span className="user-info">Logged as: {user.name}</span>
              {user.role === 'admin' && <button className="nav-btn active">Admin Module</button>}
              {user.role === 'doctor' && <button className="nav-btn active">Doctor Module</button>}
              {user.role === 'patient' && <button className="nav-btn active">Patient Module</button>}
              <button className="nav-btn" onClick={logout}>Logout</button>
            </div>
          </nav>

          <div className="container dashboard-shell">
            {user.role === 'admin' && renderAdmin()}
            {user.role === 'doctor' && renderDoctor()}
            {user.role === 'patient' && renderPatient()}
          </div>
        </>
      )}
    </>
  );
}

export default App;
