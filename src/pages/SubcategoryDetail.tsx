import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Info, Play, Maximize2, X } from 'lucide-react';
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
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
};

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  video_url: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
}

export default function SubcategoryDetail() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);

  const tabs = [
    { label: 'Overview', icon: <Info className="h-4 w-4" /> },
  ];

  if (subcategory?.video_url) {
    tabs.push({ label: 'Resources', icon: <Play className="h-4 w-4" /> });
  }

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    const loadData = async () => {
      const [{ data: categoryData }, { data: subcategoryData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
      ]);

      if (categoryData) setCategory(categoryData);
      if (subcategoryData) setSubcategory(subcategoryData);
    };

    loadData();

    const channel = supabase
      .channel(`subcategory_detail_${subcategoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `id=eq.${subcategoryId}` }, loadData)
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
                <p className="text-sm text-muted-foreground">under {category.name}</p>
              </div>
            </div>
          </div>
        </div>

        {tabs.length > 1 && (
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.label}
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
        )}

        <div className="container mx-auto px-4 py-8">
          {activeTab === 0 && (
            <div className="max-w-3xl">
              <h2 className="mb-4 text-lg font-bold">About {subcategory.name}</h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                Learn more about {subcategory.name} and explore available resources.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
                  Try For Free
                </a>
                <a href="#" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
                  Get Quote
                </a>
                <a href="#" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
                  Call Now
                </a>
                <a href="#" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
                  Contact
                </a>
              </div>
            </div>
          )}

          {activeTab === 1 && subcategory.video_url && (() => {
            const youtubeId = getYouTubeVideoId(subcategory.video_url);
            const isYouTube = youtubeId !== null;

            return (
              <div className="max-w-3xl">
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
                        <h3 className="font-semibold">Video Resource</h3>
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
