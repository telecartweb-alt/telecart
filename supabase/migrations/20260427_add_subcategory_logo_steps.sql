ALTER TABLE public.subcategory_page_sections
DROP CONSTRAINT IF EXISTS subcategory_page_sections_section_type_check;

ALTER TABLE public.subcategory_page_sections
ADD CONSTRAINT subcategory_page_sections_section_type_check
CHECK (section_type IN ('cards', 'offers', 'ads_1col', 'ads_2col', 'ads_3col', 'logo_steps'));

CREATE TABLE IF NOT EXISTS public.subcategory_logo_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section_id UUID NOT NULL REFERENCES public.subcategory_page_sections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_logo_steps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subcategory_logo_steps'
      AND policyname = 'Public read subcategory logo steps'
  ) THEN
    CREATE POLICY "Public read subcategory logo steps"
    ON public.subcategory_logo_steps
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subcategory_logo_steps'
      AND policyname = 'Admin write subcategory logo steps'
  ) THEN
    CREATE POLICY "Admin write subcategory logo steps"
    ON public.subcategory_logo_steps
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS subcategory_logo_steps_section_id_idx
ON public.subcategory_logo_steps(section_id, sort_order);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategory_logo_steps_updated_at') THEN
      CREATE TRIGGER update_subcategory_logo_steps_updated_at
      BEFORE UPDATE ON public.subcategory_logo_steps
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;
