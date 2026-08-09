import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { getBrandActionLinks } from '@/components/shared/BrandActionLinks';
import { buildHierarchicalSearchResults } from '@/lib/searchHierarchy';
import { requireAuthenticationBeforeOpeningLink } from '@/lib/authGuard';
import { openZohoProtectedLink } from '@/lib/zohoLink';

type SearchResultType = 'category' | 'subcategory' | 'brand' | 'brand_action_link' | 'section';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandName?: string; // For subcategory results that show a brand
  link?: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
  // For brands
  action_links?: Array<{
    id?: string;
    text?: string | null;
    url?: string | null;
    new_tab?: boolean;
    enabled?: boolean;
  }>;
  action_link_1_text?: string | null;
  action_link_1_url?: string | null;
  action_link_1_new_tab?: boolean;
  action_link_1_enabled?: boolean;
  action_link_2_text?: string | null;
  action_link_2_url?: string | null;
  action_link_2_new_tab?: boolean;
  action_link_2_enabled?: boolean;
  action_link_3_text?: string | null;
  action_link_3_url?: string | null;
  action_link_3_new_tab?: boolean;
  action_link_3_enabled?: boolean;
}

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  isSearchActive: boolean;
  setIsSearchActive: (v: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (v: number) => void;
  handleResultClick: (result: SearchResult) => void;
  handleSearchButton: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showHeaderSearch: boolean;
  showMobileStickySearch: boolean;
  searchContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  heroSearchContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  blurTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [showMobileStickySearch, setShowMobileStickySearch] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastRequestRef = useRef<number>(0);
  const requestIdCounterRef = useRef<number>(0);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const heroSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll detection for header search
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 100;
      const scrolled = window.scrollY > scrollThreshold;
      console.log('[SearchContext] handleScroll called', { scrollY: window.scrollY, scrolled, isMobile });

      // Desktop: show header search when scrolled
      // Mobile: never show header search, but show sticky search when scrolled
      if (isMobile) {
        setShowHeaderSearch(false);
        setShowMobileStickySearch(scrolled);
      } else {
        setShowHeaderSearch(scrolled);
        setShowMobileStickySearch(false);
      }
    };

    const handleResize = () => {
      console.log('[SearchContext] handleResize called', { innerWidth: window.innerWidth, innerHeight: window.innerHeight });
    };

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        console.log('[SearchContext] handleVisualViewportResize called', { width: window.visualViewport.width, height: window.visualViewport.height });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize);

    handleScroll(); // Call once to set initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
    };
  }, [isMobile]);

  // Log state changes
  useEffect(() => {
    console.log('[SearchContext] State updated', { showHeaderSearch, showMobileStickySearch, isSearchActive, isMobile });
  }, [showHeaderSearch, showMobileStickySearch, isSearchActive, isMobile]);

  // Search logic with proper request tracking and cleanup
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      setSelectedIndex(-1);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const searchTerm = query.trim();
    requestIdCounterRef.current += 1;
    const requestId = requestIdCounterRef.current;
    lastRequestRef.current = requestId;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || lastRequestRef.current !== requestId) {
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setSelectedIndex(-1);

      try {
        const [
          { data: categories, error: categoriesError },
          { data: subcategories, error: subcategoriesError },
          { data: brandMatches, error: brandMatchesError },
          { data: sections, error: sectionsError },
        ] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
          (supabase as any)
            .from('subcategories')
            .select('id, category_id, name, custom_link, custom_link_type, subcategory_brands(*)')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
          (supabase as any)
            .from('subcategory_brands')
            .select('id, name, link, subcategory_id, subcategories(id, name, category_id, custom_link, custom_link_type), action_links, action_link_1_text, action_link_1_url, action_link_1_new_tab, action_link_1_enabled, action_link_2_text, action_link_2_url, action_link_2_new_tab, action_link_2_enabled, action_link_3_text, action_link_3_url, action_link_3_new_tab, action_link_3_enabled')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
          supabase
            .from('page_sections')
            .select('id, section_type, heading, name')
            .eq('is_visible', true)
            .in('section_type', ['cards', 'offers', 'ads_3col'])
            .or(`heading.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
        ]);

        if (!mountedRef.current || lastRequestRef.current !== requestId) {
          return;
        }

        console.log('[SearchContext] searchTerm:', searchTerm);
        console.log('[SearchContext] categories:', categories, 'error:', categoriesError);
        console.log('[SearchContext] subcategories:', subcategories, 'error:', subcategoriesError);
        console.log('[SearchContext] brandMatches:', brandMatches, 'error:', brandMatchesError);

        if (categoriesError || subcategoriesError || brandMatchesError) {
          console.error('[SearchContext] errors:', { categoriesError, subcategoriesError, brandMatchesError });
          setSearchError('Unable to search right now.');
          setResults([]);
        } else {
          const mappedResults = buildHierarchicalSearchResults({
            query: searchTerm,
            categories: (categories || []).map((category: any) => ({
              id: category.id,
              name: category.name,
            })),
            subcategories: (subcategories || []).map((subcategory: any) => ({
              id: subcategory.id,
              category_id: subcategory.category_id,
              name: subcategory.name,
              custom_link: subcategory.custom_link,
              custom_link_type: subcategory.custom_link_type,
              subcategory_brands: (subcategory.subcategory_brands || []).map((brand: any) => ({
                id: brand.id,
                name: brand.name,
                link: brand.link,
              })),
            })),
            brands: (brandMatches || []).map((brand: any) => ({
              id: brand.id,
              name: brand.name,
              subcategory_id: brand.subcategory_id,
              link: brand.link,
              subcategories: brand.subcategories,
              action_links: brand.action_links,
              action_link_1_text: brand.action_link_1_text,
              action_link_1_url: brand.action_link_1_url,
              action_link_1_new_tab: brand.action_link_1_new_tab,
              action_link_1_enabled: brand.action_link_1_enabled,
              action_link_2_text: brand.action_link_2_text,
              action_link_2_url: brand.action_link_2_url,
              action_link_2_new_tab: brand.action_link_2_new_tab,
              action_link_2_enabled: brand.action_link_2_enabled,
              action_link_3_text: brand.action_link_3_text,
              action_link_3_url: brand.action_link_3_url,
              action_link_3_new_tab: brand.action_link_3_new_tab,
              action_link_3_enabled: brand.action_link_3_enabled,
            })),
            sections: (sections || []).map((section: any) => ({
              id: section.id,
              heading: section.heading,
              name: section.name,
            })),
          });

          const finalResults: SearchResult[] = mappedResults.map((result) => ({
            ...result,
            type: result.type as SearchResultType,
          }));

          console.log('[SearchContext] finalResults:', finalResults);
          setResults(finalResults);
        }
      } catch (error) {
        if (!mountedRef.current || lastRequestRef.current !== requestId) return;
        setSearchError('Unable to search right now.');
        setResults([]);
      } finally {
        if (mountedRef.current && lastRequestRef.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [query]);

  // Reset search state on route change
  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsSearchActive(false);
    setSelectedIndex(-1);
    setSearchError(null);
  }, [location.pathname]);

  // Cleanup effect for mountedRef
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const openSearchLink = useCallback(
    (
      value: string | null | undefined,
      fallbackPath?: string,
      options?: { type?: string; entityId?: string | null }
    ) => {
      if (!value) {
        if (fallbackPath) {
          requireAuthenticationBeforeOpeningLink({
            destination: fallbackPath,
            type: options?.type ?? 'search-result',
            entityId: options?.entityId ?? null,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(fallbackPath);
            },
          });
        }
        return;
      }

      const normalizedValue = value.trim();
      if (!normalizedValue) {
        if (fallbackPath) {
          requireAuthenticationBeforeOpeningLink({
            destination: fallbackPath,
            type: options?.type ?? 'search-result',
            entityId: options?.entityId ?? null,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(fallbackPath);
            },
          });
        }
        return;
      }

      const openValue = () => {
        if (/^(mailto|tel):/i.test(normalizedValue)) {
          window.location.href = normalizedValue;
          return;
        }

        try {
          const url = new URL(normalizedValue);
          void openZohoProtectedLink({
            destination: url.toString(),
            navigate,
            target: '_blank',
            onError: () => undefined,
          });
          return;
        } catch {
          if (/^https?:\/\//i.test(normalizedValue) || normalizedValue.startsWith('www.')) {
            const resolved = normalizedValue.startsWith('http') ? normalizedValue : `https://${normalizedValue}`;
            void openZohoProtectedLink({
              destination: resolved,
              navigate,
              target: '_blank',
              onError: () => undefined,
            });
          } else if (normalizedValue.startsWith('/') || normalizedValue.startsWith('#')) {
            navigate(normalizedValue);
          } else if (fallbackPath) {
            navigate(fallbackPath);
          }
        }
      };

      requireAuthenticationBeforeOpeningLink({
        destination: normalizedValue,
        type: options?.type ?? 'search-result',
        entityId: options?.entityId ?? null,
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        navigate,
        onAuthenticated: openValue,
      });
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setIsSearchActive(false);
      setQuery('');

      if (result.type === 'category') {
        requireAuthenticationBeforeOpeningLink({
          destination: `/category/${result.id}`,
          type: 'category',
          entityId: result.id,
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          navigate,
          onAuthenticated: () => {
            navigate(`/category/${result.id}`);
          },
        });
      } else if (result.type === 'subcategory') {
        if (result.custom_link) {
          openSearchLink(result.custom_link, result.categoryId ? `/category/${result.categoryId}/subcategory/${result.id}/brands` : undefined, {
            type: 'subcategory',
            entityId: result.id,
          });
        } else if (result.categoryId) {
          requireAuthenticationBeforeOpeningLink({
            destination: `/category/${result.categoryId}/subcategory/${result.id}/brands`,
            type: 'subcategory',
            entityId: result.id,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(`/category/${result.categoryId}/subcategory/${result.id}/brands`);
            },
          });
        }
      } else if (result.type === 'brand') {
        const hasActionLinks = Boolean(
          result.action_links?.filter((link) => Boolean(link?.text || link?.url)).length ||
          result.action_link_1_url ||
          result.action_link_2_url ||
          result.action_link_3_url
        );

        if (hasActionLinks && result.categoryId && result.subcategoryId) {
          requireAuthenticationBeforeOpeningLink({
            destination: `/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id}/action-links`,
            type: 'brand',
            entityId: result.id,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(`/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id}/action-links`);
            },
          });
        } else if (result.link) {
          openSearchLink(result.link, undefined, {
            type: 'brand',
            entityId: result.id,
          });
        } else if (result.categoryId && result.subcategoryId) {
          requireAuthenticationBeforeOpeningLink({
            destination: `/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id}/action-links`,
            type: 'brand',
            entityId: result.id,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(`/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id}/action-links`);
            },
          });
        }
      } else if (result.type === 'brand_action_link') {
        if (result.link) {
          openSearchLink(result.link, undefined, {
            type: 'brandActionLink',
            entityId: result.id,
          });
        } else if (result.categoryId && result.subcategoryId) {
          requireAuthenticationBeforeOpeningLink({
            destination: `/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id.split('-action-')[0]}/action-links`,
            type: 'brandActionLink',
            entityId: result.id,
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            navigate,
            onAuthenticated: () => {
              navigate(`/category/${result.categoryId}/subcategory/${result.subcategoryId}/brand/${result.id.split('-action-')[0]}/action-links`);
            },
          });
        }
      } else if (result.type === 'section') {
        requireAuthenticationBeforeOpeningLink({
          destination: `/#section-${result.id}`,
          type: 'section',
          entityId: result.id,
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          navigate,
          onAuthenticated: () => {
            navigate(`/#section-${result.id}`);
          },
        });
      }
    },
    [location.hash, location.pathname, location.search, navigate, openSearchLink]
  );

  const handleSearchButton = useCallback(() => {
    if (results.length > 0) {
      handleResultClick(results[0]);
    }
  }, [results, handleResultClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const itemCount = query.trim() ? results.length : 0;
      if (itemCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < itemCount - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    },
    [query, results, selectedIndex, handleResultClick]
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const clickedHeaderSearch = searchContainerRef.current?.contains(event.target as Node);
      const clickedHeroSearch = heroSearchContainerRef.current?.contains(event.target as Node);

      if (!clickedHeaderSearch && !clickedHeroSearch) {
        setIsSearchActive(false);
        setSelectedIndex(-1);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchActive(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        isSearching,
        searchError,
        isSearchActive,
        setIsSearchActive,
        selectedIndex,
        setSelectedIndex,
        handleResultClick,
        handleSearchButton,
        handleKeyDown,
        showHeaderSearch,
        showMobileStickySearch,
        searchContainerRef,
        heroSearchContainerRef,
        blurTimeoutRef,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
