# 🔧 Guía de Configuración de Políticas RLS - Storage

## Error: "new row violates row-level security policy"

Este error significa que las políticas de seguridad del bucket de Supabase Storage no permiten que el usuario suba archivos.

## ✅ Solución Paso a Paso

### Método 1: Políticas Simples (Recomendado)

#### 1. Acceder a las Políticas
1. Abre tu proyecto en Supabase Dashboard
2. Ve a **Storage** (menú lateral izquierdo)
3. Haz clic en el bucket **chat-files**
4. Ve a la pestaña **Policies**

#### 2. Eliminar Políticas Existentes (si las hay)
- Si ves políticas existentes que no funcionan, elimínalas todas
- Haz clic en los 3 puntos (...) > Delete

#### 3. Crear Política de INSERT (Subir Archivos)

**Clic en "New Policy"** > Selecciona:
- **Operation:** INSERT
- **Policy name:** `Allow authenticated uploads`
- **Target roles:** authenticated
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'chat-files'
  ```
- Clic en **Review** > **Save policy**

#### 4. Crear Política de SELECT (Ver Archivos)

**Clic en "New Policy"** > Selecciona:
- **Operation:** SELECT
- **Policy name:** `Allow authenticated reads`
- **Target roles:** authenticated  
- **USING expression:**
  ```sql
  bucket_id = 'chat-files'
  ```
- Clic en **Review** > **Save policy**

#### 5. Crear Política de DELETE (Opcional)

**Clic en "New Policy"** > Selecciona:
- **Operation:** DELETE
- **Policy name:** `Allow users to delete own files`
- **Target roles:** authenticated
- **USING expression:**
  ```sql
  bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Clic en **Review** > **Save policy**

### Método 2: Bucket Público (Más Simple pero Menos Seguro)

Si las políticas te dan problemas, puedes hacer el bucket público:

1. Ve a **Storage > chat-files**
2. Haz clic en **Configuration** (pestaña)
3. Marca la casilla **"Public bucket"**
4. Clic en **Save**

**⚠️ Advertencia:** Esto permite que cualquiera vea los archivos si tiene la URL. Para producción, usa Método 1.

## 🧪 Verificar que Funciona

### Test en Supabase
1. Ve a **Storage > chat-files**
2. Intenta subir un archivo manualmente
3. Si funciona, las políticas están bien

### Test en tu App
1. Abre la consola del navegador (F12)
2. Ve al chat y haz clic en el clip 📎
3. Selecciona un archivo pequeño (imagen)
4. Haz clic en enviar
5. Revisa la consola:
   - ✅ **Éxito:** No hay errores, el archivo se sube
   - ❌ **Error:** Verás "StorageApiError" con detalles

## 🔍 Debugging Avanzado

### Verificar Usuario Autenticado
```javascript
// En la consola del navegador
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario:', user);
```

Si `user` es `null`, el problema es de autenticación, no de RLS.

### Verificar Políticas Activas
```sql
-- En SQL Editor de Supabase
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

Deberías ver tus políticas listadas.

### Test de Subida Manual
```javascript
// En la consola del navegador
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

const { data, error } = await supabase.storage
  .from('chat-files')
  .upload(`test-${Date.now()}.txt`, testFile);

console.log('Data:', data);
console.log('Error:', error);
```

Si funciona, el problema está en el código de la app, no en las políticas.

## 📋 Checklist Final

- [ ] El bucket `chat-files` existe
- [ ] El bucket está marcado como público O tiene políticas RLS
- [ ] Las políticas de INSERT y SELECT están creadas
- [ ] Las políticas están habilitadas (no desactivadas)
- [ ] El usuario está autenticado (puedes ver su ID en Supabase)
- [ ] La URL de Supabase es correcta en `.env`
- [ ] La anon key es correcta en `.env`

## 🆘 Solución de Último Recurso

Si nada funciona:

1. **Elimina el bucket completamente:**
   - Storage > chat-files > Settings > Delete bucket

2. **Créalo de nuevo:**
   - Storage > New bucket
   - Nombre: `chat-files`
   - Marca **"Public bucket"** ✓
   - Save

3. **No agregues ninguna política RLS**
   - El bucket público permite lectura y escritura sin políticas

4. **Prueba de nuevo**

## 📞 Contacto

Si sigues teniendo problemas:
1. Revisa los logs en Supabase Dashboard > Logs
2. Comparte el error exacto de la consola
3. Verifica que estés usando la última versión de @supabase/supabase-js

---

**Última actualización:** 3 de febrero de 2026
