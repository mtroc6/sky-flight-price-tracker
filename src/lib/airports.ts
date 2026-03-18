// Static airport database for autocomplete (no API needed)
// Focused on European airports + popular international destinations

export interface Airport {
  code: string
  name: string
  cityName: string
  countryCode: string
}

export const airports: Airport[] = [
  // Poland
  { code: 'WAW', name: 'Lotnisko Chopina', cityName: 'Warszawa', countryCode: 'PL' },
  { code: 'KRK', name: 'Balice', cityName: 'Krakow', countryCode: 'PL' },
  { code: 'GDN', name: 'Lech Walesa', cityName: 'Gdansk', countryCode: 'PL' },
  { code: 'KTW', name: 'Pyrzowice', cityName: 'Katowice', countryCode: 'PL' },
  { code: 'WRO', name: 'Strachowice', cityName: 'Wroclaw', countryCode: 'PL' },
  { code: 'POZ', name: 'Lawica', cityName: 'Poznan', countryCode: 'PL' },
  { code: 'LUZ', name: 'Lublin', cityName: 'Lublin', countryCode: 'PL' },
  { code: 'RZE', name: 'Jasionka', cityName: 'Rzeszow', countryCode: 'PL' },
  { code: 'SZZ', name: 'Goleniow', cityName: 'Szczecin', countryCode: 'PL' },
  { code: 'BZG', name: 'Szwederowo', cityName: 'Bydgoszcz', countryCode: 'PL' },
  { code: 'LCJ', name: 'Lublinek', cityName: 'Lodz', countryCode: 'PL' },
  { code: 'WMI', name: 'Modlin', cityName: 'Warszawa Modlin', countryCode: 'PL' },

  // UK & Ireland
  { code: 'LHR', name: 'Heathrow', cityName: 'Londyn', countryCode: 'GB' },
  { code: 'LGW', name: 'Gatwick', cityName: 'Londyn', countryCode: 'GB' },
  { code: 'STN', name: 'Stansted', cityName: 'Londyn', countryCode: 'GB' },
  { code: 'LTN', name: 'Luton', cityName: 'Londyn', countryCode: 'GB' },
  { code: 'MAN', name: 'Manchester', cityName: 'Manchester', countryCode: 'GB' },
  { code: 'EDI', name: 'Edinburgh', cityName: 'Edynburg', countryCode: 'GB' },
  { code: 'BHX', name: 'Birmingham', cityName: 'Birmingham', countryCode: 'GB' },
  { code: 'BRS', name: 'Bristol', cityName: 'Bristol', countryCode: 'GB' },
  { code: 'GLA', name: 'Glasgow', cityName: 'Glasgow', countryCode: 'GB' },
  { code: 'DUB', name: 'Dublin', cityName: 'Dublin', countryCode: 'IE' },

  // Germany
  { code: 'FRA', name: 'Frankfurt', cityName: 'Frankfurt', countryCode: 'DE' },
  { code: 'MUC', name: 'Franz Josef Strauss', cityName: 'Monachium', countryCode: 'DE' },
  { code: 'BER', name: 'Brandenburg', cityName: 'Berlin', countryCode: 'DE' },
  { code: 'DUS', name: 'Dusseldorf', cityName: 'Dusseldorf', countryCode: 'DE' },
  { code: 'HAM', name: 'Hamburg', cityName: 'Hamburg', countryCode: 'DE' },
  { code: 'CGN', name: 'Koln/Bonn', cityName: 'Kolonia', countryCode: 'DE' },
  { code: 'STR', name: 'Stuttgart', cityName: 'Stuttgart', countryCode: 'DE' },
  { code: 'HAJ', name: 'Hannover', cityName: 'Hanover', countryCode: 'DE' },
  { code: 'NUE', name: 'Nurnberg', cityName: 'Norymberga', countryCode: 'DE' },
  { code: 'DTM', name: 'Dortmund', cityName: 'Dortmund', countryCode: 'DE' },

  // Spain
  { code: 'BCN', name: 'El Prat', cityName: 'Barcelona', countryCode: 'ES' },
  { code: 'MAD', name: 'Barajas', cityName: 'Madryt', countryCode: 'ES' },
  { code: 'AGP', name: 'Malaga', cityName: 'Malaga', countryCode: 'ES' },
  { code: 'PMI', name: 'Palma de Mallorca', cityName: 'Majorka', countryCode: 'ES' },
  { code: 'ALC', name: 'Alicante', cityName: 'Alicante', countryCode: 'ES' },
  { code: 'TFS', name: 'Tenerife South', cityName: 'Teneryfa', countryCode: 'ES' },
  { code: 'LPA', name: 'Gran Canaria', cityName: 'Gran Canaria', countryCode: 'ES' },
  { code: 'SVQ', name: 'San Pablo', cityName: 'Sewilla', countryCode: 'ES' },
  { code: 'VLC', name: 'Valencia', cityName: 'Walencja', countryCode: 'ES' },
  { code: 'IBZ', name: 'Ibiza', cityName: 'Ibiza', countryCode: 'ES' },
  { code: 'FUE', name: 'Fuerteventura', cityName: 'Fuerteventura', countryCode: 'ES' },

  // Italy
  { code: 'FCO', name: 'Fiumicino', cityName: 'Rzym', countryCode: 'IT' },
  { code: 'MXP', name: 'Malpensa', cityName: 'Mediolan', countryCode: 'IT' },
  { code: 'BGY', name: 'Bergamo', cityName: 'Bergamo', countryCode: 'IT' },
  { code: 'NAP', name: 'Capodichino', cityName: 'Neapol', countryCode: 'IT' },
  { code: 'VCE', name: 'Marco Polo', cityName: 'Wenecja', countryCode: 'IT' },
  { code: 'BLQ', name: 'Marconi', cityName: 'Bolonia', countryCode: 'IT' },
  { code: 'CTA', name: 'Fontanarossa', cityName: 'Katania', countryCode: 'IT' },
  { code: 'PSA', name: 'Galileo Galilei', cityName: 'Piza', countryCode: 'IT' },

  // France
  { code: 'CDG', name: 'Charles de Gaulle', cityName: 'Paryz', countryCode: 'FR' },
  { code: 'ORY', name: 'Orly', cityName: 'Paryz', countryCode: 'FR' },
  { code: 'NCE', name: 'Cote d\'Azur', cityName: 'Nicea', countryCode: 'FR' },
  { code: 'MRS', name: 'Marseille', cityName: 'Marsylia', countryCode: 'FR' },
  { code: 'LYS', name: 'Saint-Exupery', cityName: 'Lyon', countryCode: 'FR' },
  { code: 'TLS', name: 'Blagnac', cityName: 'Tuluza', countryCode: 'FR' },
  { code: 'BOD', name: 'Merignac', cityName: 'Bordeaux', countryCode: 'FR' },

  // Netherlands & Belgium
  { code: 'AMS', name: 'Schiphol', cityName: 'Amsterdam', countryCode: 'NL' },
  { code: 'EIN', name: 'Eindhoven', cityName: 'Eindhoven', countryCode: 'NL' },
  { code: 'BRU', name: 'Zaventem', cityName: 'Bruksela', countryCode: 'BE' },
  { code: 'CRL', name: 'Charleroi', cityName: 'Bruksela Charleroi', countryCode: 'BE' },

  // Scandinavia
  { code: 'CPH', name: 'Kastrup', cityName: 'Kopenhaga', countryCode: 'DK' },
  { code: 'OSL', name: 'Gardermoen', cityName: 'Oslo', countryCode: 'NO' },
  { code: 'ARN', name: 'Arlanda', cityName: 'Sztokholm', countryCode: 'SE' },
  { code: 'HEL', name: 'Vantaa', cityName: 'Helsinki', countryCode: 'FI' },

  // Austria & Switzerland
  { code: 'VIE', name: 'Schwechat', cityName: 'Wieden', countryCode: 'AT' },
  { code: 'ZRH', name: 'Zurich', cityName: 'Zurych', countryCode: 'CH' },
  { code: 'GVA', name: 'Geneva', cityName: 'Genewa', countryCode: 'CH' },

  // Czech Republic & Hungary
  { code: 'PRG', name: 'Vaclav Havel', cityName: 'Praga', countryCode: 'CZ' },
  { code: 'BUD', name: 'Liszt Ferenc', cityName: 'Budapeszt', countryCode: 'HU' },

  // Greece
  { code: 'ATH', name: 'Eleftherios Venizelos', cityName: 'Ateny', countryCode: 'GR' },
  { code: 'SKG', name: 'Makedonia', cityName: 'Saloniki', countryCode: 'GR' },
  { code: 'HER', name: 'Heraklion', cityName: 'Kreta', countryCode: 'GR' },
  { code: 'RHO', name: 'Diagoras', cityName: 'Rodos', countryCode: 'GR' },
  { code: 'CFU', name: 'Ioannis Kapodistrias', cityName: 'Korfu', countryCode: 'GR' },
  { code: 'ZTH', name: 'Zakynthos', cityName: 'Zakynthos', countryCode: 'GR' },
  { code: 'JMK', name: 'Mykonos', cityName: 'Mykonos', countryCode: 'GR' },
  { code: 'JTR', name: 'Santorini', cityName: 'Santorini', countryCode: 'GR' },

  // Portugal
  { code: 'LIS', name: 'Humberto Delgado', cityName: 'Lizbona', countryCode: 'PT' },
  { code: 'OPO', name: 'Francisco Sa Carneiro', cityName: 'Porto', countryCode: 'PT' },
  { code: 'FAO', name: 'Faro', cityName: 'Faro', countryCode: 'PT' },

  // Turkey
  { code: 'IST', name: 'Istanbul', cityName: 'Stambuł', countryCode: 'TR' },
  { code: 'SAW', name: 'Sabiha Gokcen', cityName: 'Stambuł', countryCode: 'TR' },
  { code: 'AYT', name: 'Antalya', cityName: 'Antalya', countryCode: 'TR' },
  { code: 'DLM', name: 'Dalaman', cityName: 'Dalaman', countryCode: 'TR' },

  // Croatia & Balkans
  { code: 'ZAG', name: 'Zagreb', cityName: 'Zagrzeb', countryCode: 'HR' },
  { code: 'SPU', name: 'Split', cityName: 'Split', countryCode: 'HR' },
  { code: 'DBV', name: 'Dubrovnik', cityName: 'Dubrownik', countryCode: 'HR' },

  // Romania & Bulgaria
  { code: 'OTP', name: 'Henri Coanda', cityName: 'Bukareszt', countryCode: 'RO' },
  { code: 'SOF', name: 'Sofia', cityName: 'Sofia', countryCode: 'BG' },
  { code: 'VAR', name: 'Varna', cityName: 'Warna', countryCode: 'BG' },

  // Baltic states
  { code: 'VNO', name: 'Vilnius', cityName: 'Wilno', countryCode: 'LT' },
  { code: 'RIX', name: 'Riga', cityName: 'Ryga', countryCode: 'LV' },
  { code: 'TLL', name: 'Lennart Meri', cityName: 'Tallin', countryCode: 'EE' },

  // Ukraine
  { code: 'KBP', name: 'Boryspil', cityName: 'Kijow', countryCode: 'UA' },
  { code: 'LWO', name: 'Lwow', cityName: 'Lwow', countryCode: 'UA' },

  // Middle East
  { code: 'DXB', name: 'Dubai International', cityName: 'Dubaj', countryCode: 'AE' },
  { code: 'AUH', name: 'Abu Dhabi', cityName: 'Abu Dhabi', countryCode: 'AE' },
  { code: 'DOH', name: 'Hamad International', cityName: 'Doha', countryCode: 'QA' },
  { code: 'TLV', name: 'Ben Gurion', cityName: 'Tel Awiw', countryCode: 'IL' },

  // North Africa & Egypt
  { code: 'CMN', name: 'Mohammed V', cityName: 'Casablanca', countryCode: 'MA' },
  { code: 'RAK', name: 'Menara', cityName: 'Marrakesz', countryCode: 'MA' },
  { code: 'CAI', name: 'Cairo International', cityName: 'Kair', countryCode: 'EG' },
  { code: 'HRG', name: 'Hurghada', cityName: 'Hurghada', countryCode: 'EG' },
  { code: 'SSH', name: 'Sharm el-Sheikh', cityName: 'Sharm el-Sheikh', countryCode: 'EG' },
  { code: 'TUN', name: 'Tunis-Carthage', cityName: 'Tunis', countryCode: 'TN' },

  // Asia popular
  { code: 'BKK', name: 'Suvarnabhumi', cityName: 'Bangkok', countryCode: 'TH' },
  { code: 'SIN', name: 'Changi', cityName: 'Singapur', countryCode: 'SG' },
  { code: 'HKG', name: 'Hong Kong', cityName: 'Hongkong', countryCode: 'HK' },
  { code: 'NRT', name: 'Narita', cityName: 'Tokio', countryCode: 'JP' },
  { code: 'ICN', name: 'Incheon', cityName: 'Seul', countryCode: 'KR' },
  { code: 'DEL', name: 'Indira Gandhi', cityName: 'Delhi', countryCode: 'IN' },
  { code: 'BOM', name: 'Chhatrapati Shivaji', cityName: 'Mumbaj', countryCode: 'IN' },

  // Americas popular
  { code: 'JFK', name: 'John F. Kennedy', cityName: 'Nowy Jork', countryCode: 'US' },
  { code: 'LAX', name: 'Los Angeles', cityName: 'Los Angeles', countryCode: 'US' },
  { code: 'MIA', name: 'Miami', cityName: 'Miami', countryCode: 'US' },
  { code: 'ORD', name: 'O\'Hare', cityName: 'Chicago', countryCode: 'US' },
  { code: 'YYZ', name: 'Pearson', cityName: 'Toronto', countryCode: 'CA' },
  { code: 'CUN', name: 'Cancun', cityName: 'Cancun', countryCode: 'MX' },
  { code: 'GRU', name: 'Guarulhos', cityName: 'Sao Paulo', countryCode: 'BR' },

  // Malta, Cyprus, Iceland
  { code: 'MLA', name: 'Malta International', cityName: 'Malta', countryCode: 'MT' },
  { code: 'LCA', name: 'Larnaka', cityName: 'Larnaka', countryCode: 'CY' },
  { code: 'PFO', name: 'Pafos', cityName: 'Pafos', countryCode: 'CY' },
  { code: 'KEF', name: 'Keflavik', cityName: 'Reykjavik', countryCode: 'IS' },

  // Georgia, Albania, Montenegro
  { code: 'TBS', name: 'Tbilisi', cityName: 'Tbilisi', countryCode: 'GE' },
  { code: 'TIA', name: 'Tirana', cityName: 'Tirana', countryCode: 'AL' },
  { code: 'TGD', name: 'Podgorica', cityName: 'Podgorica', countryCode: 'ME' },
  { code: 'TIV', name: 'Tivat', cityName: 'Tivat', countryCode: 'ME' },
]

export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  return airports
    .filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.cityName.toLowerCase().includes(q)
    )
    .slice(0, 10)
}
