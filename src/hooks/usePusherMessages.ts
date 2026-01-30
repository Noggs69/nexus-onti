import { useEffect } from 'react';
import pusher, { channelName } from '../lib/pusher';

type MessageHandler = (message: any) => void;

export default function usePusherMessages(conversationId: string | null, onMessage: MessageHandler) {
  useEffect(() => {
    if (!conversationId) return;

    const chName = channelName(conversationId);
    const channel = pusher.subscribe(chName);

    const handler = (data: any) => {
      try {
        onMessage(data);
      } catch (e) {
        // swallow handler errors
        // eslint-disable-next-line no-console
        console.error('usePusherMessages handler error:', e);
      }
    };

    channel.bind('new-message', handler);

    return () => {
      channel.unbind('new-message', handler);
      try {
        pusher.unsubscribe(chName);
      } catch (e) {
        // ignore
      }
    };
  }, [conversationId, onMessage]);
}
