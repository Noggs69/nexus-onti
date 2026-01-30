import Pusher from 'pusher-js';

const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;

export function channelName(conversationId: string) {
  return `chat-${conversationId}`;
}

let pusher: any = null;

if (!key) {
  // Guard: if VITE_PUSHER_KEY is missing, export a safe no-op-like object
  // to avoid the runtime error "You must pass your app key when you instantiate Pusher.".
  // Also log a friendly warning for developers.
  // The no-op provides minimal methods used by the hook: subscribe, unsubscribe.
  // In production you should set VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER in your env.
  // eslint-disable-next-line no-console
  console.warn('VITE_PUSHER_KEY is not set — Pusher will be disabled in the client.');

  pusher = {
    subscribe: (_channelName: string) => ({
      bind: (_event: string, _handler: any) => {},
      unbind: (_event: string, _handler: any) => {},
    }),
    unsubscribe: (_channelName: string) => {},
    disconnect: () => {},
  };
} else {
  pusher = new Pusher(key, {
    cluster: cluster || 'eu',
    forceTLS: true,
  });
}

export default pusher;
