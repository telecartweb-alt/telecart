import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';

interface Offer {
  id: string;
  image_url: string | null;
  heading: string;
  description: string | null;
  link: string | null;
  sort_order: number;
}

interface OffersSectionProps {
  sectionId: string;
}

export default function OffersSection({ sectionId }: OffersSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [heading, setHeading] = useState('Offers & Discounts');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 4;
  const needsCarousel = offers.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(offers.length, visibleCount, needsCarousel);

  useEffect(() => {
    const loadOffers = () => {
      supabase.from('offers').select('*').eq('section_id', sectionId).order('sort_order').then(({ data }) => {
        if (data) setOffers(data);
      });
    };

    const loadSection = async () => {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data) {
        setHeading(data.heading || 'Offers & Discounts');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadOffers();
    loadSection();

    const offersChannel = supabase
      .channel(`offers_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, loadOffers)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_offers_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadSection)
      .subscribe();

    return () => {
      offersChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [sectionId]);

  const displayOffers = useMemo(
    () => [...offers, ...offers.slice(0, duplicatedCount)],
    [offers, duplicatedCount],
  );

  if (offers.length === 0) return null;

  return (
    <section id="offers" className="py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Offers & Discounts
          </h2>

          {needsCarousel && (
            <div className="hidden gap-2 md:flex">
              
            </div>
          )}
        </div>

        {needsCarousel ? (
          <div className="relative">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex gap-6"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayOffers.map((offer, displayIndex) => (
                  <div
                    key={`${offer.id}-${displayIndex}`}
                    className="flex-none"
                    style={{ width: `calc(${slideWidth}% - 1.5rem)` }}
                  >
                    <a href={offer.link || '#'} className="block group">
                      {offer.image_url && (
                        <div className="mb-4 h-[px] overflow-hidden rounded-xl bg-muted">
                          <img
                            src={offer.image_url}
                            alt={offer.heading}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="mb-2 text-lg md:text-xl font-semibold line-clamp-1">
                        {offer.heading}
                      </h3>
                      {offer.description && (
                        <p className="text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                          {offer.description}
                        </p>
                      )}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex gap-2 md:hidden justify-center mt-4">
              
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {offers.map((offer) => (
              <div key={offer.id}>
                <a href={offer.link || '#'} className="block group">
                  {offer.image_url && (
                    <div className="mb-4 h-[px] overflow-hidden rounded-xl bg-muted">
                      <img
                        src={offer.image_url}
                        alt={offer.heading}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="mb-2 text-lg md:text-xl font-semibold line-clamp-1">
                    {offer.heading}
                  </h3>
                  {offer.description && (
                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                      {offer.description}
                    </p>
                  )}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
