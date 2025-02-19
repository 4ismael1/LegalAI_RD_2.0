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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view categories" ON consultation_categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON consultation_categories;
DROP POLICY IF EXISTS "Everyone can view keywords" ON consultation_keywords;
DROP POLICY IF EXISTS "Only admins can modify keywords" ON consultation_keywords;
DROP POLICY IF EXISTS "Everyone can view analysis" ON consultation_analysis;
DROP POLICY IF EXISTS "System can insert analysis" ON consultation_analysis;

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS analyze_message_trigger ON chat_messages;

-- Create new trigger
CREATE TRIGGER analyze_message_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_analyze_message();

-- Insert default categories
DO $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Insert categories one by one to handle dependencies
  INSERT INTO consultation_categories (name, description)
  VALUES ('Derecho Laboral', 'Consultas relacionadas con relaciones laborales y derechos de los trabajadores')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_category_id;

  -- Insert keywords for Derecho Laboral
  IF v_category_id IS NOT NULL THEN
    INSERT INTO consultation_keywords (category_id, keyword)
    VALUES
      (v_category_id, 'despido'),
      (v_category_id, 'prestaciones'),
      (v_category_id, 'indemnización'),
      (v_category_id, 'liquidación'),
      (v_category_id, 'contrato de trabajo'),
      (v_category_id, 'salario'),
      (v_category_id, 'horas extras'),
      (v_category_id, 'seguridad social'),
      (v_category_id, 'ars'),
      (v_category_id, 'afp'),
      (v_category_id, 'sindicato'),
      (v_category_id, 'reinstalación'),
      (v_category_id, 'renuncia'),
      (v_category_id, 'permiso laboral'),
      (v_category_id, 'jornada laboral'),
      (v_category_id, 'vacaciones'),
      (v_category_id, 'licencia de maternidad'),
      (v_category_id, 'licencia de paternidad')
    ON CONFLICT (category_id, keyword) DO NOTHING;
  END IF;

  -- Insert Derecho Familiar
  INSERT INTO consultation_categories (name, description)
  VALUES ('Derecho Familiar', 'Consultas sobre asuntos familiares, divorcios, custodia y herencias')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_category_id;

  -- Insert keywords for Derecho Familiar
  IF v_category_id IS NOT NULL THEN
    INSERT INTO consultation_keywords (category_id, keyword)
    VALUES
      (v_category_id, 'divorcio'),
      (v_category_id, 'pensión alimenticia'),
      (v_category_id, 'custodia'),
      (v_category_id, 'régimen de visitas'),
      (v_category_id, 'filiación'),
      (v_category_id, 'tutela'),
      (v_category_id, 'adopción'),
      (v_category_id, 'separación de bienes'),
      (v_category_id, 'bienes gananciales'),
      (v_category_id, 'concubinato'),
      (v_category_id, 'unión libre'),
      (v_category_id, 'herencia'),
      (v_category_id, 'testamento'),
      (v_category_id, 'partición de bienes'),
      (v_category_id, 'violencia intrafamiliar')
    ON CONFLICT (category_id, keyword) DO NOTHING;
  END IF;

  -- Insert remaining categories
  INSERT INTO consultation_categories (name, description)
  VALUES
    ('Derecho Penal', 'Consultas sobre delitos, procesos penales y defensa criminal'),
    ('Derecho Civil', 'Consultas sobre contratos, obligaciones y derechos civiles'),
    ('Derecho Mercantil', 'Consultas relacionadas con empresas y comercio'),
    ('Derecho Administrativo', 'Consultas sobre relaciones con la administración pública'),
    ('Derecho Constitucional', 'Consultas sobre derechos fundamentales y constitucionales'),
    ('Derecho Inmobiliario', 'Consultas sobre propiedades y bienes raíces'),
    ('Derecho Tributario', 'Consultas sobre impuestos y obligaciones fiscales'),
    ('Derecho Internacional', 'Consultas sobre asuntos legales internacionales')
  ON CONFLICT (name) DO NOTHING;
END $$;