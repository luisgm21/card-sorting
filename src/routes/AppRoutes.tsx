import { Navigate, Route, Routes } from "react-router"
import HomeLayout from "../components/home/layout/HomeLayout"
import LoginPage from "../pages/LoginPage"
import RegisterPage from "../pages/RegisterPage"
import Dashboard from "../pages/Dashboard"
import StudyCreate from "../pages/StudyCreate"
import StudyDetail from "../pages/StudyDetail"
import StudyEdit from "../pages/StudyEdit"
import StudySort from "../pages/StudySort"
import Profile from "../pages/Profile"
import AdminUsers from "../pages/AdminUsers"


const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes - standalone layouts */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public study sorting route (no auth needed) */}
      <Route path="/study/:link" element={<StudySort />} />

      {/* App routes with navbar/footer */}
      <Route element={<HomeLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/studies/new" element={<StudyCreate />} />
        <Route path="/studies/:id" element={<StudyDetail />} />
        <Route path="/studies/:id/edit" element={<StudyEdit />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <p className="mt-2 text-gray-500">Página no encontrada</p>
            <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              Volver al inicio
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default AppRoutes