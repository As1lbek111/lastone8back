import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/layout/Layout';

// Auth
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminTeachers from './pages/admin/Teachers';
import AdminGroups from './pages/admin/Groups';
import AdminGroupDetail from './pages/admin/GroupDetail';
import AdminCourses from './pages/admin/Courses';
import AdminRooms from './pages/admin/Rooms';
import AdminTeacherAttendance from './pages/admin/TeacherAttendance';
import AdminAttendance from './pages/admin/Attendance';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherGroups from './pages/teacher/Groups';
import TeacherGroupDetail from './pages/teacher/GroupDetail';
import TeacherLessonView from './pages/teacher/LessonView';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherSettings from './pages/teacher/Settings';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentGroups from './pages/student/Groups';
import StudentGroupDetail from './pages/student/GroupDetail';
import StudentLessonView from './pages/student/LessonView';
import StudentSettings from './pages/student/Settings';

// Shared
import Notifications from './pages/Notifications';

function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 12, color: '#64748b', fontSize: 14,
        fontFamily: 'Sora, sans-serif',
      }}>
        <div style={{
          width: 22, height: 22, border: '2.5px solid #e2e8f0',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        Yuklanmoqda...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own panel
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RoleRedirect />} />

            {/* ── ADMIN ── */}
            <Route path="/admin" element={
              <RequireAuth allowedRoles={['admin']}>
                <Layout role="admin" />
              </RequireAuth>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="groups/:id" element={<AdminGroupDetail />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="teachers/:id/attendance" element={<AdminTeacherAttendance />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* ── TEACHER ── */}
            <Route path="/teacher" element={
              <RequireAuth allowedRoles={['teacher', 'admin']}>
                <Layout role="teacher" />
              </RequireAuth>
            }>
              <Route index element={<TeacherDashboard />} />
              <Route path="groups" element={<TeacherGroups />} />
              <Route path="groups/:id" element={<TeacherGroupDetail />} />
              <Route path="groups/:groupId/lessons/:lessonId" element={<TeacherLessonView />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="settings" element={<TeacherSettings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* ── STUDENT ── */}
            <Route path="/student" element={
              <RequireAuth allowedRoles={['student', 'admin']}>
                <Layout role="student" />
              </RequireAuth>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="groups" element={<StudentGroups />} />
              <Route path="groups/:id" element={<StudentGroupDetail />} />
              <Route path="groups/:groupId/lessons/:lessonId" element={<StudentLessonView />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
