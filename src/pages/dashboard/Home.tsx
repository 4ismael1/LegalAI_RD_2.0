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
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatCount, setChatCount] = useState(0);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    try {
      // Get chat count
      const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setChatCount(count || 0);

      // Get last session (excluding current)
      const { data: sessions } = await supabase.auth
        .getUser();

      if (sessions?.user?.last_sign_in_at) {
        setLastLogin(sessions.user.last_sign_in_at);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setLoading(false);
    }
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

  const services = [
    {
      title: 'Consultas Legales IA',
      description: 'Obtén respuestas instantáneas a tus dudas legales con nuestro asistente de IA especializado en derecho dominicano.',
      icon: MessageSquare
    },
    {
      title: 'Biblioteca de Leyes',
      description: 'Accede a una extensa colección de leyes, códigos y normativas de la República Dominicana, actualizadas y comentadas.',
      icon: BookOpen
    },
    {
      title: 'Historial y Seguimiento',
      description: 'Mantén un registro detallado de todas tus consultas legales y su evolución en el tiempo.',
      icon: Clock
    },
    {
      title: 'Asesoría Especializada',
      description: 'Conecta con expertos legales para casos que requieran atención personalizada.',
      icon: Users
    }
  ];

  const featuredLaws = [
    {
      title: 'Código Civil',
      description: 'Base fundamental del derecho privado que regula las relaciones entre particulares.',
      icon: Scale
    },
    {
      title: 'Código de Trabajo',
      description: 'Marco legal que regula las relaciones laborales y los derechos de los trabajadores.',
      icon: Shield
    },
    {
      title: 'Código Penal',
      description: 'Normativa que define los delitos y sus correspondientes sanciones.',
      icon: Gavel
    }
  ];

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
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Consultas</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-1">{chatCount}</h3>
            </div>
            <MessageSquare className="h-8 w-8 text-neutral-400" />
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4 justify-between"
            onClick={() => navigate('/dashboard/history')}
          >
            Ver historial <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Último Acceso</p>
              <h3 className="text-lg font-semibold text-neutral-900 mt-1">
                {lastLogin ? formatDate(lastLogin) : 'N/A'}
              </h3>
            </div>
            <Calendar className="h-8 w-8 text-neutral-400" />
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
              <p className="text-sm font-medium text-neutral-600">Cuenta Creada</p>
              <h3 className="text-lg font-semibold text-neutral-900 mt-1">
                {user?.created_at ? formatDate(user.created_at) : 'N/A'}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-neutral-400" />
          </div>
        </motion.div>
      </div>

      {/* Servicios */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">
          Nuestros Servicios
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <service.icon className="h-8 w-8 text-neutral-700 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-neutral-600">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leyes Destacadas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">
          Leyes Destacadas
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredLaws.map((law, index) => (
            <motion.div
              key={law.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              <law.icon className="h-8 w-8 text-neutral-700 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {law.title}
              </h3>
              <p className="text-sm text-neutral-600">
                {law.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}