import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Send, Package, DollarSign, MoreVertical, Reply, Edit2, Trash2, Copy, Forward, Smile, Bell, BellOff } from 'lucide-react';
import { ProductShareCard } from './ProductShareCard';
import { QuickMessageButtons } from './QuickMessageButtons';
import { supabase, Product } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface ChatProps {
  conversationId: string | null;
}

// Función para convertir URLs en enlaces clicables
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function Chat({ conversationId }: ChatProps) {
  const { messages, sendMessage, loading } = useMessages(conversationId);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { permission, requestPermission, showNotification } = useNotifications();
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showPriceOffer, setShowPriceOffer] = useState(false);
  const [productForOffer, setProductForOffer] = useState<string | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousMessagesCount = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detectar nuevos mensajes y mostrar notificación
  useEffect(() => {
    if (messages.length > 0 && previousMessagesCount.current > 0) {
      const newMessages = messages.slice(previousMessagesCount.current);
      
      newMessages.forEach((msg) => {
        // Solo notificar si el mensaje no es propio y las notificaciones están habilitadas
        if (msg.sender_id !== user?.id && notificationsEnabled) {
          showNotification('Nuevo mensaje en NEXUS', {
            body: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content,
            tag: `message-${msg.id}`,
            requireInteraction: false,
          });
        }
      });
    }
    
    previousMessagesCount.current = messages.length;
  }, [messages, user, notificationsEnabled, showNotification]);

  // Solicitar permisos de notificación al montar el componente
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Marcar mensajes como leídos cuando se abre la conversación
  useEffect(() => {
    if (!conversationId || !user) return;

    const markAsRead = async () => {
      try {
        await supabase.rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_reader_id: user.id
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();

    // Escuchar cambios en typing_status
    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.user_id !== user.id) {
            setOtherUserTyping(payload.new.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      typingChannel.unsubscribe();
    };
  }, [conversationId, user]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
    setSelectedMessage(null);
  };

  const handleEdit = (message: any) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
    setSelectedMessage(null);
  };

  const handleDelete = async (messageId: string, deleteForEveryone: boolean) => {
    if (!confirm(`¿Eliminar mensaje ${deleteForEveryone ? 'para todos' : 'para ti'}?`)) return;
    
    // TODO: Implementar lógica de eliminación
    console.log('Delete message:', messageId, 'for everyone:', deleteForEveryone);
    setSelectedMessage(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessage(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    // TODO: Implementar lógica de reacciones
    console.log('React to message:', messageId, 'with emoji:', emoji);
    setSelectedMessage(null);
  };

  const saveEditedMessage = async () => {
    if (!editContent.trim() || !editingMessage) return;
    
    // TODO: Implementar lógica para editar mensaje
    console.log('Edit message:', editingMessage, 'new content:', editContent);
    setEditingMessage(null);
    setEditContent('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user || !conversationId) return;

    setSending(true);
    
    // Detener estado de "escribiendo" al enviar
    updateTypingStatus(false);
    
    const content = messageContent;
    setMessageContent(''); // Limpiar input inmediatamente para mejor UX
    
    try {
      const created = await sendMessage(content, user.id);
      
      // El mensaje aparecerá automáticamente gracias a la suscripción de Supabase Realtime
      // en useMessages (useChat.ts líneas 99-103)
      // Ya no es necesario actualizar el estado manualmente
      
      // notify Pusher server to broadcast the message to other clients (opcional para notificaciones)
      try {
        await fetch('http://localhost:5000/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: created || { conversation_id: conversationId, sender_id: user.id, content },
          }),
        });
      } catch (err) {
        console.error('Failed to notify pusher server:', err);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restaurar el contenido si falla
      setMessageContent(content);
    } finally {
      setSending(false);
    }
  };

  // Actualizar estado de "escribiendo"
  const updateTypingStatus = async (typing: boolean) => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from('typing_status')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: typing,
          updated_at: new Date().toISOString()
        }, { onConflict: 'conversation_id,user_id' });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Manejar cambios en el input para detectar escritura
  const handleInputChange = (value: string) => {
    setMessageContent(value);

    // Actualizar estado de typing
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      updateTypingStatus(false);
    }

    // Reset timeout para detener typing después de 3 segundos de inactividad
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        updateTypingStatus(false);
      }, 3000);
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
      {/* Mini header con botón de notificaciones */}
      <div className="border-b border-gray-100 px-4 py-2 flex justify-end">
        <button
          onClick={() => {
            if (permission === 'granted') {
              setNotificationsEnabled(!notificationsEnabled);
            } else {
              requestPermission().then((granted) => {
                if (granted) setNotificationsEnabled(true);
              });
            }
          }}
          className={`p-2 rounded-lg transition ${
            notificationsEnabled && permission === 'granted'
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={
            permission === 'denied'
              ? 'Notificaciones bloqueadas. Habilítalas en la configuración del navegador'
              : notificationsEnabled
              ? 'Desactivar notificaciones'
              : 'Activar notificaciones'
          }
        >
          {notificationsEnabled && permission === 'granted' ? (
            <Bell size={18} />
          ) : (
            <BellOff size={18} />
          )}
        </button>
      </div>
      
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
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
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
                        {message.edited && <span className="ml-2 italic">(editado)</span>}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Respuesta citada */}
                      {message.reply_to_id && (
                        <div className="text-xs bg-gray-100 border-l-2 border-blue-500 px-2 py-1 mb-1 rounded">
                          <span className="text-gray-600">Respondiendo a un mensaje</span>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{linkifyText(message.content)}</p>
                        
                        {/* Reacciones */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.reactions.map((reaction: any, idx: number) => (
                              <span key={idx} className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                          {new Date(message.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.edited && <span className="ml-2 italic">(editado)</span>}
                          {isOwn && message.read_at && (
                            <span className="text-blue-500" title={`Visto ${new Date(message.read_at).toLocaleString()}`}>
                              ✓✓
                            </span>
                          )}
                          {isOwn && !message.read_at && (
                            <span className="text-gray-400">✓</span>
                          )}
                        </p>
                      </div>

                      {/* Menú contextual del mensaje */}
                      <button
                        onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                      >
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>

                      {selectedMessage === message.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleReply(message)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Reply size={16} />
                            Responder
                          </button>
                          <button
                            onClick={() => handleReact(message.id, '👍')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Smile size={16} />
                            Reaccionar
                          </button>
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Copy size={16} />
                            Copiar
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => handleEdit(message)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(message.id, true)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Eliminar para todos
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(message.id, false)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Eliminar para mí
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Indicador de "escribiendo..." */}
        {otherUserTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>Escribiendo...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        {/* Mensaje de respuesta */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Respondiendo a:</p>
              <p className="text-sm text-gray-800 truncate">{replyingTo.content}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modo edición */}
        {editingMessage && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Edit2 size={18} className="text-yellow-600" />
              <span className="text-sm font-semibold text-gray-900">Editando mensaje</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={saveEditedMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setEditContent('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('chat.writeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={sending || editingMessage !== null}
          />
          <button
            type="submit"
            disabled={sending || !messageContent.trim() || editingMessage !== null}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
