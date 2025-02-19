import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { APILimits } from '@/lib/api';

type Limit = {
  role: 'user' | 'admin' | 'plus';
  daily_message_limit: number;
};

export function AdminAPILimits() {
  const [limits, setLimits] = useState<Limit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('api_limits')
        .select('role, daily_message_limit')
        .order('role');

      if (error) throw error;
      setLimits(data || []);
    } catch (error) {
      console.error('Error loading API limits:', error);
      setError('Error al cargar los límites de API');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (role: 'user' | 'admin' | 'plus', newLimit: number) => {
    try {
      setSaving(true);
      setMessage(null);

      await APILimits.updateLimit(role, newLimit);
      
      setMessage({
        type: 'success',
        text: `Límite actualizado exitosamente para ${getRoleName(role)}`
      });
      
      await loadLimits();
    } catch (error) {
      console.error('Error updating limit:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el límite'
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'user':
        return 'Usuarios Gratuitos';
      case 'admin':
        return 'Administradores';
      case 'plus':
        return 'Usuarios Plus';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full mb-4" />
          <p className="text-neutral-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
        <p className="text-neutral-600 text-center mb-4">{error}</p>
        <Button onClick={loadLimits} className="flex items-center">
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
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-neutral-900 mr-2" />
            <h2 className="text-2xl font-bold text-neutral-900">
              Configuración de API
            </h2>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
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

        <div className="space-y-6">
          {limits.map((limit) => (
            <div
              key={limit.role}
              className="bg-neutral-50 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 capitalize">
                {getRoleName(limit.role)}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Límite de Mensajes Diarios
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      value={limit.daily_message_limit}
                      onChange={(e) => {
                        const newLimits = limits.map(l => 
                          l.role === limit.role 
                            ? { ...l, daily_message_limit: parseInt(e.target.value) }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-32 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <Button
                      onClick={() => handleUpdateLimit(limit.role, limit.daily_message_limit)}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}