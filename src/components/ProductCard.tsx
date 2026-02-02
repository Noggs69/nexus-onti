import { ShoppingCart, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product.slug}`}>
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          <img
            src={product.image_url || 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg'}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src =
                'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
            }}
          />
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex-1">
              {product.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <p className="text-xs font-bold text-orange-600">
              {t('products.notOriginal')}
            </p>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                €{product.price.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-400'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">{adding ? t('products.adding') : added ? t('products.added') : t('products.add')}</span>
            </button>
          </div>
        </div>

        {product.featured && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            FEATURED
          </div>
        )}
      </div>
    </Link>
  );
}
