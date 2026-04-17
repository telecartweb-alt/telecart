-- Add lock state for page sections to prevent drag reordering when fixed
ALTER TABLE public.page_sections
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

UPDATE public.page_sections
SET is_locked = false
WHERE is_locked IS NULL;
