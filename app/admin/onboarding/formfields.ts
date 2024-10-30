export const formFields = {
    companyDetails: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { 
        name: 'company_type', 
        label: 'Company Type', 
        type: 'select',
        options: ['Private Limited Company', 'Public Limited Company', 'Sole Proprietorship', 'Partnership'],
        required: true 
      },
      { name: 'registration_number', label: 'Registration Number', type: 'text', required: true },
      { name: 'date_established', label: 'Date Established', type: 'date', required: true },
      { name: 'kra_pin_number', label: 'KRA PIN Number', type: 'text', required: true },
      { 
        name: 'industry', 
        label: 'Industry', 
        type: 'select',
        options: ['Information Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'],
        required: true 
      },
      { name: 'employees', label: 'Employees', type: 'number' },
      { name: 'annual_revenue', label: 'Annual Revenue', type: 'number' },
      { name: 'fiscal_year', label: 'Fiscal Year', type: 'text' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'street', label: 'Street', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'postal_code', label: 'Postal Code', type: 'text' },
      { name: 'country', label: 'Country', type: 'text', required: true }
    ],
  
    directorDetails: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'middle_name', label: 'Middle Name', type: 'text' },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true },
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'id_number', label: 'ID Number', type: 'text', required: true },
      { name: 'kra_pin', label: 'KRA PIN', type: 'text', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'tel', required: true },
      { name: 'email_address', label: 'Email Address', type: 'email', required: true },
      { name: 'postal_address', label: 'Postal Address', type: 'text' },
      { name: 'job_position', label: 'Job Position', type: 'text', required: true },
      { name: 'shares_held', label: 'Shares Held', type: 'number', required: true }
    ],
  
    supplierDetails: [
      { name: 'name_qb', label: 'Name (QB)', type: 'text', required: true },
      { name: 'pin', label: 'PIN', type: 'text', required: true },
      { name: 'name_kra', label: 'Name (KRA)', type: 'text', required: true },
      { name: 'contact', label: 'Contact', type: 'text', required: true },
      { name: 'mobile', label: 'Mobile', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date' }
    ],
  
    bankDetails: [
      { name: 'bank_id', label: 'Bank ID', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'account_number', label: 'Account Number', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'branch', label: 'Branch', type: 'text', required: true },
      { name: 'rm_name', label: 'RM Name', type: 'text' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true }
    ],
  
    employeeDetails: [
      { name: 'emp_id', label: 'EMP ID', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'id_number', label: 'ID Number', type: 'text', required: true },
      { name: 'kra_pin', label: 'KRA PIN', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'mobile', label: 'Mobile', type: 'tel', required: true },
      { name: 'nhif', label: 'NHIF', type: 'text', required: true },
      { name: 'nssf', label: 'NSSF', type: 'text', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date' }
    ]
  };
  