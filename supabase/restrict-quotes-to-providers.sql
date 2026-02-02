-- Actualizar políticas de quotes para que solo los proveedores puedan crearlas

-- Eliminar política antigua que permitía a cualquiera crear cotizaciones
DROP POLICY IF EXISTS "Customers create quotes" ON quotes;

-- Nueva política: Solo proveedores pueden crear cotizaciones
CREATE POLICY "Providers can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Política para que proveedores puedan ver todas las cotizaciones
DROP POLICY IF EXISTS "Customers see own quotes" ON quotes;

CREATE POLICY "Providers see all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Política para que clientes vean sus propias cotizaciones
CREATE POLICY "Customers see their quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
  );

-- Actualizar política de quote_items para proveedores
DROP POLICY IF EXISTS "Customers see quote items" ON quote_items;

CREATE POLICY "Providers see all quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Política para que clientes vean items de sus cotizaciones
CREATE POLICY "Customers see their quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_id
      AND quotes.customer_id = auth.uid()
    )
  );

-- Permitir a proveedores insertar items de cotización
CREATE POLICY "Providers can create quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );
