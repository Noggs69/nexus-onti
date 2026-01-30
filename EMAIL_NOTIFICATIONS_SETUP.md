# Sistema de Notificaciones por Email - NEXUS

## Descripción

Este sistema notifica automáticamente a los **proveedores** cuando un **cliente** inicia una conversación desde el carrito de compras.

## Características

### Roles de Usuario
- **Customer (Cliente)**: Usuario normal que puede comprar y chatear con proveedores
- **Provider (Proveedor)**: Usuario que vende productos y recibe notificaciones de nuevas conversaciones

### Flujo de Notificaciones
1. Cliente añade productos al carrito
2. Cliente hace clic en "Contact Provider"
3. Se crea una conversación automáticamente
4. **Se envía un email al proveedor notificándole**
5. Proveedor recibe email con enlace directo al chat
6. Proveedor accede y puede negociar precios

## Configuración

### 1. Ejecutar Migración SQL

Necesitas ejecutar el SQL en tu base de datos Supabase:

```bash
node run-migration.js
```

Esto te mostrará el SQL que necesitas ejecutar. Cópialo y pégalo en el **SQL Editor** de Supabase.

El SQL hace lo siguiente:
- Añade columna `role` a la tabla `profiles` (valores: 'customer' o 'provider')
- Crea tabla `email_notifications` para cola de emails
- Crea trigger que automáticamente añade notificación cuando se crea una conversación
- Configura el primer usuario como 'provider'

### 2. Configurar Variables de Entorno

Crea un archivo `server/.env` basado en `server/.env.example`:

```env
# Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_KEY=tu_service_key_de_supabase

# Email (ejemplo con Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password_de_gmail
SMTP_FROM="NEXUS" <noreply@nexus.com>
```

#### Configurar Gmail para enviar emails:
1. Activa la verificación en 2 pasos en tu cuenta de Google
2. Ve a: https://myaccount.google.com/apppasswords
3. Genera una "App Password" para "Mail"
4. Usa esa contraseña en `SMTP_PASS`

### 3. Instalar Dependencias del Servidor

```bash
cd server
npm install
```

### 4. Iniciar Servicios

Terminal 1 - Servidor Pusher (para chat en tiempo real):
```bash
cd server
npm start
```

Terminal 2 - Servicio de Email:
```bash
cd server
npm run email
```

Terminal 3 - Aplicación Frontend:
```bash
npm run dev
```

## Cómo Probar

### 1. Asignar Roles

Por defecto, el primer usuario será provider. Para probar:

1. Crea una cuenta (será customer por defecto)
2. En Supabase SQL Editor, ejecuta:
```sql
-- Ver todos los usuarios
SELECT id, email, role FROM profiles;

-- Cambiar un usuario a provider
UPDATE profiles SET role = 'provider' WHERE email = 'proveedor@example.com';
```

### 2. Probar el Flujo

1. **Como Cliente:**
   - Inicia sesión con una cuenta customer
   - Añade productos al carrito
   - Haz clic en "Contact Provider"
   - Se te redirige al chat

2. **Como Proveedor:**
   - Recibirás un email a tu cuenta de proveedor
   - El email contiene un enlace directo al chat
   - Haz clic en el enlace o accede a `/chat`
   - Verás la conversación del cliente con los productos compartidos
   - Puedes proponer precios y negociar

### 3. Verificar Emails Pendientes

Puedes ver los emails en cola en Supabase:

```sql
SELECT * FROM email_notifications ORDER BY created_at DESC;
```

## Estructura de Archivos Nuevos

```
server/
├── email-service.js          # Servicio que procesa y envía emails
├── .env.example              # Plantilla de configuración
└── package.json              # Actualizado con nodemailer

supabase/
└── migrations/
    └── add_user_roles_and_notifications.sql  # Migración SQL

src/lib/
└── supabase.ts              # Actualizado con interfaces de Profile y EmailNotification
```

## Próximos Pasos

1. **Producción**: Cambiar URLs de localhost por dominio real
2. **Templates**: Mejorar diseño HTML de los emails
3. **Proveedores Múltiples**: Sistema para productos con diferentes proveedores
4. **Dashboard Provider**: Panel especial para proveedores con todas sus conversaciones
5. **Notificaciones In-App**: Además de email, notificaciones dentro de la app

## Troubleshooting

### Los emails no se envían
- Verifica las credenciales SMTP en `server/.env`
- Revisa los logs del servicio de email
- Confirma que la tabla `email_notifications` existe

### No aparece el rol en el perfil
- Ejecuta la migración SQL en Supabase
- Verifica que la columna `role` existe: `SELECT * FROM profiles LIMIT 1;`

### El trigger no funciona
- Verifica que el trigger existe: `SELECT * FROM pg_trigger WHERE tgname = 'on_new_conversation';`
- Revisa los logs de Supabase

## Soporte

Para problemas o preguntas, verifica:
1. Logs del servidor de email
2. Tabla `email_notifications` en Supabase
3. Console del navegador para errores
