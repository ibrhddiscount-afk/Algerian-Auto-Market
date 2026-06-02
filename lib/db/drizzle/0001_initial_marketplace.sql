CREATE TYPE "seller_type" AS ENUM ('particulier', 'concessionnaire');
CREATE TYPE "listing_fuel" AS ENUM ('Essence', 'Diesel', 'GPL', 'Électrique', 'Hybride');
CREATE TYPE "listing_transmission" AS ENUM ('Manuelle', 'Automatique');
CREATE TYPE "listing_condition" AS ENUM ('Excellent', 'Très bon', 'Bon', 'Passable');

CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(160) NOT NULL,
  "email" varchar(255),
  "phone" varchar(40) NOT NULL,
  "whatsapp" varchar(40),
  "wilaya" varchar(80) NOT NULL,
  "seller_type" "seller_type" DEFAULT 'particulier' NOT NULL,
  "rating" numeric(3, 1) DEFAULT '0' NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "total_sales" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "listings" (
  "id" serial PRIMARY KEY NOT NULL,
  "seller_id" integer NOT NULL,
  "title" varchar(180) NOT NULL,
  "marque" varchar(80) NOT NULL,
  "modele" varchar(80) NOT NULL,
  "year" integer NOT NULL,
  "km_raw" integer NOT NULL,
  "fuel" "listing_fuel" NOT NULL,
  "transmission" "listing_transmission" NOT NULL,
  "location" varchar(160) NOT NULL,
  "wilaya" varchar(80) NOT NULL,
  "price_raw" integer NOT NULL,
  "color" varchar(120) DEFAULT 'from-gray-200 to-gray-400' NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "badge" varchar(40),
  "description" text DEFAULT '' NOT NULL,
  "couleur" varchar(80) DEFAULT 'Non précisée' NOT NULL,
  "portes" integer DEFAULT 5 NOT NULL,
  "places" integer DEFAULT 5 NOT NULL,
  "puissance" integer DEFAULT 0 NOT NULL,
  "cylindree" varchar(80) DEFAULT 'Non précisée' NOT NULL,
  "condition" "listing_condition" DEFAULT 'Bon' NOT NULL,
  "first_hand" boolean DEFAULT false NOT NULL,
  "dedouane" boolean DEFAULT true NOT NULL,
  "views" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "listing_photos" (
  "id" serial PRIMARY KEY NOT NULL,
  "listing_id" integer NOT NULL,
  "url" text NOT NULL,
  "alt" varchar(180),
  "position" integer DEFAULT 0 NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "listing_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "listing_photos"
  ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE cascade;

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE cascade;

CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");
CREATE INDEX "users_phone_idx" ON "users" ("phone");
CREATE INDEX "users_wilaya_idx" ON "users" ("wilaya");
CREATE INDEX "listings_seller_id_idx" ON "listings" ("seller_id");
CREATE INDEX "listings_marque_idx" ON "listings" ("marque");
CREATE INDEX "listings_wilaya_idx" ON "listings" ("wilaya");
CREATE INDEX "listings_fuel_idx" ON "listings" ("fuel");
CREATE INDEX "listings_transmission_idx" ON "listings" ("transmission");
CREATE INDEX "listings_price_raw_idx" ON "listings" ("price_raw");
CREATE INDEX "listings_year_idx" ON "listings" ("year");
CREATE INDEX "listings_km_raw_idx" ON "listings" ("km_raw");
CREATE INDEX "listings_verified_idx" ON "listings" ("verified");
CREATE INDEX "listings_created_at_idx" ON "listings" ("created_at");
CREATE INDEX "listing_photos_listing_id_idx" ON "listing_photos" ("listing_id");
CREATE INDEX "listing_photos_listing_position_idx" ON "listing_photos" ("listing_id", "position");
CREATE UNIQUE INDEX "favorites_user_listing_unique" ON "favorites" ("user_id", "listing_id");
CREATE INDEX "favorites_user_id_idx" ON "favorites" ("user_id");
CREATE INDEX "favorites_listing_id_idx" ON "favorites" ("listing_id");
