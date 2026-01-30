import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Order, OrderItem, Product } from '../lib/supabase';
import { Check, ShoppingCart } from 'lucide-react';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    try {
      if (!orderId) return;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
        <Link to="/products" className="text-blue-600 hover:text-blue-700 font-semibold">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg mb-4">Thank you for your purchase</p>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="font-mono font-bold text-gray-900">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Total</p>
                <p className="text-xl font-bold text-blue-600">€{order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              {items.map((item) => {
                const product = item.product as unknown as Product;
                return (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{product?.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">€{item.price_at_purchase.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>€{(order.total_amount - order.tax_amount - order.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>€{order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="text-blue-600">€{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">What's next?</h3>
            <ul className="space-y-2 text-left text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>We'll prepare your order for shipment</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>You'll get tracking info within 24 hours</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/account"
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Order Details
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
