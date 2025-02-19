-- Create consultation_categories table
CREATE TABLE IF NOT EXISTS consultation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation_keywords table
CREATE TABLE IF NOT EXISTS consultation_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES consultation_categories(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, keyword)
);

-- Create consultation_analysis table
CREATE TABLE IF NOT EXISTS consultation_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  category_id uuid REFERENCES consultation_categories(id),
  keywords text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consultation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view categories"
  ON consultation_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON consultation_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Everyone can view keywords"
  ON consultation_keywords
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify keywords"
  ON consultation_keywords
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Everyone can view analysis"
  ON consultation_analysis
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert analysis"
  ON consultation_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to analyze message
CREATE OR REPLACE FUNCTION analyze_message(message_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_content text;
  category_record RECORD;
  found_keywords text[] := '{}';
  matched_category_id uuid;
  keyword_record RECORD;
BEGIN
  -- Get message content
  SELECT content INTO message_content
  FROM chat_messages
  WHERE id = message_id_param;

  -- Convert to lowercase for case-insensitive matching
  message_content := lower(message_content);

  -- Find matching category and keywords
  FOR category_record IN
    SELECT id, name
    FROM consultation_categories
  LOOP
    FOR keyword_record IN
      SELECT keyword
      FROM consultation_keywords
      WHERE category_id = category_record.id
    LOOP
      IF position(lower(keyword_record.keyword) in message_content) > 0 THEN
        -- Add keyword to array if not already present
        IF NOT (keyword_record.keyword = ANY(found_keywords)) THEN
          found_keywords := array_append(found_keywords, keyword_record.keyword);
        END IF;
        -- Set category if not already set
        IF matched_category_id IS NULL THEN
          matched_category_id := category_record.id;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Insert analysis if keywords were found
  IF array_length(found_keywords, 1) > 0 THEN
    INSERT INTO consultation_analysis (
      message_id,
      category_id,
      keywords
    ) VALUES (
      message_id_param,
      matched_category_id,
      found_keywords
    );
  END IF;
END;
$$;

-- Create trigger to analyze messages
CREATE OR REPLACE FUNCTION trigger_analyze_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    PERFORM analyze_message(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyze_message_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_analyze_message();

-- Insert default categories
INSERT INTO consultation_categories (name, description)
VALUES
  ('Derecho Laboral', 'Consultas relacionadas con relaciones laborales y derechos de los trabajadores'),
  ('Derecho Familiar', 'Consultas sobre asuntos familiares, divorcios, custodia y herencias'),
  ('Derecho Penal', 'Consultas sobre delitos, procesos penales y defensa criminal'),
  ('Derecho Civil', 'Consultas sobre contratos, obligaciones y derechos civiles'),
  ('Derecho Mercantil', 'Consultas relacionadas con empresas y comercio'),
  ('Derecho Administrativo', 'Consultas sobre relaciones con la administración pública'),
  ('Derecho Constitucional', 'Consultas sobre derechos fundamentales y constitucionales'),
  ('Derecho Inmobiliario', 'Consultas sobre propiedades y bienes raíces'),
  ('Derecho Tributario', 'Consultas sobre impuestos y obligaciones fiscales'),
  ('Derecho Internacional', 'Consultas sobre asuntos legales internacionales')
ON CONFLICT (name) DO NOTHING;

-- Insert keywords for each category
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Derecho Laboral
  SELECT id INTO cat_id FROM consultation_categories WHERE name = 'Derecho Laboral';
  INSERT INTO consultation_keywords (category_id, keyword)
  VALUES
    (cat_id, 'despido'),
    (cat_id, 'prestaciones'),
    (cat_id, 'indemnización'),
    (cat_id, 'liquidación'),
    (cat_id, 'contrato de trabajo'),
    (cat_id, 'salario'),
    (cat_id, 'horas extras'),
    (cat_id, 'seguridad social'),
    (cat_id, 'ars'),
    (cat_id, 'afp'),
    (cat_id, 'sindicato'),
    (cat_id, 'reinstalación'),
    (cat_id, 'renuncia'),
    (cat_id, 'permiso laboral'),
    (cat_id, 'jornada laboral'),
    (cat_id, 'vacaciones'),
    (cat_id, 'licencia de maternidad'),
    (cat_id, 'licencia de paternidad')
  ON CONFLICT (category_id, keyword) DO NOTHING;

  -- Derecho Familiar
  SELECT id INTO cat_id FROM consultation_categories WHERE name = 'Derecho Familiar';
  INSERT INTO consultation_keywords (category_id, keyword)
  VALUES
    (cat_id, 'divorcio'),
    (cat_id, 'pensión alimenticia'),
    (cat_id, 'custodia'),
    (cat_id, 'régimen de visitas'),
    (cat_id, 'filiación'),
    (cat_id, 'tutela'),
    (cat_id, 'adopción'),
    (cat_id, 'separación de bienes'),
    (cat_id, 'bienes gananciales'),
    (cat_id, 'concubinato'),
    (cat_id, 'unión libre'),
    (cat_id, 'herencia'),
    (cat_id, 'testamento'),
    (cat_id, 'partición de bienes'),
    (cat_id, 'violencia intrafamiliar')
  ON CONFLICT (category_id, keyword) DO NOTHING;

  -- Continue with other categories...
END $$;