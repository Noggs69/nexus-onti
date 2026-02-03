-- ====================================================================
-- Función para obtener el email de un usuario
-- ====================================================================
-- Ejecuta esto en Supabase SQL Editor
-- ====================================================================

-- Crear función para obtener email del usuario
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO anon;

-- Verificar que funciona
SELECT get_user_email(auth.uid());
