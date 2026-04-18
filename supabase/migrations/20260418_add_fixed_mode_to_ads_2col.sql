-- Add is_fixed column to ads_2col so Fixed Mode can be persisted
ALTER TABLE public.ads_2col
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.ads_2col
SET is_fixed = false
WHERE is_fixed IS NULL;
