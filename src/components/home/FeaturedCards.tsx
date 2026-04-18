import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';

interface Card {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  sort_order: number;
  link: string | null;
  section_id: string;
  is_fixed: boolean;
}

interface FeaturedCardsProps {
  sectionId: string;
}

export default function FeaturedCards({ sectionId }: FeaturedCardsProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [heading, setHeading] = useState('Featured Companies');
  const [showHeading, setShowHeading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 3;
  const fixedMode = cards.some((card) => card.is_fixed);
  const cardsToDisplay = fixedMode ? cards.slice(0, 3) : cards;
  const needsCarousel = !fixedMode && cards.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(cards.length, visibleCount, needsCarousel);

  useEffect(() => {
    const loadCards = () => {
      supabase
        .from('featured_cards')
        .select('*')
        .eq('section_id', sectionId)
        .order('sort_order')
        .then(({ data }) => {
          if (data) {
            setCards((data as any[]).map((card) => ({
              ...card,
              link: card.link ?? null,
              is_fixed: card.is_fixed ?? false,
            })));
          }
        });
    };

    const loadSection = async () => {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data) {
        setHeading(data.heading || 'Featured Companies');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadCards();
    loadSection();

    const cardsChannel = supabase
      .channel(`featured_cards_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'featured_cards' },
        loadCards
      )
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        loadSection
      )
      .subscribe();

    return () => {
      cardsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [sectionId]);

  const displayCards = useMemo(
    () => !fixedMode && needsCarousel ? [...cardsToDisplay, ...cardsToDisplay.slice(0, duplicatedCount)] : cardsToDisplay,
    [cardsToDisplay, duplicatedCount, fixedMode, needsCarousel]
  );

  if (cards.length === 0) return null;

  const raisedCardIndex =
    !isMobile && needsCarousel ? (index + 1) % cardsToDisplay.length : -1;

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {showHeading && (
          <h2 className="mb-6 text-2xl md:text-3xl font-semibold">
            {heading}
          </h2>
        )}
        {needsCarousel ? (
          <div className="relative">
            <div className="overflow-hidden py-6">
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayCards.map((card, displayIndex) => {
                  const realIndex = displayIndex % cardsToDisplay.length;
                  const isRaised = realIndex === raisedCardIndex;

                  const handleCardClick = () => {
                    if (card.link) {
                      window.open(card.link, '_blank', 'noopener,noreferrer');
                    }
                  };

                  return (
                    <div
                      key={`${card.id}-${displayIndex}`}
                      className="flex-none px-2.5"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <div
                        onClick={handleCardClick}
                        className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer ${
                          isRaised
                            ? 'bg-card shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
                            : 'bg-[#fcf9f5]'
                        } ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                      >
                        {card.logo_url && (
                          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
                            <img
                              src={card.logo_url}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <h3 className="mb-2 text-2xl font-semibold leading-tight flex items-center gap-2">
                          {card.title}
                          {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex ${cardsToDisplay.length < 3 ? 'justify-center' : ''}`}>
            {cardsToDisplay.map((card, index) => {
              const handleCardClick = () => {
                if (card.link) {
                  window.open(card.link, '_blank', 'noopener,noreferrer');
                }
              };

              return (
                <div key={card.id} className={`${cardsToDisplay.length < 3 ? 'w-[calc(33.333%-10px)]' : 'flex-1'} px-2.5`}>
                  <div
                    onClick={handleCardClick}
                    className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer ${
                      index === 1
                        ? 'bg-card shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
                        : 'bg-[#fcf9f5]'
                    } ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                  >
                    {card.logo_url && (
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
                        <img
                          src={card.logo_url}
                          alt={card.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2">
                      {card.title}
                      {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {needsCarousel && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate(`/featured-cards/${sectionId}`)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-6 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              See All
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
