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
}

interface Ads3ColSectionProps {
  sectionId: string;
}

export default function Ads3ColSection({ sectionId }: Ads3ColSectionProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('3 Column Ads');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  
  // Dynamic layout based on number of ads
  let visibleCount: number;
  if (ads.length < 3) {
    // Use 2-column layout for 1-2 ads
    visibleCount = isMobile ? 1 : 2;
  } else {
    // Use 3-column layout for 3+ ads
    visibleCount = isMobile ? 1 : 3;
  }
  
  const needsCarousel = ads.length > visibleCount;
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
      supabase.from('ads_3col').select('*').eq('section_id', sectionId).order('sort_order').then(({ data }) => {
        if (data) setAds(data);
      });
    };

    const loadSection = async () => {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data) {
        setHeading(data.heading || '3 Column Ads');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_3col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAds)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_3col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadSection)
      .subscribe();

    return () => {
      adsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [sectionId]);

  const displayAds = useMemo(
    () => [...ads, ...ads.slice(0, duplicatedCount)],
    [ads, duplicatedCount],
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
                      className={`block overflow-hidden rounded-xl bg-muted ${
                        ads.length < 3
                          ? 'h-[180px] md:h-[300px]'
                          : 'aspect-[16/9]'
                      }`}
                    >
                      {ad.image_url && <img src={ad.image_url} alt="Ad" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            {ads.map((ad) => (
              <div key={ad.id} className="flex-1 px-2.5">
                <a
                  href={ad.link || '#'}
                  className={`block overflow-hidden rounded-xl bg-muted ${
                    ads.length < 3
                      ? 'h-[180px] md:h-[300px]'
                      : 'aspect-[16/9]'
                  }`}
                >
                  {ad.image_url && <img src={ad.image_url} alt="Ad" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
