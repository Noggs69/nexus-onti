import React from 'react';
import { Product } from '../lib/supabase';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProductShareCardProps {
  product: Product;
  quantity: number;
  proposedPrice?: number;
  isOwnMessage?: boolean;
  onAcceptPrice?: (productId: string, price: number) => void;
  onCounterOffer?: (productId: string) => void;
}

export function ProductShareCard({ 
  product, 
  quantity, 
  proposedPrice, 
  isOwnMessage,
  onAcceptPrice,
  onCounterOffer 
}: ProductShareCardProps) {
  const { t } = useLanguage();
  const totalPrice = (proposedPrice || product.price) * quantity;
  const hasPriceProposal = proposedPrice && proposedPrice !== product.price;

  return (
    <div className={`border rounded-lg p-3 ${isOwnMessage ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} max-w-sm`}>
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={product.image_url || ''}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{t('cart.quantity')}: {quantity}</p>
          
          {hasPriceProposal ? (
            <div className="mt-2">
              <p className="text-xs text-gray-500 line-through">
                {t('chat.originalPrice')}: €{product.price.toFixed(2)}
              </p>
              <p className="text-sm font-bold text-green-600">
                {t('chat.proposedPrice')}: €{proposedPrice.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900 mt-2">
              €{product.price.toFixed(2)} c/u
            </p>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm font-bold text-gray-900">
              Total: €{totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!isOwnMessage && hasPriceProposal && onAcceptPrice && onCounterOffer && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onAcceptPrice(product.id, proposedPrice)}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
          >
            {t('chat.acceptPrice')}
          </button>
          <button
            onClick={() => onCounterOffer(product.id)}
            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition"
          >
            {t('chat.counterOffer')}
          </button>
        </div>
      )}
    </div>
  );
}
