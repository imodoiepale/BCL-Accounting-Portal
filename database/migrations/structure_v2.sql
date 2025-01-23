-- Drop existing table if it exists
DROP TABLE IF EXISTS profile_category_table_mapping_2;

-- Create the new structure table
CREATE TABLE profile_category_table_mapping_2 (
    id SERIAL PRIMARY KEY,
    main_tab VARCHAR(255) NOT NULL,
    sub_tab VARCHAR(255) NOT NULL,
    structure JSONB NOT NULL DEFAULT '{
        "order": {
            "maintabs": {},
            "subtabs": {},
            "sections": {},
            "subsections": {},
            "fields": {}
        },
        "visibility": {
            "maintabs": {},
            "subtabs": {},
            "sections": {},
            "subsections": {},
            "fields": {}
        },
        "sections": []
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(main_tab, sub_tab)
);

-- Create an index on the main_tab and sub_tab columns
CREATE INDEX idx_mapping_tabs ON profile_category_table_mapping_2(main_tab, sub_tab);

-- Create an index on the structure JSONB field
CREATE INDEX idx_mapping_structure ON profile_category_table_mapping_2 USING GIN (structure);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mapping_updated_at
    BEFORE UPDATE ON profile_category_table_mapping_2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO profile_category_table_mapping_2 (main_tab, sub_tab, structure) VALUES
(
    'Company Details',
    'Basic Info',
    '{
        "order": {
            "maintabs": {"Company Details": 0},
            "subtabs": {"Basic Info": 0},
            "sections": {"Company Information": 0, "Contact Details": 1},
            "subsections": {"Basic Details": 0, "Address": 1},
            "fields": {
                "company_name": 0,
                "registration_number": 1,
                "address_line_1": 2,
                "city": 3
            }
        },
        "visibility": {
            "maintabs": {"Company Details": true},
            "subtabs": {"Basic Info": true},
            "sections": {"Company Information": true, "Contact Details": true},
            "subsections": {"Basic Details": true, "Address": true},
            "fields": {
                "company_name": true,
                "registration_number": true,
                "address_line_1": true,
                "city": true
            }
        },
        "sections": [
            {
                "name": "Company Information",
                "subsections": [
                    {
                        "name": "Basic Details",
                        "fields": [
                            {
                                "name": "company_name",
                                "display": "Company Name",
                                "table": "acc_portal_company_duplicate",
                                "column": "company_name"
                            },
                            {
                                "name": "registration_number",
                                "display": "Registration Number",
                                "table": "acc_portal_company_duplicate",
                                "column": "registration_number"
                            }
                        ]
                    },
                    {
                        "name": "Address",
                        "fields": [
                            {
                                "name": "address_line_1",
                                "display": "Address Line 1",
                                "table": "acc_portal_company_duplicate",
                                "column": "address_line_1"
                            },
                            {
                                "name": "city",
                                "display": "City",
                                "table": "acc_portal_company_duplicate",
                                "column": "city"
                            }
                        ]
                    }
                ]
            }
        ]
    }'::jsonb
);
