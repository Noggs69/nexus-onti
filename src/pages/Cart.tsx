import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { Product, supabase } from '../lib/supabase';
import { Trash2, ShoppingCart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotal } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);

  const handleContactProvider = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSharing(true);
    try {
      // Get or create a conversation with the provider (assuming there's a default provider)
      // First, get the provider user ID (you might need to adjust this based on your setup)
      const { data: providers } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      let conversationId = null;

      if (providers && providers.length > 0) {
        const providerId = providers[0].id;

        // Check if conversation exists
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
          .limit(1)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Create new conversation
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              customer_id: user.id,
              provider_id: providerId,
              status: 'active',
            })
            .select('id')
            .single();

          conversationId = newConv?.id;
        }

        // Send cart items as a message
        if (conversationId) {
          const cartSummary = items.map(item => {
            const product = item.product as unknown as Product;
            return `- ${product.name} x${item.quantity} - €${(product.price * item.quantity).toFixed(2)}`;
          }).join('\n');

          const totalAmount = getTotal();
          const message = `${t('chat.interestedProducts')}\n\n${cartSummary}\n\n${t('chat.estimatedTotal')}: €${totalAmount.toFixed(2)}\n\n${t('chat.negotiateQuestion')}`;

          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id,
              content: message,
            });
        }
      }

      navigate('/chat');
    } catch (error) {
      console.error('Error sharing cart:', error);
    } finally {
      setSharing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h1>
            <p className="text-gray-600 mb-8">{t('cart.emptySubtitle')}</p>
            <Link
              to="/products"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotal();
  const shipping = subtotal > 0 ? 0 : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">{t('cart.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const product = item.product as unknown as Product;
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product?.image_url || ''}
                        alt={product?.name || 'Product'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <Link to={`/products/€{product?.slug}`} className="hover:text-blue-600">
                        <h3 className="font-semibold text-gray-900">{product?.name}</h3>
                      </Link>
                      <p className="text-lg font-bold text-blue-600">
                        €{(product?.price || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              to="/products"
              className="inline-block mt-8 text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← {t('cart.continueShopping')}
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('cart.summary')}</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.shipping')}</span>
                  <span className="text-green-600 font-semibold">{t('cart.shippingFree')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.tax')}</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">{t('cart.total')}</span>
                <span className="text-2xl font-bold text-blue-600">€{total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleContactProvider}
                disabled={sharing}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{sharing ? t('contact.sending') : t('cart.contactProvider')}</span>
              </button>

              <p className="text-sm text-gray-600 text-center mt-4">
                {t('cart.contactMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
