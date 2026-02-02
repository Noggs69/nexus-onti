import { useEffect, useState } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      // Verificar si la ventana está en foco
      if (document.hidden) {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        // Cerrar notificación después de 5 segundos
        setTimeout(() => notification.close(), 5000);

        // Manejar click en la notificación
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
}
