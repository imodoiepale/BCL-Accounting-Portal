// @ts-nocheck
"use client";

import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';



const handleSaveBranch = async (branch: Branch) => {
        try {
            if (dialogState.mode === 'create') {
                const newBranch = {
                    branch_name: branch.branch_name,
                    location: branch.location,
                    manager_name: branch.manager_name,
                    contact_number: branch.contact_number,
                    email: branch.email,
                    created_at: new Date().toISOString()
                };

                const result = await PettyCashService.createBranchRecord(
                    'acc_portal_pettycash_branches',
                    newBranch,
                    userId
                );

                if (result) {
                    toast.success('Branch created successfully');
                    fetchBranches();
                }
            } else {
                await PettyCashService.updateBranchRecord(
                    branch.branch_name,
                    branch,
                    userId
                );
                toast.success('Branch updated successfully');
                fetchBranches();
            }
            setDialogState({ isOpen: false, mode: 'create', branch: null });
        } catch (error) {
            console.error('Error saving branch:', error);
            toast.error(dialogState.mode === 'create' ? 'Failed to create branch' : 'Failed to update branch');
        }
    };

export class PettyCashService {
    // Generic CRUD operations
    static async fetchRecords(table, userId, options = {}) {
        try {
            let query = supabase.from(table).select(options.select || '*');

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
                case 'acc_portal_pettycash_users':
                    query = query.eq('userid', userId);
                    break;
                case 'acc_portal_pettycash_entries':
                    query = query.eq('userid', userId).order('invoice_date', { ascending: true });
                    break;
            }

            if (options.orderBy) {
                query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data.length === 0) {
                toast.info(`No data found for ${table}.`);
                return [];
            }

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

    // Add these methods to your existing PettyCashService class

    static async importSuppliers(suppliers: any[], userId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_suppliers')
                .insert(
                    suppliers.map(supplier => ({
                        userid: userId,
                        data: supplier
                    }))
                );

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error importing suppliers:', error);
            throw error;
        }
    }

    static async getSuppliersStats(userId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_suppliers')
                .select('data->supplierType')
                .eq('userid', userId);

            if (error) throw error;

            const stats = {
                total: data.length,
                corporate: data.filter(s => s.data.supplierType === 'Corporate').length,
                individual: data.filter(s => s.data.supplierType === 'Individual').length
            };

            return stats;
        } catch (error) {
            console.error('Error getting supplier stats:', error);
            throw error;
        }
    }

    static async searchSuppliers(userId: string, query: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_suppliers')
                .select('*')
                .eq('userid', userId)
                .or(`
        data->>'supplierName'.ilike.%${query}%,
        data->>'email'.ilike.%${query}%,
        data->>'pin'.ilike.%${query}%
      `);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching suppliers:', error);
            throw error;
        }
    }

    static async validateSupplierData(data: any) {
        const requiredFields = ['supplierName', 'supplierType', 'pin', 'mobile', 'email'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }

        // Validate mobile format (assuming Kenyan format)
        const mobileRegex = /^\+254\d{9}$/;
        if (!mobileRegex.test(data.mobile)) {
            throw new Error('Invalid mobile format. Use format: +254XXXXXXXXX');
        }

        // Validate PIN format (assuming Kenyan format)
        const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
        if (!pinRegex.test(data.pin)) {
            throw new Error('Invalid PIN format. Use format: A123456789P');
        }

        return true;
    }

    static async fetchBranchRecords(userId: string) {
        try {
            const { data: record, error } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No data found
                return { data: { branches: [] } };
            }

            if (error) throw error;

            // Return the raw record
            return record;
        } catch (error) {
            console.error('Error fetching branches:', error);
            return { data: { branches: [] } };
        }
    }

    static async createBranchRecord(table: string, branch: Branch, userId: string) {
        try {
            const { data: existingRecord } = await supabase
                .from(table)
                .select('*')
                .eq('userid', userId)
                .single();

            const branchData = {
                ...branch,
                created_at: new Date().toISOString()
            };

            let recordData;
            if (existingRecord) {
                const currentBranches = existingRecord.data?.branches || [];
                recordData = {
                    ...existingRecord,
                    data: {
                        branches: [...currentBranches, branchData]
                    }
                };
            } else {
                recordData = {
                    userid: userId,
                    data: {
                        branches: [branchData]
                    },
                    created_at: new Date().toISOString()
                };
            }

            const { data: result, error } = await supabase
                .from(table)
                .upsert([recordData])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating branch:', error);
            throw error;
        }
    }

    static async createUserRecord(userId: string, userData: User) {
        try {
            const { data: existingRecord } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            const userEntry = {
                ...userData,
                branch_id: userData.branch_id, // This is now the branch_name
                created_date: new Date().toISOString(),
                is_verified: false
            };

            let recordData;
            if (existingRecord) {
                const currentUsers = existingRecord.data?.users || [];
                recordData = {
                    ...existingRecord,
                    data: {
                        users: [...currentUsers, userEntry]
                    }
                };
            } else {
                recordData = {
                    userid: userId,
                    data: {
                        users: [userEntry]
                    }
                };
            }

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_users')
                .upsert([recordData])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async updateBranchRecord(branchName: string, branch: Branch, userId: string) {
        try {
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;

            const currentBranches = record?.data?.branches || [];
            const updatedBranches = currentBranches.map(existingBranch =>
                existingBranch.branch_name === branchName ? {
                    ...branch,
                    created_at: existingBranch.created_at // Preserve original creation date
                } : existingBranch
            );

            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_branches')
                .update({
                    data: { branches: updatedBranches }
                })
                .eq('userid', userId)
                .select();

            if (updateError) throw updateError;
            return result;
        } catch (error) {
            console.error('Error updating branch:', error);
            throw error;
        }
    }

    static async deleteBranchRecord(branchName: string, userId: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedBranches = record.data.branches.filter(
                branch => branch.branch_name !== branchName
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_branches')
                .update({
                    data: { branches: updatedBranches }
                })
                .eq('userid', userId)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error deleting branch:', error);
            throw error;
        }
    }

    static async fetchUserAndBranchData(userId: string) {
        try {
            // Fetch both users and branches data
            const [usersResponse, branchesResponse] = await Promise.all([
                supabase
                    .from('acc_portal_pettycash_users')
                    .select('*')
                    .eq('userid', userId)
                    .single(),
                supabase
                    .from('acc_portal_pettycash_branches')
                    .select('*')
                    .eq('userid', userId)
                    .single()
            ]);

            // Handle users data
            let users = [];
            if (!usersResponse.error) {
                users = usersResponse.data?.data?.users || [];
            }

            // Handle branches data
            let branches = [];
            if (!branchesResponse.error) {
                branches = branchesResponse.data?.data?.branches || [];
            }

            // Map branch data to users
            const usersWithBranches = users.map(user => ({
                ...user,
                branch_info: branches.find(b => b.branch_name === user.branch_id) || null
            }));

            return {
                users: usersWithBranches,
                branches: branches
            };
        } catch (error) {
            console.error('Error fetching users and branches:', error);
            throw error;
        }
    }

    static async fetchUserRecords(userId: string) {
        try {
            const { data: record, error } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No data found error code
                return [];
            }

            if (error) throw error;

            if (!record?.data?.users || record.data.users.length === 0) {
                toast.info('No users found.');
                return [];
            }

            return record.data.users;
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
            return [];
        }
    }

    static async createUserRecord(userId: string, userData: any) {
        try {
            const { data: existingRecord } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            const userEntry = {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                branch_id: userData.branch_id,
                default_currency: userData.default_currency || 'KES',
                cash_balance: userData.cash_balance || 0,
                credit_balance: userData.credit_balance || 0,
                mpesa_balance: userData.mpesa_balance || 0,
                created_date: new Date().toISOString(),
                is_verified: false
            };

            let recordData;
            if (existingRecord) {
                const currentUsers = existingRecord.data?.users || [];
                recordData = {
                    ...existingRecord,
                    data: {
                        users: [...currentUsers, userEntry]
                    }
                };
            } else {
                recordData = {
                    userid: userId,
                    data: {
                        users: [userEntry]
                    }
                };
            }

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_users')
                .upsert([recordData])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async updateUserRecord(userId: string, userEmail: string, updates: any) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedUsers = record.data.users.map(user =>
                user.email === userEmail ? { ...user, ...updates } : user
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_users')
                .update({
                    data: { users: updatedUsers }
                })
                .eq('userid', userId)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    static async deleteUserRecord(userId: string, userEmail: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedUsers = record.data.users.filter(
                user => user.email !== userEmail
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_users')
                .update({
                    data: { users: updatedUsers }
                })
                .eq('userid', userId)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    static async fetchAccountRecords(userId: string) {
        try {
            const { data: record, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No data found
                return { data: { accounts: [] } };
            }

            if (error) throw error;

            return record;
        } catch (error) {
            console.error('Error fetching accounts:', error);
            return { data: { accounts: [] } };
        }
    }

    static async createAccountRecord(userId: string, accountData: AccountData) {
        try {
            const { data: existingRecord } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            const accountEntry = {
                ...accountData,
                accountUser: accountData.accountUser, // This will now contain the user's name
                created_at: new Date().toISOString()
            };

            const recordData = existingRecord
                ? {
                    ...existingRecord,
                    data: {
                        accounts: [...(existingRecord.data?.accounts || []), accountEntry]
                    }
                }
                : {
                    userid: userId,
                    data: {
                        accounts: [accountEntry]
                    }
                };

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .upsert([recordData])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    }


    static async updateAccountRecord(accountNumber: string, account: AccountData, userId: string) {
        try {
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;

            const currentAccounts = record?.data?.accounts || [];
            const updatedAccounts = currentAccounts.map(existingAccount =>
                existingAccount.accountNumber === accountNumber ? {
                    ...account,
                    created_at: existingAccount.created_at,
                    status: account.endDate && new Date(account.endDate) <= new Date() ? 'Inactive' : 'Active'
                } : existingAccount
            );

            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: { accounts: updatedAccounts }
                })
                .eq('userid', userId)
                .select();

            if (updateError) throw updateError;
            return result;
        } catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    }

    static async deleteAccountRecord(accountNumber: string, userId: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedAccounts = record.data.accounts.filter(
                account => account.accountNumber !== accountNumber
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: { accounts: updatedAccounts }
                })
                .eq('userid', userId)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }

    static async verifyAccountRecord(accountNumber: string, userId: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedAccounts = record.data.accounts.map(account =>
                account.accountNumber === accountNumber
                    ? { ...account, is_verified: true, verified_at: new Date().toISOString() }
                    : account
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: { accounts: updatedAccounts }
                })
                .eq('userid', userId)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error verifying account:', error);
            throw error;
        }
    }


}

export default PettyCashService;