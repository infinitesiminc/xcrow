
-- 1. Flash Accounts table
CREATE TABLE public.flash_accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_type text NOT NULL DEFAULT 'fleet_operator',
  stage text NOT NULL DEFAULT 'whitespace',
  hq_city text,
  hq_lat double precision,
  hq_lng double precision,
  estimated_spaces text,
  facility_count text,
  focus_area text,
  website text,
  differentiator text,
  case_study_url text,
  current_vendor text,
  annual_revenue text,
  employee_count text,
  founded integer,
  priority_score integer NOT NULL DEFAULT 0,
  owner_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage flash accounts"
  ON public.flash_accounts FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE TRIGGER update_flash_accounts_updated_at
  BEFORE UPDATE ON public.flash_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Flash Account Contacts
CREATE TABLE public.flash_account_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL REFERENCES public.flash_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  email text,
  phone text,
  linkedin text,
  score integer,
  reason text,
  outreach_status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_account_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage flash account contacts"
  ON public.flash_account_contacts FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 3. Flash Account Activities
CREATE TABLE public.flash_account_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL REFERENCES public.flash_accounts(id) ON DELETE CASCADE,
  user_id uuid,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_account_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage flash account activities"
  ON public.flash_account_activities FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 4. Link garages to accounts
ALTER TABLE public.discovered_garages ADD COLUMN account_id text REFERENCES public.flash_accounts(id);

-- 5. Function to auto-link garages to accounts by operator_guess
CREATE OR REPLACE FUNCTION public.link_garages_to_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count1 integer;
  _count2 integer;
BEGIN
  UPDATE public.discovered_garages dg
  SET account_id = fa.id
  FROM public.flash_accounts fa
  WHERE dg.account_id IS NULL
    AND dg.operator_guess IS NOT NULL
    AND lower(dg.operator_guess) = lower(fa.name);

  GET DIAGNOSTICS _count1 = ROW_COUNT;

  UPDATE public.discovered_garages dg
  SET account_id = fa.id
  FROM public.flash_accounts fa
  WHERE dg.account_id IS NULL
    AND dg.operator_guess IS NOT NULL
    AND lower(dg.operator_guess) LIKE '%' || lower(split_part(fa.name, ' ', 1)) || '%'
    AND length(split_part(fa.name, ' ', 1)) > 3;

  GET DIAGNOSTICS _count2 = ROW_COUNT;
  RETURN _count1 + _count2;
END;
$$;

-- 6. Priority score calculation function
CREATE OR REPLACE FUNCTION public.calculate_account_priority(_account_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _score integer := 0;
  _location_count integer;
  _total_capacity integer;
  _contact_count integer;
  _activity_count integer;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(capacity), 0)
  INTO _location_count, _total_capacity
  FROM public.discovered_garages WHERE account_id = _account_id;

  SELECT COUNT(*) INTO _contact_count
  FROM public.flash_account_contacts WHERE account_id = _account_id;

  SELECT COUNT(*) INTO _activity_count
  FROM public.flash_account_activities
  WHERE account_id = _account_id AND created_at > now() - interval '30 days';

  _score := _location_count * 5;
  _score := _score + LEAST(_total_capacity / 100, 50);
  _score := _score + _contact_count * 10;
  _score := _score + _activity_count * 3;

  RETURN _score;
END;
$$;

-- 7. Seed accounts
INSERT INTO public.flash_accounts (id, name, account_type, stage, hq_city, hq_lat, hq_lng, estimated_spaces, facility_count, focus_area, website, differentiator, case_study_url, current_vendor, annual_revenue, employee_count, founded) VALUES
('acct-flash-hq','Flash (HQ)','fleet_operator','active','Austin, TX',30.2672,-97.7431,'N/A','16,000+ locations','Cloud-based PARCS & EV Charging platform','https://flashparking.com','Platform powering 16,000+ locations, 30,000+ network, 50M+ mobile users',NULL,NULL,'$500M+','1,000+',2011),
('acct-wallypark','WallyPark','fleet_operator','active','Los Angeles, CA',34.0522,-118.2437,'15,000+','10 locations','Off-airport parking','https://wallypark.com','Premium valet off-airport; 100+ Flash lanes deployed','https://www.flashparking.com/category/case-studies/',NULL,'$50M+','300+',2000),
('acct-diamond','Diamond Parking','fleet_operator','active','Seattle, WA',47.6062,-122.3321,'100,000+','400+ locations','Pacific Northwest & Western US','https://diamondparking.com','Large western US footprint; Flash touchless technology','https://www.flashparking.com/category/case-studies/',NULL,'$150M+','1,500+',1922),
('acct-platinum','Platinum Parking','fleet_operator','active','Dallas, TX',32.7875,-96.7969,'50,000+','300+ locations, 13 markets','Texas & Sun Belt cities','https://platinumparking.com','31% scan-to-pay adoption; 50% in Seattle market','https://www.flashparking.com/category/case-studies/',NULL,'$100M+','1,000+',2003),
('acct-parkway','Parkway Corporation','fleet_operator','active','Philadelphia, PA',39.9583,-75.1667,'30,000+','24 facilities, 4 cities','Philadelphia & Mid-Atlantic','https://parkwaycorp.com','230 Flash devices; Bluetooth, LPR, pay-to-text','https://www.flashparking.com/case-studies/case-study-parkway-corporation/',NULL,'$75M+','500+',1947),
('acct-laz','LAZ Parking','fleet_operator','active','Hartford, CT',41.7658,-72.6734,'2,100,000+','5,300+ locations, 600+ cities','Nationwide (largest private operator)','https://lazparking.com','Operates Flash-enabled Las Vegas municipal & TMC garages','https://www.flashparking.com/case-studies/case-study-city-of-las-vegas/',NULL,'$2B+','15,000+',1981),
('acct-reimagined','Reimagined Parking (Impark/Republic)','fleet_operator','active','New York, NY',40.7484,-73.9934,'1,000,000+','3,400+ locations','US & Canada','https://reimaginedparking.com','Operates Miami Design District Flash deployment','https://www.flashparking.com/case-studies/miami-design-district-case-study/',NULL,'$1.5B+','12,000+',1962),
('acct-one-parking','One Parking','fleet_operator','active','West Palm Beach, FL',26.7153,-80.0534,'200,000+','500+ locations','Southeast US','https://oneparking.com','Exclusive Flash EV Charging technology provider','https://www.flashparking.com/category/news-press/',NULL,'$200M+','3,000+',2003),
('acct-ticketech','Ticketech (Flash-owned)','fleet_operator','active','New York, NY',40.7484,-73.9856,'N/A','700+ NYC locations','New York City','https://flashparking.com','Acquisition; valet & garage network across NYC',NULL,NULL,NULL,'500+',NULL),
('acct-parkmobile','ParkMobile (Flash-owned)','fleet_operator','active','Atlanta, GA',33.7490,-84.3880,'N/A','8,000+ locations','Nationwide mobile payments','https://parkmobile.io','Mobile parking payments; 50M+ app users',NULL,NULL,'$200M+','300+',2008),
('acct-parkwell','Parkwell Management','large_venue','active','Denver, CO',39.7533,-105.0006,'5,000+','Multiple garages','Denver, CO','https://parkwell.com','Music Garage flagship; FlashPARCS + BLE Bluetooth','https://www.flashparking.com/case-studies/case-study-the-music-garage/',NULL,NULL,NULL,NULL),
('acct-den-airport','Denver International Airport','large_venue','active','Denver, CO',39.8561,-104.6737,'40,000+','9 garages/lots','Denver, CO','https://flydenver.com','144 lanes, 137 kiosks, 97 LPR, deployed in 22 days','https://www.flashparking.com/news/flash-transforms-parking-at-denver-international-airport/',NULL,NULL,NULL,NULL),
('acct-tmc','Texas Medical Center','large_venue','active','Houston, TX',29.7066,-95.3976,'30,000+','Multiple garages','Houston, TX','https://tmc.edu','World''s largest medical center; dynamic pricing','https://www.flashparking.com/category/case-studies/',NULL,NULL,NULL,NULL),
('acct-kaseya','Kaseya Center (Miami HEAT)','large_venue','active','Miami, FL',25.7814,-80.1870,'450+','1 arena','Miami, FL','https://heat.com','Event parking reservations; 400 garage + 50 valet',NULL,NULL,NULL,NULL,NULL),
('acct-metlife','MetLife Stadium (NY Jets)','large_venue','active','East Rutherford, NJ',40.8128,-74.0742,'28,000+','1 stadium complex','East Rutherford, NJ','https://nyjets.com','Flash event reservation system for NFL games',NULL,NULL,NULL,NULL,NULL),
('acct-ball-arena','Ball Arena','large_venue','active','Denver, CO',39.7487,-105.0077,'5,000+','1 arena','Denver, CO','https://ballarena.com','Denver''s largest public EV-charging hub (60 ports)',NULL,NULL,NULL,NULL,NULL),
('acct-las-vegas','City of Las Vegas','large_venue','active','Las Vegas, NV',36.1699,-115.1398,'10,000+','5 garages + 8 surface lots','Las Vegas, NV','https://lasvegasnevada.gov','Cloud-based with Bluetooth, event parking, rideshare','https://www.flashparking.com/case-studies/case-study-city-of-las-vegas/',NULL,NULL,NULL,NULL),
('acct-miami-design','Miami Design District','large_venue','active','Miami, FL',25.8138,-80.1928,'2,000+','4 garages','Miami, FL','https://miamidesigndistrict.net','AI Vision LPR, Express Pay, double-digit revenue growth','https://www.flashparking.com/case-studies/miami-design-district-case-study/',NULL,NULL,NULL,NULL),
('acct-oakland','City of Oakland','large_venue','active','Oakland, CA',37.8044,-122.2712,'5,000+','8 locations','Oakland, CA','https://oaklandca.gov','$5.8M CEC grant; 244 EV ports across 8 locations','https://www.flashparking.com/news/city-of-oakland-to-deploy-new-public-electric-vehicle-charging-stations-at-eight-locations/',NULL,NULL,NULL,NULL),
('acct-bethlehem','Bethlehem Parking Authority','large_venue','active','Bethlehem, PA',40.6198,-75.3775,'3,000+','Multiple garages & lots','Bethlehem, PA','https://bethlehem-pa.gov','Modernized with Flash equipment and cloud platform',NULL,NULL,NULL,NULL,NULL),
('acct-bal-harbour','Bal Harbour Shops','large_venue','active','Bal Harbour, FL',25.8891,-80.1259,'3,000+','1 luxury complex','Miami, FL','https://balharbourshops.com','Luxury retail destination; Flash-powered parking',NULL,NULL,NULL,NULL,NULL),
('acct-get-my-parking','Get My Parking','fleet_operator','active','Bengaluru, India',12.9716,77.5946,'N/A','Global reseller','International (India-based)','https://getmyparking.com','Flash reseller partnership for international markets',NULL,NULL,NULL,NULL,NULL),
('acct-mli-airport','Quad Cities International Airport','large_venue','active','Moline, IL',41.4485,-90.5075,'2,000+','3 lots','Moline, IL','https://qcairport.com','13 custom-wrapped kiosks; replaced legacy PARCS',NULL,NULL,NULL,NULL,NULL),
('acct-bgm-airport','Greater Binghamton Airport','large_venue','active','Johnson City, NY',42.2087,-75.9798,'1,000+','2 lots','Johnson City, NY','https://binghamtonairport.com','Flash equipment with virtual ticket / credit card entry',NULL,NULL,NULL,NULL,NULL),
('acct-abm','ABM Parking Services','fleet_operator','target','New York, NY',40.7128,-74.0060,'1,500,000+','2,000+ locations','Nationwide (integrated facility services)','https://abm.com','Division of ABM Industries ($8B revenue); bundled facility + parking',NULL,'T2 Systems','$800M+ (parking div.)','5,000+ (parking)',1909),
('acct-propark','Propark Mobility','fleet_operator','target','Hartford, CT',41.7658,-72.6734,'500,000+','1,000+ sites','Northeast & Southeast US','https://propark.com','Rapid growth via acquisitions; tech-forward operator',NULL,'Passport','$300M+','5,000+',1984),
('acct-ace','Ace Parking','fleet_operator','target','San Diego, CA',32.7157,-117.1611,'250,000+','500+ locations','California & Western US','https://aceparking.com','Strong in hospitality & airport verticals',NULL,'T2 Systems','$250M+','4,000+',1950),
('acct-parking-spot','The Parking Spot','large_venue','target','Annapolis, MD',38.9784,-76.4922,'60,000+','47 airport locations','Major US airports','https://theparkingspot.com','Largest near-airport parking company in US',NULL,'Proprietary','$300M+','2,500+',1998),
('acct-icon','Icon Parking','fleet_operator','target','New York, NY',40.7549,-73.9840,'150,000+','200+ NYC locations','New York City metro','https://iconparking.com','Dominant NYC operator; high-value urban garages',NULL,'Metropolis','$400M+','3,000+',1948),
('acct-towne-park','Towne Park','fleet_operator','target','Plymouth Meeting, PA',40.1070,-75.2830,'400,000+','800+ sites','Hospitality & healthcare','https://townepark.com','Largest US hospitality valet provider',NULL,'T2 Systems','$500M+','10,000+',1988),
('acct-interpark','InterPark','fleet_operator','target','Chicago, IL',41.8819,-87.6278,'50,000+','85+ locations','Chicago (largest private garage owner in US)','https://interparking.com','Largest private garage owner in US; owns rather than manages',NULL,'Metropolis','$200M+','500+',1985),
('acct-premium','Premium Parking','fleet_operator','whitespace','New Orleans, LA',29.9511,-90.0715,'100,000+','200+ locations','Southern US & Gulf Coast','https://premiumparking.com','Tech-native operator; app-first model; 40+ cities',NULL,'Proprietary','$100M+','800+',2000),
('acct-park-n-fly','Park ''N Fly','large_venue','whitespace','Atlanta, GA',33.6407,-84.4277,'40,000+','16 airport locations','Major US airports','https://pnf.com','Pioneer in off-airport parking; premium brand',NULL,'T2 Systems','$150M+','1,000+',1967),
('acct-colonial','Colonial Parking','fleet_operator','whitespace','Washington, DC',38.9072,-77.0369,'100,000+','200+ locations','Washington DC metro','https://colonialparking.com','Leading operator in DC metro area; 60+ years',NULL,NULL,'$150M+','2,000+',1954),
('acct-airgarage','AirGarage','fleet_operator','whitespace','San Francisco, CA',37.7749,-122.4194,'50,000+','100+ locations','Nationwide (tech disruptor)','https://airgarage.com','VC-backed ($25M+); gateless enforcement tech; fully digital',NULL,NULL,'$30M+','100+',2017),
('acct-denison','Denison Parking','fleet_operator','whitespace','Indianapolis, IN',39.7684,-86.1581,'100,000+','200+ locations','Midwest (Indianapolis-based)','https://denisonparking.com','One of the oldest family-owned parking firms; est. 1948',NULL,NULL,'$100M+','1,500+',1948),
('acct-douglas','Douglas Parking','fleet_operator','whitespace','Oakland, CA',37.8044,-122.2712,'50,000+','100+ locations','West Coast (CA, OR, CO, NV, AZ)','https://douglasparking.com','Multi-state West Coast operator; hospitality and commercial',NULL,NULL,'$75M+','1,000+',1975),
('acct-the-car-park','The Car Park','fleet_operator','whitespace','Boise, ID',43.6150,-116.2023,'40,000+','80+ locations','Northeast & Mid-Atlantic','https://thecarpark.com','Regional powerhouse in Baltimore/DC corridor',NULL,NULL,'$50M+','500+',1971),
('acct-indigo','Indigo Park (North America)','fleet_operator','whitespace','Montreal, QC',45.5017,-73.5673,'300,000+','500+ locations','Canada & US (global parent: Groupe Indigo/Vinci)','https://ca.parkindigo.com','Global operator; LAZ acquired Canada stake',NULL,NULL,'$400M+ (NA)','3,000+ (NA)',2014),
('acct-seven-one-seven','Seven One Seven Parking','fleet_operator','whitespace','Tampa, FL',27.9506,-82.4572,'30,000+','100+ sites','Hospitality valet & event parking','https://717parking.com','Major valet operator for hotels, events, and cruise terminals',NULL,NULL,'$40M+','800+',2005),
('acct-lax-airport','Los Angeles International Airport (LAX)','large_venue','whitespace','Los Angeles, CA',33.9425,-118.4081,'30,000+','12 garages & lots','Los Angeles, CA','https://flylax.com','2nd busiest US airport; massive parking modernization opportunity',NULL,NULL,NULL,NULL,NULL),
('acct-jfk-airport','JFK International Airport','large_venue','whitespace','Jamaica, NY',40.6413,-73.7781,'15,000+','8 terminal lots','New York, NY','https://jfkairport.com','Major international hub; Port Authority managed',NULL,NULL,NULL,NULL,NULL),
('acct-sfo-airport','San Francisco International Airport (SFO)','large_venue','whitespace','San Francisco, CA',37.6213,-122.3790,'20,000+','6 garages & lots','San Francisco, CA','https://flysfo.com','Major West Coast hub; tech-forward airport operations',NULL,NULL,NULL,NULL,NULL),
('acct-att-stadium','AT&T Stadium (Dallas Cowboys)','large_venue','whitespace','Arlington, TX',32.7473,-97.0945,'12,000+','1 stadium + lots','Arlington, TX','https://attstadium.com','100,000-seat venue; massive event parking demand',NULL,NULL,NULL,NULL,NULL),
('acct-sofi-stadium','SoFi Stadium (Rams/Chargers)','large_venue','whitespace','Inglewood, CA',33.9535,-118.3392,'9,000+','1 stadium complex','Inglewood, CA','https://sofistadium.com','$5B venue; hosts Super Bowl, concerts, dual NFL teams',NULL,NULL,NULL,NULL,NULL),
('acct-mayo-clinic','Mayo Clinic','large_venue','whitespace','Rochester, MN',44.0234,-92.4630,'25,000+','Multiple campuses','Rochester, MN + Jacksonville, FL + Phoenix, AZ','https://mayoclinic.org','Top US medical center; multi-campus parking modernization opportunity',NULL,NULL,NULL,NULL,NULL),
('acct-orlando-airport','Orlando International Airport (MCO)','large_venue','whitespace','Orlando, FL',28.4312,-81.3081,'20,000+','5 garages & lots','Orlando, FL','https://orlandoairports.net','7th busiest US airport; new terminal expansion with parking',NULL,NULL,NULL,NULL,NULL),
('acct-msg','Madison Square Garden','large_venue','whitespace','New York, NY',40.7505,-73.9934,'3,000+','2 garages','New York, NY','https://msg.com','Iconic arena; 300+ events/year; premium parking opportunity',NULL,NULL,NULL,NULL,NULL),
('acct-reef','REEF Technology','fleet_operator','whitespace','Miami, FL',25.7617,-80.1918,'500,000+','5,000+ locations','Nationwide (proximity infrastructure)','https://reeftechnology.com','Largest parking asset manager in US; pivoting garages to logistics hubs',NULL,NULL,'$700M+','15,000+',2013),
('acct-citizens','Lanier Parking (fka Citizens Parking)','fleet_operator','whitespace','Atlanta, GA',33.7490,-84.3880,'40,000+','60+ locations','Southeast US','https://www.lanierparking.com','Growing SE operator; healthcare and hospitality focus',NULL,NULL,'$50M+','500+',2007),
('acct-central','SP+ (fka Central Parking)','fleet_operator','whitespace','Chicago, IL',41.8850,-87.6350,'2,000,000+','4,200+ locations','Nationwide (largest US operator)','https://spplus.com','Largest US parking operator by locations; strong in events & aviation',NULL,NULL,'$1.5B+','23,000+',1929),
('acct-t2-systems','T2 Systems','fleet_operator','competitor','Indianapolis, IN',39.7684,-86.1581,'N/A','1,000+ clients','Integrated parking & mobility tech','https://t2systems.com','Long-standing PARCS & permit management; strong in university & municipal',NULL,NULL,'$100M+','400+',1991),
('acct-metropolis','Metropolis Technologies','large_venue','competitor','Santa Monica, CA',34.0195,-118.4912,'N/A','4,000+ locations','AI & computer vision checkout-free parking','https://metropolis.io','$800M+ raised; AI-driven Vision PARCS; smart city & aviation focus',NULL,NULL,'$200M+','1,000+',2017),
('acct-parkhub','ParkHub','large_venue','competitor','Dallas, TX',32.7767,-96.7970,'N/A','500+ venues','Real-time event parking & BI tools','https://parkhub.com','Mobile POS & analytics for large-scale events and venues',NULL,NULL,'$30M+','100+',2010),
('acct-spothero','SpotHero','fleet_operator','competitor','Chicago, IL',41.8827,-87.6233,'N/A','8,000+ locations','Digital parking reservations','https://spothero.com','Consumer-facing reservation platform; competes with Flash''s digital ecosystem',NULL,NULL,'$100M+','300+',2011),
('acct-passport','Passport','fleet_operator','competitor','Charlotte, NC',35.2271,-80.8431,'N/A','800+ clients','Mobile payments & curb management','https://passportinc.com','Leader in municipal mobile payments; competes for commercial contracts',NULL,NULL,'$75M+','400+',2010);

-- 8. Run initial garage linking
SELECT public.link_garages_to_accounts();
