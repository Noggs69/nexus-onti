-- Permitir acceso público de lectura a las cotizaciones
-- Esto es necesario para que la página de pago pueda cargar los datos sin autenticación

-- Eliminar política restrictiva si existe
DROP POLICY IF EXISTS "Customers and providers can view quotes" ON quotes;
DROP POLICY IF EXISTS "Anyone can view quotes" ON quotes;

-- Crear política que permite ver cotizaciones sin autenticación
CREATE POLICY "Anyone can view quotes"
ON quotes
FOR SELECT
USING (true);

-- Política para quote_items
DROP POLICY IF EXISTS "Anyone can view quote items" ON quote_items;

CREATE POLICY "Anyone can view quote items"
ON quote_items
FOR SELECT
USING (true);

-- Verificar que RLS esté habilitado
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Nota: Esto permite que cualquiera pueda ver las cotizaciones a través del enlace.
-- Si necesitas más seguridad, puedes agregar un token de acceso único por cotización.
