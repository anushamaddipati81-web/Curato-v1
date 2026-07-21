import { Product } from './types';

export interface CuratoScoreDetails {
  score: number;
  ratingScore: number;
  valueScore: number;
  trustScore: number;
  popularityScore: number;
  verdict: 'Excellent' | 'Great' | 'Good' | 'Average';
  color: string;
}

export function calculateCuratoScore(product: Product): CuratoScoreDetails {
  const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  
  // 1. Rating score: up to 50 points based on the 5-star rating scale
  const ratingScore = Math.round((product.rating / 5) * 50);
  
  // 2. Value score: up to 20 points based on discount percentage & absolute savings
  const discountWeight = (discountPercentage / 100) * 12; // up to 12 points
  const absoluteSavings = Math.max(0, product.originalPrice - product.price);
  const savingsWeight = Math.min(8, (absoluteSavings / 1500) * 8); // up to 8 points
  const valueScore = Math.round(discountWeight + savingsWeight);
  
  // 3. Popularity score: up to 15 points based on log scale of review count
  // e.g. 2000 reviews is high, 50 reviews is low
  const popularityScore = Math.round(Math.min(15, Math.log10(product.reviewCount || 1) * 4.5));
  
  // 4. Trust/Curation score: up to 15 points
  const trustScore = product.featured ? 15 : 10;
  
  // Total score
  const score = Math.min(100, Math.max(30, ratingScore + valueScore + popularityScore + trustScore));
  
  let verdict: 'Excellent' | 'Great' | 'Good' | 'Average' = 'Good';
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  
  if (score >= 90) {
    verdict = 'Excellent';
    color = 'text-indigo-700 bg-indigo-50 border-indigo-200';
  } else if (score >= 80) {
    verdict = 'Great';
    color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (score >= 70) {
    verdict = 'Good';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  } else {
    verdict = 'Average';
    color = 'text-slate-700 bg-slate-50 border-slate-200';
  }
  
  return {
    score,
    ratingScore,
    valueScore,
    trustScore,
    popularityScore,
    verdict,
    color
  };
}
