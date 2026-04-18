import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';

interface Ad {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
}

interface Ads2ColSectionProps {
  sectionId: string;
}

export default function Ads2ColSection({ sectionId }: Ads2ColSectionProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('2 Column Ads');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 2;
  const fixedMode = ads.some((ad) => ad.is_fixed);
  const adsToDisplay = fixedMode ? ads.slice(0, 2) : ads;
  const needsCarousel = !fixedMode && ads.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(ads.length, visibleCount, needsCarousel);

  useEffect(() => {
    const loadAds = () => {
      supabase.from('ads_2col').select('*').eq('section_id', sectionId).order('sort_order').then(({ data }) => {
        if (data) {
          setAds((data as any[]).map((ad) => ({
            ...ad,
            is_fixed: ad.is_fixed ?? false,
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
        setHeading(data.heading || '2 Column Ads');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_2col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_2col' }, loadAds)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_2col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadSection)
      .subscribe();

    return () => {
      adsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [sectionId]);

  const displayAds = useMemo(
    () => !fixedMode && needsCarousel ? [...adsToDisplay, ...adsToDisplay.slice(0, duplicatedCount)] : adsToDisplay,
    [adsToDisplay, duplicatedCount, fixedMode, needsCarousel],
  );

  if (ads.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {showHeading && (
          <h2 className="mb-6 text-2xl md:text-3xl font-semibold">
            {heading}
          </h2>
        )}
        {needsCarousel ? (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayAds.map((ad, displayIndex) => (
                  <div
                    key={`${ad.id}-${displayIndex}`}
                    className="flex-none px-2.5"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <a
                      href={ad.link || '#'}
                      className="block h-[160px] md:h-[300px] overflow-hidden rounded-xl bg-muted"
                    >
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt="Ad"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      )}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            {adsToDisplay.map((ad) => (
              <div key={ad.id} className="flex-1 px-2.5">
                <a
                  href={ad.link || '#'}
                  className="block h-[180px] md:h-[300px] overflow-hidden rounded-xl bg-muted"
                >
                  {ad.image_url && (
                    <img
                      src={ad.image_url}
                      alt="Ad"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
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
