import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Scale, User, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 2. Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: formData.fullName,
              email: formData.email,
              role: 'user',
              email_notifications: false,
              weekly_summary: false,
              dark_mode: false,
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          // If profile creation fails, delete the user to maintain consistency
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('Failed to create profile. Please try again.');
        }

        // 3. Initialize message count for today
        const { error: messageCountError } = await supabase
          .from('message_counts')
          .insert([
            {
              user_id: authData.user.id,
              date: new Date().toISOString().split('T')[0],
              count: 0
            }
          ]);

        if (messageCountError) {
          console.error('Error initializing message count:', messageCountError);
        }

        // Show success message and redirect after a delay
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center justify-center mb-8">
            <Scale className="h-12 w-12 text-neutral-900" />
          </div>
          
          <h1 className="text-3xl font-bold text-center text-neutral-900 mb-2">
            Crear Cuenta
          </h1>
          <p className="text-neutral-600 text-center mb-8">
            Únete a la plataforma legal más innovadora
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              Registro exitoso. Redirigiendo al inicio de sesión...
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  placeholder="Juan Pérez"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  placeholder="ejemplo@correo.com"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-neutral-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-semibold text-neutral-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}