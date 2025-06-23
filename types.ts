
export interface ClothingItemVariant {
  size: string;
  stock: number;
}

export enum Gender {
  MENS = "メンズ",
  WOMENS = "レディース",
  UNISEX = "ユニセックス",
  NOT_APPLICABLE = "適用なし"
}

export enum ClothingCategory {
  SUITS = "スーツ",
  HOODIES = "パーカー",
  LONG_SLEEVE_TSHIRTS = "長袖Tシャツ",
  TSHIRTS = "Tシャツ",
  SHIRTS = "シャツ",
  POLO_SHIRTS = "ポロシャツ",
  JACKETS = "ジャケット",
  DOWN_JACKETS = "ダウンジャケット",
  DOWN_VESTS = "ダウンベスト",
  PANTS = "パンツ",
  SHORTS = "ショートパンツ",
  JEANS = "ジーンズ",
  SKIRTS = "スカート",
  DRESSES = "ワンピース",
  TANK_TOPS = "タンクトップ",
  SHOES = "シューズ",
  BAGS = "バッグ",
  WALLETS = "財布",
  KEY_CASES = "キーケース",
  WATCHES = "腕時計",
  BRACELETS = "ブレスレット",
  NECKLACES = "ネックレス",
  EARRINGS = "イヤリング・ピアス",
  BROOCHES = "ブローチ"
}

export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: ClothingCategory;
  gender: Gender;
  color: string;
  price: number; // Stored as number, formatted as JPY for display
  variants: ClothingItemVariant[];
  imageUrl: string | null; // Base64 encoded image string or null
}

export interface OrderItem {
  clothingItemId: string;
  size: string; 
  quantity: number;
  priceAtPurchase: number; // Price per item at the time of order
}

export enum OrderStatus {
  PENDING = '保留中',
  PROCESSING = '処理中',
  SHIPPED = '発送済み',
  // DELIVERED = '配達済み', // Removed as per request
  CANCELLED = 'キャンセル済み',
}

export const OUTSOURCING_STORES = ["Kintetsu (近鉄)", "3rd (サード)", "4th (フォース)", "Orange (オレンジ)"] as const;
export type OutsourcingStore = typeof OUTSOURCING_STORES[number];

export interface Order {
  id: string;
  sourceStore: OutsourcingStore;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // ISO date string
}

export enum OutsourcingStatus {
  OUTSOURCED = "委託中", // Item is currently with the outsourcer
  RECEIVED_BY_STORE = "店舗受領済み", // Item has been received back by one of our stores (e.g. after sale or end of consignment)
  RETURNED_TO_SUPPLIER = "供給元へ返却済み", // Item returned from our store to the original supplier/outsourcing store
  SHIPPED_TO_SELLER = "販売元へ発送済み", 
  CANCELLED = "キャンセル済み" // Outsourcing agreement cancelled, item potentially returned to main inventory
}

export interface OutsourcingRecord {
  id: string;
  outsourcingStore: OutsourcingStore;
  recipientName: string; // Could be the name of the external store or contact person
  itemName: string;
  itemDescription?: string;
  quantity: number;
  dateOutsourced: string; // ISO date string
  status: OutsourcingStatus; 
  notes?: string;
  imageUrl?: string | null; 
}


export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "フリーサイズ"];
export const CLOTHING_COLORS = ["レッド", "ブルー", "グリーン", "ブラック", "ホワイト", "グレー", "イエロー", "ピンク", "ネイビー", "ベージュ", "ブラウン", "パープル", "オレンジ"];

export const CATEGORIES_NEEDING_GENDER_SEPARATION: ClothingCategory[] = [
  ClothingCategory.SUITS, ClothingCategory.HOODIES, ClothingCategory.LONG_SLEEVE_TSHIRTS, ClothingCategory.TSHIRTS,
  ClothingCategory.SHIRTS, ClothingCategory.POLO_SHIRTS, ClothingCategory.JACKETS, ClothingCategory.DOWN_JACKETS,
  ClothingCategory.DOWN_VESTS, ClothingCategory.PANTS, ClothingCategory.SHORTS, ClothingCategory.JEANS,
  ClothingCategory.SKIRTS, ClothingCategory.DRESSES, ClothingCategory.TANK_TOPS, ClothingCategory.SHOES
];

export const CATEGORIES_flexible_GENDER: ClothingCategory[] = [
  ClothingCategory.BAGS, ClothingCategory.WALLETS, ClothingCategory.KEY_CASES, ClothingCategory.WATCHES,
  ClothingCategory.BRACELETS, ClothingCategory.NECKLACES, ClothingCategory.EARRINGS, ClothingCategory.BROOCHES
];

export const ALL_CLOTHING_CATEGORIES = Object.values(ClothingCategory);
export const GENDER_OPTIONS = Object.values(Gender);
export const ALL_OUTSOURCING_STATUSES = Object.values(OutsourcingStatus);
export const ALL_ORDER_STATUSES = Object.values(OrderStatus);

// AuthState interface removed
