import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, Check, AlertCircle, Calendar, CreditCard, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

export function Subscription() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [subscriptionDate, setSubscriptionDate] = useState<string>('');
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPayments();
      checkSubscriptionsEnabled();
    }
  }, [user]);

  const checkSubscriptionsEnabled = async () => {
    try {
      const { data: config, error: configError } = await supabase
        .from('api_config')
        .select('subscriptions_enabled')
        .single();

      if (!configError && config) {
        setSubscriptionsEnabled(config.subscriptions_enabled);
      }
    } catch (error) {
      console.error('Error checking subscriptions status:', error);
    }
  };

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

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('upgrade_to_plus', {
        user_id_param: user.id
      });

      if (error) throw error;

      await Promise.all([loadProfile(), loadPayments()]);
      setShowConfirm(false);
      setMessage({
        type: 'success',
        text: 'Has sido actualizado a Plus exitosamente'
      });
    } catch (error) {
      console.error('Error upgrading to plus:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar a Plus. Por favor, intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('request_downgrade', {
        user_id_param: user.id
      });

      if (error) throw error;

      await Promise.all([loadProfile(), loadPayments()]);
      setShowDowngradeConfirm(false);
      setMessage({
        type: 'success',
        text: 'Tu suscripción será cancelada al final del período actual'
      });
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      setMessage({
        type: 'error',
        text: 'Error al cancelar la suscripción. Por favor, intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('renew_subscription', {
        user_id_param: user.id
      });

      if (error) throw error;

      await Promise.all([loadProfile(), loadPayments()]);
      setShowConfirm(false);
      setMessage({
        type: 'success',
        text: 'Tu suscripción ha sido renovada exitosamente'
      });
    } catch (error) {
      console.error('Error renewing subscription:', error);
      setMessage({
        type: 'error',
        text: 'Error al renovar la suscripción. Por favor, intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Planes y Suscripción
        </h2>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Plan Gratuito */}
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6 hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Plan Gratuito
                </h3>
                <p className="text-neutral-600 mt-1">
                  Acceso básico a consultas legales
                </p>
              </div>
              <div className="text-lg font-bold text-neutral-900">
                Gratis
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-neutral-600">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                5 consultas diarias
              </li>
              <li className="flex items-center text-neutral-600">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Acceso a leyes básicas
              </li>
              <li className="flex items-center text-neutral-600">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Historial de consultas
              </li>
            </ul>
            {profile?.role === 'user' && (
              <div className="text-sm font-medium text-neutral-900 bg-neutral-100 px-3 py-1 rounded-full inline-block">
                Plan actual
              </div>
            )}
          </div>

          {/* Plan Plus */}
          <div className="bg-neutral-900 text-white rounded-lg p-6 transform hover:scale-[1.02] transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  Plan Plus
                  <Crown className="h-5 w-5 ml-2" />
                </h3>
                <p className="text-neutral-300 mt-1">
                  Acceso ilimitado y prioridad
                </p>
              </div>
              <div className="text-lg font-bold">
                $5/mes
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-neutral-300">
                <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                20 consultas diarias
              </li>
              <li className="flex items-center text-neutral-300">
                <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                Acceso a todas las leyes
              </li>
              <li className="flex items-center text-neutral-300">
                <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                Prioridad en asesorías
              </li>
            </ul>
            {profile?.role === 'plus' && (
              <div className="text-sm text-neutral-300 mb-4 space-y-2">
                {!profile.pending_downgrade && (
                  <div className="bg-white/10 text-white px-3 py-1 rounded-full inline-block">
                    Suscripción activa
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Suscripción hasta: {formatDate(profile.subscription_end)}
                </div>
                {profile.pending_downgrade && (
                  <p className="text-yellow-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Pendiente de cancelación
                  </p>
                )}
              </div>
            )}
            {profile?.role === 'plus' ? (
              profile.pending_downgrade ? (
                <Button
                  className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                >
                  Renovar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
                  onClick={() => setShowDowngradeConfirm(true)}
                  disabled={loading}
                >
                  Cancelar Suscripción
                </Button>
              )
            ) : (
              <Button
                disabled={!subscriptionsEnabled}
                className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
                onClick={() => setShowConfirm(true)}
              >
                {subscriptionsEnabled ? (
                  <>Suscribirse <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  'Suscripciones temporalmente deshabilitadas'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Historial de Pagos
          </h2>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-neutral-200 p-2 rounded-full">
                    <CreditCard className="h-5 w-5 text-neutral-700" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-neutral-900">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(payment.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-neutral-600">
                    Período: {formatDate(payment.subscription_period_start)} - {formatDate(payment.subscription_period_end)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">
              {profile?.role === 'plus' && profile.pending_downgrade
                ? 'Renovar Suscripción'
                : 'Confirmar Suscripción'}
            </h2>
            <p className="text-neutral-600 mb-6">
              {profile?.role === 'plus' && profile.pending_downgrade
                ? 'Tu suscripción se renovará automáticamente al finalizar el período actual. ¿Deseas continuar?'
                : '¿Deseas activar el Plan Plus por $5/mes?'}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={profile?.role === 'plus' && profile.pending_downgrade
                  ? handleRenew
                  : handleUpgrade}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">
              Cancelar Suscripción
            </h2>
            <p className="text-neutral-600 mb-6">
              ¿Estás seguro que deseas cancelar tu suscripción Plus? Perderás acceso a los beneficios al finalizar el período actual.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowDowngradeConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDowngrade}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Procesando...' : 'Confirmar Cancelación'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}