import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScopedPageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  is_locked: boolean;
  heading: string;
  description: string | null;
  show_heading: boolean;
}

interface UseScopedSectionInstancesOptions {
  tableName: string;
  scopeColumn: string;
  scopeValue: string;
}

const SECTION_LABELS: Record<string, string> = {
  cards: 'Featured Cards',
  offers: 'Offers & Discounts',
  ads_1col: '1-Column Ad',
  ads_2col: '2-Column Ads',
  ads_3col: '3-Column Ads',
  logo_steps: 'Logo Steps',
};

const SECTION_HEADINGS: Record<string, string> = {
  cards: 'Featured Companies',
  offers: 'Offers & Discounts',
  ads_1col: 'Featured Ad',
  ads_2col: '2 Column Ads',
  ads_3col: '3 Column Ads',
  logo_steps: 'How It Helps You',
};

export function useScopedSectionInstances({ tableName, scopeColumn, scopeValue }: UseScopedSectionInstancesOptions) {
  const db = supabase as any;
  const [sections, setSections] = useState<ScopedPageSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    if (!scopeValue) return;

    setLoading(true);

    try {
      const { data } = await db
        .from(tableName)
        .select('*')
        .eq(scopeColumn, scopeValue)
        .order('sort_order', { ascending: true });

      setSections((data || []) as ScopedPageSection[]);
    } finally {
      setLoading(false);
    }
  }, [db, scopeColumn, scopeValue, tableName]);

  useEffect(() => {
    if (!scopeValue) return;

    fetchSections();

    const channel = supabase
      .channel(`${tableName}_${scopeValue}_sections`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `${scopeColumn}=eq.${scopeValue}`,
        },
        fetchSections
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSections, scopeColumn, scopeValue, tableName]);

  const addSection = async (sectionType: string, customName?: string) => {
    const matchingSections = sections.filter((section) => section.section_type === sectionType);
    const nextSort = sections.length;
    const nextCount = matchingSections.length + 1;

    const { data, error } = await db
      .from(tableName)
      .insert({
        [scopeColumn]: scopeValue,
        section_type: sectionType,
        name: customName?.trim() || `${SECTION_LABELS[sectionType] || sectionType} ${nextCount}`,
        heading: SECTION_HEADINGS[sectionType] || SECTION_LABELS[sectionType] || sectionType,
        sort_order: nextSort,
        is_visible: true,
        is_locked: false,
        show_heading: true,
      })
      .select()
      .single();

    if (error) throw error;

    await fetchSections();
    return data as ScopedPageSection;
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await db.from(tableName).delete().eq('id', sectionId);
    if (error) throw error;
    await fetchSections();
  };

  const updateSection = async (sectionId: string, payload: Record<string, unknown>) => {
    const { error } = await db.from(tableName).update(payload).eq('id', sectionId);
    if (error) throw error;
    await fetchSections();
  };

  return {
    sections,
    loading,
    addSection,
    deleteSection,
    updateSection,
    refetch: fetchSections,
  };
}
