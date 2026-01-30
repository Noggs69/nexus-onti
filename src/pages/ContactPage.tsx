import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react';

export function ContactPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Debes iniciar sesión para contactar</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Escribe un mensaje');
      return;
    }

    setLoading(true);
    try {
      // Attempt to set provider_id if the selected product includes an owner/provider field
      const product = products.find((p) => p.id === selectedProductId) as any | undefined;
      const providerId = product?.owner_id || product?.provider_id || null;

      const { data, error: err } = await supabase
        .from('conversations')
        .insert({
          customer_id: user.id,
          product_id: selectedProductId,
          provider_id: providerId,
        })
        .select()
        .maybeSingle();

      if (err) throw err;
      if (!data) throw new Error('Failed to create conversation');

      await supabase.from('messages').insert({
        conversation_id: data.id,
        sender_id: user.id,
        content: message,
      });

      navigate('/chat');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al iniciar la conversación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Contacta sobre nuestros productos</h1>

      <form onSubmit={handleStartConversation} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Producto de Interés (Opcional)
          </label>
          <select
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(e.target.value || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Selecciona un producto...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - €{product.price}
              </option>
            ))}
          </select>
        </div>

        {selectedProductId && (
          <div className="bg-blue-50 p-4 rounded-lg">
            {(() => {
              const product = products.find((p) => p.id === selectedProductId);
              return (
                <>
                  <h3 className="font-semibold text-gray-900 mb-2">{product?.name}</h3>
                  <p className="text-gray-700 text-sm mb-2">{product?.description}</p>
                  <p className="text-blue-600 font-semibold">€{product?.price}</p>
                </>
              );
            })()}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Tu Mensaje
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos tu interés en el producto y dónde te gustaría que se envíe..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none h-32"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Send size={18} />
          {loading ? 'Enviando...' : 'Iniciar Conversación'}
        </button>
      </form>
    </div>
  );
}
