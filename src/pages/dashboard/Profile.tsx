import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, AlertCircle, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error instanceof Error && error.message === 'No active session') {
        navigate('/login');
      } else {
        setMessage({
          type: 'error',
          text: 'Error al cargar el perfil. Por favor, recarga la página.'
        });
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      if (passwords.new !== passwords.confirm) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }

      if (passwords.new.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwords.current
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('La contraseña actual es incorrecta');
        }
        throw signInError;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar la contraseña'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          email_notifications: profile.email_notifications
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      await loadProfile();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al actualizar el perfil'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      setUploading(true);
      setMessage(null);

      if (profile?.avatar_url) {
        const previousPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('avatars')
          .remove([previousPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await loadProfile();

      setMessage({ type: 'success', text: 'Foto de perfil actualizada exitosamente' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al subir la foto de perfil'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleAvatarUpload(files[0]);
    }
  };

  const getProfileImage = () => {
    return profile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div 
            className={`mb-8 p-8 border-2 border-dashed rounded-lg transition-colors ${
              isDragging 
                ? 'border-neutral-400 bg-neutral-50' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 mb-4">
                <img
                  src={getProfileImage()}
                  alt="Perfil"
                  className="w-full h-full rounded-full object-cover bg-neutral-100"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-neutral-900">
                  {profile.full_name || 'Usuario'}
                </h1>
                <p className="text-neutral-600">
                  Usuario desde {new Date(user?.created_at || '').toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center justify-center mt-4 text-neutral-500">
                  <Upload className="h-5 w-5 mr-2" />
                  <span>Arrastra y suelta una imagen aquí para cambiar tu foto de perfil</span>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-3 rounded-md text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-600' 
                : 'bg-red-50 text-red-600'
            }`}>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {message.text}
              </div>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Información Personal
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                      className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
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
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Dirección
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.address || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, address: e.target.value} : null)}
                      className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Preferencias
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profile.email_notifications}
                      onChange={(e) => setProfile(prev => prev ? {...prev, email_notifications: e.target.checked} : null)}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                    />
                    <span className="text-sm text-neutral-700">
                      Recibir notificaciones por correo
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Seguridad
                </h2>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>
            {message && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  required
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  required
                  placeholder="Ingresa la nueva contraseña"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  required
                  placeholder="Confirma la nueva contraseña"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                    setMessage(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}