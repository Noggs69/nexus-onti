import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../hooks/useChat';
import { Plus } from 'lucide-react';

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

export function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const navigate = useNavigate();
  const { conversations, loading } = useConversations();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/contact')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          Nueva Conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-2">No hay conversaciones</p>
            <p className="text-xs">Haz clic en "Nueva Conversación" para empezar</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-left p-4 border-b border-gray-200 transition ${
                selectedConversationId === conversation.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <p className="font-medium text-sm text-gray-900">
                {conversation.status === 'active' ? 'Conversación Activa' : 'Conversación'}
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
            </button>
          ))
        )}
      </div>
    </div>
  );
}
