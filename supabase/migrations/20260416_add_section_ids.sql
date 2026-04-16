-- Add section_id column to content tables to link them to specific section instances
-- This allows each section instance to have its own unique content

-- Featured Cards
ALTER TABLE public.featured_cards ADD COLUMN section_id UUID;

-- Categories
ALTER TABLE public.categories ADD COLUMN section_id UUID;

-- Subcategories reference will still use category_id (no change needed)

-- Offers
ALTER TABLE public.offers ADD COLUMN section_id UUID;

-- Ads 2-column
ALTER TABLE public.ads_2col ADD COLUMN section_id UUID;

-- Ads 3-column
ALTER TABLE public.ads_3col ADD COLUMN section_id UUID;

-- Migrate existing data: if section_id is NULL, it means this is the original/default section
-- Find the default sections for each type and set their items to those sections
DO $$
DECLARE
  cards_section_id UUID;
  categories_section_id UUID;
  offers_section_id UUID;
  ads_2col_section_id UUID;
  ads_3col_section_id UUID;
BEGIN
  -- Get the IDs of the first (default) section of each type
  SELECT id INTO cards_section_id FROM public.page_sections WHERE section_type = 'cards' ORDER BY sort_order LIMIT 1;
  SELECT id INTO categories_section_id FROM public.page_sections WHERE section_type = 'categories' ORDER BY sort_order LIMIT 1;
  SELECT id INTO offers_section_id FROM public.page_sections WHERE section_type = 'offers' ORDER BY sort_order LIMIT 1;
  SELECT id INTO ads_2col_section_id FROM public.page_sections WHERE section_type = 'ads_2col' ORDER BY sort_order LIMIT 1;
  SELECT id INTO ads_3col_section_id FROM public.page_sections WHERE section_type = 'ads_3col' ORDER BY sort_order LIMIT 1;

  -- Update existing items to reference their default sections
  UPDATE public.featured_cards SET section_id = cards_section_id WHERE section_id IS NULL;
  UPDATE public.categories SET section_id = categories_section_id WHERE section_id IS NULL;
  UPDATE public.offers SET section_id = offers_section_id WHERE section_id IS NULL;
  UPDATE public.ads_2col SET section_id = ads_2col_section_id WHERE section_id IS NULL;
  UPDATE public.ads_3col SET section_id = ads_3col_section_id WHERE section_id IS NULL;
END $$;

-- Add foreign key constraints
ALTER TABLE public.featured_cards ADD CONSTRAINT featured_cards_section_id_fk FOREIGN KEY (section_id) REFERENCES public.page_sections(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD CONSTRAINT categories_section_id_fk FOREIGN KEY (section_id) REFERENCES public.page_sections(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD CONSTRAINT offers_section_id_fk FOREIGN KEY (section_id) REFERENCES public.page_sections(id) ON DELETE CASCADE;
ALTER TABLE public.ads_2col ADD CONSTRAINT ads_2col_section_id_fk FOREIGN KEY (section_id) REFERENCES public.page_sections(id) ON DELETE CASCADE;
ALTER TABLE public.ads_3col ADD CONSTRAINT ads_3col_section_id_fk FOREIGN KEY (section_id) REFERENCES public.page_sections(id) ON DELETE CASCADE;

-- Make section_id NOT NULL and set defaults
ALTER TABLE public.featured_cards ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE public.offers ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE public.ads_2col ALTER COLUMN section_id SET NOT NULL;
ALTER TABLE public.ads_3col ALTER COLUMN section_id SET NOT NULL;
