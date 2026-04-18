import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
}

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  sort_order: number;
}

export default function AllSubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const loadData = async () => {
      setLoading(true);

      const [{ data: categoryData }, { data: subcategoriesData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .order('sort_order'),
      ]);

      if (categoryData) setCategory(categoryData);
      if (subcategoriesData) setSubcategories(subcategoriesData);
      setLoading(false);
    };

    loadData();

    const channel = supabase
      .channel(`subcategories_${categoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${categoryId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );

  if (!category)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Category not found</div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-4">
              {category.icon_url && (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: category.bg_color }}>
                  <img src={category.icon_url} alt={category.name} className="h-9 w-9 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{category.name}</h1>
                <p className="text-sm text-muted-foreground">{subcategories.length} subcategories</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {subcategories.length === 0 ? (
            <p className="text-center text-muted-foreground">No subcategories available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/${categoryId}/subcategory/${sub.id}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors flex-1">{sub.name}</h3>
                    {sub.link && (
                      <a
                        href={sub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.preventDefault()}
                        className="ml-3 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
