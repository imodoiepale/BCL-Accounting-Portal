// @ts-nocheck

import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/supabaseClient";

export const getFormFields = (currentStage: number, stages: any[], complianceStatus: any[], formFields: any) => {
    const fields = (() => {
        switch (currentStage) {
            case 1: return formFields.companyDetails.fields;
            case 2: return formFields.directorDetails.fields;
            case 3: return formFields.supplierDetails.fields;
            case 4: return formFields.bankDetails.fields;
            case 5: return formFields.employeeDetails.fields;
            default: return [];
        }
    })();

    const relevantStatus = complianceStatus.find(status =>
        status.name === stages[currentStage - 1].name
    );

    if (relevantStatus?.count && relevantStatus.count > 1) {
        return {
            fields: generateFieldsBasedOnCount(fields, relevantStatus.count),
            defaultValues: generateDefaultValues(fields, relevantStatus.count)
        };
    }

    return {
        fields,
        defaultValues: fields.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, {} as Record<string, string>)
    };
};

export const generateFieldsBasedOnCount = (baseFields: any[], count: number) => {
    return Array.from({ length: count }).flatMap((_, i) =>
        baseFields.map(field => ({
            ...field,
            name: `${field.name}_${i + 1}`,
            label: `${field.label} ${i + 1}`
        }))
    );
};

export const generateDefaultValues = (fields: any[], count: number) => {
    return Array.from({ length: count }).reduce((acc, _, i) => {
        fields.forEach(field => {
            acc[`${field.name}_${i + 1}`] = '';
        });
        return acc;
    }, {} as Record<string, string>);
};

export const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setData: (data: any) => void,
    currentStage: number,
    userData: { userId: string },
    existingData: any
) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!['csv', 'xlsx'].includes(fileExtension || '')) {
        toast.error('Please upload a .csv or .xlsx file');
        return;
    }

    try {
        setFile(file);
        const fileReader = new FileReader();

        fileReader.onload = async (event) => {
            try {
                const content = event.target?.result;
                const parsedData = fileExtension === 'csv'
                    ? parseCSV(content as string, userData.userId)
                    : parseXLSX(content, userData.userId);

                if (parsedData.length === 0) {
                    toast.error(`No valid data found in ${fileExtension.toUpperCase()}`);
                    return;
                }

                setData({ ...existingData, [currentStage]: parsedData });
                toast.success(`${fileExtension.toUpperCase()} data loaded successfully`);
            } catch (error) {
                console.error('Error processing file content:', error);
                toast.error('Error processing file content');
            }
        };

        fileReader.onerror = () => toast.error('Error reading file');
        fileExtension === 'csv'
            ? fileReader.readAsText(file)
            : fileReader.readAsBinaryString(file);

    } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Error processing file');
    }
};


export const parseCSV = (content: string, userId: string) => {
    const rows = content.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1)
        .map(row => {
            const values = row.split(',');
            const rowData = headers.reduce((acc, header, index) => {
                const value = values[index]?.trim();
                if (value) acc[header.trim()] = value;
                return acc;
            }, {} as Record<string, string>);
            return { ...rowData, userid: userId };  // Use passed userId parameter
        })
        .filter(row => Object.keys(row).length > 1);
};

export const parseXLSX = (content: any, userId: string) => {
    const workbook = XLSX.read(content, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData.map(row => {
        const transformedRow = {};
        Object.entries(row).forEach(([key, value]) => {
            const dbKey = key.toLowerCase().replace(/\s+/g, '_');
            transformedRow[dbKey] = value;
        });
        return {
            ...transformedRow,
            userid: userId  // Use passed userId parameter
        };
    });
};

export const handleManualEntry = async (formData: any, currentStage: number, complianceStatus: any[], stages: any[], companyData: any, setData: any, setFormData: any, setIsDialogOpen: any) => {
    try {
        if (!formData) {
            toast.error('Form data is required');
            return false;
        }

        const status = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status;
        const baseData = { status, userid: companyData.userId };
        const cleanedData = await processFormData(formData, currentStage, baseData);

        console.log('Manual Entry Input Data:', formData);
        console.log('Cleaned Data:', cleanedData);

        if (!cleanedData) {
            toast.error('Please fill in at least one field');
            return false;
        }

        setData(prev => ({
            ...prev,
            [currentStage]: Array.isArray(prev[currentStage])
                ? [...prev[currentStage], cleanedData]
                : [cleanedData]
        }));

        setFormData(cleanedData);
        setIsDialogOpen(false);
        toast.success('Data added successfully');
        return true;

    } catch (error) {
        console.error('Error adding data:', error);
        toast.error('Failed to add data. Please try again.');
        return false;
    }
};

export const sanitizeData = (data: any) => {
    console.log('Data before sanitization:', data);
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '') {
            // Handle number fields
            if (
                key.includes('_count') ||
                key.includes('_amount') ||
                key === 'shares_held' ||
                key === 'employees' ||
                key === 'dependents' ||
                key === 'annual_income'
            ) {
                sanitized[key] = null;
            }
            // Handle date fields
            else if (
                key.includes('_date') ||
                key === 'date_established' ||
                key === 'date_of_birth'
            ) {
                sanitized[key] = null;
            }
            // Handle boolean fields
            else if (
                key.includes('_status') ||
                key.includes('_verified')
            ) {
                sanitized[key] = false;
            }
            // Leave other empty strings as is
        }
        // Convert string numbers to actual numbers
        else if (typeof sanitized[key] === 'string') {
            if (key.includes('_amount') || key === 'annual_income') {
                const num = parseFloat(sanitized[key]);
                sanitized[key] = isNaN(num) ? null : num;
            }
            else if (
                key.includes('_count') ||
                key === 'shares_held' ||
                key === 'employees' ||
                key === 'dependents'
            ) {
                const num = parseInt(sanitized[key]);
                sanitized[key] = isNaN(num) ? null : num;
            }
        }
        // Handle nested objects
        else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    });
    console.log('Data after sanitization:', sanitized);
    return sanitized;
};

export const processFormData = async (formData: any, stage: number, baseData: any) => {
    console.log('Processing form data for stage:', stage);
    console.log('Form data input:', formData);
    console.log('Base data:', baseData);

    const currentStatus = complianceStatus.find(s => s.name === stages[stage - 1].name)?.status || 'missing';
    const stageMapping = {
        1: processCompanyData,
        2: processDirectorData,
        3: processSupplierData,
        4: processBankData,
        5: processEmployeeData
    };

    const processor = stageMapping[stage as keyof typeof stageMapping];
    if (!processor) return null;

    const processedData = processor(formData, { ...baseData, status: currentStatus });
    console.log('Processed form data:', processedData);
    return Object.values(processedData).some(value =>
        value !== '' && value !== null && value !== undefined
    ) ? sanitizeData(processedData) : null;
};

export const processCompanyData = (formData: any, baseData: any) => {
    console.log('Processing company data:', formData);
    const processed = {
        ...baseData,
        company_type: formData.company_type || '',
        description: formData.description || '',
        registration_number: formData.registration_number || '',
        date_established: formData.date_established || null,
        kra_pin_number: formData.kra_pin || '',
        industry: formData.industry || '',
        employees: formData.employees || null,
        annual_revenue: formData.annual_revenue || null,
        fiscal_year: formData.fiscal_year || '',
        website: formData.website || '',
        email: formData.email || '',
        phone: formData.phone || '',
        street: formData.street || '',
        city: formData.city || '',
        postal_code: formData.postal_code || '',
        country: formData.country || ''
    };
    console.log('Processed company data:', processed);
    return processed;
};

export const processDirectorData = (formData: any, baseData: any) => {
    const directorData = {
        ...baseData,
        company_id: formData.company_id || null,
        first_name: formData.first_name_1 || formData['First Name'] || '',
        middle_name: formData.middle_name_1 || formData['Middle Name'] || '',
        last_name: formData.last_name_1 || formData['Last Name'] || '',
        full_name: formData.full_name_1 || formData['Full Name'] || '',
        gender: formData.gender_1 || formData['Gender'] || '',
        nationality: formData.nationality_1 || formData['Nationality'] || '',
        date_of_birth: formData.date_of_birth_1 || formData['Date of Birth'] || null,
        country_of_birth: formData.country_of_birth_1 || formData['Country of Birth'] || '',
        id_number: formData.id_number_1 || formData['ID Number'] || '',
        tax_pin: formData.tax_pin_1 || formData['Tax PIN'] || '',
        mobile_number: formData.mobile_number_1 || formData['Mobile Number'] || '',
        email_address: formData.email_address_1 || formData['Email Address'] || '',
        job_position: formData.job_position_1 || formData['Job Position'] || '',
        shares_held: formData.shares_held_1 ? parseInt(formData.shares_held_1) : null
    };

    // Filter out empty fields
    return Object.fromEntries(
        Object.entries(directorData).filter(([_, value]) => value !== '')
    );
};

export const processBankData = (formData: any, baseData: any) => {
    const bankData = {
        status: baseData.status, // Keep as text
        bank_name: formData.bank_name_1 || formData['Bank Name'] || '',
        account_number: formData.account_number_1 || formData['Account Number'] || '',
        currency: formData.currency_1 || formData['Currency'] || '',
        branch: formData.branch_1 || formData['Branch'] || '',
        relationship_manager_name: formData.relationship_manager_name_1 || formData['RM Name'] || '',
        relationship_manager_mobile: formData.relationship_manager_mobile_1 || formData['RM Mobile'] || '',
        relationship_manager_email: formData.relationship_manager_email_1 || formData['RM Email'] || '',
        bank_startdate: formData.bank_startdate_1 || null,
        bank_status: baseData.status === 'has_details', // Convert to boolean
        bank_verified: false,
        userid: baseData.userid,
    };

    // Filter out empty fields
    return Object.fromEntries(
        Object.entries(bankData).filter(([_, value]) => value !== '')
    );
};

export const processSupplierData = (formData: any, baseData: any) => {
    // For file upload
    if (formData['Supplier Name']) {
        return {
            userid: baseData.userid,
            supplier_name: formData['Supplier Name'],
            supplier_type: formData['Supplier Type'],
            trading_type: formData['Trading Type'],
            pin: formData['PIN'],
            id_number: formData['ID Number'],
            mobile: formData['Mobile'],
            email: formData['Email'],
            status: baseData.status
        };
    }

    // For form submission
    const supplierData = {
        userid: baseData.userid,
        supplier_name: formData.supplier_name_1 || '',
        supplier_type: formData.supplier_type_1 || '',
        trading_type: formData.trading_type_1 || '',
        pin: formData.pin_1 || '',
        id_number: formData.id_number_1 || '',
        mobile: formData.mobile_1 || '',
        email: formData.email_1 || '',
        status: baseData.status
    };

    return Object.fromEntries(
        Object.entries(supplierData).filter(([_, value]) => value !== '')
    );
};

export const processEmployeeData = (formData: any, baseData: any) => {
    return {
        employee_name: formData.employee_name_1 || '', // Add _1 suffix for form fields
        id_number: formData.id_number_1 || '',
        employee_kra_pin: formData.employee_kra_pin_1 || '',
        employee_email: formData.employee_email_1 || '',
        employee_mobile: formData.employee_mobile_1 || '',
        employee_nhif: formData.employee_nhif_1 || '',
        employee_nssf: formData.employee_nssf_1 || '',
        employee_startdate: formData.employee_startdate_1 || null,
        employee_enddate: formData.employee_enddate_1 || null,
        employee_status: baseData.status === 'has_details',
        employee_verified: false,
        userid: baseData.userid,
        status: baseData.status
    };
};

export const submitAllData = async (data: any, companyData: { userId: string; name: string;  }, complianceStatus: any[], setLoading: (loading: boolean) => void ) => {
    const { userId, name } = companyData;
    try {
        setLoading(true);
        let companyId;

        // Map data to respective tables based on field categories
        const tableDataMap = {
            acc_portal_company: {},
            PasswordChecker: {},
            nssf_companies: {},
            nhif_companies: {},
            tourism_fund: {},
            vat_companies: {},
            // Add other tables as needed
        };

        // Sort fields into their respective tables
        if (data[1]?.length > 0) {
            Object.entries(data[1][0]).forEach(([key, value]) => {
                // KRA related fields
                if (key.startsWith('kra_')) {
                    tableDataMap.PasswordChecker[key] = value;
                }
                // NSSF related fields
                else if (key.startsWith('nssf_')) {
                    tableDataMap.nssf_companies[key] = value;
                }
                // NHIF related fields
                else if (key.startsWith('nhif_')) {
                    tableDataMap.nhif_companies[key] = value;
                }
                // Tourism related fields
                else if (key.startsWith('tourism_')) {
                    tableDataMap.tourism_fund[key] = value;
                }
                // VAT related fields
                else if (key.startsWith('vat_')) {
                    tableDataMap.vat_companies[key] = value;
                }
                // Company general information
                else {
                    tableDataMap.acc_portal_company[key] = value;
                }
            });
        }

        // Submit data to each table
        for (const [table, tableData] of Object.entries(tableDataMap)) {
            if (Object.keys(tableData).length > 0) {
                const sanitizedData = sanitizeData({
                    ...tableData,
                    userid: userId,
                    company_name: name,
                    status: table === 'acc_portal_company' ?  (complianceStatus.find(s => s.name === "Company Information")?.status || 'pending') : 'pending'
                });

                const { error } = await supabase
                    .from(table)
                    .insert(sanitizedData);

                if (error) throw new Error(`Failed to insert ${table} data: ${error.message}`);
            }
        }

        // Submit Directors
        console.log('Director Data to submit:', data[2]);
        const directorStatus = complianceStatus.find(s => s.name === "Director's Information")?.status || 'missing';
        if (data[2]?.length > 0) {
            const directorData = data[2].map((director: any) => ({
                ...director,
                userid: userId,
                company_id: companyId,
            }));
            const { error: directorError } = await supabase
                .from('acc_portal_directors')
                .insert(directorData);
            if (directorError) throw directorError;
        }
        // Submit Suppliers
        console.log('Supplier Data to submit:', data[3]);
        const supplierStatus = complianceStatus.find(s => s.name === "Suppliers")?.status || 'missing';
        if (data[3]?.length > 0) {
            const supplierData = data[3].map((supplier: any) => ({
                ...supplier,
                userid: userId
            }));
            const { error: supplierError } = await supabase
                .from('acc_portal_supplierss')
                .insert(supplierData);
            if (supplierError) throw supplierError;
        }

        // Submit Banks
        console.log('Bank Data to submit:', data[4]);
        const bankStatus = complianceStatus.find(s => s.name === "Banks")?.status || 'missing';
        if (data[4]?.length > 0) {
            const bankData = data[4].map((bank: any) => ({
                ...bank,
                userid: userId
            }));
            const { error: bankError } = await supabase
                .from('acc_portal_banks')
                .insert(bankData);
            if (bankError) throw bankError;
        }

        // Submit Employees
        console.log('Employee Data to submit:', data[5]);
        const employeeStatus = complianceStatus.find(s => s.name === "Employee")?.status || 'missing';
       if (data[5]?.length > 0) {
            const employeeData = data[5].map((employee: any) => ({
                ...employee,
                userid: userId
            }));
            const { error: employeeError } = await supabase
                .from('acc_portal_employees')
                .insert(employeeData);
            if (employeeError) throw employeeError;
        }

        console.log('All data submitted successfully');
        toast.success('All data submitted successfully!');
        onComplete(data);
        return true;

    } catch (error: any) {
        console.error('Error in submission process:', error);
        toast.error(`Failed to submit data: ${error.message}`);
        return false;
    } finally {
        setLoading(false);
    }
};

export const submitDirectorsData = async (userId: string, directorData: any[], status: string) => {
    if (!directorData?.length) return;

    console.log('Processing directors data for submission:', directorData);
    const sanitizedData = directorData.map(director => ({
        ...director,
        userid: userId,
        status: status,
        shares_held: parseInt(director.shares_held) || null,
        dependents: parseInt(director.dependents) || null,
        annual_income: parseFloat(director.annual_income) || null
    }));

    console.log('Submitting sanitized director data:', sanitizedData);
    const { error: directorError } = await supabase
        .from('acc_portal_directors')
        .insert(sanitizedData);

    if (directorError) throw directorError;
    console.log('Directors data submitted successfully');
};

export const submitStatutoryData = async (userId: string, name: string, data: any) => {
    console.log('Processing statutory data:', data);
    const statutoryPromises = [];

    complianceStatus.forEach(status => {
        if (status.status === 'has_details') {
            switch (status.name) {
                case 'KRA':
                    if (data.kra_pin) {
                        statutoryPromises.push(submitKRAData(userId, name, data));
                    }
                    break;
                case 'NSSF':
                    if (data.nssf_code) {
                        statutoryPromises.push(submitNSSFData(userId, name, data));
                    }
                    break;
                // Add other statutory submissions here
            }
        }
    });

    if (statutoryPromises.length > 0) {
        const results = await Promise.allSettled(statutoryPromises);
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            console.error('Some statutory submissions failed:', failed);
            throw new Error('Failed to submit some statutory data');
        }
    }
};

export const submitKRAData = (userId: string, name: string, data: any) =>
    supabase.from('PasswordChecker').insert({
        company_name: name,
        kra_pin: data.kra_pin,
        kra_password: data.kra_password,
        status: 'pending',
        userid: userId
    });

export const submitNSSFData = (userId: string, name: string, data: any) =>
    supabase.from('nssf_companies').insert({
        name: name,
        identifier: data.nssf_user,
        nssf_password: data.nssf_password,
        nssf_code: data.nssf_code,
        userid: userId
    });
    
    export const handleTemplateDownload = (currentStage: number, complianceStatus: any[], stages: any[], getFormFields: () => { fields: any[] }) => {
        const status = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status;
        const { fields } = getFormFields();
    
        if (currentStage === 1) {
            // Company Information template
            const headers = [['Fields', 'Details']];
            const rows = fields.map(field => [field.label, '']);
            const ws = XLSX.utils.aoa_to_sheet(headers.concat(rows));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, "Company_Information_Template.xlsx");
            return;
        }
    
        if (status !== 'has_details') {
            toast.error('Template is only available for items with details');
            return;
        }
    
        // For other stages (Directors, Suppliers, Banks, Employees)
        const count = complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.count || 1;
        const headers = [['Fields', ...Array(count).fill(0).map((_, i) => `${stages[currentStage - 1].name} ${i + 1}`)]];
        const rows = fields.map(field => [field.label, ...Array(count).fill('')]);
        
        const ws = XLSX.utils.aoa_to_sheet(headers.concat(rows));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${stages[currentStage - 1].name.replace(/\s+/g, '_')}_Template.xlsx`);
    };
    