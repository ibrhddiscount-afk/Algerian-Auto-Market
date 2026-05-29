import { ALL_LISTINGS } from "./listings";

export type AdStatus = "active" | "paused" | "expired" | "sold";

export interface MyAd {
  listingId: number;
  status: AdStatus;
  views: number;
  messages: number;
  favorites: number;
  postedDaysAgo: number;
  expiresInDays: number;
  boosted: boolean;
}

export interface Message {
  id: number;
  listingId: number;
  senderName: string;
  senderPhone: string;
  text: string;
  receivedHoursAgo: number;
  read: boolean;
  via: "whatsapp" | "platform";
}

export interface FavoritedListing {
  listingId: number;
  savedDaysAgo: number;
}

export const MY_ADS: MyAd[] = [
  { listingId: 1,  status: "active",  views: 1243, messages: 8,  favorites: 14, postedDaysAgo: 3,  expiresInDays: 27, boosted: true  },
  { listingId: 4,  status: "active",  views: 698,  messages: 3,  favorites: 6,  postedDaysAgo: 5,  expiresInDays: 25, boosted: false },
  { listingId: 7,  status: "paused",  views: 521,  messages: 2,  favorites: 9,  postedDaysAgo: 12, expiresInDays: 18, boosted: false },
  { listingId: 12, status: "sold",    views: 940,  messages: 11, favorites: 7,  postedDaysAgo: 30, expiresInDays: 0,  boosted: false },
  { listingId: 19, status: "expired", views: 322,  messages: 1,  favorites: 3,  postedDaysAgo: 35, expiresInDays: 0,  boosted: false },
];

export const MY_MESSAGES: Message[] = [
  { id: 1, listingId: 1, senderName: "Youcef A.",   senderPhone: "0555 11 22 33", text: "Bonjour, est-ce que la voiture est toujours disponible ? Je suis intéressé et je peux venir la voir ce week-end.", receivedHoursAgo: 1,  read: false, via: "whatsapp" },
  { id: 2, listingId: 1, senderName: "Nassim B.",   senderPhone: "0661 44 55 66", text: "Salam, quel est votre dernier prix ? Est-ce que vous acceptez 2 200 000 DZD ?", receivedHoursAgo: 3,  read: false, via: "platform" },
  { id: 3, listingId: 1, senderName: "Amina H.",    senderPhone: "0770 88 77 66", text: "Bonjour, y a-t-il des défauts à signaler ? Le moteur est en bon état ?", receivedHoursAgo: 8,  read: true,  via: "whatsapp" },
  { id: 4, listingId: 4, senderName: "Bilal R.",    senderPhone: "0550 22 33 44", text: "Est-ce que vous êtes à Alger ? Je voudrais voir la voiture demain matin si possible.", receivedHoursAgo: 12, read: true,  via: "platform" },
  { id: 5, listingId: 4, senderName: "Omar S.",     senderPhone: "0699 55 44 33", text: "Prix fixe ou négociable ? Bonne journée.", receivedHoursAgo: 20, read: true,  via: "whatsapp" },
  { id: 6, listingId: 7, senderName: "Fatima K.",   senderPhone: "0666 77 88 99", text: "Salam, vous pouvez me donner plus de détails sur l'état de la carrosserie ?", receivedHoursAgo: 36, read: true,  via: "platform" },
];

export const MY_FAVORITES: FavoritedListing[] = [
  { listingId: 9,  savedDaysAgo: 1 },
  { listingId: 14, savedDaysAgo: 2 },
  { listingId: 17, savedDaysAgo: 4 },
  { listingId: 23, savedDaysAgo: 7 },
  { listingId: 30, savedDaysAgo: 10 },
];

export const ACCOUNT = {
  name: "Karim Benali",
  initials: "KB",
  email: "karim.benali@gmail.com",
  phone: "0555 12 34 56",
  wilaya: "Alger",
  memberSince: "Janvier 2021",
  sellerType: "Particulier" as const,
  rating: 4.8,
  reviewCount: 12,
  verified: true,
  totalSales: 3,
};

export function getListing(id: number) {
  return ALL_LISTINGS.find(l => l.id === id);
}
