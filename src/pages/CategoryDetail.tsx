import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ExternalLink, List } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  subcategories_tab_label?: string | null;
  detail_heading?: string | null;
  detail_description?: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
}

interface CategoryButton {
  id?: string;
  category_id: string;
  label: string;
  link?: string | null;
  is_visible: boolean;
  sort_order: number;
}

interface Feature {
  id: string;
  title: string;
  description: string | null;
  sub_features: SubFeature[];
}

interface SubFeature {
  id: string;
  title: string;
  description: string | null;
  feature_id: string;
}

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [detailDescription, setDetailDescription] = useState('');
  const [subcategoriesTabLabel, setSubcategoriesTabLabel] = useState('Subcategories');
  const [activeTab, setActiveTab] = useState(1);

  const tabs = [
    { key: 'subcategories', label: subcategoriesTabLabel, icon: <List className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (!id) return;

    const loadCategoryData = async () => {
      const [
        { data: categoryData },
        { data: subcategoryData },
        { data: featureData },
        { data: subFeatureData },
        { data: buttonData },
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('id', id).single(),
        supabase.from('subcategories').select('*').eq('category_id', id).order('sort_order'),
        supabase.from('category_features').select('*').eq('category_id', id).order('sort_order'),
        supabase.from('category_sub_features').select('*').order('sort_order'),
        supabase.from('category_buttons').select('*').eq('category_id', id).order('sort_order'),
      ]);

      if (categoryData) {
        setCategory(categoryData);
        setSubcategoriesTabLabel(categoryData.subcategories_tab_label || 'Subcategories');
        setDetailDescription(categoryData.detail_description || '');
      }
      if (subcategoryData) setSubcategories(subcategoryData);
      if (featureData) {
        setFeatures(
          featureData.map((feature) => ({
            ...feature,
            sub_features: (subFeatureData || []).filter((subFeature) => subFeature.feature_id === feature.id),
          })),
        );
      }
      if (buttonData) setButtons(buttonData);
    };

    loadCategoryData();

    const channel = supabase
      .channel(`category_detail_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${id}` }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${id}` }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_features', filter: `category_id=eq.${id}` }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_sub_features' }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons', filter: `category_id=eq.${id}` }, loadCategoryData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const saveCategoryField = async (payload: Partial<Category>) => {
    if (!id) return;
    await supabase.from('categories').update(payload).eq('id', id);
    setCategory((current) => (current ? { ...current, ...payload } : current));
  };

  if (!category) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

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
                {detailDescription && (
                  <p className="mt-2 text-sm text-muted-foreground">{detailDescription}</p>
                )}
              </div>
            </div>

            {buttons.filter((b) => b.is_visible).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {buttons.filter((b) => b.is_visible).map((button) => (
                  <a
                    key={button.id}
                    href={normalizeExternalUrl(button.link || '') || '#'}
                    target={button.link ? '_blank' : undefined}
                    rel={button.link ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    {button.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(index + 1)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === index + 1 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    {isAdmin && tab.key === 'subcategories' ? (
                      <input
                        type="text"
                        value={subcategoriesTabLabel}
                        onChange={(event) => setSubcategoriesTabLabel(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onBlur={() => {
                          void saveCategoryField({
                            subcategories_tab_label: subcategoriesTabLabel.trim() || 'Subcategories',
                          });
                        }}
                        className="w-28 rounded-lg border border-border bg-transparent px-2 py-1 text-sm font-medium text-current outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    ) : (
                      tab.label
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {activeTab === 1 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <Link
                    to={`/category/${id}/subcategory/${sub.id}`}
                    className="group min-w-0 flex-1"
                  >
                    <span className="block max-w-full text-sm font-medium group-hover:text-primary transition-colors">
                      <span className="text-base font-medium group-hover:text-primary transition-colors">
                        {sub.name}
                      </span>
                    </span>
                  </Link>
                  {sub.link && (
                    <button
                      type="button"
                      className="ml-3 flex-shrink-0 text-primary hover:text-primary/80"
                      onClick={() => {
                        const externalUrl = normalizeExternalUrl(sub.link!);
                        if (externalUrl) {
                          window.open(externalUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      aria-label={`Open ${sub.name} link`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {subcategories.length === 0 && <p className="text-muted-foreground">No subcategories available.</p>}
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              {features.length === 0 && <p className="text-muted-foreground">No features listed.</p>}
              {features.map((feature) => (
                <div key={feature.id}>
                  <h3 className="mb-3 text-base font-bold">{feature.title}</h3>
                  {feature.description && <p className="mb-4 text-sm text-muted-foreground">{feature.description}</p>}
                  {feature.sub_features.length > 0 && (
                    <div className="rounded-xl bg-muted/50 p-5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {feature.sub_features.map((subFeature) => (
                          <div key={subFeature.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3">
                            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                            <span className="text-sm font-medium">{subFeature.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
