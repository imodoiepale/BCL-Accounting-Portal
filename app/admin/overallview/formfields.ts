export const formFields = {
    companyDetails: {
        fields: [
            { name: 'company_name', label: 'Company Name', type: 'text', required: true },
            { name: 'company_type', label: 'Company Type', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'registration_number', label: 'Registration Number', type: 'text' },
            { name: 'date_established', label: 'Date Established', type: 'date' },
            { name: 'industry', label: 'Industry', type: 'text' },
            { name: 'employees', label: 'Employees', type: 'text' },
            { name: 'annual_revenue', label: 'Annual Revenue', type: 'text' },
            { name: 'fiscal_year', label: 'Fiscal Year', type: 'text' },
            { name: 'website', label: 'Website', type: 'url' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone', type: 'tel' },
            { name: 'street', label: 'Street', type: 'text' },
            { name: 'city', label: 'City', type: 'text' },
            { name: 'postal_code', label: 'Postal Code', type: 'text' },
            { name: 'country', label: 'Country', type: 'text' },

            // KRA Details
            { name: 'kra_pin', label: 'KRA PIN', type: 'text', category: 'KRA Details' },
            { name: 'kra_password', label: 'KRA Password', type: 'text', category: 'KRA Details' },

            // NSSF Details
            { name: 'nssf_code', label: 'NSSF Code', type: 'text', category: 'NSSF Details' },
            // { name: 'nssf_user', label: 'NSSF User', type: 'text', category: 'NSSF Details' },
            { name: 'nssf_password', label: 'NSSF Password', type: 'text', category: 'NSSF Details' },
            { name: 'nssf_reg_date', label: 'NSSF Registration Date', type: 'date', category: 'NSSF Details' },
            { name: 'nssf_compliance_date', label: 'NSSF Compliance Certificate Date', type: 'date', category: 'NSSF Details' },

            // NHIF Details
            { name: 'nhif_code', label: 'NHIF Code', type: 'text', category: 'NHIF Details' },
            { name: 'nhif_password', label: 'NHIF Password', type: 'text', category: 'NHIF Details' },
            { name: 'nhif_mobile', label: 'NHIF Mobile', type: 'text', category: 'NHIF Details' },
            { name: 'nhif_email', label: 'NHIF Email', type: 'text', category: 'NHIF Details' },
            { name: 'nhif_status', label: 'NHIF Status', type: 'text', category: 'NHIF Details' },
            { name: 'nhif_reg_date', label: 'NHIF Registration Date', type: 'date', category: 'NHIF Details' },
            { name: 'nhif_compliance_date', label: 'NHIF Compliance Certificate Date', type: 'date', category: 'NHIF Details' },

            // Ecitizen Details
            { name: 'ecitizen_identifier', label: 'E-Citizen Identifier', type: 'text', category: 'E-Citizen Details' },
            { name: 'ecitizen_password', label: 'E-Citizen Password', type: 'text', category: 'E-Citizen Details' },
            { name: 'ecitizen_status', label: 'E-Citizen Status', type: 'text', category: 'E-Citizen Details' },
            { name: 'ecitizen_id', label: 'E-Citizen ID', type: 'text', category: 'E-Citizen Details' },
            { name: 'ecitizen_email', label: 'E-Citizen Email', type: 'email', category: 'E-Citizen Details' },
            { name: 'ecitizen_mobile', label: 'E-Citizen Mobile', type: 'tel', category: 'E-Citizen Details' },


            // NITA Details
            { name: 'nita_identifier', label: 'NITA Identifier', type: 'text', category: 'NITA Details' },
            { name: 'nita_password', label: 'NITA Password', type: 'text', category: 'NITA Details' },
            { name: 'nita_status', label: 'NITA Status', type: 'text', category: 'NITA Details' },

            // Housing Levy Details
            { name: 'housing_levy_identifier', label: 'Housing Levy Identifier', type: 'text', category: 'Housing Levy Details' },
            { name: 'housing_levy_password', label: 'Housing Levy Password', type: 'text', category: 'Housing Levy Details' },
            { name: 'housing_levy_status', label: 'Housing Levy Status', type: 'text', category: 'Housing Levy Details' },

            // Standard Levy Details
            { name: 'standard_levy_identifier', label: 'Standard Levy Identifier', type: 'text', category: 'Standard Levy Details' },
            { name: 'standard_levy_password', label: 'Standard Levy Password', type: 'text', category: 'Standard Levy Details' },
            { name: 'standard_levy_status', label: 'Standard Levy Status', type: 'text', category: 'Standard Levy Details' },


            // Tourism Levy Details
            { name: 'tourism_levy_identifier', label: 'Tourism Levy Identifier', type: 'text', category: 'Tourism Levy Details' },
            { name: 'tourism_levy_password', label: 'Tourism Levy Password', type: 'text', category: 'Tourism Levy Details' },
            { name: 'tourism_levy_status', label: 'Tourism Levy Status', type: 'text', category: 'Tourism Levy Details' },
            { name: 'tourism_fund_username', label: 'Tourism Fund Username', type: 'text', category: 'Tourism Fund Details' },
            { name: 'tourism_fund_password', label: 'Tourism Fund Password', type: 'text', category: 'Tourism Fund Details' },

            // VAT Details
            { name: 'vat_identifier', label: 'VAT Identifier', type: 'text', category: 'VAT Details' },
            { name: 'vat_password', label: 'VAT Password', type: 'text', category: 'VAT Details' },
            { name: 'vat_status', label: 'VAT Status', type: 'text', category: 'VAT Details' },
            { name: 'vat_from', label: 'VAT From', type: 'date', category: 'VAT Details' },
            { name: 'vat_to', label: 'VAT To', type: 'date', category: 'VAT Details' },

            // Tax Status Details
            { name: 'pin_status', label: 'PIN Status', type: 'text' , category: 'Tax Status' },
            { name: 'itax_status', label: 'iTax Status', type: 'text' , category: 'Tax Status' },
            { name: 'vat_status', label: 'VAT Status', type: 'text' , category: 'Tax Status' },
            { name: 'vat_from', label: 'VAT From', type: 'date' , category: 'Tax Status' },
            { name: 'vat_to', label: 'VAT To', type: 'date' , category: 'Tax Status' },
            { name: 'income_tax_resident_status', label: 'Income Tax - Resident Individual Status', type: 'text', category: 'Tax Status' },
            { name: 'income_tax_resident_from', label: 'Income Tax - Resident Individual From', type: 'date', category: 'Tax Status' },
            { name: 'income_tax_resident_to', label: 'Income Tax - Resident Individual To', type: 'date', category: 'Tax Status' },

            // NEA Details
            { name: 'nea_username', label: 'NEA Username', type: 'text', category: 'NEA Details' },
            { name: 'nea_password', label: 'NEA Password', type: 'text', category: 'NEA Details' },
            { name: 'paye_status', label: 'PAYE Status', type: 'text', category: 'PAYE Details' },
            { name: 'paye_from', label: 'PAYE From', type: 'date', category: 'PAYE Details' },
            { name: 'paye_to', label: 'PAYE To', type: 'date', category: 'PAYE Details' },

            { name: 'rent_income_status', label: 'Rent Income Status', type: 'text', category: 'MRI' },
            { name: 'rent_income_from', label: 'Rent Income From', type: 'date', category: 'MRI' },
            { name: 'rent_income_to', label: 'Rent Income To', type: 'date', category: 'MRI' },

            { name: 'turnover_tax_status', label: 'Turnover Tax Status', type: 'text', category: 'TOT' },
            { name: 'turnover_tax_from', label: 'Turnover Tax From', type: 'date', category: 'TOT' },
            { name: 'turnover_tax_to', label: 'Turnover Tax To', type: 'date', category: 'TOT' },

            // TIMS Details
            { name: 'tims_username', label: 'TIMS Username', type: 'text', category: 'TIMS Details' },
            { name: 'tims_cert_incorporation', label: 'Certificate of Incorporation', type: 'text', category: 'TIMS Details' },
            { name: 'tims_pin', label: 'PIN Number', type: 'text', category: 'TIMS Details' },
            { name: 'tims_comment', label: 'Comment', type: 'text', category: 'TIMS Details' },
            { name: 'tims_director_pin', label: 'Director PIN in System', type: 'text', category: 'TIMS Details' },
            { name: 'tims_current_director_pin', label: 'Current Director PIN', type: 'text', category: 'TIMS Details' },
            { name: 'tims_operator', label: 'Operator (ID Name + Number)', type: 'text', category: 'TIMS Details' },
            { name: 'tims_password', label: 'TIMS Password', type: 'text', category: 'TIMS Details' },
            { name: 'tims_mobile', label: 'TIMS Mobile Number + Name', type: 'text', category: 'TIMS Details' },
            { name: 'tims_email', label: 'TIMS Email Address', type: 'email', category: 'TIMS Details' },
            { name: 'tims_reg_doc_number', label: 'Registration Document Number', type: 'text', category: 'TIMS Details' },

            // Sheria Details
            { name: 'sheria_mobile', label: 'Sheria Mobile', type: 'text', category: 'Sheria Details' },
            { name: 'sheria_email', label: 'Sheria Email', type: 'text', category: 'Sheria Details' },
            { name: 'sheria_postal_address', label: 'Sheria Postal Address', type: 'text', category: 'Sheria Details' },

            // Client Category
            { name: 'account_manager', label: 'Account Manager', type: 'text', category: 'Client Category' },
            { name: 'client_accountant', label: 'Client Company Accountant', type: 'text', category: 'Client Category' },
            { name: 'company_status', label: 'Company Status', type: 'select', options: ['Active', 'Dormant', 'To Start'], category: 'Client Category' },
            { name: 'company_type', label: 'Company Type', type: 'select', options: ['Limited', 'Sole Proprietorship', 'Partnership'], category: 'Client Category' },

            // // Compliance Details
            // { name: 'fire_prevention_license', label: 'Fire Prevention License', type: 'text', category: 'Compliance' },
            // { name: 'business_permit', label: 'Single Business Permit', type: 'text', category: 'Compliance' },
            // { name: 'tourism_fund_levy', label: 'Tourism Fund Levy', type: 'text', category: 'Compliance' },

            // // Statutory Details
            // { name: 'nea_status', label: 'NEA Status', type: 'text', category: 'Statutory Details' },
            // { name: 'nhif_status', label: 'NHIF Status', type: 'text', category: 'Statutory Details' },
            // { name: 'nssf_status', label: 'NSSF Status', type: 'text', category: 'Statutory Details' },


            // Other Company Details
            { name: 'nature_of_business', label: 'Nature of Business', type: 'text', category: 'Other Details' },
            { name: 'audit_period', label: 'Audit Period', type: 'text', category: 'Other Details' },
            { name: 'sale_terms', label: 'Sale Terms', type: 'text', category: 'Other Details' },
        ]
    },
    directorDetails: {
        fields: [
            { name: 'first_name', label: 'First Name', type: 'text' },
            { name: 'middle_name', label: 'Middle Name', type: 'text' },
            { name: 'last_name', label: 'Last Name', type: 'text' },
            { name: 'full_name', label: 'Full Name', type: 'text' },
            { name: 'gender', label: 'Gender', type: 'text' },
            { name: 'place_of_birth', label: 'Place of Birth', type: 'text' },
            { name: 'country_of_birth', label: 'Country of Birth', type: 'text' },
            { name: 'nationality', label: 'Nationality', type: 'text' },
            { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
            { name: 'id_number', label: 'ID Number', type: 'text' },
            { name: 'tax_pin', label: 'Tax PIN', type: 'text' },
            { name: 'mobile_number', label: 'Mobile Number', type: 'tel' },
            { name: 'email_address', label: 'Email Address', type: 'email' },
            { name: 'job_position', label: 'Job Position', type: 'text' },
            { name: 'shares_held', label: 'Shares Held', type: 'number' }
        ]
    },

    supplierDetails: {
        fields: [
            { name: 'supplier_name', label: 'Supplier Name', type: 'text' },
            { name: 'supplier_type', label: 'Supplier Type', type: 'text' },
            { name: 'trading_type', label: 'Trading Type', type: 'text' },
            { name: 'pin', label: 'PIN', type: 'text' },
            { name: 'id_number', label: 'ID Number', type: 'text' },
            { name: 'mobile', label: 'Mobile', type: 'tel' },
            { name: 'email', label: 'Email', type: 'email' }
        ]
    },

// Update bank details fields to match database columns
bankDetails: {
    fields: [
        { name: 'bank_name', label: 'Bank Name', type: 'text' },
        { name: 'account_number', label: 'Account Number', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
        { name: 'branch', label: 'Branch', type: 'text' },
        { name: 'rm_name', label: 'RM Name', type: 'text' },
        { name: 'rm_mobile', label: 'RM Mobile', type: 'tel' },
        { name: 'rm_email', label: 'RM Email', type: 'email' },
        { name: 'bank_startdate', label: 'Bank Start Date', type: 'date' },
        { name: 'bank_status', label: 'Bank Status', type: 'boolean' },
        { name: 'bank_verified', label: 'Bank Verified', type: 'boolean' },
        { name: 'status', label: 'Status', type: 'text' }
    ]
},

// Update employee details fields to match database columns 
employeeDetails: {
    fields: [
        { name: 'employee_name', label: 'Employee Name', type: 'text' },
        { name: 'id_number', label: 'ID Number', type: 'text' },
        { name: 'employee_kra_pin', label: 'KRA PIN', type: 'text' },
        { name: 'employee_email', label: 'Email', type: 'email' },
        { name: 'employee_mobile', label: 'Mobile', type: 'tel' },
        { name: 'employee_nhif', label: 'NHIF Number', type: 'text' },
        { name: 'employee_nssf', label: 'NSSF Number', type: 'text' },
        { name: 'employee_startdate', label: 'Employee Start Date', type: 'date' },
        { name: 'employee_enddate', label: 'Employee End Date', type: 'date' },
        { name: 'employee_status', label: 'Employee Status', type: 'boolean' },
        { name: 'employee_verified', label: 'Employee Verified', type: 'boolean' },
        { name: 'status', label: 'Status', type: 'text' }
    ]
}

};