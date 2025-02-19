import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, Clock, User, MessageSquare, AlertCircle, Search, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Advisory = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subject: string;
  description: string;
  status: 'pending' | 'reviewed';
  response: string | null;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
};

export function AdminAdvisories() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadAdvisories();
  }, [user, navigate]); 

  const loadAdvisories = async () => {
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
        .from('advisories')
        .select('*')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdvisories(data || []);
    } catch (error) {
      console.error('Error loading advisories:', error);
      setError('Error al cargar las asesorías. Por favor, verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedAdvisory || !response.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('advisories')
        .update({
          status: 'reviewed',
          response: response,
          responded_at: new Date().toISOString(),
          responded_by: user?.id
        })
        .eq('id', selectedAdvisory.id);

      if (error) throw error;

      setSelectedAdvisory(null);
      setResponse('');
      await loadAdvisories();
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Error al enviar la respuesta. Por favor, intenta de nuevo.');
    } finally {
      setSending(false);
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

  const filteredAdvisories = advisories.filter(advisory => 
    advisory.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisory.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = filteredAdvisories.filter(a => a.status === 'pending').length;
  const reviewedCount = filteredAdvisories.filter(a => a.status === 'reviewed').length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
        <p className="text-neutral-600 text-center mb-4">{error}</p>
        <Button onClick={loadAdvisories} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Gestión de Asesorías
          </h2>
          <div className="relative w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario o correo..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-4" />
            <p className="text-neutral-600">Cargando asesorías...</p>
          </div>
        ) : filteredAdvisories.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <p>No se encontraron asesorías</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Advisories Section */}
            {pendingCount > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Asesorías Pendientes</h3>
                  <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-sm">
                    {pendingCount}
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredAdvisories
                    .filter(advisory => advisory.status === 'pending')
                    .map((advisory) => (
                      <div
                        key={advisory.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {advisory.subject}
                            </h3>
                            <p className="text-neutral-600 text-sm mt-1">
                              {advisory.description}
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                            Pendiente
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center text-neutral-500">
                              <User className="h-4 w-4 mr-1" />
                              {advisory.full_name}
                            </div>
                            <div className="flex items-center text-neutral-500">
                              <Mail className="h-4 w-4 mr-1" />
                              {advisory.email}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-neutral-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(advisory.created_at)}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAdvisory(advisory);
                                setResponse('');
                              }}
                            >
                              Responder
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Reviewed Advisories Section */}
            {reviewedCount > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Asesorías Respondidas</h3>
                  <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm">
                    {reviewedCount}
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredAdvisories
                    .filter(advisory => advisory.status === 'reviewed')
                    .map((advisory) => (
                      <div
                        key={advisory.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {advisory.subject}
                            </h3>
                            <p className="text-neutral-600 text-sm mt-1">
                              {advisory.description}
                            </p>
                          </div>
                          <div className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                            Revisada
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center text-neutral-500">
                              <User className="h-4 w-4 mr-1" />
                              {advisory.full_name}
                            </div>
                            <div className="flex items-center text-neutral-500">
                              <Mail className="h-4 w-4 mr-1" />
                              {advisory.email}
                            </div>
                          </div>
                          <div className="flex items-center text-neutral-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(advisory.created_at)}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <h4 className="font-medium text-neutral-900 mb-2">Respuesta:</h4>
                          <p className="text-neutral-600">{advisory.response}</p>
                          <div className="text-sm text-neutral-500 mt-2">
                            Respondido el {formatDate(advisory.responded_at!)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Respuesta */}
      {selectedAdvisory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Responder Asesoría</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAdvisory(null)}
              >
                ×
              </Button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-neutral-900">Asunto</h3>
              <p className="text-neutral-600">{selectedAdvisory.subject}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-neutral-900">Consulta</h3>
              <p className="text-neutral-600">{selectedAdvisory.description}</p>
            </div>

            <div className="mb-4">
              <label className="block font-medium text-neutral-900 mb-2">
                Tu Respuesta
              </label>
              <textarea
                rows={6}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                placeholder="Escribe tu respuesta aquí..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedAdvisory(null)}
                disabled={sending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={sending || !response.trim()}
              >
                {sending ? 'Enviando...' : 'Enviar Respuesta'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}