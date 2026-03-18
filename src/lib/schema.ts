import { pgTable, serial, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  cityName: text('city_name').notNull(),
  countryCode: text('country_code').notNull(),
  type: text('type', { enum: ['airport', 'city'] }).notNull().default('airport'),
})

export const watchedRoutes = pgTable('watched_routes', {
  id: serial('id').primaryKey(),
  originCode: text('origin_code').notNull(),
  originName: text('origin_name').notNull(),
  destinationCode: text('destination_code').notNull(),
  destinationName: text('destination_name').notNull(),
  departureDate: text('departure_date').notNull(),
  returnDate: text('return_date'),
  isRoundTrip: boolean('is_round_trip').notNull().default(false),
  flexDays: integer('flex_days').notNull().default(0),
  cabinClass: text('cabin_class', { enum: ['economy', 'business', 'first'] }).notNull().default('economy'),
  adults: integer('adults').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastChecked: timestamp('last_checked'),
  currentMinPrice: integer('current_min_price'),
  previousMinPrice: integer('previous_min_price'),
}, (table) => [
  index('idx_routes_active').on(table.isActive),
])

export const priceSnapshots = pgTable('price_snapshots', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => watchedRoutes.id, { onDelete: 'cascade' }),
  priceCents: integer('price_cents').notNull(),
  airline: text('airline'),
  stops: integer('stops').notNull().default(0),
  bookingLink: text('booking_link'),
  source: text('source', { enum: ['serpapi', 'kiwi'] }).notNull().default('serpapi'),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
}, (table) => [
  index('idx_snapshots_route').on(table.routeId),
  index('idx_snapshots_fetched').on(table.fetchedAt),
])

export const alternativeRoutes = pgTable('alternative_routes', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => watchedRoutes.id, { onDelete: 'cascade' }),
  originCode: text('origin_code').notNull(),
  destinationCode: text('destination_code').notNull(),
  priceCents: integer('price_cents').notNull(),
  airline: text('airline'),
  stops: integer('stops').notNull().default(0),
  bookingLink: text('booking_link'),
  foundAt: timestamp('found_at').notNull().defaultNow(),
})

export const preferences = pgTable('preferences', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
})
