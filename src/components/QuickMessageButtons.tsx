import React from 'react';
import { MessageCircle, TrendingDown, Package, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface QuickMessageButtonsProps {
  onSendMessage: (message: string) => void;
}

export function QuickMessageButtons({ onSendMessage }: QuickMessageButtonsProps) {
  const { t } = useLanguage();
  
  const quickMessages = [
    { icon: TrendingDown, text: t('chat.betterPrice'), color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { icon: Package, text: t('chat.availability'), color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { icon: Truck, text: t('chat.shippingCost'), color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { icon: MessageCircle, text: t('chat.customOrders'), color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b border-gray-200">
      <span className="text-xs text-gray-600 w-full mb-1">{t('chat.quickMessages')}</span>
      {quickMessages.map((msg, index) => (
        <button
          key={index}
          onClick={() => onSendMessage(msg.text)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${msg.color}`}
        >
          <msg.icon size={14} />
          {msg.text}
        </button>
      ))}
    </div>
  );
}
