// utils.ts

import { formFields } from './formfields';

export interface CompanyData {
  company_name: string;
  [key: string]: any;
}

export interface TableData {
  [key: string]: any;
}

// Generic function to filter fields by category
export const filterFieldsByCategory = (category: string) => {
  return formFields.companyDetails.fields.filter(
    field => field.category === category
  );
};

// Helper function to get general company fields
export const getGeneralCompanyFields = () => {
  return formFields.companyDetails.fields.filter(
    field => !field.category || field.category === 'General Information'
  );
};

// Helper to format data for CompanyGeneralTable
export const mapCompanyGeneralData = (data: any[]) => {
  const generalFields = getGeneralCompanyFields();
  return data.map(group => {
    const companyData: { [key: string]: any } = {};
    generalFields.forEach(field => {
      companyData[field.name] = group.company[field.name] || null;
    });
    return companyData;
  });
};

// Helper for tax data
export const mapTaxData = (data: any[]) => {
  const taxFields = filterFieldsByCategory('KRA Details');
  return data.map(group => {
    const taxData: { [key: string]: any } = {};
    taxFields.forEach(field => {
      taxData[field.name] = group.company[field.name] || null;
    });
    return taxData;
  });
};

// Helper for NSSF data
export const mapNSSFData = (data: any[]) => {
  const nssfFields = filterFieldsByCategory('NSSF Details');
  return data.map(group => {
    const nssfData: { [key: string]: any } = {};
    nssfFields.forEach(field => {
      nssfData[field.name] = group.company[field.name] || null;
    });
    return nssfData;
  });
};

// Helper for NHIF data
export const mapNHIFData = (data: any[]) => {
  const nhifFields = filterFieldsByCategory('NHIF Details');
  return data.map(group => {
    const nhifData: { [key: string]: any } = {};
    nhifFields.forEach(field => {
      nhifData[field.name] = group.company[field.name] || null;
    });
    return nhifData;
  });
};

// Helper for E-Citizen data
export const mapECitizenData = (data: any[]) => {
  const ecitizenFields = filterFieldsByCategory('E-Citizen Details');
  return data.map(group => {
    const ecitizenData: { [key: string]: any } = {};
    ecitizenFields.forEach(field => {
      ecitizenData[field.name] = group.company[field.name] || null;
    });
    return ecitizenData;
  });
};

// Helper for Directors data
export const mapDirectorsData = (data: any[]) => {
  const directorFields = formFields.directorDetails.fields;
  return data.flatMap(group => 
    group.directors.map((director: any) => {
      const directorData: { [key: string]: any } = {};
      directorFields.forEach(field => {
        directorData[field.name] = director[field.name] || null;
      });
      return directorData;
    })
  );
};

// Helper for Banking data
export const mapBankingData = (data: any[]) => {
  const bankFields = formFields.bankDetails.fields;
  return data.flatMap(group => 
    group.banks.map((bank: any) => {
      const bankData: { [key: string]: any } = {};
      bankFields.forEach(field => {
        bankData[field.name] = bank[field.name] || null;
      });
      return bankData;
    })
  );
};

// Helper for Employees data
export const mapEmployeesData = (data: any[]) => {
  const employeeFields = formFields.employeeDetails.fields;
  return data.flatMap(group => 
    group.employees.map((employee: any) => {
      const employeeData: { [key: string]: any } = {};
      employeeFields.forEach(field => {
        employeeData[field.name] = employee[field.name] || null;
      });
      return employeeData;
    })
  );
};

// Helper for Tax Status data
export const mapTaxStatusData = (data: any[]) => {
  const taxStatusFields = filterFieldsByCategory('Tax Status');
  return data.map(group => {
    const taxStatusData: { [key: string]: any } = {};
    taxStatusFields.forEach(field => {
      taxStatusData[field.name] = group.company[field.name] || null;
    });
    return taxStatusData;
  });
};

// Helper for Sheria data
export const mapSheriaData = (data: any[]) => {
  const sheriaFields = filterFieldsByCategory('Sheria Details');
  return data.map(group => {
    const sheriaData: { [key: string]: any } = {};
    sheriaFields.forEach(field => {
      sheriaData[field.name] = group.company[field.name] || null;
    });
    return sheriaData;
  });
};

// Helper for Client Category data
export const mapClientCategoryData = (data: any[]) => {
  const clientFields = filterFieldsByCategory('Client Category');
  return data.map(group => {
    const clientData: { [key: string]: any } = {};
    clientFields.forEach(field => {
      clientData[field.name] = group.company[field.name] || null;
    });
    return clientData;
  });
};

// Format date values
export const formatDate = (date: string | null): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return date;
  }
};

// Format boolean values
export const formatBoolean = (value: boolean | null): string => {
  if (value === null) return '';
  return value ? 'Yes' : 'No';
};

// Helper to check if a field is empty
export const isEmptyField = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

// Helper to count missing fields
export const countMissingFields = (data: any, fields: any[]): number => {
  return fields.reduce((count, field) => {
    return count + (isEmptyField(data[field.name]) ? 1 : 0);
  }, 0);
};

// Helper to calculate completion percentage
export const calculateCompletionPercentage = (data: any, fields: any[]): number => {
  const totalFields = fields.length;
  const missingFields = countMissingFields(data, fields);
  return Math.round(((totalFields - missingFields) / totalFields) * 100);
};

// Helper to group data by category
export const groupDataByCategory = (fields: any[]) => {
  return fields.reduce((acc, field) => {
    const category = field.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {});
};