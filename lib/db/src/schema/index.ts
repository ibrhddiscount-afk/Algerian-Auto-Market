import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const sellerTypeEnum = pgEnum("seller_type", [
  "particulier",
  "concessionnaire",
]);

export const listingFuelEnum = pgEnum("listing_fuel", [
  "Essence",
  "Diesel",
  "GPL",
  "Électrique",
  "Hybride",
]);

export const listingTransmissionEnum = pgEnum("listing_transmission", [
  "Manuelle",
  "Automatique",
]);

export const listingConditionEnum = pgEnum("listing_condition", [
  "Excellent",
  "Très bon",
  "Bon",
  "Passable",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "draft",
  "sold",
]);

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 40 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 40 }),
    wilaya: varchar("wilaya", { length: 80 }).notNull(),
    sellerType: sellerTypeEnum("seller_type").notNull().default("particulier"),
    rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    verified: boolean("verified").notNull().default(false),
    totalSales: integer("total_sales").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_unique").on(table.email),
    phoneIdx: index("users_phone_idx").on(table.phone),
    wilayaIdx: index("users_wilaya_idx").on(table.wilaya),
  }),
);

export const listingsTable = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    marque: varchar("marque", { length: 80 }).notNull(),
    modele: varchar("modele", { length: 80 }).notNull(),
    year: integer("year").notNull(),
    kmRaw: integer("km_raw").notNull(),
    fuel: listingFuelEnum("fuel").notNull(),
    transmission: listingTransmissionEnum("transmission").notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    wilaya: varchar("wilaya", { length: 80 }).notNull(),
    priceRaw: integer("price_raw").notNull(),
    color: varchar("color", { length: 120 }).notNull().default("from-gray-200 to-gray-400"),
    verified: boolean("verified").notNull().default(false),
    badge: varchar("badge", { length: 40 }),
    status: listingStatusEnum("status").notNull().default("active"),
    description: text("description").notNull().default(""),
    couleur: varchar("couleur", { length: 80 }).notNull().default("Non précisée"),
    portes: integer("portes").notNull().default(5),
    places: integer("places").notNull().default(5),
    puissance: integer("puissance").notNull().default(0),
    cylindree: varchar("cylindree", { length: 80 }).notNull().default("Non précisée"),
    condition: listingConditionEnum("condition").notNull().default("Bon"),
    firstHand: boolean("first_hand").notNull().default(false),
    dedouane: boolean("dedouane").notNull().default(true),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sellerIdx: index("listings_seller_id_idx").on(table.sellerId),
    marqueIdx: index("listings_marque_idx").on(table.marque),
    wilayaIdx: index("listings_wilaya_idx").on(table.wilaya),
    fuelIdx: index("listings_fuel_idx").on(table.fuel),
    transmissionIdx: index("listings_transmission_idx").on(table.transmission),
    priceIdx: index("listings_price_raw_idx").on(table.priceRaw),
    yearIdx: index("listings_year_idx").on(table.year),
    kmIdx: index("listings_km_raw_idx").on(table.kmRaw),
    verifiedIdx: index("listings_verified_idx").on(table.verified),
    statusIdx: index("listings_status_idx").on(table.status),
    createdAtIdx: index("listings_created_at_idx").on(table.createdAt),
  }),
);

export const listingPhotosTable = pgTable(
  "listing_photos",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 180 }),
    position: integer("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    listingIdx: index("listing_photos_listing_id_idx").on(table.listingId),
    orderIdx: index("listing_photos_listing_position_idx").on(
      table.listingId,
      table.position,
    ),
  }),
);

export const favoritesTable = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userListingUnique: uniqueIndex("favorites_user_listing_unique").on(
      table.userId,
      table.listingId,
    ),
    userIdx: index("favorites_user_id_idx").on(table.userId),
    listingIdx: index("favorites_listing_id_idx").on(table.listingId),
  }),
);

export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    senderId: integer("sender_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 40 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => ({
    listingIdx: index("messages_listing_id_idx").on(table.listingId),
    sellerIdx: index("messages_seller_id_idx").on(table.sellerId),
    senderIdx: index("messages_sender_id_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  }),
);

export const messageRepliesTable = pgTable(
  "message_replies",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    authorRole: varchar("author_role", { length: 20 }).notNull().default("seller"),
    authorName: varchar("author_name", { length: 160 }).notNull(),
    authorEmail: varchar("author_email", { length: 255 }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    messageIdx: index("message_replies_message_id_idx").on(table.messageId),
    authorIdx: index("message_replies_author_id_idx").on(table.authorId),
    createdAtIdx: index("message_replies_created_at_idx").on(table.createdAt),
  }),
);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Listing = typeof listingsTable.$inferSelect;
export type InsertListing = typeof listingsTable.$inferInsert;
export type ListingPhoto = typeof listingPhotosTable.$inferSelect;
export type InsertListingPhoto = typeof listingPhotosTable.$inferInsert;
export type Favorite = typeof favoritesTable.$inferSelect;
export type InsertFavorite = typeof favoritesTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;
export type MessageReply = typeof messageRepliesTable.$inferSelect;
export type InsertMessageReply = typeof messageRepliesTable.$inferInsert;
