import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Plus, PlusCircle, ShoppingCart } from 'lucide-react';
import { Product, ProductCategory, ShoppingPlatform } from '../types';

interface CurateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddResource: (newProduct: Omit<Product, 'id' | 'dateAdded'>) => void;
}

export default function CurateModal({ isOpen, onClose, onAddResource }: CurateModalProps) {
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Kurtis');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [price, setPrice] = useState<number>(899);
  const [originalPrice, setOriginalPrice] = useState<number>(1999);
  const [rating, setRating] = useState<number>(4.2);
  const [platform, setPlatform] = useState<ShoppingPlatform>('Myntra');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Product title is required';
    if (!brand.trim()) newErrors.brand = 'Brand is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    if (!url.trim()) {
      newErrors.url = 'Product link is required';
    } else {
      try {
        new URL(url);
      } catch {
        newErrors.url = 'Must be a valid URL (e.g. https://myntra.com/...)';
      }
    }

    if (image.trim()) {
      try {
        new URL(image);
      } catch {
        newErrors.image = 'Must be a valid Image URL (e.g. https://images.unsplash.com/...)';
      }
    }

    if (!price || price <= 0) newErrors.price = 'Must be a valid price';
    if (!originalPrice || originalPrice <= 0) newErrors.originalPrice = 'Must be a valid original price';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Parse comma-separated tags
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Make sure search terms like "White Kurti" are represented nicely in tag bank if white is mentioned
    const lowerTitle = title.toLowerCase();
    const finalTags = [...tags];
    if (lowerTitle.includes('white') && !finalTags.some(t => t.toLowerCase() === 'white kurti')) {
      finalTags.push('White Kurti');
    }

    onAddResource({
      title: title.trim(),
      brand: brand.trim(),
      category,
      description: description.trim(),
      url: url.trim(),
      tags: finalTags.length > 0 ? finalTags : ['Ethnic', 'Traditional'],
      price,
      originalPrice,
      rating,
      reviewCount: Math.floor(Math.random() * 200) + 12,
      image: image.trim(),
      platform,
      featured,
      accentColor: getPlatformAccent(platform)
    });

    // Reset Form
    setTitle('');
    setBrand('');
    setCategory('Kurtis');
    setDescription('');
    setUrl('');
    setTagsInput('');
    setPrice(899);
    setOriginalPrice(1999);
    setRating(4.2);
    setPlatform('Myntra');
    setImage('');
    setFeatured(false);
    onClose();
  };

  const getPlatformAccent = (plat: ShoppingPlatform) => {
    switch (plat) {
      case 'Myntra': return '#EC4899';
      case 'Amazon': return '#F59E0B';
      case 'Ajio': return '#0D9488';
      case 'Flipkart': return '#2563EB';
      case 'Nykaa Fashion': return '#DB2777';
      default: return '#1F2937';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="curate-modal-overlay">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900 cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10"
          id="curate-modal-panel"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-900 text-white rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold font-display tracking-tight text-slate-900">
                  Curate New Product
                </h2>
                <p className="text-xs text-slate-500">
                  Add a real or customized shopping product to the local index.
                </p>
              </div>
            </div>
            <button
              id="btn-close-curate-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Title & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">PRODUCT TITLE *</label>
                <input
                  id="input-curate-title"
                  type="text"
                  placeholder="e.g. Chikankari Kurta"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-sm border px-3 py-2 rounded-lg outline-none transition-all ${
                    errors.title ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {errors.title && <p className="text-[10px] text-rose-500 font-medium">{errors.title}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">BRAND NAME *</label>
                <input
                  id="input-curate-brand"
                  type="text"
                  placeholder="e.g. Anouk, BIBA"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={`w-full text-sm border px-3 py-2 rounded-lg outline-none transition-all ${
                    errors.brand ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {errors.brand && <p className="text-[10px] text-rose-500 font-medium">{errors.brand}</p>}
              </div>
            </div>

            {/* Category & Platform */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">CATEGORY</label>
                <select
                  id="select-curate-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none bg-white cursor-pointer focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Kurtis">Kurtis</option>
                  <option value="Kurta Sets">Kurta Sets</option>
                  <option value="Anarkali">Anarkali</option>
                  <option value="Tunic Tops">Tunic Tops</option>
                  <option value="Ethnic Dresses">Ethnic Dresses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">SHOPPING PLATFORM</label>
                <select
                  id="select-curate-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as ShoppingPlatform)}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none bg-white cursor-pointer focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Myntra">Myntra</option>
                  <option value="Ajio">Ajio</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Nykaa Fashion">Nykaa Fashion</option>
                </select>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 font-mono block">PRODUCT WEB LINK *</label>
              <input
                id="input-curate-url"
                type="text"
                placeholder="e.g., https://www.myntra.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full text-sm border px-3 py-2 rounded-lg outline-none transition-all ${
                  errors.url ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errors.url && <p className="text-[10px] text-rose-500 font-medium">{errors.url}</p>}
            </div>

            {/* Image Link */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 font-mono block">PRODUCT IMAGE LINK (URL) - OPTIONAL</label>
              <input
                id="input-curate-image"
                type="text"
                placeholder="Leave blank to use 'Image Not Verified' fallback"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={`w-full text-sm border px-3 py-2 rounded-lg outline-none transition-all ${
                  errors.image ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errors.image && <p className="text-[10px] text-rose-500 font-medium">{errors.image}</p>}
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">OFFER PRICE (INR) *</label>
                <input
                  id="input-curate-price"
                  type="number"
                  placeholder="899"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-900"
                />
                {errors.price && <p className="text-[10px] text-rose-500 font-medium">{errors.price}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">MRP ORIGINAL PRICE (INR) *</label>
                <input
                  id="input-curate-originalPrice"
                  type="number"
                  placeholder="1999"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-900"
                />
                {errors.originalPrice && <p className="text-[10px] text-rose-500 font-medium">{errors.originalPrice}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 font-mono block">PRODUCT DETAILS & FIT *</label>
              <textarea
                id="input-curate-description"
                placeholder="Describe material, length, sleeve style, work, etc."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full text-sm border px-3 py-2 rounded-lg outline-none transition-all ${
                  errors.description ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errors.description && <p className="text-[10px] text-rose-500 font-medium">{errors.description}</p>}
            </div>

            {/* Tags & rating */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">STYLE TAGS (COMMA SEPARATED)</label>
                <input
                  id="input-curate-tags"
                  type="text"
                  placeholder="e.g., White, Cotton, Traditional"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-mono block">RATING (1.0 TO 5.0)</label>
                <input
                  id="input-curate-rating"
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="input-curate-featured"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer focus:ring-slate-900"
              />
              <label htmlFor="input-curate-featured" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                Pin as Best Choice (featured product)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                id="btn-cancel-curate"
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-curate"
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
