export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "26", "28", "30", "32", "34", "36"];
export const sizeRank = (s: string) => { const i = SIZE_ORDER.indexOf(s); return i < 0 ? 99 : i; };

export type StockLevel = "out" | "low" | "in";
export const stockLevel = (stock: number, lowAt: number): StockLevel => (stock <= 0 ? "out" : stock <= lowAt ? "low" : "in");

export type SortKey = "featured" | "new" | "price-asc" | "price-desc";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" }, { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" }, { key: "price-desc", label: "Price: high to low" },
];
