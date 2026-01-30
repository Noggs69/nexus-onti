import React, { useState } from 'react';
import { ConversationsList } from '../components/ConversationsList';
import { Chat } from '../components/Chat';
import { CreateQuote } from '../components/CreateQuote';
import { QuoteView } from '../components/QuoteView';
import { useQuotes } from '../hooks/useChat';
import { MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showQuotes, setShowQuotes] = useState(true);
  const { quotes } = useQuotes(selectedConversationId);
  const { t } = useLanguage();

  return (
    <div className="flex h-screen bg-white">
      <div className="w-80 flex flex-col border-r border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center gap-3">
            <MessageSquare size={28} />
            <h1 className="text-2xl font-bold">{t('chat.title')}</h1>
          </div>
        </div>
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <h2 className="font-semibold text-gray-900">{t('chat.conversation')}</h2>
                {quotes.length > 0 && (
                  <button
                    onClick={() => setShowQuotes(!showQuotes)}
                    className="text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition"
                  >
                    {t('chat.quotes')} ({quotes.length})
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowCreateQuote(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
              >
                {t('chat.createQuote')}
              </button>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <Chat conversationId={selectedConversationId} />
              </div>
              {showCreateQuote && (
                <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
                  <CreateQuote
                    conversationId={selectedConversationId}
                    onClose={() => setShowCreateQuote(false)}
                  />
                </div>
              )}
              {showQuotes && !showCreateQuote && (
                <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('chat.quotes')}</h3>
                  <QuoteView quotes={quotes} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('chat.selectConversation')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
