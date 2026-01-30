import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Send, Package, DollarSign } from 'lucide-react';
import { ProductShareCard } from './ProductShareCard';
import { QuickMessageButtons } from './QuickMessageButtons';
import { supabase, Product } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface ChatProps {
  conversationId: string | null;
}

export function Chat({ conversationId }: ChatProps) {
  const { messages, sendMessage, loading } = useMessages(conversationId);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showPriceOffer, setShowPriceOffer] = useState(false);
  const [productForOffer, setProductForOffer] = useState<string | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user || !conversationId) return;

    setSending(true);
    try {
      const created = await sendMessage(messageContent, user.id);
      // notify Pusher server to broadcast the message to other clients
      try {
        await fetch('http://localhost:5000/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: created || { conversation_id: conversationId, sender_id: user.id, content: messageContent },
          }),
        });
      } catch (err) {
        console.error('Failed to notify pusher server:', err);
      }

      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptPrice = async (productId: string, price: number) => {
    if (!user || !conversationId) return;
    const message = `✅ He aceptado el precio de €${price.toFixed(2)} para este producto.`;
    await sendMessage(message, user.id);
  };

  const handleCounterOffer = (productId: string) => {
    setProductForOffer(productId);
    setShowPriceOffer(true);
  };

  const handleSendPriceOffer = async () => {
    if (!user || !conversationId || !productForOffer || !proposedPrice) return;
    const message = `💰 Propongo un precio de €${proposedPrice} para este producto. ¿Qué te parece?`;
    await sendMessage(message, user.id);
    setShowPriceOffer(false);
    setProductForOffer(null);
    setProposedPrice('');
  };

  const handleQuickMessage = async (message: string) => {
    if (!user || !conversationId) return;
    await sendMessage(message, user.id);
  };

  const parseMessage = (msg: any) => {
    try {
      // Check if message contains product data (JSON format)
      if (msg.content.startsWith('{') || msg.content.startsWith('[')) {
        return JSON.parse(msg.content);
      }
    } catch (e) {
      // Not JSON, return as regular message
    }
    return null;
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Selecciona una conversación o crea una nueva
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <QuickMessageButtons onSendMessage={handleQuickMessage} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>{t('chat.noMessages')}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const productData = parseMessage(message);
              const isOwn = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {productData ? (
                    <div className={isOwn ? 'ml-auto' : 'mr-auto'}>
                      <ProductShareCard
                        product={productData.product}
                        quantity={productData.quantity}
                        proposedPrice={productData.proposedPrice}
                        isOwnMessage={isOwn}
                        onAcceptPrice={handleAcceptPrice}
                        onCounterOffer={handleCounterOffer}
                      />
                      <p className="text-xs mt-1 opacity-70 text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        {showPriceOffer && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{t('chat.proposePrice')}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder={`${t('chat.proposedPrice')} (€)`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleSendPriceOffer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {t('chat.send')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPriceOffer(false);
                  setProposedPrice('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                {t('chat.cancel')}
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={t('chat.writeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !messageContent.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
