-- Add section_id to featured_cards if not exists
ALTER TABLE public.featured_cards 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_sections(id) ON DELETE CASCADE;

-- Add section_id to ads_2col if not exists
ALTER TABLE public.ads_2col 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_sections(id) ON DELETE CASCADE;

-- Add section_id to ads_3col if not exists
ALTER TABLE public.ads_3col 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_sections(id) ON DELETE CASCADE;

-- Add section_id to offers if not exists
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_sections(id) ON DELETE CASCADE;

-- Add section_id to categories if not exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_sections(id) ON DELETE CASCADE;
