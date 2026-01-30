import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">NEXUS</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.productsTitle')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.smartphones')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.laptops')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.tablets')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.audio')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.accessories')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.supportTitle')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.helpCenter')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.warranty')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.returns')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.shippingInfo')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.contactUs')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.followUs')}</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 NEXUS. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
