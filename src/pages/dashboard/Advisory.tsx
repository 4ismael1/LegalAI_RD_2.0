import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Send, FileText, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database.types';

type Advisory = Database['public']['Tables']['advisories']['Row'];

export function Advisory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadAdvisories();
    }
  }, [user]);

  const loadAdvisories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advisories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdvisories(data || []);
    } catch (error) {
      console.error('Error loading advisories:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar las asesorías'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSending(true);
    setMessage(null);

    try {
      const { error: dbError } = await supabase
        .from('advisories')
        .insert([{
          user_id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          subject: formData.subject,
          description: formData.description,
          status: 'pending'
        }]);

      if (dbError) throw dbError;
      
      setMessage({
        type: 'success',
        text: 'Solicitud de asesoría enviada exitosamente'
      });
      
      setFormData({
        fullName: '',
        email: '',
        subject: '',
        description: ''
      });

      loadAdvisories();
    } catch (error) {
      console.error('Error submitting advisory:', error);
      setMessage({
        type: 'error',
        text: 'Error al enviar la solicitud. Por favor, intenta de nuevo.'
      });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Solicitar Asesoría Legal
        </h2>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <Send className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Asunto
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Historial de Asesorías
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-4" />
            <p className="text-neutral-600">Cargando asesorías...</p>
          </div>
        ) : advisories.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <p>No hay asesorías solicitadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {advisories.map((advisory) => (
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
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    advisory.status === 'reviewed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {advisory.status === 'reviewed' ? 'Revisada' : 'Pendiente'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-neutral-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(advisory.created_at)}
                  </div>
                  
                  {advisory.status === 'reviewed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAdvisory(advisory)}
                      className="text-neutral-900"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ver Respuesta
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedAdvisory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Respuesta a tu Consulta</h2>
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
              <h3 className="font-medium text-neutral-900">Tu Consulta</h3>
              <p className="text-neutral-600">{selectedAdvisory.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-neutral-900">Respuesta</h3>
              <div className="mt-2 p-4 bg-neutral-50 rounded-lg">
                <p className="text-neutral-800 whitespace-pre-wrap">
                  {selectedAdvisory.response}
                </p>
              </div>
            </div>

            <div className="text-sm text-neutral-500">
              Respondido el {formatDate(selectedAdvisory.responded_at || '')}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}