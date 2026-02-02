import { ShoppingCart, Menu, LogOut, User, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, profile } = useAuth();
  const { getItemCount } = useCart();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const itemCount = getItemCount();

  const isProvider = profile?.role === 'provider';

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="lg:hidden text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center">
              <span className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 text-transparent bg-clip-text">
                NEXUS
              </span>
            </Link>

            <div className="hidden lg:flex space-x-8">
              <Link
                to="/products"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                {t('nav.products')}
              </Link>
              {!isProvider && (
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  {t('nav.contact')}
                </Link>
              )}
              {isProvider && (
                <Link
                  to="/manage-products"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Gestionar Productos
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {!isProvider && (
              <Link
                to="/cart"
                className="text-gray-300 hover:text-white transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <User className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-white font-semibold text-sm">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      {t('nav.account')}
                    </Link>
                    {!isProvider && (
                      <Link
                        to="/contact"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        {t('nav.contact')}
                      </Link>
                    )}
                    {isProvider && (
                      <Link
                        to="/manage-products"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        Gestionar Productos
                      </Link>
                    )}
                    <Link
                      to="/chat"
                      onClick={() => setShowMenu(false)}
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{t('nav.chat')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
