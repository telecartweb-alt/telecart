CREATE TABLE IF NOT EXISTS public.subcategory_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('cards', 'offers', 'ads_1col', 'ads_2col', 'ads_3col')),
  name TEXT NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  description TEXT,
  show_heading BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategory_featured_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section_id UUID NOT NULL REFERENCES public.subcategory_page_sections(id) ON DELETE CASCADE,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategory_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  heading TEXT NOT NULL,
  description TEXT,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section_id UUID NOT NULL REFERENCES public.subcategory_page_sections(id) ON DELETE CASCADE,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategory_ads_2col (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section_id UUID NOT NULL REFERENCES public.subcategory_page_sections(id) ON DELETE CASCADE,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategory_ads_3col (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  heading TEXT,
  description TEXT,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  section_id UUID NOT NULL REFERENCES public.subcategory_page_sections(id) ON DELETE CASCADE,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategory_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_featured_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_ads_2col ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_ads_3col ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_page_sections' AND policyname = 'Public read subcategory page sections'
  ) THEN
    CREATE POLICY "Public read subcategory page sections" ON public.subcategory_page_sections FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_page_sections' AND policyname = 'Admin write subcategory page sections'
  ) THEN
    CREATE POLICY "Admin write subcategory page sections" ON public.subcategory_page_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_featured_cards' AND policyname = 'Public read subcategory featured cards'
  ) THEN
    CREATE POLICY "Public read subcategory featured cards" ON public.subcategory_featured_cards FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_featured_cards' AND policyname = 'Admin write subcategory featured cards'
  ) THEN
    CREATE POLICY "Admin write subcategory featured cards" ON public.subcategory_featured_cards FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_offers' AND policyname = 'Public read subcategory offers'
  ) THEN
    CREATE POLICY "Public read subcategory offers" ON public.subcategory_offers FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_offers' AND policyname = 'Admin write subcategory offers'
  ) THEN
    CREATE POLICY "Admin write subcategory offers" ON public.subcategory_offers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_ads_2col' AND policyname = 'Public read subcategory ads 2col'
  ) THEN
    CREATE POLICY "Public read subcategory ads 2col" ON public.subcategory_ads_2col FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_ads_2col' AND policyname = 'Admin write subcategory ads 2col'
  ) THEN
    CREATE POLICY "Admin write subcategory ads 2col" ON public.subcategory_ads_2col FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_ads_3col' AND policyname = 'Public read subcategory ads 3col'
  ) THEN
    CREATE POLICY "Public read subcategory ads 3col" ON public.subcategory_ads_3col FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subcategory_ads_3col' AND policyname = 'Admin write subcategory ads 3col'
  ) THEN
    CREATE POLICY "Admin write subcategory ads 3col" ON public.subcategory_ads_3col FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS subcategory_page_sections_subcategory_id_idx ON public.subcategory_page_sections(subcategory_id, sort_order);
CREATE INDEX IF NOT EXISTS subcategory_featured_cards_section_id_idx ON public.subcategory_featured_cards(section_id, sort_order);
CREATE INDEX IF NOT EXISTS subcategory_offers_section_id_idx ON public.subcategory_offers(section_id, sort_order);
CREATE INDEX IF NOT EXISTS subcategory_ads_2col_section_id_idx ON public.subcategory_ads_2col(section_id, sort_order);
CREATE INDEX IF NOT EXISTS subcategory_ads_3col_section_id_idx ON public.subcategory_ads_3col(section_id, sort_order);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategory_featured_cards_updated_at') THEN
      CREATE TRIGGER update_subcategory_featured_cards_updated_at
      BEFORE UPDATE ON public.subcategory_featured_cards
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategory_offers_updated_at') THEN
      CREATE TRIGGER update_subcategory_offers_updated_at
      BEFORE UPDATE ON public.subcategory_offers
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;

INSERT INTO public.subcategory_page_sections (subcategory_id, section_type, name, heading, sort_order, is_visible, is_locked, show_heading)
SELECT
  s.id,
  defaults.section_type,
  defaults.name,
  defaults.heading,
  defaults.sort_order,
  true,
  false,
  true
FROM public.subcategories s
CROSS JOIN (
  VALUES
    ('cards', 'Featured Cards 1', 'Featured Companies', 0),
    ('offers', 'Offers & Discounts 1', 'Offers & Discounts', 1),
    ('ads_1col', '1-Column Ad 1', 'Featured Ad', 2),
    ('ads_2col', '2-Column Ads 1', '2 Column Ads', 3),
    ('ads_3col', '3-Column Ads 1', '3 Column Ads', 4)
) AS defaults(section_type, name, heading, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subcategory_page_sections existing
  WHERE existing.subcategory_id = s.id
    AND existing.section_type = defaults.section_type
);
