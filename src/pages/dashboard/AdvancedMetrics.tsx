import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BarChart2,
  Crown, 
  AlertCircle, 
  Clock, 
  Scale,
  BookOpen,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MessageSquare
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

// Define legal categories and their keywords
const legalCategories = {
  'Derecho Laboral': [
    'despido', 'prestaciones', 'indemnización', 'liquidación', 'contrato de trabajo',
    'salario', 'horas extras', 'seguridad social', 'ars', 'afp', 'sindicato',
    'reinstalación', 'renuncia', 'permiso laboral', 'jornada laboral', 'vacaciones',
    'licencia de maternidad', 'licencia de paternidad'
  ],
  'Derecho Familiar': [
    'divorcio', 'pensión alimenticia', 'custodia', 'régimen de visitas', 'filiación',
    'tutela', 'adopción', 'separación de bienes', 'bienes gananciales', 'concubinato',
    'unión libre', 'herencia', 'testamento', 'partición de bienes', 'violencia intrafamiliar'
  ],
  'Derecho Penal': [
    'robo', 'hurto', 'estafa', 'homicidio', 'feminicidio', 'violación', 'agresión',
    'amenaza', 'abuso sexual', 'corrupción', 'lavado de activos', 'narcotráfico',
    'secuestro', 'delito informático', 'acoso', 'fraude', 'extorsión'
  ],
  'Derecho Civil': [
    'contrato', 'arrendamiento', 'propiedad', 'usufructo', 'préstamo', 'hipoteca',
    'inquilinato', 'responsabilidad civil', 'seguro', 'daños y perjuicios', 'notaría',
    'sucesión'
  ],
  'Derecho Mercantil': [
    'sociedad anónima', 'eirl', 'accionistas', 'estatutos sociales', 'capital social',
    'quiebra', 'concurso de acreedores', 'fusión', 'empresa', 'factura', 'tasa de interés',
    'leasing', 'contrato mercantil', 'pagaré'
  ],
  'Derecho Administrativo': [
    'permiso', 'licencia', 'multa', 'impuesto', 'contratación pública', 'licitación',
    'funcionario', 'acto administrativo', 'derecho de petición', 'procedimiento administrativo',
    'expropiación'
  ],
  'Derecho Constitucional': [
    'derechos fundamentales', 'habeas corpus', 'amparo', 'constitución', 'nacionalidad',
    'ciudadanía', 'referéndum', 'libertad de expresión', 'estado de emergencia'
  ],
  'Derecho Inmobiliario': [
    'título de propiedad', 'deslinde', 'venta de inmueble', 'hipoteca', 'inquilinato',
    'alquiler', 'contrato de compraventa', 'arrendamiento', 'permuta', 'evicción'
  ],
  'Derecho Tributario': [
    'impuesto sobre la renta', 'itbis', 'declaración jurada', 'evasión fiscal',
    'auditoría', 'exención fiscal', 'tasa aduanera', 'retención'
  ],
  'Derecho Internacional': [
    'extradición', 'tratado', 'visado', 'naturalización', 'asilo', 'migración',
    'convenio internacional', 'conflicto de leyes'
  ]
};

type MetricsData = {
  users: {
    total: number;
    free: number;
    plus: number;
    pendingDowngrade: number;
    weeklyGrowth: number;
  };
  consultations: {
    total: number;
    byCategory: {
      category: string;
      count: number;
      percentage: number;
    }[];
    topKeywords: {
      keyword: string;
      count: number;
    }[];
    weeklyTotal: number;
    weeklyGrowth: number;
  };
  weeklyStats: {
    newUsers: number;
  };
};

export function AdvancedMetrics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedChart, setSelectedChart] = useState<'users' | 'consultations' | 'categories'>('users');

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

      loadMetrics();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user metrics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role, pending_downgrade, created_at');
      
      if (profilesError) throw profilesError;

      // Calculate user metrics
      const userMetrics = {
        total: profiles.length,
        free: profiles.filter(p => p.role === 'user').length,
        plus: profiles.filter(p => p.role === 'plus').length,
        pendingDowngrade: profiles.filter(p => p.pending_downgrade).length,
        weeklyGrowth: 0
      };

      // Calculate weekly growth
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsers = profiles.filter(p => new Date(p.created_at) >= weekAgo).length;
      userMetrics.weeklyGrowth = (newUsers / userMetrics.total) * 100;

      // Load chat messages for consultation analysis
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('role', 'user');

      if (messagesError) throw messagesError;

      // Initialize category and keyword counters
      const categoryCount = new Map<string, number>();
      const keywordCount = new Map<string, number>();

      // Process each message
      messages.forEach(message => {
        const content = message.content.toLowerCase();

        // Check each category and its keywords
        Object.entries(legalCategories).forEach(([category, keywords]) => {
          let categoryMatched = false;
          
          keywords.forEach(keyword => {
            if (content.includes(keyword.toLowerCase())) {
              keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
              categoryMatched = true;
            }
          });

          if (categoryMatched) {
            categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
          }
        });
      });

      // Calculate weekly metrics for consultations
      const weeklyMessages = messages.filter(m => new Date(m.created_at) >= weekAgo).length;
      const previousWeekMessages = messages.filter(
        m => {
          const date = new Date(m.created_at);
          return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
        }
      ).length;

      const weeklyGrowth = previousWeekMessages === 0 
        ? 100 
        : ((weeklyMessages - previousWeekMessages) / previousWeekMessages) * 100;

      // Prepare consultation metrics
      const totalConsultations = messages.length;
      const consultationMetrics = {
        total: totalConsultations,
        byCategory: Array.from(categoryCount.entries())
          .map(([category, count]) => ({
            category,
            count,
            percentage: (count / totalConsultations) * 100
          }))
          .sort((a, b) => b.count - a.count),
        topKeywords: Array.from(keywordCount.entries())
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        weeklyTotal: weeklyMessages,
        weeklyGrowth
      };

      setMetrics({
        users: userMetrics,
        consultations: consultationMetrics,
        weeklyStats: {
          newUsers
        }
      });

    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Error al cargar las métricas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
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
        <Button onClick={loadMetrics} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  // Chart configurations
  const userGrowthData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Nuevos Usuarios',
        data: [
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7,
          metrics.weeklyStats.newUsers / 7
        ],
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const consultationsByCategory = {
    labels: metrics.consultations.byCategory.map(cat => cat.category),
    datasets: [
      {
        label: 'Consultas por Categoría',
        data: metrics.consultations.byCategory.map(cat => cat.count),
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(14, 165, 233)',
          'rgb(249, 115, 22)',
          'rgb(139, 92, 246)',
          'rgb(20, 184, 166)'
        ],
        borderWidth: 0
      }
    ]
  };

  const keywordTrendsData = {
    labels: metrics.consultations.topKeywords.map(kw => kw.keyword),
    datasets: [
      {
        label: 'Menciones',
        data: metrics.consultations.topKeywords.map(kw => kw.count),
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(14, 165, 233)',
          'rgb(249, 115, 22)',
          'rgb(139, 92, 246)',
          'rgb(20, 184, 166)'
        ],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 5
        },
        grid: {
          display: false
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    },
    cutout: '75%'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">
          Panel de Métricas
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={selectedChart === 'users' ? 'default' : 'ghost'}
              onClick={() => setSelectedChart('users')}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Button>
            <Button
              variant={selectedChart === 'consultations' ? 'default' : 'ghost'}
              onClick={() => setSelectedChart('consultations')}
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Consultas
            </Button>
            <Button
              variant={selectedChart === 'categories' ? 'default' : 'ghost'}
              onClick={() => setSelectedChart('categories')}
              size="sm"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Categorías
            </Button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant={timeRange === 'day' ? 'default' : 'ghost'}
          onClick={() => setTimeRange('day')}
          size="sm"
        >
          Día
        </Button>
        <Button
          variant={timeRange === 'week' ? 'default' : 'ghost'}
          onClick={() => setTimeRange('week')}
          size="sm"
        >
          Semana
        </Button>
        <Button
          variant={timeRange === 'month' ? 'default' : 'ghost'}
          onClick={() => setTimeRange('month')}
          size="sm"
        >
          Mes
        </Button>
        <Button
          variant={timeRange === 'year' ? 'default' : 'ghost'}
          onClick={() => setTimeRange('year')}
          size="sm"
        >
          Año
        </Button>
      </div>
      {/* Charts Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {selectedChart === 'users' && (
          <>
            <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Métricas de Usuarios
            </h3>
            
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Total Usuarios</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.users.total}</h4>
                  </div>
                  <div className={`flex items-center text-sm ${
                    metrics.users.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.users.weeklyGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(metrics.users.weeklyGrowth).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Usuarios Plus</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.users.plus}</h4>
                  </div>
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Usuarios Gratuitos</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.users.free}</h4>
                  </div>
                  <Users className="h-5 w-5 text-neutral-400" />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Pendientes de Cancelación</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.users.pendingDowngrade}</h4>
                  </div>
                  <Clock className="h-5 w-5 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* User Distribution Chart */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div className="h-[300px]">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4">Distribución de Usuarios</h4>
                <Doughnut 
                  data={{
                    labels: ['Usuarios Plus', 'Usuarios Gratuitos'],
                    datasets: [{
                      data: [metrics.users.plus, metrics.users.free],
                      backgroundColor: [
                        'rgb(234, 179, 8)',
                        'rgb(59, 130, 246)'
                      ],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      }
                    },
                    cutout: '70%'
                  }}
                />
              </div>

              <div className="h-[300px]">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4">Crecimiento de Usuarios</h4>
                <Line data={userGrowthData} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {selectedChart === 'consultations' && (
          <>
            <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Métricas de Consultas
            </h3>
            
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Total Consultas</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.consultations.total}</h4>
                  </div>
                  <div className={`flex items-center text-sm ${
                    metrics.consultations.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.consultations.weeklyGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(metrics.consultations.weeklyGrowth).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Consultas esta semana</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">{metrics.consultations.weeklyTotal}</h4>
                  </div>
                  <Activity className="h-5 w-5 text-neutral-400" />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Promedio Diario</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">
                      {Math.round(metrics.consultations.weeklyTotal / 7)}
                    </h4>
                  </div>
                  <Scale className="h-5 w-5 text-neutral-400" />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Categorías Activas</p>
                    <h4 className="text-2xl font-bold text-neutral-900 mt-1">
                      {metrics.consultations.byCategory.length}
                    </h4>
                  </div>
                  <BookOpen className="h-5 w-5 text-neutral-400" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 h-[300px]">
              <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center justify-between">
                <span>Tendencias de Palabras Clave</span>
              </h4>
              <div className="h-[300px] mt-8">
                <Bar data={keywordTrendsData} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {selectedChart === 'categories' && (
          <>
            <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Análisis por Categorías
            </h3>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center justify-between">
                  <span>Distribución de Consultas</span>
                  <div className="flex gap-2">
                    <Button
                      variant={timeRange === 'month' ? 'default' : 'ghost'}
                      onClick={() => setTimeRange('month')}
                      size="sm"
                    >
                      Mes
                    </Button>
                    <Button
                      variant={timeRange === 'year' ? 'default' : 'ghost'}
                      onClick={() => setTimeRange('year')}
                      size="sm"
                    >
                      Año
                    </Button>
                  </div>
                </h4>
                <div className="h-[300px]">
                  <Doughnut data={consultationsByCategory} options={doughnutOptions} />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center justify-between">
                  <span>Detalles por Categoría</span>
                  <div className="flex gap-2">
                    <Button
                      variant={timeRange === 'month' ? 'default' : 'ghost'}
                      onClick={() => setTimeRange('month')}
                      size="sm"
                    >
                      Mes
                    </Button>
                    <Button
                      variant={timeRange === 'year' ? 'default' : 'ghost'}
                      onClick={() => setTimeRange('year')}
                      size="sm"
                    >
                      Año
                    </Button>
                  </div>
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {metrics.consultations.byCategory.map((category) => (
                    <div
                      key={category.category}
                      className="bg-neutral-50 p-3 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-neutral-900">{category.category}</h5>
                        <span className="text-sm text-neutral-600">
                          {category.count} consultas
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-1.5">
                        <div
                          className="bg-neutral-900 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-neutral-500 mt-2">
                        {category.percentage.toFixed(1)}% del total
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}