import { useState, useEffect } from 'react';
import { supabase, Message, Conversation, Quote } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import usePusherMessages from './usePusherMessages';
import pusher from '../lib/pusher';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newConversationId, setNewConversationId] = useState<string | null>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    loadConversations();
    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    // Escuchar nuevas conversaciones en tiempo real para proveedores
    if (profile?.role === 'provider' && user?.id) {
      const providerChannel = pusher.subscribe(`provider-${user.id}`);
      providerChannel.bind('new-conversation', (data: { conversationId: string }) => {
        setNewConversationId(data.conversationId);
        loadConversations();
      });

      return () => {
        subscription.unsubscribe();
        providerChannel.unbind('new-conversation');
        pusher.unsubscribe(`provider-${user.id}`);
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, profile?.role]);

  async function loadConversations() {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          product:products!conversations_product_id_fkey(
            id,
            name,
            image_url
          ),
          customer:profiles!conversations_customer_id_fkey(
            id,
            full_name
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (user?.id) {
        if (profile?.role === 'provider') {
          // Los proveedores ven TODAS las conversaciones:
          // 1. Sin asignar (provider_id IS NULL)
          // 2. Asignadas a ellos (provider_id = su_id)
          // 3. Asignadas a otros (para que vean que están tomadas)
          // No filtramos por provider_id - ven todo
        } else {
          // Los clientes solo ven sus propias conversaciones
          query = query.eq('customer_id', user.id);
        }
      }

      const { data, error: err } = await query;

      if (err) throw err;
      
      // Enriquecer con email del cliente desde la función
      const enrichedData = await Promise.all(
        (data || []).map(async (conv) => {
          if (conv.customer_id) {
            const { data: emailData } = await supabase
              .rpc('get_user_email', { user_id: conv.customer_id });
            
            return {
              ...conv,
              customer: {
                ...conv.customer,
                email: emailData || 'Sin email'
              }
            };
          }
          return conv;
        })
      );
      
      setConversations(enrichedData || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Error loading conversations');
    } finally {
      setLoading(false);
    }
  }

  async function claimConversation(conversationId: string) {
    if (!user?.id || profile?.role !== 'provider') return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ provider_id: user.id })
        .eq('id', conversationId)
        .is('provider_id', null); // Solo si aún no está asignada

      if (error) throw error;
      await loadConversations(); // Recargar lista
    } catch (err) {
      console.error('Error claiming conversation:', err);
      throw err;
    }
  }

  return { 
    conversations, 
    loading, 
    error, 
    loadConversations, 
    claimConversation,
    newConversationId, 
    clearNewConversation: () => setNewConversationId(null) 
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to Pusher channel to receive real-time messages pushed via server
  usePusherMessages(conversationId, (msg: any) => {
    setMessages((prev) => {
      try {
        if (!msg) return prev;
        // avoid duplicates when Supabase realtime also delivers the same insert
        if ((msg as any).id && prev.some((m) => m.id === (msg as any).id)) return prev;
        return [...prev, msg as Message];
      } catch (e) {
        return prev;
      }
    });
  });

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    loadMessages();
    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  async function loadMessages() {
    if (!conversationId) return;
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File, userId: string) {
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: getFileType(file.type)
      };
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }

  function getFileType(mimeType: string): 'image' | 'video' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  async function sendMessage(
    content: string, 
    senderId: string, 
    attachment?: { url: string; name: string; size: number; type: string },
    userProfile?: { role: string }
  ) {
    if (!conversationId) return;
    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      };

      // Agregar información del archivo adjunto si existe
      if (attachment) {
        messageData.attachment_url = attachment.url;
        messageData.attachment_type = attachment.type;
        messageData.attachment_name = attachment.name;
        messageData.attachment_size = attachment.size;
      }

      const { data, error: err } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*')
        .single();

      if (err) throw err;
      return data as Message;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }

  return { messages, loading, sendMessage, uploadFile };
}

export function useQuotes(conversationId: string | null) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    loadQuotes();
    
    // Suscripción en tiempo real para nuevas cotizaciones
    const subscription = supabase
      .channel(`quotes-${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'quotes', 
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        setQuotes(prev => [payload.new as Quote, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'quotes', 
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        setQuotes(prev => prev.map(q => q.id === payload.new.id ? payload.new as Quote : q));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  async function loadQuotes() {
    if (!conversationId) return;
    try {
      const { data, error: err } = await supabase
        .from('quotes')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setQuotes(data || []);
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  }

  return { quotes, loading, loadQuotes };
}
