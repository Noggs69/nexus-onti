import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../hooks/useChat';
import { Plus, MoreVertical, Pin, Archive, Volume2, VolumeX, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

export function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const navigate = useNavigate();
  const { conversations, loading, loadConversations, claimConversation, newConversationId, clearNewConversation } = useConversations();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [claimingConversation, setClaimingConversation] = useState<string | null>(null);

  const isProvider = profile?.role === 'provider';

  // Auto-seleccionar nueva conversación para proveedores
  useEffect(() => {
    if (newConversationId && !selectedConversationId) {
      onSelectConversation(newConversationId);
      clearNewConversation();
    }
  }, [newConversationId, selectedConversationId]);

  const handlePinConversation = async (conversationId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ pinned: !isPinned })
        .eq('id', conversationId);

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error pinning conversation:', error);
      alert('Error al fijar la conversación');
    } finally {
      setActionLoading(false);
      setMenuOpen(null);
    }
  };

  const handleMuteConversation = async (conversationId: string, isMuted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const mutedUntil = isMuted ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
      
      const { error } = await supabase
        .from('conversations')
        .update({ muted_until: mutedUntil })
        .eq('id', conversationId);

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error muting conversation:', error);
      alert('Error al silenciar la conversación');
    } finally {
      setActionLoading(false);
      setMenuOpen(null);
    }
  };

  const handleArchiveConversation = async (conversationId: string, isArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ archived: !isArchived })
        .eq('id', conversationId);

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Error al archivar la conversación');
    } finally {
      setActionLoading(false);
      setMenuOpen(null);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación? Se borrarán todos los mensajes.')) {
      setMenuOpen(null);
      return;
    }
    
    setActionLoading(true);
    try {
      // Eliminar la conversación (los mensajes se eliminan en cascada)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      
      // Si era la conversación seleccionada, deseleccionarla
      if (selectedConversationId === conversationId) {
        onSelectConversation(null as any);
      }
      
      // Recargar lista
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error al eliminar la conversación');
    } finally {
      setActionLoading(false);
      setMenuOpen(null);
    }
  };

  const handleMarkAsUnread = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 1 })
        .eq('id', conversationId);

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error marking as unread:', error);
      alert('Error al marcar como no leído');
    } finally {
      setActionLoading(false);
      setMenuOpen(null);
    }
  };

  const handleClaimConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingConversation(conversationId);
    try {
      await claimConversation(conversationId);
      // Una vez tomada, abrir la conversación
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Error claiming conversation:', error);
      alert('Error al tomar la conversación. Es posible que otro proveedor ya la haya tomado.');
      await loadConversations(); // Recargar para ver el estado actualizado
    } finally {
      setClaimingConversation(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {!isProvider && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => navigate('/contact')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            <Plus size={18} />
            Nueva Conversación
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-2">No hay conversaciones</p>
            {!isProvider && (
              <p className="text-xs">Haz clic en "Nueva Conversación" para empezar</p>
            )}
          </div>
        ) : (
          conversations.map((conversation) => {
            const isUnassigned = !conversation.provider_id;
            const isMine = conversation.provider_id === user?.id;
            const isTakenByOther = conversation.provider_id && conversation.provider_id !== user?.id;
            
            return (
            <div
              key={conversation.id}
              className={`relative w-full text-left border-b border-gray-200 transition ${
                selectedConversationId === conversation.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : isTakenByOther ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => {
                  // Solo permitir abrir si es cliente, o proveedor con conversación asignada/sin asignar
                  if (!isProvider || !isTakenByOther) {
                    onSelectConversation(conversation.id);
                  }
                }}
                disabled={isProvider && isTakenByOther}
                className="w-full p-4 pr-12"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Información para proveedores */}
                    {isProvider && conversation.product ? (
                      <div>
                        <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                          {conversation.product.name}
                          {isUnassigned && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-semibold">
                              Disponible
                            </span>
                          )}
                          {isTakenByOther && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-semibold">
                              Tomada por otro
                            </span>
                          )}
                          {conversation.pinned && <Pin size={14} className="text-blue-600" />}
                          {conversation.muted_until && <VolumeX size={14} className="text-gray-400" />}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {conversation.customer?.full_name || 'Cliente'} · {conversation.customer?.email || 'Sin email'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conversation.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ) : (
                      /* Información para clientes */
                      <div>
                        <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                          {conversation.product?.name || 'Consulta general'}
                          {conversation.pinned && <Pin size={14} className="text-blue-600" />}
                          {conversation.muted_until && <VolumeX size={14} className="text-gray-400" />}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conversation.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </button>

              {/* Botón "Tomar conversación" para conversaciones sin asignar */}
              {isProvider && isUnassigned && (
                <div className="px-4 pb-3">
                  <button
                    onClick={(e) => handleClaimConversation(conversation.id, e)}
                    disabled={claimingConversation === conversation.id}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {claimingConversation === conversation.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Tomando...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} />
                        Tomar conversación
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Menú contextual */}
              <div className="absolute right-2 top-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === conversation.id ? null : conversation.id);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <MoreVertical size={16} className="text-gray-600" />
                </button>

                {menuOpen === conversation.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={(e) => handlePinConversation(conversation.id, conversation.pinned || false, e)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      disabled={actionLoading}
                    >
                      <Pin size={16} />
                      {conversation.pinned ? 'Desfijar' : 'Fijar'}
                    </button>
                    <button
                      onClick={(e) => handleMuteConversation(conversation.id, !!conversation.muted_until, e)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      disabled={actionLoading}
                    >
                      {conversation.muted_until ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      {conversation.muted_until ? 'Reactivar' : 'Silenciar'}
                    </button>
                    <button
                      onClick={(e) => handleMarkAsUnread(conversation.id, e)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      disabled={actionLoading}
                    >
                      <MessageSquare size={16} />
                      Marcar como no leído
                    </button>
                    <button
                      onClick={(e) => handleArchiveConversation(conversation.id, conversation.archived || false, e)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      disabled={actionLoading}
                    >
                      <Archive size={16} />
                      {conversation.archived ? 'Desarchivar' : 'Archivar'}
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                      disabled={actionLoading}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
