import { Category } from '../types/marketplace';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-mobiles',
    name: 'Mobiles',
    slug: 'mobiles',
    icon: 'Smartphone',
    description: 'PTA-approved smartphones, feature phones, tablets, and original chargers.',
    subcategories: ['Smartphones', 'Tablets', 'Mobile Accessories', 'Smartwatches'],
  },
  {
    id: 'cat-laptops',
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    icon: 'Laptop',
    description: 'ThinkPads, MacBooks, ultrabooks, monitors, and desktop workstations.',
    subcategories: ['Laptops', 'Monitors', 'Desktop PCs', 'Keyboards & Mice', 'Storage & RAM'],
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Tv',
    description: 'Televisions, audio gear, headphones, UPS inverters, and routers.',
    subcategories: ['Televisions', 'Headphones & Audio', 'Power & UPS', 'Networking'],
  },
  {
    id: 'cat-gaming',
    name: 'Gaming',
    slug: 'gaming',
    icon: 'Gamepad2',
    description: 'PlayStation, Xbox, Nintendo Switch consoles, controllers, and physical discs.',
    subcategories: ['Consoles', 'Controllers', 'Video Games', 'Gaming Headsets'],
  },
  {
    id: 'cat-cameras',
    name: 'Cameras',
    slug: 'cameras',
    icon: 'Camera',
    description: 'DSLR and mirrorless bodies, prime and zoom lenses, tripods, and lighting.',
    subcategories: ['DSLR & Mirrorless', 'Camera Lenses', 'Tripods & Gimbals', 'Studio Lighting'],
  },
  {
    id: 'cat-vehicles',
    name: 'Vehicles',
    slug: 'vehicles',
    icon: 'Bike',
    description: 'Commuter bicycles, motorcycles, scooters, helmets, and car accessories.',
    subcategories: ['Bicycles', 'Motorcycles', 'Car Accessories', 'Riding Gear'],
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    slug: 'furniture',
    icon: 'Armchair',
    description: 'Solid wood desks, ergonomic office chairs, bookshelves, and lounge seating.',
    subcategories: ['Desks & Tables', 'Office Chairs', 'Sofas & Seating', 'Storage & Shelving'],
  },
  {
    id: 'cat-appliances',
    name: 'Home Appliances',
    slug: 'home-appliances',
    icon: 'Microwave',
    description: 'Microwaves, air fryers, espresso machines, air purifiers, and dispensers.',
    subcategories: ['Kitchen Appliances', 'Cooling & Heating', 'Garment Care', 'Cleaning'],
  },
  {
    id: 'cat-fashion',
    name: 'Fashion',
    slug: 'fashion',
    icon: 'Watch',
    description: 'Mechanical wristwatches, leather bags, outerwear, and footwear.',
    subcategories: ['Watches', 'Bags & Luggage', 'Outerwear', 'Footwear'],
  },
  {
    id: 'cat-books',
    name: 'Books',
    slug: 'books',
    icon: 'BookOpen',
    description: 'Engineering textbooks, non-fiction hardcovers, exam prep, and literature.',
    subcategories: ['Non-Fiction & Business', 'University Textbooks', 'Fiction & Literature', 'Design & Art'],
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    icon: 'Dumbbell',
    description: 'Adjustable dumbbells, cricket bats, badminton rackets, and home gym benches.',
    subcategories: ['Strength Training', 'Cricket & Outdoor', 'Racket Sports', 'Cardio Gear'],
  },
  {
    id: 'cat-other',
    name: 'Other',
    slug: 'other',
    icon: 'Package',
    description: 'Musical instruments, studio tools, collectibles, and everyday essentials.',
    subcategories: ['Musical Instruments', 'Tools & DIY', 'Collectibles', 'Miscellaneous'],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryName(slug: string): string {
  return getCategoryBySlug(slug)?.name || slug;
}
