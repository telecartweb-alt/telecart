-- Add is_fixed column to offers so Fixed Mode can be persisted
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.offers
SET is_fixed = false
WHERE is_fixed IS NULL;
