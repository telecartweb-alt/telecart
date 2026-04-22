ALTER TABLE public.featured_cards
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.ads_2col
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.ads_3col
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subcategory_featured_cards
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subcategory_offers
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subcategory_ads_2col
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subcategory_ads_3col
ADD COLUMN IF NOT EXISTS show_border BOOLEAN NOT NULL DEFAULT false;
