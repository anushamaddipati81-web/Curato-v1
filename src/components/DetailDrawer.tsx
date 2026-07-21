import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  Sparkles, 
  ShoppingBag, 
  Star, 
  Info,
  Calendar,
  Check,
  Truck,
  Heart,
  FileText,
  Award,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { calculateCuratoScore } from '../utils';

interface DetailDrawerProps {
  product: Product | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  resolvedImage?: string;
  allProducts?: Product[];
  resolvedImages?: Record<string, string>;
  onSelectProduct: (product: Product) => void;
}

export default function DetailDrawer({
  product,
  onClose,
  isBookmarked,
  onToggleBookmark,
  resolvedImage,
  allProducts = [],
  resolvedImages = {},
  onSelectProduct
}: DetailDrawerProps) {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [pincode, setPincode] = useState<string>('');
  const [shippingEstimate, setShippingEstimate] = useState<string>('');
  const [checkedPincode, setCheckedPincode] = useState<boolean>(false);

  if (!product) return null;

  const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    setCheckedPincode(true);
    // Mock shipping estimate based on pincode digits
    const days = (Number(pincode[0]) % 3) + 2;
    setShippingEstimate(`Guaranteed delivery on ${product.platform} within ${days} days!`);
  };

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

  // Dynamic similarity engine to fetch similar products based on category and tags
  const similarProducts = React.useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.id !== product.id)
      .map(p => {
        let matchScore = 0;
        if (p.category === product.category) matchScore += 5;
        if (p.brand === product.brand) matchScore += 3;
        const sharedTags = p.tags.filter(t => product.tags.includes(t));
        matchScore += sharedTags.length * 2;
        return { product: p, matchScore };
      })
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map(item => item.product);
  }, [product, allProducts]);

  // Dynamic specifications grid based on product metadata
  const getProductSpecs = (p: Product) => {
    const specs = [
      { label: 'Fabric', value: 'Cotton Blend' },
      { label: 'Craft & Weave', value: 'Traditional Loom Weave' },
      { label: 'Sleeve Length', value: 'Three-Quarter Sleeves' },
      { label: 'Pattern', value: 'Solid Classic' },
      { label: 'Neckline', value: 'Classic Collar' },
      { label: 'Occasion', value: 'Casual & Semi-Formal' }
    ];

    const titleLower = p.title.toLowerCase();
    const descLower = p.description.toLowerCase();
    const tagsLower = p.tags.map(t => t.toLowerCase());

    // Fabric
    if (tagsLower.includes('cotton') || tagsLower.includes('pure cotton') || titleLower.includes('cotton') || descLower.includes('cotton')) {
      specs[0].value = '100% Pure Cotton';
    } else if (tagsLower.includes('georgette') || titleLower.includes('georgette') || descLower.includes('georgette')) {
      specs[0].value = 'Premium Georgette';
    } else if (tagsLower.includes('mulmul') || titleLower.includes('mulmul') || descLower.includes('mulmul')) {
      specs[0].value = 'Breathable Mulmul';
    } else if (tagsLower.includes('linen') || titleLower.includes('linen') || descLower.includes('linen')) {
      specs[0].value = 'Linen Blend';
    }

    // Craft
    if (tagsLower.includes('chikankari') || titleLower.includes('chikankari') || descLower.includes('chikankari')) {
      specs[1].value = 'Lucknowi Chikankari Handwork';
      specs[3].value = 'Embroidered';
    } else if (tagsLower.includes('block print') || titleLower.includes('block print') || descLower.includes('block print') || tagsLower.includes('jaipur')) {
      specs[1].value = 'Jaipur Hand-Block Print';
      specs[3].value = 'Traditional Block Print';
    } else if (tagsLower.includes('zari') || titleLower.includes('zari') || descLower.includes('zari') || titleLower.includes('gold')) {
      specs[1].value = 'Zari Borders / Threadwork';
      specs[3].value = 'Embellished / Gota Patti';
    }

    // Sleeve & Neck
    if (tagsLower.includes('mandarin collar') || titleLower.includes('mandarin') || descLower.includes('mandarin') || titleLower.includes('mandarin collar')) {
      specs[4].value = 'Mandarin Stand Collar';
    } else if (titleLower.includes('round neck') || descLower.includes('round neck')) {
      specs[4].value = 'Classic Round Neck';
    } else if (titleLower.includes('v-neck') || descLower.includes('v-neck')) {
      specs[4].value = 'V-Neckline';
    } else if (p.category === 'Tunic Tops') {
      specs[4].value = 'Henley / V-Neck';
    }

    // Occasion
    if (tagsLower.includes('party wear') || titleLower.includes('party') || descLower.includes('wedding') || p.price > 2200) {
      specs[5].value = 'Festive & Party Celebration';
    } else if (tagsLower.includes('office wear') || titleLower.includes('office') || descLower.includes('formal') || tagsLower.includes('formal')) {
      specs[5].value = 'Daily Workwear / Professional';
    } else if (tagsLower.includes('summer wear') || tagsLower.includes('casual') || titleLower.includes('casual')) {
      specs[5].value = 'Summer Casual Outings';
    }

    return specs;
  };

  const scoreDetails = calculateCuratoScore(product);
  const specifications = getProductSpecs(product);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden" id="drawer-overlay">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900 cursor-pointer"
        />

        {/* Drawer container */}
        <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-lg bg-white shadow-2xl flex flex-col h-full"
            id="drawer-panel"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                  {(resolvedImage || product.image) ? (
                    <img 
                      src={resolvedImage || product.image} 
                      alt={product.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-display">
                    {product.category}
                  </span>
                  <h2 className="text-base font-bold font-display tracking-tight text-slate-900 mt-0.5 line-clamp-1">
                    {product.brand}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id={`btn-bookmark-drawer-${product.id}`}
                  onClick={() => onToggleBookmark(product.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isBookmarked 
                      ? 'bg-rose-50 border-rose-200 text-rose-500' 
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}
                  title={isBookmarked ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  id="btn-close-drawer"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product Hero & Pricing */}
              <div className="space-y-4">
                <div className="aspect-3/4 w-full max-h-72 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative group flex flex-col items-center justify-center p-6">
                  {(resolvedImage || product.image) ? (
                    <img 
                      src={resolvedImage || product.image} 
                      alt={product.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 select-none">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <ShoppingBag className="w-7 h-7 text-slate-400" />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">IMAGE UNAVAILABLE</span>
                      <p className="text-xs text-slate-400 mt-2 max-w-xs leading-normal">
                        To maintain absolute product data accuracy, we do not show generic or incorrect fashion visuals. The exact retailer image cannot be verified at this time.
                      </p>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full border shadow-xs ${getPlatformColors(product.platform)}`}>
                    {product.platform}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">{product.brand}</span>
                  <h3 className="text-xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
                    {product.title}
                  </h3>
                </div>

                {/* Pricing layout */}
                <div className="flex items-baseline gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-950 font-display">₹{product.price}</span>
                  {product.originalPrice > product.price && (
                    <>
                      <span className="text-sm text-slate-400 line-through font-medium">₹{product.originalPrice}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded">
                        {discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Rating layout */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">({product.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-slate-100" />

              {/* Curato Score Metric Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3.5" id={`curato-score-panel-${product.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase leading-none">Curation Metric</span>
                      <span className="text-xs font-bold text-slate-800">Curato Rating Score</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 ${scoreDetails.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{scoreDetails.verdict} ({scoreDetails.score}/100)</span>
                  </div>
                </div>

                {/* Score Progress Bars */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 text-[10px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>RATING & QUALITY</span>
                      <span className="font-bold text-slate-700">{scoreDetails.ratingScore}/50</span>
                    </div>
                    <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(scoreDetails.ratingScore / 50) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>DEAL VALUE</span>
                      <span className="font-bold text-slate-700">{scoreDetails.valueScore}/20</span>
                    </div>
                    <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(scoreDetails.valueScore / 20) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>REVIEWS SIZE</span>
                      <span className="font-bold text-slate-700">{scoreDetails.popularityScore}/15</span>
                    </div>
                    <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(scoreDetails.popularityScore / 15) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>CURATION TRUST</span>
                      <span className="font-bold text-slate-700">{scoreDetails.trustScore}/15</span>
                    </div>
                    <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(scoreDetails.trustScore / 15) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-sans italic leading-tight">
                  Score calculated dynamically based on quality ratings, discount savings, shopper reviews volume, and featured status.
                </p>
              </div>

              {/* Divider */}
              <hr className="border-slate-100" />

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Product Description
                </h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {product.description}
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Style Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 border border-slate-100 text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rich Specifications Grid */}
              <div className="space-y-2.5" id={`specs-section-${product.id}`}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Richer Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 text-xs">
                  {specifications.map((spec) => (
                    <div key={spec.label} className="border-b border-slate-100 pb-1.5 last:border-none last:pb-0">
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">{spec.label}</span>
                      <span className="font-semibold text-slate-700 leading-normal block">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Sizing Block */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold font-mono">SELECT YOUR SIZE</span>
                  <span className="text-slate-400 text-[10px] font-mono cursor-pointer hover:underline">Size Chart</span>
                </div>
                <div className="flex gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping Pincode Check widget */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 space-y-3">
                <span className="text-xs text-slate-500 font-bold font-mono block">CHECK ESTIMATED DELIVERY</span>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:border-slate-400 font-mono"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {checkedPincode && (
                  <div className="flex items-start gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-xs font-medium">
                    <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{shippingEstimate}</span>
                  </div>
                )}
              </div>

              {/* Similar Product suggestions */}
              {similarProducts.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-slate-50" id={`similar-suggestions-${product.id}`}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                    <span>SIMILAR SELECTIONS</span>
                    <span className="text-[9px] font-semibold text-indigo-500 uppercase">MATCH RATINGS</span>
                  </h4>
                  <div className="space-y-2.5">
                    {similarProducts.map((p) => {
                      const pImg = p.image || resolvedImages[p.id];
                      const pScore = calculateCuratoScore(p).score;
                      return (
                        <div
                          key={p.id}
                          id={`similar-product-${p.id}`}
                          onClick={() => onSelectProduct(p)}
                          className="flex gap-3 bg-white hover:bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 cursor-pointer transition-all hover:border-slate-200 group"
                        >
                          <div className="w-12 h-16 bg-slate-50 rounded-lg overflow-hidden border border-slate-100/60 flex-shrink-0 flex items-center justify-center relative">
                            {pImg ? (
                              <img src={pImg} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-slate-300" />
                            )}
                            <span className="absolute bottom-1 right-1 bg-slate-900 text-white font-mono text-[8px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                              {pScore}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-bold tracking-wider text-indigo-600 uppercase font-display block line-clamp-1">
                                  {p.brand}
                                </span>
                                <span className="text-[8px] font-mono text-slate-400 uppercase">
                                  {p.platform}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors mt-0.5">
                                {p.title}
                              </h5>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs font-bold text-slate-900">₹{p.price}</span>
                                {p.originalPrice > p.price && (
                                  <span className="text-[9px] text-slate-400 line-through">₹{p.originalPrice}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-500 text-[9px] font-bold">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>{p.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer action */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <a
                id={`link-visit-site-${product.id}`}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Open Product on {product.platform}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
