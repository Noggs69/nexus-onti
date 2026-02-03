import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Send, Package, DollarSign, MoreVertical, Reply, Edit2, Trash2, Copy, Forward, Smile, Bell, BellOff, Paperclip, X, Image as ImageIcon, Film, File } from 'lucide-react';
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
  const { messages, sendMessage, uploadFile, loading } = useMessages(conversationId);
  const { user, profile } = useAuth();
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
  const [conversation, setConversation] = useState<any>(null);
  
  // Estados para archivos adjuntos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para lightbox/modal de imágenes
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousMessagesCount = useRef(0);

  // Verificar si el proveedor puede responder en esta conversación
  const isProvider = profile?.role === 'provider';
  const canRespond = !isProvider || !conversation || conversation.provider_id === user?.id || !conversation.provider_id;
  const isTakenByOther = isProvider && conversation && conversation.provider_id && conversation.provider_id !== user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar información de la conversación actual
  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    const loadConversation = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      setConversation(data);
    };

    loadConversation();

    // Suscribirse a cambios en la conversación
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          setConversation(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

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

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 50MB.');
      return;
    }

    setSelectedFile(file);

    // Crear preview para imágenes y videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Cancelar archivo seleccionado
  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (file.type.startsWith('video/')) return <Film className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && !selectedFile) || !user || !conversationId) return;

    setSending(true);
    setUploading(!!selectedFile);
    
    // Detener estado de "escribiendo" al enviar
    updateTypingStatus(false);
    
    const content = messageContent || (selectedFile ? '📎 Archivo adjunto' : '');
    setMessageContent(''); // Limpiar input inmediatamente para mejor UX
    
    try {
      let attachment;

      // Si hay archivo, subirlo primero
      if (selectedFile && uploadFile) {
        try {
          attachment = await uploadFile(selectedFile, user.id);
        } catch (error) {
          console.error('Error uploading file:', error);
          alert('Error al subir el archivo. Intenta de nuevo.');
          setSending(false);
          setUploading(false);
          setMessageContent(content);
          return;
        }
      }

      // Enviar mensaje con o sin adjunto
      const created = await sendMessage(content, user.id, attachment, profile || undefined);
      
      // Limpiar archivo seleccionado
      handleCancelFile();
      
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
      setUploading(false);
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
    await sendMessage(message, user.id, undefined, profile || undefined);
  };

  const handleCounterOffer = (productId: string) => {
    setProductForOffer(productId);
    setShowPriceOffer(true);
  };

  const handleSendPriceOffer = async () => {
    if (!user || !conversationId || !productForOffer || !proposedPrice) return;
    const message = `💰 Propongo un precio de €${proposedPrice} para este producto. ¿Qué te parece?`;
    await sendMessage(message, user.id, undefined, profile || undefined);
    setShowPriceOffer(false);
    setProductForOffer(null);
    setProposedPrice('');
  };

  const handleQuickMessage = async (message: string) => {
    if (!user || !conversationId) return;
    await sendMessage(message, user.id, undefined, profile || undefined);
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
                        {/* Archivo adjunto */}
                        {message.attachment_url && (
                          <div className="mb-2">
                            {message.attachment_type === 'image' ? (
                              <img
                                src={message.attachment_url}
                                alt={message.attachment_name || 'Imagen'}
                                className="rounded-lg max-w-full max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxImage(message.attachment_url!)}
                              />
                            ) : message.attachment_type === 'video' ? (
                              <video
                                src={message.attachment_url}
                                controls
                                className="rounded-lg max-w-full max-h-64"
                              >
                                Tu navegador no soporta video.
                              </video>
                            ) : (
                              <a
                                href={message.attachment_url}
                                download={message.attachment_name}
                                className={`flex items-center gap-2 p-3 rounded ${
                                  isOwn ? 'bg-blue-700' : 'bg-gray-300'
                                } hover:opacity-80 transition-opacity`}
                              >
                                <File className="w-6 h-6" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {message.attachment_name || 'Documento'}
                                  </p>
                                  {message.attachment_size && (
                                    <p className="text-xs opacity-70">
                                      {formatFileSize(message.attachment_size)}
                                    </p>
                                  )}
                                </div>
                              </a>
                            )}
                          </div>
                        )}
                        
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{linkifyText(message.content)}</p>
                        )}
                        
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
        
        {/* Preview del archivo seleccionado */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {filePreview ? (
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={filePreview} className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                    {getFileIcon(selectedFile)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  {uploading && (
                    <p className="text-xs text-blue-600 mt-1">Subiendo archivo...</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelFile}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
        
        {/* Mostrar alerta si la conversación está tomada por otro proveedor */}
        {isTakenByOther && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Esta conversación está siendo atendida por otro proveedor
            </p>
            <p className="text-xs text-amber-600 mt-1">
              No puedes responder en esta conversación
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {/* Input oculto para archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Botón de adjuntar archivos */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading || editingMessage !== null || !canRespond}
            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            title="Adjuntar archivo"
          >
            <Paperclip size={18} />
          </button>
          
          <input
            type="text"
            value={messageContent}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={!canRespond ? "No puedes responder aquí" : t('chat.writeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={sending || uploading || editingMessage !== null || !canRespond}
          />
          <button
            type="submit"
            disabled={sending || uploading || (!messageContent.trim() && !selectedFile) || editingMessage !== null || !canRespond}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>

      {/* Lightbox para imágenes */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            title="Cerrar"
          >
            <X size={32} />
          </button>
          <img
            src={lightboxImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <a
              href={lightboxImage}
              download
              className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
