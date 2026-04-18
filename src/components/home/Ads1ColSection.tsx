import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
}

interface Ads1ColSectionProps {
  sectionId: string;
}

export default function Ads1ColSection({ sectionId }: Ads1ColSectionProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('Featured Ad');
  const [showHeading, setShowHeading] = useState(true);

  useEffect(() => {
    const loadAds = () => {
      supabase
        .from('ads_2col')
        .select('*')
        .eq('section_id', sectionId)
        .order('sort_order')
        .then(({ data }) => {
          if (data) {
            setAds(
              (data as any[]).map((ad) => ({
                ...ad,
                is_fixed: ad.is_fixed ?? false,
              }))
            );
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
        setHeading(data.heading || 'Featured Ad');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_1col_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ads_2col' },
        loadAds
      )
      .subscribe();

    const sectionChannel = supabase
      .channel(`page_sections_1col_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        loadSection
      )
      .subscribe();

    return () => {
      adsChannel.unsubscribe();
      sectionChannel.unsubscribe();
    };
  }, [sectionId]);

  const ad = ads[0];
  if (!ad) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {showHeading && (
          <h2 className="mb-6 text-2xl md:text-3xl font-semibold">
            {heading}
          </h2>
        )}

        {/* ✅ Reduced border radius */}
        <div className="rounded-[12px] overflow-hidden bg-muted shadow-sm">
          <a
            href={ad.link || '#'}
            className="block overflow-hidden rounded-[12px] transition-transform duration-300 hover:scale-[1.01]"
          >
            {/* ✅ Banner size */}
            <div className="h-[110px] md:h-[130px] lg:h-[140px] w-full bg-[#f5f5f5] flex items-center justify-center">
              {ad.image_url && (
                <img
                  src={ad.image_url}
                  alt="Ad"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
