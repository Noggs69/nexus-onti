import React, { useState } from 'react';
import { ConversationsList } from '../components/ConversationsList';
import { Chat } from '../components/Chat';
import { CreateQuote } from '../components/CreateQuote';
import { QuoteView } from '../components/QuoteView';
import { ChatSearch } from '../components/ChatSearch';
import { ChatSecurity } from '../components/ChatSecurity';
import { useQuotes } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Search, Shield, ArrowLeft, Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showQuotes, setShowQuotes] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const { quotes } = useQuotes(selectedConversationId);
  const { profile } = useAuth();
  const { t } = useLanguage();

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setShowConversationsList(false); // Ocultar lista en móvil al seleccionar
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setShowConversationsList(true);
  };

  const isProvider = profile?.role === 'provider';

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Lista de conversaciones */}
      <div className={`${
        showConversationsList ? 'flex' : 'hidden'
      } md:flex w-full md:w-80 flex-col border-r border-gray-200`}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="md:w-7 md:h-7" />
            <h1 className="text-xl md:text-2xl font-bold">{t('chat.title')}</h1>
          </div>
        </div>
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Área de chat */}
      <div className={`${
        !showConversationsList || selectedConversationId ? 'flex' : 'hidden'
      } md:flex flex-1 flex-col min-w-0`}>
        {selectedConversationId ? (
          <>
            {/* Header del chat */}
            <div className="border-b border-gray-200 p-3 md:p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Botón volver en móvil */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                  {t('chat.conversation')}
                </h2>
                {isProvider && quotes.length > 0 && (
                  <button
                    onClick={() => setShowQuotes(!showQuotes)}
                    className="hidden md:block text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition whitespace-nowrap"
                  >
                    {t('chat.quotes')} ({quotes.length})
                  </button>
                )}
              </div>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Buscar"
                >
                  <Search size={18} className="md:w-5 md:h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowSecurity(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Seguridad"
                >
                  <Shield size={18} className="md:w-5 md:h-5 text-gray-600" />
                </button>
                {isProvider && (
                  <>
                    <button
                      onClick={() => setShowCreateQuote(true)}
                      className="hidden md:block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap"
                    >
                      {t('chat.createQuote')}
                    </button>
                    <button
                      onClick={() => setShowCreateQuote(true)}
                      className="md:hidden p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      title={t('chat.createQuote')}
                    >
                      <Menu size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Contenido del chat */}
            <div className="flex-1 flex gap-0 overflow-hidden">
              <div className="flex-1 min-w-0">
                <Chat conversationId={selectedConversationId} />
              </div>
              
              {/* Paneles laterales - ocultos en móvil excepto cuando están activos */}
              {showCreateQuote && (
                <div className="absolute md:relative inset-0 md:inset-auto md:w-96 border-l border-gray-200 bg-white overflow-y-auto z-20">
                  <CreateQuote
                    conversationId={selectedConversationId}
                    onClose={() => setShowCreateQuote(false)}
                  />
                </div>
              )}
              {isProvider && showQuotes && !showCreateQuote && !showSearch && (
                <div className="hidden md:block w-96 border-l border-gray-200 bg-white overflow-y-auto p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('chat.quotes')}</h3>
                  <QuoteView quotes={quotes} />
                </div>
              )}
              {showSearch && !showCreateQuote && (
                <div className="absolute md:relative inset-0 md:inset-auto md:w-80 z-20">
                  <ChatSearch
                    conversationId={selectedConversationId}
                    onClose={() => setShowSearch(false)}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 p-4">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">{t('chat.selectConversation')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de seguridad */}
      {showSecurity && selectedConversationId && (
        <ChatSecurity
          conversationId={selectedConversationId}
          onClose={() => setShowSecurity(false)}
        />
      )}
    </div>
  );
}
