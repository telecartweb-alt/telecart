-- Add second schedule fields to subcategories
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS schedule_link_2 TEXT,
ADD COLUMN IF NOT EXISTS show_schedule_2_in_separate_tab BOOLEAN DEFAULT false;

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Ensure read policy remains
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subcategories'
      AND policyname = 'Public read subcategories'
  ) THEN
    CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subcategories'
      AND policyname = 'Admin write subcategories'
  ) THEN
    CREATE POLICY "Admin write subcategories" ON public.subcategories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;
