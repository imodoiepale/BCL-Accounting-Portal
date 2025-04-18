export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acc_cycle_bank_statements: {
        Row: {
          bank_id: number | null
          company_id: number | null
          created_at: string | null
          has_hard_copy: boolean | null
          has_soft_copy: boolean | null
          id: string
          quickbooks_balance: number | null
          statement_cycle_id: string | null
          statement_document: Json | null
          statement_extractions: Json | null
          statement_month: number | null
          statement_year: number | null
          status: Json | null
          updated_at: string | null
          validation_status: Json | null
        }
        Insert: {
          bank_id?: number | null
          company_id?: number | null
          created_at?: string | null
          has_hard_copy?: boolean | null
          has_soft_copy?: boolean | null
          id?: string
          quickbooks_balance?: number | null
          statement_cycle_id?: string | null
          statement_document?: Json | null
          statement_extractions?: Json | null
          statement_month?: number | null
          statement_year?: number | null
          status?: Json | null
          updated_at?: string | null
          validation_status?: Json | null
        }
        Update: {
          bank_id?: number | null
          company_id?: number | null
          created_at?: string | null
          has_hard_copy?: boolean | null
          has_soft_copy?: boolean | null
          id?: string
          quickbooks_balance?: number | null
          statement_cycle_id?: string | null
          statement_document?: Json | null
          statement_extractions?: Json | null
          statement_month?: number | null
          statement_year?: number | null
          status?: Json | null
          updated_at?: string | null
          validation_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_cycle_bank_statements_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_cycle_bank_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_cycle_bank_statements_statement_cycle_id_fkey"
            columns: ["statement_cycle_id"]
            isOneToOne: false
            referencedRelation: "statement_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_cycle_supplier_statements: {
        Row: {
          company_id: number | null
          created_at: string | null
          has_hard_copy: boolean | null
          has_soft_copy: boolean | null
          id: string
          payroll_cycle_id: string | null
          quickbooks_balance: number | null
          statement_document: Json | null
          statement_extractions: Json | null
          statement_month: number | null
          statement_year: number | null
          status: Json | null
          supplier_id: number | null
          updated_at: string | null
          validation_status: Json | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          has_hard_copy?: boolean | null
          has_soft_copy?: boolean | null
          id?: string
          payroll_cycle_id?: string | null
          quickbooks_balance?: number | null
          statement_document?: Json | null
          statement_extractions?: Json | null
          statement_month?: number | null
          statement_year?: number | null
          status?: Json | null
          supplier_id?: number | null
          updated_at?: string | null
          validation_status?: Json | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          has_hard_copy?: boolean | null
          has_soft_copy?: boolean | null
          id?: string
          payroll_cycle_id?: string | null
          quickbooks_balance?: number | null
          statement_document?: Json | null
          statement_extractions?: Json | null
          statement_month?: number | null
          statement_year?: number | null
          status?: Json | null
          supplier_id?: number | null
          updated_at?: string | null
          validation_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_cycle_supplier_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_cycle_supplier_statements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_suppliers_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_bank_document_upload_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: number
          new_balance: number | null
          new_verification_status: string | null
          previous_balance: number | null
          previous_verification_status: string | null
          upload_id: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: never
          new_balance?: number | null
          new_verification_status?: string | null
          previous_balance?: number | null
          previous_verification_status?: string | null
          upload_id: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: never
          new_balance?: number | null
          new_verification_status?: string | null
          previous_balance?: number | null
          previous_verification_status?: string | null
          upload_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_bank_document_upload_history_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_bank_document_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_bank_document_uploads: {
        Row: {
          account_id: number
          balance: number
          company_id: number | null
          created_at: string
          document_path: string | null
          id: number
          updated_at: string
          uploaded_at: string
          verification_status: string
          wef: string
          wit: string
        }
        Insert: {
          account_id: number
          balance: number
          company_id?: number | null
          created_at?: string
          document_path?: string | null
          id?: never
          updated_at?: string
          uploaded_at?: string
          verification_status: string
          wef: string
          wit: string
        }
        Update: {
          account_id?: number
          balance?: number
          company_id?: number | null
          created_at?: string
          document_path?: string | null
          id?: never
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
          wef?: string
          wit?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_bank_document_uploads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_portal_bank_document_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      acc_portal_banks: {
        Row: {
          acc_password: string | null
          account_number: string | null
          account_type: string | null
          bank_currency: string | null
          bank_name: string | null
          bank_prefix: string | null
          bank_verified: string | null
          branch: string | null
          client_email_with_bank: string | null
          company_id: number | null
          company_name: string | null
          created_at: string | null
          id: number
          individual_full_name: string | null
          prefix_account_no: string | null
          rm_manager_name: string | null
          rm_manager_office_email: string | null
          rm_manager_office_number: string | null
          rm_manager_personal_number: string | null
          status: string | null
          to_take_action: string | null
          type: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          verified: string | null
        }
        Insert: {
          acc_password?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_currency?: string | null
          bank_name?: string | null
          bank_prefix?: string | null
          bank_verified?: string | null
          branch?: string | null
          client_email_with_bank?: string | null
          company_id?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: number
          individual_full_name?: string | null
          prefix_account_no?: string | null
          rm_manager_name?: string | null
          rm_manager_office_email?: string | null
          rm_manager_office_number?: string | null
          rm_manager_personal_number?: string | null
          status?: string | null
          to_take_action?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verified?: string | null
        }
        Update: {
          acc_password?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_currency?: string | null
          bank_name?: string | null
          bank_prefix?: string | null
          bank_verified?: string | null
          branch?: string | null
          client_email_with_bank?: string | null
          company_id?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: number
          individual_full_name?: string | null
          prefix_account_no?: string | null
          rm_manager_name?: string | null
          rm_manager_office_email?: string | null
          rm_manager_office_number?: string | null
          rm_manager_personal_number?: string | null
          status?: string | null
          to_take_action?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verified?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_banks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_clerk_users: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          updated_at: string | null
          userid: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          updated_at?: string | null
          userid: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          updated_at?: string | null
          userid?: string
          username?: string
        }
        Relationships: []
      }
      acc_portal_clerk_users_duplicate: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          last_synced_at: string | null
          password: string | null
          updated_at: string | null
          userid: string
          username: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_synced_at?: string | null
          password?: string | null
          updated_at?: string | null
          userid: string
          username: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_synced_at?: string | null
          password?: string | null
          updated_at?: string | null
          userid?: string
          username?: string
        }
        Relationships: []
      }
      acc_portal_company: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          account_manager: string | null
          annual_revenue: string | null
          audit_client_effective_from: string | null
          audit_client_effective_to: string | null
          audit_period: string | null
          backlog_posted_date: string | null
          bcl_back_log: string | null
          bcl_takeover_date: string | null
          bo_status: string | null
          books_prepared_til: string | null
          city: string | null
          client_category: string | null
          co_cert_number: string | null
          co_cr_12_issue_date: string | null
          co_nssf_number: string | null
          co_registration_date: string | null
          company_handover_date: string | null
          company_name: string | null
          company_prefix: string | null
          company_registered_date: string | null
          company_status: string | null
          company_takeover_date: string | null
          company_type: string | null
          country: string | null
          cr_12_as_at_date_of_issue: string | null
          cr_12_reminder_date: string | null
          cr_12_reminders_notice_days: string | null
          created_at: string | null
          current_communication_email: string | null
          date_established: string | null
          employees: string | null
          fiscal_year: string | null
          good_conduct_issue_date: string | null
          housing_levy_identifier: string | null
          housing_levy_password: string | null
          housing_levy_status: string | null
          id: number
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          income_tax_returns_filled_till: string | null
          index: number | null
          industry: string | null
          is_locked: string | null
          is_verified: boolean | null
          itax_status: string | null
          kra_email: string | null
          kra_phone_number: string | null
          kra_pin: string | null
          name_verified_with_pin: string | null
          nature_of_business: string | null
          nea_password: string | null
          nea_username: string | null
          nita_identifier: string | null
          nita_password: string | null
          nita_status: string | null
          office_number: string | null
          phone: string | null
          pin_status: string | null
          postal_address: string | null
          published: string | null
          registration_date: string | null
          registration_number: string | null
          sale_terms: string | null
          sheria_client_effective_from: string | null
          sheria_client_effective_to: string | null
          sheria_house_returns_filled_till: string | null
          site_accountant_mobile: string | null
          site_accountant_name: string | null
          source_of_income_business_1: string | null
          source_of_income_business_2: string | null
          source_of_income_employment_1: string | null
          source_of_income_employment_2: string | null
          source_of_income_interest_dividends: string | null
          source_of_income_rental: string | null
          standard_levy_identifier: string | null
          standard_levy_password: string | null
          standard_levy_status: string | null
          status: string | null
          street: string | null
          tcc_expiry_date: string | null
          tcc_reminder_date: string | null
          tcc_reminders_notice_days: string | null
          tourism_fund_password: string | null
          tourism_fund_username: string | null
          tourism_levy_identifier: string | null
          tourism_levy_password: string | null
          tourism_levy_status: string | null
          updated_at: string | null
          userid: string | null
          vat_from: string | null
          vat_identifier: string | null
          vat_password: string | null
          vat_status: string | null
          vat_to: string | null
          verification_data: Json | null
          website: string | null
          wh_vat_agent_customers: string | null
          wh_vat_agent_suppliers: string | null
          whatsapp_number: string | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: number
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: number
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      acc_portal_company_duplicate: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          account_manager: string | null
          annual_revenue: string | null
          audit_client_effective_from: string | null
          audit_client_effective_to: string | null
          audit_period: string | null
          backlog_posted_date: string | null
          bcl_back_log: string | null
          bcl_takeover_date: string | null
          bo_status: string | null
          books_prepared_til: string | null
          city: string | null
          client_category: string | null
          co_cert_number: string | null
          co_cr_12_issue_date: string | null
          co_nssf_number: string | null
          co_registration_date: string | null
          company_handover_date: string | null
          company_name: string | null
          company_prefix: string | null
          company_registered_date: string | null
          company_status: string | null
          company_takeover_date: string | null
          company_type: string | null
          country: string | null
          cr_12_as_at_date_of_issue: string | null
          cr_12_reminder_date: string | null
          cr_12_reminders_notice_days: string | null
          created_at: string | null
          current_communication_email: string | null
          date_established: string | null
          employees: string | null
          fiscal_year: string | null
          good_conduct_issue_date: string | null
          housing_levy_identifier: string | null
          housing_levy_password: string | null
          housing_levy_status: string | null
          id: number
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          income_tax_returns_filled_till: string | null
          index: number | null
          industry: string | null
          is_locked: string | null
          is_verified: boolean | null
          itax_status: string | null
          kra_email: string | null
          kra_phone_number: string | null
          kra_pin: string | null
          name_verified_with_pin: string | null
          nature_of_business: string | null
          nea_password: string | null
          nea_username: string | null
          nita_identifier: string | null
          nita_password: string | null
          nita_status: string | null
          office_number: string | null
          phone: string | null
          pin_status: string | null
          postal_address: string | null
          published: string | null
          registration_date: string | null
          registration_number: string | null
          sale_terms: string | null
          sheria_client_effective_from: string | null
          sheria_client_effective_to: string | null
          sheria_house_returns_filled_till: string | null
          site_accountant_mobile: string | null
          site_accountant_name: string | null
          source_of_income_business_1: string | null
          source_of_income_business_2: string | null
          source_of_income_employment_1: string | null
          source_of_income_employment_2: string | null
          source_of_income_interest_dividends: string | null
          source_of_income_rental: string | null
          standard_levy_identifier: string | null
          standard_levy_password: string | null
          standard_levy_status: string | null
          status: string | null
          street: string | null
          tcc_expiry_date: string | null
          tcc_reminder_date: string | null
          tcc_reminders_notice_days: string | null
          tourism_fund_password: string | null
          tourism_fund_username: string | null
          tourism_levy_identifier: string | null
          tourism_levy_password: string | null
          tourism_levy_status: string | null
          updated_at: string | null
          userid: string | null
          vat_from: string | null
          vat_identifier: string | null
          vat_password: string | null
          vat_status: string | null
          vat_to: string | null
          verification_data: Json | null
          website: string | null
          wh_vat_agent_customers: string | null
          wh_vat_agent_suppliers: string | null
          whatsapp_number: string | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: never
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: never
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      acc_portal_company_duplicate_duplicate: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          account_manager: string | null
          annual_revenue: string | null
          audit_client_effective_from: string | null
          audit_client_effective_to: string | null
          audit_period: string | null
          backlog_posted_date: string | null
          bcl_back_log: string | null
          bcl_takeover_date: string | null
          bo_status: string | null
          books_prepared_til: string | null
          city: string | null
          client_category: string | null
          co_cert_number: string | null
          co_cr_12_issue_date: string | null
          co_nssf_number: string | null
          co_registration_date: string | null
          company_handover_date: string | null
          company_name: string | null
          company_prefix: string | null
          company_registered_date: string | null
          company_status: string | null
          company_takeover_date: string | null
          company_type: string | null
          country: string | null
          cr_12_as_at_date_of_issue: string | null
          cr_12_reminder_date: string | null
          cr_12_reminders_notice_days: string | null
          created_at: string | null
          current_communication_email: string | null
          date_established: string | null
          employees: string | null
          fiscal_year: string | null
          good_conduct_issue_date: string | null
          housing_levy_identifier: string | null
          housing_levy_password: string | null
          housing_levy_status: string | null
          id: number
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          income_tax_returns_filled_till: string | null
          index: number | null
          industry: string | null
          is_locked: string | null
          is_verified: boolean | null
          itax_status: string | null
          kra_email: string | null
          kra_phone_number: string | null
          kra_pin: string | null
          link_id: string | null
          name_verified_with_pin: string | null
          nature_of_business: string | null
          nea_password: string | null
          nea_username: string | null
          nita_identifier: string | null
          nita_password: string | null
          nita_status: string | null
          office_number: string | null
          phone: string | null
          pin_status: string | null
          postal_address: string | null
          published: string | null
          registration_date: string | null
          registration_number: string | null
          sale_terms: string | null
          sheria_client_effective_from: string | null
          sheria_client_effective_to: string | null
          sheria_house_returns_filled_till: string | null
          site_accountant_mobile: string | null
          site_accountant_name: string | null
          source_of_income_business_1: string | null
          source_of_income_business_2: string | null
          source_of_income_employment_1: string | null
          source_of_income_employment_2: string | null
          source_of_income_interest_dividends: string | null
          source_of_income_rental: string | null
          standard_levy_identifier: string | null
          standard_levy_password: string | null
          standard_levy_status: string | null
          status: string | null
          street: string | null
          tcc_expiry_date: string | null
          tcc_reminder_date: string | null
          tcc_reminders_notice_days: string | null
          tourism_fund_password: string | null
          tourism_fund_username: string | null
          tourism_levy_identifier: string | null
          tourism_levy_password: string | null
          tourism_levy_status: string | null
          updated_at: string | null
          userid: string | null
          vat_from: string | null
          vat_identifier: string | null
          vat_password: string | null
          vat_status: string | null
          vat_to: string | null
          verification_data: Json | null
          website: string | null
          wh_vat_agent_customers: string | null
          wh_vat_agent_suppliers: string | null
          whatsapp_number: string | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: never
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          link_id?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          account_manager?: string | null
          annual_revenue?: string | null
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          audit_period?: string | null
          backlog_posted_date?: string | null
          bcl_back_log?: string | null
          bcl_takeover_date?: string | null
          bo_status?: string | null
          books_prepared_til?: string | null
          city?: string | null
          client_category?: string | null
          co_cert_number?: string | null
          co_cr_12_issue_date?: string | null
          co_nssf_number?: string | null
          co_registration_date?: string | null
          company_handover_date?: string | null
          company_name?: string | null
          company_prefix?: string | null
          company_registered_date?: string | null
          company_status?: string | null
          company_takeover_date?: string | null
          company_type?: string | null
          country?: string | null
          cr_12_as_at_date_of_issue?: string | null
          cr_12_reminder_date?: string | null
          cr_12_reminders_notice_days?: string | null
          created_at?: string | null
          current_communication_email?: string | null
          date_established?: string | null
          employees?: string | null
          fiscal_year?: string | null
          good_conduct_issue_date?: string | null
          housing_levy_identifier?: string | null
          housing_levy_password?: string | null
          housing_levy_status?: string | null
          id?: never
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          income_tax_returns_filled_till?: string | null
          index?: number | null
          industry?: string | null
          is_locked?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_email?: string | null
          kra_phone_number?: string | null
          kra_pin?: string | null
          link_id?: string | null
          name_verified_with_pin?: string | null
          nature_of_business?: string | null
          nea_password?: string | null
          nea_username?: string | null
          nita_identifier?: string | null
          nita_password?: string | null
          nita_status?: string | null
          office_number?: string | null
          phone?: string | null
          pin_status?: string | null
          postal_address?: string | null
          published?: string | null
          registration_date?: string | null
          registration_number?: string | null
          sale_terms?: string | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          sheria_house_returns_filled_till?: string | null
          site_accountant_mobile?: string | null
          site_accountant_name?: string | null
          source_of_income_business_1?: string | null
          source_of_income_business_2?: string | null
          source_of_income_employment_1?: string | null
          source_of_income_employment_2?: string | null
          source_of_income_interest_dividends?: string | null
          source_of_income_rental?: string | null
          standard_levy_identifier?: string | null
          standard_levy_password?: string | null
          standard_levy_status?: string | null
          status?: string | null
          street?: string | null
          tcc_expiry_date?: string | null
          tcc_reminder_date?: string | null
          tcc_reminders_notice_days?: string | null
          tourism_fund_password?: string | null
          tourism_fund_username?: string | null
          tourism_levy_identifier?: string | null
          tourism_levy_password?: string | null
          tourism_levy_status?: string | null
          updated_at?: string | null
          userid?: string | null
          vat_from?: string | null
          vat_identifier?: string | null
          vat_password?: string | null
          vat_status?: string | null
          vat_to?: string | null
          verification_data?: Json | null
          website?: string | null
          wh_vat_agent_customers?: string | null
          wh_vat_agent_suppliers?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      acc_portal_companydetails: {
        Row: {
          annual_revenue: number | null
          company_id: number
          employees: number | null
          fiscal_year_end: string | null
          fiscal_year_start: string | null
          id: number
          userid: string | null
        }
        Insert: {
          annual_revenue?: number | null
          company_id: number
          employees?: number | null
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          id?: never
          userid?: string | null
        }
        Update: {
          annual_revenue?: number | null
          company_id?: number
          employees?: number | null
          fiscal_year_end?: string | null
          fiscal_year_start?: string | null
          id?: never
          userid?: string | null
        }
        Relationships: []
      }
      acc_portal_contactinformation: {
        Row: {
          address: string | null
          company_id: number
          email: string | null
          id: number
          phone: string | null
          userid: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          company_id: number
          email?: string | null
          id?: never
          phone?: string | null
          userid?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          company_id?: number
          email?: string | null
          id?: never
          phone?: string | null
          userid?: string | null
          website?: string | null
        }
        Relationships: []
      }
      acc_portal_customers: {
        Row: {
          accountant_name: string | null
          company_id: number | null
          company_name: string | null
          country_name: string | null
          created_at: string | null
          credit_limit: number | null
          credit_terms: string | null
          currency: string | null
          customer_name_as_per_pin: string | null
          customer_name_as_per_qb: string | null
          customer_prefix: string | null
          customer_status: string | null
          exp_cat: string | null
          frequency: string | null
          id: number
          is_verified: string | null
          off_email: string | null
          off_mobile: string | null
          personal_mobile: string | null
          pin_no: string | null
          residence: string | null
          type: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          verification_data: string | null
          wh_cat: string | null
          wh_tax_percent: number | null
          wh_vat: string | null
        }
        Insert: {
          accountant_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: string | null
          currency?: string | null
          customer_name_as_per_pin?: string | null
          customer_name_as_per_qb?: string | null
          customer_prefix?: string | null
          customer_status?: string | null
          exp_cat?: string | null
          frequency?: string | null
          id?: number
          is_verified?: string | null
          off_email?: string | null
          off_mobile?: string | null
          personal_mobile?: string | null
          pin_no?: string | null
          residence?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verification_data?: string | null
          wh_cat?: string | null
          wh_tax_percent?: number | null
          wh_vat?: string | null
        }
        Update: {
          accountant_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: string | null
          currency?: string | null
          customer_name_as_per_pin?: string | null
          customer_name_as_per_qb?: string | null
          customer_prefix?: string | null
          customer_status?: string | null
          exp_cat?: string | null
          frequency?: string | null
          id?: number
          is_verified?: string | null
          off_email?: string | null
          off_mobile?: string | null
          personal_mobile?: string | null
          pin_no?: string | null
          residence?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verification_data?: string | null
          wh_cat?: string | null
          wh_tax_percent?: number | null
          wh_vat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_customers_duplicate_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_directors: {
        Row: {
          alien_number: string | null
          alternative_email: string | null
          annual_income: number | null
          area_name: string | null
          bankruptcy_history: string | null
          block_number: string | null
          building_name: string | null
          company_id: number | null
          company_name: string | null
          country: string | null
          country_of_birth: string | null
          course_end_date: string | null
          course_name: string | null
          course_start_date: string | null
          criminal_record: string | null
          date_of_birth: string | null
          dependents: number | null
          education_level: string | null
          email_address: string | null
          eye_color: string | null
          first_name: string | null
          floor_number: string | null
          full_name: string | null
          full_postal_address: string | null
          full_residential_address: string | null
          gender: string | null
          hair_color: string | null
          height: string | null
          id: number
          id_number: string | null
          job_description: string | null
          job_position: string | null
          languages_spoken: string | null
          last_name: string | null
          marital_status: string | null
          middle_name: string | null
          mobile_number: string | null
          nationality: string | null
          occupation: string | null
          other_directorships: string | null
          other_names: string | null
          passport_expiry_date: string | null
          passport_file_number: string | null
          passport_issue_date: string | null
          passport_number: string | null
          passport_place_of_issue: string | null
          place_of_birth: string | null
          postal_address: string | null
          postal_code: string | null
          postal_town: string | null
          professional_memberships: string | null
          residential_county: string | null
          road_name: string | null
          shares_held: number | null
          special_marks: string | null
          status: string | null
          sub_county: string | null
          tax_pin: string | null
          town: string | null
          university_name: string | null
          userid: string | null
        }
        Insert: {
          alien_number?: string | null
          alternative_email?: string | null
          annual_income?: number | null
          area_name?: string | null
          bankruptcy_history?: string | null
          block_number?: string | null
          building_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country?: string | null
          country_of_birth?: string | null
          course_end_date?: string | null
          course_name?: string | null
          course_start_date?: string | null
          criminal_record?: string | null
          date_of_birth?: string | null
          dependents?: number | null
          education_level?: string | null
          email_address?: string | null
          eye_color?: string | null
          first_name?: string | null
          floor_number?: string | null
          full_name?: string | null
          full_postal_address?: string | null
          full_residential_address?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: never
          id_number?: string | null
          job_description?: string | null
          job_position?: string | null
          languages_spoken?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          nationality?: string | null
          occupation?: string | null
          other_directorships?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          place_of_birth?: string | null
          postal_address?: string | null
          postal_code?: string | null
          postal_town?: string | null
          professional_memberships?: string | null
          residential_county?: string | null
          road_name?: string | null
          shares_held?: number | null
          special_marks?: string | null
          status?: string | null
          sub_county?: string | null
          tax_pin?: string | null
          town?: string | null
          university_name?: string | null
          userid?: string | null
        }
        Update: {
          alien_number?: string | null
          alternative_email?: string | null
          annual_income?: number | null
          area_name?: string | null
          bankruptcy_history?: string | null
          block_number?: string | null
          building_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country?: string | null
          country_of_birth?: string | null
          course_end_date?: string | null
          course_name?: string | null
          course_start_date?: string | null
          criminal_record?: string | null
          date_of_birth?: string | null
          dependents?: number | null
          education_level?: string | null
          email_address?: string | null
          eye_color?: string | null
          first_name?: string | null
          floor_number?: string | null
          full_name?: string | null
          full_postal_address?: string | null
          full_residential_address?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: never
          id_number?: string | null
          job_description?: string | null
          job_position?: string | null
          languages_spoken?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          nationality?: string | null
          occupation?: string | null
          other_directorships?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          place_of_birth?: string | null
          postal_address?: string | null
          postal_code?: string | null
          postal_town?: string | null
          professional_memberships?: string | null
          residential_county?: string | null
          road_name?: string | null
          shares_held?: number | null
          special_marks?: string | null
          status?: string | null
          sub_county?: string | null
          tax_pin?: string | null
          town?: string | null
          university_name?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      acc_portal_directors_documents: {
        Row: {
          created_at: string | null
          director_id: number | null
          document_id: string | null
          expiry_date: string | null
          extracted_details: Json | null
          file_path: string | null
          id: string
          issue_date: string | null
          kyc_document_id: string | null
          status: string | null
          updated_at: string | null
          userid: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          director_id?: number | null
          document_id?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          kyc_document_id?: string | null
          status?: string | null
          updated_at?: string | null
          userid?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          director_id?: number | null
          document_id?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          kyc_document_id?: string | null
          status?: string | null
          updated_at?: string | null
          userid?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_directors_documents_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "registry_individuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_portal_directors_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_kyc"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_directors_duplicate: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          alien_expiry_date: string | null
          alien_issue_date: string | null
          alien_number: string | null
          alien_reminders_date: string | null
          alien_reminders_notice_days: string | null
          alternative_email: string | null
          annual_income: string | null
          area_name: string | null
          audit_tax_client_effective_from: string | null
          audit_tax_client_effective_to: string | null
          bankruptcy_history: string | null
          block_number: string | null
          broad_cast_wa: string | null
          building_name: string | null
          company_id: number | null
          company_name: string | null
          country: string | null
          country_of_birth: string | null
          course_end_date: string | null
          course_name: string | null
          course_start_date: string | null
          cps_sheria_client_effective_from: string | null
          cps_sheria_client_effective_to: string | null
          created_at: string | null
          criminal_record: string | null
          date_of_birth: string | null
          dependents: string | null
          education_level: string | null
          effective_from: string | null
          effective_to: string | null
          email_address: string | null
          eye_color: string | null
          first_name: string | null
          floor_number: string | null
          full_name: string | null
          full_postal_address: string | null
          full_residential_address: string | null
          gender: string | null
          hair_color: string | null
          height: string | null
          id: number
          id_number: string | null
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          individual_full_name: string | null
          individual_id: number | null
          is_dependent: string | null
          is_director: string | null
          is_employee: string | null
          is_verified: boolean | null
          job_description: string | null
          job_position: string | null
          kra_pin: string | null
          languages_spoken: string | null
          last_name: string | null
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          occupation: string | null
          other_directorships: string | null
          other_names: string | null
          passport_expiry_date: string | null
          passport_file_number: string | null
          passport_issue_date: string | null
          passport_number: string | null
          passport_place_of_issue: string | null
          permit_expiry_date: string | null
          permit_issue_date: string | null
          permit_no: string | null
          permit_reminders_date: string | null
          permit_reminders_notice_days: string | null
          personal_mobile_num_abroad: string | null
          personal_mobile_num_kenyan: string | null
          place_of_birth: string | null
          postal_address: string | null
          postal_code: string | null
          postal_town: string | null
          pp_reminders_date: string | null
          pp_reminders_notice_days: string | null
          professional_memberships: string | null
          relationship: string | null
          resident_status: string | null
          residential_county: string | null
          road_name: string | null
          role: string | null
          shares_held: string | null
          special_marks: string | null
          status: string | null
          sub_county: string | null
          tax_pin: string | null
          town: string | null
          university_name: string | null
          updated_at: string | null
          userid: string | null
          verification_data: Json | null
          years_known: string | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: string | null
          alternative_email?: string | null
          annual_income?: string | null
          area_name?: string | null
          audit_tax_client_effective_from?: string | null
          audit_tax_client_effective_to?: string | null
          bankruptcy_history?: string | null
          block_number?: string | null
          broad_cast_wa?: string | null
          building_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country?: string | null
          country_of_birth?: string | null
          course_end_date?: string | null
          course_name?: string | null
          course_start_date?: string | null
          cps_sheria_client_effective_from?: string | null
          cps_sheria_client_effective_to?: string | null
          created_at?: string | null
          criminal_record?: string | null
          date_of_birth?: string | null
          dependents?: string | null
          education_level?: string | null
          effective_from?: string | null
          effective_to?: string | null
          email_address?: string | null
          eye_color?: string | null
          first_name?: string | null
          floor_number?: string | null
          full_name?: string | null
          full_postal_address?: string | null
          full_residential_address?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: never
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_full_name?: string | null
          individual_id?: number | null
          is_dependent?: string | null
          is_director?: string | null
          is_employee?: string | null
          is_verified?: boolean | null
          job_description?: string | null
          job_position?: string | null
          kra_pin?: string | null
          languages_spoken?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          occupation?: string | null
          other_directorships?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: string | null
          personal_mobile_num_abroad?: string | null
          personal_mobile_num_kenyan?: string | null
          place_of_birth?: string | null
          postal_address?: string | null
          postal_code?: string | null
          postal_town?: string | null
          pp_reminders_date?: string | null
          pp_reminders_notice_days?: string | null
          professional_memberships?: string | null
          relationship?: string | null
          resident_status?: string | null
          residential_county?: string | null
          road_name?: string | null
          role?: string | null
          shares_held?: string | null
          special_marks?: string | null
          status?: string | null
          sub_county?: string | null
          tax_pin?: string | null
          town?: string | null
          university_name?: string | null
          updated_at?: string | null
          userid?: string | null
          verification_data?: Json | null
          years_known?: string | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: string | null
          alternative_email?: string | null
          annual_income?: string | null
          area_name?: string | null
          audit_tax_client_effective_from?: string | null
          audit_tax_client_effective_to?: string | null
          bankruptcy_history?: string | null
          block_number?: string | null
          broad_cast_wa?: string | null
          building_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country?: string | null
          country_of_birth?: string | null
          course_end_date?: string | null
          course_name?: string | null
          course_start_date?: string | null
          cps_sheria_client_effective_from?: string | null
          cps_sheria_client_effective_to?: string | null
          created_at?: string | null
          criminal_record?: string | null
          date_of_birth?: string | null
          dependents?: string | null
          education_level?: string | null
          effective_from?: string | null
          effective_to?: string | null
          email_address?: string | null
          eye_color?: string | null
          first_name?: string | null
          floor_number?: string | null
          full_name?: string | null
          full_postal_address?: string | null
          full_residential_address?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: never
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_full_name?: string | null
          individual_id?: number | null
          is_dependent?: string | null
          is_director?: string | null
          is_employee?: string | null
          is_verified?: boolean | null
          job_description?: string | null
          job_position?: string | null
          kra_pin?: string | null
          languages_spoken?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          occupation?: string | null
          other_directorships?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: string | null
          personal_mobile_num_abroad?: string | null
          personal_mobile_num_kenyan?: string | null
          place_of_birth?: string | null
          postal_address?: string | null
          postal_code?: string | null
          postal_town?: string | null
          pp_reminders_date?: string | null
          pp_reminders_notice_days?: string | null
          professional_memberships?: string | null
          relationship?: string | null
          resident_status?: string | null
          residential_county?: string | null
          road_name?: string | null
          role?: string | null
          shares_held?: string | null
          special_marks?: string | null
          status?: string | null
          sub_county?: string | null
          tax_pin?: string | null
          town?: string | null
          university_name?: string | null
          updated_at?: string | null
          userid?: string | null
          verification_data?: Json | null
          years_known?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_directors_duplicate_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_directors_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_email_accounts: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expiry_date: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expiry_date: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expiry_date?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      acc_portal_employees: {
        Row: {
          branch: string | null
          company_id: number | null
          company_name: string | null
          department: string | null
          email_address: string | null
          employment_type: string | null
          end_date: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: number
          id_number: string | null
          job_title: string | null
          kra_pin: string | null
          last_name: string | null
          middle_name: string | null
          nationality: string | null
          nhif: string | null
          nssf: string | null
          passport_number: string | null
          personal_mobile_num_kenyan: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          branch?: string | null
          company_id?: number | null
          company_name?: string | null
          department?: string | null
          email_address?: string | null
          employment_type?: string | null
          end_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: number
          id_number?: string | null
          job_title?: string | null
          kra_pin?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          nhif?: string | null
          nssf?: string | null
          passport_number?: string | null
          personal_mobile_num_kenyan?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          branch?: string | null
          company_id?: number | null
          company_name?: string | null
          department?: string | null
          email_address?: string | null
          employment_type?: string | null
          end_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: number
          id_number?: string | null
          job_title?: string | null
          kra_pin?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          nhif?: string | null
          nssf?: string | null
          passport_number?: string | null
          personal_mobile_num_kenyan?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_kyc: {
        Row: {
          category: string | null
          created_at: string | null
          custom_order: number | null
          department: string
          display_name: string | null
          document_number: number
          document_type: string | null
          fields: Json | null
          id: string
          last_extracted_details: Json | null
          listed: boolean | null
          main_category: string | null
          main_category_number: string | null
          name: string | null
          reminder_days: string | null
          Reminder_days: number | null
          requirements: Json | null
          subcategory: string | null
          updated_at: string | null
          userid: string | null
          validity_days: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          custom_order?: number | null
          department: string
          display_name?: string | null
          document_number?: never
          document_type?: string | null
          fields?: Json | null
          id?: string
          last_extracted_details?: Json | null
          listed?: boolean | null
          main_category?: string | null
          main_category_number?: string | null
          name?: string | null
          reminder_days?: string | null
          Reminder_days?: number | null
          requirements?: Json | null
          subcategory?: string | null
          updated_at?: string | null
          userid?: string | null
          validity_days?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          custom_order?: number | null
          department?: string
          display_name?: string | null
          document_number?: never
          document_type?: string | null
          fields?: Json | null
          id?: string
          last_extracted_details?: Json | null
          listed?: boolean | null
          main_category?: string | null
          main_category_number?: string | null
          name?: string | null
          reminder_days?: string | null
          Reminder_days?: number | null
          requirements?: Json | null
          subcategory?: string | null
          updated_at?: string | null
          userid?: string | null
          validity_days?: string | null
        }
        Relationships: []
      }
      acc_portal_kyc_uploads: {
        Row: {
          created_at: string | null
          document_type: string | null
          expiry_date: string | null
          extracted_details: Json | null
          extraction_error: string | null
          file_path: string | null
          id: number
          issue_date: string | null
          kyc_document_id: string | null
          kyc_id: string | null
          reminder_days: string | null
          status: string | null
          updated_at: string | null
          upload_date: string | null
          userid: string
          validity_days: number | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          extraction_error?: string | null
          file_path?: string | null
          id?: never
          issue_date?: string | null
          kyc_document_id?: string | null
          kyc_id?: string | null
          reminder_days?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          userid: string
          validity_days?: number | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          extraction_error?: string | null
          file_path?: string | null
          id?: never
          issue_date?: string | null
          kyc_document_id?: string | null
          kyc_id?: string | null
          reminder_days?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          userid?: string
          validity_days?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_kyc_uploads_kyc_document_id_fkey"
            columns: ["kyc_document_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_kyc"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_licence: {
        Row: {
          created_at: string | null
          department: string | null
          document_type: string | null
          fields: Json | null
          id: string
          licence_document_id: string | null
          name: string
          subcategory: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          document_type?: string | null
          fields?: Json | null
          id?: string
          licence_document_id?: string | null
          name: string
          subcategory?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          document_type?: string | null
          fields?: Json | null
          id?: string
          licence_document_id?: string | null
          name?: string
          subcategory?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_licence_document_id_fkey"
            columns: ["licence_document_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_licence_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_licence_uploads: {
        Row: {
          created_at: string | null
          document_type: string | null
          expiry_date: string | null
          extracted_details: Json | null
          filepath: string
          id: string
          issue_date: string | null
          licence_document_id: string | null
          licence_id: string | null
          upload_date: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          filepath: string
          id?: string
          issue_date?: string | null
          licence_document_id?: string | null
          licence_id?: string | null
          upload_date?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          expiry_date?: string | null
          extracted_details?: Json | null
          filepath?: string
          id?: string
          issue_date?: string | null
          licence_document_id?: string | null
          licence_id?: string | null
          upload_date?: string | null
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_licence_uploads_document_id_fkey"
            columns: ["licence_document_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_licence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_portal_licence_uploads_licence_id_fkey"
            columns: ["licence_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_licence"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_monthly_files_upload: {
        Row: {
          balance_verification: boolean | null
          bank_id: number | null
          closing_balance: number | null
          docs_date_range: string | null
          docs_date_range_end: string | null
          document_type: string | null
          file_path: string | null
          id: number
          is_verified: boolean | null
          supplier_id: number | null
          upload_date: string | null
          upload_status: string
          userid: string | null
        }
        Insert: {
          balance_verification?: boolean | null
          bank_id?: number | null
          closing_balance?: number | null
          docs_date_range?: string | null
          docs_date_range_end?: string | null
          document_type?: string | null
          file_path?: string | null
          id?: never
          is_verified?: boolean | null
          supplier_id?: number | null
          upload_date?: string | null
          upload_status?: string
          userid?: string | null
        }
        Update: {
          balance_verification?: boolean | null
          bank_id?: number | null
          closing_balance?: number | null
          docs_date_range?: string | null
          docs_date_range_end?: string | null
          document_type?: string | null
          file_path?: string | null
          id?: never
          is_verified?: boolean | null
          supplier_id?: number | null
          upload_date?: string | null
          upload_status?: string
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_monthly_files_upload_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_overall_table_setting: {
        Row: {
          created_at: string | null
          id: number
          main_tab: string
          structure: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          main_tab: string
          structure: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          main_tab?: string
          structure?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      acc_portal_petty_cash_entries: {
        Row: {
          amount: number
          approved_by: string | null
          checked_by: string | null
          created_at: string | null
          description: string | null
          expense_type: string | null
          id: number
          invoice_date: string
          invoice_number: string
          payment_type: string | null
          receipt_url: string | null
          userid: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          checked_by?: string | null
          created_at?: string | null
          description?: string | null
          expense_type?: string | null
          id?: number
          invoice_date: string
          invoice_number: string
          payment_type?: string | null
          receipt_url?: string | null
          userid?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          checked_by?: string | null
          created_at?: string | null
          description?: string | null
          expense_type?: string | null
          id?: number
          invoice_date?: string
          invoice_number?: string
          payment_type?: string | null
          receipt_url?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      acc_portal_pettycash_accounts: {
        Row: {
          created_at: string | null
          data: Json
          id: number
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: number
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: number
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_branches: {
        Row: {
          created_at: string | null
          data: Json
          id: number
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: number
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: number
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_categories: {
        Row: {
          admin_id: string
          created_date: string | null
          id: number
          name: string
          type: string
        }
        Insert: {
          admin_id?: string
          created_date?: string | null
          id?: number
          name: string
          type: string
        }
        Update: {
          admin_id?: string
          created_date?: string | null
          id?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_entries: {
        Row: {
          account_type: string | null
          amount: number
          approved_by: string | null
          base_amount: number | null
          bill_number: string | null
          bill_upload_url: string | null
          branch_id: string | null
          branch_name: string | null
          checked_by: string | null
          created_at: string
          created_date: string | null
          cuin_number: string | null
          currency: string | null
          description: string | null
          document_references: Json | null
          entrynumber: number | null
          exchange_rate: number | null
          expense_category: string | null
          expense_type: string | null
          id: number
          invoice_date: string | null
          invoice_number: string | null
          is_verified: boolean | null
          last_modified_at: string | null
          last_modified_by: string | null
          metadata: Json | null
          notes: string | null
          paid_via: string | null
          payment_proof_url: string | null
          payment_type: string | null
          petty_cash_account: string | null
          petty_cash_number: string | null
          purchase_type: string | null
          receipt_url: string | null
          status: string | null
          subcategory: string | null
          supplier_name: string | null
          supplier_pin: string | null
          tags: string[] | null
          tax_amount: number | null
          total_amount: number | null
          user_id: string | null
          user_name: string | null
          userid: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_type?: string | null
          amount: number
          approved_by?: string | null
          base_amount?: number | null
          bill_number?: string | null
          bill_upload_url?: string | null
          branch_id?: string | null
          branch_name?: string | null
          checked_by?: string | null
          created_at?: string
          created_date?: string | null
          cuin_number?: string | null
          currency?: string | null
          description?: string | null
          document_references?: Json | null
          entrynumber?: number | null
          exchange_rate?: number | null
          expense_category?: string | null
          expense_type?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          is_verified?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_via?: string | null
          payment_proof_url?: string | null
          payment_type?: string | null
          petty_cash_account?: string | null
          petty_cash_number?: string | null
          purchase_type?: string | null
          receipt_url?: string | null
          status?: string | null
          subcategory?: string | null
          supplier_name?: string | null
          supplier_pin?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          total_amount?: number | null
          user_id?: string | null
          user_name?: string | null
          userid?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_type?: string | null
          amount?: number
          approved_by?: string | null
          base_amount?: number | null
          bill_number?: string | null
          bill_upload_url?: string | null
          branch_id?: string | null
          branch_name?: string | null
          checked_by?: string | null
          created_at?: string
          created_date?: string | null
          cuin_number?: string | null
          currency?: string | null
          description?: string | null
          document_references?: Json | null
          entrynumber?: number | null
          exchange_rate?: number | null
          expense_category?: string | null
          expense_type?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          is_verified?: boolean | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_via?: string | null
          payment_proof_url?: string | null
          payment_type?: string | null
          petty_cash_account?: string | null
          petty_cash_number?: string | null
          purchase_type?: string | null
          receipt_url?: string | null
          status?: string | null
          subcategory?: string | null
          supplier_name?: string | null
          supplier_pin?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          total_amount?: number | null
          user_id?: string | null
          user_name?: string | null
          userid?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      acc_portal_pettycash_expense_categories: {
        Row: {
          created_at: string
          description: string | null
          expense_category: string
          id: string
          is_active: boolean | null
          subcategories: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expense_category: string
          id?: string
          is_active?: boolean | null
          subcategories?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expense_category?: string
          id?: string
          is_active?: boolean | null
          subcategories?: Json
          updated_at?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: number
          loan_id: number
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          loan_id: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          loan_id?: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_pettycash_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_pettycash_loans"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_pettycash_loans: {
        Row: {
          amount: number
          collateral_description: string | null
          contact_number: string | null
          created_at: string
          customer_name: string
          description: string | null
          due_date: string
          email: string | null
          guarantor_contact: string | null
          guarantor_id_number: string | null
          guarantor_name: string | null
          id: number
          interest_rate: number | null
          interest_type: string | null
          late_payment_fee: number | null
          loan_term_months: number | null
          loan_type: string | null
          notes: string | null
          paid_amount: number | null
          payment_frequency: string | null
          payment_status: string
          receipt_url: string | null
          remaining_amount: number
          updated_at: string | null
          userid: string
        }
        Insert: {
          amount: number
          collateral_description?: string | null
          contact_number?: string | null
          created_at?: string
          customer_name: string
          description?: string | null
          due_date: string
          email?: string | null
          guarantor_contact?: string | null
          guarantor_id_number?: string | null
          guarantor_name?: string | null
          id?: number
          interest_rate?: number | null
          interest_type?: string | null
          late_payment_fee?: number | null
          loan_term_months?: number | null
          loan_type?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_frequency?: string | null
          payment_status?: string
          receipt_url?: string | null
          remaining_amount: number
          updated_at?: string | null
          userid: string
        }
        Update: {
          amount?: number
          collateral_description?: string | null
          contact_number?: string | null
          created_at?: string
          customer_name?: string
          description?: string | null
          due_date?: string
          email?: string | null
          guarantor_contact?: string | null
          guarantor_id_number?: string | null
          guarantor_name?: string | null
          id?: number
          interest_rate?: number | null
          interest_type?: string | null
          late_payment_fee?: number | null
          loan_term_months?: number | null
          loan_type?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_frequency?: string | null
          payment_status?: string
          receipt_url?: string | null
          remaining_amount?: number
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_reimbursements: {
        Row: {
          amount: number
          contact_number: string | null
          created_at: string
          customer_name: string
          description: string | null
          due_date: string | null
          email: string | null
          id: number
          notes: string | null
          paid_amount: number | null
          payment_status: string
          receipt_url: string | null
          updated_at: string | null
          userid: string
        }
        Insert: {
          amount: number
          contact_number?: string | null
          created_at?: string
          customer_name: string
          description?: string | null
          due_date?: string | null
          email?: string | null
          id?: never
          notes?: string | null
          paid_amount?: number | null
          payment_status: string
          receipt_url?: string | null
          updated_at?: string | null
          userid: string
        }
        Update: {
          amount?: number
          contact_number?: string | null
          created_at?: string
          customer_name?: string
          description?: string | null
          due_date?: string | null
          email?: string | null
          id?: never
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string
          receipt_url?: string | null
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_report_settings: {
        Row: {
          auto_generate: boolean
          data_retention_months: number
          default_view: string
          generate_frequency: string
          generation_date: string
          id: number
          include_balances: boolean
          include_charts: boolean
          include_transactions: boolean
          userid: string
        }
        Insert: {
          auto_generate: boolean
          data_retention_months: number
          default_view: string
          generate_frequency: string
          generation_date: string
          id?: number
          include_balances: boolean
          include_charts: boolean
          include_transactions: boolean
          userid: string
        }
        Update: {
          auto_generate?: boolean
          data_retention_months?: number
          default_view?: string
          generate_frequency?: string
          generation_date?: string
          id?: number
          include_balances?: boolean
          include_charts?: boolean
          include_transactions?: boolean
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_reports: {
        Row: {
          admin_id: string
          end_date: string
          generated_date: string | null
          id: number
          report_data: Json | null
          report_type: string
          start_date: string
        }
        Insert: {
          admin_id: string
          end_date: string
          generated_date?: string | null
          id?: number
          report_data?: Json | null
          report_type: string
          start_date: string
        }
        Update: {
          admin_id?: string
          end_date?: string
          generated_date?: string | null
          id?: number
          report_data?: Json | null
          report_type?: string
          start_date?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_subcategories: {
        Row: {
          category_id: number | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_pettycash_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_pettycash_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_pettycash_suppliers: {
        Row: {
          created_at: string | null
          data: Json
          id: number
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: number
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: number
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_pettycash_user_limits: {
        Row: {
          account_type: string
          admin_id: string
          created_date: string | null
          id: number
          limit_amount: number
          user_id: number | null
        }
        Insert: {
          account_type: string
          admin_id: string
          created_date?: string | null
          id?: number
          limit_amount: number
          user_id?: number | null
        }
        Update: {
          account_type?: string
          admin_id?: string
          created_date?: string | null
          id?: number
          limit_amount?: number
          user_id?: number | null
        }
        Relationships: []
      }
      acc_portal_pettycash_users: {
        Row: {
          created_at: string | null
          data: Json
          id: number
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: number
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: number
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_supplier_documents: {
        Row: {
          balance_verification: boolean | null
          closing_balance: number | null
          company_id: number | null
          created_at: string | null
          document_type: string | null
          file_path: string | null
          id: number
          original_filename: string | null
          period_from: string | null
          period_to: string | null
          supplier_id: number | null
          updated_at: string | null
          upload_date: string | null
          userid: string | null
          verification_status: boolean | null
        }
        Insert: {
          balance_verification?: boolean | null
          closing_balance?: number | null
          company_id?: number | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          id?: number
          original_filename?: string | null
          period_from?: string | null
          period_to?: string | null
          supplier_id?: number | null
          updated_at?: string | null
          upload_date?: string | null
          userid?: string | null
          verification_status?: boolean | null
        }
        Update: {
          balance_verification?: boolean | null
          closing_balance?: number | null
          company_id?: number | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          id?: number
          original_filename?: string | null
          period_from?: string | null
          period_to?: string | null
          supplier_id?: number | null
          updated_at?: string | null
          upload_date?: string | null
          userid?: string | null
          verification_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_supplier_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_portal_supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_suppliers_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_portal_suppliers: {
        Row: {
          company_name: string | null
          created_at: string | null
          data: Json | null
          id: number
          status: string | null
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          data?: Json | null
          id?: never
          status?: string | null
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          data?: Json | null
          id?: never
          status?: string | null
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      acc_portal_suppliers_duplicate: {
        Row: {
          accountant_name: string | null
          company_id: number | null
          company_name: string | null
          country_name: string | null
          created_at: string | null
          credit_limit: number | null
          credit_terms: string | null
          currency: string | null
          exp_cat: string | null
          frequency: string | null
          id: number
          off_email: string | null
          off_mobile: string | null
          personal_mobile: string | null
          pin_no: string | null
          residence: string | null
          supplier_name_as_per_pin: string | null
          supplier_name_as_per_qb: string | null
          supplier_status: string | null
          type: string | null
          updated_at: string | null
          userid: string | null
          valid_from: string | null
          valid_to: string | null
          verification: string | null
          wh_cat: string | null
          wh_tax_percent: number | null
          wh_vat: string | null
        }
        Insert: {
          accountant_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: string | null
          currency?: string | null
          exp_cat?: string | null
          frequency?: string | null
          id?: number
          off_email?: string | null
          off_mobile?: string | null
          personal_mobile?: string | null
          pin_no?: string | null
          residence?: string | null
          supplier_name_as_per_pin?: string | null
          supplier_name_as_per_qb?: string | null
          supplier_status?: string | null
          type?: string | null
          updated_at?: string | null
          userid?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verification?: string | null
          wh_cat?: string | null
          wh_tax_percent?: number | null
          wh_vat?: string | null
        }
        Update: {
          accountant_name?: string | null
          company_id?: number | null
          company_name?: string | null
          country_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: string | null
          currency?: string | null
          exp_cat?: string | null
          frequency?: string | null
          id?: number
          off_email?: string | null
          off_mobile?: string | null
          personal_mobile?: string | null
          pin_no?: string | null
          residence?: string | null
          supplier_name_as_per_pin?: string | null
          supplier_name_as_per_qb?: string | null
          supplier_status?: string | null
          type?: string | null
          updated_at?: string | null
          userid?: string | null
          valid_from?: string | null
          valid_to?: string | null
          verification?: string | null
          wh_cat?: string | null
          wh_tax_percent?: number | null
          wh_vat?: string | null
        }
        Relationships: []
      }
      acc_portal_supplierss: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          id_number: string | null
          mobile: string | null
          pin: string | null
          status: string | null
          supplier_name: string | null
          supplier_type: string | null
          trading_type: string | null
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          id_number?: string | null
          mobile?: string | null
          pin?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_type?: string | null
          trading_type?: string | null
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          id_number?: string | null
          mobile?: string | null
          pin?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_type?: string | null
          trading_type?: string | null
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      acc_portal_tickets: {
        Row: {
          category: string | null
          client_name: string | null
          date_submitted: string | null
          description: string | null
          id: number
          priority: string | null
          product_service: string | null
          status: string | null
          subject: string
          task_manager: string | null
          userid: string | null
        }
        Insert: {
          category?: string | null
          client_name?: string | null
          date_submitted?: string | null
          description?: string | null
          id?: number
          priority?: string | null
          product_service?: string | null
          status?: string | null
          subject: string
          task_manager?: string | null
          userid?: string | null
        }
        Update: {
          category?: string | null
          client_name?: string | null
          date_submitted?: string | null
          description?: string | null
          id?: number
          priority?: string | null
          product_service?: string | null
          status?: string | null
          subject?: string
          task_manager?: string | null
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_portal_tickets_task_manager_fkey"
            columns: ["task_manager"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_conversations: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      AutomationStatus: {
        Row: {
          id: string
          last_updated: string | null
          logs: Json | null
          progress: number
          status: string
        }
        Insert: {
          id: string
          last_updated?: string | null
          logs?: Json | null
          progress?: number
          status: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          logs?: Json | null
          progress?: number
          status?: string
        }
        Relationships: []
      }
      Autopopulate: {
        Row: {
          company_name: string
          created_at: string | null
          extractions: Json | null
          id: number
          kra_itax_current_password: string | null
          kra_pin: string | null
          last_error: string | null
          last_updated: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          extractions?: Json | null
          id?: never
          kra_itax_current_password?: string | null
          kra_pin?: string | null
          last_error?: string | null
          last_updated?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          extractions?: Json | null
          id?: never
          kra_itax_current_password?: string | null
          kra_pin?: string | null
          last_error?: string | null
          last_updated?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      AutoPopulation_AutomationProgress: {
        Row: {
          current_company: string | null
          id: number
          last_updated: string | null
          progress: number | null
          status: string | null
        }
        Insert: {
          current_company?: string | null
          id: number
          last_updated?: string | null
          progress?: number | null
          status?: string | null
        }
        Update: {
          current_company?: string | null
          id?: number
          last_updated?: string | null
          progress?: number | null
          status?: string | null
        }
        Relationships: []
      }
      brs_ecitizen_credentials: {
        Row: {
          company_name: string | null
          director_name: string | null
          ecitizen_id_number: string
          ecitizen_password: string | null
        }
        Insert: {
          company_name?: string | null
          director_name?: string | null
          ecitizen_id_number: string
          ecitizen_password?: string | null
        }
        Update: {
          company_name?: string | null
          director_name?: string | null
          ecitizen_id_number?: string
          ecitizen_password?: string | null
        }
        Relationships: []
      }
      category_table_mappings: {
        Row: {
          category: string
          column_mappings: Json | null
          column_settings: Json | null
          created_at: string | null
          id: number
          section: string | null
          subcategory: string
          table_name: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          column_mappings?: Json | null
          column_settings?: Json | null
          created_at?: string | null
          id?: never
          section?: string | null
          subcategory: string
          table_name?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          column_mappings?: Json | null
          column_settings?: Json | null
          created_at?: string | null
          id?: never
          section?: string | null
          subcategory?: string
          table_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist: {
        Row: {
          company_name: string
          created_at: string | null
          file_management: Json | null
          forward_tracking: Json | null
          id: string
          kra_pin: string | null
          taxes: Json | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          file_management?: Json | null
          forward_tracking?: Json | null
          id?: string
          kra_pin?: string | null
          taxes?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          file_management?: Json | null
          forward_tracking?: Json | null
          id?: string
          kra_pin?: string | null
          taxes?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_backup: {
        Row: {
          company_name: string
          created_at: string | null
          file_management: Json | null
          forward_tracking: Json | null
          id: string
          kra_pin: string | null
          taxes: Json | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          file_management?: Json | null
          forward_tracking?: Json | null
          id?: string
          kra_pin?: string | null
          taxes?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          file_management?: Json | null
          forward_tracking?: Json | null
          id?: string
          kra_pin?: string | null
          taxes?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_duplicate: {
        Row: {
          checklist_name: string
          column_visibility: Json | null
        }
        Insert: {
          checklist_name: string
          column_visibility?: Json | null
        }
        Update: {
          checklist_name?: string
          column_visibility?: Json | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          client_accountant: string | null
          company_id: number
          contact_details: string | null
          email: string | null
          monthly_docs_submission_by_clients: string | null
          monthly_downloads_by_bcl: string | null
          monthly_report_sending_to_clients: string | null
          monthly_summaries_submission_by_clients: string | null
          name: string
          phone_number: string | null
          registration_date: string | null
          status: string | null
          tax_submission_checklist: string | null
          type: string | null
        }
        Insert: {
          client_accountant?: string | null
          company_id?: number
          contact_details?: string | null
          email?: string | null
          monthly_docs_submission_by_clients?: string | null
          monthly_downloads_by_bcl?: string | null
          monthly_report_sending_to_clients?: string | null
          monthly_summaries_submission_by_clients?: string | null
          name: string
          phone_number?: string | null
          registration_date?: string | null
          status?: string | null
          tax_submission_checklist?: string | null
          type?: string | null
        }
        Update: {
          client_accountant?: string | null
          company_id?: number
          contact_details?: string | null
          email?: string | null
          monthly_docs_submission_by_clients?: string | null
          monthly_downloads_by_bcl?: string | null
          monthly_report_sending_to_clients?: string | null
          monthly_summaries_submission_by_clients?: string | null
          name?: string
          phone_number?: string | null
          registration_date?: string | null
          status?: string | null
          tax_submission_checklist?: string | null
          type?: string | null
        }
        Relationships: []
      }
      companies_documents: {
        Row: {
          balance_sheets: boolean | null
          bank_slips: boolean | null
          bank_statements: boolean | null
          certificate_of_incorporation: boolean | null
          company_id: number
          cr12: boolean | null
          document_id: number | null
          etr_monthly_reports: boolean | null
          fire_license: boolean | null
          id: number
          insurance: boolean | null
          kra_pin: boolean | null
          lease_agreement: boolean | null
          purchase: boolean | null
          sbp: boolean | null
          tax_returns: boolean | null
        }
        Insert: {
          balance_sheets?: boolean | null
          bank_slips?: boolean | null
          bank_statements?: boolean | null
          certificate_of_incorporation?: boolean | null
          company_id: number
          cr12?: boolean | null
          document_id?: number | null
          etr_monthly_reports?: boolean | null
          fire_license?: boolean | null
          id?: number
          insurance?: boolean | null
          kra_pin?: boolean | null
          lease_agreement?: boolean | null
          purchase?: boolean | null
          sbp?: boolean | null
          tax_returns?: boolean | null
        }
        Update: {
          balance_sheets?: boolean | null
          bank_slips?: boolean | null
          bank_statements?: boolean | null
          certificate_of_incorporation?: boolean | null
          company_id?: number
          cr12?: boolean | null
          document_id?: number | null
          etr_monthly_reports?: boolean | null
          fire_license?: boolean | null
          id?: number
          insurance?: boolean | null
          kra_pin?: boolean | null
          lease_agreement?: boolean | null
          purchase?: boolean | null
          sbp?: boolean | null
          tax_returns?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "companies_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      companies_duplicate: {
        Row: {
          client_accountant: string | null
          company_id: number
          contact_details: string | null
          email: string | null
          monthly_docs_submission_by_clients: string | null
          monthly_downloads_by_bcl: string | null
          monthly_report_sending_to_clients: string | null
          monthly_summaries_submission_by_clients: string | null
          name: string
          phone_number: string | null
          registration_date: string | null
          status: string | null
          tax_submission_checklist: string | null
          type: string | null
        }
        Insert: {
          client_accountant?: string | null
          company_id?: number
          contact_details?: string | null
          email?: string | null
          monthly_docs_submission_by_clients?: string | null
          monthly_downloads_by_bcl?: string | null
          monthly_report_sending_to_clients?: string | null
          monthly_summaries_submission_by_clients?: string | null
          name: string
          phone_number?: string | null
          registration_date?: string | null
          status?: string | null
          tax_submission_checklist?: string | null
          type?: string | null
        }
        Update: {
          client_accountant?: string | null
          company_id?: number
          contact_details?: string | null
          email?: string | null
          monthly_docs_submission_by_clients?: string | null
          monthly_downloads_by_bcl?: string | null
          monthly_report_sending_to_clients?: string | null
          monthly_summaries_submission_by_clients?: string | null
          name?: string
          phone_number?: string | null
          registration_date?: string | null
          status?: string | null
          tax_submission_checklist?: string | null
          type?: string | null
        }
        Relationships: []
      }
      company_form_links: {
        Row: {
          company_id: number
          configuration_id: number | null
          created_at: string | null
          expires_at: string | null
          id: number
          previous_link_id: string | null
          status: string
          submitted_data: Json | null
          template_id: number | null
          unique_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: number
          configuration_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: number
          previous_link_id?: string | null
          status?: string
          submitted_data?: Json | null
          template_id?: number | null
          unique_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: number
          configuration_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: number
          previous_link_id?: string | null
          status?: string
          submitted_data?: Json | null
          template_id?: number | null
          unique_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_form_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_form_links_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "form_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_form_links_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_template_id"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      company_MAIN: {
        Row: {
          acc_clients: string | null
          accounting_billing_clients: string | null
          accounting_upar_clients: string | null
          audit_tax_clients: string | null
          business_commencement_date: string | null
          business_reg_cert_no: string | null
          business_reg_date: string | null
          company_name: string
          cps_sheria_clients: string | null
          created_at: string | null
          formation_type: string | null
          id: number
          imm_clients: string | null
          itax_gmail_recovery_email: string | null
          itax_gmail_recovery_mobile: string | null
          kra_itax_current_password: string | null
          kra_itax_password_last_checked_comments: string | null
          kra_itax_password_last_checked_date: string | null
          kra_pin: string | null
          main_email_address: string | null
          mobile_number: string | null
          operational_status: string | null
          po_box: string | null
          postal_code: string | null
          principal_physical_address: string | null
          town: string | null
          updated_at: string | null
        }
        Insert: {
          acc_clients?: string | null
          accounting_billing_clients?: string | null
          accounting_upar_clients?: string | null
          audit_tax_clients?: string | null
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name: string
          cps_sheria_clients?: string | null
          created_at?: string | null
          formation_type?: string | null
          id?: never
          imm_clients?: string | null
          itax_gmail_recovery_email?: string | null
          itax_gmail_recovery_mobile?: string | null
          kra_itax_current_password?: string | null
          kra_itax_password_last_checked_comments?: string | null
          kra_itax_password_last_checked_date?: string | null
          kra_pin?: string | null
          main_email_address?: string | null
          mobile_number?: string | null
          operational_status?: string | null
          po_box?: string | null
          postal_code?: string | null
          principal_physical_address?: string | null
          town?: string | null
          updated_at?: string | null
        }
        Update: {
          acc_clients?: string | null
          accounting_billing_clients?: string | null
          accounting_upar_clients?: string | null
          audit_tax_clients?: string | null
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name?: string
          cps_sheria_clients?: string | null
          created_at?: string | null
          formation_type?: string | null
          id?: never
          imm_clients?: string | null
          itax_gmail_recovery_email?: string | null
          itax_gmail_recovery_mobile?: string | null
          kra_itax_current_password?: string | null
          kra_itax_password_last_checked_comments?: string | null
          kra_itax_password_last_checked_date?: string | null
          kra_pin?: string | null
          main_email_address?: string | null
          mobile_number?: string | null
          operational_status?: string | null
          po_box?: string | null
          postal_code?: string | null
          principal_physical_address?: string | null
          town?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_MAIN2: {
        Row: {
          acc_clients: string | null
          accounting_billing_clients: string | null
          accounting_upar_clients: string | null
          audit_tax_clients: string | null
          business_commencement_date: string | null
          business_reg_cert_no: string | null
          business_reg_date: string | null
          company_name: string
          cps_sheria_clients: string | null
          created_at: string | null
          formation_type: string | null
          id: number
          imm_clients: string | null
          is_wh_agent: string | null
          itax_gmail_recovery_email: string | null
          itax_gmail_recovery_mobile: string | null
          kra_itax_current_password: string | null
          kra_itax_password_last_checked_comments: string | null
          kra_itax_password_last_checked_date: string | null
          kra_pin: string | null
          main_email_address: string | null
          mobile_number: string | null
          operational_status: string | null
          po_box: string | null
          postal_code: string | null
          principal_physical_address: string | null
          town: string | null
          updated_at: string | null
        }
        Insert: {
          acc_clients?: string | null
          accounting_billing_clients?: string | null
          accounting_upar_clients?: string | null
          audit_tax_clients?: string | null
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name: string
          cps_sheria_clients?: string | null
          created_at?: string | null
          formation_type?: string | null
          id?: never
          imm_clients?: string | null
          is_wh_agent?: string | null
          itax_gmail_recovery_email?: string | null
          itax_gmail_recovery_mobile?: string | null
          kra_itax_current_password?: string | null
          kra_itax_password_last_checked_comments?: string | null
          kra_itax_password_last_checked_date?: string | null
          kra_pin?: string | null
          main_email_address?: string | null
          mobile_number?: string | null
          operational_status?: string | null
          po_box?: string | null
          postal_code?: string | null
          principal_physical_address?: string | null
          town?: string | null
          updated_at?: string | null
        }
        Update: {
          acc_clients?: string | null
          accounting_billing_clients?: string | null
          accounting_upar_clients?: string | null
          audit_tax_clients?: string | null
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name?: string
          cps_sheria_clients?: string | null
          created_at?: string | null
          formation_type?: string | null
          id?: never
          imm_clients?: string | null
          is_wh_agent?: string | null
          itax_gmail_recovery_email?: string | null
          itax_gmail_recovery_mobile?: string | null
          kra_itax_current_password?: string | null
          kra_itax_password_last_checked_comments?: string | null
          kra_itax_password_last_checked_date?: string | null
          kra_pin?: string | null
          main_email_address?: string | null
          mobile_number?: string | null
          operational_status?: string | null
          po_box?: string | null
          postal_code?: string | null
          principal_physical_address?: string | null
          town?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_payroll_records: {
        Row: {
          company_id: number | null
          created_at: string | null
          documents: Json | null
          id: string
          number_of_employees: number | null
          payment_receipts_documents: Json | null
          payment_receipts_extractions: Json | null
          payment_slips_documents: Json | null
          payment_slips_extractions: Json | null
          payment_slips_status: Json | null
          payroll_cycle_id: string | null
          receipts_status: Json | null
          status: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          number_of_employees?: number | null
          payment_receipts_documents?: Json | null
          payment_receipts_extractions?: Json | null
          payment_slips_documents?: Json | null
          payment_slips_extractions?: Json | null
          payment_slips_status?: Json | null
          payroll_cycle_id?: string | null
          receipts_status?: Json | null
          status?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          number_of_employees?: number | null
          payment_receipts_documents?: Json | null
          payment_receipts_extractions?: Json | null
          payment_slips_documents?: Json | null
          payment_slips_extractions?: Json | null
          payment_slips_status?: Json | null
          payroll_cycle_id?: string | null
          receipts_status?: Json | null
          status?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_payroll_records_duplicate_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      company_payroll_records_duplicate: {
        Row: {
          company_id: number | null
          created_at: string | null
          documents: Json | null
          id: string
          number_of_employees: number | null
          payment_receipts_documents: Json | null
          payment_receipts_extractions: Json | null
          payment_slips_documents: Json | null
          payment_slips_extractions: Json | null
          payment_slips_status: Json | null
          payroll_cycle_id: string | null
          receipts_status: Json | null
          status: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          number_of_employees?: number | null
          payment_receipts_documents?: Json | null
          payment_receipts_extractions?: Json | null
          payment_slips_documents?: Json | null
          payment_slips_extractions?: Json | null
          payment_slips_status?: Json | null
          payroll_cycle_id?: string | null
          receipts_status?: Json | null
          status?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          number_of_employees?: number | null
          payment_receipts_documents?: Json | null
          payment_receipts_extractions?: Json | null
          payment_slips_documents?: Json | null
          payment_slips_extractions?: Json | null
          payment_slips_status?: Json | null
          payroll_cycle_id?: string | null
          receipts_status?: Json | null
          status?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_payroll_records_duplicate_company_id_fkey1"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      companycredentials: {
        Row: {
          company_id: number
          company_name: string
          company_start_date: string | null
          current_itax_password: string
          kra_password_status: string
          kra_password_status_check: string | null
          kra_pin_no: string
        }
        Insert: {
          company_id?: number
          company_name: string
          company_start_date?: string | null
          current_itax_password: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no: string
        }
        Update: {
          company_id?: number
          company_name?: string
          company_start_date?: string | null
          current_itax_password?: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no?: string
        }
        Relationships: []
      }
      companycredentials_inactive: {
        Row: {
          company_id: number
          company_name: string
          company_start_date: string | null
          current_itax_password: string
          kra_password_status: string
          kra_password_status_check: string | null
          kra_pin_no: string
        }
        Insert: {
          company_id?: number
          company_name: string
          company_start_date?: string | null
          current_itax_password: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no: string
        }
        Update: {
          company_id?: number
          company_name?: string
          company_start_date?: string | null
          current_itax_password?: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no?: string
        }
        Relationships: []
      }
      companyMainList: {
        Row: {
          category: string | null
          company_name: string
          created_at: string | null
          id: number
          is_locked: boolean | null
          kra_password: string | null
          kra_pin: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_name: string
          created_at?: string | null
          id: number
          is_locked?: boolean | null
          kra_password?: string | null
          kra_pin: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_name?: string
          created_at?: string | null
          id?: number
          is_locked?: boolean | null
          kra_password?: string | null
          kra_pin?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cricket_attendees: {
        Row: {
          checked_in: string | null
          event_id: number
          id: number
          player_name: string
          status: string | null
          strike_rate: number | null
          userid: string | null
        }
        Insert: {
          checked_in?: string | null
          event_id: number
          id?: number
          player_name: string
          status?: string | null
          strike_rate?: number | null
          userid?: string | null
        }
        Update: {
          checked_in?: string | null
          event_id?: number
          id?: number
          player_name?: string
          status?: string | null
          strike_rate?: number | null
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cricket_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cricket_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_player"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "cricket_players"
            referencedColumns: ["userid"]
          },
        ]
      }
      cricket_events: {
        Row: {
          application_deadline: string | null
          cancel_reason: string | null
          confirmed: string | null
          date: string
          id: number
          isCancelled: boolean | null
          isCustom: string | null
          location: string
          title: string
        }
        Insert: {
          application_deadline?: string | null
          cancel_reason?: string | null
          confirmed?: string | null
          date: string
          id?: number
          isCancelled?: boolean | null
          isCustom?: string | null
          location: string
          title: string
        }
        Update: {
          application_deadline?: string | null
          cancel_reason?: string | null
          confirmed?: string | null
          date?: string
          id?: number
          isCancelled?: boolean | null
          isCustom?: string | null
          location?: string
          title?: string
        }
        Relationships: []
      }
      cricket_players: {
        Row: {
          blood_group: string | null
          email: string | null
          fcm_token: string | null
          id: number
          joining_date: string | null
          name: string | null
          phonenumber: string | null
          status: string | null
          userid: string | null
        }
        Insert: {
          blood_group?: string | null
          email?: string | null
          fcm_token?: string | null
          id?: number
          joining_date?: string | null
          name?: string | null
          phonenumber?: string | null
          status?: string | null
          userid?: string | null
        }
        Update: {
          blood_group?: string | null
          email?: string | null
          fcm_token?: string | null
          id?: number
          joining_date?: string | null
          name?: string | null
          phonenumber?: string | null
          status?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      cricket_transactions: {
        Row: {
          amount: number
          code: string
          date: string
          frequency: string
          id: number
          period: string
          playerId: number | null
          status: string
          year: string | null
        }
        Insert: {
          amount: number
          code: string
          date: string
          frequency: string
          id?: number
          period: string
          playerId?: number | null
          status?: string
          year?: string | null
        }
        Update: {
          amount?: number
          code?: string
          date?: string
          frequency?: string
          id?: number
          period?: string
          playerId?: number | null
          status?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cricket_transactions_playerid_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "cricket_players"
            referencedColumns: ["id"]
          },
        ]
      }
      default_positions: {
        Row: {
          id: number
          position: string
        }
        Insert: {
          id?: number
          position: string
        }
        Update: {
          id?: number
          position?: string
        }
        Relationships: []
      }
      directors: {
        Row: {
          company_id: number | null
          contact_details: string | null
          director_id: number
          email: string | null
          kra_login: string | null
          kra_pin: string | null
          name: string
          phone_number: string | null
          position: string | null
        }
        Insert: {
          company_id?: number | null
          contact_details?: string | null
          director_id?: number
          email?: string | null
          kra_login?: string | null
          kra_pin?: string | null
          name: string
          phone_number?: string | null
          position?: string | null
        }
        Update: {
          company_id?: number | null
          contact_details?: string | null
          director_id?: number
          email?: string | null
          kra_login?: string | null
          kra_pin?: string | null
          name?: string
          phone_number?: string | null
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      directors_credentials: {
        Row: {
          company_name: string | null
          director_name: string
          individual_kra_pin: string | null
          kra_password: string | null
        }
        Insert: {
          company_name?: string | null
          director_name: string
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Update: {
          company_name?: string | null
          director_name?: string
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Relationships: []
      }
      directors_credentials_duplicate: {
        Row: {
          company_name: string | null
          director_name: string | null
          individual_kra_pin: string | null
          kra_password: string | null
        }
        Insert: {
          company_name?: string | null
          director_name?: string | null
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Update: {
          company_name?: string | null
          director_name?: string | null
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Relationships: []
      }
      directors_credentials_rerun_2: {
        Row: {
          company_name: string | null
          director_name: string
          individual_kra_pin: string | null
          kra_password: string | null
        }
        Insert: {
          company_name?: string | null
          director_name: string
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Update: {
          company_name?: string | null
          director_name?: string
          individual_kra_pin?: string | null
          kra_password?: string | null
        }
        Relationships: []
      }
      doc_scanner: {
        Row: {
          amount: number | null
          company_id: number | null
          created_at: string | null
          document_date: string | null
          document_image_url: string | null
          document_number: string | null
          document_type: string
          extracted_data: Json | null
          id: number
          qr_code_data: string | null
          status: string | null
          tax_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_id?: number | null
          created_at?: string | null
          document_date?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type: string
          extracted_data?: Json | null
          id?: number
          qr_code_data?: string | null
          status?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: number | null
          created_at?: string | null
          document_date?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string
          extracted_data?: Json | null
          id?: number
          qr_code_data?: string | null
          status?: string | null
          tax_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_scanner_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_company_duplicate"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          document_extension: string
          document_id: number
          document_name: string
          document_path: string
          document_size: number
          document_type: string
          upload_date: string | null
        }
        Insert: {
          document_extension: string
          document_id?: number
          document_name: string
          document_path: string
          document_size: number
          document_type: string
          upload_date?: string | null
        }
        Update: {
          document_extension?: string
          document_id?: number
          document_name?: string
          document_path?: string
          document_size?: number
          document_type?: string
          upload_date?: string | null
        }
        Relationships: []
      }
      dropdown_settings: {
        Row: {
          category_name: string
          created_at: string | null
          display_order: number
          id: number
          is_visible: boolean
          options: Json
          updated_at: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          display_order?: number
          id?: number
          is_visible?: boolean
          options?: Json
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          display_order?: number
          id?: number
          is_visible?: boolean
          options?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ecitizen_companies: {
        Row: {
          company_name: string
          created_at: string | null
          director: string | null
          ecitizen_identifier: string
          ecitizen_password: string
          ecitizen_status: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          director?: string | null
          ecitizen_identifier: string
          ecitizen_password: string
          ecitizen_status?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          director?: string | null
          ecitizen_identifier?: string
          ecitizen_password?: string
          ecitizen_status?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          label: string | null
          last_sync: string | null
          last_token_refresh: string | null
          refresh_token: string | null
          status: string | null
          token: Json
          token_expiry: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          label?: string | null
          last_sync?: string | null
          last_token_refresh?: string | null
          refresh_token?: string | null
          status?: string | null
          token: Json
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          label?: string | null
          last_sync?: string | null
          last_token_refresh?: string | null
          refresh_token?: string | null
          status?: string | null
          token?: Json
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_filters: {
        Row: {
          color: string | null
          conditions: Json
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          conditions: Json
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          conditions?: Json
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      etims_companies_duplicate: {
        Row: {
          company_name: string | null
          created_at: string | null
          etims_cert_incorporation: string | null
          etims_comment: string | null
          etims_current_director_pin: string | null
          etims_director_pin: string | null
          etims_email: string | null
          etims_mobile: string | null
          etims_operator_id_number: string | null
          etims_operator_name: string | null
          etims_password: string | null
          etims_pin: string | null
          etims_reg_doc_number: string | null
          etims_status: string | null
          etims_username: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          etims_cert_incorporation?: string | null
          etims_comment?: string | null
          etims_current_director_pin?: string | null
          etims_director_pin?: string | null
          etims_email?: string | null
          etims_mobile?: string | null
          etims_operator_id_number?: string | null
          etims_operator_name?: string | null
          etims_password?: string | null
          etims_pin?: string | null
          etims_reg_doc_number?: string | null
          etims_status?: string | null
          etims_username?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          etims_cert_incorporation?: string | null
          etims_comment?: string | null
          etims_current_director_pin?: string | null
          etims_director_pin?: string | null
          etims_email?: string | null
          etims_mobile?: string | null
          etims_operator_id_number?: string | null
          etims_operator_name?: string | null
          etims_password?: string | null
          etims_pin?: string | null
          etims_reg_doc_number?: string | null
          etims_status?: string | null
          etims_username?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          bcl_attendee: string | null
          bcl_attendee_mobile: number | null
          booking_date: string | null
          booking_day: string | null
          client_company: string | null
          client_mobile: string | null
          client_name: string | null
          google_event_id: string | null
          id: number
          meeting_agenda: string | null
          meeting_date: string | null
          meeting_day: string | null
          meeting_duration: number | null
          meeting_end_time: string | null
          meeting_slot_end_time: string | null
          meeting_slot_start_time: string | null
          meeting_start_time: string | null
          meeting_type: string | null
          meeting_venue_area: string | null
          status: string | null
          venue_distance: number | null
        }
        Insert: {
          bcl_attendee?: string | null
          bcl_attendee_mobile?: number | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          id: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Update: {
          bcl_attendee?: string | null
          bcl_attendee_mobile?: number | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          id?: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          created_at: string | null
          display_name: string | null
          field_name: string
          field_type: string | null
          id: number
          settings: Json | null
          source_table: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          field_name: string
          field_type?: string | null
          id?: never
          settings?: Json | null
          source_table: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          field_name?: string
          field_type?: string | null
          id?: never
          settings?: Json | null
          source_table?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      form_configurations: {
        Row: {
          created_at: string | null
          id: number
          name: string
          sections: Json
          template_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          sections: Json
          template_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          sections?: Json
          template_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_configurations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          schema: Json
          type: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          schema: Json
          type: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          schema?: Json
          type?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      indian_high_commission: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      james_testing: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kebs_companies: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "kra gmail_companies": {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "kra gmail_individuals": {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kra_contact_details: {
        Row: {
          acc_manager_email: string | null
          acc_manager_email_date: string | null
          acc_manager_name: string | null
          acc_manager_off_mobile: string | null
          acc_manager_personal_mobile: string | null
          acc_manager_position: string | null
          acc_manager_status: string | null
          acc_manager_to: string | null
          acc_manager_wef: string | null
          bcl_acc_manager_name: string | null
          company_name: string | null
          id: number
          is_verified: string | null
          kra_password: string | null
          kra_pin: string | null
          kra_station: string | null
          sector_manager_company_mobile: string | null
          sector_manager_email: string | null
          sector_manager_name: string | null
          sector_manager_personal_mobile: string | null
          sector_manager_status: string | null
          sector_manager_to: string | null
          sector_manager_wef: string | null
          team_lead_company_mobile: string | null
          team_lead_email: string | null
          team_lead_name: string | null
          team_lead_personal_mobile: string | null
          team_lead_status: string | null
          team_lead_to: string | null
          team_lead_wef: string | null
          verification_data: string | null
        }
        Insert: {
          acc_manager_email?: string | null
          acc_manager_email_date?: string | null
          acc_manager_name?: string | null
          acc_manager_off_mobile?: string | null
          acc_manager_personal_mobile?: string | null
          acc_manager_position?: string | null
          acc_manager_status?: string | null
          acc_manager_to?: string | null
          acc_manager_wef?: string | null
          bcl_acc_manager_name?: string | null
          company_name?: string | null
          id?: never
          is_verified?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          kra_station?: string | null
          sector_manager_company_mobile?: string | null
          sector_manager_email?: string | null
          sector_manager_name?: string | null
          sector_manager_personal_mobile?: string | null
          sector_manager_status?: string | null
          sector_manager_to?: string | null
          sector_manager_wef?: string | null
          team_lead_company_mobile?: string | null
          team_lead_email?: string | null
          team_lead_name?: string | null
          team_lead_personal_mobile?: string | null
          team_lead_status?: string | null
          team_lead_to?: string | null
          team_lead_wef?: string | null
          verification_data?: string | null
        }
        Update: {
          acc_manager_email?: string | null
          acc_manager_email_date?: string | null
          acc_manager_name?: string | null
          acc_manager_off_mobile?: string | null
          acc_manager_personal_mobile?: string | null
          acc_manager_position?: string | null
          acc_manager_status?: string | null
          acc_manager_to?: string | null
          acc_manager_wef?: string | null
          bcl_acc_manager_name?: string | null
          company_name?: string | null
          id?: never
          is_verified?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          kra_station?: string | null
          sector_manager_company_mobile?: string | null
          sector_manager_email?: string | null
          sector_manager_name?: string | null
          sector_manager_personal_mobile?: string | null
          sector_manager_status?: string | null
          sector_manager_to?: string | null
          sector_manager_wef?: string | null
          team_lead_company_mobile?: string | null
          team_lead_email?: string | null
          team_lead_name?: string | null
          team_lead_personal_mobile?: string | null
          team_lead_status?: string | null
          team_lead_to?: string | null
          team_lead_wef?: string | null
          verification_data?: string | null
        }
        Relationships: []
      }
      kra_directors: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kra_slips_documents: {
        Row: {
          created_at: string | null
          file_type: string
          id: string
          name: string
          size: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_type: string
          id?: string
          name: string
          size?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string
          id?: string
          name?: string
          size?: number | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kra_slips_extraction_results: {
        Row: {
          created_at: string | null
          document_name: string | null
          document_url: string | null
          id: string
          results: Json | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          results?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          results?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kra_slips_extraction_results_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kra_slips_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      kra_slips_fields: {
        Row: {
          created_at: string | null
          data_type: string
          extraction_criteria: string | null
          id: string
          name: string
          parent: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          extraction_criteria?: string | null
          id?: string
          name: string
          parent?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          extraction_criteria?: string | null
          id?: string
          name?: string
          parent?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kra_slips_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "kra_slips_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      kra_slips_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ledger_extractions: {
        Row: {
          company_name: string | null
          created_at: string | null
          error_message: string | null
          extraction_date: string | null
          id: number
          ledger_data: Json | null
          progress: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          error_message?: string | null
          extraction_date?: string | null
          id?: never
          ledger_data?: Json | null
          progress?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          error_message?: string | null
          extraction_date?: string | null
          id?: never
          ledger_data?: Json | null
          progress?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ledger_extractions_history: {
        Row: {
          company_name: string
          created_at: string | null
          extraction_date: string
          id: number
          ledger_data: Json
        }
        Insert: {
          company_name: string
          created_at?: string | null
          extraction_date: string
          id?: number
          ledger_data: Json
        }
        Update: {
          company_name?: string
          created_at?: string | null
          extraction_date?: string
          id?: number
          ledger_data?: Json
        }
        Relationships: []
      }
      liability_extractions: {
        Row: {
          company_name: string | null
          created_at: string | null
          error_message: Json | null
          extraction_date: string | null
          id: number
          liability_data: Json | null
          progress: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          error_message?: Json | null
          extraction_date?: string | null
          id?: never
          liability_data?: Json | null
          progress?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          error_message?: Json | null
          extraction_date?: string | null
          id?: never
          liability_data?: Json | null
          progress?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      liability_extractions_history: {
        Row: {
          company_name: string
          created_at: string | null
          error_message: Json | null
          extraction_date: string
          id: number
          liability_data: Json
        }
        Insert: {
          company_name: string
          created_at?: string | null
          error_message?: Json | null
          extraction_date: string
          id?: number
          liability_data: Json
        }
        Update: {
          company_name?: string
          created_at?: string | null
          error_message?: Json | null
          extraction_date?: string
          id?: number
          liability_data?: Json
        }
        Relationships: []
      }
      ManufacturersDetails: {
        Row: {
          business_commencement_date: string | null
          business_reg_cert_no: string | null
          business_reg_date: string | null
          company_name: string | null
          desc_addr: string | null
          error: string | null
          id: number
          kra_pin: string | null
          last_checked_at: string | null
          main_email_address: string | null
          manufacturer_name: string | null
          mobile_number: string | null
          po_box: string | null
          postal_code: string | null
          town: string | null
        }
        Insert: {
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name?: string | null
          desc_addr?: string | null
          error?: string | null
          id?: number
          kra_pin?: string | null
          last_checked_at?: string | null
          main_email_address?: string | null
          manufacturer_name?: string | null
          mobile_number?: string | null
          po_box?: string | null
          postal_code?: string | null
          town?: string | null
        }
        Update: {
          business_commencement_date?: string | null
          business_reg_cert_no?: string | null
          business_reg_date?: string | null
          company_name?: string | null
          desc_addr?: string | null
          error?: string | null
          id?: number
          kra_pin?: string | null
          last_checked_at?: string | null
          main_email_address?: string | null
          manufacturer_name?: string | null
          mobile_number?: string | null
          po_box?: string | null
          postal_code?: string | null
          town?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          badge_status: string | null
          bcl_attendee: string | null
          bcl_attendee_mobile: string | null
          booking_date: string | null
          booking_day: string | null
          client_company: string | null
          client_mobile: string | null
          client_name: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id_main: number
          meeting_agenda: string | null
          meeting_date: string | null
          meeting_day: string | null
          meeting_duration: number | null
          meeting_end_time: string | null
          meeting_slot_end_time: string | null
          meeting_slot_start_time: string | null
          meeting_start_time: string | null
          meeting_type: string | null
          meeting_venue_area: string | null
          status: string | null
          venue_distance: number | null
        }
        Insert: {
          badge_status?: string | null
          bcl_attendee?: string | null
          bcl_attendee_mobile?: string | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id_main?: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Update: {
          badge_status?: string | null
          bcl_attendee?: string | null
          bcl_attendee_mobile?: string | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id_main?: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Relationships: []
      }
      meetings_directors_credentials_other: {
        Row: {
          company_name: string | null
          director_name: string
          email: string | null
          individual_kra_pin: string | null
          kra_password: string | null
          mobile_number: string | null
        }
        Insert: {
          company_name?: string | null
          director_name: string
          email?: string | null
          individual_kra_pin?: string | null
          kra_password?: string | null
          mobile_number?: string | null
        }
        Update: {
          company_name?: string | null
          director_name?: string
          email?: string | null
          individual_kra_pin?: string | null
          kra_password?: string | null
          mobile_number?: string | null
        }
        Relationships: []
      }
      meetings_duplicate: {
        Row: {
          badge_status: string | null
          bcl_attendee: string | null
          bcl_attendee_mobile: string | null
          booking_date: string | null
          booking_day: string | null
          client_company: string | null
          client_email: string | null
          client_mobile: string | null
          client_name: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id_main: number
          meeting_agenda: string | null
          meeting_date: string | null
          meeting_day: string | null
          meeting_duration: number | null
          meeting_end_time: string | null
          meeting_slot_end_time: string | null
          meeting_slot_start_time: string | null
          meeting_start_time: string | null
          meeting_type: string | null
          meeting_venue_area: string | null
          status: string | null
          venue_distance: number | null
        }
        Insert: {
          badge_status?: string | null
          bcl_attendee?: string | null
          bcl_attendee_mobile?: string | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id_main?: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Update: {
          badge_status?: string | null
          bcl_attendee?: string | null
          bcl_attendee_mobile?: string | null
          booking_date?: string | null
          booking_day?: string | null
          client_company?: string | null
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id_main?: number
          meeting_agenda?: string | null
          meeting_date?: string | null
          meeting_day?: string | null
          meeting_duration?: number | null
          meeting_end_time?: string | null
          meeting_slot_end_time?: string | null
          meeting_slot_start_time?: string | null
          meeting_start_time?: string | null
          meeting_type?: string | null
          meeting_venue_area?: string | null
          status?: string | null
          venue_distance?: number | null
        }
        Relationships: []
      }
      message_templates_generator: {
        Row: {
          created_at: string | null
          id: number
          template_content: string
          template_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          template_content: string
          template_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          template_content?: string
          template_name?: string
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      newest_table: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      newest_table2: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      nhif_companies: {
        Row: {
          company_name: string
          created_at: string | null
          director: string | null
          email_password: string | null
          id: number
          nhif_code: string | null
          nhif_email: string | null
          nhif_id: string
          nhif_mobile: string | null
          nhif_password: string
          nhif_status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          director?: string | null
          email_password?: string | null
          id?: number
          nhif_code?: string | null
          nhif_email?: string | null
          nhif_id: string
          nhif_mobile?: string | null
          nhif_password: string
          nhif_status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          director?: string | null
          email_password?: string | null
          id?: number
          nhif_code?: string | null
          nhif_email?: string | null
          nhif_id?: string
          nhif_mobile?: string | null
          nhif_password?: string
          nhif_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nssf_companies: {
        Row: {
          company_name: string
          created_at: string | null
          id: number
          identifier: string | null
          nssf_code: string | null
          nssf_compliance_certificate_date: string | null
          nssf_password: string
          nssf_registration_date: string | null
          nssf_status: string | null
          status: string | null
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: number
          identifier?: string | null
          nssf_code?: string | null
          nssf_compliance_certificate_date?: string | null
          nssf_password: string
          nssf_registration_date?: string | null
          nssf_status?: string | null
          status?: string | null
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: number
          identifier?: string | null
          nssf_code?: string | null
          nssf_compliance_certificate_date?: string | null
          nssf_password?: string
          nssf_registration_date?: string | null
          nssf_status?: string | null
          status?: string | null
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      outlook_email_manager_computers: {
        Row: {
          active: boolean | null
          computer_name: string
          created_at: string | null
          id: string
          last_sync: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          computer_name: string
          created_at?: string | null
          id?: string
          last_sync?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          computer_name?: string
          created_at?: string | null
          id?: string
          last_sync?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      outlook_email_manager_emails: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          imap_port: number | null
          imap_server: string | null
          password: string
          smtp_port: number | null
          smtp_server: string | null
          updated_at: string | null
          use_ssl: boolean | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          imap_port?: number | null
          imap_server?: string | null
          password: string
          smtp_port?: number | null
          smtp_server?: string | null
          updated_at?: string | null
          use_ssl?: boolean | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          imap_port?: number | null
          imap_server?: string | null
          password?: string
          smtp_port?: number | null
          smtp_server?: string | null
          updated_at?: string | null
          use_ssl?: boolean | null
        }
        Relationships: []
      }
      outlook_email_manager_profile_emails: {
        Row: {
          created_at: string | null
          email_id: string
          id: string
          is_default: boolean | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          email_id: string
          id?: string
          is_default?: boolean | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          email_id?: string
          id?: string
          is_default?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlook_email_manager_profile_emails_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "outlook_email_manager_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlook_email_manager_profile_emails_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "outlook_email_manager_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outlook_email_manager_profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          profile_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          profile_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          profile_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outlook_email_manager_sync_log: {
        Row: {
          computer_id: string
          created_at: string | null
          details: string | null
          id: string
          status: string | null
          sync_time: string | null
        }
        Insert: {
          computer_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
          sync_time?: string | null
        }
        Update: {
          computer_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
          sync_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outlook_email_manager_sync_log_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "outlook_email_manager_computers"
            referencedColumns: ["id"]
          },
        ]
      }
      PasswordChecker: {
        Row: {
          company_name: string | null
          id: number
          kra_password: string | null
          kra_pin: string | null
          last_checked: string | null
          pin_status: string | null
          status: string | null
          userid: string | null
        }
        Insert: {
          company_name?: string | null
          id?: never
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          pin_status?: string | null
          status?: string | null
          userid?: string | null
        }
        Update: {
          company_name?: string | null
          id?: never
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          pin_status?: string | null
          status?: string | null
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passwordchecker_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "acc_portal_clerk_users"
            referencedColumns: ["userid"]
          },
        ]
      }
      PasswordChecker_AutomationProgress: {
        Row: {
          created_at: string | null
          id: number
          last_updated: string | null
          logs: Json | null
          progress: number | null
          status: string | null
          tab: string
        }
        Insert: {
          created_at?: string | null
          id: number
          last_updated?: string | null
          logs?: Json | null
          progress?: number | null
          status?: string | null
          tab: string
        }
        Update: {
          created_at?: string | null
          id?: number
          last_updated?: string | null
          logs?: Json | null
          progress?: number | null
          status?: string | null
          tab?: string
        }
        Relationships: []
      }
      PasswordChecker_DIrectors: {
        Row: {
          company_name: string | null
          kra_password: string | null
          kra_pin: string | null
          last_checked: string | null
          status: string | null
        }
        Insert: {
          company_name?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          status?: string | null
        }
        Update: {
          company_name?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          status?: string | null
        }
        Relationships: []
      }
      PasswordChecker_duplicate: {
        Row: {
          acc_manager_email: string | null
          acc_manager_email_date: string | null
          acc_manager_mobile: string | null
          acc_manager_name: string | null
          acc_manager_personal_mobile: string | null
          acc_manager_position: string | null
          acc_manager_status: string | null
          acc_manager_to: string | null
          acc_manager_wef: string | null
          annual_income: string | null
          bcl_acc_manager_email: string | null
          bcl_acc_manager_mobile: string | null
          bcl_acc_manager_name: string | null
          bcl_acc_manager_off_mobile: string | null
          bcl_acc_manager_personal_mobile: string | null
          company_name: string | null
          current_itax_gmail_email: string | null
          current_itax_gmail_email_recovery_email: string | null
          current_itax_gmail_email_recovery_mobile: string | null
          current_itax_gmail_yahoo_email_recovery: string | null
          current_itax_password: string | null
          current_itax_system_gmail_password: string | null
          id: number
          income_tax_company_from: string | null
          income_tax_company_status: string | null
          income_tax_company_to: string | null
          income_tax_paye_current_status: string | null
          income_tax_paye_effective_from: string | null
          income_tax_paye_effective_to: string | null
          income_tax_rent_income_current_status: string | null
          income_tax_rent_income_effective_from: string | null
          income_tax_rent_income_effective_to: string | null
          income_tax_turnover_tax: string | null
          income_tax_turnover_tax_current_status: string | null
          income_tax_turnover_tax_effective_from: string | null
          income_tax_turnover_tax_effective_to: string | null
          is_verified: boolean | null
          itax_status: string | null
          kra_password: string | null
          kra_pin: string | null
          last_checked: string | null
          old_itax_email: string | null
          old_itax_password: string | null
          old_itax_system_gmail_password: string | null
          pin_certification_profile_download_dates: string | null
          pin_station: string | null
          pin_station_manager_mobile: string | null
          pin_station_manager_name: string | null
          pin_status: string | null
          sector_manager_company_mobile: string | null
          sector_manager_email: string | null
          sector_manager_name: string | null
          sector_manager_personal_mobile: string | null
          sector_manager_status: string | null
          sector_manager_to: string | null
          sector_manager_wef: string | null
          status: string | null
          tax_year_end: string | null
          team_lead_company_mobile: string | null
          team_lead_email: string | null
          team_lead_name: string | null
          team_lead_personal_mobile: string | null
          team_lead_status: string | null
          team_lead_to: string | null
          team_lead_wef: string | null
          update_at: string | null
          userid: string | null
          verification_data: Json | null
        }
        Insert: {
          acc_manager_email?: string | null
          acc_manager_email_date?: string | null
          acc_manager_mobile?: string | null
          acc_manager_name?: string | null
          acc_manager_personal_mobile?: string | null
          acc_manager_position?: string | null
          acc_manager_status?: string | null
          acc_manager_to?: string | null
          acc_manager_wef?: string | null
          annual_income?: string | null
          bcl_acc_manager_email?: string | null
          bcl_acc_manager_mobile?: string | null
          bcl_acc_manager_name?: string | null
          bcl_acc_manager_off_mobile?: string | null
          bcl_acc_manager_personal_mobile?: string | null
          company_name?: string | null
          current_itax_gmail_email?: string | null
          current_itax_gmail_email_recovery_email?: string | null
          current_itax_gmail_email_recovery_mobile?: string | null
          current_itax_gmail_yahoo_email_recovery?: string | null
          current_itax_password?: string | null
          current_itax_system_gmail_password?: string | null
          id?: never
          income_tax_company_from?: string | null
          income_tax_company_status?: string | null
          income_tax_company_to?: string | null
          income_tax_paye_current_status?: string | null
          income_tax_paye_effective_from?: string | null
          income_tax_paye_effective_to?: string | null
          income_tax_rent_income_current_status?: string | null
          income_tax_rent_income_effective_from?: string | null
          income_tax_rent_income_effective_to?: string | null
          income_tax_turnover_tax?: string | null
          income_tax_turnover_tax_current_status?: string | null
          income_tax_turnover_tax_effective_from?: string | null
          income_tax_turnover_tax_effective_to?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          old_itax_email?: string | null
          old_itax_password?: string | null
          old_itax_system_gmail_password?: string | null
          pin_certification_profile_download_dates?: string | null
          pin_station?: string | null
          pin_station_manager_mobile?: string | null
          pin_station_manager_name?: string | null
          pin_status?: string | null
          sector_manager_company_mobile?: string | null
          sector_manager_email?: string | null
          sector_manager_name?: string | null
          sector_manager_personal_mobile?: string | null
          sector_manager_status?: string | null
          sector_manager_to?: string | null
          sector_manager_wef?: string | null
          status?: string | null
          tax_year_end?: string | null
          team_lead_company_mobile?: string | null
          team_lead_email?: string | null
          team_lead_name?: string | null
          team_lead_personal_mobile?: string | null
          team_lead_status?: string | null
          team_lead_to?: string | null
          team_lead_wef?: string | null
          update_at?: string | null
          userid?: string | null
          verification_data?: Json | null
        }
        Update: {
          acc_manager_email?: string | null
          acc_manager_email_date?: string | null
          acc_manager_mobile?: string | null
          acc_manager_name?: string | null
          acc_manager_personal_mobile?: string | null
          acc_manager_position?: string | null
          acc_manager_status?: string | null
          acc_manager_to?: string | null
          acc_manager_wef?: string | null
          annual_income?: string | null
          bcl_acc_manager_email?: string | null
          bcl_acc_manager_mobile?: string | null
          bcl_acc_manager_name?: string | null
          bcl_acc_manager_off_mobile?: string | null
          bcl_acc_manager_personal_mobile?: string | null
          company_name?: string | null
          current_itax_gmail_email?: string | null
          current_itax_gmail_email_recovery_email?: string | null
          current_itax_gmail_email_recovery_mobile?: string | null
          current_itax_gmail_yahoo_email_recovery?: string | null
          current_itax_password?: string | null
          current_itax_system_gmail_password?: string | null
          id?: never
          income_tax_company_from?: string | null
          income_tax_company_status?: string | null
          income_tax_company_to?: string | null
          income_tax_paye_current_status?: string | null
          income_tax_paye_effective_from?: string | null
          income_tax_paye_effective_to?: string | null
          income_tax_rent_income_current_status?: string | null
          income_tax_rent_income_effective_from?: string | null
          income_tax_rent_income_effective_to?: string | null
          income_tax_turnover_tax?: string | null
          income_tax_turnover_tax_current_status?: string | null
          income_tax_turnover_tax_effective_from?: string | null
          income_tax_turnover_tax_effective_to?: string | null
          is_verified?: boolean | null
          itax_status?: string | null
          kra_password?: string | null
          kra_pin?: string | null
          last_checked?: string | null
          old_itax_email?: string | null
          old_itax_password?: string | null
          old_itax_system_gmail_password?: string | null
          pin_certification_profile_download_dates?: string | null
          pin_station?: string | null
          pin_station_manager_mobile?: string | null
          pin_station_manager_name?: string | null
          pin_status?: string | null
          sector_manager_company_mobile?: string | null
          sector_manager_email?: string | null
          sector_manager_name?: string | null
          sector_manager_personal_mobile?: string | null
          sector_manager_status?: string | null
          sector_manager_to?: string | null
          sector_manager_wef?: string | null
          status?: string | null
          tax_year_end?: string | null
          team_lead_company_mobile?: string | null
          team_lead_email?: string | null
          team_lead_name?: string | null
          team_lead_personal_mobile?: string | null
          team_lead_status?: string | null
          team_lead_to?: string | null
          team_lead_wef?: string | null
          update_at?: string | null
          userid?: string | null
          verification_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "PasswordChecker_duplicate_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "acc_portal_clerk_users"
            referencedColumns: ["userid"]
          },
        ]
      }
      payroll_cycles: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pentasoft_extractions: {
        Row: {
          company_name: string
          created_at: string | null
          files: Json
          id: number
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          files: Json
          id?: number
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          files?: Json
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      petty_cash_monthly_entries: {
        Row: {
          created_at: string
          data: Json
          id: string
          month: string
          updated_at: string
          userid: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          month: string
          updated_at?: string
          userid: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          month?: string
          updated_at?: string
          userid?: string
        }
        Relationships: []
      }
      PINCertificates: {
        Row: {
          additional_data: Json | null
          company_name: string
          company_pin: string
          created_at: string | null
          extractions: Json
          id: number
          updated_at: string | null
        }
        Insert: {
          additional_data?: Json | null
          company_name: string
          company_pin: string
          created_at?: string | null
          extractions?: Json
          id?: never
          updated_at?: string | null
        }
        Update: {
          additional_data?: Json | null
          company_name?: string
          company_pin?: string
          created_at?: string | null
          extractions?: Json
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      PinCheckerDetails: {
        Row: {
          company_name: string
          error_message: string | null
          housing_levy_effective_from: string | null
          housing_levy_effective_to: string | null
          housing_levy_status: string | null
          id: number
          income_tax_company_effective_from: string | null
          income_tax_company_effective_to: string | null
          income_tax_company_status: string | null
          is_locked: string | null
          kebs_effective_from: string | null
          kebs_effective_to: string | null
          kebs_status: string | null
          last_checked_at: string | null
          nhif_effective_from: string | null
          nhif_effective_to: string | null
          nhif_status: string | null
          nita_effective_from: string | null
          nita_effective_to: string | null
          nita_status: string | null
          nssf_effective_from: string | null
          nssf_effective_to: string | null
          nssf_status: string | null
          paye_effective_from: string | null
          paye_effective_to: string | null
          paye_status: string | null
          rent_income_effective_from: string | null
          rent_income_effective_to: string | null
          rent_income_mri_effective_from: string | null
          rent_income_mri_effective_to: string | null
          rent_income_mri_status: string | null
          rent_income_status: string | null
          resident_individual_effective_from: string | null
          resident_individual_effective_to: string | null
          resident_individual_status: string | null
          turnover_tax_effective_from: string | null
          turnover_tax_effective_to: string | null
          turnover_tax_status: string | null
          vat_effective_from: string | null
          vat_effective_to: string | null
          vat_status: string | null
          wh_vat_effective_from: string | null
          wh_vat_effective_to: string | null
          wh_vat_status: string | null
        }
        Insert: {
          company_name: string
          error_message?: string | null
          housing_levy_effective_from?: string | null
          housing_levy_effective_to?: string | null
          housing_levy_status?: string | null
          id?: number
          income_tax_company_effective_from?: string | null
          income_tax_company_effective_to?: string | null
          income_tax_company_status?: string | null
          is_locked?: string | null
          kebs_effective_from?: string | null
          kebs_effective_to?: string | null
          kebs_status?: string | null
          last_checked_at?: string | null
          nhif_effective_from?: string | null
          nhif_effective_to?: string | null
          nhif_status?: string | null
          nita_effective_from?: string | null
          nita_effective_to?: string | null
          nita_status?: string | null
          nssf_effective_from?: string | null
          nssf_effective_to?: string | null
          nssf_status?: string | null
          paye_effective_from?: string | null
          paye_effective_to?: string | null
          paye_status?: string | null
          rent_income_effective_from?: string | null
          rent_income_effective_to?: string | null
          rent_income_mri_effective_from?: string | null
          rent_income_mri_effective_to?: string | null
          rent_income_mri_status?: string | null
          rent_income_status?: string | null
          resident_individual_effective_from?: string | null
          resident_individual_effective_to?: string | null
          resident_individual_status?: string | null
          turnover_tax_effective_from?: string | null
          turnover_tax_effective_to?: string | null
          turnover_tax_status?: string | null
          vat_effective_from?: string | null
          vat_effective_to?: string | null
          vat_status?: string | null
          wh_vat_effective_from?: string | null
          wh_vat_effective_to?: string | null
          wh_vat_status?: string | null
        }
        Update: {
          company_name?: string
          error_message?: string | null
          housing_levy_effective_from?: string | null
          housing_levy_effective_to?: string | null
          housing_levy_status?: string | null
          id?: number
          income_tax_company_effective_from?: string | null
          income_tax_company_effective_to?: string | null
          income_tax_company_status?: string | null
          is_locked?: string | null
          kebs_effective_from?: string | null
          kebs_effective_to?: string | null
          kebs_status?: string | null
          last_checked_at?: string | null
          nhif_effective_from?: string | null
          nhif_effective_to?: string | null
          nhif_status?: string | null
          nita_effective_from?: string | null
          nita_effective_to?: string | null
          nita_status?: string | null
          nssf_effective_from?: string | null
          nssf_effective_to?: string | null
          nssf_status?: string | null
          paye_effective_from?: string | null
          paye_effective_to?: string | null
          paye_status?: string | null
          rent_income_effective_from?: string | null
          rent_income_effective_to?: string | null
          rent_income_mri_effective_from?: string | null
          rent_income_mri_effective_to?: string | null
          rent_income_mri_status?: string | null
          rent_income_status?: string | null
          resident_individual_effective_from?: string | null
          resident_individual_effective_to?: string | null
          resident_individual_status?: string | null
          turnover_tax_effective_from?: string | null
          turnover_tax_effective_to?: string | null
          turnover_tax_status?: string | null
          vat_effective_from?: string | null
          vat_effective_to?: string | null
          vat_status?: string | null
          wh_vat_effective_from?: string | null
          wh_vat_effective_to?: string | null
          wh_vat_status?: string | null
        }
        Relationships: []
      }
      PinCheckerDetails_AutomationProgress: {
        Row: {
          id: number
          last_updated: string | null
          logs: Json | null
          progress: number | null
          status: string | null
          tab: string | null
        }
        Insert: {
          id: number
          last_updated?: string | null
          logs?: Json | null
          progress?: number | null
          status?: string | null
          tab?: string | null
        }
        Update: {
          id?: number
          last_updated?: string | null
          logs?: Json | null
          progress?: number | null
          status?: string | null
          tab?: string | null
        }
        Relationships: []
      }
      PINProfilesAndCertificates: {
        Row: {
          additional_data: Json | null
          company_name: string
          company_pin: string
          created_at: string | null
          extractions: Json
          id: number
          updated_at: string | null
        }
        Insert: {
          additional_data?: Json | null
          company_name: string
          company_pin: string
          created_at?: string | null
          extractions?: Json
          id?: never
          updated_at?: string | null
        }
        Update: {
          additional_data?: Json | null
          company_name?: string
          company_pin?: string
          created_at?: string | null
          extractions?: Json
          id?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          poll_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          poll_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          poll_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          group_id: string
          id: string
          question: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          question: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          question?: string
          status?: string
        }
        Relationships: []
      }
      profile_category_table_mapping: {
        Row: {
          column_mappings: Json | null
          column_order: Json | null
          created_at: string | null
          field_dropdowns: Json | null
          id: number
          main_tab: string | null
          sections_sections: Json | null
          sections_subsections: Json | null
          table_names: Json | null
          Tabs: string | null
          updated_at: string | null
        }
        Insert: {
          column_mappings?: Json | null
          column_order?: Json | null
          created_at?: string | null
          field_dropdowns?: Json | null
          id?: number
          main_tab?: string | null
          sections_sections?: Json | null
          sections_subsections?: Json | null
          table_names?: Json | null
          Tabs?: string | null
          updated_at?: string | null
        }
        Update: {
          column_mappings?: Json | null
          column_order?: Json | null
          created_at?: string | null
          field_dropdowns?: Json | null
          id?: number
          main_tab?: string | null
          sections_sections?: Json | null
          sections_subsections?: Json | null
          table_names?: Json | null
          Tabs?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_category_table_mapping_2: {
        Row: {
          created_at: string | null
          id: number
          main_tab: string
          structure: Json
          sub_tab: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          main_tab: string
          structure?: Json
          sub_tab: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          main_tab?: string
          structure?: Json
          sub_tab?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role?: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions_duplicate: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
        }
        Relationships: []
      }
      qr_code_data: {
        Row: {
          created_at: string | null
          document_id: number | null
          extracted_info: Json | null
          id: number
          qr_link: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: number | null
          extracted_info?: Json | null
          id?: number
          qr_link?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: number | null
          extracted_info?: Json | null
          id?: number
          qr_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "doc_scanner"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_companies: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quickbooks_files: {
        Row: {
          company_name: string
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          status: string
          updated_at: string | null
          upload_date: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          status: string
          updated_at?: string | null
          upload_date: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          status?: string
          updated_at?: string | null
          upload_date?: string
        }
        Relationships: []
      }
      quickbooks_personal: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registry_individuals: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          alien_expiry_date: string | null
          alien_issue_date: string | null
          alien_number: string | null
          alien_reminders_date: string | null
          alien_reminders_notice_days: number | null
          alternative_email: string | null
          assets: Json
          audit_client_effective_from: string | null
          audit_client_effective_to: string | null
          bank_history: Json | null
          bill_to: Json | null
          contact_details: Json | null
          country_of_birth: string | null
          created_at: string | null
          date_of_birth: string | null
          directorship_history: Json
          education_history: Json
          effective_from: string | null
          effective_to: string | null
          employment_history: Json
          eye_color: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          hair_color: string | null
          height: string | null
          id: number
          id_number: string | null
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          individual_type: string | null
          insurance: Json
          is_referee_for: Json
          is_verified: boolean | null
          kra_pin: string | null
          last_name: string | null
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          other_names: string | null
          passport_expiry_date: string | null
          passport_file_number: string | null
          passport_issue_date: string | null
          passport_number: string | null
          passport_place_of_issue: string | null
          passport_reminders_notice_days: string | null
          permit_expiry_date: string | null
          permit_issue_date: string | null
          permit_no: string | null
          permit_reminders_date: string | null
          permit_reminders_notice_days: number | null
          place_of_birth: string | null
          postal_address: Json | null
          r_number: string | null
          referee_individual: Json | null
          referees: Json
          relationships: Json
          residential_address: Json | null
          sheria_client_effective_from: string | null
          sheria_client_effective_to: string | null
          special_marks: string | null
          status: string | null
          tax_pin: string | null
          updated_at: string | null
          verification_data: Json | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: number | null
          alternative_email?: string | null
          assets?: Json
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          bank_history?: Json | null
          bill_to?: Json | null
          contact_details?: Json | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directorship_history?: Json
          education_history?: Json
          effective_from?: string | null
          effective_to?: string | null
          employment_history?: Json
          eye_color?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: number
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_type?: string | null
          insurance?: Json
          is_referee_for?: Json
          is_verified?: boolean | null
          kra_pin?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          passport_reminders_notice_days?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: number | null
          place_of_birth?: string | null
          postal_address?: Json | null
          r_number?: string | null
          referee_individual?: Json | null
          referees?: Json
          relationships?: Json
          residential_address?: Json | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          special_marks?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string | null
          verification_data?: Json | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: number | null
          alternative_email?: string | null
          assets?: Json
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          bank_history?: Json | null
          bill_to?: Json | null
          contact_details?: Json | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directorship_history?: Json
          education_history?: Json
          effective_from?: string | null
          effective_to?: string | null
          employment_history?: Json
          eye_color?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: number
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_type?: string | null
          insurance?: Json
          is_referee_for?: Json
          is_verified?: boolean | null
          kra_pin?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          passport_reminders_notice_days?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: number | null
          place_of_birth?: string | null
          postal_address?: Json | null
          r_number?: string | null
          referee_individual?: Json | null
          referees?: Json
          relationships?: Json
          residential_address?: Json | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          special_marks?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string | null
          verification_data?: Json | null
        }
        Relationships: []
      }
      registry_individuals_backup: {
        Row: {
          acc_client_effective_from: string | null
          acc_client_effective_to: string | null
          alien_expiry_date: string | null
          alien_issue_date: string | null
          alien_number: string | null
          alien_reminders_date: string | null
          alien_reminders_notice_days: number | null
          alternative_email: string | null
          assets: Json
          audit_client_effective_from: string | null
          audit_client_effective_to: string | null
          bank_history: Json | null
          bill_to: Json | null
          contact_details: Json | null
          country_of_birth: string | null
          created_at: string | null
          date_of_birth: string | null
          directorship_history: Json
          education_history: Json
          effective_from: string | null
          effective_to: string | null
          employment_history: Json
          eye_color: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          hair_color: string | null
          height: string | null
          id: number
          id_number: string | null
          imm_client_effective_from: string | null
          imm_client_effective_to: string | null
          individual_type: string | null
          insurance: Json
          is_referee_for: Json
          is_verified: boolean | null
          kra_pin: string | null
          last_name: string | null
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          other_names: string | null
          passport_expiry_date: string | null
          passport_file_number: string | null
          passport_issue_date: string | null
          passport_number: string | null
          passport_place_of_issue: string | null
          passport_reminders_notice_days: string | null
          permit_expiry_date: string | null
          permit_issue_date: string | null
          permit_no: string | null
          permit_reminders_date: string | null
          permit_reminders_notice_days: number | null
          place_of_birth: string | null
          postal_address: Json | null
          r_number: string | null
          referee_individual: Json | null
          referees: Json
          relationships: Json
          residential_address: Json | null
          sheria_client_effective_from: string | null
          sheria_client_effective_to: string | null
          special_marks: string | null
          status: string | null
          tax_pin: string | null
          updated_at: string | null
          verification_data: Json | null
        }
        Insert: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: number | null
          alternative_email?: string | null
          assets?: Json
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          bank_history?: Json | null
          bill_to?: Json | null
          contact_details?: Json | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directorship_history?: Json
          education_history?: Json
          effective_from?: string | null
          effective_to?: string | null
          employment_history?: Json
          eye_color?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: number
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_type?: string | null
          insurance?: Json
          is_referee_for?: Json
          is_verified?: boolean | null
          kra_pin?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          passport_reminders_notice_days?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: number | null
          place_of_birth?: string | null
          postal_address?: Json | null
          r_number?: string | null
          referee_individual?: Json | null
          referees?: Json
          relationships?: Json
          residential_address?: Json | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          special_marks?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string | null
          verification_data?: Json | null
        }
        Update: {
          acc_client_effective_from?: string | null
          acc_client_effective_to?: string | null
          alien_expiry_date?: string | null
          alien_issue_date?: string | null
          alien_number?: string | null
          alien_reminders_date?: string | null
          alien_reminders_notice_days?: number | null
          alternative_email?: string | null
          assets?: Json
          audit_client_effective_from?: string | null
          audit_client_effective_to?: string | null
          bank_history?: Json | null
          bill_to?: Json | null
          contact_details?: Json | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          directorship_history?: Json
          education_history?: Json
          effective_from?: string | null
          effective_to?: string | null
          employment_history?: Json
          eye_color?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          hair_color?: string | null
          height?: string | null
          id?: number
          id_number?: string | null
          imm_client_effective_from?: string | null
          imm_client_effective_to?: string | null
          individual_type?: string | null
          insurance?: Json
          is_referee_for?: Json
          is_verified?: boolean | null
          kra_pin?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string | null
          passport_expiry_date?: string | null
          passport_file_number?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          passport_place_of_issue?: string | null
          passport_reminders_notice_days?: string | null
          permit_expiry_date?: string | null
          permit_issue_date?: string | null
          permit_no?: string | null
          permit_reminders_date?: string | null
          permit_reminders_notice_days?: number | null
          place_of_birth?: string | null
          postal_address?: Json | null
          r_number?: string | null
          referee_individual?: Json | null
          referees?: Json
          relationships?: Json
          residential_address?: Json | null
          sheria_client_effective_from?: string | null
          sheria_client_effective_to?: string | null
          special_marks?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string | null
          verification_data?: Json | null
        }
        Relationships: []
      }
      registry_references: {
        Row: {
          created_at: string | null
          created_by: string | null
          email_address: string | null
          full_name: string | null
          id: number
          individual_full_name: string | null
          organization: string | null
          personal_mobile_num_abroad: string | null
          personal_mobile_num_kenyan: string | null
          position: string | null
          reference_relationship: string | null
          residential_address: string | null
          updated_at: string | null
          updated_by: string | null
          years_known: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email_address?: string | null
          full_name?: string | null
          id?: number
          individual_full_name?: string | null
          organization?: string | null
          personal_mobile_num_abroad?: string | null
          personal_mobile_num_kenyan?: string | null
          position?: string | null
          reference_relationship?: string | null
          residential_address?: string | null
          updated_at?: string | null
          updated_by?: string | null
          years_known?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email_address?: string | null
          full_name?: string | null
          id?: number
          individual_full_name?: string | null
          organization?: string | null
          personal_mobile_num_abroad?: string | null
          personal_mobile_num_kenyan?: string | null
          position?: string | null
          reference_relationship?: string | null
          residential_address?: string | null
          updated_at?: string | null
          updated_by?: string | null
          years_known?: string | null
        }
        Relationships: []
      }
      registry_settings: {
        Row: {
          created_at: string | null
          id: string
          main_tab: string | null
          section: string
          structure: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          main_tab?: string | null
          section: string
          structure?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          main_tab?: string | null
          section?: string
          structure?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      registry_users: {
        Row: {
          clerk_id: string
          created_at: string | null
          id: string
          role: string | null
          status: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          columns: Json
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          columns: Json
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          columns?: Json
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      section_subsections: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          section_id: number | null
          subsection_id: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          section_id?: number | null
          subsection_id?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          section_id?: number | null
          subsection_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "section_subsections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_subsections_subsection_id_fkey"
            columns: ["subsection_id"]
            isOneToOne: false
            referencedRelation: "subsections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shif: {
        Row: {
          company_name: string | null
          created_at: string | null
          emails: string | null
          id: number
          otp_code: string | null
          password: string | null
          status: boolean | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          emails?: string | null
          id?: number
          otp_code?: string | null
          password?: string | null
          status?: boolean | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          emails?: string | null
          id?: number
          otp_code?: string | null
          password?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      statement_cycles: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      statutory_paye: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          id: number
          kra_pin: string
          paye_returns: Json | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          id?: number
          kra_pin: string
          paye_returns?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          id?: number
          kra_pin?: string
          paye_returns?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      subsection_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_id: number | null
          id: number
          settings: Json | null
          subsection_id: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_id?: number | null
          id?: never
          settings?: Json | null
          subsection_id?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_id?: number | null
          id?: never
          settings?: Json | null
          subsection_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subsection_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subsection_fields_subsection_id_fkey"
            columns: ["subsection_id"]
            isOneToOne: false
            referencedRelation: "subsections"
            referencedColumns: ["id"]
          },
        ]
      }
      subsections: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tab_sections: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          section_id: number | null
          tab_id: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          section_id?: number | null
          tab_id?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          section_id?: number | null
          tab_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_sections_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tabs: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: never
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      task_audit: {
        Row: {
          approval_initiated_at: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string | null
          id: number
          modified_by: string
          status: Database["public"]["Enums"]["task_status"]
          task_name: string
        }
        Insert: {
          approval_initiated_at?: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at?: string | null
          id?: never
          modified_by: string
          status: Database["public"]["Enums"]["task_status"]
          task_name: string
        }
        Update: {
          approval_initiated_at?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string | null
          id?: never
          modified_by?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_deadline_date: string
          client_deadline_time: string
          client_email: string | null
          client_mobile: string | null
          client_name: string | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          executed_date: string | null
          executed_time: string | null
          extended_deadline_date: string | null
          extended_deadline_justified: string | null
          extended_deadline_time: string | null
          id: string
          initial_deadline_date: string | null
          initial_deadline_time: string | null
          internal_deadline: string | null
          main_dept: string | null
          officer_email: string | null
          officer_mobile: string | null
          officer_name: string | null
          online_manual: string | null
          status: string | null
          sub_dept: string | null
          task_id: number | null
          task_initiated_date: string | null
          task_initiated_time: string | null
          task_stages: string | null
          task_type: string | null
          team_assistant: string | null
          team_manager: string | null
          template: string | null
          time_estimate: string | null
          web_data: string | null
        }
        Insert: {
          client_deadline_date: string
          client_deadline_time: string
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          executed_date?: string | null
          executed_time?: string | null
          extended_deadline_date?: string | null
          extended_deadline_justified?: string | null
          extended_deadline_time?: string | null
          id?: string
          initial_deadline_date?: string | null
          initial_deadline_time?: string | null
          internal_deadline?: string | null
          main_dept?: string | null
          officer_email?: string | null
          officer_mobile?: string | null
          officer_name?: string | null
          online_manual?: string | null
          status?: string | null
          sub_dept?: string | null
          task_id?: number | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_stages?: string | null
          task_type?: string | null
          team_assistant?: string | null
          team_manager?: string | null
          template?: string | null
          time_estimate?: string | null
          web_data?: string | null
        }
        Update: {
          client_deadline_date?: string
          client_deadline_time?: string
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          executed_date?: string | null
          executed_time?: string | null
          extended_deadline_date?: string | null
          extended_deadline_justified?: string | null
          extended_deadline_time?: string | null
          id?: string
          initial_deadline_date?: string | null
          initial_deadline_time?: string | null
          internal_deadline?: string | null
          main_dept?: string | null
          officer_email?: string | null
          officer_mobile?: string | null
          officer_name?: string | null
          online_manual?: string | null
          status?: string | null
          sub_dept?: string | null
          task_id?: number | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_stages?: string | null
          task_type?: string | null
          team_assistant?: string | null
          team_manager?: string | null
          template?: string | null
          time_estimate?: string | null
          web_data?: string | null
        }
        Relationships: []
      }
      tasks_duplicate: {
        Row: {
          client_deadline_date: string | null
          client_deadline_time: string | null
          client_email: string | null
          client_mobile: string | null
          client_name: string | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          extended_deadline_date: string | null
          extended_deadline_justified: string | null
          extended_deadline_time: string | null
          follow_up_with_vendors: string | null
          id: string
          initial_deadline_date: string | null
          initial_deadline_time: string | null
          main_dept: string | null
          status: string | null
          sub_department_period_task_manager: string | null
          sub_department_period_vendors: string | null
          sub_dept: string | null
          task_id: string | null
          task_initiated_date: string | null
          task_initiated_time: string | null
          task_type: string | null
          team_manager: string | null
          time_estimate: string | null
          which_director_requested: string | null
        }
        Insert: {
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          extended_deadline_date?: string | null
          extended_deadline_justified?: string | null
          extended_deadline_time?: string | null
          follow_up_with_vendors?: string | null
          id?: string
          initial_deadline_date?: string | null
          initial_deadline_time?: string | null
          main_dept?: string | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_id?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_type?: string | null
          team_manager?: string | null
          time_estimate?: string | null
          which_director_requested?: string | null
        }
        Update: {
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          extended_deadline_date?: string | null
          extended_deadline_justified?: string | null
          extended_deadline_time?: string | null
          follow_up_with_vendors?: string | null
          id?: string
          initial_deadline_date?: string | null
          initial_deadline_time?: string | null
          main_dept?: string | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_id?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_type?: string | null
          team_manager?: string | null
          time_estimate?: string | null
          which_director_requested?: string | null
        }
        Relationships: []
      }
      tasks_manager_departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          userid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          userid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          userid?: string | null
        }
        Relationships: []
      }
      tasks_manager_officers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          name: string
          password: string | null
          phone: number | null
          role: string
          subdepartments: string[] | null
          userid: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          name: string
          password?: string | null
          phone?: number | null
          role: string
          subdepartments?: string[] | null
          userid?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          name?: string
          password?: string | null
          phone?: number | null
          role?: string
          subdepartments?: string[] | null
          userid?: string | null
          username?: string | null
        }
        Relationships: []
      }
      tasks_manager_sub_department_team_assistants: {
        Row: {
          id: string
          sub_department_id: string
          team_assistant_id: string
          userid: string | null
        }
        Insert: {
          id?: string
          sub_department_id: string
          team_assistant_id: string
          userid?: string | null
        }
        Update: {
          id?: string
          sub_department_id?: string
          team_assistant_id?: string
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_department_team_assistants_sub_department_id_fkey"
            columns: ["sub_department_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_sub_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_department_team_assistants_team_assistant_id_fkey"
            columns: ["team_assistant_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_manager_sub_departments: {
        Row: {
          client_delivery_time: number | null
          created_at: string | null
          department_id: string
          id: string
          modified_at: Json | null
          name: string
          officer: string | null
          processing_time_estimate_minutes: number | null
          task_assistant_id: string | null
          task_manager_id: string | null
          task_stages: number | null
        }
        Insert: {
          client_delivery_time?: number | null
          created_at?: string | null
          department_id: string
          id?: string
          modified_at?: Json | null
          name: string
          officer?: string | null
          processing_time_estimate_minutes?: number | null
          task_assistant_id?: string | null
          task_manager_id?: string | null
          task_stages?: number | null
        }
        Update: {
          client_delivery_time?: number | null
          created_at?: string | null
          department_id?: string
          id?: string
          modified_at?: Json | null
          name?: string
          officer?: string | null
          processing_time_estimate_minutes?: number | null
          task_assistant_id?: string | null
          task_manager_id?: string | null
          task_stages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_sub_departments_officers_fkey"
            columns: ["officer"]
            isOneToOne: false
            referencedRelation: "tasks_manager_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_sub_departments_task_assistant_id_fkey"
            columns: ["task_assistant_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_sub_departments_task_manager_id_fkey"
            columns: ["task_manager_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_sub_departments_task_manager_id_fkey1"
            columns: ["task_manager_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_manager_subdepartment_officers: {
        Row: {
          officer_id: string
          subdepartment_id: string
        }
        Insert: {
          officer_id: string
          subdepartment_id: string
        }
        Update: {
          officer_id?: string
          subdepartment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_manager_subdepartment_officers_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_subdepartment_officers_subdepartment_id_fkey"
            columns: ["subdepartment_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_sub_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_manager_task_stages: {
        Row: {
          auto_message: string | null
          created_at: string
          file_upload_url: string | null
          follow_up_with: string | null
          id: number
          name: string | null
          stage_number: number | null
          sub_department: string | null
          template: string | null
          template_count: number | null
          time_estimate_minutes: number | null
          type: string | null
          upload: string | null
        }
        Insert: {
          auto_message?: string | null
          created_at?: string
          file_upload_url?: string | null
          follow_up_with?: string | null
          id?: number
          name?: string | null
          stage_number?: number | null
          sub_department?: string | null
          template?: string | null
          template_count?: number | null
          time_estimate_minutes?: number | null
          type?: string | null
          upload?: string | null
        }
        Update: {
          auto_message?: string | null
          created_at?: string
          file_upload_url?: string | null
          follow_up_with?: string | null
          id?: number
          name?: string | null
          stage_number?: number | null
          sub_department?: string | null
          template?: string | null
          template_count?: number | null
          time_estimate_minutes?: number | null
          type?: string | null
          upload?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_manager_task_stages_sub_department_fkey"
            columns: ["sub_department"]
            isOneToOne: false
            referencedRelation: "tasks_manager_sub_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_manager_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          deadline_date: string
          deadline_time: string
          department: string
          follow_up_on: string
          id: number
          status: string
          sub_department: string
          task_description: string
          task_name: string
          tasked_company: string
          userid: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          deadline_date: string
          deadline_time: string
          department: string
          follow_up_on: string
          id?: number
          status: string
          sub_department: string
          task_description: string
          task_name: string
          tasked_company: string
          userid?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          deadline_date?: string
          deadline_time?: string
          department?: string
          follow_up_on?: string
          id?: number
          status?: string
          sub_department?: string
          task_description?: string
          task_name?: string
          tasked_company?: string
          userid?: string | null
        }
        Relationships: []
      }
      tasks_manager_tasks_duplicate: {
        Row: {
          approval_time: string | null
          assigned_to: string | null
          client_deadline_date: string | null
          client_deadline_time: string | null
          client_email: string | null
          client_name: string | null
          client_number: string | null
          client_type: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          director_email: string | null
          director_name: string | null
          director_number: string | null
          follow_up_with_vendors: string | null
          id: number
          main_dept: string | null
          overdue_at: string | null
          review_at: string | null
          started_at: string | null
          status: string | null
          sub_department_period_task_manager: string | null
          sub_department_period_vendors: string | null
          sub_dept: string | null
          task_initiated_date: string | null
          task_initiated_time: string | null
          team_manager: string | null
          ticket_id: string | null
          time_estimate_minutes: number | null
          userid: string | null
          vendor_email: string | null
          vendor_name: string | null
          vendor_number: string | null
        }
        Insert: {
          approval_time?: string | null
          assigned_to?: string | null
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_name?: string | null
          client_number?: string | null
          client_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          director_email?: string | null
          director_name?: string | null
          director_number?: string | null
          follow_up_with_vendors?: string | null
          id?: never
          main_dept?: string | null
          overdue_at?: string | null
          review_at?: string | null
          started_at?: string | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          team_manager?: string | null
          ticket_id?: string | null
          time_estimate_minutes?: number | null
          userid?: string | null
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_number?: string | null
        }
        Update: {
          approval_time?: string | null
          assigned_to?: string | null
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_name?: string | null
          client_number?: string | null
          client_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          director_email?: string | null
          director_name?: string | null
          director_number?: string | null
          follow_up_with_vendors?: string | null
          id?: never
          main_dept?: string | null
          overdue_at?: string | null
          review_at?: string | null
          started_at?: string | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          team_manager?: string | null
          ticket_id?: string | null
          time_estimate_minutes?: number | null
          userid?: string | null
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_number?: string | null
        }
        Relationships: []
      }
      tasks_manager_tasks_duplicate2: {
        Row: {
          approval_time: string | null
          cancelled_at: string | null
          client_deadline_date: string | null
          client_deadline_time: string | null
          client_email: string | null
          client_name: string | null
          client_number: string | null
          client_type: string | null
          complete_requirement_given_date: string | null
          completed_at: Json | null
          created_at: string | null
          current_stage_id: number | null
          description: string | null
          director_email: string | null
          director_name: string | null
          director_number: string | null
          estimated_completion_time: string | null
          follow_up_with_vendors: string | null
          id: number
          main_dept: string | null
          officer: string | null
          overdue_at: Json | null
          overdue_comments: Json | null
          registered_date: string | null
          req_submission_date: string | null
          review_at: string | null
          stage_completions: Json | null
          stage_times: Json | null
          started_at: Json | null
          status: string | null
          sub_department_period_task_manager: string | null
          sub_department_period_vendors: string | null
          sub_dept: string | null
          task_assistant_id: string | null
          task_initiated_date: string | null
          task_initiated_time: string | null
          task_manager: string | null
          ticket_id: string | null
          time_estimate_minutes: number | null
          uploaded_at: string | null
          uploads: Json | null
          userid: string | null
          vendor_email: string | null
          vendor_name: string | null
          vendor_number: string | null
        }
        Insert: {
          approval_time?: string | null
          cancelled_at?: string | null
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_name?: string | null
          client_number?: string | null
          client_type?: string | null
          complete_requirement_given_date?: string | null
          completed_at?: Json | null
          created_at?: string | null
          current_stage_id?: number | null
          description?: string | null
          director_email?: string | null
          director_name?: string | null
          director_number?: string | null
          estimated_completion_time?: string | null
          follow_up_with_vendors?: string | null
          id?: never
          main_dept?: string | null
          officer?: string | null
          overdue_at?: Json | null
          overdue_comments?: Json | null
          registered_date?: string | null
          req_submission_date?: string | null
          review_at?: string | null
          stage_completions?: Json | null
          stage_times?: Json | null
          started_at?: Json | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_assistant_id?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_manager?: string | null
          ticket_id?: string | null
          time_estimate_minutes?: number | null
          uploaded_at?: string | null
          uploads?: Json | null
          userid?: string | null
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_number?: string | null
        }
        Update: {
          approval_time?: string | null
          cancelled_at?: string | null
          client_deadline_date?: string | null
          client_deadline_time?: string | null
          client_email?: string | null
          client_name?: string | null
          client_number?: string | null
          client_type?: string | null
          complete_requirement_given_date?: string | null
          completed_at?: Json | null
          created_at?: string | null
          current_stage_id?: number | null
          description?: string | null
          director_email?: string | null
          director_name?: string | null
          director_number?: string | null
          estimated_completion_time?: string | null
          follow_up_with_vendors?: string | null
          id?: never
          main_dept?: string | null
          officer?: string | null
          overdue_at?: Json | null
          overdue_comments?: Json | null
          registered_date?: string | null
          req_submission_date?: string | null
          review_at?: string | null
          stage_completions?: Json | null
          stage_times?: Json | null
          started_at?: Json | null
          status?: string | null
          sub_department_period_task_manager?: string | null
          sub_department_period_vendors?: string | null
          sub_dept?: string | null
          task_assistant_id?: string | null
          task_initiated_date?: string | null
          task_initiated_time?: string | null
          task_manager?: string | null
          ticket_id?: string | null
          time_estimate_minutes?: number | null
          uploaded_at?: string | null
          uploads?: Json | null
          userid?: string | null
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_manager"
            columns: ["task_manager"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_task_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_main_dept_fkey"
            columns: ["main_dept"]
            isOneToOne: false
            referencedRelation: "tasks_manager_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_officer_fkey"
            columns: ["officer"]
            isOneToOne: false
            referencedRelation: "tasks_manager_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_sub_dept_fkey"
            columns: ["sub_dept"]
            isOneToOne: false
            referencedRelation: "tasks_manager_sub_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_task_assistant_id_fkey"
            columns: ["task_assistant_id"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_manager_tasks_duplicate2_task_manager_fkey"
            columns: ["task_manager"]
            isOneToOne: false
            referencedRelation: "tasks_manager_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_manager_team_members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          name: string
          password: string | null
          phone: number | null
          role: string
          userid: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          name: string
          password?: string | null
          phone?: number | null
          role: string
          userid?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          name?: string
          password?: string | null
          phone?: number | null
          role?: string
          userid?: string | null
          username?: string | null
        }
        Relationships: []
      }
      tasks_manager_todo_list: {
        Row: {
          created_at: string | null
          description: string | null
          dueDate: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks_manager_users: {
        Row: {
          email: string
          name: string
          user_id: string
        }
        Insert: {
          email: string
          name: string
          user_id: string
        }
        Update: {
          email?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      taxation: {
        Row: {
          company_id: number | null
          housing_levy: boolean | null
          nhif: boolean | null
          nita: boolean | null
          nssf: boolean | null
          paye: boolean | null
          standard_levy: boolean | null
          taxation_id: number
          tourism_levy: boolean | null
          vat: boolean | null
          w_h_vat_agent_customers: boolean | null
          w_h_vat_agent_suppliers: boolean | null
        }
        Insert: {
          company_id?: number | null
          housing_levy?: boolean | null
          nhif?: boolean | null
          nita?: boolean | null
          nssf?: boolean | null
          paye?: boolean | null
          standard_levy?: boolean | null
          taxation_id?: number
          tourism_levy?: boolean | null
          vat?: boolean | null
          w_h_vat_agent_customers?: boolean | null
          w_h_vat_agent_suppliers?: boolean | null
        }
        Update: {
          company_id?: number | null
          housing_levy?: boolean | null
          nhif?: boolean | null
          nita?: boolean | null
          nssf?: boolean | null
          paye?: boolean | null
          standard_levy?: boolean | null
          taxation_id?: number
          tourism_levy?: boolean | null
          vat?: boolean | null
          w_h_vat_agent_customers?: boolean | null
          w_h_vat_agent_suppliers?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "taxation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      TaxComplianceCertificates: {
        Row: {
          company_name: string | null
          company_pin: string
          extractions: Json | null
        }
        Insert: {
          company_name?: string | null
          company_pin: string
          extractions?: Json | null
        }
        Update: {
          company_name?: string | null
          company_pin?: string
          extractions?: Json | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          available_fields: string[] | null
          config: Json
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          field_mappings: Json
          file_key: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_default: boolean | null
          metadata: Json | null
          name: string
          parsed_fields: string[] | null
          sections: Json
          status: string | null
          updated_at: string
          updated_by: string | null
          validation_rules: Json | null
          version: number | null
        }
        Insert: {
          available_fields?: string[] | null
          config: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          field_mappings?: Json
          file_key?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          parsed_fields?: string[] | null
          sections?: Json
          status?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Update: {
          available_fields?: string[] | null
          config?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          field_mappings?: Json
          file_key?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          parsed_fields?: string[] | null
          sections?: Json
          status?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      temporary_submissions: {
        Row: {
          company_id: number
          configuration_id: number
          form_data: Json
          id: number
          link_id: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          company_id: number
          configuration_id: number
          form_data: Json
          id?: number
          link_id: string
          status: string
          submitted_at?: string | null
        }
        Update: {
          company_id?: number
          configuration_id?: number
          form_data?: Json
          id?: number
          link_id?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      TEST123: {
        Row: {
          company_id: number
          company_name: string
          company_start_date: string | null
          current_itax_password: string
          kra_password_status: string
          kra_password_status_check: string | null
          kra_pin_no: string
        }
        Insert: {
          company_id?: number
          company_name: string
          company_start_date?: string | null
          current_itax_password: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no: string
        }
        Update: {
          company_id?: number
          company_name?: string
          company_start_date?: string | null
          current_itax_password?: string
          kra_password_status?: string
          kra_password_status_check?: string | null
          kra_pin_no?: string
        }
        Relationships: []
      }
      thh_ggghh: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          file_upload_url: string | null
          id: number
          is_admin: boolean
          sender_id: string | null
          ticket_id: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_upload_url?: string | null
          id?: number
          is_admin: boolean
          sender_id?: string | null
          ticket_id?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_upload_url?: string | null
          id?: number
          is_admin?: boolean
          sender_id?: string | null
          ticket_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "acc_portal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "todo_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string | null
          status: Database["public"]["Enums"]["todo_task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: Database["public"]["Enums"]["todo_task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: Database["public"]["Enums"]["todo_task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "todo_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "todo_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string | null
          id: string
          merchant_request_id: string | null
          phone_number: string
          result_code: string | null
          result_description: string | null
          status: string
          transaction_code: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          phone_number: string
          result_code?: string | null
          result_description?: string | null
          status?: string
          transaction_code?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          phone_number?: string
          result_code?: string | null
          result_description?: string | null
          status?: string
          transaction_code?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          option_id: string | null
          poll_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id?: string | null
          poll_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string | null
          poll_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      WHATASPP_TEST: {
        Row: {
          created_at: string
          id: number
          Name: string | null
          "Phone Number": string | null
        }
        Insert: {
          created_at?: string
          id?: number
          Name?: string | null
          "Phone Number"?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          Name?: string | null
          "Phone Number"?: string | null
        }
        Relationships: []
      }
      whvat_extractions: {
        Row: {
          company_name: string
          created_at: string
          extraction_data: Json
          id: number
          kra_pin: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          extraction_data?: Json
          id?: number
          kra_pin: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          extraction_data?: Json
          id?: number
          kra_pin?: string
          updated_at?: string
        }
        Relationships: []
      }
      yy_yy: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          name: string
          password: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          name: string
          password: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          name?: string
          password?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      acc_portal_pettycash_entry_summaries: {
        Row: {
          entry_count: number | null
          month: string | null
          total_amount: number | null
          total_tax: number | null
          verified_count: number | null
        }
        Relationships: []
      }
      structure_hierarchy: {
        Row: {
          full_structure: Json | null
          id: string | null
          is_visible: boolean | null
          level: number | null
          name: string | null
          order: string | null
          parent_id: string | null
          type: string | null
        }
        Relationships: []
      }
      view_suppliers: {
        Row: {
          created_at: string | null
          email: string | null
          id: number | null
          id_number: string | null
          mobile: string | null
          pin: string | null
          supplier_name: string | null
          supplier_type: string | null
          trading_type: string | null
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          created_at?: string | null
          email?: never
          id?: number | null
          id_number?: never
          mobile?: never
          pin?: never
          supplier_name?: never
          supplier_type?: never
          trading_type?: never
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          created_at?: string | null
          email?: never
          id?: number | null
          id_number?: never
          mobile?: never
          pin?: never
          supplier_name?: never
          supplier_type?: never
          trading_type?: never
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_column_mapping: {
        Args: {
          params: Json
        }
        Returns: undefined
      }
      add_column_to_table: {
        Args: {
          p_table_name: string
          p_column_name: string
          p_data_type: string
        }
        Returns: undefined
      }
      add_verification_columns: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      create_table_if_not_exists: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      create_table_with_defaults: {
        Args: {
          p_table_name: string
        }
        Returns: undefined
      }
      create_table_with_mappings_overalltable: {
        Args: {
          p_table_name: string
        }
        Returns: undefined
      }
      create_update_trigger: {
        Args: {
          p_table_name: string
        }
        Returns: undefined
      }
      delete_column_mapping_overalltable: {
        Args: {
          p_table_name: string
          p_column_name: string
        }
        Returns: undefined
      }
      drop_table_if_exists: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      get_all_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      get_category_totals: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          category_code: string
          subcategory_code: string
          total_amount: number
          entry_count: number
        }[]
      }
      get_json_array_labels: {
        Args: {
          table_name: string
          column_name: string
        }
        Returns: {
          label: string
        }[]
      }
      get_jsonb_columns: {
        Args: {
          input_table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_table_columns: {
        Args: {
          input_table_name: string
        }
        Returns: {
          column_name: string
        }[]
      }
      get_table_columns_overalltable: {
        Args: {
          input_table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
          table_name: string
        }[]
      }
      get_teams_for_user: {
        Args: {
          p_user_id: string
        }
        Returns: {
          team_id: number
          team_name: string
        }[]
      }
      get_user_email_accounts: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          email: string
          label: string
          created_at: string
          updated_at: string
        }[]
      }
      insert_company_data: {
        Args: {
          p_stage: number
          p_data: Json
          p_userid: string
        }
        Returns: undefined
      }
      list_tables: {
        Args: {
          schema_name: string
        }
        Returns: string[]
      }
      setup_verification_for_all_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      soft_delete_team_member: {
        Args: {
          member_id: string
        }
        Returns: undefined
      }
      update_column_order_overalltable: {
        Args: {
          p_table_name: string
          p_column_name: string
          p_new_order: number
        }
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "approved" | "not approved"
      layout_type: "default" | "full" | "sidebar"
      structure_type: "maintab" | "subtab" | "section" | "subsection" | "field"
      task_status: "deleted" | "edited"
      todo_task_priority: "low" | "medium" | "high" | "HIgh" | "Medium" | "Low"
      todo_task_status: "pending" | "in_progress" | "completed" | "assigned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
