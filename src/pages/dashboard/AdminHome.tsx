import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Scale,
  BookOpen,
  Users,
  Shield,
  Gavel,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    totalAdvisories: 0,
    pendingAdvisories: 0,
    weeklyStats: {
      newUsers: 0,
      newChats: 0,
      newAdvisories: 0,
      resolvedAdvisories: 0
    },
    userGrowth: 0,
    advisoryResolutionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primero verificar que el usuario es admin
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

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Obtener total de consultas usando count directamente
      const { count: totalChats, error: chatError } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });

      if (chatError) throw chatError;

      // Obtener los demás conteos
      const [
        { count: totalUsers },
        { count: totalAdvisories },
        { count: pendingAdvisories }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('advisories').select('*', { count: 'exact', head: true }),
        supabase.from('advisories').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Obtener conteos semanales
      const [
        { data: weeklyUsers },
        { data: weeklyChats },
        { data: weeklyAdvisories },
        { data: weeklyResolvedAdvisories },
        { data: previousWeekUsers }
      ] = await Promise.all([
        supabase.from('profiles')
          .select('id')
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('chat_sessions')
          .select('id')
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('advisories')
          .select('id')
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('advisories')
          .select('id')
          .eq('status', 'reviewed')
          .gte('responded_at', weekAgo.toISOString()),
        supabase.from('profiles')
          .select('id')
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString())
      ]);

      // Calcular estadísticas
      const userGrowth = previousWeekUsers && previousWeekUsers.length > 0
        ? ((weeklyUsers?.length || 0) - previousWeekUsers.length) / previousWeekUsers.length * 100
        : 100;

      const resolvedAdvisories = totalAdvisories - (pendingAdvisories || 0);
      const advisoryResolutionRate = totalAdvisories > 0
        ? (resolvedAdvisories / totalAdvisories) * 100
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalChats: totalChats || 0,
        totalAdvisories: totalAdvisories || 0,
        pendingAdvisories: pendingAdvisories || 0,
        weeklyStats: {
          newUsers: weeklyUsers?.length || 0,
          newChats: weeklyChats?.length || 0,
          newAdvisories: weeklyAdvisories?.length || 0,
          resolvedAdvisories: weeklyResolvedAdvisories?.length || 0
        },
        userGrowth,
        advisoryResolutionRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Estadísticas del Usuario */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Usuarios</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-1">{stats.totalUsers}</h3>
              <div className={`flex items-center text-sm mt-2 ${
                stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.userGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.userGrowth).toFixed(1)}% esta semana
              </div>
            </div>
            <div className="bg-neutral-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-neutral-600" />
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
              <p className="text-sm font-medium text-neutral-600">Total Consultas</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-1">{stats.totalChats}</h3>
              <p className="text-sm text-neutral-500 mt-2">
                +{stats.weeklyStats.newChats} esta semana
              </p>
            </div>
            <div className="bg-neutral-100 p-3 rounded-full">
              <MessageSquare className="h-6 w-6 text-neutral-600" />
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
              <p className="text-sm font-medium text-neutral-600">Total Asesorías</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-1">{stats.totalAdvisories}</h3>
              <p className="text-sm text-neutral-500 mt-2">
                +{stats.weeklyStats.newAdvisories} esta semana
              </p>
            </div>
            <div className="bg-neutral-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-neutral-600" />
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
              <p className="text-sm font-medium text-neutral-600">Asesorías Pendientes</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-1">{stats.pendingAdvisories}</h3>
              <div className="flex items-center text-sm mt-2 text-neutral-500">
                <Clock className="h-4 w-4 mr-1" />
                Requieren atención
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Métricas de Rendimiento
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-600">
                  Tasa de Resolución de Asesorías
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {stats.advisoryResolutionRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.advisoryResolutionRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-600">
                  Crecimiento de Usuarios
                </span>
                <span className={`text-sm font-semibold ${
                  stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    stats.userGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(stats.userGrowth), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Actividad Semanal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Nuevos Usuarios</span>
                <Users className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.weeklyStats.newUsers}
              </p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Nuevas Consultas</span>
                <MessageSquare className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.weeklyStats.newChats}
              </p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Nuevas Asesorías</span>
                <BookOpen className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.weeklyStats.newAdvisories}
              </p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Asesorías Resueltas</span>
                <CheckCircle2 className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.weeklyStats.resolvedAdvisories}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/dashboard/advisories')}
            className="flex items-center p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="bg-yellow-100 p-2 rounded-full mr-4">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-neutral-900">Asesorías Pendientes</h4>
              <p className="text-sm text-neutral-600">
                {stats.pendingAdvisories} requieren atención
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-neutral-900">Gestionar Usuarios</h4>
              <p className="text-sm text-neutral-600">
                {stats.weeklyStats.newUsers} nuevos esta semana
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/dashboard/api-limits')}
            className="flex items-center p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-neutral-900">Límites de API</h4>
              <p className="text-sm text-neutral-600">
                Configurar restricciones
              </p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}