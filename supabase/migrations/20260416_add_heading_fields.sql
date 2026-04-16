-- Add heading and show_heading fields to page_sections
ALTER TABLE public.page_sections 
ADD COLUMN heading TEXT DEFAULT '',
ADD COLUMN show_heading BOOLEAN DEFAULT true;

-- Update existing sections with default headings
UPDATE public.page_sections SET heading = 'Featured Companies', show_heading = true WHERE section_type = 'cards';
UPDATE public.page_sections SET heading = 'Explore companies by category', show_heading = true WHERE section_type = 'categories';
UPDATE public.page_sections SET heading = 'Offers & Discounts', show_heading = true WHERE section_type = 'offers';
UPDATE public.page_sections SET heading = '2 Column Ads', show_heading = true WHERE section_type = 'ads_2col';
UPDATE public.page_sections SET heading = '3 Column Ads', show_heading = true WHERE section_type = 'ads_3col';
