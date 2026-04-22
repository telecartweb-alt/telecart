-- Add form link fields to subcategories table
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS form_link TEXT,
ADD COLUMN IF NOT EXISTS show_form_in_separate_tab BOOLEAN DEFAULT false;
