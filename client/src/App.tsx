import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToHash from './components/ScrollToHash';
import TravelChatWidget from './components/TravelChatWidget';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Bookings from './pages/Bookings';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Tours from './pages/Tours';
import { AdminUsersPanel } from './pages/admin/AdminUserPanel';
import { useAuthSession } from './hooks/useAuthSession';

function App() {
  const location = useLocation();
  const session = useAuthSession();
  const shouldShowTravelChat =
    session?.role !== "Admin" && session?.role !== "Operator";
  const shouldShowNavbar = location.pathname !== "/404";

  return (
    <>
      <ScrollToHash />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {shouldShowNavbar ? <Navbar /> : null}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tours />} />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute requiredRole="Client">
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole="Client">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute requiredRole="Client">
                  <Bookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Operator"]}>
                  <AdminUsersPanel />
                </ProtectedRoute>
              }
            />

            <Route path="/admin/users" element={<Navigate to="/admin" replace />} />

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>

        {shouldShowTravelChat ? <TravelChatWidget /> : null}
      </div>
    </>
  );
}

export default App;
