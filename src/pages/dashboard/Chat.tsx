import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, Bot, User as UserIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { createThread, sendMessage } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { APILimits } from '@/lib/api';
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
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      try {
        setError(null);
        setLoadingChat(false);
        const existingSessionId = location.state?.sessionId;

        // Load API limits
        const stats = await APILimits.getDailyStats(user.id);
        setDailyStats(stats);
        setApiLimitReached(stats.remaining <= 0);

        // Only clear messages if no session ID is provided
        if (!existingSessionId) {
          setMessages([]);
        }

        if (existingSessionId) {
          await loadExistingChat(existingSessionId);
        } else {
          const thread = await createThread();
          setThreadId(thread.id);
          setSessionId(null);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Error al iniciar el chat. Por favor, intenta de nuevo.');
      } finally {
        setInitializing(false);
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
        navigate('/dashboard/chat', { replace: true, state: {} });
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

  if (initializing) {
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
          {loadingChat && (
            <div className="flex justify-center py-4">
              <div className="flex items-center text-neutral-600">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Cargando mensajes...
              </div>
            </div>
          )}
          <div className="max-w-3xl mx-auto py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-neutral-900 text-white p-6 rounded-full mb-6">
                  <Bot className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Asistente Legal AI
                </h2>
                <p className="text-neutral-600 mb-8 max-w-md">
                  Estoy aquí para ayudarte con tus consultas legales. Puedes preguntarme sobre leyes, procedimientos y trámites en la República Dominicana.
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
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start max-w-[80%] group ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}>
                      <div className={`flex-shrink-0 ${
                        message.role === 'user' ? 'ml-3' : 'mr-3'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-neutral-900 text-white' 
                            : 'bg-neutral-100'
                        }`}>
                          {message.role === 'user' ? (
                            <UserIcon className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div
                        className={`relative rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <div className="prose max-w-none text-white">
                            {message.content}
                          </div>
                        ) : (
                          <div className="prose max-w-none prose-neutral prose-p:leading-normal prose-headings:mt-4 prose-headings:mb-2">
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
                      className="flex justify-start"
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="bg-neutral-100 text-neutral-900 rounded-2xl px-4 py-3">
                          <div className="flex space-x-2">
                            <motion.span
                              animate={{
                                opacity: [0, 1, 0],
                                transition: { duration: 1.5, repeat: Infinity }
                              }}
                            >
                              •
                            </motion.span>
                            <motion.span
                              animate={{
                                opacity: [0, 1, 0],
                                transition: { duration: 1.5, repeat: Infinity, delay: 0.2 }
                              }}
                            >
                              •
                            </motion.span>
                            <motion.span
                              animate={{
                                opacity: [0, 1, 0],
                                transition: { duration: 1.5, repeat: Infinity, delay: 0.4 }
                              }}
                            >
                              •
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
    </div>
  );
}