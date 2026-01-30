# Cloudflare Pages - Guía de Despliegue NEXUS

## 🚀 PASO 1: Preparar el Proyecto

### 1.1 Verificar build funciona localmente
```bash
npm run build
```

### 1.2 Verificar que `.gitignore` está correcto
Debe incluir:
- `node_modules/`
- `dist/`
- `.env`
- `*.log`

---

## 📦 PASO 2: Subir a GitHub (si no lo has hecho)

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit - NEXUS project"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/nexus.git
git branch -M main
git push -u origin main
```

---

## ☁️ PASO 3: Configurar Cloudflare Pages

### 3.1 Ir a Cloudflare Dashboard
1. Ve a https://dash.cloudflare.com/
2. En el menú lateral: **Workers & Pages**
3. Click en **Create application**
4. Selecciona **Pages** → **Connect to Git**

### 3.2 Conectar Repositorio GitHub
1. Autoriza Cloudflare a acceder a tu GitHub
2. Selecciona el repositorio **nexus**
3. Click en **Begin setup**

### 3.3 Configuración del Build

**Framework preset**: Vite
**Build command**: `npm run build`
**Build output directory**: `dist`
**Root directory**: `/`

**Environment variables (Production)**:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 3.4 Deploy
Click en **Save and Deploy**

---

## 🔧 PASO 4: Configurar Variables de Entorno

Una vez desplegado, ve a:
**Settings** → **Environment variables** → **Production**

Añade:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🌐 PASO 5: Configurar Dominio Personalizado

### 5.1 En Cloudflare Pages
1. Ve a tu proyecto en Pages
2. **Custom domains** → **Set up a custom domain**
3. Añade tu dominio: `nexus-onti.shop`

### 5.2 Configurar DNS en Cloudflare
1. Ve a **DNS** → **Records**
2. Añade registro CNAME:
   - **Type**: CNAME
   - **Name**: @ (para dominio raíz nexus-onti.shop)
   - **Target**: nexus-project.pages.dev (tu proyecto de Cloudflare)
   - **Proxy status**: Proxied (naranja)

---

## 📝 PASO 6: Actualizar URLs en el Código

Necesitas cambiar las URLs de localhost a tu dominio en producción.

### 6.1 Crear archivo de configuración
Ya está listo en `src/lib/config.ts`

### 6.2 Actualizar archivo de migración SQL
Busca y reemplaza en Supabase:
```sql
-- Actualizar URLs en la función de emails
CREATE OR REPLACE FUNCTION queue_provider_email()
RETURNS TRIGGER AS $$
DECLARE
  provider_email TEXT;
  customer_name TEXT;
  conversation_url TEXT;
BEGIN
  SELECT u.email INTO provider_email
  FROM auth.users u
  WHERE u.id = NEW.provider_id;
  
  SELECT COALESCE(p.full_name, u.email) INTO customer_name
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = NEW.customer_id;
  
  -- URL DE PRODUCCIÓN
  conversation_url := 'https://nexus-onti.shop/chat?conversation=' || NEW.id;
  
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
```

---

## 🔒 PASO 7: Configurar CORS en Supabase

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. En **CORS Configuration**, añade:
   - `https://tu-proyecto.pages.dev`
   - `https://nexus-onti.shop`

---

## 🚀 PASO 8: Deploy Automático

Cada vez que hagas `git push`, Cloudflare Pages:
1. Detectará los cambios
2. Ejecutará el build automáticamente
3. Desplegará la nueva versión

```bash
# Workflow típico
git add .
git commit -m "Nueva característica"
git push
# Espera 2-3 minutos y tu sitio estará actualizado
```

---

## 📊 PASO 9: Verificar Deployment

### 9.1 Check de URLs
Verifica que estas URLs funcionen:
- ✅ `https://tu-proyecto.pages.dev`
- ✅ `https://nexus-onti.shop`
- ✅ Productos carguen correctamente
- ✅ Login/Signup funcione
- ✅ Chat funcione

### 9.2 Revisar Logs
En Cloudflare Pages → **Deployments** → Click en el último deployment → **View build logs**

---

## 🐛 TROUBLESHOOTING

### Build falla
```bash
# Verificar localmente primero
npm run build

# Si funciona local pero falla en Cloudflare:
# - Revisa las variables de entorno
# - Verifica que Node version sea compatible (18+)
```

### Página en blanco
- Abre DevTools (F12) → Console
- Revisa errores de CORS o variables de entorno
- Verifica que `VITE_SUPABASE_URL` esté correcta

### Pusher no funciona en producción
Necesitas actualizar las configuraciones permitidas:
1. Dashboard de Pusher → App Settings
2. Añade tu dominio a **Authorized domains**

---

## 📋 CHECKLIST FINAL

- [ ] Build funciona localmente (`npm run build`)
- [ ] Repositorio en GitHub
- [ ] Proyecto creado en Cloudflare Pages
- [ ] Variables de entorno configuradas
- [ ] Primer deployment exitoso
- [ ] Dominio personalizado configurado (opcional)
- [ ] DNS actualizado
- [ ] URLs actualizadas en SQL
- [ ] CORS configurado en Supabase
- [ ] Sitio funciona en producción

---

## 🎉 ¡LISTO!

Tu aplicación estará disponible en:
- **URL Cloudflare**: https://tu-proyecto.pages.dev
- **Dominio personalizado**: https://nexus-onti.shop

**Ventajas de Cloudflare Pages:**
- ✅ Deploy automático con git push
- ✅ CDN global ultrarrápido
- ✅ SSL/HTTPS gratis
- ✅ Preview deployments para cada PR
- ✅ Rollback instantáneo
- ✅ Gratis hasta 500 builds/mes
