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


SELECT * FROM organization;






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

