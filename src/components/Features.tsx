import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: Truck,
      title: t('features.shipping'),
      description: t('features.shippingDesc')
    },
    {
      icon: Shield,
      title: t('features.warranty'),
      description: t('features.warrantyDesc')
    },
    {
      icon: Headphones,
      title: t('features.support'),
      description: t('features.supportDesc')
    },
    {
      icon: CreditCard,
      title: t('features.payment'),
      description: t('features.paymentDesc')
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full mb-4">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
