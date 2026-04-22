ALTER TABLE public.page_sections
ADD COLUMN description TEXT;

UPDATE public.page_sections
SET description = NULL
WHERE section_type = 'ads_3col';
