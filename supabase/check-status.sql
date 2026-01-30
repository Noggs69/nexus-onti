-- ============================================
-- VERIFICAR ESTADO DE LA BASE DE DATOS
-- ============================================

-- 1. Verificar usuarios registrados
SELECT 'USUARIOS REGISTRADOS:' as info;
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 2. Verificar si existen los usuarios específicos
SELECT 'USUARIOS CLAVE:' as info;
SELECT id, email, role 
FROM profiles 
WHERE email IN ('nachomolla6@gmail.com', 'nacho.molla.pra@gmail.com');

-- 3. Verificar conversaciones existentes
SELECT 'CONVERSACIONES:' as info;
SELECT 
  c.id,
  c.customer_id,
  c.provider_id,
  cust.email as customer_email,
  prov.email as provider_email,
  c.created_at
FROM conversations c
LEFT JOIN profiles cust ON c.customer_id = cust.id
LEFT JOIN profiles prov ON c.provider_id = prov.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. Verificar triggers instalados
SELECT 'TRIGGERS:' as info;
SELECT trigger_name, event_manipulation, action_timing, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'conversations'
ORDER BY trigger_name;

-- 5. Verificar funciones
SELECT 'FUNCIONES:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('auto_assign_provider', 'queue_provider_email', 'handle_new_user');
