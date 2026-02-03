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
      // If we have a logged-in user, fetch conversations where they are customer OR provider
      let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
      if (user?.id) {
        // use .or to filter by either customer_id or provider_id equal to current user
        query = supabase
          .from('conversations')
          .select('*')
          .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Error loading conversations');
    } finally {
      setLoading(false);
    }
  }

  return { conversations, loading, error, loadConversations, newConversationId, clearNewConversation: () => setNewConversationId(null) };
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
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('📎 Subiendo archivo:', {
        nombre: file.name,
        tipo: file.type,
        extension: fileExt,
        tamano: file.size
      });

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

      const fileType = getFileType(file.type, file.name);
      
      console.log('✅ Archivo subido:', {
        url: publicUrl,
        tipo_detectado: fileType
      });

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: fileType
      };
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }

  function getFileType(mimeType: string, fileName: string): 'image' | 'video' | 'document' {
    // Obtener extensión del archivo
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Detectar por extensión primero (más confiable para archivos móviles)
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'm4v', '3gp'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    
    if (ext && videoExtensions.includes(ext)) {
      console.log(`🎥 Detectado como video por extensión: .${ext}`);
      return 'video';
    }
    
    if (ext && imageExtensions.includes(ext)) {
      console.log(`🖼️ Detectado como imagen por extensión: .${ext}`);
      return 'image';
    }
    
    // Fallback: detectar por MIME type
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    
    console.log(`📄 Detectado como documento: ${ext || mimeType}`);
    return 'document';
  }

  async function sendMessage(
    content: string, 
    senderId: string, 
    attachment?: { url: string; name: string; size: number; type: string }
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
