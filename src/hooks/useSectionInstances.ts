import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type PageSection = Database['public']['Tables']['page_sections']['Row'];

export const useSectionInstances = () => {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('page_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setSections(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sections';
      setError(message);
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchSections();

    const subscription = supabase
      .channel('page_sections_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          fetchSections();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create new section instance
  const addSection = async (
    sectionType: string,
    customName?: string
  ): Promise<PageSection | null> => {
    try {
      // Get the max sort_order for this section type
      const { data: existingSections } = await supabase
        .from('page_sections')
        .select('sort_order')
        .eq('section_type', sectionType)
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxSort = existingSections?.[0]?.sort_order ?? -1;
      const newSort = maxSort + 1;

      // Generate default name if not provided
      const typeNames: Record<string, string> = {
        cards: 'Featured Cards',
        categories: 'Categories',
        offers: 'Offers & Discounts',
        ads_2col: '2-Column Ads',
        ads_3col: '3-Column Ads',
      };

      const baseType = typeNames[sectionType] || sectionType;
      
      // Count existing sections of this type to add a number
      const { count } = await supabase
        .from('page_sections')
        .select('*', { count: 'exact' })
        .eq('section_type', sectionType);

      const nextNumber = (count || 0) + 1;
      const name = customName || `${baseType} ${nextNumber}`;

      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          section_type: sectionType,
          name,
          sort_order: newSort,
          is_visible: true,
        })
        .select()
        .single();

      if (error) throw error;
      setError(null);
      // Immediately refetch to ensure UI updates
      await fetchSections();
      return data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add section';
      setError(message);
      console.error('Error adding section:', err);
      return null;
    }
  };

  // Delete section instance
  const deleteSection = async (sectionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      // Immediately refetch to ensure UI updates
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete section';
      setError(message);
      console.error('Error deleting section:', err);
      return false;
    }
  };

  // Toggle section visibility
  const toggleVisibility = async (sectionId: string, isVisible: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ is_visible: isVisible })
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      // Immediately refetch to ensure UI updates
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update visibility';
      setError(message);
      console.error('Error toggling visibility:', err);
      return false;
    }
  };

  // Update section name
  const updateSectionName = async (sectionId: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ name })
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      // Immediately refetch to ensure UI updates
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update section name';
      setError(message);
      console.error('Error updating section name:', err);
      return false;
    }
  };

  // Update sort order (for drag and drop)
  const updateSortOrder = async (sectionId: string, newSortOrder: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ sort_order: newSortOrder })
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      // Immediately refetch to ensure UI updates
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sort order';
      setError(message);
      console.error('Error updating sort order:', err);
      return false;
    }
  };

  // Update section heading
  const updateHeading = async (sectionId: string, heading: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ heading })
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update heading';
      setError(message);
      console.error('Error updating heading:', err);
      return false;
    }
  };

  // Toggle show heading
  const toggleShowHeading = async (sectionId: string, showHeading: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ show_heading: showHeading })
        .eq('id', sectionId);

      if (error) throw error;
      setError(null);
      await fetchSections();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle heading visibility';
      setError(message);
      console.error('Error toggling heading visibility:', err);
      return false;
    }
  };

  // Group sections by type
  const sectionsByType = sections.reduce((acc, section) => {
    if (!acc[section.section_type]) {
      acc[section.section_type] = [];
    }
    acc[section.section_type].push(section);
    return acc;
  }, {} as Record<string, PageSection[]>);

  return {
    sections,
    sectionsByType,
    loading,
    error,
    addSection,
    deleteSection,
    toggleVisibility,
    updateSectionName,
    updateSortOrder,
    updateHeading,
    toggleShowHeading,
    refetch: fetchSections,
  };
};
