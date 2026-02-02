import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { Product } from '../lib/supabase';
import { ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getProductBySlug, products } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t, getProductDescription } = useLanguage();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (slug) {
        const p = await getProductBySlug(slug);
        setProduct(p);
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug, getProductBySlug]);

  async function handleAddToCart() {
    if (!product || !user) {
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('products.viewDetails')}</h1>
        <Link to="/products" className="text-blue-600 hover:text-blue-700 font-semibold">
          {t('products.backToProducts')}
        </Link>
      </div>
    );
  }

  const relatedProducts = products.filter(
    (p) => p.category_id === product.category_id && p.id !== product.id
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/products" className="text-blue-600 hover:text-blue-700 font-semibold mb-8 inline-block">
          ← {t('products.backToProducts')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden p-8">
            <img
              src={product.image_url || ''}
              alt={product.name}
              className="w-full h-full max-h-[500px] object-contain"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
              }}
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-blue-600 mb-2">PREMIUM AUDIO</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <p className="text-sm">
                  <span className="font-bold text-orange-900">{t('products.notOriginal')}:</span>{' '}
                  <span className="text-orange-800">{t('products.notOriginalWarning')}</span>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-gray-900">€{product.price.toFixed(2)}</p>
            </div>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {getProductDescription(product.slug, product.description)}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">{t('products.specifications')}</h3>
              <div className="space-y-3">
                {typeof product.specs === 'object' && product.specs !== null ? (
                  Object.entries(product.specs).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between text-gray-700">
                      <span className="font-medium capitalize">{key}:</span>
                      <span>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No specs available</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-6 py-2 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                  added
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added to cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{adding ? 'Adding...' : 'Add to cart'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="font-semibold text-gray-900">Free Shipping</p>
                <p className="text-sm text-gray-600">On all orders</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Warranty</p>
                <p className="text-sm text-gray-600">2-year guarantee</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Support</p>
                <p className="text-sm text-gray-600">24/7 support</p>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <Link key={related.id} to={`/products/${related.slug}`}>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={related.image_url || ''}
                        alt={related.name}
                        className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{related.name}</h3>
                      <p className="text-lg font-bold text-blue-600">€{related.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
