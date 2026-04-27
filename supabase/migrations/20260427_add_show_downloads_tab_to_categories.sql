ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS show_downloads_tab BOOLEAN NOT NULL DEFAULT true;
