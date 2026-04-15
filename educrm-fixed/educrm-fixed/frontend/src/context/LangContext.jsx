import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  uz: {
    // General
    loading: 'Yuklanmoqda...', save: 'Saqlash', cancel: 'Bekor qilish', delete: 'O\'chirish',
    edit: 'Tahrirlash', add: 'Qo\'shish', search: 'Qidirish', close: 'Yopish',
    confirm: 'Tasdiqlash', actions: 'Amallar', status: 'Holat', all: 'Barchasi',
    active: 'Faol', inactive: 'Faol emas', name: 'Ism', phone: 'Telefon',
    date: 'Sana', yes: 'Ha', no: 'Yo\'q', back: 'Orqaga',

    // Nav
    dashboard: 'Bosh sahifa', students: 'O\'quvchilar', teachers: 'O\'qituvchilar',
    groups: 'Guruhlar', myGroups: 'Guruhlarim', courses: 'Kurslar', rooms: 'Xonalar',
    staff: 'Xodimlar', settings: 'Sozlamalar', logout: 'Chiqish', notifications: 'Bildirishnomalar',
    attendance: 'Davomat', lessons: 'Darslar', homework: 'Uy vazifasi', reports: 'Hisobotlar',

    // Admin
    totalStudents: 'Jami o\'quvchilar', totalTeachers: 'Jami o\'qituvchilar',
    totalGroups: 'Jami guruhlar', totalCourses: 'Jami kurslar',
    addStudent: 'O\'quvchi qo\'shish', addTeacher: 'O\'qituvchi qo\'shish',
    addGroup: 'Guruh qo\'shish', addCourse: 'Kurs qo\'shish', addRoom: 'Xona qo\'shish',
    firstName: 'Ism', lastName: 'Familiya', birthDate: 'Tug\'ilgan sana',
    gender: 'Jins', male: 'Erkak', female: 'Ayol', password: 'Parol',
    role: 'Rol', teacher: 'O\'qituvchi', student: 'O\'quvchi', admin: 'Admin',
    direction: 'Yo\'nalish', startDate: 'Boshlanish sanasi', endDate: 'Tugash sanasi',
    capacity: 'Sig\'im', price: 'Narx', duration: 'Davomiyligi',
    selectTeacher: 'O\'qituvchini tanlang', selectRoom: 'Xonani tanlang', selectCourse: 'Kursni tanlang',
    confirmDelete: 'Haqiqatan ham o\'chirishni xohlaysizmi?',

    // Teacher
    myStudents: 'O\'quvchilarim', lessonCount: 'Darslar soni', attendanceRate: 'Davomat foizi',
    markAttendance: 'Davomatni belgilash', present: 'Keldi', absent: 'Kelmadi', late: 'Kech qoldi',
    saveAttendance: 'Davomatni saqlash', lessonTitle: 'Dars nomi', lessonDate: 'Dars sanasi',
    addLesson: 'Dars qo\'shish', uploadVideo: 'Video yuklash', addHomework: 'Uy vazifasi qo\'shish',
    submissions: 'Topshiriqlar', grade: 'Baho', feedback: 'Fikr',
    pending: 'Kutilmoqda', accepted: 'Qabul qilindi', returned: 'Qaytarildi', failed: 'Muvaffaqiyatsiz',

    // Student
    xpPoints: 'XP Ball', level: 'Daraja', rating: 'Reyting', coins: 'Kumush',
    watchVideo: 'Videoni ko\'rish', submitHomework: 'Uy vazifasini topshirish',
    groupMembers: 'Guruh a\'zolari', lessonDetails: 'Dars tafsilotlari',
    myAttendance: 'Mening davomatim', profile: 'Profil',
  },
  en: {
    loading: 'Loading...', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    edit: 'Edit', add: 'Add', search: 'Search', close: 'Close',
    confirm: 'Confirm', actions: 'Actions', status: 'Status', all: 'All',
    active: 'Active', inactive: 'Inactive', name: 'Name', phone: 'Phone',
    date: 'Date', yes: 'Yes', no: 'No', back: 'Back',
    dashboard: 'Dashboard', students: 'Students', teachers: 'Teachers',
    groups: 'Groups', myGroups: 'My Groups', courses: 'Courses', rooms: 'Rooms',
    staff: 'Staff', settings: 'Settings', logout: 'Logout', notifications: 'Notifications',
    attendance: 'Attendance', lessons: 'Lessons', homework: 'Homework', reports: 'Reports',
    totalStudents: 'Total Students', totalTeachers: 'Total Teachers',
    totalGroups: 'Total Groups', totalCourses: 'Total Courses',
    addStudent: 'Add Student', addTeacher: 'Add Teacher',
    addGroup: 'Add Group', addCourse: 'Add Course', addRoom: 'Add Room',
    firstName: 'First Name', lastName: 'Last Name', birthDate: 'Birth Date',
    gender: 'Gender', male: 'Male', female: 'Female', password: 'Password',
    role: 'Role', teacher: 'Teacher', student: 'Student', admin: 'Admin',
    direction: 'Direction', startDate: 'Start Date', endDate: 'End Date',
    capacity: 'Capacity', price: 'Price', duration: 'Duration',
    selectTeacher: 'Select Teacher', selectRoom: 'Select Room', selectCourse: 'Select Course',
    confirmDelete: 'Are you sure you want to delete this?',
    myStudents: 'My Students', lessonCount: 'Lesson Count', attendanceRate: 'Attendance Rate',
    markAttendance: 'Mark Attendance', present: 'Present', absent: 'Absent', late: 'Late',
    saveAttendance: 'Save Attendance', lessonTitle: 'Lesson Title', lessonDate: 'Lesson Date',
    addLesson: 'Add Lesson', uploadVideo: 'Upload Video', addHomework: 'Add Homework',
    submissions: 'Submissions', grade: 'Grade', feedback: 'Feedback',
    pending: 'Pending', accepted: 'Accepted', returned: 'Returned', failed: 'Failed',
    xpPoints: 'XP Points', level: 'Level', rating: 'Rating', coins: 'Coins',
    watchVideo: 'Watch Video', submitHomework: 'Submit Homework',
    groupMembers: 'Group Members', lessonDetails: 'Lesson Details',
    myAttendance: 'My Attendance', profile: 'Profile',
  }
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'uz');
  const t = (key) => translations[lang][key] || key;
  const switchLang = (l) => { setLang(l); localStorage.setItem('lang', l); };
  return (
    <LangContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
