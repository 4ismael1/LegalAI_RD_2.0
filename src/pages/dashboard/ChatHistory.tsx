import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar, Search, ArrowRight, AlertCircle, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/lib/database.types';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];

export function ChatHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadChatHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setChatHistory(data || []);
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('No se pudo cargar el historial. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllHistory = async () => {
    if (!user) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase.rpc('delete_user_chat_history', {
        user_id_param: user.id
      });

      if (deleteError) throw deleteError;

      setChatHistory([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting chat history:', err);
      setError('No se pudo eliminar el historial. Por favor, intenta de nuevo más tarde.');
    } finally {
      setDeleting(false);
    }
  };

  const startNewChat = () => {
    navigate('/dashboard/chat');
  };

  const continueChat = (sessionId: string) => {
    navigate('/dashboard/chat', { state: { sessionId } });
  };

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const retryLoad = () => {
    setLoading(true);
    loadChatHistory();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            Historial de Consultas
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={startNewChat}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Chat
            </Button>
            {chatHistory.length > 0 && (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Eliminar Historial
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en el historial..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-neutral-600">
            <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-4" />
            Cargando historial...
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={retryLoad} variant="secondary">
              Intentar de nuevo
            </Button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            {searchTerm ? 'No se encontraron consultas' : 'No hay consultas en el historial'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => continueChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-neutral-400 mr-2" />
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {chat.title}
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(chat.created_at)}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-neutral-500">
                    Última actualización: {formatTime(chat.updated_at)}
                  </div>
                  <Button variant="ghost" className="text-neutral-900">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">Eliminar Historial</h2>
            <p className="text-neutral-600 mb-6">
              ¿Estás seguro que deseas eliminar todo el historial de chat? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={deleteAllHistory}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar Todo'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}