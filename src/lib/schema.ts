import { pgTable, serial, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'

export const watchedRoutes = pgTable('watched_routes', {
  id: serial('id').primaryKey(),
  originCode: text('origin_code').notNull(),
  originName: text('origin_name').notNull(),
  destinationCode: text('destination_code').notNull(),
  destinationName: text('destination_name').notNull(),
  departureDate: text('departure_date').notNull(),
  flightNumber: text('flight_number'),
  trackingUrl: text('tracking_url'),
  group: text('group_name'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastChecked: timestamp('last_checked'),
  currentMinPrice: integer('current_min_price'),
  previousMinPrice: integer('previous_min_price'),
  bestAirline: text('best_airline'),
  bestStops: integer('best_stops'),
  bestDepartureTime: text('best_departure_time'),
  bestArrivalTime: text('best_arrival_time'),
  bestDuration: integer('best_duration'),
}, (table) => [
  index('idx_routes_active').on(table.isActive),
])

export const priceSnapshots = pgTable('price_snapshots', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => watchedRoutes.id, { onDelete: 'cascade' }),
  priceCents: integer('price_cents').notNull(),
  airline: text('airline'),
  stops: integer('stops').notNull().default(0),
  source: text('source', { enum: ['serpapi', 'google'] }).notNull().default('google'),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
}, (table) => [
  index('idx_snapshots_route').on(table.routeId),
  index('idx_snapshots_fetched').on(table.fetchedAt),
])
