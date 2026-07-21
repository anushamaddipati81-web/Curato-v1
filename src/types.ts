export type ProductCategory = 'Kurtis' | 'Kurta Sets' | 'Anarkali' | 'Tunic Tops' | 'Ethnic Dresses';
export type ShoppingPlatform = 'Myntra' | 'Amazon' | 'Ajio' | 'Flipkart' | 'Nykaa Fashion';

export interface Product {
  id: string;
  title: string;
  brand: string;
  description: string;
  url: string; // Shopping destination URL
  category: ProductCategory;
  tags: string[];
  price: number; // e.g. 899
  originalPrice: number; // e.g. 1999
  rating: number; // 1-5 rating, e.g. 4.3
  reviewCount: number; // number of reviews
  image: string; // URL for the product image
  platform: ShoppingPlatform;
  featured: boolean;
  dateAdded: string; // YYYY-MM-DD
  accentColor: string; // hex or Tailwind color
}

