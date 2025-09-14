-- Migration script to add website field to existing branding data
-- Run this if you have existing settings without the website field

-- Check if website field exists in branding
DO $$
BEGIN
    -- Only update if website field doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM settings 
        WHERE branding ? 'website'
    ) THEN
        -- Add website field to existing branding data
        UPDATE settings 
        SET branding = branding || '{"website": "https://www.yourcompany.com"}'
        WHERE id IS NOT NULL;
        
        RAISE NOTICE 'Website field added to branding data. Please update with your actual website URL in the admin settings.';
    ELSE
        RAISE NOTICE 'Website field already exists in branding data.';
    END IF;
END $$;

-- Verify the update
SELECT 
    branding->>'companyName' as company_name,
    branding->>'website' as website,
    branding->'contactInfo'->>'email' as email,
    branding->'contactInfo'->>'phone' as phone
FROM settings 
LIMIT 1;
