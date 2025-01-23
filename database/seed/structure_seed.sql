-- Sample data for main_tabs
INSERT INTO main_tabs (name, order_index, is_visible) VALUES
('Company Details', 0, true),
('Director Details', 1, true),
('Bank Details', 2, true);

-- Sample data for sub_tabs
INSERT INTO sub_tabs (main_tab_id, name, order_index, is_visible) VALUES
(1, 'Basic Info', 0, true),
(1, 'Additional Info', 1, true),
(2, 'Personal Info', 0, true),
(2, 'Professional Info', 1, true),
(3, 'Account Details', 0, true);

-- Sample data for sections
INSERT INTO sections (sub_tab_id, name, order_index, is_visible) VALUES
(1, 'Company Information', 0, true),
(1, 'Contact Details', 1, true),
(2, 'Registration Details', 0, true),
(3, 'Basic Details', 0, true),
(4, 'Experience', 0, true),
(5, 'Bank Account', 0, true);

-- Sample data for subsections
INSERT INTO subsections (section_id, name, order_index, is_visible) VALUES
(1, 'Basic Details', 0, true),
(1, 'Address', 1, true),
(2, 'Contact Person', 0, true),
(3, 'Registration Info', 0, true),
(4, 'Personal Details', 0, true),
(5, 'Work History', 0, true),
(6, 'Account Information', 0, true);

-- Sample data for fields
INSERT INTO fields (subsection_id, name, display_name, table_name, column_name, order_index, is_visible, dropdown_options) VALUES
(1, 'company_name', 'Company Name', 'acc_portal_company_duplicate', 'company_name', 0, true, null),
(1, 'registration_number', 'Registration Number', 'acc_portal_company_duplicate', 'registration_number', 1, true, null),
(2, 'address_line_1', 'Address Line 1', 'acc_portal_company_duplicate', 'address_line_1', 0, true, null),
(2, 'city', 'City', 'acc_portal_company_duplicate', 'city', 1, true, null),
(3, 'contact_name', 'Contact Name', 'acc_portal_company_duplicate', 'contact_name', 0, true, null),
(3, 'contact_email', 'Contact Email', 'acc_portal_company_duplicate', 'contact_email', 1, true, null),
(4, 'registration_date', 'Registration Date', 'acc_portal_company_duplicate', 'registration_date', 0, true, null),
(5, 'director_name', 'Director Name', 'director_details', 'name', 0, true, null),
(5, 'director_email', 'Director Email', 'director_details', 'email', 1, true, null),
(6, 'years_experience', 'Years of Experience', 'director_details', 'years_experience', 0, true, null),
(7, 'account_number', 'Account Number', 'bank_details', 'account_number', 0, true, null),
(7, 'bank_name', 'Bank Name', 'bank_details', 'bank_name', 1, true, null);
