import { Product, Scenario } from "../types";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export const defaultProducts: Product[] = [
  { id: "1", name: "Sony Headphones", price: 300, utility: 60, emoji: "🎧", image: img("photo-1505740420928-5e560c06d30e"), category: "Audio" },
  { id: "2", name: "Mechanical Keyboard", price: 400, utility: 80, emoji: "⌨️", image: img("photo-1587829741301-dc798b83add3"), category: "Peripherals" },
  { id: "3", name: "Wireless Mouse", price: 200, utility: 50, emoji: "🖱️", image: img("photo-1527864550417-7fd91fc51a46"), category: "Peripherals" },
  { id: "4", name: "USB-C Hub", price: 150, utility: 35, emoji: "🔌", image: img("photo-1615663245857-ac93bb7c39e7"), category: "Accessories" },
  { id: "5", name: "Webcam 4K", price: 500, utility: 90, emoji: "📷", image: img("photo-1587825140708-dfaf72ae4b04"), category: "Video" },
  { id: "6", name: "Monitor Light Bar", price: 120, utility: 30, emoji: "💡", image: img("photo-1527443224154-c4a3942d3acf"), category: "Accessories" },
  { id: "7", name: "Laptop Stand", price: 180, utility: 40, emoji: "💻", image: img("photo-1496181133206-80ce9b88a853"), category: "Accessories" },
  { id: "8", name: "Portable SSD", price: 350, utility: 55, emoji: "💾", image: img("photo-1597872200969-2b65d56bd16b"), category: "Storage" },
  { id: "9", name: "Desk Mat", price: 80, utility: 20, emoji: "🟦", image: img("photo-1547394765-185e1e68f34e"), category: "Accessories" },
  { id: "10", name: "Bluetooth Speaker", price: 250, utility: 45, emoji: "🔊", image: img("photo-1608043152269-423dbba4e7e1"), category: "Audio" },
  { id: "11", name: "Gaming Controller", price: 450, utility: 70, emoji: "🎮", image: img("photo-1592840496694-26d035b52b48"), category: "Gaming" },
  { id: "12", name: "Phone Stand", price: 60, utility: 15, emoji: "📱", image: img("photo-1512499617640-c74ae3a79d37"), category: "Accessories" },
];

export const defaultScenarios: Scenario[] = [
  {
    id: "1",
    name: "Weekend Electronics",
    budget: 5000,
    utility: 420,
    products: defaultProducts.slice(0, 6),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "2",
    name: "Work From Home Setup",
    budget: 3000,
    utility: 285,
    products: defaultProducts.slice(1, 7),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "3",
    name: "Budget Build",
    budget: 1000,
    utility: 190,
    products: defaultProducts.slice(0, 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];
