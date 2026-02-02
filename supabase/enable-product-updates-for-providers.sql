-- Permitir a los proveedores actualizar productos

-- Política para que proveedores puedan actualizar productos
CREATE POLICY "Providers can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Política para que proveedores puedan crear productos
CREATE POLICY "Providers can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Política para que proveedores puedan eliminar productos
CREATE POLICY "Providers can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );
