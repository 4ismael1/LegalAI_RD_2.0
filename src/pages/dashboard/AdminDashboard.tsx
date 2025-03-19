import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  LogOut, 
  Menu, 
  X, 
  DollarSign,
  Scale,
  Users,
  MessageSquare,
  FileText,
  Clock,
  Home,
  Settings,
  User,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  BookOpen,
  BarChart,
  Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import type { Database } from '@/lib/database.types';
import { Profile } from './Profile';
import { AdminUsers } from './AdminUsers';
import { AdminAdvisories } from './AdminAdvisories';
import { AdminAPILimits } from './AdminAPILimits';
import { RevenueMetrics } from './RevenueMetrics';
import { AdminHome } from './AdminHome';
import { Laws } from './Laws';
import { AdvancedMetrics } from './AdvancedMetrics';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Asesorías', href: '/dashboard/advisories', icon: FileText },
    { name: 'Leyes', href: '/dashboard/laws', icon: BookOpen },
    { name: 'Métricas', href: '/dashboard/metrics', icon: BarChart },
    { name: 'Ingresos', href: '/dashboard/revenue', icon: DollarSign },
    { name: 'Límites API', href: '/dashboard/api-limits', icon: Gauge },
    { name: 'Perfil', href: '/dashboard/profile', icon: Settings },
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
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

      // Verificar si el usuario es admin
      if (data.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getProfileImage = () => {
    return profile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 flex-none">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-neutral-900" />
              <span className="ml-2 text-xl font-bold text-neutral-900">LegalAI RD - Admin</span>
            </div>
            
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex md:items-center">
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={getProfileImage()}
                      alt={profile?.full_name || 'Administrador'}
                    />
                    <span className="ml-2">{profile?.full_name || 'Administrador'}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>

                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                      onBlur={() => setShowProfileMenu(false)}
                    >
                      <div className="py-1">
                        <Link
                          to="/dashboard/profile"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User className="inline-block h-4 w-4 mr-2" />
                          Perfil
                        </Link>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100"
                        >
                          <LogOut className="inline-block h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center md:hidden">
                <Button
                  variant="ghost"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        initial={false}
        animate={isMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          closed: { opacity: 0, height: 0 }
        }}
        className="md:hidden bg-white border-b border-neutral-200 flex-none"
      >
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                (location.pathname === item.href || 
                 (item.href === '/dashboard' && location.pathname === '/dashboard'))
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50'
              } block px-3 py-2 text-base font-medium`}
            >
              <div className="flex items-center">
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </div>
            </Link>
          ))}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-neutral-200">
          <nav className="flex-1 px-2 py-4 flex flex-col justify-between">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    (location.pathname === item.href || 
                     (item.href === '/dashboard' && location.pathname === '/dashboard'))
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-auto">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </nav>
        </div>

        <main className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route path="/" element={<AdminHome />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/advisories" element={<AdminAdvisories />} />
                <Route path="/api-limits" element={<AdminAPILimits />} />
                <Route path="/laws" element={<Laws />} />
        
                <Route path="/metrics" element={<AdvancedMetrics />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
