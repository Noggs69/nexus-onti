import React, { useState } from 'react';
import { X, AlertTriangle, Shield, Clock, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatSecurityProps {
  conversationId: string;
  onClose: () => void;
}

export function ChatSecurity({ conversationId, onClose }: ChatSecurityProps) {
  const [activeModal, setActiveModal] = useState<'main' | 'block' | 'report' | 'temporary'>('main');
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [temporaryDuration, setTemporaryDuration] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!confirm('¿Estás seguro de que quieres bloquear esta conversación?')) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // TODO: Llamar a la función toggle_block_conversation
      const { error } = await supabase.rpc('toggle_block_conversation', {
        conv_id: conversationId,
        user_id: user.id,
        block: true
      });

      if (error) throw error;
      
      alert('Conversación bloqueada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error blocking conversation:', error);
      alert('Error al bloquear la conversación');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportDescription.trim()) {
      alert('Por favor describe el motivo de la denuncia');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase.from('conversation_reports').insert({
        conversation_id: conversationId,
        reported_by: user.id,
        reason: reportReason,
        description: reportDescription
      });

      if (error) throw error;

      alert('Denuncia enviada exitosamente. Nuestro equipo la revisará.');
      setActiveModal('main');
      setReportDescription('');
    } catch (error) {
      console.error('Error reporting conversation:', error);
      alert('Error al enviar la denuncia');
    } finally {
      setLoading(false);
    }
  };

  const handleTemporaryMessages = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ temporary_messages_duration: parseInt(temporaryDuration) })
        .eq('id', conversationId);

      if (error) throw error;

      alert(`Mensajes temporales activados. Se eliminarán después de ${temporaryDuration} horas.`);
      setActiveModal('main');
    } catch (error) {
      console.error('Error setting temporary messages:', error);
      alert('Error al configurar mensajes temporales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {activeModal === 'main' && (
          <>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield size={24} className="text-blue-600" />
                Seguridad y Privacidad
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => setActiveModal('temporary')}
                className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition flex items-start gap-3"
              >
                <Clock size={20} className="text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Mensajes Temporales</h3>
                  <p className="text-sm text-gray-600">Los mensajes se eliminarán automáticamente</p>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('report')}
                className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition flex items-start gap-3"
              >
                <AlertTriangle size={20} className="text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Reportar</h3>
                  <p className="text-sm text-gray-600">Denunciar comportamiento inapropiado</p>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('block')}
                className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition flex items-start gap-3"
              >
                <Lock size={20} className="text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Bloquear Conversación</h3>
                  <p className="text-sm text-gray-600">Impedir nuevos mensajes</p>
                </div>
              </button>
            </div>
          </>
        )}

        {activeModal === 'block' && (
          <>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Bloquear Conversación</h2>
              <button
                onClick={() => setActiveModal('main')}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Al bloquear esta conversación, el otro usuario no podrá enviarte más mensajes.
                Podrás desbloquearla en cualquier momento.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBlock}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                >
                  {loading ? 'Bloqueando...' : 'Bloquear'}
                </button>
                <button
                  onClick={() => setActiveModal('main')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {activeModal === 'report' && (
          <>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reportar Conversación</h2>
              <button
                onClick={() => setActiveModal('main')}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la denuncia
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Acoso</option>
                  <option value="inappropriate">Contenido inapropiado</option>
                  <option value="scam">Estafa</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (obligatorio)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe el problema..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReport}
                  disabled={loading || !reportDescription.trim()}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                >
                  {loading ? 'Enviando...' : 'Enviar Denuncia'}
                </button>
                <button
                  onClick={() => setActiveModal('main')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {activeModal === 'temporary' && (
          <>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Mensajes Temporales</h2>
              <button
                onClick={() => setActiveModal('main')}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Los mensajes se eliminarán automáticamente después del tiempo seleccionado.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (horas)
                </label>
                <select
                  value={temporaryDuration}
                  onChange={(e) => setTemporaryDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="1">1 hora</option>
                  <option value="6">6 horas</option>
                  <option value="24">24 horas</option>
                  <option value="168">7 días</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTemporaryMessages}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                >
                  {loading ? 'Activando...' : 'Activar'}
                </button>
                <button
                  onClick={() => setActiveModal('main')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
