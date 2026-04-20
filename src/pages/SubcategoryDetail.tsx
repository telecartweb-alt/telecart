import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Download, ArrowLeft, Info, Play, Maximize2, X, Package, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?`;
};

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const defaultCategoryButtons = [
  { label: 'Try For Free', is_visible: true },
  { label: 'Get Quote', is_visible: true },
  { label: 'Call Now', is_visible: true },
  { label: 'Contact', is_visible: true },
];

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  video_url?: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  detail_heading?: string | null;
  detail_description?: string | null;
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

interface CategoryProduct {
  id: string;
  title: string;
  link: string;
  sort_order: number;
}

interface ProductCardItem {
  id: string;
  title: string;
  link: string;
}

export default function SubcategoryDetail() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const { isAdmin } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [downloads, setDownloads] = useState<CategoryDownload[]>([]);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [detailHeading, setDetailHeading] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" /> },
  ];

  if (subcategory?.video_url) {
    tabs.push({ key: 'resources', label: 'Resources', icon: <Play className="h-4 w-4" /> });
  }

  tabs.push({ key: 'downloads', label: 'Downloads', icon: <Download className="h-4 w-4" /> });
  tabs.push({ key: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> });

  const resourcesTabIndex = tabs.findIndex((tab) => tab.key === 'resources');
  const downloadsTabIndex = tabs.findIndex((tab) => tab.key === 'downloads');
  const productsTabIndex = tabs.findIndex((tab) => tab.key === 'products');
  const productItems: ProductCardItem[] = [
    ...(subcategory?.link?.trim()
      ? [
          {
            id: `subcategory-${subcategory.id}`,
            title: subcategory.name,
            link: subcategory.link.trim(),
          },
        ]
      : []),
    ...products.map((product) => ({
      id: `category-product-${product.id}`,
      title: product.title,
      link: product.link,
    })),
  ];

  const saveCategoryField = async (payload: Partial<Category>) => {
    if (!categoryId) return;
    await supabase.from('categories').update(payload).eq('id', categoryId);
    setCategory((current) => (current ? { ...current, ...payload } : current));
  };

  const handleButtonLabelChange = (index: number, value: string) => {
    setButtons((current) => current.map((button, idx) => (idx === index ? { ...button, label: value } : button)));
  };

  const handleButtonVisibilityChange = (index: number, value: boolean) => {
    setButtons((current) => current.map((button, idx) => (idx === index ? { ...button, is_visible: value } : button)));
  };

  const handleSaveAll = async () => {
    if (!categoryId || !category) return;
    setIsSaving(true);

    try {
      await saveCategoryField({
        detail_heading: detailHeading.trim() || `About ${category.name}`,
        detail_description:
          detailDescription.trim() || `Explore all subcategories, download resources, and discover key features related to ${category.name}.`,
      });

      await supabase.from('category_buttons').delete().eq('category_id', categoryId);

      const buttonPayloads = buttons.map((button, index) => ({
        category_id: categoryId,
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

      const { data: refreshedButtons, error: refreshError } = await supabase
        .from('category_buttons')
        .select('*')
        .eq('category_id', categoryId)
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

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    const loadData = async () => {
      const [{ data: categoryData }, { data: subcategoryData }, { data: downloadData }, { data: productData }, { data: buttonData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('category_downloads').select('*').eq('category_id', categoryId).limit(5),
        supabase.from('category_products').select('*').eq('category_id', categoryId).order('sort_order'),
        supabase.from('category_buttons').select('*').eq('category_id', categoryId).order('sort_order'),
      ]);

      if (categoryData) {
        setCategory(categoryData);
        setDetailHeading(categoryData.detail_heading || `About ${categoryData.name}`);
        setDetailDescription(
          categoryData.detail_description || `Explore all subcategories, download resources, and discover key features related to ${categoryData.name}.`,
        );
      }
      if (subcategoryData) setSubcategory(subcategoryData);
      if (downloadData) setDownloads(downloadData);
      if (productData) setProducts(productData);

      if (buttonData && buttonData.length > 0) {
        setButtons(buttonData);
      } else {
        setButtons(
          defaultCategoryButtons.map((button, index) => ({
            id: `default-${index}`,
            category_id: categoryId,
            label: button.label,
            is_visible: button.is_visible,
            sort_order: index,
          })),
        );
      }
    };

    loadData();

    const channel = supabase
      .channel(`subcategory_detail_${subcategoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_products', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons', filter: `category_id=eq.${categoryId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, subcategoryId]);

  if (!category || !subcategory) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <Link to={`/category/${categoryId}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to {category.name}
            </Link>
            <div className="flex items-center gap-4">
              {category.icon_url && (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: category.bg_color }}>
                  <img src={category.icon_url} alt={category.name} className="h-9 w-9 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{subcategory.name}</h1>
                <p className="mt-1 inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">Under {category.name} </p>

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
                    {tab.label}
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
            </div>
          )}

          {activeTab === resourcesTabIndex && subcategory.video_url && (() => {
            const youtubeId = getYouTubeVideoId(subcategory.video_url);
            const isYouTube = youtubeId !== null;

            return (
              <div className="max-w-sm">
                <h2 className="mb-6 text-lg font-bold">Resources</h2>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="aspect-video bg-muted relative group">
                      {isYouTube ? (
                        <iframe
                          src={getYouTubeEmbedUrl(youtubeId)}
                          title="Video Resource"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          <video
                            src={subcategory.video_url}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors pointer-events-none" onClick={() => setShowVideoFullscreen(true)}>
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary group-hover:scale-110 transition-transform cursor-pointer">
                              <Play className="h-6 w-6 text-primary-foreground fill-current" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        
                        <p className="text-sm text-muted-foreground">
                          {isYouTube ? 'YouTube video' : 'Click play icon for fullscreen'}
                        </p>
                      </div>
                      {!isYouTube && (
                        <button
                          onClick={() => setShowVideoFullscreen(true)}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === downloadsTabIndex && (
            <div className="max-w-3xl">
              <h2 className="mb-6 text-lg font-bold">Downloads</h2>
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
          )}

          {activeTab === productsTabIndex && (
            <div className="max-w-5xl">
              <h2 className="mb-6 text-lg font-bold">Products</h2>
              {productItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products available.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {productItems.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        const externalUrl = normalizeExternalUrl(product.link);
                        if (externalUrl) {
                          window.open(externalUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      <span className="truncate pr-4 text-base font-medium text-foreground">
                        {product.title}
                      </span>
                      <span className="flex-shrink-0 text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Video Fullscreen Modal */}
      {showVideoFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <button
            onClick={() => setShowVideoFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <video
            src={subcategory.video_url!}
            controls
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            className="max-w-full max-h-full"
            style={{ width: '95vw', height: '95vh', objectFit: 'contain' }}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
