import React, { useState } from 'react';
import { supabase, Product } from '../lib/supabase';
import { useProducts } from '../hooks/useProducts';
import { useQuotes } from '../hooks/useChat';
import { X, Plus, Trash2 } from 'lucide-react';

interface QuoteItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface CreateQuoteProps {
  conversationId: string;
  onClose: () => void;
}

export function CreateQuote({ conversationId, onClose }: CreateQuoteProps) {
  const { products } = useProducts();
  const { loadQuotes } = useQuotes(conversationId);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [shippingCost, setShippingCost] = useState('0');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('0');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (products.length > 0) {
      setItems([
        ...items,
        {
          product_id: products[0].id,
          quantity: 1,
          unit_price: products[0].price,
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const shipping = parseFloat(shippingCost) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal + shipping - discountAmount;

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('quotes')
        .insert({
          conversation_id: conversationId,
          customer_name: customerName,
          customer_email: customerEmail,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_postal_code: shippingPostalCode,
          shipping_country: shippingCountry,
          subtotal,
          shipping_cost: shipping,
          total,
          payment_link: paymentLink || null,
          status: paymentLink ? 'sent' : 'pending',
        })
        .select()
        .maybeSingle();

      if (err) throw err;
      if (!data) throw new Error('Failed to create quote');

      for (const item of items) {
        const { error: itemErr } = await supabase
          .from('quote_items')
          .insert({
            quote_id: data.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
          });

        if (itemErr) throw itemErr;
      }

      await loadQuotes();
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Nueva Cotización</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleCreateQuote} className="flex-1 overflow-y-auto flex flex-col gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900">Cliente</h4>
          <input
            type="text"
            placeholder="Nombre"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="email"
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900">Envío</h4>
          <input
            type="text"
            placeholder="Dirección"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            placeholder="Ciudad"
            value={shippingCity}
            onChange={(e) => setShippingCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            placeholder="Código Postal"
            value={shippingPostalCode}
            onChange={(e) => setShippingPostalCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            placeholder="País"
            value={shippingCountry}
            onChange={(e) => setShippingCountry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-900">Productos</h4>
            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.product_id);
            return (
              <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <select
                  value={item.product_id}
                  onChange={(e) => {
                    const p = products.find((prod) => prod.id === e.target.value);
                    updateItem(index, 'product_id', e.target.value);
                    if (p) updateItem(index, 'unit_price', p.price);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Precio"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Subtotal: €{(item.quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Costo de Envío
            </label>
            <input
              type="number"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Descuento (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ofrece un descuento para cerrar la negociación
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Notas de negociación
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Condiciones especiales, plazos de entrega, términos de pago..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Link de Pago PayPal (Opcional)
            </label>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="https://paypal.me/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes crear un link de pago en paypal.me
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío:</span>
            <span className="font-medium">€{shipping.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descuento:</span>
              <span className="font-medium text-green-600">-€{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
            <span>Total:</span>
            <span className="text-blue-600">€{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition mt-auto"
        >
          {loading ? 'Creando...' : 'Crear Cotización'}
        </button>
      </form>
    </div>
  );
}
