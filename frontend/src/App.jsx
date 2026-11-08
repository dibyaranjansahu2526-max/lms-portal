import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { PageLoader } from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'
import { homeForRole } from './api/helpers'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Catalog from './pages/student/Catalog'
import CourseDetail from './pages/student/CourseDetail'
import LearningPage from './pages/student/LearningPage'
import MyCourses from './pages/student/MyCourses'
import QuizPage from './pages/student/QuizPage'
import StudentDashboard from './pages/student/StudentDashboard'
import Wishlist from './pages/student/Wishlist'
import AdminCourses from './pages/admin/AdminCourses'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import CourseForm from './pages/teacher/CourseForm'
import LessonManager from './pages/teacher/LessonManager'
import QuizBuilder from './pages/teacher/QuizBuilder'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherStudents from './pages/teacher/TeacherStudents'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader label="Loading LMS Portal..." />
  return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <a href="/" className="btn-primary mt-6">
        Back to dashboard
      </a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/catalog"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <Catalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <MyCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/wishlist"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId/learn"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <LearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:quizId"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <TeacherCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/new"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <CourseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/edit"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <CourseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/lessons"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <LessonManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/quizzes"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <QuizBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/students"
          element={
            <ProtectedRoute roles={['TEACHER']}>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminCourses />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
