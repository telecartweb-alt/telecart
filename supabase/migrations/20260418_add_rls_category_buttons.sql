-- Add RLS policies to category_buttons table
ALTER TABLE public.category_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read buttons" ON public.category_buttons FOR SELECT USING (true);

CREATE POLICY "Admin write buttons" ON public.category_buttons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
