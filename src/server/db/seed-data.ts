// Fictional brand for the demo. People and emails are invented (example.com). Photos: Unsplash (Unsplash License).
const U = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const STORE = {
  name: "Sora & Sand",
  tagline: "Quiet essentials, made to last",
  currency: "USD",
  shippingCents: 600,
  expressCents: 1500,
  freeShippingOverCents: 12000,
  lowStockAt: 3,
};

export const EDITORIAL = {
  hero: U("1566207274740-0f8cf6b7d5a5"),
  heroAlt: "Woman walking with a coat over her arm",
  women: U("1545539447-e93ff8609493"),
  men: U("1619603364937-8d7af41ef206"),
  knit: U("1646270968802-6bad28659329"),
  store: U("1441984904996-e0b6ba687e04"),
  rack: U("1558769132-cb1aea458c5e"),
  flatlay: U("1516762689617-e1cffcef479d"),
};

const TOP = ["XS", "S", "M", "L", "XL"];
const MEN = ["S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "32", "34", "36"];
const DRESS = ["XS", "S", "M", "L"];

type C = { name: string; hex: string; images: string[] };
export type SeedProduct = {
  slug: string; name: string; collection: "Women" | "Men" | "Unisex"; category: string; price: number; compareAt?: number;
  featured?: boolean; sizes: string[]; colors: C[]; description: string; fabric: string; fit: string; daysOld: number;
};

export const PRODUCTS: SeedProduct[] = [
  { slug: "essential-crew-tee", name: "Essential Crew Tee", collection: "Unisex", category: "Tops", price: 32, sizes: TOP, featured: true, daysOld: 40,
    colors: [{ name: "Optic White", hex: "#F7F7F4", images: [U("1778671394516-8270eac13c42"), U("1574180566232-aaad1b5b8450"), U("1622445270936-5dcb604970e7")] }],
    description: "The tee you reach for first. Mid-weight cotton jersey with a clean crew neck that keeps its shape wash after wash.", fabric: "100% organic cotton, 200 gsm. Machine wash cold.", fit: "Regular fit. True to size." },
  { slug: "heavyweight-long-sleeve", name: "Heavyweight Long Sleeve", collection: "Unisex", category: "Tops", price: 48, sizes: TOP, daysOld: 12,
    colors: [{ name: "Washed Black", hex: "#1C1C1C", images: [U("1618354691551-44de113f0164")] }],
    description: "A dense, structured long sleeve with ribbed cuffs. Layers under everything, works alone too.", fabric: "100% cotton, 260 gsm. Machine wash cold, dry flat.", fit: "Relaxed fit. Size down for a closer fit." },
  { slug: "oxford-shirt", name: "Oxford Shirt", collection: "Men", category: "Shirts", price: 78, sizes: MEN, featured: true, daysOld: 30,
    colors: [
      { name: "Sky Blue", hex: "#9DB8D9", images: [U("1602810316693-3667c854239a")] },
      { name: "Plum", hex: "#5E2A4A", images: [U("1602810318660-d2c46b750f88")] },
      { name: "White", hex: "#FAFAF7", images: [U("1603252109612-24fa03d145c8")] },
    ],
    description: "A crisp button-down in soft-washed oxford cloth. Smart enough for the office, easy enough for the weekend.", fabric: "100% cotton oxford. Machine wash warm, iron while damp.", fit: "Tailored fit through the chest and waist." },
  { slug: "relaxed-knit-sweater", name: "Relaxed Knit Sweater", collection: "Women", category: "Knitwear", price: 96, compareAt: 128, sizes: TOP, featured: true, daysOld: 20,
    colors: [{ name: "Oat", hex: "#C9B79C", images: [U("1631541909061-71e349d1f203"), U("1646270968802-6bad28659329")] }],
    description: "A slouchy rib-knit with dropped shoulders and a soft, brushed hand. Made for cold mornings and long weekends.", fabric: "70% wool, 30% recycled nylon. Hand wash cold, dry flat.", fit: "Oversized fit. Size down for a closer fit." },
  { slug: "everyday-sweatshirt", name: "Everyday Sweatshirt", collection: "Women", category: "Tops", price: 64, sizes: TOP, daysOld: 6,
    colors: [{ name: "Marigold", hex: "#E88A1A", images: [U("1578587018452-892bacefd3f2")] }],
    description: "Brushed-back fleece in a colour that lifts grey days. Clean crew neck, ribbed hem and cuffs.", fabric: "80% cotton, 20% recycled polyester. Machine wash cold.", fit: "Regular fit." },
  { slug: "fleece-hoodie", name: "Fleece Hoodie", collection: "Men", category: "Tops", price: 84, sizes: MEN, daysOld: 18,
    colors: [{ name: "Heather Grey", hex: "#B9BBBE", images: [U("1601063476271-a159c71ab0b3")] }],
    description: "A heavyweight hoodie with a lined hood and kangaroo pocket. Soft inside, built to take a beating.", fabric: "80% cotton, 20% polyester, 400 gsm. Machine wash cold.", fit: "Relaxed fit." },
  { slug: "nylon-bomber", name: "Nylon Bomber", collection: "Men", category: "Outerwear", price: 148, sizes: MEN, featured: true, daysOld: 9,
    colors: [{ name: "Rust", hex: "#B5552E", images: [U("1591047139829-d91aecb6caea")] }],
    description: "A lightweight bomber with a water-resistant shell, rib trims and a two-way zip.", fabric: "Shell: 100% recycled nylon. Lining: 100% polyester.", fit: "Regular fit. True to size." },
  { slug: "trucker-denim-jacket", name: "Trucker Denim Jacket", collection: "Unisex", category: "Outerwear", price: 128, sizes: TOP, daysOld: 35,
    colors: [
      { name: "Dark Rinse", hex: "#22324C", images: [U("1611312449408-fcece27cdbb7"), U("1555583743-991174c11425")] },
      { name: "Light Wash", hex: "#9DB3CC", images: [U("1543076447-215ad9ba6923"), U("1577660002965-04865592fc60")] },
    ],
    description: "The classic trucker cut in rigid denim that softens and fades with you.", fabric: "100% cotton denim, 13 oz. Wash inside out, cold.", fit: "Regular fit. Size up to layer." },
  { slug: "straight-leg-jeans", name: "Straight Leg Jeans", collection: "Men", category: "Bottoms", price: 98, sizes: WAIST, daysOld: 44,
    colors: [{ name: "Indigo", hex: "#2C3E5C", images: [U("1624378441864-6eda7eac51cb")] }],
    description: "A mid-rise straight leg in comfort-stretch denim. Not too slim, not too loose.", fabric: "98% cotton, 2% elastane. Wash inside out, cold.", fit: "Straight leg, mid rise. Waist sizes in inches." },
  { slug: "pleated-wool-trousers", name: "Pleated Wool Trousers", collection: "Men", category: "Bottoms", price: 138, sizes: WAIST, daysOld: 25,
    colors: [{ name: "Stone Grey", hex: "#8E8C86", images: [U("1493357335960-4583bfa6f8d9")] }],
    description: "Single-pleat trousers with a relaxed leg and a clean break. Pair with knitwear or a tee.", fabric: "70% wool, 30% polyester. Dry clean.", fit: "Relaxed fit, tapered leg." },
  { slug: "cuffed-joggers", name: "Cuffed Joggers", collection: "Women", category: "Bottoms", price: 58, compareAt: 74, sizes: TOP, daysOld: 50,
    colors: [{ name: "Blush", hex: "#D8A99A", images: [U("1594633312681-425c7b97ccd1")] }],
    description: "Soft, drapey joggers with patch pockets and elastic cuffs. Dressed up or down.", fabric: "65% lyocell, 35% cotton. Machine wash cold.", fit: "Relaxed fit, cuffed ankle." },
  { slug: "belted-wool-coat", name: "Belted Wool Coat", collection: "Women", category: "Outerwear", price: 248, sizes: TOP, featured: true, daysOld: 4,
    colors: [{ name: "Camel", hex: "#B48A5A", images: [U("1539533113208-f6df8cc8b543"), U("1539533018447-63fcce2678e3")] }],
    description: "A wrap coat in brushed wool with a removable belt. The one coat that goes with everything.", fabric: "60% wool, 40% recycled polyester. Dry clean.", fit: "Relaxed fit. True to size." },
  { slug: "classic-trench", name: "Classic Trench", collection: "Women", category: "Outerwear", price: 228, sizes: TOP, daysOld: 15,
    colors: [{ name: "Sand", hex: "#CDB893", images: [U("1633821879282-0c4e91f96232")] }],
    description: "A double-breasted trench in water-repellent cotton gabardine, with storm flap and belted cuffs.", fabric: "100% cotton gabardine, water-repellent finish. Dry clean.", fit: "Regular fit." },
  { slug: "wrap-coat", name: "Shawl Wrap Coat", collection: "Women", category: "Outerwear", price: 238, sizes: TOP, daysOld: 28,
    colors: [{ name: "Cream", hex: "#E7DED0", images: [U("1550872199-63f4382fe925")] }],
    description: "Big shawl collar, soft drape and a tie waist. Warmth without the weight.", fabric: "50% wool, 50% recycled polyester. Dry clean.", fit: "Oversized fit." },
  { slug: "tailored-overcoat", name: "Tailored Overcoat", collection: "Men", category: "Outerwear", price: 268, sizes: MEN, daysOld: 22,
    colors: [{ name: "Tobacco", hex: "#8B5E3C", images: [U("1619603364904-c0498317e145")] }],
    description: "A single-breasted overcoat that sits just above the knee. Sharp over a suit or a hoodie.", fabric: "70% wool, 30% cashmere blend. Dry clean.", fit: "Tailored fit. Size up to layer." },
  { slug: "linen-shirt-dress", name: "Linen Shirt Dress", collection: "Women", category: "Dresses", price: 118, sizes: DRESS, featured: true, daysOld: 8,
    colors: [{ name: "Natural", hex: "#EDE3D2", images: [U("1532675432006-329c6fed7045")] }],
    description: "A button-through midi in breathable linen, with short sleeves and a relaxed waist.", fabric: "100% European linen. Machine wash cold.", fit: "Relaxed fit. Midi length." },
  { slug: "garden-midi-dress", name: "Garden Midi Dress", collection: "Women", category: "Dresses", price: 136, compareAt: 168, sizes: DRESS, daysOld: 32,
    colors: [{ name: "Floral", hex: "#E9D9C7", images: [U("1762154057377-cc9d3dd6900c")] }],
    description: "A fit-and-flare midi in a soft floral print, with adjustable straps and hidden pockets.", fabric: "100% cotton voile, fully lined. Machine wash cold.", fit: "Fitted bodice, full skirt." },
  { slug: "smocked-maxi-dress", name: "Smocked Maxi Dress", collection: "Women", category: "Dresses", price: 158, sizes: DRESS, daysOld: 3,
    colors: [{ name: "Terracotta", hex: "#9C4A2B", images: [U("1683660107856-cdad7a562d12")] }],
    description: "A floor-length dress with a smocked bodice and long sleeves, in a warm earthy tone.", fabric: "100% viscose. Hand wash cold.", fit: "Relaxed fit. Maxi length." },
];

export const DISCOUNTS = [
  { code: "WELCOME10", kind: "percent" as const, value: 10, minSpendCents: 0, usageLimit: null, active: true },
  { code: "TAKE20", kind: "fixed" as const, value: 2000, minSpendCents: 15000, usageLimit: 200, active: true },
  { code: "SUMMER25", kind: "percent" as const, value: 25, minSpendCents: 0, usageLimit: null, active: false },
];

export const FIRST = ["Olivia", "Noah", "Ava", "Liam", "Isla", "Arjun", "Chloe", "Mateo", "Grace", "Yusuf", "Ella", "Kai", "Freya", "Omar", "Ruby", "Theo", "Hana", "Lucas", "Maya", "Felix", "Zara", "Ethan", "Nina", "Jonah", "Priya", "Sam", "Lena", "Aiden", "Iris", "Ravi"];
export const LAST = ["Bennett", "Clarke", "Diaz", "Evans", "Fischer", "Gupta", "Hughes", "Ito", "Jensen", "Khan", "Lopez", "Morgan", "Novak", "Osei", "Patel", "Quinn", "Rossi", "Silva", "Turner", "Ward"];
export const CITIES = [["Austin", "78701"], ["Portland", "97205"], ["Denver", "80202"], ["Chicago", "60607"], ["Seattle", "98101"], ["Boston", "02116"], ["Brooklyn", "11211"], ["San Diego", "92101"]];

export const ADMIN = { email: "owner@example.com", name: "Store owner", password: "demo-owner" };
