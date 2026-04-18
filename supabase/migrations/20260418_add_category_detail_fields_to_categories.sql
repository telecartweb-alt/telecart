-- Add editable detail fields for category detail pages
ALTER TABLE public.categories
  ADD COLUMN subcategories_tab_label text,
  ADD COLUMN detail_heading text,
  ADD COLUMN detail_description text;
