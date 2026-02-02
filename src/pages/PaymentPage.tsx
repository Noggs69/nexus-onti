import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, CreditCard, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuoteItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string;
}

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const totalParam = searchParams.get('total');
  
  const [quote, setQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<(QuoteItem & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      loadQuoteDetails();
    } else {
      setLoading(false);
    }
  }, [quoteId]);

  const loadQuoteDetails = async () => {
    try {
      console.log('Loading quote with ID:', quoteId); // Debug
      
      // Cargar datos de la cotización sin .single() para evitar error 406
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId);

      console.log('Quote query result:', { quoteData, quoteError }); // Debug

      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        throw quoteError;
      }

      if (!quoteData || quoteData.length === 0) {
        console.warn('No quote found with ID:', quoteId);
        return;
      }

      const quote = quoteData[0];
      console.log('Quote data loaded:', quote); // Debug
      setQuote(quote);

      // Cargar items de la cotización
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);

      console.log('Quote items loaded:', itemsData); // Debug

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        throw itemsError;
      }

      // Cargar detalles de productos
      const itemsWithProducts = await Promise.all(
        (itemsData || []).map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('id, name, image_url')
            .eq('id', item.product_id);
          
          return { ...item, product: product?.[0] };
        })
      );

      console.log('Items with products:', itemsWithProducts); // Debug
      setQuoteItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    window.location.href = 'https://paypal.me/nachomolla';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Resumen de Pago</h1>
                <p className="text-blue-100">Revisa tu pedido antes de pagar</p>
              </div>
              <ShoppingBag size={40} className="opacity-80" />
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {quote && quoteItems.length > 0 ? (
              <>
                {/* Información del cliente */}
                {(quote.customer_name || quote.customer_email) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h2>
                    {quote.customer_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-semibold text-gray-900">{quote.customer_name}</span>
                      </div>
                    )}
                    {quote.customer_email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-700">{quote.customer_email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Productos */}
                <div className="space-y-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos a Comprar</h2>
                  {quoteItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.product?.name || 'Producto'}</h3>
                        <p className="text-gray-600 mt-1">Cantidad: {item.quantity} unidad{item.quantity > 1 ? 'es' : ''}</p>
                        <p className="text-gray-600">Precio unitario: €{item.unit_price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">€{item.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dirección de envío */}
                {quote.shipping_address && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">📦 Dirección de Envío</h3>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{quote.customer_name}</p>
                      <p className="text-gray-700">{quote.shipping_address}</p>
                      <p className="text-gray-700">
                        {quote.shipping_city}, {quote.shipping_postal_code}
                      </p>
                      <p className="text-gray-700">{quote.shipping_country}</p>
                    </div>
                  </div>
                )}

                {/* Resumen de precios */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>€{quote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span>€{quote.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>€{quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {totalParam ? (
                    <>Total a pagar: <span className="font-bold text-xl">€{totalParam}</span></>
                  ) : (
                    'No se encontraron detalles de la cotización'
                  )}
                </p>
              </div>
            )}

            {/* Botón de pago */}
            <button
              onClick={handlePayment}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <CreditCard size={24} />
              Pagar con PayPal
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Serás redirigido a PayPal para completar tu pago de forma segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
