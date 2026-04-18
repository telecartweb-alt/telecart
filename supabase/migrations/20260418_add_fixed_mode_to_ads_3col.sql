-- Add is_fixed column to ads_3col so Fixed Mode can be persisted
ALTER TABLE public.ads_3col
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.ads_3col
SET is_fixed = false
WHERE is_fixed IS NULL;
