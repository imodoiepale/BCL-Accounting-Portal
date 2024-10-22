// @ts-nocheck
"use client";

import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export class PettyCashService {
    // Generic CRUD operations
    static async fetchRecords(table, userId, options = {}) {
        try {
            let query = supabase.from(table).select(options.select || '*');

            // Add filters based on the table
            switch (table) {
                case 'acc_portal_pettycash_accounts':
                    query = query.eq('admin_id', userId);
                    break;
                case 'acc_portal_pettycash_users':
                    query = query
                        .eq('admin_id', userId)
                        .select(`
              *,
              acc_portal_pettycash_branches(branch_name),
              account_count:acc_portal_pettycash_accounts(count)
            `);
                    break;
                case 'acc_portal_pettycash_branches':
                    query = query.eq('userid', userId);
                    break;
                case 'acc_portal_pettycash_entries':
                    query = query.eq('userid', userId);
                    break;
            }

            if (options.orderBy) {
                query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform data if needed
            if (table === 'acc_portal_pettycash_users') {
                return data.map(user => ({
                    ...user,
                    account_count: user.account_count[0]?.count || 0
                }));
            }

            return data;
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
            toast.error(`Failed to fetch ${table}. Please try again.`);
            return [];
        }
    }

    static async createRecord(table, data, userId) {
        try {
            let recordData = { ...data };

            // Add specific fields based on table
            switch (table) {
                case 'acc_portal_pettycash_accounts':
                    recordData.admin_id = userId;
                    break;
                case 'acc_portal_pettycash_users':
                    recordData.admin_id = userId;
                    break;
                case 'acc_portal_pettycash_branches':
                    recordData.userid = userId;
                    break;
                case 'acc_portal_pettycash_entries':
                    recordData.userid = userId;
                    break;
            }

            const { data: result, error } = await supabase
                .from(table)
                .insert([recordData])
                .select();

            if (error) throw error;

            toast.success('Record created successfully!');
            return result;
        } catch (error) {
            console.error(`Error creating ${table}:`, error);
            toast.error(`Failed to create ${table} record. Please try again.`);
            return null;
        }
    }

    static async updateRecord(table, id, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select();

            if (error) throw error;

            toast.success('Record updated successfully!');
            return result;
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            toast.error(`Failed to update ${table} record. Please try again.`);
            return null;
        }
    }

    static async deleteRecord(table, id) {
        try {
            const { data, error } = await supabase
                .from(table)
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;

            toast.success('Record deleted successfully!');
            return data;
        } catch (error) {
            console.error(`Error deleting ${table}:`, error);
            toast.error(`Failed to delete ${table} record. Please try again.`);
            return null;
        }
    }

    static async verifyRecord(table, id) {
        try {
            const { data, error } = await supabase
                .from(table)
                .update({ is_verified: true, verified_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            if (error) throw error;

            toast.success('Record verified successfully!');
            return data;
        } catch (error) {
            console.error(`Error verifying ${table}:`, error);
            toast.error(`Failed to verify ${table} record. Please try again.`);
            return null;
        }
    }

    // Specific operations for Entries/Transactions
    static async uploadReceipt(file, path) {
        try {
            const { data, error } = await supabase
                .storage
                .from('Accounting-Portal')
                .upload(path, file);

            if (error) throw error;

            return data.path;
        } catch (error) {
            console.error('Error uploading receipt:', error);
            toast.error('Failed to upload receipt. Please try again.');
            return null;
        }
    }

    static async processTransaction(entryData, receiptFile, userId) {
        try {
            let receiptUrl = '';

            if (receiptFile) {
                const uploadPath = `petty-cash/${userId}/${entryData.account_type}/${receiptFile.name}`;
                receiptUrl = await this.uploadReceipt(receiptFile, uploadPath);

                if (!receiptUrl) throw new Error('Receipt upload failed');
            }

            const transactionData = {
                ...entryData,
                receipt_url: receiptUrl,
                userid: userId
            };

            const { data, error } = await supabase
                .from('acc_portal_pettycash_entries')
                .insert([transactionData])
                .select();

            if (error) throw error;

            // Update account balance
            await this.updateAccountBalance(entryData.account_type, entryData.amount, userId);

            toast.success('Transaction processed successfully!');
            return data;
        } catch (error) {
            console.error('Error processing transaction:', error);
            toast.error('Failed to process transaction. Please try again.');
            return null;
        }
    }

    static async updateAccountBalance(accountType, amount, userId) {
        try {
            const { data: account, error: fetchError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('balance')
                .eq('admin_id', userId)
                .eq('account_type', accountType)
                .single();

            if (fetchError) throw fetchError;

            const newBalance = account.balance - amount;

            const { data: updatedAccount, error: updateError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({ balance: newBalance })
                .eq('admin_id', userId)
                .eq('account_type', accountType)
                .select();

            if (updateError) throw updateError;

            return updatedAccount;
        } catch (error) {
            console.error('Error updating account balance:', error);
            throw error;
        }
    }

    // Account specific operations
    static async checkAccountLimits(accountId) {
        try {
            const { data: account, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('balance, min_amount, max_amount')
                .eq('id', accountId)
                .single();

            if (error) throw error;

            const needsReplenishment = account.balance < account.min_amount;
            const overLimit = account.balance > account.max_amount;

            return {
                needsReplenishment,
                overLimit,
                currentBalance: account.balance,
                minAmount: account.min_amount,
                maxAmount: account.max_amount
            };
        } catch (error) {
            console.error('Error checking account limits:', error);
            return null;
        }
    }
}

export default PettyCashService;