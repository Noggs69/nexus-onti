# ✅ CHECKLIST COMPLETO - Sistema de Chat con Notificaciones

## 📋 PASO 1: Ejecutar Migración SQL en Supabase

Ve a tu **Dashboard de Supabase** → **SQL Editor** y ejecuta este SQL:

```sql
-- 1. Agregar columna role a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'provider'));

-- 2. Crear índice
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Crear tabla de notificaciones email
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 4. Crear función para encolar emails
CREATE OR REPLACE FUNCTION queue_provider_email()
RETURNS TRIGGER AS $$
DECLARE
  provider_email TEXT;
  customer_name TEXT;
  conversation_url TEXT;
BEGIN
  -- Obtener email del proveedor
  SELECT u.email INTO provider_email
  FROM auth.users u
  WHERE u.id = NEW.provider_id;
  
  -- Obtener nombre del cliente
  SELECT COALESCE(p.full_name, u.email) INTO customer_name
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = NEW.customer_id;
  
  -- Crear URL de la conversación
  conversation_url := 'http://localhost:5173/chat?conversation=' || NEW.id;
  
  -- Encolar notificación
  INSERT INTO email_notifications (to_email, subject, body, conversation_id)
  VALUES (
    provider_email,
    'Nueva conversación - ' || customer_name,
    'Hola,' || E'\n\n' ||
    'Tienes una nueva conversación de ' || customer_name || '.' || E'\n\n' ||
    'Accede al chat aquí: ' || conversation_url || E'\n\n' ||
    'Saludos,' || E'\n' ||
    'NEXUS Team',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger
DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION queue_provider_email();
```

**Verificar que se ejecutó correctamente:**
```sql
-- Verificar que la columna existe
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Verificar que la tabla existe
SELECT * FROM email_notifications LIMIT 1;
```

---

## 📋 PASO 2: Registrar Usuarios en la Aplicación

### Opción A: Desde la aplicación web (RECOMENDADO)
1. Inicia la aplicación: `npm run dev`
2. Ve a http://localhost:5173/signup
3. Registra estos dos usuarios:
   - **Email**: `ikermolla056@gmail.com` (Cliente)
   - **Email**: `nachomolla6@gmail.com` (Proveedor)

### Opción B: Directamente en Supabase
Si los usuarios ya existen en **Authentication > Users** pero no en `profiles`:

```sql
-- Ver usuarios existentes
SELECT id, email FROM auth.users;

-- Si los usuarios existen pero no tienen perfil, créalos:
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Iker Molla', 'customer' 
FROM auth.users WHERE email = 'ikermolla056@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Nacho Molla', 'provider' 
FROM auth.users WHERE email = 'nachomolla6@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'provider';
```

---

## 📋 PASO 3: Asignar Roles a los Usuarios

### Opción A: Con el script (después de registrar)
```bash
cd C:\Users\a\Desktop\NEXUS\NEXUS
node set-user-roles.js
```

### Opción B: Directamente en Supabase SQL Editor
```sql
UPDATE profiles SET role = 'provider' WHERE email = 'nachomolla6@gmail.com';
UPDATE profiles SET role = 'customer' WHERE email = 'ikermolla056@gmail.com';

-- Verificar
SELECT email, role FROM profiles;
```

---

## 📋 PASO 4: Configurar Servicio de Email

### 4.1 Crear archivo `server/.env`

Crea el archivo `C:\Users\a\Desktop\NEXUS\NEXUS\server\.env` con este contenido:

```env
# Supabase (copia estos valores de tu archivo .env principal)
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui

# Pusher (si lo usas)
PUSHER_APP_ID=tu_pusher_app_id
PUSHER_KEY=tu_pusher_key
PUSHER_SECRET=tu_pusher_secret
PUSHER_CLUSTER=eu

# Configuración Email (Gmail ejemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nachomolla6@gmail.com
SMTP_PASS=tu_app_password_de_gmail
SMTP_FROM="NEXUS" <noreply@nexus.com>
```

### 4.2 Obtener App Password de Gmail
1. Ve a https://myaccount.google.com/apppasswords
2. Crea una contraseña de aplicación para "Mail"
3. Usa esa contraseña en `SMTP_PASS`

### 4.3 Instalar dependencias del servidor
```bash
cd server
npm install
```

---

## 📋 PASO 5: Iniciar Todos los Servicios

Necesitas **3 terminales** abiertas:

### Terminal 1: Frontend
```bash
npm run dev
```

### Terminal 2: Servidor Pusher (para chat en tiempo real)
```bash
cd server
npm start
```

### Terminal 3: Servicio de Email (para notificaciones)
```bash
cd server
npm run email
```

---

## 📋 PASO 6: Verificar que Todo Funciona

### 6.1 Verificar base de datos
```bash
node check-database.js
```

Deberías ver:
- ✅ 2 usuarios con roles asignados
- ✅ 5 productos
- ✅ Tabla email_notifications vacía

### 6.2 Probar el flujo completo

1. **Como Cliente** (ikermolla056@gmail.com):
   - Login en http://localhost:5173/login
   - Ir a productos
   - Añadir productos al carrito
   - Click en "Contactar Proveedor"
   - Deberías ver el chat abrirse

2. **Verificar email enviado**:
   - Revisa el email de nachomolla6@gmail.com
   - Deberías recibir notificación con enlace al chat
   - O verifica en terminal del servicio de email

3. **Como Proveedor** (nachomolla6@gmail.com):
   - Login en http://localhost:5173/login
   - Ir a /chat
   - Deberías ver la conversación del cliente
   - Puedes responder y negociar precios

---

## 🔍 TROUBLESHOOTING

### Si el email no se envía:
```bash
# Ver emails pendientes en Supabase
SELECT * FROM email_notifications ORDER BY created_at DESC;
```

### Si los roles no aparecen:
```sql
-- Verificar columna role
SELECT email, role FROM profiles;

-- Si role es NULL, ejecuta:
UPDATE profiles SET role = 'customer' WHERE role IS NULL;
```

### Si hay errores en el frontend:
1. Revisa la consola del navegador (F12)
2. Verifica que Pusher esté corriendo
3. Verifica las variables de entorno en `.env`

---

## 📝 RESUMEN DE ARCHIVOS A VERIFICAR

- ✅ `.env` - Variables de entorno principales
- ✅ `server/.env` - Variables del servidor (crear si no existe)
- ✅ Supabase SQL ejecutado (migración)
- ✅ `server/package.json` - Dependencias actualizadas
- ✅ Usuarios registrados con roles asignados

---

## 🎯 ORDEN DE EJECUCIÓN

1. ✅ Ejecutar SQL en Supabase
2. ✅ Registrar usuarios (signup)
3. ✅ Asignar roles (script o SQL)
4. ✅ Configurar server/.env
5. ✅ Instalar dependencias del servidor
6. ✅ Iniciar 3 servicios (frontend, pusher, email)
7. ✅ Probar flujo completo

---

## ✅ CUANDO TODO ESTÉ LISTO

Ejecuta este comando para verificar:
```bash
node check-database.js
```

Deberías ver:
```
=== PROFILES ===
Total usuarios: 2
  1. ikermolla056@gmail.com - customer - Iker
  2. nachomolla6@gmail.com - provider - Nacho
```

¡Entonces estará todo funcionando! 🎉
