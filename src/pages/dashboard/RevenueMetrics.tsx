import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

type RevenueStats = {
  currentMonth: {
    revenue: number;
    subscriptions: number;
    growth: number;
  };
  yearToDate: {
    revenue: number;
    subscriptions: number;
    growth: number;
  };
  activeSubscribers: number;
  pendingCancellations: number;
  monthlyData: {
    month: string;
    revenue: number;
    subscriptions: number;
  }[];
  subscriptionStats: {
    active: number;
    cancelled: number;
    pending: number;
  };
  recentPayments: {
    id: string;
    user_id: string;
    amount: number;
    created_at: string;
    user_name: string;
  }[];
};

export function RevenueMetrics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      if (profile.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      // Load subscription control setting
      const { data: config, error: configError } = await supabase
        .from('api_config')
        .select('subscriptions_enabled')
        .single();

      if (!configError && config) {
        setSubscriptionsEnabled(config.subscriptions_enabled);
      }

      loadStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month's data
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Get previous month's data for comparison
      const firstDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      // Get current month revenue
      const { data: currentMonthPayments, error: currentMonthError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());

      if (currentMonthError) throw currentMonthError;

      // Get previous month revenue for growth calculation
      const { data: prevMonthPayments, error: prevMonthError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', firstDayOfPrevMonth.toISOString())
        .lte('created_at', lastDayOfPrevMonth.toISOString());

      if (prevMonthError) throw prevMonthError;

      // Calculate current month stats
      const currentMonthRevenue = currentMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const prevMonthRevenue = prevMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const revenueGrowth = prevMonthRevenue === 0 ? 100 : ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

      // Get active subscribers
      const { count: activeSubscribers, error: subscribersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'plus');

      if (subscribersError) throw subscribersError;

      // Get pending cancellations
      const { count: pendingCancellations, error: cancellationsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'plus')
        .eq('pending_downgrade', true);

      if (cancellationsError) throw cancellationsError;

      // Get monthly data for the past 12 months
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        const { data: monthPayments, error: monthError } = await supabase
          .from('payments')
          .select('amount, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (monthError) throw monthError;

        monthlyData.push({
          month: startDate.toLocaleString('default', { month: 'short' }),
          revenue: monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
          subscriptions: monthPayments.length
        });
      }

      // Get recent payments with user names
      const { data: recentPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, profiles:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (paymentsError) throw paymentsError;

      // Calculate year-to-date stats
      const yearStartDate = new Date(currentDate.getFullYear(), 0, 1);
      const { data: yearPayments, error: yearError } = await supabase
        .from('payments')
        .select('amount, created_at')
        .gte('created_at', yearStartDate.toISOString());

      if (yearError) throw yearError;

      const yearToDateRevenue = yearPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

      // Set all stats
      setStats({
        currentMonth: {
          revenue: currentMonthRevenue,
          subscriptions: currentMonthPayments.length,
          growth: revenueGrowth
        },
        yearToDate: {
          revenue: yearToDateRevenue,
          subscriptions: yearPayments.length,
          growth: 0 // Calculate if needed
        },
        activeSubscribers: activeSubscribers || 0,
        pendingCancellations: pendingCancellations || 0,
        monthlyData,
        subscriptionStats: {
          active: activeSubscribers || 0,
          cancelled: 0, // Get from historical data if needed
          pending: pendingCancellations || 0
        },
        recentPayments: recentPayments.map(payment => ({
          id: payment.id,
          user_id: payment.user_id,
          amount: Number(payment.amount),
          created_at: payment.created_at,
          user_name: payment.profiles?.full_name || 'Usuario'
        }))
      });
    } catch (error) {
      console.error('Error loading revenue stats:', error);
      setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSubscriptions = async () => {
    try {
      const newState = !subscriptionsEnabled;
      
      const { error: updateError } = await supabase
        .from('api_config')
        .update({ subscriptions_enabled: newState })
        .eq('id', 1);

      if (updateError) throw updateError;

      setSubscriptionsEnabled(newState);
      setMessage({
        type: 'success',
        text: `Suscripciones ${newState ? 'habilitadas' : 'deshabilitadas'} exitosamente`
      });
    } catch (error) {
      console.error('Error toggling subscriptions:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el estado de las suscripciones'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
        <p className="text-neutral-600 text-center mb-4">{error}</p>
        <Button onClick={loadStats} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  // Chart configurations
  const revenueChartData = {
    labels: stats.monthlyData.map(data => data.month),
    datasets: [
      {
        label: 'Ingresos Mensuales',
        data: stats.monthlyData.map(data => data.revenue),
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const subscriptionsChartData = {
    labels: stats.monthlyData.map(data => data.month),
    datasets: [
      {
        label: 'Nuevas Suscripciones',
        data: stats.monthlyData.map(data => data.subscriptions),
        backgroundColor: 'rgb(34, 197, 94)',
        borderRadius: 8
      }
    ]
  };

  const subscriptionStatusData = {
    labels: ['Activas', 'Pendientes de Cancelación'],
    datasets: [
      {
        data: [
          stats.subscriptionStats.active - stats.subscriptionStats.pending,
          stats.subscriptionStats.pending
        ],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    },
    cutout: '70%'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    > 
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">
          Métricas de Ingresos
        </h2>
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleSubscriptions}
            variant={subscriptionsEnabled ? 'default' : 'destructive'}
            size="sm"
          >
            {subscriptionsEnabled ? (
              'Deshabilitar Suscripciones'
            ) : (
              'Habilitar Suscripciones'
            )}
          </Button>
          <div className="flex items-center gap-2">
            {['month', 'year'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                onClick={() => setTimeRange(range as 'month' | 'year')}
                size="sm"
              >
                {range === 'month' ? 'Mes' : 'Año'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
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

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">
                {timeRange === 'month' ? 'Ingresos del Mes' : 'Ingresos del Año'}
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(timeRange === 'month' ? stats.currentMonth.revenue : stats.yearToDate.revenue)}
              </h3>
              <div className={`flex items-center text-sm mt-2 ${
                stats.currentMonth.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.currentMonth.growth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.currentMonth.growth).toFixed(1)}% vs mes anterior
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Suscriptores Activos</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.activeSubscribers}
              </h3>
              <p className="text-sm text-neutral-500 mt-2">
                {stats.pendingCancellations} pendientes de cancelación
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Crown className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Nuevas Suscripciones</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {timeRange === 'month' ? stats.currentMonth.subscriptions : stats.yearToDate.subscriptions}
              </h3>
              <p className="text-sm text-neutral-500 mt-2">
                Este {timeRange === 'month' ? 'mes' : 'año'}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Ingreso Promedio</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(5.00)}
              </h3>
              <p className="text-sm text-neutral-500 mt-2">
                Por suscripción
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Ingresos Mensuales
          </h3>
          <Line data={revenueChartData} options={chartOptions} />
        </div>

        {/* Subscriptions Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Nuevas Suscripciones
          </h3>
          <Bar data={subscriptionsChartData} options={chartOptions} />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Subscription Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Estado de Suscripciones
          </h3>
          <div className="relative" style={{ height: '300px' }}>
            <Doughnut data={subscriptionStatusData} options={doughnutOptions} />
          </div>
        </div>

        {/* Recent Payments */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Pagos Recientes
          </h3>
          <div className="space-y-4">
            {stats.recentPayments.map((payment) => (
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
                      {payment.user_name}
                    </p>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(payment.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-neutral-900">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}