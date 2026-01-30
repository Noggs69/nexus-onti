import React, { useState, useEffect } from 'react';
import { supabase, Quote, QuoteItem, Product } from '../lib/supabase';
import { FileText, ExternalLink } from 'lucide-react';

interface QuoteViewProps {
  quotes: Quote[];
}

export function QuoteView({ quotes }: QuoteViewProps) {
  const [quoteItems, setQuoteItems] = useState<Map<string, (QuoteItem & { product?: Product })[]>>(new Map());

  useEffect(() => {
    loadQuoteItems();
  }, [quotes]);

  async function loadQuoteItems() {
    const itemsMap = new Map();

    for (const quote of quotes) {
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id);

      if (!error && data) {
        const items = await Promise.all(
          data.map(async (item) => {
            const { data: product } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.product_id)
              .maybeSingle();
            return { ...item, product };
          })
        );
        itemsMap.set(quote.id, items);
      }
    }

    setQuoteItems(itemsMap);
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText size={32} className="mx-auto mb-2 opacity-50" />
        <p>No hay cotizaciones disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <div key={quote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">{quote.customer_name}</h4>
              <p className="text-sm text-gray-600">{quote.customer_email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium €{
                quote.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : quote.status === 'sent'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {quote.status}
            </span>
          </div>

          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Envío:</h5>
            <p className="text-sm text-gray-600">
              {quote.shipping_address}, {quote.shipping_city}, {quote.shipping_postal_code}, {quote.shipping_country}
            </p>
          </div>

          {quoteItems.get(quote.id) && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Productos:</h5>
              <div className="space-y-1">
                {quoteItems.get(quote.id)?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.product?.name} x {item.quantity}
                    </span>
                    <span>€{item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal:</span>
              <span>€{quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Envío:</span>
              <span>€{quote.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total:</span>
              <span className="text-blue-600">€{quote.total.toFixed(2)}</span>
            </div>
          </div>

          {quote.payment_link && quote.status !== 'paid' && (
            <a
              href={quote.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <ExternalLink size={16} />
              Pagar con PayPal
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
