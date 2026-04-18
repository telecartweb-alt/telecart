import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, ArrowLeft, ExternalLink, Star, Info, List } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
  is_visible: boolean;
  sort_order: number;
}

interface CategoryDownload {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
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

const defaultCategoryButtons = [
  { label: 'Try For Free', is_visible: true },
  { label: 'Get Quote', is_visible: true },
  { label: 'Call Now', is_visible: true },
  { label: 'Contact', is_visible: true },
];

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [downloads, setDownloads] = useState<CategoryDownload[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [subcategoriesTabLabel, setSubcategoriesTabLabel] = useState('Subcategories');
  const [detailHeading, setDetailHeading] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" /> },
    { key: 'subcategories', label: subcategoriesTabLabel, icon: <List className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (!id) return;

    const loadCategoryData = async () => {
      const [
        { data: categoryData },
        { data: subcategoryData },
        { data: downloadData },
        { data: featureData },
        { data: subFeatureData },
        { data: buttonData },
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('id', id).single(),
        supabase.from('subcategories').select('*').eq('category_id', id).order('sort_order'),
        supabase.from('category_downloads').select('*').eq('category_id', id).limit(5),
        supabase.from('category_features').select('*').eq('category_id', id).order('sort_order'),
        supabase.from('category_sub_features').select('*').order('sort_order'),
        supabase.from('category_buttons').select('*').eq('category_id', id).order('sort_order'),
      ]);

      if (categoryData) {
        setCategory(categoryData);
        setSubcategoriesTabLabel(categoryData.subcategories_tab_label || 'Subcategories');
        setDetailHeading(categoryData.detail_heading || `About ${categoryData.name}`);
        setDetailDescription(
          categoryData.detail_description || `Explore all subcategories, download resources, and discover key features related to ${categoryData.name}.`,
        );
      }
      if (subcategoryData) setSubcategories(subcategoryData);
      if (downloadData) setDownloads(downloadData);
      if (featureData) {
        setFeatures(
          featureData.map((feature) => ({
            ...feature,
            sub_features: (subFeatureData || []).filter((subFeature) => subFeature.feature_id === feature.id),
          })),
        );
      }

      if (buttonData && buttonData.length > 0) {
        setButtons(buttonData);
      } else if (id) {
        const defaultRecords = defaultCategoryButtons.map((button, index) => ({
          category_id: id,
          label: button.label,
          is_visible: button.is_visible,
          sort_order: index,
        }));
        const { data: insertedButtons } = await supabase.from('category_buttons').insert(defaultRecords).select();
        if (insertedButtons && insertedButtons.length > 0) {
          setButtons(insertedButtons);
        } else {
          setButtons(
            defaultCategoryButtons.map((button, index) => ({
              id: `default-${index}`,
              category_id: id,
              label: button.label,
              is_visible: button.is_visible,
              sort_order: index,
            })),
          );
        }
      }
    };

    loadCategoryData();

    const channel = supabase
      .channel(`category_detail_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${id}` }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${id}` }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads', filter: `category_id=eq.${id}` }, loadCategoryData)
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

  const handleButtonLabelChange = (index: number, value: string) => {
    setButtons((current) => current.map((button, idx) => (idx === index ? { ...button, label: value } : button)));
  };

  const handleButtonVisibilityChange = (index: number, value: boolean) => {
    setButtons((current) => current.map((button, idx) => (idx === index ? { ...button, is_visible: value } : button)));
  };

  const handleSaveAll = async () => {
    if (!id) return;
    setIsSaving(true);

    try {
      if (category) {
        await saveCategoryField({
          subcategories_tab_label: subcategoriesTabLabel.trim() || 'Subcategories',
          detail_heading: detailHeading.trim() || `About ${category.name}`,
          detail_description:
            detailDescription.trim() || `Explore all subcategories, download resources, and discover key features related to ${category.name}.`,
        });
      }

      // First, delete all existing buttons for this category to ensure clean state
      await supabase.from('category_buttons').delete().eq('category_id', id);

      // Then insert all current buttons
      const buttonPayloads = buttons.map((button, index) => ({
        category_id: id,
        label: button.label.trim() || 'Button',
        is_visible: button.is_visible,
        sort_order: index,
      }));

      if (buttonPayloads.length > 0) {
        const { data: insertedButtons, error: insertError } = await supabase
          .from('category_buttons')
          .insert(buttonPayloads)
          .select('*');

        if (insertError) {
          console.error('Error saving buttons:', insertError);
        } else if (insertedButtons) {
          setButtons(insertedButtons);
        }
      }

      await Promise.all(subcategories.map((sub) =>
        supabase.from('subcategories').update({ name: sub.name.trim() }).eq('id', sub.id),
      ));

      // Refresh buttons from database to confirm
      const { data: refreshedButtons, error: refreshError } = await supabase
        .from('category_buttons')
        .select('*')
        .eq('category_id', id)
        .order('sort_order');
      
      if (refreshError) {
        console.error('Error refreshing buttons:', refreshError);
      } else if (refreshedButtons) {
        setButtons(refreshedButtons);
      }
    } finally {
      setIsSaving(false);
    }
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
                <p className="text-sm text-muted-foreground">
                  0.0 <span className="ml-1">(0 reviews)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(index)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === index ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
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
          {activeTab === 0 && (
            <div className="max-w-3xl">
              <h2 className="mb-4 text-lg font-bold">
                {isAdmin ? (
                  <input
                    type="text"
                    value={detailHeading}
                    onChange={(event) => setDetailHeading(event.target.value)}
                    className="w-full rounded-lg border border-border bg-transparent px-2 py-1 text-lg font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                ) : (
                  detailHeading || `About ${category.name}`
                )}
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                {isAdmin ? (
                  <textarea
                    value={detailDescription}
                    onChange={(event) => setDetailDescription(event.target.value)}
                    className="min-h-[88px] w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                ) : (
                  detailDescription || `Explore all subcategories, download resources, and discover key features related to ${category.name}.`
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                {buttons.filter((button) => button.is_visible).map((button) => (
                  <a
                    key={button.id}
                    href="#"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    {button.label}
                  </a>
                ))}
              </div>

              {isAdmin && (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {buttons.map((button, index) => (
                      <div key={button.id || index} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={button.label}
                            onChange={(event) => handleButtonLabelChange(index, event.target.value)}
                            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          />
                          <Switch
                            checked={button.is_visible}
                            onCheckedChange={(visible) => handleButtonVisibilityChange(index, visible)}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {button.is_visible ? 'Visible' : 'Hidden'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-8">
                <h3 className="mb-3 text-base font-semibold">Downloads</h3>
                {downloads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No downloads available.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {downloads.slice(0, 5).map((download) => (
                      <a
                        key={download.id}
                        href={download.file_url}
                        download
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        <Download className="h-4 w-4 text-primary" />
                        <span className="max-w-[180px] truncate">{download.file_name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((sub) => (
                <Link 
                  key={sub.id} 
                  to={`/category/${id}/subcategory/${sub.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <span className="max-w-full text-sm font-medium group-hover:text-primary transition-colors">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {sub.name}
                    </span>
                  </span>
                  {sub.link && (
                    <a 
                      href={sub.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:text-primary/80"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </Link>
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
