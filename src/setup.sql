CREATE TABLE organization (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    logo_filename VARCHAR(255) NOT NULL
);



INSERT INTO organization (name, description, contact_email, logo_filename)
VALUES
(
    'BrightFuture Builders',
    'A nonprofit focused on improving community infrastructure through sustainable construction projects.',
    'info@brightfuturebuilders.org',
    'brightfuture-logo.png'
),
(
    'GreenHarvest Growers',
    'An urban farming collective promoting food sustainability and education in local neighborhoods.',
    'contact@greenharvest.org',
    'greenharvest-logo.png'
),
(
    'UnityServe Volunteers',
    'A volunteer coordination group supporting local charities and service initiatives.',
    'hello@unityserve.org',
    'unityserve-logo.png'
);






CREATE TABLE service_project (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    organization_id INT NOT NULL,
    CONSTRAINT fk_project_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization (organization_id)
);



INSERT INTO service_project
    (title, description, start_date, end_date, organization_id)
VALUES
(
    'Community Road Improvement',
    'Repair and improve roads in underserved communities.',
    '2026-09-15',
    '2026-10-15',
    1
),
(
    'Sustainable Housing Project',
    'Construct affordable homes using environmentally sustainable materials.',
    '2026-10-01',
    '2026-12-15',
    1
),
(
    'Community Drainage Project',
    'Improve drainage systems to reduce flooding in local communities.',
    '2026-09-20',
    '2026-11-20',
    1
),
(
    'Clean Water Infrastructure',
    'Develop sustainable water infrastructure for local residents.',
    '2026-11-01',
    '2027-01-15',
    1
),
(
    'Green Community Center',
    'Build a sustainable community center for education and public activities.',
    '2027-01-10',
    '2027-03-30',
    1
),
(
    'Urban Vegetable Garden',
    'Create a community vegetable garden to improve access to fresh food.',
    '2026-09-10',
    '2026-10-30',
    2
),
(
    'School Garden Program',
    'Establish educational gardens in local schools.',
    '2026-09-25',
    '2026-11-15',
    2
),
(
    'Community Composting Initiative',
    'Teach residents how to compost household organic waste.',
    '2026-10-05',
    '2026-11-30',
    2
),
(
    'Youth Farming Workshop',
    'Provide young people with practical urban farming skills.',
    '2026-11-10',
    '2026-12-20',
    2
),
(
    'Neighborhood Food Sustainability Fair',
    'Organize a community event promoting sustainable food production.',
    '2027-01-15',
    '2027-01-17',
    2
),
(
    'Community Food Drive',
    'Coordinate volunteers to collect and distribute food to families in need.',
    '2026-09-12',
    '2026-10-12',
    3
),
(
    'Senior Citizen Support',
    'Organize volunteers to provide assistance to elderly community members.',
    '2026-10-01',
    '2026-12-01',
    3
),
(
    'Neighborhood Cleanup',
    'Coordinate volunteers to clean public spaces and residential areas.',
    '2026-09-18',
    '2026-10-18',
    3
),
(
    'Children Education Support',
    'Provide educational assistance and learning resources to children.',
    '2026-10-15',
    '2026-12-15',
    3
),
(
    'Holiday Community Service',
    'Coordinate volunteers for community service activities during the holiday season.',
    '2026-12-01',
    '2026-12-31',
    3
);





-- =========================================
-- CATEGORIES
-- =========================================

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);


-- =========================================
-- CATEGORY DATA
-- =========================================

INSERT INTO category (category_name)
VALUES
    ('Environmental'),
    ('Educational'),
    ('Community Service'),
    ('Health and Wellness');


-- =========================================
-- PROJECT-CATEGORY JUNCTION TABLE
-- =========================================

CREATE TABLE project_category (
    project_id INT NOT NULL,
    category_id INT NOT NULL,

    PRIMARY KEY (project_id, category_id),

    CONSTRAINT fk_project_category_project
        FOREIGN KEY (project_id)
        REFERENCES service_project (project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_category_category
        FOREIGN KEY (category_id)
        REFERENCES category (category_id)
        ON DELETE CASCADE
);





-- =========================================
-- PROJECT-CATEGORY RELATIONSHIPS
-- =========================================

INSERT INTO project_category (project_id, category_id)
VALUES
    -- BrightFuture Builders
    (1, 1), -- Community Road Improvement - Environmental
    (1, 3), -- Community Road Improvement - Community Service

    (2, 1), -- Sustainable Housing Project - Environmental
    (2, 3), -- Sustainable Housing Project - Community Service

    (3, 1), -- Community Drainage Project - Environmental
    (3, 3), -- Community Drainage Project - Community Service

    (4, 1), -- Clean Water Infrastructure - Environmental
    (4, 3), -- Clean Water Infrastructure - Community Service

    (5, 1), -- Green Community Center - Environmental
    (5, 3), -- Green Community Center - Community Service

    -- GreenHarvest Growers
    (6, 1), -- Urban Vegetable Garden - Environmental
    (6, 3), -- Urban Vegetable Garden - Community Service

    (7, 1), -- School Garden Program - Environmental
    (7, 2), -- School Garden Program - Educational

    (8, 1), -- Community Composting Initiative - Environmental
    (8, 2), -- Community Composting Initiative - Educational

    (9, 2), -- Youth Farming Workshop - Educational
    (9, 1), -- Youth Farming Workshop - Environmental

    (10, 1), -- Neighborhood Food Sustainability Fair - Environmental
    (10, 2), -- Neighborhood Food Sustainability Fair - Educational
    (10, 3), -- Neighborhood Food Sustainability Fair - Community Service

    -- UnityServe Volunteers
    (11, 3), -- Community Food Drive - Community Service
    (11, 4), -- Community Food Drive - Health and Wellness

    (12, 3), -- Senior Citizen Support - Community Service
    (12, 4), -- Senior Citizen Support - Health and Wellness

    (13, 1), -- Neighborhood Cleanup - Environmental
    (13, 3), -- Neighborhood Cleanup - Community Service

    (14, 2), -- Children Education Support - Educational
    (14, 3), -- Children Education Support - Community Service

    (15, 3), -- Holiday Community Service - Community Service
    (15, 4); -- Holiday Community Service - Health and Wellness

