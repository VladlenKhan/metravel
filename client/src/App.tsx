import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Убрали BrowserRouter и Router
import Home from './pages/Home';
import Tours from './pages/Tours';
import NotFound from './pages/NotFound';  
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp'; 
import Navbar from './components/Navbar';
import ScrollToHash from './components/ScrollToHash';
import { AdminUsersPanel } from './pages/admin/AdminUserPanel';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <> {/* Используем фрагмент вместо Router */}
      <ScrollToHash />
      
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />

            {/* Админка */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminUsersPanel />
                </ProtectedRoute>
              } 
            />

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;