import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import {
  Home,
  MessageSquare,
  BookOpen,
  History,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Scale,
  Plus,
  FileText,
  ChevronDown,
  Star
} from 'lucide-react';

import { Chat } from './Chat';
import { Laws } from './Laws';
import { ChatHistory } from './ChatHistory';
import { Profile } from './Profile';
import { Home as HomePage } from './Home';
import { Advisory } from './Advisory';
import { Subscription } from './Subscription';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Chat Legal', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Historial', href: '/dashboard/history', icon: History },
    { name: 'Asesoría', href: '/dashboard/advisory', icon: FileText },
    { name: 'Leyes', href: '/dashboard/laws', icon: BookOpen },
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
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const startNewChat = () => {
    navigate('/dashboard/chat', { replace: true, state: {} });
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
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 flex-none">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-neutral-900" />
              <span className="ml-2 text-xl font-bold text-neutral-900">
                LegalAI RD
                {profile?.role === 'plus' && (
                  <span className="ml-2 text-xs font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded">PLUS</span>
                )}
              </span>
            </div>
            
            <div className="flex items-center">
              <Button
                onClick={startNewChat}
                className="mr-4 hidden md:flex bg-neutral-900 text-white hover:bg-neutral-800"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Chat
              </Button>

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
                      alt={profile?.full_name || 'Usuario'}
                    />
                    <span className="ml-2">{profile?.full_name || 'Usuario'}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>

                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                      onBlur={() => setShowProfileMenu(false)}
                    >
                      <div className="py-1">
                        <Link
                          to="/dashboard/subscription"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Star className="inline-block h-4 w-4 mr-2" />
                          Suscripción
                        </Link>
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

      {/* Mobile menu */}
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
          <Button
            onClick={startNewChat}
            variant="ghost"
            className="w-full justify-start"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Chat
          </Button>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                (location.pathname === item.href || 
                 (item.href === '/dashboard' && location.pathname === '/dashboard') ||
                 (item.href === '/dashboard/chat' && location.pathname === '/dashboard/chat'))
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
          <Link
            to="/dashboard/subscription"
            className="block px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-3" />
              Suscripción
            </div>
          </Link>
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

      {/* Desktop layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-neutral-200">
          <nav className="flex-1 px-2 py-4 flex flex-col justify-between">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    (location.pathname === item.href || 
                     (item.href === '/dashboard' && location.pathname === '/dashboard') ||
                     (item.href === '/dashboard/chat' && location.pathname === '/dashboard/chat'))
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-auto space-y-2">
              <Link
                to="/dashboard/subscription"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-50"
              >
                <Star className="h-5 w-5 mr-3" />
                Suscripción
              </Link>
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

        {/* Main content */}
        <main className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/advisory" element={<Advisory />} />
                <Route path="/laws" element={<Laws />} />
                <Route path="/history" element={<ChatHistory />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
