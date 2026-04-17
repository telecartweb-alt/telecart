import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type SearchResult =
  | { id: string; type: 'category'; name: string }
  | { id: string; type: 'subcategory'; name: string; categoryId: string };

export default function HeroSection() {
  const navigate = useNavigate();
  const [mainText, setMainText] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('hero_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setMainText(data.main_text);
          setWords(data.animated_words);
        }
      });
  }, []);

  useEffect(() => {
    if (words.length === 0) return;

    const word = words[currentWord];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayed(word.substring(0, displayed.length + 1));
        if (displayed.length + 1 === word.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayed(word.substring(0, displayed.length - 1));
        if (displayed.length === 0) {
          setIsDeleting(false);
          setCurrentWord((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentWord, words]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const searchTerm = query.trim();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      const [{ data: categories, error: categoriesError }, { data: subcategories, error: subcategoriesError }] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .order('sort_order'),
        supabase
          .from('subcategories')
          .select('id, category_id, name')
          .ilike('name', `%${searchTerm}%`)
          .order('sort_order'),
      ]);

      if (categoriesError || subcategoriesError) {
        setSearchError('Unable to search right now.');
        setSearchResults([]);
      } else {
        const categoryResults: SearchResult[] = (categories || []).map((category) => ({
        id: category.id,
        type: 'category' as const,
        name: category.name,
      }));

      const subcategoryResults: SearchResult[] = (subcategories || []).map((subcategory) => ({
        id: subcategory.id,
        type: 'subcategory' as const,
        name: subcategory.name,
        categoryId: subcategory.category_id,
      }));

      setSearchResults([...categoryResults, ...subcategoryResults].slice(0, 10));
      }

      setIsSearching(false);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  function handleResultClick(result: SearchResult) {
    if (result.type === 'category') {
      navigate(`/category/${result.id}`);
      return;
    }

    navigate(`/category/${result.categoryId}/subcategory/${result.id}`);
  }

  function handleSearchButton() {
    if (searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  }

  return (
    <section
      id="hero"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ backgroundColor: '#fcfbf3' }}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">

        {/* HEADING */}
        <h1
  className="mb-4 text-[#1c1c1c] text-[28px] sm:text-[34px] md:text-[44px] font-extrabold leading-[1.3]"
  style={{
    fontFamily: 'Trustpilot Display, Arial, sans-serif',
  }}
>
  {mainText}
</h1>


        {/* ANIMATED TEXT */}
        <div
          className="h-16 flex items-center justify-center"
          style={{
            fontFamily: 'Trustpilot Display, Arial, sans-serif',
            fontSize: '28px',
            fontWeight: 60,
          }}
        >
          <span className="text-[#61646b]">
            {displayed}
            <span className="inline-block w-[6px] h-[1em] bg-[#61646b] ml-1 animate-pulse" />
          </span>
        </div>

        {/* SEARCH */}
        <div className="mt-10 flex justify-center">
          <div
            className={`w-full max-w-lg md:max-w-2xl rounded-[32px] border bg-white transition-all duration-300 ${
              isSearchActive
                ? 'border-[#6b7cff]'
                : 'border-[#dcd6d1]'
            }`}
            style={{
             boxShadow: isSearchActive
  ? '0 10px 24px rgba(45,89,255,0.18)'
  : '0 2px 6px rgba(28,28,28,0.12), 0 1px 3px rgba(28,28,28,0.08)',


            }}
            onMouseEnter={() => setIsSearchActive(true)}
            onMouseLeave={() => setIsSearchActive(false)}
          >

            {/* INPUT */}
            <div className="relative flex items-center">
              <input
                type="search"
                placeholder="Search company or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => setTimeout(() => setIsSearchActive(false), 100)}
                className="w-full h-[64px] rounded-[32px] bg-transparent pl-6 pr-20 text-[16px] outline-none"
                style={{
                  fontFamily: 'Trustpilot Sans, Poppins, sans-serif',
                  fontWeight: 450,
                }}
              />

              {/* BUTTON */}
              <button
                type="button"
                onClick={handleSearchButton}
                className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3c57bc] text-white shadow-[0_8px_16px_rgba(47,93,255,0.18)] hover:bg-[#244ce5]"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </button>
            </div>

            {/* DROPDOWN INSIDE */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isSearchActive ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-[#e5e0d8]" />

              <div className="px-5 py-4">
                <p className="mb-3 text-sm font-semibold text-[#1c1c1c]">
                  {query.trim() ? 'Search results' : 'Suggested searches'}
                </p>

                <div className="space-y-2">
                  {query.trim() ? (
                    isSearching ? (
                      <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                        Searching...
                      </div>
                    ) : searchError ? (
                      <div className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#b91c1c]">
                        {searchError}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                        No results found. Try another keyword.
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onMouseDown={() => setIsSearchActive(true)}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm text-[#61646b] hover:bg-[#f5f5f5]"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="11" cy="11" r="7" />
                            <line x1="16.65" y1="16.65" x2="21" y2="21" />
                          </svg>

                          <span className="flex-1">
                            {result.name}
                            <span className="ml-2 text-xs text-[#8a8f9a]">
                              {result.type === 'category' ? 'Category' : 'Subcategory'}
                            </span>
                          </span>
                        </button>
                      ))
                    )
                  ) : (
                    [
                      'Best payment service',
                      'Jewelry store in Los Angeles',
                      'Sunglasses store in New York',
                      'Bank near me',
                      'Affiliate marketing service',
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={() => setIsSearchActive(true)}
                        onClick={() => setQuery(item)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm text-[#61646b] hover:bg-[#f5f5f5]"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <line x1="16.65" y1="16.65" x2="21" y2="21" />
                        </svg>

                        {item}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
