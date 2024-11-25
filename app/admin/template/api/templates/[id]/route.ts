import { NextRequest, NextResponse } from 'next/server'

type Template = {
  id: string;
  name: string;
  templateUrl?: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    default?: any;
    fields?: Array<any>;
  }>;
  defaultValues: Record<string, any>;
}

type Templates = {
  [key: string]: Template;
}

const templates: Templates = {
  'bank-application': {
    id: 'bank-application',
    name: 'Bank Application Form',
    templateUrl: '/bank-application.docx',
    fields: [
      // Company Information
      { id: 'businessEntityName', label: 'Business Entity Name', type: 'text', required: true },
      { id: 'tradingName', label: 'Trading Name', type: 'text', required: true },
      { id: 'dateOfIncorporation', label: 'Date of Incorporation', type: 'date', required: true },
      { id: 'kraPin', label: 'KRA PIN', type: 'text', required: true },
      { id: 'registrationCertificateNumber', label: 'Registration Certificate Number', type: 'text', required: true },
      // Contact Details
      { id: 'primaryContactEmail', label: 'Primary Contact Email', type: 'email', required: true },
      { id: 'primaryContactMobile', label: 'Primary Contact Mobile', type: 'tel', required: true },
      // Account Details (Dialog Fields)
      { 
        id: 'accountDetails', 
        label: 'Account Details', 
        type: 'dialog',
        fields: [
          { id: 'typeOfBusiness', label: 'Type of Business', type: 'select', options: ['Limited Company'], default: 'Limited Company' },
          { id: 'preferredAccountType', label: 'Preferred Account Type', type: 'select', options: ['Business Current Account'], default: 'Business Current Account' },
          { id: 'foreignCurrency', label: 'Foreign Currency', type: 'select', options: ['USD'], default: 'USD' },
          { id: 'purposeOfAccount', label: 'Purpose of Account', type: 'select', options: ['Business Proceeds'], default: 'Business Proceeds' }
        ]
      },
      // Account Facilities (Dialog Fields)
      {
        id: 'accountFacilities',
        label: 'Account Facilities',
        type: 'dialog',
        fields: [
          { id: 'mobileInternetBanking', label: 'Mobile Internet Banking', type: 'checkbox', default: false },
          { id: 'chequeBook', label: 'Cheque Book', type: 'group', fields: [
            { id: 'enabled', label: 'Enable Cheque Book', type: 'checkbox', default: false },
            { id: 'preferredNameFormat', label: 'Preferred Name Format', type: 'text' }
          ]},
        ]
      }
    ],
    defaultValues: {
      businessEntityName: '',
      tradingName: '',
      dateOfIncorporation: '',
      kraPin: '',
      registrationCertificateNumber: '',
      primaryContactEmail: '',
      primaryContactMobile: '',
      accountDetails: {
        typeOfBusiness: 'Limited Company',
        preferredAccountType: 'Business Current Account',
        foreignCurrency: 'USD',
        purposeOfAccount: 'Business Proceeds'
      },
      accountFacilities: {
        mobileInternetBanking: false,
        chequeBook: {
          enabled: false,
          preferredNameFormat: ''
        }
      }
    }
  },
  'job-application': {
    id: 'job-application',
    name: 'Job Application Form',
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'phone', label: 'Phone', type: 'tel', required: true },
      { id: 'resume', label: 'Resume', type: 'file', required: true },
    ],
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      resume: null,
    },
  },
  'loan-application': {
    id: 'loan-application',
    name: 'Loan Application Form',
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'income', label: 'Annual Income', type: 'number', required: true },
      { id: 'loanAmount', label: 'Loan Amount', type: 'number', required: true },
    ],
    defaultValues: {
      fullName: '',
      email: '',
      income: '',
      loanAmount: '',
    },
  },
}

export type Params = { id: string }

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  const { id } = context.params
  const template = templates[id]

  if (!template) {
    return NextResponse.json(
      { error: 'Template not found' }, 
      { status: 404 }
    )
  }

  return NextResponse.json(template)
}