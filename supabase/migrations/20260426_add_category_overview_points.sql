ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS overview_points_heading TEXT;

CREATE TABLE IF NOT EXISTS public.category_overview_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_overview_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'category_overview_points'
          AND policyname = 'Public read overview points'
    ) THEN
        CREATE POLICY "Public read overview points"
        ON public.category_overview_points
        FOR SELECT
        USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'category_overview_points'
          AND policyname = 'Admin write overview points'
    ) THEN
        CREATE POLICY "Admin write overview points"
        ON public.category_overview_points
        FOR ALL
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;
