import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface FeaturedCard {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
}

interface PageSection {
  id: string;
  heading: string;
  show_heading: boolean;
}

export default function FeaturedCardsPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [section, setSection] = useState<PageSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;

    const loadData = async () => {
      setLoading(true);
      
      const [{ data: cardsData }, { data: sectionData }] = await Promise.all([
        supabase
          .from('featured_cards')
          .select('*')
          .eq('section_id', sectionId)
          .order('sort_order'),
        supabase
          .from('page_sections')
          .select('*')
          .eq('id', sectionId)
          .single(),
      ]);

      if (cardsData) setCards(cardsData);
      if (sectionData) setSection(sectionData);
      setLoading(false);
    };

    loadData();

    const channel = supabase
      .channel(`featured_cards_page_${sectionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_cards', filter: `section_id=eq.${sectionId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections', filter: `id=eq.${sectionId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sectionId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-muted-foreground">Loading...</div>
    </div>
  );

  if (!section) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-muted-foreground">Section not found</div>
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
            <h1 className="text-2xl font-bold">{section.heading}</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {cards.length === 0 ? (
            <p className="text-center text-muted-foreground">No featured cards available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex flex-col h-full">
                    {card.logo_url && (
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                        <img
                          src={card.logo_url}
                          alt={card.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                      {card.title}
                      {card.link && (
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                    {card.link && (
                      <a
                        href={card.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-auto"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
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
