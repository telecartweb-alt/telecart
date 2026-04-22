-- Create category_products table
CREATE TABLE public.category_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read category_products" ON public.category_products FOR SELECT USING (true);
CREATE POLICY "Admin write category_products" ON public.category_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_category_products_category_id ON public.category_products(category_id);
