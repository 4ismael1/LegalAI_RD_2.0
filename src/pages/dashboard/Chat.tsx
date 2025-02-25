import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, Bot, User as UserIcon, Sparkles, AlertCircle, Info, X } from 'lucide-react';
import { createThread, sendMessage } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { APILimits } from '@/lib/api';
import { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiLimitReached, setApiLimitReached] = useState(false);
  const [dailyStats, setDailyStats] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);
  const [showExperimentalInfo, setShowExperimentalInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      try {
        setLoadingChat(true);
        setError(null);
        const existingSessionId = location.state?.sessionId;

        // Load API limits
        const stats = await APILimits.getDailyStats(user.id);
        setDailyStats(stats);
        setApiLimitReached(stats.remaining <= 0);

        if (existingSessionId) {
          await loadExistingChat(existingSessionId);
        } else {
          const thread = await createThread();
          setThreadId(thread.id);
          setSessionId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Error al iniciar el chat. Por favor, intenta de nuevo.');
      } finally {
        setLoadingChat(false);
      }
    };

    initChat();
  }, [user, location.state?.sessionId]);

  const loadExistingChat = async (sessionId: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (session.user_id !== user?.id) {
        throw new Error('No tienes permiso para acceder a esta conversación');
      }

      setSessionId(session.id);
      setThreadId(session.thread_id);

      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role,content,created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        throw new Error('No se encontraron mensajes para esta conversación');
      }

      setMessages(messages.map(({ role, content }) => ({ role, content })));
    } catch (error) {
      console.error('Error loading chat:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar la conversación');
      setTimeout(() => {
        navigate('/dashboard', { replace: true, state: {} });
      }, 2000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || loading || !user) return;

    try {
      // Check API limits
      const canSend = await APILimits.canSendMessage(user.id);
      if (!canSend) {
        setApiLimitReached(true);
        return;
      }

      const userMessage = input.trim();
      setInput('');
      setLoading(true);
      setError(null);

      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert([{
            user_id: user.id,
            title: userMessage.length > 50 ? userMessage.substring(0, 47) + '...' : userMessage,
            thread_id: threadId
          }])
          .select()
          .single();

        if (sessionError) throw sessionError;
        currentSessionId = session.id;
        setSessionId(session.id);
        navigate('/dashboard/chat', { state: { sessionId: session.id }, replace: true });
      }

      const newUserMessage = { role: 'user' as const, content: userMessage };
      setMessages(prev => [...prev, newUserMessage]);
      
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentSessionId,
          ...newUserMessage
        }]);

      if (messageError) throw messageError;

      // Increment message count
      await APILimits.incrementMessageCount(user.id);

      const response = await sendMessage(threadId, userMessage);
      
      const assistantMessage = { role: 'assistant' as const, content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      const { error: assistantMessageError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentSessionId,
          ...assistantMessage
        }]);

      if (assistantMessageError) throw assistantMessageError;

      // Update daily stats
      const stats = await APILimits.getDailyStats(user.id);
      setDailyStats(stats);
      setApiLimitReached(stats.remaining <= 0);

    } catch (error) {
      console.error('Error in chat:', error);
      setError('Error al procesar tu mensaje. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingChat) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 animate-spin">
              <div className="h-full w-full rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="h-8 w-8 text-neutral-900" />
            </div>
          </div>
          <p className="text-neutral-600 font-medium">Iniciando chat legal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-neutral-50 to-white">
      {error && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm">
            {error}
          </div>
        </div>
      )}

      {dailyStats && (
        <div className="bg-white border-b border-neutral-200 p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              Mensajes restantes hoy: <span className="font-semibold">{dailyStats.remaining}</span>
              <span className="mx-2">•</span>
              Utilizados: <span className="font-semibold">{dailyStats.used}</span>
              <span className="mx-2">•</span>
              Límite diario: <span className="font-semibold">{dailyStats.limit}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-neutral-900 text-white p-6 rounded-full mb-6">
                  <Bot className="h-12 w-12" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Asistente Legal AI
                  </h2>
                  <button
                    onClick={() => setShowExperimentalInfo(true)}
                    className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 hover:bg-yellow-200 transition-colors"
                  >
                    <Info className="h-3 w-3" />
                    Experimental
                  </button>
                </div>
                <p className="text-neutral-600 mb-8 max-w-md">
                 Este asistente de inteligencia artificial está en fase experimental y puede cometer errores. Verifica siempre la información proporcionada con fuentes oficiales.
                </p>
                <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
                  {[
                    "¿Cuáles son mis derechos laborales?",
                    "¿Cómo puedo registrar una empresa?",
                    "¿Qué documentos necesito para divorciarme?",
                    "¿Cómo funciona el proceso de herencia?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="text-left p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                    >
                      <Sparkles className="h-5 w-5 text-neutral-400 mb-2" />
                      <span className="text-neutral-900">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`flex items-start max-w-[80%] group ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}>
                      <div className={`flex-shrink-0 ${
                        message.role === 'user' ? 'ml-3' : 'mr-3'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          message.role === 'user' 
                            ? 'bg-neutral-900 text-white' 
                            : 'bg-neutral-100 group-hover:bg-neutral-200'
                        }`}>
                          {message.role === 'user' ? (
                            <UserIcon className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div
                        className={`relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                          message.role === 'user'
                            ? 'bg-neutral-900 text-white group-hover:shadow-md'
                            : 'bg-neutral-100 group-hover:bg-neutral-50 group-hover:shadow-md'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <div className="prose max-w-none text-white">
                            {message.content}
                          </div>
                        ) : (
                          <div className="prose-chat">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-start group"
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3 transition-colors group-hover:bg-neutral-200">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="bg-neutral-100 text-neutral-900 rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 group-hover:bg-neutral-50 group-hover:shadow-md">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-neutral-400 rounded-full"
                                  animate={{
                                    scale: [0.5, 1, 0.5],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="text-sm text-neutral-500"
                            >
                              LegalAI está analizando tu consulta
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-none bg-white border-t border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {apiLimitReached ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>
                Has alcanzado el límite de mensajes diarios. Por favor, intenta de nuevo mañana.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta legal aquí..."
                className="w-full pl-4 pr-12 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                disabled={loading}
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          )}
        </div>
      </div>
      
      {/* Experimental Info Modal */}
      <AnimatePresence>
        {showExperimentalInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Info className="h-5 w-5 text-yellow-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Asistente Experimental
                  </h3>
                </div>
                <button
                  onClick={() => setShowExperimentalInfo(false)}
                  className="text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="prose max-w-none text-neutral-600">
                <p>
                  Este asistente de inteligencia artificial está en fase experimental y puede cometer errores. 
                  Por favor, ten en cuenta las siguientes consideraciones:
                </p>
                
                <ul className="space-y-2 mt-4">
                  <li>Las respuestas son generadas automáticamente y pueden no ser 100% precisas.</li>
                  <li>Siempre verifica la información proporcionada con fuentes oficiales.</li>
                  <li>No tomes decisiones legales importantes basándote únicamente en las respuestas del asistente.</li>
                  <li>Para casos complejos, te recomendamos solicitar asesoría legal profesional.</li>
                </ul>
                
                <p className="mt-4">
                  Estamos trabajando constantemente para mejorar la precisión y utilidad del asistente.
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowExperimentalInfo(false)}
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  Entendido
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
