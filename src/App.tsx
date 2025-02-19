import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';
import { Landing } from './pages/Landing';
import { Analytics } from '@vercel/analytics/react';

type Profile = Database['public']['Tables']['profiles']['Row'];

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setCheckingRole(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setCheckingRole(false);
    }
  };

  if (loading || checkingRole) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si es admin, redirigir al dashboard de admin
  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Si es usuario normal, mostrar el dashboard regular
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </Router>
      <Analytics />
    </AuthProvider>
  );
}

export default App;