export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  condition: "below" | "above" | "equals";
  isTriggered: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
  userId?: string;
}

export interface Notification {
  id: string;
  type: "price_alert" | "deal" | "recommendation" | "system";
  title: string;
  message: string;
  productId?: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  userId?: string;
  addedAt: Date;
  notes?: string;
  priority: "low" | "medium" | "high";
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** Demo accounts get the seeded sample dataset instead of an empty workspace. */
  isDemo?: boolean;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    dealAlerts: boolean;
  };
  theme: "light" | "dark" | "auto";
}
