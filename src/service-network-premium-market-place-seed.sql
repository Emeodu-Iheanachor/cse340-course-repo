BEGIN;

INSERT INTO public.service_categories
    (category_name, description, slug, is_active)
VALUES
    ('Home Services',
     'Household assistance, domestic services, home improvement and related services.',
     'home-services', TRUE),

    ('Education and Tutoring',
     'Academic tutoring, professional training, coaching and educational support.',
     'education-tutoring', TRUE),

    ('Information Technology',
     'IT support, networking, cybersecurity, database administration and technology services.',
     'information-technology', TRUE),

    ('Web and Software Development',
     'Website development, application development, programming and software solutions.',
     'web-software-development', TRUE),

    ('Graphics and Creative Design',
     'Graphic design, branding, illustration, photography and creative services.',
     'graphics-creative-design', TRUE),

    ('Business and Consulting',
     'Business advisory, management consulting, entrepreneurship and administrative support.',
     'business-consulting', TRUE),

    ('Accounting and Finance',
     'Bookkeeping, financial management, tax preparation and accounting services.',
     'accounting-finance', TRUE),

    ('Health and Wellness',
     'Wellness support, fitness coaching and non-emergency health-related services.',
     'health-wellness', TRUE),

    ('Transportation and Logistics',
     'Delivery, transportation, moving and logistics-related services.',
     'transportation-logistics', TRUE),

    ('Cleaning and Maintenance',
     'Residential and commercial cleaning, sanitation and property maintenance.',
     'cleaning-maintenance', TRUE),

    ('Agriculture and Farming',
     'Agricultural support, farm management, crop production and related services.',
     'agriculture-farming', TRUE),

    ('Events and Entertainment',
     'Event planning, catering, entertainment and event management.',
     'events-entertainment', TRUE),

    ('Beauty and Personal Care',
     'Hair styling, beauty treatments, grooming and personal care services.',
     'beauty-personal-care', TRUE),

    ('Repairs and Technical Support',
     'Equipment repairs, appliance maintenance and technical troubleshooting.',
     'repairs-technical-support', TRUE),

    ('Other Services',
     'Additional professional and community services not listed in other categories.',
     'other-services', TRUE);

COMMIT;
