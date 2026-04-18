-- Add is_fixed column to featured_cards so Fixed Mode can be persisted
ALTER TABLE public.featured_cards
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.featured_cards
SET is_fixed = false
WHERE is_fixed IS NULL;
