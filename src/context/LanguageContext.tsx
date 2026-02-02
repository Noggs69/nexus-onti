import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en' | 'va';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getProductDescription: (slug: string, fallback: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const getProductDescription = (slug: string, fallback: string): string => {
    const description = translations[language]?.productDescriptions?.[slug];
    return description || fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getProductDescription }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

const translations = {
  es: {
    nav: {
      home: 'Inicio',
      products: 'Productos',
      cart: 'Carrito',
      contact: 'Contacto',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      logout: 'Cerrar Sesión',
      account: 'Mi Cuenta',
      chat: 'Chat'
    },
    hero: {
      title: 'Audio premium y',
      titleHighlight: 'tecnología para tu vida',
      subtitle: 'Auriculares inalámbricos, smartwatches y altavoces de la más alta calidad para acompañarte en cada momento',
      cta: 'Explorar productos',
      offers: 'Ver ofertas'
    },
    features: {
      shipping: 'Envío Gratis',
      shippingDesc: 'En todos los pedidos superiores a €50',
      warranty: 'Garantía',
      warrantyDesc: 'Consulta con el proveedor para más detalles',
      support: 'Soporte L-V',
      supportDesc: 'Disponible de lunes a viernes',
      payment: 'Pago con PayPal',
      paymentDesc: 'Método de pago seguro y rápido'
    },
    products: {
      title: 'Nuestros Productos',
      featured: 'Destacados',
      addToCart: 'Agregar al Carrito',
      viewDetails: 'Ver Detalles',
      specifications: 'Especificaciones',
      description: 'Descripción',
      price: 'Precio',
      inStock: 'En Stock',
      outOfStock: 'Agotado',
      added: 'Agregado al carrito',
      explore: 'Explorar nuestra colección',
      all: 'Todos los productos',
      notOriginal: 'No Son Originales',
      notOriginalWarning: 'Estos productos no son originales de marca',
      backToProducts: 'Volver a productos',
      adding: 'Agregando...',
      add: 'Agregar'
    },
    cart: {
      title: 'Carrito de Compras',
      empty: 'Tu carrito está vacío',
      emptySubtitle: 'Agrega algunos productos para comenzar',
      continueShopping: 'Continuar Comprando',
      summary: 'Resumen del Pedido',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      shippingFree: 'Gratis',
      tax: 'IVA (10%)',
      total: 'Total',
      contactProvider: 'Contactar Proveedor',
      contactMessage: 'Chatea con nuestro equipo para negociar precios y envío',
      remove: 'Eliminar',
      quantity: 'Cantidad'
    },
    chat: {
      title: 'Mensajes',
      conversation: 'Conversación',
      selectConversation: 'Selecciona una conversación para empezar',
      writeMessage: 'Escribe un mensaje...',
      send: 'Enviar',
      noMessages: 'No hay mensajes. Envía uno para comenzar la conversación.',
      createQuote: 'Crear Cotización',
      quotes: 'Cotizaciones',
      quickMessages: 'Mensajes rápidos:',
      betterPrice: '¿Puede hacer un mejor precio?',
      availability: '¿Tiene disponibilidad inmediata?',
      shippingCost: '¿Cuánto cuesta el envío?',
      customOrders: '¿Acepta pedidos personalizados?',
      proposePrice: 'Proponer precio',
      proposedPrice: 'Precio propuesto',
      originalPrice: 'Precio original',
      acceptPrice: 'Aceptar precio',
      counterOffer: 'Contraoferta',
      cancel: 'Cancelar',
      interestedProducts: 'Hola! Me interesan estos productos:',
      estimatedTotal: 'Total estimado:',
      negotiateQuestion: '¿Podemos negociar el precio y los costos de envío?'
    },
    quote: {
      newQuote: 'Nueva Cotización',
      customer: 'Cliente',
      name: 'Nombre',
      email: 'Email',
      shipping: 'Envío',
      address: 'Dirección',
      city: 'Ciudad',
      postalCode: 'Código Postal',
      country: 'País',
      products: 'Productos',
      add: 'Agregar',
      quantity: 'Cantidad',
      price: 'Precio',
      subtotal: 'Subtotal',
      shippingCost: 'Costo de Envío',
      discount: 'Descuento',
      notes: 'Notas',
      paymentLink: 'Link de Pago PayPal (Opcional)',
      paymentLinkHint: 'Puedes crear un link de pago en paypal.me',
      total: 'Total',
      create: 'Crear Cotización',
      creating: 'Creando...',
      noQuotes: 'No hay cotizaciones disponibles',
      status: {
        pending: 'Pendiente',
        sent: 'Enviada',
        paid: 'Pagada'
      }
    },
    auth: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      fullName: 'Nombre Completo',
      phone: 'Teléfono',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      signupHere: 'Regístrate aquí',
      loginHere: 'Inicia sesión aquí'
    },
    contact: {
      title: 'Contáctanos',
      subtitle: 'Estamos aquí para ayudarte',
      name: 'Nombre',
      email: 'Email',
      message: 'Mensaje',
      send: 'Enviar Mensaje',
      sending: 'Enviando...'
    },
    footer: {
      description: 'Tecnología premium que transforma tu forma de vivir, trabajar y crear.',
      productsTitle: 'Productos',
      smartphones: 'Smartphones',
      laptops: 'Laptops',
      tablets: 'Tablets',
      audio: 'Audio',
      accessories: 'Accesorios',
      supportTitle: 'Soporte',
      helpCenter: 'Centro de ayuda',
      warranty: 'Garantía',
      returns: 'Devoluciones',
      shippingInfo: 'Envíos',
      contactUs: 'Contacto',
      followUs: 'Síguenos',
      rights: 'Todos los derechos reservados',
      company: 'Empresa',
      about: 'Acerca de',
      careers: 'Carreras',
      blog: 'Blog',
      support: 'Soporte',
      help: 'Centro de Ayuda',
      terms: 'Términos',
      privacy: 'Privacidad',
      legal: 'Legal'
    },
    productDescriptions: {
      'jbl-xtreme-4': 'Altavoz portátil extremadamente robusto con sonido potente de 360°. Resistente al agua y a prueba de golpes, ideal para aventuras.',
      'sony-wh-1000xm5': 'Auriculares con cancelación de ruido líder en la industria. Sonido excepcional y comodidad durante todo el día.',
      'samsung-galaxy-s24': 'El último smartphone insignia con cámara de IA de 200MP y batería de larga duración.',
      'iphone-15-pro': 'iPhone con chip A17 Pro, cámara profesional y estructura de titanio.',
      'macbook-pro-16': 'Portátil profesional con chip M3 Max, pantalla Liquid Retina XDR de 16 pulgadas.',
      'dell-xps-15': 'Portátil ultradelgado con pantalla InfinityEdge y rendimiento excepcional.',
      'ipad-air': 'Tablet versátil con chip M2, perfecta para creativos y profesionales.',
      'samsung-galaxy-tab-s9': 'Tablet premium con pantalla AMOLED y S Pen incluido.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      cart: 'Cart',
      contact: 'Contact',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      account: 'My Account',
      chat: 'Chat'
    },
    hero: {
      title: 'Premium audio and',
      titleHighlight: 'technology for your life',
      subtitle: 'Wireless headphones, smartwatches and speakers of the highest quality to accompany you at every moment',
      cta: 'Explore products',
      offers: 'View offers'
    },
    features: {
      shipping: 'Free Shipping',
      shippingDesc: 'On all orders over €50',
      warranty: 'Warranty',
      warrantyDesc: 'Contact provider for more details',
      support: 'M-F Support',
      supportDesc: 'Available Monday to Friday',
      payment: 'PayPal Payment',
      paymentDesc: 'Safe and fast payment method'
    },
    products: {
      title: 'Our Products',
      featured: 'Featured',
      addToCart: 'Add to Cart',
      viewDetails: 'View Details',
      specifications: 'Specifications',
      description: 'Description',
      price: 'Price',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      added: 'Added to cart',
      explore: 'Explore our collection',
      all: 'All products',
      notOriginal: 'Not Original Brand',
      notOriginalWarning: 'These products are not original brand products',
      backToProducts: 'Back to products',
      adding: 'Adding...',
      add: 'Add'
    },
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      emptySubtitle: 'Add some products to get started',
      continueShopping: 'Continue Shopping',
      summary: 'Order Summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      shippingFree: 'Free',
      tax: 'Tax (10%)',
      total: 'Total',
      contactProvider: 'Contact Provider',
      contactMessage: 'Chat with our team to negotiate prices and shipping',
      remove: 'Remove',
      quantity: 'Quantity'
    },
    chat: {
      title: 'Messages',
      conversation: 'Conversation',
      selectConversation: 'Select a conversation to start',
      writeMessage: 'Write a message...',
      send: 'Send',
      noMessages: 'No messages yet. Send one to start the conversation.',
      createQuote: 'Create Quote',
      quotes: 'Quotes',
      quickMessages: 'Quick messages:',
      betterPrice: 'Can you offer a better price?',
      availability: 'Do you have immediate availability?',
      shippingCost: 'How much is shipping?',
      customOrders: 'Do you accept custom orders?',
      proposePrice: 'Propose price',
      proposedPrice: 'Proposed price',
      originalPrice: 'Original price',
      acceptPrice: 'Accept price',
      counterOffer: 'Counter Offer',
      cancel: 'Cancel',
      interestedProducts: 'Hello! I am interested in these products:',
      estimatedTotal: 'Estimated total:',
      negotiateQuestion: 'Can we negotiate the price and shipping costs?'
    },
    quote: {
      newQuote: 'New Quote',
      customer: 'Customer',
      name: 'Name',
      email: 'Email',
      shipping: 'Shipping',
      address: 'Address',
      city: 'City',
      postalCode: 'Postal Code',
      country: 'Country',
      products: 'Products',
      add: 'Add',
      quantity: 'Quantity',
      price: 'Price',
      subtotal: 'Subtotal',
      shippingCost: 'Shipping Cost',
      discount: 'Discount',
      notes: 'Notes',
      paymentLink: 'PayPal Payment Link (Optional)',
      paymentLinkHint: 'You can create a payment link at paypal.me',
      total: 'Total',
      create: 'Create Quote',
      creating: 'Creating...',
      noQuotes: 'No quotes available',
      status: {
        pending: 'Pending',
        sent: 'Sent',
        paid: 'Paid'
      }
    },
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signupHere: 'Sign up here',
      loginHere: 'Login here'
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'We are here to help',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send Message',
      sending: 'Sending...'
    },
    footer: {
      description: 'Premium technology that transforms the way you live, work and create.',
      productsTitle: 'Products',
      smartphones: 'Smartphones',
      laptops: 'Laptops',
      tablets: 'Tablets',
      audio: 'Audio',
      accessories: 'Accessories',
      supportTitle: 'Support',
      helpCenter: 'Help Center',
      warranty: 'Warranty',
      returns: 'Returns',
      shippingInfo: 'Shipping',
      contactUs: 'Contact',
      followUs: 'Follow Us',
      rights: 'All rights reserved',
      company: 'Company',
      about: 'About',
      careers: 'Careers',
      blog: 'Blog',
      support: 'Support',
      help: 'Help Center',
      terms: 'Terms',
      privacy: 'Privacy',
      legal: 'Legal'
    },
    productDescriptions: {
      'jbl-xtreme-4': 'Extremely rugged portable speaker with powerful 360° sound. Waterproof and shockproof, ideal for adventures.',
      'sony-wh-1000xm5': 'Industry-leading noise canceling headphones. Exceptional sound and all-day comfort.',
      'samsung-galaxy-s24': 'The latest flagship smartphone with 200MP AI camera and long-lasting battery.',
      'iphone-15-pro': 'iPhone with A17 Pro chip, professional camera, and titanium structure.',
      'macbook-pro-16': 'Professional laptop with M3 Max chip, 16-inch Liquid Retina XDR display.',
      'dell-xps-15': 'Ultra-thin laptop with InfinityEdge display and exceptional performance.',
      'ipad-air': 'Versatile tablet with M2 chip, perfect for creatives and professionals.',
      'samsung-galaxy-tab-s9': 'Premium tablet with AMOLED display and S Pen included.'
    }
  },
  va: {
    nav: {
      home: 'Inici',
      products: 'Productes',
      cart: 'Carret',
      contact: 'Contacte',
      login: 'Iniciar Sessió',
      signup: 'Registrar-se',
      logout: 'Tancar Sessió',
      account: 'El Meu Compte',
      chat: 'Xat'
    },
    hero: {
      title: 'Audio premium i',
      titleHighlight: 'tecnologia per a la teua vida',
      subtitle: 'Auriculars sense fils, smartwatches i altaveus de la més alta qualitat per a acompanyar-te en cada moment',
      cta: 'Explorar productes',
      offers: 'Veure ofertes'
    },
    features: {
      shipping: 'Enviament Gratuït',
      shippingDesc: 'En totes les comandes superiors a €50',
      warranty: 'Garantia',
      warrantyDesc: 'Consulta amb el proveïdor per a més detalls',
      support: 'Suport L-V',
      supportDesc: 'Disponible de dilluns a divendres',
      payment: 'Pagament amb PayPal',
      paymentDesc: 'Mètode de pagament segur i ràpid'
    },
    products: {
      title: 'Els Nostres Productes',
      featured: 'Destacats',
      addToCart: 'Afegir al Carret',
      viewDetails: 'Veure Detalls',
      specifications: 'Especificacions',
      description: 'Descripció',
      price: 'Preu',
      inStock: 'En Stock',
      outOfStock: 'Esgotat',
      notOriginal: 'No Són Originals',
      notOriginalWarning: 'Estos productes no són originals de marca',
      backToProducts: 'Tornar a productes',
      adding: 'Afegint...',
      add: 'Afegir',
      added: 'Afegit al carret',
      explore: 'Explorar la nostra col·lecció',
      all: 'Tots els productes'
    },
    cart: {
      title: 'Carret de Compres',
      empty: 'El teu carret està buit',
      emptySubtitle: 'Afig alguns productes per a començar',
      continueShopping: 'Continuar Comprant',
      summary: 'Resum de la Comanda',
      subtotal: 'Subtotal',
      shipping: 'Enviament',
      shippingFree: 'Gratis',
      tax: 'IVA (10%)',
      total: 'Total',
      contactProvider: 'Contactar Proveïdor',
      contactMessage: 'Xateja amb el nostre equip per a negociar preus i enviament',
      remove: 'Eliminar',
      quantity: 'Quantitat'
    },
    chat: {
      title: 'Missatges',
      conversation: 'Conversació',
      selectConversation: 'Selecciona una conversació per a començar',
      writeMessage: 'Escriu un missatge...',
      send: 'Enviar',
      noMessages: 'No hi ha missatges. Envia un per a començar la conversació.',
      createQuote: 'Crear Cotització',
      quotes: 'Cotitzacions',
      quickMessages: 'Missatges ràpids:',
      betterPrice: 'Pot fer un millor preu?',
      availability: 'Té disponibilitat immediata?',
      shippingCost: 'Quant costa l\'enviament?',
      customOrders: 'Accepta comandes personalitzades?',
      proposePrice: 'Proposar preu',
      proposedPrice: 'Preu proposat',
      originalPrice: 'Preu original',
      acceptPrice: 'Acceptar preu',
      counterOffer: 'Contraoferta',
      cancel: 'Cancel·lar',
      interestedProducts: 'Hola! M\'interessen estos productes:',
      estimatedTotal: 'Total estimat:',
      negotiateQuestion: 'Podem negociar el preu i els costos d\'enviament?'
    },
    quote: {
      newQuote: 'Nova Cotització',
      customer: 'Client',
      name: 'Nom',
      email: 'Email',
      shipping: 'Enviament',
      address: 'Adreça',
      city: 'Ciutat',
      postalCode: 'Codi Postal',
      country: 'País',
      products: 'Productes',
      add: 'Afegir',
      quantity: 'Quantitat',
      price: 'Preu',
      subtotal: 'Subtotal',
      shippingCost: 'Cost d\'Enviament',
      discount: 'Descompte',
      notes: 'Notes',
      paymentLink: 'Enllaç de Pagament PayPal (Opcional)',
      paymentLinkHint: 'Pots crear un enllaç de pagament en paypal.me',
      total: 'Total',
      create: 'Crear Cotització',
      creating: 'Creant...',
      noQuotes: 'No hi ha cotitzacions disponibles',
      status: {
        pending: 'Pendent',
        sent: 'Enviada',
        paid: 'Pagada'
      }
    },
    auth: {
      login: 'Iniciar Sessió',
      signup: 'Registrar-se',
      email: 'Correu Electrònic',
      password: 'Contrasenya',
      fullName: 'Nom Complet',
      phone: 'Telèfon',
      noAccount: 'No tens compte?',
      hasAccount: 'Ja tens compte?',
      signupHere: 'Registra\'t ací',
      loginHere: 'Inicia sessió ací'
    },
    contact: {
      title: 'Contacta\'ns',
      subtitle: 'Estem ací per a ajudar-te',
      name: 'Nom',
      email: 'Email',
      message: 'Missatge',
      send: 'Enviar Missatge',
      sending: 'Enviant...'
    },
    footer: {
      description: 'Tecnologia premium que transforma la teua forma de viure, treballar i crear.',
      productsTitle: 'Productes',
      smartphones: 'Smartphones',
      laptops: 'Portàtils',
      tablets: 'Tauletes',
      audio: 'Audio',
      accessories: 'Accessoris',
      supportTitle: 'Suport',
      helpCenter: 'Centre d\'ajuda',
      warranty: 'Garantia',
      returns: 'Devolucions',
      shippingInfo: 'Enviaments',
      contactUs: 'Contacte',
      followUs: 'Seguix-nos',
      rights: 'Tots els drets reservats',
      company: 'Empresa',
      about: 'Sobre nosaltres',
      careers: 'Carreres',
      blog: 'Blog',
      support: 'Suport',
      help: 'Centre d\'Ajuda',
      terms: 'Termes',
      privacy: 'Privacitat',
      legal: 'Legal'
    },
    productDescriptions: {
      'jbl-xtreme-4': 'Altaveu portàtil extremadament robust amb so potent de 360°. Resistent a l\'aigua i a prova de colps, ideal per a aventures.',
      'sony-wh-1000xm5': 'Auriculars amb cancel·lació de soroll líder en la indústria. So excepcional i comoditat durant tot el dia.',
      'samsung-galaxy-s24': 'L\'últim smartphone insignia amb càmera d\'IA de 200MP i bateria de llarga durada.',
      'iphone-15-pro': 'iPhone amb xip A17 Pro, càmera professional i estructura de titani.',
      'macbook-pro-16': 'Portàtil professional amb xip M3 Max, pantalla Liquid Retina XDR de 16 polzades.',
      'dell-xps-15': 'Portàtil ultraprim amb pantalla InfinityEdge i rendiment excepcional.',
      'ipad-air': 'Tauleta versàtil amb xip M2, perfecta per a creatius i professionals.',
      'samsung-galaxy-tab-s9': 'Tauleta premium amb pantalla AMOLED i S Pen inclòs.'
    }
  }
};
