import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCards from '@/components/home/FeaturedCards';
import CategoriesSection from '@/components/home/CategoriesSection';
import OffersSection from '@/components/home/OffersSection';
import Ads1ColSection from '@/components/home/Ads1ColSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
}

const SECTION_MAP: Record<string, React.FC<{ sectionId: string }>> = {
  hero: HeroSection as any,
  cards: FeaturedCards,
  categories: CategoriesSection,
  offers: OffersSection,
  ads_1col: Ads1ColSection,
  ads_2col: Ads2ColSection,
  ads_3col: Ads3ColSection,
};

export default function Index() {
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    // Initial fetch
    const loadSections = async () => {
      const { data } = await supabase.from('page_sections').select('*').order('sort_order');
      if (data) setSections(data);
    };
    
    loadSections();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('page_sections_homepage')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          // Refetch sections when any change happens
          loadSections();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {sections.filter(s => s.is_visible).map((section) => {
          const Component = SECTION_MAP[section.section_type];
          if (!Component) return null;
          
          // Hero section doesn't need sectionId
          if (section.section_type === 'hero') {
            return <Component key={section.id} />;
          }
          
          return <Component key={section.id} sectionId={section.id} />;
        })}
      </main>
      <Footer />
    </div>
  );
}
