import {
  UserRole,
  AgentStatus,
  ProductCondition,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  WalletTransactionType,
  CommissionRuleType,
  UserSummary,
  AgentSummary,
  ProductSummary,
  OrderSummary,
  WalletLedgerEntry,
  DEFAULT_CATEGORY_SPECS,
  CategorySpecSchema
} from '@tech-marketplace/shared';

export interface UserRecord extends UserSummary {
  passwordHash: string;
}

export interface ReviewRecord {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export class MockDataStore {
  public users: UserRecord[] = [];
  public agents: AgentSummary[] = [];
  public categories: { id: string; name: string; slug: string; description: string; icon: string; specSchema: CategorySpecSchema }[] = [];
  public products: ProductSummary[] = [];
  public reviews: ReviewRecord[] = [];
  public orders: OrderSummary[] = [];
  public walletLedgers: WalletLedgerEntry[] = [];
  public commissionSettings = {
    ruleType: CommissionRuleType.CATEGORY_BASED,
    defaultPercentage: 5,
    categoryRates: {
      cat_mobiles: 4.5,
      cat_laptops: 4.0,
      cat_accessories: 8.0
    }
  };
  public rewardSettings = {
    earnRatePercent: 2,
    redemptionLimitPercent: 50,
    expiryDays: 90
  };

  constructor() {
    this.seedAll();
  }

  private seedAll() {
    // 1. Categories
    this.categories = [
      {
        id: 'cat_mobiles',
        name: 'Mobiles & Tablets',
        slug: 'mobiles',
        description: 'Flagship smartphones, iPads, PTA approved phones & 5G devices',
        icon: 'Smartphone',
        specSchema: DEFAULT_CATEGORY_SPECS.mobiles
      },
      {
        id: 'cat_laptops',
        name: 'Laptops & Computers',
        slug: 'laptops',
        description: 'MacBooks, RTX Gaming rigs, Ultrabooks & Workstations',
        icon: 'Laptop',
        specSchema: DEFAULT_CATEGORY_SPECS.laptops
      },
      {
        id: 'cat_accessories',
        name: 'Audio & Wearables',
        slug: 'accessories',
        description: 'Wireless earbuds, smartwatches, power banks & studio headphones',
        icon: 'Headphones',
        specSchema: DEFAULT_CATEGORY_SPECS.accessories
      }
    ];

    // 2. Users
    this.users = [
      {
        id: 'usr_admin',
        name: 'Marketplace Super Admin',
        email: 'admin@techmarketplace.pk',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9', // 'Admin123!'
        role: UserRole.ADMIN,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr_agent_lahore',
        name: 'Bilal Farooq',
        email: 'lahore@techzone.pk',
        phone: '03001234567',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9',
        role: UserRole.AGENT,
        createdAt: '2026-01-15T00:00:00.000Z'
      },
      {
        id: 'usr_agent_karachi',
        name: 'Hamza Siddiqui',
        email: 'galaxy@hub.pk',
        phone: '03219876543',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9',
        role: UserRole.AGENT,
        createdAt: '2026-02-01T00:00:00.000Z'
      },
      {
        id: 'usr_agent_islamabad',
        name: 'Khurram Shahzad',
        email: 'apex@islamabad.pk',
        phone: '03335551234',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9',
        role: UserRole.AGENT,
        createdAt: '2026-02-15T00:00:00.000Z'
      },
      {
        id: 'usr_agent_rawalpindi',
        name: 'Zubair Akhtar',
        email: 'rawal@digital.pk',
        phone: '03456789012',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9',
        role: UserRole.AGENT,
        createdAt: '2026-03-01T00:00:00.000Z'
      },
      {
        id: 'usr_customer_1',
        name: 'Usman Ali',
        email: 'customer@gmail.com',
        phone: '03335558889',
        passwordHash: '$2a$10$wT.440263Y0s9Zk5G8x5cOFZJm9VzK0Wp4r97eL/w5G8x5cOFZJm9',
        role: UserRole.CUSTOMER,
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];

    // 3. 4 Verified Vendors across major Pakistani Tech Markets
    this.agents = [
      {
        id: 'agent_lahore',
        userId: 'usr_agent_lahore',
        shopName: 'TechZone Hafeez Centre',
        shopSlug: 'techzone-lahore',
        shopDescription: 'Official distributor of high-end Apple, Samsung, and OnePlus flagships with physical presence in Hafeez Centre Lahore.',
        city: 'Lahore',
        address: 'Shop 42, 2nd Floor, Hafeez Centre, Main Boulevard Gulberg, Lahore',
        contactPhone: '03001234567',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
        status: AgentStatus.APPROVED,
        isVerified: true,
        rating: 4.9,
        ratingCount: 184,
        productCount: 22
      },
      {
        id: 'agent_karachi',
        userId: 'usr_agent_karachi',
        shopName: 'Galaxy Hub Techno City',
        shopSlug: 'galaxy-hub-karachi',
        shopDescription: 'Top-rated tech retailer for verified laptops, MacBooks, ASUS ROG, and high-performance gaming rigs at Technocity Karachi.',
        city: 'Karachi',
        address: 'Mezzanine Floor, Techno City Mall, I.I. Chundrigar Road, Karachi',
        contactPhone: '03219876543',
        logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&q=80',
        status: AgentStatus.APPROVED,
        isVerified: true,
        rating: 4.8,
        ratingCount: 142,
        productCount: 21
      },
      {
        id: 'agent_islamabad',
        userId: 'usr_agent_islamabad',
        shopName: 'Apex Tech Blue Area',
        shopSlug: 'apex-tech-islamabad',
        shopDescription: 'Capital city’s verified flagship boutique for genuine Apple ecosystem, pro workstation setups, and premium accessories.',
        city: 'Islamabad',
        address: 'Ground Floor, Beverly Centre, Jinnah Avenue, Blue Area, Islamabad',
        contactPhone: '03335551234',
        logoUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
        status: AgentStatus.APPROVED,
        isVerified: true,
        rating: 5.0,
        ratingCount: 98,
        productCount: 20
      },
      {
        id: 'agent_rawalpindi',
        userId: 'usr_agent_rawalpindi',
        shopName: 'Rawal Digital Electronics',
        shopSlug: 'rawal-digital-rawalpindi',
        shopDescription: 'Saddar Rawalpindi’s trusted multi-brand store specializing in smartphones, tablets, and audio gear with instant delivery in Twin Cities.',
        city: 'Rawalpindi',
        address: 'Shop 15, City Mall, Bank Road, Saddar, Rawalpindi',
        contactPhone: '03456789012',
        logoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
        status: AgentStatus.APPROVED,
        isVerified: true,
        rating: 4.7,
        ratingCount: 115,
        productCount: 20
      }
    ];

    // 4. Products: Minimum 20 products for EACH of the 4 vendors (Total 83 products)
    const rawProducts: any[] = [
      // -------------------------------------------------------------
      // VENDOR 1: TechZone Hafeez Centre Lahore (22 Products)
      // -------------------------------------------------------------
      {
        id: 'tz_p1',
        title: 'Samsung Galaxy S24 Ultra (512GB / 12GB RAM) - Titanium Black',
        slug: 'samsung-galaxy-s24-ultra-512gb-tz',
        description: 'The definitive Galaxy AI flagship smartphone. Features Snapdragon 8 Gen 3 for Galaxy, titanium frame, built-in S Pen, and 200MP Quad Telephoto Camera system. Official PTA Approved with 1-Year Local Samsung Brand Warranty.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Samsung',
        condition: ProductCondition.NEW, conditionDescription: 'Factory sealed box with official Samsung Pakistan warranty seal.',
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80', 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80'],
        basePrice: 389999, compareAtPrice: 420000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '512', battery_mah: 5000, screen_size_inch: 6.8, camera_mp: '200 MP + 50 MP + 12 MP', chipset: 'Snapdragon 8 Gen 3 for Galaxy', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 38, createdAt: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'tz_p2',
        title: 'Apple iPhone 16 Pro Max (256GB, Natural Titanium)',
        slug: 'apple-iphone-16-pro-max-256gb-tz',
        description: 'Featuring Grade 5 Titanium design with the all-new Camera Control button, A18 Pro chip, 48MP Fusion camera with 5x telephoto zoom, and unmatched battery endurance. Official PTA Approved.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.NEW, conditionDescription: 'Brand new, sealed unit with 1-year Apple international + local service support.',
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80'],
        basePrice: 485000, compareAtPrice: 510000, stock: 9, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '256', battery_mah: 4685, screen_size_inch: 6.9, camera_mp: '48 MP + 48 MP + 12 MP', chipset: 'Apple A18 Pro (3nm)', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 5.0, reviewCount: 52, createdAt: '2026-09-10T14:30:00.000Z'
      },
      {
        id: 'tz_p3',
        title: 'Apple iPhone 15 Pro (128GB, Blue Titanium) - Non-PTA',
        slug: 'apple-iphone-15-pro-128gb-blue',
        description: 'Lightweight aerospace-grade titanium frame, Action button, A17 Pro powerhouse chip, and Pro camera system with 3x optical zoom.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.USED, conditionDescription: '10/10 condition, 98% battery health, original box included.',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80'],
        basePrice: 245000, compareAtPrice: 260000, stock: 4, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '128', battery_mah: 3274, screen_size_inch: 6.1, camera_mp: '48 MP + 12 MP + 12 MP', chipset: 'Apple A17 Pro (3nm)', network: '5G', pta_approved: 'Non-PTA' },
        rating: 4.8, reviewCount: 19, createdAt: '2026-09-12T09:00:00.000Z'
      },
      {
        id: 'tz_p4',
        title: 'Google Pixel 9 Pro XL (256GB, Obsidian Black)',
        slug: 'google-pixel-9-pro-xl-256gb',
        description: 'Google’s finest AI smartphone with Tensor G4, Super Actua display, 50MP triple pro cameras, and Gemini Live built-in.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Google',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'],
        basePrice: 345000, compareAtPrice: 365000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '16', storage_gb: '256', battery_mah: 5060, screen_size_inch: 6.8, camera_mp: '50 MP + 48 MP + 48 MP', chipset: 'Google Tensor G4', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 24, createdAt: '2026-09-14T11:00:00.000Z'
      },
      {
        id: 'tz_p5',
        title: 'OnePlus 12 (512GB / 16GB RAM, Silky Black)',
        slug: 'oneplus-12-512gb-silky-black',
        description: 'Snapdragon 8 Gen 3 flagship with 4th Gen Hasselblad Camera, 2K 120Hz ProXDR display, and 100W SUPERVOOC charging.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'OnePlus',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'],
        basePrice: 228000, compareAtPrice: 245000, stock: 12, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '16', storage_gb: '512', battery_mah: 5400, screen_size_inch: 6.82, camera_mp: '50 MP + 64 MP + 48 MP', chipset: 'Snapdragon 8 Gen 3', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 31, createdAt: '2026-09-16T15:00:00.000Z'
      },
      {
        id: 'tz_p6',
        title: 'Xiaomi 14 Ultra (512GB, Leica Summilux Optics)',
        slug: 'xiaomi-14-ultra-512gb-leica',
        description: '1-inch LYT-900 sensor with stepless variable aperture, quad 50MP Leica cameras, and Snapdragon 8 Gen 3 performance.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Xiaomi',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
        basePrice: 320000, compareAtPrice: 340000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '16', storage_gb: '512', battery_mah: 5000, screen_size_inch: 6.73, camera_mp: '50 MP (1-inch) + 50 MP + 50 MP + 50 MP', chipset: 'Snapdragon 8 Gen 3', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 17, createdAt: '2026-09-18T10:00:00.000Z'
      },
      {
        id: 'tz_p7',
        title: 'Samsung Galaxy Z Fold6 (512GB, Silver Shadow)',
        slug: 'samsung-galaxy-z-fold6-512gb',
        description: 'Next-gen foldable with slimmer hinge, IP48 water resistance, Snapdragon 8 Gen 3, and immersive dual 120Hz displays.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'],
        basePrice: 535000, compareAtPrice: 560000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '512', battery_mah: 4400, screen_size_inch: 7.6, camera_mp: '50 MP + 10 MP + 12 MP', chipset: 'Snapdragon 8 Gen 3 for Galaxy', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 14, createdAt: '2026-09-20T08:00:00.000Z'
      },
      {
        id: 'tz_p8',
        title: 'Apple iPad Pro 13" (M4 Chip, 256GB Wi-Fi, Space Black)',
        slug: 'apple-ipad-pro-13-m4-256gb',
        description: 'Impossibly thin 5.1mm design, breakthrough Ultra Retina XDR OLED tandem display, and ground-breaking M4 processor.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
        basePrice: 380000, compareAtPrice: 400000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '256', battery_mah: 10290, screen_size_inch: 13.0, camera_mp: '12 MP Wide', chipset: 'Apple M4 (9-Core CPU / 10-Core GPU)', network: 'Wi-Fi 6E', pta_approved: 'Official PTA Approved' },
        rating: 5.0, reviewCount: 22, createdAt: '2026-09-22T12:00:00.000Z'
      },
      {
        id: 'tz_p9',
        title: 'Samsung Galaxy Tab S9 Ultra (512GB, 5G + S Pen)',
        slug: 'samsung-galaxy-tab-s9-ultra-512gb',
        description: 'Giant 14.6" Dynamic AMOLED 2X screen, IP68 water & dust resistance, Snapdragon 8 Gen 2, and dual selfie cameras for multi-tasking.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80'],
        basePrice: 340000, compareAtPrice: 360000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '512', battery_mah: 11200, screen_size_inch: 14.6, camera_mp: '13 MP + 8 MP', chipset: 'Snapdragon 8 Gen 2', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 16, createdAt: '2026-09-23T14:00:00.000Z'
      },
      {
        id: 'tz_p10',
        title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones - Silver',
        slug: 'sony-wh-1000xm5-silver-tz',
        description: 'Industry-leading noise cancellation with dual processors, lightweight comfort, LDAC Hi-Res audio, and 30-hour battery life.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sony',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
        basePrice: 88500, compareAtPrice: 95000, stock: 22, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 30, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 64, createdAt: '2026-09-15T09:00:00.000Z'
      },
      {
        id: 'tz_p11',
        title: 'Apple AirPods Pro 2nd Gen (USB-C MagSafe Case)',
        slug: 'apple-airpods-pro-2-usbc',
        description: 'H2 chip powerhouse with 2x Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio, and USB-C MagSafe charging case.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'],
        basePrice: 68500, compareAtPrice: 74000, stock: 35, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 30, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 88, createdAt: '2026-09-10T10:00:00.000Z'
      },
      {
        id: 'tz_p12',
        title: 'Apple Watch Ultra 2 (49mm Titanium, Orange Ocean Band)',
        slug: 'apple-watch-ultra-2-49mm',
        description: 'The ultimate sports and adventure watch with S9 SiP, 3000-nit display, precision dual-frequency GPS, and 36-hour normal battery life.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],
        basePrice: 245000, compareAtPrice: 260000, stock: 9, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 36, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 29, createdAt: '2026-09-08T11:00:00.000Z'
      },
      {
        id: 'tz_p13',
        title: 'Samsung Galaxy Watch7 (44mm, Bluetooth, Green)',
        slug: 'samsung-galaxy-watch7-44mm',
        description: 'Advanced 3nm processor, BioActive Sensor for comprehensive health insights, Dual-Frequency GPS, and personalized sleep tracking.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'],
        basePrice: 82000, compareAtPrice: 89000, stock: 15, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 40, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 19, createdAt: '2026-09-14T09:00:00.000Z'
      },
      {
        id: 'tz_p14',
        title: 'Bose QuietComfort Ultra Wireless Headphones - Black',
        slug: 'bose-quietcomfort-ultra-black',
        description: 'World-class noise cancellation, groundbreaking spatialized audio, CustomTune technology, and ultra-plush ear cushions.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Bose',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
        basePrice: 118000, compareAtPrice: 125000, stock: 11, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 24, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 23, createdAt: '2026-09-17T13:00:00.000Z'
      },
      {
        id: 'tz_p15',
        title: 'Anker Prime 20,000mAh Power Bank (200W Output, Smart Display)',
        slug: 'anker-prime-20000mah-200w',
        description: 'High-speed dual laptop charging with 200W total output, digital smart display showing live wattage, and ultra-compact form factor.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Anker',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&q=80'],
        basePrice: 38500, compareAtPrice: 42000, stock: 28, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Power Bank', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 45, createdAt: '2026-09-05T08:00:00.000Z'
      },
      {
        id: 'tz_p16',
        title: 'Nothing Phone (2) (256GB / 12GB RAM, Dark Grey)',
        slug: 'nothing-phone-2-256gb',
        description: 'Iconic Glyph Interface with customized LED notifications, Snapdragon 8+ Gen 1, dual 50MP Sony sensors, and clean Nothing OS 2.5.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Nothing',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80'],
        basePrice: 178000, compareAtPrice: 195000, stock: 10, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '256', battery_mah: 4700, screen_size_inch: 6.7, camera_mp: '50 MP + 50 MP', chipset: 'Snapdragon 8+ Gen 1', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.7, reviewCount: 28, createdAt: '2026-09-11T16:00:00.000Z'
      },
      {
        id: 'tz_p17',
        title: 'Sony WF-1000XM5 True Wireless Noise Cancelling Earbuds - Black',
        slug: 'sony-wf-1000xm5-earbuds-black',
        description: 'Integrated Processor V2, dynamic Driver Unit X, AI-based noise reduction algorithms, and bone conduction sensors for crystal-clear calls.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sony',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
        basePrice: 72000, compareAtPrice: 78000, stock: 16, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 24, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 34, createdAt: '2026-09-13T12:00:00.000Z'
      },
      {
        id: 'tz_p18',
        title: 'Samsung Galaxy Buds3 Pro (Silver)',
        slug: 'samsung-galaxy-buds3-pro-silver',
        description: 'Blade design with dynamic lights, enhanced 2-way speaker with planar tweeter, 24-bit Hi-Fi audio codec, and Galaxy AI live interpreter.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80'],
        basePrice: 62000, compareAtPrice: 67000, stock: 20, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 30, warranty_months: '12 Months' },
        rating: 4.7, reviewCount: 15, createdAt: '2026-09-19T11:00:00.000Z'
      },
      {
        id: 'tz_p19',
        title: 'Apple 140W USB-C Power Adapter (Original Box)',
        slug: 'apple-140w-usbc-power-adapter',
        description: 'Fast, efficient charging at home, in the office, or on the go. Optimized for 16-inch MacBook Pro fast charging (0 to 50% in 30 mins).',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'],
        basePrice: 28500, compareAtPrice: 32000, stock: 40, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Charger & Cable', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 39, createdAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'tz_p20',
        title: 'Marshall Emberton II Portable Bluetooth Speaker - Black & Brass',
        slug: 'marshall-emberton-ii-speaker',
        description: 'Signature 360° True Stereophonic multidirectional sound, 30+ hours of portable playtime, and tough IP67 dust and water-resistance rating.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Marshall',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'],
        basePrice: 52000, compareAtPrice: 58000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 32, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 42, createdAt: '2026-09-04T15:00:00.000Z'
      },
      {
        id: 'tz_p21',
        title: 'DJI Osmo Pocket 3 Creator Combo (4K 120fps Gimbal Camera)',
        slug: 'dji-osmo-pocket-3-creator-combo',
        description: 'Powerful 1-inch CMOS sensor, 2-inch rotatable OLED touchscreen, 3-axis mechanical stabilization, and DJI Mic 2 transmitter included.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'DJI',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'],
        basePrice: 195000, compareAtPrice: 210000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 16, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 30, createdAt: '2026-09-07T12:00:00.000Z'
      },
      {
        id: 'tz_p22',
        title: 'Garmin Fenix 7 Pro Sapphire Solar (Titanium with Black DLC)',
        slug: 'garmin-fenix-7-pro-sapphire-solar',
        description: 'Multisport GPS smartwatch with Power Sapphire solar charging lens, built-in LED flashlight, endurance score, and TopoActive maps.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Garmin',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'],
        basePrice: 265000, compareAtPrice: 285000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_lahore', agentShopName: 'TechZone Hafeez Centre', agentCity: 'Lahore', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 52, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 16, createdAt: '2026-09-09T08:00:00.000Z'
      },

      // -------------------------------------------------------------
      // VENDOR 2: Galaxy Hub Techno City Karachi (21 Products)
      // -------------------------------------------------------------
      {
        id: 'gh_p1',
        title: 'MacBook Pro 16" (M3 Max 14-Core CPU, 30-Core GPU, 36GB RAM, 1TB SSD) - Space Black',
        slug: 'macbook-pro-16-m3-max-36gb-gh',
        description: 'The ultimate powerhouse for software engineers, 3D artists, and AI engineers. Features Liquid Retina XDR display, up to 22 hours battery life, 140W fast charger, and pro connectivity.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW, conditionDescription: 'Factory sealed box with standard Apple global warranty.',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80'],
        basePrice: 895000, compareAtPrice: 940000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Apple M3 Max (14-Core CPU)', ram_gb: '36', storage_gb: '1024', gpu: '30-Core Integrated GPU (Ray Tracing)', screen_size_inch: '16.0', screen_refresh_rate: '120', weight_kg: 2.14 },
        rating: 4.9, reviewCount: 21, createdAt: '2026-08-20T08:00:00.000Z'
      },
      {
        id: 'gh_p2',
        title: 'ASUS ROG Zephyrus G16 (Core Ultra 9 185H, RTX 4080 12GB, 32GB RAM, 1TB SSD OLED 240Hz)',
        slug: 'asus-rog-zephyrus-g16-rtx4080-gh',
        description: 'Sleek CNC aluminum gaming powerhouse featuring a 2.5K 240Hz OLED ROG Nebula display, Vapor Chamber cooling, and custom slash lighting array.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'ASUS',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'],
        basePrice: 765000, compareAtPrice: 810000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 9 185H (16-Core)', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4080 12GB GDDR6', screen_size_inch: '16.0', screen_refresh_rate: '240', weight_kg: 1.85 },
        rating: 4.8, reviewCount: 16, createdAt: '2026-09-05T12:00:00.000Z'
      },
      {
        id: 'gh_p3',
        title: 'Lenovo Legion Pro 7i Gen 9 (i9-14900HX, RTX 4090 16GB, 32GB DDR5, 2TB SSD 240Hz WQXGA)',
        slug: 'lenovo-legion-pro-7i-rtx4090',
        description: 'Top-tier esports laptop with AI Engine+ Legion Coldfront 5.0 vapor chamber, full-power 175W RTX 4090, and Per-Key RGB keyboard.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Lenovo',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80'],
        basePrice: 950000, compareAtPrice: 999000, stock: 4, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core i9-14900HX (24-Core)', ram_gb: '32', storage_gb: '2048', gpu: 'NVIDIA GeForce RTX 4090 16GB GDDR6 (175W)', screen_size_inch: '16.0', screen_refresh_rate: '240', weight_kg: 2.62 },
        rating: 5.0, reviewCount: 19, createdAt: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'gh_p4',
        title: 'Dell XPS 16 9640 (Intel Core Ultra 7 155H, RTX 4070, 32GB LPDDR5X, 1TB SSD 4K OLED)',
        slug: 'dell-xps-16-9640-4k-oled',
        description: 'Seamless glass touchpad, invisible capacitive function keys, 4K+ InfinityEdge OLED touch panel, and premium CNC machined aluminum.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Dell',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80'],
        basePrice: 720000, compareAtPrice: 760000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 7 155H (16-Core)', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4070 8GB', screen_size_inch: '16.0', screen_refresh_rate: '120', weight_kg: 2.13 },
        rating: 4.8, reviewCount: 12, createdAt: '2026-09-03T11:00:00.000Z'
      },
      {
        id: 'gh_p5',
        title: 'Apple MacBook Air 15" (M3 Chip 8-Core CPU, 10-Core GPU, 16GB RAM, 512GB SSD) - Starlight',
        slug: 'apple-macbook-air-15-m3-16gb',
        description: 'Unbelievably thin and fast with 15.3-inch Liquid Retina display, MagSafe 3 charging, dual Thunderbolt ports, and all-day 18-hour battery.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        basePrice: 465000, compareAtPrice: 495000, stock: 12, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Apple M3 (8-Core CPU / 10-Core GPU)', ram_gb: '16', storage_gb: '512', gpu: '10-Core Integrated GPU', screen_size_inch: '15.6', screen_refresh_rate: '60', weight_kg: 1.51 },
        rating: 4.9, reviewCount: 33, createdAt: '2026-09-06T14:00:00.000Z'
      },
      {
        id: 'gh_p6',
        title: 'Razer Blade 16 (i9-14900HX, Dual-Mode Mini-LED 4K/FHD 240Hz, RTX 4080 12GB, 32GB RAM)',
        slug: 'razer-blade-16-dual-mode-mini-led',
        description: 'World’s first dual-mode Mini-LED display (switch between 4K 120Hz and FHD+ 240Hz), anodized unibody chassis, and patented vapor chamber.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Razer',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'],
        basePrice: 885000, compareAtPrice: 920000, stock: 3, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core i9-14900HX (24-Core)', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4080 12GB GDDR6', screen_size_inch: '16.0', screen_refresh_rate: '240', weight_kg: 2.45 },
        rating: 5.0, reviewCount: 15, createdAt: '2026-09-08T10:00:00.000Z'
      },
      {
        id: 'gh_p7',
        title: 'HP Omen Transcend 14 (Intel Core Ultra 9 185H, RTX 4070, 32GB RAM, 1TB SSD 2.8K OLED)',
        slug: 'hp-omen-transcend-14-oled',
        description: 'Ultra-portable 1.6kg gaming laptop with HyperX audio tuning, IMAX Enhanced 120Hz OLED screen, and USB-C 140W fast power delivery.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'HP',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'],
        basePrice: 590000, compareAtPrice: 625000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 9 185H', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4070 8GB GDDR6', screen_size_inch: '14.0', screen_refresh_rate: '120', weight_kg: 1.63 },
        rating: 4.8, reviewCount: 18, createdAt: '2026-09-10T09:00:00.000Z'
      },
      {
        id: 'gh_p8',
        title: 'Lenovo ThinkPad X1 Carbon Gen 12 (Core Ultra 7 165U, 32GB RAM, 1TB SSD 2.8K OLED)',
        slug: 'lenovo-thinkpad-x1-carbon-gen-12',
        description: 'The executive standard ultralight workstation featuring carbon fiber weave lid, 120Hz OLED HDR display, Communications Bar with 8MP MIPI camera.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Lenovo',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80'],
        basePrice: 645000, compareAtPrice: 680000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 7 165U (vPro)', ram_gb: '32', storage_gb: '1024', gpu: 'Intel Arc Graphics', screen_size_inch: '14.0', screen_refresh_rate: '120', weight_kg: 1.09 },
        rating: 4.9, reviewCount: 26, createdAt: '2026-09-12T15:00:00.000Z'
      },
      {
        id: 'gh_p9',
        title: 'ASUS ROG Strix SCAR 18 (i9-14900HX, RTX 4090 16GB, 64GB DDR5, 2TB SSD 2.5K Mini-LED)',
        slug: 'asus-rog-strix-scar-18-rtx4090',
        description: 'Desktop replacement colossus featuring an 18-inch 1100-nit Mini-LED 240Hz ROG Nebula HDR display, Conductonaut Extreme Liquid Metal cooling.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'ASUS',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80'],
        basePrice: 1150000, compareAtPrice: 1200000, stock: 3, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core i9-14900HX (24-Core)', ram_gb: '64', storage_gb: '2048', gpu: 'NVIDIA GeForce RTX 4090 16GB (175W TGP)', screen_size_inch: '17.3', screen_refresh_rate: '240', weight_kg: 3.1 },
        rating: 5.0, reviewCount: 11, createdAt: '2026-09-15T12:00:00.000Z'
      },
      {
        id: 'gh_p10',
        title: 'Acer Predator Helios 16 (i9-14900HX, RTX 4080 12GB, 32GB RAM, 1TB SSD 240Hz WQXGA)',
        slug: 'acer-predator-helios-16-rtx4080',
        description: '5th Gen AeroBlade 3D fan technology, MagKey 3.0 swappable mechanical keycaps, and full 175W RTX 4080 performance.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Acer',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80'],
        basePrice: 695000, compareAtPrice: 740000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core i9-14900HX', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4080 12GB (175W)', screen_size_inch: '16.0', screen_refresh_rate: '240', weight_kg: 2.6 },
        rating: 4.8, reviewCount: 14, createdAt: '2026-09-16T10:00:00.000Z'
      },
      {
        id: 'gh_p11',
        title: 'MSI Stealth 16 AI Studio (Intel Core Ultra 9 185H, RTX 4070 8GB, 32GB RAM, 1TB SSD 4K 120Hz)',
        slug: 'msi-stealth-16-ai-studio',
        description: 'Magnesium-aluminum alloy featherlight body, 99.9Wh max airplane-legal battery, Dynaudio 6-speaker sound system, and SteelSeries per-key RGB.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'MSI',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'],
        basePrice: 680000, compareAtPrice: 715000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 9 185H', ram_gb: '32', storage_gb: '1024', gpu: 'NVIDIA GeForce RTX 4070 8GB', screen_size_inch: '16.0', screen_refresh_rate: '120', weight_kg: 1.99 },
        rating: 4.7, reviewCount: 9, createdAt: '2026-09-18T14:00:00.000Z'
      },
      {
        id: 'gh_p12',
        title: 'Apple MacBook Pro 14" (M3 Pro 11-Core CPU, 14-Core GPU, 18GB RAM, 512GB SSD) - Space Black',
        slug: 'apple-macbook-pro-14-m3-pro-18gb',
        description: 'Liquid Retina XDR display with ProMotion 120Hz, up to 18 hours battery, HDMI 2.1, SDXC card slot, and three Thunderbolt 4 ports.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        basePrice: 595000, compareAtPrice: 630000, stock: 10, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Apple M3 Pro (11-Core CPU)', ram_gb: '16', storage_gb: '512', gpu: '14-Core Integrated GPU', screen_size_inch: '14.0', screen_refresh_rate: '120', weight_kg: 1.61 },
        rating: 5.0, reviewCount: 41, createdAt: '2026-09-20T10:00:00.000Z'
      },
      {
        id: 'gh_p13',
        title: 'ASUS Zenbook Duo 2024 (Dual 14" 3K 120Hz OLED Touchscreens, Core Ultra 9, 32GB RAM, 2TB SSD)',
        slug: 'asus-zenbook-duo-dual-oled',
        description: 'Revolutionary dual full-size 3K 120Hz ASUS Lumina OLED touch displays with detachable Bluetooth keyboard and built-in kickstand.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'ASUS',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'],
        basePrice: 675000, compareAtPrice: 710000, stock: 4, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core Ultra 9 185H', ram_gb: '32', storage_gb: '2048', gpu: 'Intel Arc Graphics', screen_size_inch: '14.0', screen_refresh_rate: '120', weight_kg: 1.65 },
        rating: 4.9, reviewCount: 20, createdAt: '2026-09-21T11:00:00.000Z'
      },
      {
        id: 'gh_p14',
        title: 'MacBook Pro 16" M1 Max (32GB Unified RAM, 1TB SSD) - Space Gray',
        slug: 'macbook-pro-16-m1-max-32gb-used',
        description: 'Certified Refurbished M1 Max with 10-core CPU and 32-core GPU. Complete 100-point inspection seal and 6-month merchant warranty.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.REFURBISHED, conditionDescription: 'Grade A+ refurbished, 96% battery health, original 140W MagSafe charger.',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        basePrice: 420000, compareAtPrice: 460000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Apple M1 Max (10-Core CPU)', ram_gb: '32', storage_gb: '1024', gpu: '32-Core Integrated GPU', screen_size_inch: '16.0', screen_refresh_rate: '120', weight_kg: 2.15 },
        rating: 4.9, reviewCount: 17, createdAt: '2026-09-22T08:00:00.000Z'
      },
      {
        id: 'gh_p15',
        title: 'NVIDIA GeForce RTX 4090 Founders Edition 24GB GDDR6X',
        slug: 'nvidia-rtx-4090-founders-edition-24gb',
        description: 'The pinnacle of desktop GPU architecture. Ada Lovelace architecture, 16,384 CUDA cores, 3rd gen RT cores, and DLSS 3 frame generation.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'NVIDIA',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80'],
        basePrice: 685000, compareAtPrice: 720000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Desktop GPU Card', ram_gb: '24', storage_gb: '2048', gpu: 'NVIDIA GeForce RTX 4090 24GB GDDR6X', screen_size_inch: '15.6', screen_refresh_rate: '240', weight_kg: 2.18 },
        rating: 5.0, reviewCount: 27, createdAt: '2026-09-23T16:00:00.000Z'
      },
      {
        id: 'gh_p16',
        title: 'Dell Alienware m18 R2 (i9-14900HX, RTX 4090 16GB, 64GB DDR5, 4TB RAID SSD, 480Hz FHD+)',
        slug: 'dell-alienware-m18-r2-rtx4090',
        description: 'Monster gaming station featuring Element 31 thermal interface, Cryo-tech cooling, CherryMX mechanical keyboard, and quad SSD slots.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Dell',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80'],
        basePrice: 1280000, compareAtPrice: 1350000, stock: 2, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'Intel Core i9-14900HX', ram_gb: '64', storage_gb: '2048', gpu: 'NVIDIA GeForce RTX 4090 16GB (175W)', screen_size_inch: '17.3', screen_refresh_rate: '240', weight_kg: 4.04 },
        rating: 5.0, reviewCount: 8, createdAt: '2026-09-24T12:00:00.000Z'
      },
      {
        id: 'gh_p17',
        title: 'Logitech G PRO X Superlight 2 Wireless Gaming Mouse - Magenta',
        slug: 'logitech-g-pro-x-superlight-2-magenta',
        description: '60g ultra-lightweight championship mouse, LIGHTFORCE hybrid optical-mechanical switches, HERO 2 sensor with 32,000 DPI and 4000Hz polling.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Logitech',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'],
        basePrice: 44500, compareAtPrice: 48000, stock: 25, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Wireless 2.4GHz', battery_life_hours: 95, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 52, createdAt: '2026-09-14T11:00:00.000Z'
      },
      {
        id: 'gh_p18',
        title: 'Keychron Q1 Max Custom Wireless Mechanical Keyboard (Banana Switches)',
        slug: 'keychron-q1-max-wireless-banana',
        description: 'Full CNC aluminum body, double-gasket design, acoustic acoustic foam dampeners, hot-swappable PCB, and 2.4GHz wireless connection.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Keychron',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
        basePrice: 65000, compareAtPrice: 70000, stock: 12, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Wireless 2.4GHz', battery_life_hours: 100, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 38, createdAt: '2026-09-16T14:00:00.000Z'
      },
      {
        id: 'gh_p19',
        title: 'ASUS ROG Swift OLED PG32UCDM 32" 4K 240Hz QD-OLED Gaming Monitor',
        slug: 'asus-rog-swift-oled-pg32ucdm-4k-240hz',
        description: '3rd gen QD-OLED panel, 4K UHD resolution, 240Hz refresh rate, 0.03ms response time, custom heatsink with graphene film for anti-burn-in.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'ASUS',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
        basePrice: 420000, compareAtPrice: 450000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { cpu: 'External QD-OLED Display', ram_gb: '16', storage_gb: '512', gpu: 'HDMI 2.1 & DP 1.4', screen_size_inch: '17.3', screen_refresh_rate: '240', weight_kg: 7.3 },
        rating: 5.0, reviewCount: 19, createdAt: '2026-09-19T09:00:00.000Z'
      },
      {
        id: 'gh_p20',
        title: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe M.2 SSD with Heatsink',
        slug: 'samsung-990-pro-4tb-nvme-heatsink',
        description: 'Unleash blistering read speeds up to 7,450 MB/s and write speeds up to 6,900 MB/s with integrated thermal control for PS5 and PC.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
        basePrice: 115000, compareAtPrice: 125000, stock: 20, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { accessory_type: 'Power Bank', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 47, createdAt: '2026-09-21T13:00:00.000Z'
      },
      {
        id: 'gh_p21',
        title: 'CalDigit TS4 Thunderbolt 4 Dock (18 Ports, 98W Power Delivery)',
        slug: 'caldigit-ts4-thunderbolt-4-dock',
        description: 'The ultimate expansion dock for Mac and Windows. 18 ports including DisplayPort 1.4, 2.5GbE Ethernet, UHS-II SD card slot, and 98W host charging.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'CalDigit',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
        basePrice: 125000, compareAtPrice: 135000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_karachi', agentShopName: 'Galaxy Hub Techno City', agentCity: 'Karachi', agentIsVerified: true,
        specs: { accessory_type: 'Charger & Cable', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 22, createdAt: '2026-09-24T10:00:00.000Z'
      },

      // -------------------------------------------------------------
      // VENDOR 3: Apex Tech Blue Area Islamabad (20 Products)
      // -------------------------------------------------------------
      {
        id: 'ap_p1',
        title: 'Apple Mac Studio (M2 Ultra 24-Core CPU, 60-Core GPU, 64GB RAM, 1TB SSD)',
        slug: 'apple-mac-studio-m2-ultra-64gb',
        description: 'Outrageous performance in a compact desktop form. Run massive AI models, render complex 3D scenes, and encode up to 22 streams of 8K ProRes video.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        basePrice: 1180000, compareAtPrice: 1250000, stock: 4, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'Apple M2 Ultra (24-Core)', ram_gb: '64', storage_gb: '1024', gpu: '60-Core Integrated GPU', screen_size_inch: '15.6', screen_refresh_rate: '60', weight_kg: 3.6 },
        rating: 5.0, reviewCount: 14, createdAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'ap_p2',
        title: 'Apple Studio Display 27" 5K Retina (Standard Glass, Tilt Stand)',
        slug: 'apple-studio-display-27-5k',
        description: '5K Retina display with 600 nits brightness, P3 wide color, 12MP Ultra Wide camera with Center Stage, and studio-quality 6-speaker array.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
        basePrice: 475000, compareAtPrice: 510000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'Apple A13 Bionic Studio Chip', ram_gb: '8', storage_gb: '256', gpu: '5K 5120x2880 Retina Panel', screen_size_inch: '17.3', screen_refresh_rate: '60', weight_kg: 6.3 },
        rating: 4.9, reviewCount: 18, createdAt: '2026-09-04T12:00:00.000Z'
      },
      {
        id: 'ap_p3',
        title: 'Sony PlayStation 5 Pro Console (2TB SSD, Enhanced Ray Tracing, PSSR AI Upscaling)',
        slug: 'sony-playstation-5-pro-2tb',
        description: 'Next-generation PlayStation with upgraded GPU (67% more compute units), Advanced Ray Tracing, PlayStation Spectral Super Resolution (PSSR), and DualSense controller.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Sony',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80'],
        basePrice: 265000, compareAtPrice: 285000, stock: 15, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'Custom AMD Zen 2 (8-Core)', ram_gb: '16', storage_gb: '2048', gpu: 'RDNA 3 Customized 16.7 TFLOPS', screen_size_inch: '15.6', screen_refresh_rate: '120', weight_kg: 3.1 },
        rating: 5.0, reviewCount: 42, createdAt: '2026-09-10T11:00:00.000Z'
      },
      {
        id: 'ap_p4',
        title: 'Meta Quest 3 (512GB Breakthrough Mixed Reality Headset)',
        slug: 'meta-quest-3-512gb-vr',
        description: 'Next-gen Snapdragon XR2 Gen 2 chip, 4K+ Infinite Display (nearly 30% jump in resolution), full-color high-resolution passthrough, and Touch Plus controllers.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Meta',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80'],
        basePrice: 215000, compareAtPrice: 230000, stock: 11, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Wireless 2.4GHz', battery_life_hours: 3, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 31, createdAt: '2026-09-11T13:00:00.000Z'
      },
      {
        id: 'ap_p5',
        title: 'Apple Vision Pro (512GB Spatial Computer)',
        slug: 'apple-vision-pro-512gb',
        description: 'Revolutionary spatial computer blending digital content with physical space. Micro-OLED displays with 23 million pixels, M2 + R1 dual-chip design, and visionOS.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80'],
        basePrice: 1050000, compareAtPrice: 1120000, stock: 3, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 3, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 16, createdAt: '2026-09-13T10:00:00.000Z'
      },
      {
        id: 'ap_p6',
        title: 'Apple Magic Keyboard with Touch ID and Numeric Keypad - Black',
        slug: 'apple-magic-keyboard-touchid-black',
        description: 'Wireless and rechargeable keyboard with Touch ID for fast, secure authentication. Extended layout with document navigation controls.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
        basePrice: 58000, compareAtPrice: 63000, stock: 18, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Bluetooth', battery_life_hours: 200, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 22, createdAt: '2026-09-08T09:00:00.000Z'
      },
      {
        id: 'ap_p7',
        title: 'Apple Magic Trackpad - Black Surface',
        slug: 'apple-magic-trackpad-black',
        description: 'Rechargeable wireless trackpad supporting full range of Multi-Touch gestures and Force Touch technology with edge-to-edge glass surface.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
        basePrice: 42000, compareAtPrice: 46000, stock: 22, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Bluetooth', battery_life_hours: 150, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 19, createdAt: '2026-09-10T16:00:00.000Z'
      },
      {
        id: 'ap_p8',
        title: 'ASUS ROG Ally X (AMD Ryzen Z1 Extreme, 24GB LPDDR5X, 1TB SSD, 80Wh Battery, 120Hz VRR)',
        slug: 'asus-rog-ally-x-handheld',
        description: 'Upgraded Windows handheld console with double the battery capacity (80Wh), redesigned ergonomic grips, dual USB-C ports with USB4 support.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'ASUS',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'],
        basePrice: 255000, compareAtPrice: 275000, stock: 9, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'AMD Ryzen Z1 Extreme (8-Core)', ram_gb: '24', storage_gb: '1024', gpu: 'AMD Radeon Graphics (RDNA 3)', screen_size_inch: '13.3', screen_refresh_rate: '120', weight_kg: 0.67 },
        rating: 4.9, reviewCount: 37, createdAt: '2026-09-15T14:00:00.000Z'
      },
      {
        id: 'ap_p9',
        title: 'Steam Deck OLED (1TB Limited Edition, HDR OLED 90Hz Display)',
        slug: 'steam-deck-oled-1tb',
        description: 'Vibrant 7.4-inch HDR OLED display with 1,000,000:1 contrast, 50Wh battery for 3-12 hours of gameplay, Wi-Fi 6E, and anti-glare etched glass.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Valve',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80'],
        basePrice: 225000, compareAtPrice: 240000, stock: 12, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'Custom AMD 6nm APU', ram_gb: '16', storage_gb: '1024', gpu: '8 RDNA 2 CUs', screen_size_inch: '13.3', screen_refresh_rate: '120', weight_kg: 0.64 },
        rating: 5.0, reviewCount: 45, createdAt: '2026-09-17T09:00:00.000Z'
      },
      {
        id: 'ap_p10',
        title: 'Sonos Move 2 Portable Smart Speaker - White',
        slug: 'sonos-move-2-smart-speaker',
        description: 'Upgraded acoustic architecture with dual tweeters for spacious stereo sound, 24 hours of continuous playback, Wi-Fi and Bluetooth simultaneous playback.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sonos',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'],
        basePrice: 145000, compareAtPrice: 158000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 24, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 16, createdAt: '2026-09-18T10:00:00.000Z'
      },
      {
        id: 'ap_p11',
        title: 'Shure SM7B Cardioid Dynamic Vocal Studio Microphone',
        slug: 'shure-sm7b-vocal-microphone',
        description: 'Legendary broadcast vocal microphone delivering warm, smooth audio reproduction with electromagnetic shielding against computer hum.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Shure',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
        basePrice: 125000, compareAtPrice: 138000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 58, createdAt: '2026-09-05T14:00:00.000Z'
      },
      {
        id: 'ap_p12',
        title: 'Elgato Stream Deck MK.2 (15 Customizable LCD Keys, White)',
        slug: 'elgato-stream-deck-mk2-white',
        description: 'Trigger actions, launch media, adjust audio, toggle lighting, and control OBS/Twitch with tactile visual LCD keys.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Elgato',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'],
        basePrice: 48500, compareAtPrice: 53000, stock: 16, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 27, createdAt: '2026-09-07T11:00:00.000Z'
      },
      {
        id: 'ap_p13',
        title: 'Sennheiser Momentum 4 Wireless ANC Headphones - Copper Edition',
        slug: 'sennheiser-momentum-4-copper',
        description: 'Audiophile-inspired 42mm transducer system, remarkable 60-hour battery life, customizable EQ, and advanced hybrid noise cancellation.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sennheiser',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
        basePrice: 98000, compareAtPrice: 106000, stock: 10, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 60, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 23, createdAt: '2026-09-12T10:00:00.000Z'
      },
      {
        id: 'ap_p14',
        title: 'Apple iPhone 16 Plus (256GB, Ultramarine)',
        slug: 'apple-iphone-16-plus-256gb-ultramarine',
        description: 'Super Retina XDR 6.7" OLED display, A18 processor with Apple Intelligence, 48MP Fusion Camera, and industry-leading battery life.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'],
        basePrice: 395000, compareAtPrice: 420000, stock: 7, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '256', battery_mah: 4674, screen_size_inch: 6.7, camera_mp: '48 MP + 12 MP', chipset: 'Apple A18 (3nm)', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 19, createdAt: '2026-09-14T15:00:00.000Z'
      },
      {
        id: 'ap_p15',
        title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera (Body Only)',
        slug: 'sony-alpha-7-iv-camera-body',
        description: '33MP Exmor R full-frame sensor, BIONZ XR processing engine, 4K 60p 10-bit 4:2:2 recording, and real-time eye autofocus for humans/animals.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sony',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'],
        basePrice: 650000, compareAtPrice: 685000, stock: 4, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 5, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 25, createdAt: '2026-09-16T12:00:00.000Z'
      },
      {
        id: 'ap_p16',
        title: 'Apple Mac mini (M2 Pro 10-Core CPU, 16-Core GPU, 16GB RAM, 512GB SSD)',
        slug: 'apple-mac-mini-m2-pro-16gb',
        description: 'Compact desktop powerhouse with four Thunderbolt 4 ports, two USB-A ports, HDMI 2.1, Gigabit Ethernet, and support for up to 3 displays.',
        categoryId: 'cat_laptops', categoryName: 'Laptops & Computers', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
        basePrice: 385000, compareAtPrice: 410000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { cpu: 'Apple M2 Pro (10-Core)', ram_gb: '16', storage_gb: '512', gpu: '16-Core Integrated GPU', screen_size_inch: '14.0', screen_refresh_rate: '60', weight_kg: 1.28 },
        rating: 4.9, reviewCount: 22, createdAt: '2026-09-19T08:00:00.000Z'
      },
      {
        id: 'ap_p17',
        title: 'BenQ ScreenBar Halo LED Monitor Light with Wireless Controller',
        slug: 'benq-screenbar-halo-monitor-light',
        description: 'Auto-dimming desk lamp with front and back dual lighting, zero screen glare, patented clamp design, and smart wireless dial controller.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'BenQ',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
        basePrice: 45000, compareAtPrice: 49000, stock: 15, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Charger & Cable', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 30, createdAt: '2026-09-20T16:00:00.000Z'
      },
      {
        id: 'ap_p18',
        title: 'Google Pixel 8a (128GB, Bay Blue) - Official PTA Approved',
        slug: 'google-pixel-8a-128gb-bay-blue',
        description: 'The AI smartphone that gives you top-rated Pixel camera capabilities, Google Tensor G3 performance, and 7 years of OS updates.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Google',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'],
        basePrice: 158000, compareAtPrice: 170000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '128', battery_mah: 4492, screen_size_inch: 6.1, camera_mp: '64 MP + 13 MP', chipset: 'Google Tensor G3', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 28, createdAt: '2026-09-22T11:00:00.000Z'
      },
      {
        id: 'ap_p19',
        title: 'Sonos Beam Gen 2 Smart Soundbar with Dolby Atmos - Black',
        slug: 'sonos-beam-gen-2-dolby-atmos',
        description: 'Immersive sound for movies and gaming with crystal-clear dialogue, Apple AirPlay 2 support, and seamless HDMI eARC connectivity.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Sonos',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'],
        basePrice: 165000, compareAtPrice: 180000, stock: 6, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 17, createdAt: '2026-09-23T15:00:00.000Z'
      },
      {
        id: 'ap_p20',
        title: 'Apple Pencil Pro (Find My Support, Squeeze Gesture, Haptic Feedback)',
        slug: 'apple-pencil-pro-ipad',
        description: 'Engineered for limitless creativity with squeeze sensory, barrel roll rotation, haptic feedback engine, and magnetic pairing/charging.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
        basePrice: 42500, compareAtPrice: 46000, stock: 24, status: ProductStatus.PUBLISHED,
        agentId: 'agent_islamabad', agentShopName: 'Apex Tech Blue Area', agentCity: 'Islamabad', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 12, warranty_months: '12 Months' },
        rating: 5.0, reviewCount: 36, createdAt: '2026-09-24T09:00:00.000Z'
      },

      // -------------------------------------------------------------
      // VENDOR 4: Rawal Digital Electronics Saddar Rawalpindi (20 Products)
      // -------------------------------------------------------------
      {
        id: 'rd_p1',
        title: 'Samsung Galaxy S23 Ultra (256GB / 12GB RAM, Phantom Black) - PTA Approved',
        slug: 'samsung-galaxy-s23-ultra-256gb-used',
        description: 'Certified tested 10/10 condition unit with 200MP Nightography camera, Snapdragon 8 Gen 2 for Galaxy, 5000mAh battery and built-in S Pen.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Samsung',
        condition: ProductCondition.USED, conditionDescription: '10/10 scratchless body, original packaging and charging cable.',
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'],
        basePrice: 248000, compareAtPrice: 270000, stock: 8, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '256', battery_mah: 5000, screen_size_inch: 6.8, camera_mp: '200 MP + 10 MP + 10 MP + 12 MP', chipset: 'Snapdragon 8 Gen 2 for Galaxy', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 31, createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 'rd_p2',
        title: 'Xiaomi Redmi Note 13 Pro+ 5G (512GB / 12GB RAM, Aurora Purple)',
        slug: 'xiaomi-redmi-note-13-pro-plus-512gb',
        description: 'Flagship curved 1.5K 120Hz AMOLED, 200MP OIS camera, IP68 water resistance, Dimensity 7200 Ultra, and 120W HyperCharge (0-100% in 19 mins).',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Xiaomi',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
        basePrice: 139999, compareAtPrice: 149999, stock: 18, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '512', battery_mah: 5000, screen_size_inch: 6.67, camera_mp: '200 MP OIS + 8 MP + 2 MP', chipset: 'MediaTek Dimensity 7200 Ultra', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.7, reviewCount: 44, createdAt: '2026-09-05T14:00:00.000Z'
      },
      {
        id: 'rd_p3',
        title: 'Realme GT 6 (512GB / 16GB RAM, Fluid Silver)',
        slug: 'realme-gt-6-512gb-silver',
        description: 'Snapdragon 8s Gen 3 flagship killer with record-breaking 6000-nit Ultra Bright AMOLED display, Sony LYT-808 OIS camera, and 120W charge.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Realme',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'],
        basePrice: 165000, compareAtPrice: 178000, stock: 12, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '16', storage_gb: '512', battery_mah: 5500, screen_size_inch: 6.78, camera_mp: '50 MP + 50 MP + 8 MP', chipset: 'Snapdragon 8s Gen 3', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 20, createdAt: '2026-09-07T09:00:00.000Z'
      },
      {
        id: 'rd_p4',
        title: 'Apple iPhone 14 Pro (128GB, Deep Purple) - PTA Approved',
        slug: 'apple-iphone-14-pro-128gb-purple-used',
        description: 'Dynamic Island pioneer featuring always-on 120Hz ProMotion display, A16 Bionic processor, and 48MP Pro camera system.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.USED, conditionDescription: 'Battery health 92%, clean condition, zero repairs.',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80'],
        basePrice: 285000, compareAtPrice: 305000, stock: 5, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '6', storage_gb: '128', battery_mah: 3200, screen_size_inch: 6.1, camera_mp: '48 MP + 12 MP + 12 MP', chipset: 'Apple A16 Bionic', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 26, createdAt: '2026-09-09T16:00:00.000Z'
      },
      {
        id: 'rd_p5',
        title: 'OnePlus Nord 4 5G (256GB / 12GB RAM, Mercurial Silver)',
        slug: 'oneplus-nord-4-5g-256gb',
        description: 'Only 5G metal unibody smartphone in its class. Features Snapdragon 7+ Gen 3, 5500mAh largest OnePlus battery, and 100W fast charging.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'OnePlus',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'],
        basePrice: 135000, compareAtPrice: 145000, stock: 15, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '256', battery_mah: 5500, screen_size_inch: 6.74, camera_mp: '50 MP Sony LYT-600 + 8 MP', chipset: 'Snapdragon 7+ Gen 3', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.7, reviewCount: 19, createdAt: '2026-09-11T12:00:00.000Z'
      },
      {
        id: 'rd_p6',
        title: 'Infinix GT 20 Pro 5G (256GB / 12GB RAM, Mecha Blue)',
        slug: 'infinix-gt-20-pro-5g-mecha',
        description: 'Dedicated Gaming Display Chip Pixelworks X5 Turbo, MediaTek Dimensity 8200 Ultimate, 144Hz FHD+ bezel-less AMOLED, and Mecha Loop LED.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Infinix',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80'],
        basePrice: 84999, compareAtPrice: 89999, stock: 24, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '256', battery_mah: 5000, screen_size_inch: 6.78, camera_mp: '108 MP OIS + 2 MP + 2 MP', chipset: 'MediaTek Dimensity 8200 Ultimate', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.6, reviewCount: 38, createdAt: '2026-09-13T10:00:00.000Z'
      },
      {
        id: 'rd_p7',
        title: 'Tecno Camon 30 Premier 5G (512GB / 12GB RAM, Alps Snowy Silver)',
        slug: 'tecno-camon-30-premier-512gb',
        description: 'PolarAce Imaging Chip with Sony CXD5622GG ISP, quad 50MP cameras with 70mm periscope zoom, and LTPO 1.5K 120Hz display.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Tecno',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
        basePrice: 119999, compareAtPrice: 128000, stock: 16, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '12', storage_gb: '512', battery_mah: 5000, screen_size_inch: 6.77, camera_mp: '50 MP + 50 MP + 50 MP Periscope + 50 MP Selfie', chipset: 'Dimensity 8200 Ultimate', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.7, reviewCount: 22, createdAt: '2026-09-15T09:00:00.000Z'
      },
      {
        id: 'rd_p8',
        title: 'Samsung Galaxy A55 5G (256GB / 8GB RAM, Awesome Navy)',
        slug: 'samsung-galaxy-a55-5g-256gb',
        description: 'Metal frame with Gorilla Glass Victus+, 50MP main camera with Nightography, Exynos 1480 with AMD Xclipse 530 GPU, and IP67 rating.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'],
        basePrice: 129999, compareAtPrice: 139999, stock: 20, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '256', battery_mah: 5000, screen_size_inch: 6.6, camera_mp: '50 MP + 12 MP + 5 MP', chipset: 'Exynos 1480 (AMD GPU)', network: '5G', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 35, createdAt: '2026-09-17T11:00:00.000Z'
      },
      {
        id: 'rd_p9',
        title: 'Xiaomi Pad 6 (256GB / 8GB RAM, Mist Blue) with Smart Pen 2nd Gen',
        slug: 'xiaomi-pad-6-256gb-blue',
        description: '11-inch 2.8K 144Hz 7-stage variable refresh rate display, Snapdragon 870, Dolby Atmos quad speakers, and 8840mAh long-lasting battery.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Xiaomi',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
        basePrice: 105000, compareAtPrice: 115000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '8', storage_gb: '256', battery_mah: 8840, screen_size_inch: 11.0, camera_mp: '13 MP', chipset: 'Snapdragon 870', network: 'Wi-Fi 6', pta_approved: 'Official PTA Approved' },
        rating: 4.8, reviewCount: 29, createdAt: '2026-09-18T15:00:00.000Z'
      },
      {
        id: 'rd_p10',
        title: 'Apple iPad 10th Gen (64GB Wi-Fi, Blue)',
        slug: 'apple-ipad-10th-gen-64gb-blue',
        description: 'All-screen design with 10.9-inch Liquid Retina display, A14 Bionic chip, landscape 12MP Ultra Wide front camera with Center Stage, and USB-C.',
        categoryId: 'cat_mobiles', categoryName: 'Mobiles & Tablets', brand: 'Apple',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80'],
        basePrice: 128000, compareAtPrice: 138000, stock: 16, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { ram_gb: '4', storage_gb: '64', battery_mah: 7606, screen_size_inch: 10.9, camera_mp: '12 MP Wide', chipset: 'Apple A14 Bionic', network: 'Wi-Fi 6', pta_approved: 'Official PTA Approved' },
        rating: 4.9, reviewCount: 40, createdAt: '2026-09-19T13:00:00.000Z'
      },
      {
        id: 'rd_p11',
        title: 'Samsung Galaxy Watch6 Classic (47mm, Bluetooth, Black) with Rotating Bezel',
        slug: 'samsung-galaxy-watch6-classic-47mm',
        description: 'Iconic physical rotating bezel, sapphire crystal glass, personalized HR zones, and comprehensive body composition analysis.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Samsung',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'],
        basePrice: 74000, compareAtPrice: 82000, stock: 11, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 40, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 24, createdAt: '2026-09-06T10:00:00.000Z'
      },
      {
        id: 'rd_p12',
        title: 'Huawei Watch GT 4 (46mm, Stainless Steel Case with Brown Leather Strap)',
        slug: 'huawei-watch-gt-4-46mm-leather',
        description: 'Octagonal geometric design, up to 14 days of battery life, enhanced TruSeen 5.5+ heart rate monitoring, and dual-band five-system GNSS.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Huawei',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],
        basePrice: 58000, compareAtPrice: 65000, stock: 14, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 336, warranty_months: '12 Months' },
        rating: 4.7, reviewCount: 31, createdAt: '2026-09-08T12:00:00.000Z'
      },
      {
        id: 'rd_p13',
        title: 'Anker Soundcore Space One Active Noise Cancelling Headphones - Blue',
        slug: 'anker-soundcore-space-one-blue',
        description: '2X stronger voice reduction, 40mm customized dynamic drivers with LDAC Hi-Res Wireless Audio, and 55 hours of total playtime.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Anker',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
        basePrice: 28500, compareAtPrice: 32000, stock: 30, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 55, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 52, createdAt: '2026-09-10T14:00:00.000Z'
      },
      {
        id: 'rd_p14',
        title: 'JBL Charge 5 Portable Waterproof Bluetooth Speaker - Squad Camo',
        slug: 'jbl-charge-5-speaker-camo',
        description: 'JBL Original Pro Sound with separate tweeter and dual pumping bass radiators, 20 hours of playtime, IP67 waterproof, and built-in powerbank.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'JBL',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'],
        basePrice: 48000, compareAtPrice: 53000, stock: 18, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 20, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 47, createdAt: '2026-09-12T11:00:00.000Z'
      },
      {
        id: 'rd_p15',
        title: 'Baseus Blade 100W Ultra Thin Laptop Power Bank 20,000mAh',
        slug: 'baseus-blade-100w-powerbank',
        description: 'Only 0.7-inch thin briefcase-friendly design, 100W dual-direction Type-C PD charging, and high-precision status display screen.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Baseus',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&q=80'],
        basePrice: 22500, compareAtPrice: 26000, stock: 35, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Power Bank', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.7, reviewCount: 39, createdAt: '2026-09-14T09:00:00.000Z'
      },
      {
        id: 'rd_p16',
        title: 'UGREEN 100W GaN Fast Charger (3x USB-C + 1x USB-A Ports)',
        slug: 'ugreen-100w-gan-fast-charger',
        description: 'Compact Nexode GaN II desktop/travel charger capable of charging two MacBooks and two smartphones simultaneously at maximum speed.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'UGREEN',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'],
        basePrice: 16500, compareAtPrice: 19000, stock: 50, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Charger & Cable', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 68, createdAt: '2026-09-16T08:00:00.000Z'
      },
      {
        id: 'rd_p17',
        title: 'CMF by Nothing Watch Pro 2 (Dark Grey, Interchangeable Bezel)',
        slug: 'cmf-watch-pro-2-dark-grey',
        description: '1.32" AMOLED display with auto-brightness, functional crown navigation, Bluetooth calling with AI noise reduction, and built-in multi-system GPS.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Nothing',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],
        basePrice: 21500, compareAtPrice: 24000, stock: 22, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Smartwatch', connectivity: 'Bluetooth', battery_life_hours: 264, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 31, createdAt: '2026-09-18T12:00:00.000Z'
      },
      {
        id: 'rd_p18',
        title: 'Soundcore Liberty 4 NC Wireless Earbuds (98.5% Noise Reduction) - Velvet Black',
        slug: 'soundcore-liberty-4-nc-black',
        description: 'Adaptive ANC 2.0 real-time ear canal calculation, 11mm custom drivers, LDAC wireless Hi-Res, and 50 hours of playback.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Anker',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
        basePrice: 23500, compareAtPrice: 26000, stock: 28, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Earbuds / Headphones', connectivity: 'Bluetooth', battery_life_hours: 50, warranty_months: '12 Months' },
        rating: 4.8, reviewCount: 43, createdAt: '2026-09-20T14:00:00.000Z'
      },
      {
        id: 'rd_p19',
        title: 'Razer Kishi V2 Mobile Gaming Controller for Android and iPhone 15/16',
        slug: 'razer-kishi-v2-mobile-controller',
        description: 'Pro-grade microswitch buttons, analog triggers, programmable multifunction buttons, and low-latency USB-C direct connection.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'Razer',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80'],
        basePrice: 32000, compareAtPrice: 36000, stock: 15, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Keyboard / Mouse', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.7, reviewCount: 19, createdAt: '2026-09-22T09:00:00.000Z'
      },
      {
        id: 'rd_p20',
        title: 'SanDisk Extreme PRO 1TB Portable NVMe SSD (2000MB/s Read & Write)',
        slug: 'sandisk-extreme-pro-1tb-portable-ssd',
        description: 'Tough IP65 water and dust-resistant rugged silicon shell, forged aluminum chassis acting as heatsink, and 2000MB/s NVMe transfer speeds.',
        categoryId: 'cat_accessories', categoryName: 'Audio & Wearables', brand: 'SanDisk',
        condition: ProductCondition.NEW,
        images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
        basePrice: 46500, compareAtPrice: 51000, stock: 26, status: ProductStatus.PUBLISHED,
        agentId: 'agent_rawalpindi', agentShopName: 'Rawal Digital Electronics', agentCity: 'Rawalpindi', agentIsVerified: true,
        specs: { accessory_type: 'Power Bank', connectivity: 'Wired Type-C', battery_life_hours: 0, warranty_months: '12 Months' },
        rating: 4.9, reviewCount: 37, createdAt: '2026-09-24T11:00:00.000Z'
      }
    ];

    this.products = rawProducts;

    // 5. Initial Sample Reviews
    this.reviews = [
      {
        id: 'rev_1',
        productId: 'tz_p1',
        userId: 'usr_customer_1',
        userName: 'Usman Ali',
        rating: 5,
        comment: 'Received official Samsung Pakistan sealed unit with genuine PTA approval. Fast 24-hour TCS delivery to Islamabad!',
        verifiedPurchase: true,
        createdAt: '2026-09-21T10:00:00.000Z'
      },
      {
        id: 'rev_2',
        productId: 'tz_p1',
        userId: 'usr_customer_2',
        userName: 'Hamza Khan',
        rating: 5,
        comment: 'Top quality! Checked IMEI on PTA DIRBS system and it showed registered. 100% authentic vendor.',
        verifiedPurchase: true,
        createdAt: '2026-09-22T14:00:00.000Z'
      },
      {
        id: 'rev_3',
        productId: 'gh_p1',
        userId: 'usr_customer_3',
        userName: 'Danish R.',
        rating: 5,
        comment: 'M3 Max 36GB renders 8K timelines in DaVinci Resolve like butter. Unopened box with Apple global warranty active.',
        verifiedPurchase: true,
        createdAt: '2026-09-23T11:00:00.000Z'
      }
    ];

    // 6. Orders
    this.orders = [
      {
        id: 'ord_1001',
        orderNumber: 'TM-2026-9081',
        customerId: 'usr_customer_1',
        customerName: 'Usman Ali',
        customerPhone: '03335558889',
        items: [
          {
            id: 'item_1',
            productId: 'tz_p10',
            productTitle: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones - Silver',
            productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            unitPrice: 88500,
            quantity: 1,
            totalPrice: 88500,
            agentId: 'agent_lahore',
            agentShopName: 'TechZone Hafeez Centre'
          }
        ],
        subtotal: 88500,
        shippingFee: 500,
        walletDeduction: 1500,
        totalAmount: 87500,
        status: OrderStatus.DELIVERED,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PAID,
        shippingAddress: {
          fullName: 'Usman Ali',
          phone: '03335558889',
          streetAddress: 'House 14, Street 7, F-11/2',
          city: 'Islamabad',
          stateProvince: 'Islamabad Capital Territory',
          postalCode: '44000'
        },
        trackingNumber: 'TCS-99201948',
        courierName: 'TCS Express',
        createdAt: '2026-09-20T11:20:00.000Z',
        updatedAt: '2026-09-24T15:00:00.000Z'
      }
    ];

    // 7. Wallet Ledger
    this.walletLedgers = [
      {
        id: 'wlt_1',
        userId: 'usr_customer_1',
        amount: 2500,
        type: WalletTransactionType.EARNED,
        description: 'Welcome reward bonus for joining Tech Marketplace',
        balanceAfter: 2500,
        createdAt: '2026-03-01T00:05:00.000Z'
      },
      {
        id: 'wlt_2',
        userId: 'usr_customer_1',
        amount: -1500,
        type: WalletTransactionType.SPENT,
        description: 'Redeemed on Order TM-2026-9081',
        referenceOrderId: 'ord_1001',
        balanceAfter: 1000,
        createdAt: '2026-09-20T11:20:00.000Z'
      },
      {
        id: 'wlt_3',
        userId: 'usr_customer_1',
        amount: 1750,
        type: WalletTransactionType.EARNED,
        description: '2% Cashback reward for completed order TM-2026-9081',
        referenceOrderId: 'ord_1001',
        balanceAfter: 2750,
        createdAt: '2026-09-24T15:00:00.000Z'
      }
    ];
  }
}

export const store = new MockDataStore();
