// utils.ts
// @ts-nocheck

import { formFields } from '../formfields';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import { toast } from "sonner";
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

export const handleFileImport = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
      let parsedData;
      if (file.name.endsWith('.csv')) {
          const text = await file.text();
          parsedData = Papa.parse(text, { header: true }).data;
      } else {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);
          const ws = wb.Sheets[wb.SheetNames[0]];
          parsedData = XLSX.utils.sheet_to_json(ws);
      }

      if (!parsedData || !parsedData.length) {
          throw new Error('No data found in the imported file');
      }

      console.log('Raw Parsed Data:', parsedData);
      const firstRow = parsedData[0];
      if (!firstRow) {
          throw new Error('No data rows found in the imported file');
      }

      const valueColumns = Object.keys(firstRow).filter(key =>
          key !== '#' &&
          key !== 'General' &&
          key !== '#_1' &&
          !key.includes('Section') &&
          !key.includes('Category')
      );

      if (!valueColumns.length) {
          throw new Error('No valid columns found in the imported file');
      }
      const companiesMap = new Map();

      valueColumns.forEach((colName) => {
          companiesMap.set(colName, {
              mainCompany: {
                  company_name: null,
                  company_type: null,
                  company_status: null,
                  description: null,
                  registration_number: null,
                  date_established: null,
                  industry: null,
                  employees: null,
                  annual_revenue: null,
                  fiscal_year: null,
                  website: null,
                  current_communication_email: null,
                  phone: null,
                  street: null,
                  city: null,
                  postal_address: null,
                  country: null,
                  status: '',
                  housing_levy_identifier: null,
                  housing_levy_password: null,
                  housing_levy_status: null,
                  standard_levy_identifier: null,
                  standard_levy_password: null,
                  standard_levy_status: null,
                  tourism_levy_identifier: null,
                  tourism_levy_password: null,
                  tourism_levy_status: null,
                  tourism_fund_username: null,
                  tourism_fund_password: null,
                  vat_identifier: null,
                  vat_password: null,
                  vat_status: null,
                  vat_from: null,
                  vat_to: null,
                  nature_of_business: null,
                  audit_period: null,
                  sale_terms: null,
                  tcc_expiry_date: null,
                  tcc_reminders_notice_days: null,
                  tcc_reminder_date: null,
                  good_conduct_issue_date: null,
                  co_cert_number: null,
                  co_registration_date: null,
                  co_nssf_number: null,
                  verified: null,
                  sheria_status: null,
                  published: null,
                  bo_status: null,
                  co_cr_12_issue_date: null,
                  cr_12_as_at_date_of_issue: null,
                  cr_12_reminders_notice_days: null,
                  cr_12_reminder_date: null,
                  wh_vat_agent_customers: null,
                  wh_vat_agent_suppliers: null,
                  account_manager: null,
                  name_verified_with_pin: null,
                  client_category: null,
                  nita_identifier: null,
                  nita_password: null,
                  nita_status: null,
              },

              nssfDetails: {
                  company_name: null,
                  nssf_identifier: null,
                  nssf_password: null,
                  nssf_status: 'Pending',
                  nssf_code: null,
                  nssf_compliance_certificate_date: null,
                  nssf_registration_date: null,
                  status: null
              },
              nhifDetails: {
                  company_name: null,
                  nhif_identifier: null,
                  nhif_password: null,
                  nhif_status: 'Pending',
                  nhif_code: null,
                  director: null,
                  nhif_mobile: null,
                  nhif_email: null,
                  nhif_email_password: null,
                  nhif_registration_date: null,
                  nhif_compliance_certificate_date: null,
              },
              pinDetails: {
                  company_name: null,
                  kra_pin: null,
                  kra_password: null,
                  pin_certification_profile_download_dates: null,
                  pin_status: null,
                  itax_status: null,
                  income_tax_company_status: null,
                  income_tax_company_from: null,
                  income_tax_company_to: null,
                  income_tax_rent_income_current_status: null,
                  income_tax_rent_income_effective_from: null,
                  income_tax_rent_income_effective_to: null,
                  income_tax_paye_current_status: null,
                  income_tax_paye_effective_from: null,
                  income_tax_paye_effective_to: null,
                  income_tax_turnover_tax_current_status: null,
                  income_tax_turnover_tax_effective_from: null,
                  income_tax_turnover_tax_effective_to: null,
                  annual_income: null,
                  tax_year_end: null,
                  current_itax_gmail_yahoo_email_recovery: null,
                  current_itax_password: null,
                  current_itax_gmail_email: null,
                  current_itax_system_gmail_password: null,
                  old_itax_system_gmail_password: null,
                  current_itax_gmail_email_recovery_email: null,
                  current_itax_gmail_email_recovery_mobile: null,
                  old_itax_email: null,
                  old_itax_password: null,
                  pin_station: null,
                  pin_station_manager_name: null,
                  pin_station_manager_mobile: null,
              },
              ecitizenDetails: {
                  name: null,
                  ecitizen_password: null,
                  ecitizen_status: 'Pending',
                  director: null,
                  ecitizen_id: null,
                  ecitizen_mobile: null,
                  ecitizen_email: null,
              },
              etimsDetails: {
                  company_name: null,
                  etims_username: null,
                  etims_cert_incorporation: null,
                  etims_pin: null,
                  etims_comment: null,
                  etims_director_pin: null,
                  etims_current_director_pin: null,
                  etims_operator_name: null,
                  etims_operator_id_number: null,
                  etims_password: null,
                  etims_mobile: null,
                  etims_email: null,
                  etims_reg_doc_number: null
              },
              accPortalDirectors: {
                  company_id: null,
                  first_name: null,
                  middle_name: null,
                  last_name: null,
                  other_names: null,
                  full_name: null,
                  gender: null,
                  place_of_birth: null,
                  country_of_birth: null,
                  nationality: null,
                  marital_status: null,
                  date_of_birth: null,
                  passport_number: null,
                  passport_place_of_issue: null,
                  passport_issue_date: null,
                  passport_expiry_date: null,
                  passport_file_number: null,
                  id_number: null,
                  alien_number: null,
                  tax_pin: null,
                  eye_color: null,
                  hair_color: null,
                  height: null,
                  special_marks: null,
                  mobile_number: null,
                  email_address: null,
                  alternative_email: null,
                  building_name: null,
                  floor_number: null,
                  block_number: null,
                  road_name: null,
                  area_name: null,
                  town: null,
                  country: null,
                  full_residential_address: null,
                  residential_county: null,
                  sub_county: null,
                  postal_address: null,
                  postal_code: null,
                  postal_town: null,
                  full_postal_address: null,
                  university_name: null,
                  course_name: null,
                  course_start_date: null,
                  course_end_date: null,
                  job_position: null,
                  job_description: null,
                  shares_held: null,
                  other_directorships: null,
                  dependents: null,
                  annual_income: null,
                  languages_spoken: null,
                  occupation: null,
                  education_level: null,
                  criminal_record: null,
                  bankruptcy_history: null,
                  professional_memberships: null,
                  userid: null,
                  status: ''
              }
          });
      });

      parsedData.forEach(row => {
          const fieldName = row["#_1"];
          if (!fieldName) return;

          valueColumns.forEach(colName => {
              const companyData = companiesMap.get(colName);
              const value = row[colName];

              if (companyData && value) {
                  // Main Company Details
                  switch (fieldName) {
                      case "Company Name":
                          companyData.mainCompany.company_name = value;
                          companyData.nssfDetails.company_name = value;
                          companyData.nhifDetails.company_name = value;
                          companyData.pinDetails.company_name = value;
                          companyData.ecitizenDetails.name = value;
                          companyData.etimsDetails.company_name = value;
                          break;
                      case "Company Type":
                          companyData.mainCompany.company_type = value;
                          break;
                      case "Company Status":
                          companyData.mainCompany.company_status = value;
                          break;
                      case "Description":
                          companyData.mainCompany.description = value;
                          break;
                      case "Registration Number":
                          companyData.mainCompany.registration_number = value;
                          break;
                      case "Date Established":
                          companyData.mainCompany.date_established = value;
                          break;

                      case "Industry":
                          companyData.mainCompany.industry = value;
                          break;
                      case "Employees":
                          companyData.mainCompany.employees = value;
                          break;
                      case "Annual Revenue":
                          companyData.mainCompany.annual_revenue = value;
                          break;
                      case "Fiscal Year":
                          companyData.mainCompany.fiscal_year = value;
                          break;
                      case "Website":
                          companyData.mainCompany.website = value;
                          break;
                      case "Current Communication Email":
                          companyData.mainCompany.current_communication_email = value;
                          break;
                      case "Phone":
                          companyData.mainCompany.phone = value;
                          break;
                      case "Street":
                          companyData.mainCompany.street = value;
                          break;
                      case "City":
                          companyData.mainCompany.city = value;
                          break;
                      case "Postal Address":
                          companyData.mainCompany.postal_address= value;
                          break;
                      case "Country":
                          companyData.mainCompany.country = value;
                          break;
                      case "Housing Levy Identifier":
                          companyData.mainCompany.housing_levy_identifier = value;
                          break;
                      case "Housing Levy Password":
                          companyData.mainCompany.housing_levy_password = value;
                          break;
                      case "Housing Levy Status":
                          companyData.mainCompany.housing_levy_status = value;
                          break;
                      case "Standard Levy Identifier":
                          companyData.mainCompany.standard_levy_identifier = value;
                          break;
                      case "Standard Levy Password":
                          companyData.mainCompany.standard_levy_password = value;
                          break;
                      case "Standard Levy Status":
                          companyData.mainCompany.standard_levy_status = value;
                          break;
                      case "Tourism Levy Identifier":
                          companyData.mainCompany.tourism_levy_identifier = value;
                          break;
                      case "Tourism Levy Password":
                          companyData.mainCompany.tourism_levy_password = value;
                          break;
                      case "Tourism Levy Status":
                          companyData.mainCompany.tourism_levy_status = value;
                          break;
                      case "Tourism Fund Username":
                          companyData.mainCompany.tourism_fund_username = value;
                          break;
                      case "Tourism Fund Password":
                          companyData.mainCompany.tourism_fund_password = value;
                          break;
                      case "NITA Identifier":
                          companyData.mainCompany.nita_identifier = value;
                          break;
                      case "NITA Password":
                          companyData.mainCompany.nita_password = value;
                          break;
                      case "NITA Status":
                          companyData.mainCompany.nita_status = value;
                          break;
                      case "VAT Identifier":
                          companyData.mainCompany.vat_identifier = value;
                          break;
                      case "VAT Password":
                          companyData.mainCompany.vat_password = value;
                          break;
                      case "VAT Status":
                          companyData.mainCompany.vat_status = value;
                          break;
                      case "VAT From":
                          companyData.mainCompany.vat_from = value;
                          break;
                      case "VAT To":
                          companyData.mainCompany.vat_to = value;
                          break;
                      case "NEA Username":
                          companyData.mainCompany.nea_username = value;
                          break;
                      case "NEA Password":
                          companyData.mainCompany.nea_password = value;
                          break;
                      case "Nature of Business":
                          companyData.mainCompany.nature_of_business = value;
                          break;
                      case "Audit Period":
                          companyData.mainCompany.audit_period = value;
                          break;
                      case "Sale Terms":
                          companyData.mainCompany.sale_terms = value;
                          break;
                      case "Source of Income Business 1 (Primary)":
                          companyData.mainCompany.source_of_income_business_1 = value;
                          break;
                      case "Source of Income Business 2 (Secondary)":
                          companyData.mainCompany.source_of_income_business_2 = value;
                          break;
                      case "Source of Income Employment 1 (Primary)":
                          companyData.mainCompany.source_of_income_employment_1 = value;
                          break;
                      case "Source of Income Employment 2 (Secondary)":
                          companyData.mainCompany.source_of_income_employment_2 = value;
                          break;
                      case "Source of Income Rental Income (MRI)":
                          companyData.mainCompany.source_of_income_rental = value;
                          break;
                      case "Source of Income Bank FD + Other Interest Income + Dividends + Commission":
                          companyData.mainCompany.source_of_income_interest_dividends = value;
                          break;
                      case "TCC Expiry Date":
                          companyData.mainCompany.tcc_expiry_date = value;
                          break;
                      case "TCC Reminders Notice Days":
                          companyData.mainCompany.tcc_reminders_notice_days = value;
                          break;
                      case "TCC Reminder Date":
                          companyData.mainCompany.tcc_reminder_date = value;
                          break;
                      case "Good Conduct Issue Date":
                          companyData.mainCompany.good_conduct_issue_date = value;
                          break;
                      case "CO Certificate Number":
                          companyData.mainCompany.co_cert_number = value;
                          break;
                      case "CO Registration Date":
                          companyData.mainCompany.co_registration_date = value;
                          break;
                      case "CO NSSF Number":
                          companyData.mainCompany.co_nssf_number = value;
                          break;
                          case "Verified":
                              companyData.mainCompany.verified = value;
                              break;       case "Pubilished":
                              companyData.mainCompany.published = value;
                              break;       case "Status":
                              companyData.mainCompany.sheria_status = value;
                              break;
                      case "BO Status":
                          companyData.mainCompany.bo_status = value;
                          break;
                      case "CO CR 12 Issue Date":
                          companyData.mainCompany.co_cr_12_issue_date = value;
                          break;
                      case "CR 12 as at Date Of Issue":
                          companyData.mainCompany.cr_12_as_at_date_of_issue = value;
                          break;
                      case "CR 12 Reminders Notice Days":
                          companyData.mainCompany.cr_12_reminders_notice_days = value;
                          break;
                      case "CR 12 Reminder Date":
                          companyData.mainCompany.cr_12_reminder_date = value;
                          break;
                      case "Account Manager":
                          companyData.mainCompany.account_manager = value;
                          break;
                      case "Name Verified with PIN":
                          companyData.mainCompany.name_verified_with_pin = value;
                          break;
                      case "Client Category":
                          companyData.mainCompany.client_category = value;
                          break;
                      case "W/H VAT Agent Suppliers":
                          companyData.mainCompany.wh_vat_agent_suppliers = value;
                          break;
                      case "W/H VAT Agent Customers":
                          companyData.mainCompany.wh_vat_agent_customers = value;
                          break;



                      // NSSF Details
                      case "NSSF Code":
                          companyData.nssfDetails.nssf_code = value;
                          break;
                      case "NSSF Identifier":
                          companyData.nssfDetails.nssf_identifier = value;
                          break;
                      case "NSSF Password":
                          companyData.nssfDetails.nssf_password = value;
                          break;
                      case "NSSF Status":
                          companyData.nssfDetails.nssf_status = value;
                          break;
                      case "NSSF Registration Date":
                          companyData.nssfDetails.nssf_registration_date = value;
                          break;
                      case "NSSF Compliance Certificate Date":
                          companyData.nssfDetails.nssf_compliance_certificate_date = value;
                          break;

                      // NHIF Details
                      case "NHIF Code":
                          companyData.nhifDetails.nhif_code = value;
                          break;
                      case "NHIF Identifier":
                          companyData.nhifDetails.nhif_identifier = value;
                          break;
                      case "NHIF Password":
                          companyData.nhifDetails.nhif_password = value;
                          break;
                      case "NHIF Mobile":
                          companyData.nhifDetails.nhif_mobile = value;
                          break;
                      case "NHIF Email":
                          companyData.nhifDetails.nhif_email = value;
                          break;
                      case "NHIF Registration Date":
                          companyData.nhifDetails.nhif_registration_date = value;
                          break;
                      case "NHIF Email Password":
                          companyData.nhifDetails.nhif_email_password = value;
                          break;
                      case "NHIF Status":
                          companyData.nhifDetails.nhif_status = value;
                          break;
                      case "NHIF Compliance Certificate Date":
                          companyData.nhifDetails.nhif_compliance_certificate_date = value;
                          break;

                      // Password Checker Details
                      case "KRA PIN":
                          companyData.pinDetails.kra_pin = value;
                          break;
                      case "Company Name":
                          companyData.pinDetails.company_name = value;
                          break;
                      case "KRA Password":
                          companyData.pinDetails.kra_password = value;
                          break;
                      case "PIN Status":
                          companyData.pinDetails.pin_status = value;
                          break;
                      case "PIN Certification Profile Download Dates":
                          companyData.pinDetails.pin_certification_profile_download_dates = value;
                          break;
                      case "iTax Status":
                          companyData.pinDetails.itax_status = value;
                          break;
                      case "Income Tax Company Status":
                          companyData.pinDetails.income_tax_company_status = value;
                          break;
                      case "Income Tax Company From":
                          companyData.pinDetails.income_tax_company_from = value;
                          break;
                      case "Income Tax Company To":
                          companyData.pinDetails.income_tax_company_to = value;
                          break;
                      case "Income Tax Rent Income Current Status":
                          companyData.pinDetails.income_tax_rent_income_current_status = value;
                          break;
                      case "Income Tax Rent Income Effective From":
                          companyData.pinDetails.income_tax_rent_income_effective_from = value;
                          break;
                      case "Income Tax Rent Income Effective To":
                          companyData.pinDetails.income_tax_rent_income_effective_to = value;
                          break;
                      case "Income Tax PAYE Current Status":
                          companyData.pinDetails.income_tax_paye_current_status = value;
                          break;
                      case "Income Tax PAYE Effective From":
                          companyData.pinDetails.income_tax_paye_effective_from = value;
                          break;
                      case "Income Tax PAYE Effective To":
                          companyData.pinDetails.income_tax_paye_effective_to = value;
                          break;
                      case "Income Tax Turnover Tax Current Status":
                          companyData.pinDetails.income_tax_turnover_tax_current_status = value;
                          break;
                      case "Income Tax Turnover Tax Effective From":
                          companyData.pinDetails.income_tax_turnover_tax_effective_from = value;
                          break;
                      case "Income Tax Turnover Tax Effective To":
                          companyData.pinDetails.income_tax_turnover_tax_effective_to = value;
                          break;
                      case "Annual Income":
                          companyData.pinDetails.annual_income = value;
                          break;
                      case "Tax Year End":
                          companyData.pinDetails.tax_year_end = value;
                          break;
                      case "Current iTax Gmail Yahoo Email Recovery Email":
                          companyData.pinDetails.current_itax_gmail_yahoo_email_recovery = value;
                          break;
                          case "Current iTax Password":
                              companyData.pinDetails.current_itax_password = value;
                              break;  
                              case "Old iTax Email":
                                  companyData.pinDetails.old_itax_email = value;
                                  break;
                                  case "Old iTax Email Password":
                                      companyData.pinDetails.old_itax_password = value;
                                      break;
                      case "Current iTax Gmail Email Address":
                          companyData.pinDetails.current_itax_gmail_email = value;
                          break;
                          case "Current iTax System Gmail Email Password":
                              companyData.pinDetails.current_itax_system_gmail_password = value;
                              break;
                              case "Old iTax System Gmail Email Password":
                          companyData.pinDetails.old_itax_system_gmail_password = value;
                          break;
                      case "Current iTax Gmail Email Recovery Mobile":
                          companyData.pinDetails.current_itax_gmail_email_recovery_email = value;
                          break;
                          case "Current iTax Gmail Email Recovery Mobile":
                              companyData.pinDetails.current_itax_gmail_email_recovery_mobile = value;
                              break;
                      case "PIN Station":
                          companyData.pinDetails.pin_station = value;
                          break;
                      case "PIN Station Manager Name":
                          companyData.pinDetails.pin_station_manager_name = value;
                          break;
                      case "PIN Station Manager Mobile":
                          companyData.pinDetails.pin_station_manager_mobile = value;
                          break;


                      // ECitizen Details
                      case "ECitizen ID":
                          companyData.ecitizenDetails.ecitizen_id = value;
                          break;
                      case "ECitizen Email":
                          companyData.ecitizenDetails.ecitizen_email = value;
                          break;
                      case "ECitizen Mobile":
                          companyData.ecitizenDetails.ecitizen_mobile = value;
                          break;
                      case "ECitizen Password":
                          companyData.ecitizenDetails.ecitizen_password = value;
                          break;
                      case "ECitizen Status":
                          companyData.ecitizenDetails.ecitizen_status = value;
                          break;

                      // TIMS Details
                      case "ETIMS Username":
                          companyData.etimsDetails.etims_username = value;
                          break;
                      case "ETIMS Certificate of Incorporation":
                          companyData.etimsDetails.etims_cert_incorporation = value;
                          break;
                      case "ETIMS PIN Number":
                          companyData.etimsDetails.etims_pin = value;
                          break;
                      case "ETIMS Comment":
                          companyData.etimsDetails.etims_comment = value;
                          break;
                      case "ETIMS Director PIN in System":
                          companyData.etimsDetails.etims_director_pin = value;
                          break;
                      case "ETIMS Current Director PIN":
                          companyData.etimsDetails.etims_current_director_pin = value;
                          break;
                      case "ETIMS Operator Name ":
                          companyData.etimsDetails.etims_operator_name = value;
                          break;
                      case "ETIMS Operator ID Number":
                          companyData.etimsDetails.etims_operator_id_number = value;
                          break;
                      case "ETIMS Password":
                          companyData.etimsDetails.etims_password = value;
                          break;
                      case "ETIMS Mobile Number":
                          companyData.etimsDetails.etims_mobile = value;
                          break;
                      case "ETIMS Email Address":
                          companyData.etimsDetails.etims_email = value;
                          break;
                      case "Registration Document Number":
                          companyData.etimsDetails.etims_reg_doc_number = value;
                          break;

                      // Acc Portal Directors
                      case "First Name":
                          companyData.accPortalDirectors.first_name = value;
                          break;
                      case "Last Name":
                          companyData.accPortalDirectors.last_name = value;
                          break;
                      case "Middle Name":
                          companyData.accPortalDirectors.middle_name = value;
                          break;
                      case "Other Names":
                          companyData.accPortalDirectors.other_names = value;
                          break;
                      case "Gender":
                          companyData.accPortalDirectors.gender = value;
                          break;
                      case "Date of Birth":
                          companyData.accPortalDirectors.date_of_birth = value;
                          break;
                      case "ID Number":
                          companyData.accPortalDirectors.id_number = value;
                          break;
                      case "Tax PIN":
                          companyData.accPortalDirectors.tax_pin = value;
                          break;
                      case "Mobile Number":
                          companyData.accPortalDirectors.mobile_number = value;
                          break;
                      case "Email Address":
                          companyData.accPortalDirectors.email_address = value;
                          break;
                      case "Alternative Email":
                          companyData.accPortalDirectors.alternative_email = value;
                          break;
                      case "Building Name":
                          companyData.accPortalDirectors.building_name = value;
                          break;
                      case "Floor Number":
                          companyData.accPortalDirectors.floor_number = value;
                          break;
                      case "Block Number":
                          companyData.accPortalDirectors.block_number = value;
                          break;
                      case "Road Name":
                          companyData.accPortalDirectors.road_name = value;
                          break;
                      case "Area Name":
                          companyData.accPortalDirectors.area_name = value;
                          break;
                      case "Town":
                          companyData.accPortalDirectors.town = value;
                          break;
                      case "Country":
                          companyData.accPortalDirectors.country = value;
                          break;
                      case "Full Residential Address":
                          companyData.accPortalDirectors.full_residential_address = value;
                          break;
                      case "Residential County":
                          companyData.accPortalDirectors.residential_county = value;
                          break;
                      case "Sub County":
                          companyData.accPortalDirectors.sub_county = value;
                          break;
                      case "Postal Address":
                          companyData.accPortalDirectors.postal_address = value;
                          break;
                      case "Postal Code":
                          companyData.accPortalDirectors.postal_code = value;
                          break;
                      case "Postal Town":
                          companyData.accPortalDirectors.postal_town = value;
                          break;
                      case "Full Postal Address":
                          companyData.accPortalDirectors.full_postal_address = value;
                          break;
                      case "University Name":
                          companyData.accPortalDirectors.university_name = value;
                          break;
                      case "Course Name":
                          companyData.accPortalDirectors.course_name = value;
                          break;
                      case "Course Start Date":
                          companyData.accPortalDirectors.course_start_date = value;
                          break;
                      case "Course End Date":
                          companyData.accPortalDirectors.course_end_date = value;
                          break;
                      case "Job Position":
                          companyData.accPortalDirectors.job_position = value;
                          break;
                      case "Job Description":
                          companyData.accPortalDirectors.job_description = value;
                          break;
                      case "Shares Held":
                          companyData.accPortalDirectors.shares_held = value;
                          break;
                      case "Other Directorships":
                          companyData.accPortalDirectors.other_directorships = value;
                          break;
                      case "Dependents":
                          companyData.accPortalDirectors.dependents = value;
                          break;
                      case "Annual Income":
                          companyData.accPortalDirectors.annual_income = value;
                          break;
                      case "Languages Spoken":
                          companyData.accPortalDirectors.languages_spoken = value;
                          break;
                      case "Occupation":
                          companyData.accPortalDirectors.occupation = value;
                          break;
                      case "Education Level":
                          companyData.accPortalDirectors.education_level = value;
                          break;
                      case "Criminal Record":
                          companyData.accPortalDirectors.criminal_record = value;
                          break;
                      case "Bankruptcy History":
                          companyData.accPortalDirectors.bankruptcy_history = value;
                          break;
                      case "Professional Memberships":
                          companyData.accPortalDirectors.professional_memberships = value;
                          break;
                      case "User ID":
                          companyData.accPortalDirectors.userid = value;
                          break;
                      case "Status":
                          companyData.accPortalDirectors.status = value;
                          break;
                  }
              }
          });
      });

      const transformedData = Array.from(companiesMap.values())
          .filter(data => data.mainCompany.company_name);

      console.log('Transformed Data:', transformedData);

      for (const data of transformedData) {
          if (!data.mainCompany?.registration_number) {
              console.warn('Skipping record with missing registration number:', data);
              continue;
          }

          try {
              // Upsert main company data using registration_number as unique key
              const { data: companyData, error: companyError } = await supabase
                  .from('acc_portal_company_duplicate')
                  .upsert([data.mainCompany], { onConflict: ['registration_number'] });


              if (companyError) {
                  console.error('Error upserting company:', companyError);
                  continue;
              }

              const upsertPromises = [];

              if (data.nssfDetails) {
                  upsertPromises.push(supabase
                      .from('nssf_companies_duplicate')
                      .upsert([data.nssfDetails], {
                          onConflict: 'nssf_code',
                          ignoreDuplicates: false
                      }));
              }

              if (data.nhifDetails) {
                  upsertPromises.push(supabase
                      .from('nhif_companies_duplicate2')
                      .upsert([data.nhifDetails], {
                          onConflict: 'nhif_code',
                          ignoreDuplicates: false
                      }));
              }

              if (data.pinDetails) {
                  upsertPromises.push(supabase
                      .from('PasswordChecker_duplicate')
                      .upsert([data.pinDetails], {
                          onConflict: ['kra_pin'],
                          ignoreDuplicates: false
                      }));
              }

              if (data.ecitizenDetails) {
                  upsertPromises.push(supabase
                      .from('ecitizen_companies_duplicate')
                      .upsert([data.ecitizenDetails], {
                          onConflict: 'ecitizen_identifier',
                          ignoreDuplicates: false
                      }));
              }

              if (data.etimsDetails) {
                  upsertPromises.push(supabase
                      .from('etims_companies_duplicate')
                      .upsert([data.etimsDetails], {
                          onConflict: 'etims_pin',
                          ignoreDuplicates: false
                      }));
              }

              if (data.accPortalDirectors) {
                  upsertPromises.push(supabase
                      .from('acc_portal_directors_duplicate')
                      .upsert([data.accPortalDirectors], {
                          onConflict: 'company_name',
                          ignoreDuplicates: false
                      }));
              }

              if (data.incomeTaxDetails) {
                  upsertPromises.push(supabase
                      .from('income_tax')
                      .upsert([data.incomeTaxDetails], {
                          onConflict: 'company_name',
                          ignoreDuplicates: false
                      }));
              }

              try {
                  await Promise.all(upsertPromises);
              } catch (tableError) {
                  console.error('Error updating related tables:', tableError);
              }
          } catch (companyError) {
              console.error('Error processing company:', companyError);
          }
      }
      toast.success(`Successfully updated ${transformedData.length} companies`);
      fetchAllData();

  } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
  }
};

export const handleExport = (data) => {
    const exportRows = [];
    // Process data in the desired structure, with section/category labels only on first occurrence
    processedSections.forEach(section => {
        if (!section.isSeparator) {
            let currentSection = section.label;

            section.categorizedFields?.forEach(category => {
                if (!category.isSeparator) {
                    let currentCategory = category.category;

                    category.fields.forEach((field, fieldIndex) => {
                        const row = [
                            fieldIndex === 0 ? currentSection : '',  // Show section only for first field
                            fieldIndex === 0 ? currentCategory : '', // Show category only for first field
                            field.label,
                            ...data.map(item => item.company[field.name] || '')
                        ];
                        exportRows.push(row);
                    });
                }
            });
        }
    });

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(exportRows);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 },  // Section
        { wch: 20 },  // Category
        { wch: 25 },  // Field
        { wch: 30 },  // Value
        { wch: 30 },  // Value 2
        { wch: 30 }   // Value 3
    ];

    // Initialize styles for all cells and set background colors
    for (let rowIndex = 0; rowIndex < exportRows.length; rowIndex++) {
        for (let colIndex = 0; colIndex < 6; colIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            ws[cellAddress] = ws[cellAddress] || { v: '', t: 's' };
            ws[cellAddress].s = {};
        }
    }

    // Define colors for different sections and categories
    const sectionColors = {
        'Basic Information': 'FFE6E6',  // Light Red
        'Financial Details': 'E6FFE6',  // Light Green
        'Contact Information': 'E6E6FF', // Light Blue
        'Operations': 'FFFFE6',         // Light Yellow
        'Compliance': 'FFE6FF',         // Light Purple
        'Other': 'E6FFFF'              // Light Cyan
    };

    const categoryColors = {
        'General': 'F0F0F0',           // Light Gray
        'Financial': 'E6FFE6',         // Light Green
        'Contact': 'E6E6FF',           // Light Blue
        'Address': 'FFE6E6',           // Light Red
        'Legal': 'FFE6FF'              // Light Purple
    };

    // Apply colors to header row
    const headerRow = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: exportRows[0].length - 1 } });
    Object.keys(ws).forEach(cell => {
        if (headerRow.includes(cell)) {
            ws[cell].s = {
                fill: { fgColor: { rgb: 'CCCCCC' }, patternType: 'solid' },
                font: { bold: true }
            };
        }
    });

    // Apply colors to data rows based on section and category
    let lastSection = '';
    let lastCategory = '';

    for (let rowIndex = 1; rowIndex < exportRows.length; rowIndex++) {
        const section = exportRows[rowIndex][0] || lastSection;
        const category = exportRows[rowIndex][1] || lastCategory;

        lastSection = section;
        lastCategory = category;

        const sectionColor = sectionColors[section] || 'FFFFFF';
        const categoryColor = categoryColors[category] || 'FFFFFF';

        // Apply section color to section column
        const sectionCell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        ws[sectionCell].s = {
            fill: { fgColor: { rgb: sectionColor }, patternType: 'solid' }
        };

        // Apply category color to category column
        const categoryCell = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
        ws[categoryCell].s = {
            fill: { fgColor: { rgb: categoryColor }, patternType: 'solid' }
        };

        // Apply lighter version of section color to remaining cells
        for (let colIndex = 2; colIndex < exportRows[rowIndex].length; colIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            ws[cellAddress].s = {
                fill: { fgColor: { rgb: sectionColor + '80' }, patternType: 'solid' }
            };
        }
    }

    // Create and save the workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "Companies_Report.xlsx");
};

export const calculateFieldStats = (fieldName: string, data: any[]) => {
    let total = 0;
    let completed = 0;
  
    data.forEach(group => {
      if (group.rows && group.rows[0] && fieldName in group.rows[0]) {
        total++;
        const value = group.rows[0][fieldName];
        if (value !== null && value !== undefined && value !== '') {
          completed++;
        }
      }
    });
  
    return {
      total: total.toString(), // Convert to string to ensure we're not returning an object
      completed: completed.toString(),
      pending: (total - completed).toString()
    };
  };
  
export const groupFieldsByCategory = (fields) => {
  // First group fields by their categories
  const categorizedFields = fields.reduce((acc, field) => {
      const category = field.category || 'General';
      if (!acc[category]) {
          acc[category] = [];
      }
      acc[category].push(field);
      return acc;
  }, {});

  // Convert to array format with separators
  const result = Object.entries(categorizedFields).flatMap(([category, fields], index, array) => {
      // Add category with its fields
      const categoryGroup = {
          category,
          fields,
          colSpan: fields.length
      };

      // Add separator if not the last category
      if (index < array.length - 1) {
          return [categoryGroup, { isSeparator: true }];
      }
      return [categoryGroup];
  });

  return result;
};

export const calculateTotalFields = (section) => {
    return section.categorizedFields?.reduce((total, category) => {
        if (category.isSeparator) return total;
        return total + category.fields.length;
    }, 0) || 0;
};

export const calculateCompletedFields = (section, data) => {
  let completed = 0;
  section.categorizedFields?.forEach(category => {
      if (!category.isSeparator) {
          category.fields.forEach(field => {
              if (data.some(item => item[field.name])) {
                  completed++;
              }
          });
      }
  });
  return completed;
};

export const calculatePendingFields = (section, data) => {
  const total = calculateTotalFields(section);
  const completed = calculateCompletedFields(section, data);
  return total - completed;
};

export const getMissingFields = (row: any, processedSections: any[]) => {
    const missingFields = [];
    
    processedSections.forEach(section => {
      if (!section.isSeparator && section.categorizedFields) {
        section.categorizedFields.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              const [tableName, columnName] = field.name.split('.');
              let value;
              
              if (row.isAdditionalRow && row.sourceTable === tableName) {
                value = row[columnName];
              } else if (row[`${tableName}_data`]) {
                value = row[`${tableName}_data`][columnName];
              } else {
                value = row[columnName];
              }
              
              if (value === null || value === '' || value === undefined) {
                missingFields.push({
                  ...field,
                  value: value
                });
              }
            });
          }
        });
      }
    });
    
    return missingFields;
  };