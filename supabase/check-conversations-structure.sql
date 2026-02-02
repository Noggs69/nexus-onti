-- Verificar estructura de la tabla conversations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Ver políticas RLS activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'conversations';

-- Ver conversaciones actuales y sus provider_id
SELECT id, customer_id, provider_id, created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 5;
