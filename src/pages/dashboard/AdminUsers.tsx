import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Search, AlertCircle, Check, X, Shield, Crown, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionDate, setSubscriptionDate] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [user, navigate]); 

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // First verify admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      if (profileData.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar los usuarios. Por favor, verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<Profile>) => {
    setUpdating(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) throw updateError;
      
      await loadUsers();
      setMessage({
        type: 'success',
        text: 'Usuario actualizado exitosamente'
      });
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ 
        type: 'error',
        text: 'Error al actualizar el usuario. Por favor, intenta de nuevo.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgradeToPlus = async (userId: string) => {
    setUpdating(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('upgrade_to_plus', {
        user_id_param: userId
      });

      if (error) throw error;

      await loadUsers();
      setSubscriptionMessage({
        type: 'success',
        text: 'Usuario actualizado a Plus exitosamente'
      });
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setSelectedUser(null);
        setSubscriptionMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error upgrading to plus:', error);
      setSubscriptionMessage({
        type: 'error',
        text: 'Error al actualizar a Plus. Por favor, intenta de nuevo.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDowngrade = async (userId: string) => {
    setUpdating(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('request_downgrade', {
        user_id_param: userId
      });

      if (error) throw error;

      await loadUsers();
      setSubscriptionMessage({
        type: 'success',
        text: 'La suscripción será cancelada al final del período actual'
      });
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setSelectedUser(null);
        setSubscriptionMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      setSubscriptionMessage({
        type: 'error',
        text: 'Error al cancelar la suscripción. Por favor, intenta de nuevo.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRenewSubscription = async (userId: string) => {
    setUpdating(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('renew_subscription', {
        user_id_param: userId
      });

      if (error) throw error;

      await loadUsers();
      setSubscriptionMessage({
        type: 'success',
        text: 'La suscripción ha sido renovada exitosamente'
      });
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setSelectedUser(null);
        setSubscriptionMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error renewing subscription:', error);
      setSubscriptionMessage({
        type: 'error',
        text: 'Error al renovar la suscripción. Por favor, intenta de nuevo.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSubscriptionEnd = async (userId: string, date: string) => {
    setUpdating(true);
    setError(null);
    try {
      // Format the date correctly for Postgres
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      const isoDate = endDate.toISOString();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_end: isoDate })
        .eq('id', userId);

      if (updateError) throw updateError;

      await loadUsers();

      setSubscriptionMessage({
        type: 'success',
        text: 'Fecha de suscripción actualizada exitosamente'
      });
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setSelectedUser(null);
        setSubscriptionMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error updating subscription date:', error);
      setSubscriptionMessage({
        type: 'error',
        text: 'Error al actualizar la fecha de suscripción. Por favor, intenta de nuevo.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Gestión de Usuarios
          </h2>
          {message && (
            <div className={`mb-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-600' 
                : 'bg-red-50 text-red-600'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message.text}
              </div>
            </div>
          )}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuarios..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <Search className="absolute -mt-8 ml-3 h-5 w-5 text-neutral-400" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-4" />
            <p className="text-neutral-600">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <User className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={user.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                        alt={user.full_name || 'Usuario'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {user.full_name || 'Usuario sin nombre'}
                        </h3>
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        )}
                        {user.role === 'plus' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-900 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Plus
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-sm text-neutral-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email || 'Sin correo'}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm text-neutral-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {user.phone}
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center text-sm text-neutral-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {user.address}
                          </div>
                        )}
                        {user.role === 'plus' && (
                          <div className="flex items-center text-sm text-neutral-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Suscripción hasta: {formatDate(user.subscription_end)}
                            {user.pending_downgrade && (
                              <span className="ml-2 text-yellow-600">(Pendiente de cancelación)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-sm text-neutral-500">
                      Registrado: {formatDate(user.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowSubscriptionModal(false);
                          setSubscriptionMessage(null);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowSubscriptionModal(true);
                          setSubscriptionMessage(null);
                          if (user.subscription_end) {
                            setSubscriptionDate(new Date(user.subscription_end).toISOString().split('T')[0]);
                          } else {
                            setSubscriptionDate(new Date().toISOString().split('T')[0]);
                          }
                        }}
                      >
                        Suscripción
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && !showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Editar Usuario</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {...prev, full_name: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  El correo electrónico no se puede modificar directamente por razones de seguridad.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Rol
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser(prev => prev ? {...prev, role: e.target.value as 'user' | 'admin' | 'plus'} : null)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="plus">Plus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {...prev, phone: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={selectedUser.address || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {...prev, address: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.email_notifications}
                    onChange={(e) => setSelectedUser(prev => prev ? {...prev, email_notifications: e.target.checked} : null)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                  />
                  <span className="text-sm text-neutral-700">
                    Notificaciones por correo
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setSelectedUser(null)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleUpdateUser(selectedUser.id, {
                  full_name: selectedUser.full_name,
                  phone: selectedUser.phone,
                  address: selectedUser.address,
                  email_notifications: selectedUser.email_notifications,
                  role: selectedUser.role
                })}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Subscription Management Modal */}
      {selectedUser && showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            {subscriptionMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                subscriptionMessage.type === 'success' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                <div className="flex items-center">
                  {subscriptionMessage.type === 'success' ? (
                    <Check className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {subscriptionMessage.text}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestionar Suscripción</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSubscriptionMessage(null);
                }}
                className="hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center text-neutral-600 mb-2">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Plan actual
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {selectedUser.role === 'plus' ? 'Plus' : 'Gratuito'}
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center text-neutral-600 mb-2">
                    <Calendar className="h-5 w-5 mr-2" />
                    Fin de suscripción
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {selectedUser.subscription_end ? formatDate(selectedUser.subscription_end) : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha de fin de suscripción
                </label>
                <input
                  type="date"
                  value={subscriptionDate}
                  onChange={(e) => setSubscriptionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedUser.role !== 'plus' && (
                  <Button
                    onClick={() => handleUpgradeToPlus(selectedUser.id)}
                    disabled={updating}
                    className="flex-1"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Activar Plus
                  </Button>
                )}

                {selectedUser.role === 'plus' && !selectedUser.pending_downgrade && (
                  <Button
                    onClick={() => handleDowngrade(selectedUser.id)}
                    disabled={updating}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar Plus
                  </Button>
                )}

                {selectedUser.role === 'plus' && (
                  <Button
                    onClick={() => handleRenewSubscription(selectedUser.id)}
                    disabled={updating}
                    className="flex-1"
                  >
                    Renovar Plus
                  </Button>
                )}

                <Button
                  onClick={() => handleUpdateSubscriptionEnd(selectedUser.id, new Date(subscriptionDate).toISOString())}
                  disabled={updating}
                  variant="secondary"
                  className="flex-1"
                >
                  Actualizar Fecha
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSubscriptionMessage(null);
                }}
                disabled={updating}
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
