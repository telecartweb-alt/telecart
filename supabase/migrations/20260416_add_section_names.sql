-- Add 'name' column to page_sections table for custom section naming
ALTER TABLE public.page_sections ADD COLUMN name TEXT;

-- Set default names for existing sections based on section_type
UPDATE public.page_sections SET name = 
  CASE 
    WHEN section_type = 'hero' THEN 'Hero Section'
    WHEN section_type = 'cards' THEN 'Featured Cards'
    WHEN section_type = 'categories' THEN 'Categories'
    WHEN section_type = 'offers' THEN 'Offers & Discounts'
    WHEN section_type = 'ads_2col' THEN '2-Column Ads'
    WHEN section_type = 'ads_3col' THEN '3-Column Ads'
    ELSE section_type
  END
WHERE name IS NULL;

-- Make name NOT NULL
ALTER TABLE public.page_sections ALTER COLUMN name SET NOT NULL;

-- Add constraint to ensure name is not empty
ALTER TABLE public.page_sections ADD CONSTRAINT page_sections_name_not_empty CHECK (name != '');
