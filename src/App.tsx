import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  Bookmark, 
  ChevronRight, 
  RotateCcw, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  ShoppingBag, 
  Tag, 
  Star, 
  Info,
  Calendar,
  X,
  ExternalLink,
  Heart
} from 'lucide-react';
import { Product, ProductCategory, ShoppingPlatform } from './types';
import { CURATED_PRODUCTS, ALL_TAGS } from './data';
import DetailDrawer from './components/DetailDrawer';
import CurateModal from './components/CurateModal';
import { calculateCuratoScore } from './utils';

export default function App() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'popularity' | 'alphabetical' | 'newest' | 'priceAsc' | 'priceDesc' | 'scoreDesc' | 'reviewsDesc'>('recommended');
  
  // New shopping experience filters
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(6000);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<ShoppingPlatform[]>([]);

  // Toggles
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);

  // Data pools
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('curato_custom_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('curato_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals / Selection states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCurateOpen, setIsCurateOpen] = useState(false);
  const [showShortcutsTip, setShowShortcutsTip] = useState(true);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('curato_custom_products', JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    localStorage.setItem('curato_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Combine default with custom products
  const allProducts = useMemo(() => {
    return [...CURATED_PRODUCTS, ...customProducts];
  }, [customProducts]);

  // Image Resolution Pipeline state
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('curato_resolved_images');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      const cleaned: Record<string, string> = {};
      for (const [id, url] of Object.entries(parsed)) {
        if (typeof url === 'string' && !url.includes('unsplash.com')) {
          cleaned[id] = url;
        }
      }
      return cleaned;
    } catch {
      return {};
    }
  });

  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});
  const triggeredResolutionsRef = useRef<Set<string>>(new Set());

  // Sync resolved images with local storage for persistence
  useEffect(() => {
    localStorage.setItem('curato_resolved_images', JSON.stringify(resolvedImages));
  }, [resolvedImages]);

  // Background resolver pipeline
  useEffect(() => {
    allProducts.forEach(async (product) => {
      // Skip if product already has image, or is already resolved, or is in progress
      if (product.image || resolvedImages[product.id] || triggeredResolutionsRef.current.has(product.id)) {
        return;
      }

      // Mark as triggered to avoid duplicate background fetches
      triggeredResolutionsRef.current.add(product.id);
      setResolvingIds(prev => ({ ...prev, [product.id]: true }));

      try {
        const params = new URLSearchParams({
          url: product.url,
          title: product.title,
          brand: product.brand,
          tags: product.tags.join(',')
        });
        const response = await fetch(`/api/resolve-image?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.image) {
            setResolvedImages(prev => ({ ...prev, [product.id]: data.image }));
          }
        }
      } catch (err) {
        console.error(`[App Image Resolver] Error fetching image for ${product.id}:`, err);
      } finally {
        setResolvingIds(prev => ({ ...prev, [product.id]: false }));
      }
    });
  }, [allProducts, resolvedImages]);

  // Dynamic tags available in pool
  const activeTagsPool = useMemo(() => {
    return Array.from(new Set(allProducts.flatMap(p => p.tags))).sort();
  }, [allProducts]);

  // Handle keyboard shortcuts (focusing search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on "/" or "CMD + K" or "CTRL + K"
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape closes modal and drawer
      if (e.key === 'Escape') {
        setSelectedProduct(null);
        setIsCurateOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle saving to wishlist / bookmark
  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  // Add custom product via CurateModal
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'dateAdded'>) => {
    const productWithMeta: Product = {
      ...newProduct,
      id: `custom-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setCustomProducts(prev => [productWithMeta, ...prev]);
  };

  // Toggle tag filter
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Handle search submit or click
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    // Real-time updates mean searchQuery is already synced with state, but this function satisfies manual search execution trigger
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTags([]);
    setFeaturedOnly(false);
    setBookmarksOnly(false);
    setSortBy('recommended');
    setMaxPriceFilter(6000);
    setMinRatingFilter(0);
    setSelectedPlatforms([]);
  };

  // Count items matching a specific category (for badges)
  const getCategoryCount = (category: 'All' | ProductCategory) => {
    if (category === 'All') return allProducts.length;
    return allProducts.filter(p => p.category === category).length;
  };

  // Highlight helper for matched keywords
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-100 text-yellow-950 font-medium px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Perform search, filter, and sort
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];

    console.log("--- FILTER PIPELINE START ---");
    console.log("Initial products:", allProducts.length);
    console.log("searchQuery:", JSON.stringify(searchQuery));
    console.log("selectedCategory:", selectedCategory);
    console.log("selectedTags:", JSON.stringify(selectedTags));
    console.log("featuredOnly:", featuredOnly);
    console.log("bookmarksOnly:", bookmarksOnly);
    console.log("bookmarks length:", bookmarks.length);

    // 1. Better Word-Based Intersection Search
    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      result = result.filter(p => {
        return terms.every(term => {
          const matchTitle = p.title.toLowerCase().includes(term);
          const matchBrand = p.brand.toLowerCase().includes(term);
          const matchDesc = p.description.toLowerCase().includes(term);
          const matchCategory = p.category.toLowerCase().includes(term);
          const matchPlatform = p.platform.toLowerCase().includes(term);
          const matchTags = p.tags.some(t => t.toLowerCase().includes(term));
          return matchTitle || matchBrand || matchDesc || matchCategory || matchPlatform || matchTags;
        });
      });
    }
    console.log("After text search filter:", result.length);

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    console.log("After category filter:", result.length);

    // 3. Multi-tag Filter
    if (selectedTags.length > 0) {
      result = result.filter(p => 
        selectedTags.every(selectedTag => p.tags.includes(selectedTag))
      );
    }
    console.log("After multi-tag filter:", result.length);

    // 4. Price Budget Filter
    result = result.filter(p => p.price <= maxPriceFilter);
    console.log("After price budget filter:", result.length);

    // 5. Rating Floor Filter
    result = result.filter(p => p.rating >= minRatingFilter);
    console.log("After rating floor filter:", result.length);

    // 6. Platform Filter
    if (selectedPlatforms.length > 0) {
      result = result.filter(p => selectedPlatforms.includes(p.platform));
    }
    console.log("After platform filter:", result.length);

    // 7. Featured Toggle Filter
    if (featuredOnly) {
      result = result.filter(p => p.featured);
    }
    console.log("After featured filter:", result.length);

    // 8. Bookmark Toggle Filter
    if (bookmarksOnly) {
      result = result.filter(p => bookmarks.includes(p.id));
    }
    console.log("After bookmark filter:", result.length);
    console.log("--- FILTER PIPELINE END ---");

    // 9. Sorting Options
    result.sort((a, b) => {
      if (sortBy === 'popularity') {
        return b.rating - a.rating; // Use rating as a quality sort
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'newest') {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
      if (sortBy === 'priceAsc') {
        return a.price - b.price;
      }
      if (sortBy === 'priceDesc') {
        return b.price - a.price;
      }
      if (sortBy === 'scoreDesc') {
        return calculateCuratoScore(b).score - calculateCuratoScore(a).score;
      }
      if (sortBy === 'reviewsDesc') {
        return b.reviewCount - a.reviewCount;
      }
      // 'recommended': featured items pinned first, then sorted by Curato Score
      if (sortBy === 'recommended') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return calculateCuratoScore(b).score - calculateCuratoScore(a).score;
      }
      return 0;
    });

    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedTags, featuredOnly, bookmarksOnly, bookmarks, sortBy, maxPriceFilter, minRatingFilter, selectedPlatforms]);

  useEffect(() => {
    let stepInitial = allProducts.length;
    let result = [...allProducts];

    // 1. Text Search Filter (Title, brand, tags, description)
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const matchTitle = p.title.toLowerCase().includes(normalizedQuery);
        const matchBrand = p.brand.toLowerCase().includes(normalizedQuery);
        const matchDesc = p.description.toLowerCase().includes(normalizedQuery);
        const matchTags = p.tags.some(t => t.toLowerCase().includes(normalizedQuery));
        return matchTitle || matchBrand || matchDesc || matchTags;
      });
    }
    let stepSearch = result.length;

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    let stepCategory = result.length;

    // 3. Multi-tag Filter
    if (selectedTags.length > 0) {
      result = result.filter(p => 
        selectedTags.every(selectedTag => p.tags.includes(selectedTag))
      );
    }
    let stepTags = result.length;

    // 4. Featured Toggle Filter
    if (featuredOnly) {
      result = result.filter(p => p.featured);
    }
    let stepFeatured = result.length;

    // 5. Bookmark Toggle Filter
    if (bookmarksOnly) {
      result = result.filter(p => bookmarks.includes(p.id));
    }
    let stepWishlist = result.length;

    const payload = {
      allProductsLength: allProducts.length,
      searchQuery,
      selectedCategory,
      selectedTags,
      featuredOnly,
      bookmarksOnly,
      bookmarksLength: bookmarks.length,
      steps: {
        initial: stepInitial,
        afterSearch: stepSearch,
        afterCategory: stepCategory,
        afterTags: stepTags,
        afterFeatured: stepFeatured,
        afterWishlist: stepWishlist
      }
    };

    fetch("/api/log-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Error logging state:", err));
  }, [allProducts, searchQuery, selectedCategory, selectedTags, featuredOnly, bookmarksOnly, bookmarks]);

  // Metric stats
  const metrics = useMemo(() => {
    return {
      totalCount: allProducts.length,
      savedCount: bookmarks.length,
      featuredCount: allProducts.filter(p => p.featured).length,
      customCount: customProducts.length
    };
  }, [allProducts, bookmarks, customProducts]);

  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'Myntra': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Amazon': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'Ajio': return 'bg-teal-50 border-teal-200 text-teal-800';
      case 'Flipkart': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Nykaa Fashion': return 'bg-pink-50 border-pink-200 text-pink-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#fbfbfd] text-slate-900 selection:bg-slate-950 selection:text-white" id="curato-app-root">
      
      {/* 1. Header Hero Banner */}
      <header className="border-b border-slate-100 bg-white" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Branding */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest font-semibold px-2 py-0.5 bg-slate-900 text-white rounded">V1</span>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">Milestone 1 — Indian Ethnic & Kurti Search</span>
              </div>
              <h1 className="text-4xl font-extrabold font-display tracking-tight text-slate-950">
                CURATO
              </h1>
              <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                Discover the best Indian ethnic wear, kurtas, and apparel curated across Myntra, Amazon, Ajio, Nykaa Fashion, and Flipkart.
              </p>
            </div>

            {/* Quick Metrics Widget */}
            <div className="flex flex-wrap gap-4 items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80 text-center md:text-left shadow-xs">
              <div className="px-3 border-r border-slate-200/60 last:border-none">
                <span className="text-xl font-bold font-display text-slate-900 block leading-none">{metrics.totalCount}</span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Indexed</span>
              </div>
              <div className="px-3 border-r border-slate-200/60 last:border-none">
                <span className="text-xl font-bold font-display text-rose-600 block leading-none">{metrics.savedCount}</span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Wishlist</span>
              </div>
              <div className="px-3 border-r border-slate-200/60 last:border-none">
                <span className="text-xl font-bold font-display text-indigo-600 block leading-none">{metrics.customCount}</span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">User Added</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Keyboard Shortcut Indicator Notification */}
      {showShortcutsTip && (
        <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 shadow-sm" id="shortcuts-tip-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Keyboard shortcuts active: Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[10px]"> / </kbd> or <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[10px]"> ⌘ K </kbd> to instantly focus search. Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[10px]"> ESC </kbd> to close panels.</span>
            </div>
            <button 
              id="btn-close-shortcuts-tip"
              onClick={() => setShowShortcutsTip(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column Controls / Filter Deck (4 of 12 cols in desktop) */}
          <aside className="lg:col-span-4 space-y-6" id="filters-sidebar">
            
            {/* Search Input block */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Product Search</h3>
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
              <form onSubmit={handleSearch} className="relative">
                <button
                  type="submit"
                  id="btn-search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                <input
                  id="search-input-box"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search &apos;White Kurti&apos;, brands, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-100 focus:border-slate-300 rounded-xl pl-9 pr-8 py-3 text-sm outline-none transition-all placeholder-slate-400 text-slate-900 font-sans"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-slate-200/80 text-slate-400 px-1 py-0.5 rounded font-mono select-none">
                  /
                </span>
              </form>
            </div>

            {/* Quick State Flags & Sorting */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  Filter Criteria
                </h3>
                {(featuredOnly || bookmarksOnly || selectedTags.length > 0 || maxPriceFilter < 6000 || minRatingFilter > 0 || selectedPlatforms.length > 0) && (
                  <button
                    id="btn-reset-sidebar-filters"
                    onClick={() => {
                      setFeaturedOnly(false);
                      setBookmarksOnly(false);
                      setSelectedTags([]);
                      setMaxPriceFilter(6000);
                      setMinRatingFilter(0);
                      setSelectedPlatforms([]);
                    }}
                    className="text-xs font-mono text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Toggle Switches */}
              <div className="space-y-2">
                {/* Bookmarks Toggle */}
                <button
                  id="btn-toggle-saved-filter"
                  onClick={() => setBookmarksOnly(!bookmarksOnly)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    bookmarksOnly 
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950 font-medium' 
                      : 'bg-slate-50/40 hover:bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className={`w-4 h-4 ${bookmarksOnly ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                    <span className="text-xs">My Wishlist Only</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${bookmarksOnly ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                    {metrics.savedCount}
                  </span>
                </button>

                {/* Featured Toggle */}
                <button
                  id="btn-toggle-featured-filter"
                  onClick={() => setFeaturedOnly(!featuredOnly)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    featuredOnly 
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium' 
                      : 'bg-slate-50/40 hover:bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${featuredOnly ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400'}`} />
                    <span className="text-xs">Featured Best Choice</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${featuredOnly ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                    {metrics.featuredCount}
                  </span>
                </button>
              </div>

              {/* Price Budget Filter */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 font-mono">MAX BUDGET</span>
                  <span className="text-xs font-bold font-mono text-indigo-600">
                    {maxPriceFilter === 6000 ? 'Any Budget' : `₹${maxPriceFilter}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={6000}
                  step={100}
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  id="price-range-slider"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>₹500</span>
                  <span>₹3,000</span>
                  <span>₹6,000+</span>
                </div>
              </div>

              {/* Rating Star Filter */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 font-mono block">MINIMUM RATING</span>
                <div className="flex gap-1.5">
                  {([0, 3.5, 4.0, 4.5] as const).map((r) => (
                    <button
                      key={r}
                      id={`rating-filter-btn-${r}`}
                      onClick={() => setMinRatingFilter(r)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-semibold border transition-all cursor-pointer ${
                        minRatingFilter === r
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r === 0 ? 'All' : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filters */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 font-mono block">RETAILER PLATFORMS</span>
                <div className="flex flex-wrap gap-1">
                  {(['Myntra', 'Amazon', 'Ajio', 'Flipkart', 'Nykaa Fashion'] as const).map((plat) => {
                    const isSelected = selectedPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        id={`platform-filter-btn-${plat.replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
                          );
                        }}
                        className={`text-[9px] px-2.5 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-slate-950 text-white font-bold'
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sorting Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  SORT CATALOGUE
                </label>
                <select
                  id="sort-select-box"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full text-xs border border-slate-100 p-3 rounded-xl bg-slate-50/60 font-semibold text-slate-700 cursor-pointer outline-none focus:bg-white focus:border-slate-300 transition-all"
                >
                  <option value="recommended">★ Curato Recommended</option>
                  <option value="scoreDesc">🔥 Curato Score: High to Low</option>
                  <option value="popularity">Highest Rating (5 ★ → 1 ★)</option>
                  <option value="reviewsDesc">💬 Most Reviewed: Popular</option>
                  <option value="priceAsc">📈 Price: Low to High</option>
                  <option value="priceDesc">📉 Price: High to Low</option>
                  <option value="alphabetical">Product Name (A → Z)</option>
                  <option value="newest">Recently curated</option>
                </select>
              </div>
            </div>

            {/* Tag Cloud Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Fabric & Style Tags
                </h3>
                {selectedTags.length > 0 && (
                  <button
                    id="btn-clear-tags-only"
                    onClick={() => setSelectedTags([])}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Clear Tags
                  </button>
                )}
              </div>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  {selectedTags.map(tag => (
                    <span 
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-semibold rounded-md cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      {tag}
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ))}
                </div>
              )}

              {/* Available Tag Pills */}
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto pr-1">
                {activeTagsPool.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      id={`tag-pill-${tag.replace(/\s+/g, '-')}`}
                      onClick={() => handleTagToggle(tag)}
                      className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-950 text-white font-semibold' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Right Column Grid Results (8 of 12 cols in desktop) */}
          <section className="lg:col-span-8 space-y-6" id="results-display-deck">
            
            {/* 1. Category Bar (Strict Single React State trigger) */}
            <div className="overflow-x-auto pb-1" id="category-scroller">
              <div className="flex gap-2 min-w-max">
                {(['All', 'Kurtis', 'Kurta Sets', 'Anarkali', 'Tunic Tops', 'Ethnic Dresses'] as const).map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = getCategoryCount(cat);
                  return (
                    <button
                      key={cat}
                      id={`category-tab-${cat.replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center gap-2 cursor-pointer border ${
                        isActive 
                          ? 'bg-slate-950 text-white border-slate-950 shadow-sm font-bold' 
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Controls & Counters Header */}
            <div className="flex items-center justify-between bg-slate-50/50 border-y border-slate-100 py-3 px-1 text-xs">
              <p className="text-slate-500 font-medium">
                Showing <span className="font-mono text-slate-900 font-bold">{filteredAndSortedProducts.length}</span> apparel items
              </p>
              
              {/* Curation Form modal launcher */}
              <button
                id="btn-open-curate-modal"
                onClick={() => setIsCurateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Curate Product
              </button>
            </div>

            {/* 3. Results Grid of Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="cards-grid">
              {filteredAndSortedProducts.map((product, index) => {
                const isSaved = bookmarks.includes(product.id);
                const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                    onClick={() => setSelectedProduct(product)}
                    className={`group bg-white rounded-2xl border p-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                      product.featured ? 'border-slate-200 shadow-xs' : 'border-slate-100'
                    }`}
                    id={`product-card-${product.id}`}
                  >
                      {/* Left feature accent bar */}
                      {product.featured && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" title="Best Choice Accent" />
                      )}

                      <div className="space-y-3">
                        {/* 3:4 Product Portrait Image */}
                        <div className="aspect-3/4 w-full h-56 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-50 flex flex-col items-center justify-center p-4">
                          {(product.image || resolvedImages[product.id]) ? (
                            <img 
                              src={product.image || resolvedImages[product.id]} 
                              alt={product.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          ) : resolvingIds[product.id] ? (
                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-3 text-center select-none border border-dashed border-indigo-200 rounded-xl relative animate-pulse">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mb-1.5">
                                <ShoppingBag className="w-4 h-4 text-indigo-500 animate-bounce" />
                              </div>
                              <span className="text-[9px] font-mono font-bold tracking-wider text-indigo-500 uppercase">RESOLVING REAL IMAGE...</span>
                              <p className="text-[9px] text-slate-400 mt-1 max-w-[130px] leading-tight font-sans">
                                Fetching live metadata from {product.platform}
                              </p>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-3 text-center select-none border border-dashed border-slate-200 rounded-xl relative group-hover:bg-slate-100/50 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                                <ShoppingBag className="w-4 h-4 text-slate-400" />
                              </div>
                              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">IMAGE UNAVAILABLE</span>
                              <p className="text-[9px] text-slate-400/80 mt-1 max-w-[130px] leading-tight font-sans">
                                Image unavailable
                              </p>
                            </div>
                          )}
                          
                          {/* Platform pill */}
                          <span className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-xs border ${getPlatformColors(product.platform)}`}>
                            {product.platform}
                          </span>

                          {/* Top-left tag count */}
                          {product.featured && (
                            <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                              <span>Best Pick</span>
                            </span>
                          )}
                        </div>

                        {/* Brand & Heart button */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase font-display">
                            {product.brand}
                          </span>
                          
                          <button
                            id={`btn-bookmark-card-${product.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(product.id);
                            }}
                            className={`p-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSaved ? 'text-rose-500' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-rose-500' : ''}`} />
                          </button>
                        </div>

                        {/* Title and Short Description */}
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm tracking-tight text-slate-900 font-display line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {highlightMatch(product.title, searchQuery)}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {highlightMatch(product.description, searchQuery)}
                          </p>
                        </div>

                        {/* Price & Rating Display */}
                        <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-50">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-slate-900">₹{product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-[10px] text-slate-400 line-through">₹{product.originalPrice}</span>
                            )}
                            <span className="text-[9px] font-extrabold text-emerald-600">
                              ({discountPercentage}% OFF)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px] bg-white border border-slate-100 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{product.rating}</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-indigo-600 font-bold text-[10px] bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded shadow-2xs" title="Curato Quality Score">
                              <span>CS {calculateCuratoScore(product).score}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explicit Open Product & More Details Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center gap-2">
                        {/* View specifications */}
                        <button
                          id={`btn-view-details-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Details & Fit
                        </button>

                        {/* Open Product on platform button */}
                        <a
                          id={`btn-open-product-link-${product.id}`}
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Open Product</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                    </motion.div>
                  );
                })}

              {/* Empty state view */}
              {filteredAndSortedProducts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-100" id="empty-state-container">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 font-display">No products match your criteria</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      We couldn&apos;t find any items matching your active text or filters. Try resetting tags or adding a product to our state catalog.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      id="btn-reset-filters-empty"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All Filters
                    </button>
                    <button
                      id="btn-curate-empty"
                      onClick={() => setIsCurateOpen(true)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Apparel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </section>

        </div>
      </main>

      {/* 4. Sliding Detail Drawer Pane */}
      <DetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isBookmarked={selectedProduct ? bookmarks.includes(selectedProduct.id) : false}
        onToggleBookmark={handleToggleBookmark}
        resolvedImage={selectedProduct ? (selectedProduct.image || resolvedImages[selectedProduct.id]) : undefined}
        allProducts={allProducts}
        resolvedImages={resolvedImages}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* 5. Create Curation Form Modal */}
      <CurateModal
        isOpen={isCurateOpen}
        onClose={() => setIsCurateOpen(false)}
        onAddResource={handleAddProduct}
      />

    </div>
  );
}
