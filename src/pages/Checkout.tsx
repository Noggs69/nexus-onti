import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AlertCircle, Check } from 'lucide-react';

interface FormData {
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPostal: string;
  shippingCountry: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostal: string;
  billingCountry: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  sameAsBilling: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPostal: '',
    shippingCountry: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostal: '',
    billingCountry: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    sameAsBilling: true,
  });

  const subtotal = getTotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.shippingStreet || !formData.shippingCity || !formData.shippingPostal) {
        setError('Please fill in all shipping address fields');
        return false;
      }
    } else if (step === 2) {
      if (!formData.sameAsBilling) {
        if (!formData.billingStreet || !formData.billingCity || !formData.billingPostal) {
          setError('Please fill in all billing address fields');
          return false;
        }
      }
    } else if (step === 3) {
      if (!formData.cardName || !formData.cardNumber || !formData.cardExpiry || !formData.cardCvc) {
        setError('Please fill in all payment details');
        return false;
      }
      if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Invalid card number');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleCompleteOrder = async () => {
    if (!validateStep() || !user) return;

    setLoading(true);
    try {
      const billingAddressData = formData.sameAsBilling
        ? {
            street: formData.shippingStreet,
            city: formData.shippingCity,
            state: formData.shippingState,
            postal_code: formData.shippingPostal,
            country: formData.shippingCountry,
          }
        : {
            street: formData.billingStreet,
            city: formData.billingCity,
            state: formData.billingState,
            postal_code: formData.billingPostal,
            country: formData.billingCountry,
          };

      const shippingAddressData = {
        street: formData.shippingStreet,
        city: formData.shippingCity,
        state: formData.shippingState,
        postal_code: formData.shippingPostal,
        country: formData.shippingCountry,
      };

      const { data: billingAddr, error: billingError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          type: 'billing',
          ...billingAddressData,
        })
        .select()
        .maybeSingle();

      if (billingError) throw billingError;

      const { data: shippingAddr, error: shippingError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          type: 'shipping',
          ...shippingAddressData,
        })
        .select()
        .maybeSingle();

      if (shippingError) throw shippingError;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'processing',
          total_amount: total,
          tax_amount: tax,
          shipping_cost: 0,
          discount_amount: 0,
          billing_address_id: billingAddr?.id,
          shipping_address_id: shippingAddr?.id,
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

      for (const item of items) {
        const product = (item as any).product;
        const price = product?.price || 0;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: price,
        });
      }

      await clearCart();
      navigate(`/order-confirmation/€{order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white €{
                      step >= 1 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>

                {step === 1 && (
                  <div className="space-y-4 mt-4">
                    <input
                      type="text"
                      name="shippingStreet"
                      placeholder="Street address"
                      value={formData.shippingStreet}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="shippingCity"
                        placeholder="City"
                        value={formData.shippingCity}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="shippingState"
                        placeholder="State"
                        value={formData.shippingState}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="shippingPostal"
                        placeholder="Postal code"
                        value={formData.shippingPostal}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="shippingCountry"
                        placeholder="Country"
                        value={formData.shippingCountry}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white €{
                      step >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    {step > 2 ? <Check className="w-5 h-5" /> : '2'}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Billing Address</h2>
                </div>

                {step === 2 && (
                  <div className="space-y-4 mt-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="sameAsBilling"
                        checked={formData.sameAsBilling}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">Same as shipping address</span>
                    </label>

                    {!formData.sameAsBilling && (
                      <>
                        <input
                          type="text"
                          name="billingStreet"
                          placeholder="Street address"
                          value={formData.billingStreet}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="billingCity"
                            placeholder="City"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="billingState"
                            placeholder="State"
                            value={formData.billingState}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="billingPostal"
                            placeholder="Postal code"
                            value={formData.billingPostal}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="billingCountry"
                            placeholder="Country"
                            value={formData.billingCountry}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white €{
                      step >= 3 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    3
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment</h2>
                </div>

                {step === 3 && (
                  <div className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">
                        For demo purposes, use test card: 4242 4242 4242 4242
                      </p>
                    </div>
                    <input
                      type="text"
                      name="cardName"
                      placeholder="Cardholder name"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card number"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength={19}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="cardCvc"
                        placeholder="CVC"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        maxLength={4}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-3 ml-auto bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={loading}
                    className="px-6 py-3 ml-auto bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Complete Order'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">€{total.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm">Items</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>{((item as any).product?.name || 'Product') + ' x' + item.quantity}</span>
                    <span>€{(((item as any).product?.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
