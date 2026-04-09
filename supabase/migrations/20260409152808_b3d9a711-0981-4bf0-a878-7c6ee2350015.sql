-- Remove duplicate The Parking Spot entry
DELETE FROM flash_accounts WHERE id = 'the-parking-spot';

-- Update original The Parking Spot with correct Chicago HQ and enriched data
UPDATE flash_accounts 
SET hq_city = 'Chicago, IL', 
    hq_lat = 41.8781, 
    hq_lng = -87.6298, 
    website = 'https://theparkingspot.com',
    founded = 1998,
    facility_count = '30+ airports',
    focus_area = 'Airport off-site parking',
    notes = 'Founded by Martin Nesbitt, backed by Penny Pritzker. Major airport parking brand. ~$430M revenue.',
    updated_at = now()
WHERE id = 'acct-parking-spot';