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

    static generateUUID(): string {
        return crypto.randomUUID();
    }

    // Generic CRUD operations
    static async fetchRecords(table, userId, options = {}) {
        try {
            let query = supabase.from(table).select(options.select || '*');

            switch (table) {
                case 'acc_portal_pettycash_accounts':
                    query = query.eq('userid', userId);
                    break;
                case 'acc_portal_pettycash_users':
                    query = query
                        .eq('userid', userId)
                        .select('*');
                    break;
                case 'acc_portal_pettycash_branches':
                    query = query.eq('userid', userId);
                    break;
                case 'acc_portal_pettycash_suppliers':
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
                toast.error(`No data found `);
                return [];
            }

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
                    recordData.userid = userId;
                    break;
                case 'acc_portal_pettycash_users':
                    recordData.userid = userId;
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
            // Fetch existing user records
            const { data: existingRecord, error: fetchError } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            // Get current users array or initialize empty array
            const currentUsers = existingRecord?.data?.users || [];

            // Create new user entry with numeric ID
            const nextId = currentUsers.length > 0
                ? Math.max(...currentUsers.map(user =>
                    parseInt(user.id) || 0  // Handle empty string IDs
                )) + 1
                : 1;

            const userEntry = {
                ...userData,
                id: nextId.toString(), // Store ID as string
                branch_id: userData.branch_id,
                created_date: new Date().toISOString(),
                is_verified: false,
                cash_balance: userData.cash_balance || 0,
                credit_balance: userData.credit_balance || 0,
                mpesa_balance: userData.mpesa_balance || 0,
            };

            // Prepare record data
            const recordData = {
                userid: userId,
                data: {
                    users: existingRecord
                        ? [...currentUsers, userEntry]
                        : [userEntry]
                }
            };

            // If there was existing data, maintain other fields
            if (existingRecord) {
                Object.assign(recordData, {
                    ...existingRecord,
                    data: {
                        ...existingRecord.data,
                        users: [...currentUsers, userEntry]
                    }
                });
            }

            // Upsert the record
            const { data: result, error: upsertError } = await supabase
                .from('acc_portal_pettycash_users')
                .upsert([recordData])
                .select();

            if (upsertError) throw upsertError;
            return result;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }


    static async updateBranchRecord(branchId: string, updatedBranch: Branch, userId: string) {
        try {
            // First, fetch the current record
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;
            if (!record?.data?.branches) throw new Error('No branches found');

            // Find and update the specific branch by ID
            const updatedBranches = record.data.branches.map(branch =>
                branch.id === branchId
                    ? {
                        ...branch,
                        ...updatedBranch,
                        id: branchId, // Preserve the ID
                        created_at: branch.created_at, // Preserve original creation date
                        updated_at: new Date().toISOString() // Add update timestamp
                    }
                    : branch
            );

            // Check if branch was found and updated
            if (!updatedBranches.some(branch => branch.id === branchId)) {
                throw new Error('Branch not found');
            }

            // Prepare update data
            const recordData = {
                ...record,
                data: {
                    ...record.data,
                    branches: updatedBranches
                }
            };

            // Update the record
            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_branches')
                .update(recordData)
                .eq('userid', userId)
                .select();

            if (updateError) throw updateError;
            return result;
        } catch (error) {
            console.error('Error updating branch:', error);
            throw error;
        }
    }

    static async deleteBranchRecord(branchId: string, userId: string) {
        try {
            // First, fetch the current record
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            if (!record?.data?.branches) {
                throw new Error('No branches found');
            }

            // Find the branch to be deleted
            const branchToDelete = record.data.branches.find(branch => branch.id === branchId);
            if (!branchToDelete) {
                throw new Error('Branch not found');
            }

            // Check for associated data (users, accounts, etc.)
            const { data: associatedUsers } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId);

            const hasAssociatedUsers = associatedUsers?.some(user =>
                user.data?.users?.some(u => u.branch_id === branchToDelete.branch_name)
            );

            if (hasAssociatedUsers) {
                throw new Error('Cannot delete branch with associated users. Please reassign or delete users first.');
            }

            // Remove the branch from the array
            const updatedBranches = record.data.branches.filter(branch => branch.id !== branchId);

            // Add deletion audit trail
            const auditTrail = {
                ...(record.data.auditTrail || {}),
                deletions: [
                    ...(record.data.auditTrail?.deletions || []),
                    {
                        branchId,
                        branchName: branchToDelete.branch_name,
                        deletedAt: new Date().toISOString(),
                        deletedBy: userId
                    }
                ]
            };

            // Update the record
            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_branches')
                .update({
                    data: {
                        branches: updatedBranches,
                        auditTrail
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('userid', userId)
                .select();

            if (updateError) {
                throw updateError;
            }

            // Optional: Archive the deleted branch data
            try {
                await supabase
                    .from('acc_portal_pettycash_branches_archive')
                    .insert([{
                        userid: userId,
                        branch_id: branchId,
                        branch_data: branchToDelete,
                        deleted_at: new Date().toISOString()
                    }]);
            } catch (archiveError) {
                console.warn('Failed to archive branch data:', archiveError);
                // Don't throw error here as the main deletion was successful
            }

            return result;
        } catch (error) {
            console.error('Error deleting branch:', error);
            throw error;
        }
    }

    static async verifyBranchRecord(branchId: string, userId: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_branches')
                .select('*')
                .eq('userid', userId)
                .single();

            const updatedBranches = record.data.branches.map(branch =>
                branch.id === branchId
                    ? { ...branch, is_verified: true, verified_at: new Date().toISOString() }
                    : branch
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
            console.error('Error verifying branch:', error);
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


    static async updateUserRecord(userId: string, userUuid: string, updateData: Partial<User>) {
        try {
            // Fetch current record
            const { data: existingRecord, error: fetchError } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;
            if (!existingRecord?.data?.users) throw new Error('No users found');

            // Find and update the specific user by UUID
            const updatedUsers = existingRecord.data.users.map(user =>
                user.id === userUuid
                    ? {
                        ...user,
                        ...updateData,
                        id: userUuid, // Preserve the UUID
                        updated_date: new Date().toISOString() // Optional: track update time
                    }
                    : user
            );

            // Check if user was found and updated
            if (!updatedUsers.some(user => user.id === userUuid)) {
                throw new Error('User not found');
            }

            // Prepare update data
            const recordData = {
                ...existingRecord,
                data: {
                    ...existingRecord.data,
                    users: updatedUsers
                }
            };

            // Update the record
            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_users')
                .update(recordData)
                .eq('userid', userId)
                .select();

            if (updateError) throw updateError;
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

    static async fetchUserRecords(userId: string) {
        try {
            console.log('Fetching user records for userId:', userId);

            const { data: record, error } = await supabase
                .from('acc_portal_pettycash_users')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('No users found, returning empty array');
                    return [];
                }
                throw error;
            }

            // Ensure we have users data
            const users = record?.data?.users || [];
            console.log('Found users:', users);

            return users;
        } catch (error) {
            console.error('Error in fetchUserRecords:', error);
            return [];
        }
    }

    static async createAccountRecord(userId: string, accountData: AccountData) {
        try {
            // First, fetch existing record
            const { data: existingRecord } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            // Prepare the account entry
            const accountEntry = {
                ...accountData,
                id: accountData.id || crypto.randomUUID(),
                created_at: new Date().toISOString(),
                is_verified: false
            };

            let recordData;
            if (existingRecord) {
                // If record exists, append to existing accounts array
                const currentAccounts = existingRecord.data?.accounts || [];
                recordData = {
                    ...existingRecord,
                    data: {
                        accounts: [...currentAccounts, accountEntry]
                    }
                };
            } else {
                // If no record exists, create new record with single account
                recordData = {
                    userid: userId,
                    data: {
                        accounts: [accountEntry]
                    },
                    created_at: new Date().toISOString()
                };
            }

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

    static async fetchAccountRecords(userId: string) {
        try {
            const { data: record, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No data found
                    return { data: { accounts: [] } };
                }
                throw error;
            }

            // Return the accounts array from inside the data object
            return record.data?.accounts || [];
        } catch (error) {
            console.error('Error fetching accounts:', error);
            throw error;
        }
    }

    static async updateAccountRecord(accountId: string, updatedAccount: AccountData, userId: string) {
        try {
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;
            if (!record?.data?.accounts) throw new Error('No accounts found');

            const updatedAccounts = record.data.accounts.map(account =>
                account.id === accountId
                    ? {
                        ...account,
                        ...updatedAccount,
                        id: accountId, // Preserve the ID
                        created_at: account.created_at, // Preserve original creation date
                        updated_at: new Date().toISOString()
                    }
                    : account
            );

            if (!updatedAccounts.some(account => account.id === accountId)) {
                throw new Error('Account not found');
            }

            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: {
                        accounts: updatedAccounts
                    },
                    updated_at: new Date().toISOString()
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

    static async deleteAccountRecord(accountId: string, userId: string) {
        try {
            // First, fetch current record
            const { data: record, error: fetchError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (fetchError) throw fetchError;
            if (!record?.data?.accounts) throw new Error('No accounts found');

            // Find the account to be deleted
            const accountToDelete = record.data.accounts.find(account => account.id === accountId);
            if (!accountToDelete) {
                throw new Error('Account not found');
            }

            // Check for associated transactions
            const { data: associatedTransactions } = await supabase
                .from('acc_portal_pettycash_entries')
                .select('*')
                .eq('account_id', accountId)
                .limit(1);

            if (associatedTransactions?.length > 0) {
                throw new Error('Cannot delete account with associated transactions');
            }

            // Remove the account from the array
            const updatedAccounts = record.data.accounts.filter(account => account.id !== accountId);

            // Add to audit trail
            const auditTrail = {
                ...(record.data.auditTrail || {}),
                deletions: [
                    ...(record.data.auditTrail?.deletions || []),
                    {
                        accountId,
                        accountNumber: accountToDelete.accountNumber,
                        deletedAt: new Date().toISOString(),
                        deletedBy: userId
                    }
                ]
            };

            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: {
                        accounts: updatedAccounts,
                        auditTrail
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('userid', userId)
                .select();

            if (updateError) throw updateError;

            // Archive the deleted account
            try {
                await supabase
                    .from('acc_portal_pettycash_accounts_archive')
                    .insert([{
                        userid: userId,
                        account_id: accountId,
                        account_data: accountToDelete,
                        deleted_at: new Date().toISOString()
                    }]);
            } catch (archiveError) {
                console.warn('Failed to archive account data:', archiveError);
            }

            return result;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }

    static async verifyAccountRecord(accountId: string, userId: string) {
        try {
            const { data: record } = await supabase
                .from('acc_portal_pettycash_accounts')
                .select('*')
                .eq('userid', userId)
                .single();

            if (!record?.data?.accounts) throw new Error('No accounts found');

            const updatedAccounts = record.data.accounts.map(account =>
                account.id === accountId
                    ? {
                        ...account,
                        is_verified: true,
                        verified_at: new Date().toISOString()
                    }
                    : account
            );

            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_accounts')
                .update({
                    data: {
                        accounts: updatedAccounts
                    }
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
    // Add to PettyCashService.tsx
    static async getNextEntryNumber(userId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_entries')
                .select('id')
                .eq('userid', userId);

            if (error) throw error;
            return (data?.length || 0) + 1;
        } catch (error) {
            console.error('Error getting next entry number:', error);
            return 1;
        }
    }

    // Add these methods to PettyCashService class

    static async fetchReimbursementRecords(userId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_reimbursements')
                .select('*')
                .eq('userid', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching reimbursements:', error);
            throw error;
        }
    }

    static async createReimbursementRecord(userId: string, data: any) {
        try {
            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_reimbursements')
                .insert([{
                    userid: userId,
                    ...data,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating reimbursement:', error);
            throw error;
        }
    }

    static async updateReimbursementRecord(id: string, data: any) {
        try {
            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_reimbursements')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating reimbursement:', error);
            throw error;
        }
    }

    static async deleteReimbursementRecord(id: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_reimbursements')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error deleting reimbursement:', error);
            throw error;
        }
    }

    // Add these methods to PettyCashService class

    static async fetchLoanRecords(userId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_loans')
                .select('*')
                .eq('userid', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching loans:', error);
            throw error;
        }
    }

    static async createLoanRecord(userId: string, data: any) {
        try {
            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_loans')
                .insert([{
                    userid: userId,
                    ...data,
                    created_at: new Date().toISOString(),
                    remaining_amount: data.amount - (data.paid_amount || 0)
                }])
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating loan:', error);
            throw error;
        }
    }

    static async updateLoanRecord(id: string, data: any) {
        try {
            const { data: result, error } = await supabase
                .from('acc_portal_pettycash_loans')
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                    remaining_amount: data.amount - (data.paid_amount || 0)
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating loan:', error);
            throw error;
        }
    }

    static async deleteLoanRecord(id: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_loans')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error deleting loan:', error);
            throw error;
        }
    }

    static async recordLoanPayment(loanId: string, paymentAmount: number) {
        try {
            // First get the current loan record
            const { data: loan, error: fetchError } = await supabase
                .from('acc_portal_pettycash_loans')
                .select('*')
                .eq('id', loanId)
                .single();

            if (fetchError) throw fetchError;

            const newPaidAmount = (loan.paid_amount || 0) + paymentAmount;
            const remainingAmount = loan.amount - newPaidAmount;
            const payment_status =
                remainingAmount <= 0 ? 'Paid' :
                    newPaidAmount > 0 ? 'Partially Paid' : 'Pending';

            // Update the loan record
            const { data: result, error: updateError } = await supabase
                .from('acc_portal_pettycash_loans')
                .update({
                    paid_amount: newPaidAmount,
                    remaining_amount: remainingAmount,
                    payment_status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', loanId)
                .select();

            if (updateError) throw updateError;

            // Record the payment in the loan_payments table
            const { error: paymentError } = await supabase
                .from('acc_portal_pettycash_loan_payments')
                .insert([{
                    loan_id: loanId,
                    amount: paymentAmount,
                    payment_date: new Date().toISOString(),
                }]);

            if (paymentError) throw paymentError;

            return result;
        } catch (error) {
            console.error('Error recording loan payment:', error);
            throw error;
        }
    }

    static async getLoanPaymentHistory(loanId: string) {
        try {
            const { data, error } = await supabase
                .from('acc_portal_pettycash_loan_payments')
                .select('*')
                .eq('loan_id', loanId)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching loan payment history:', error);
            throw error;
        }
    }

}

export default PettyCashService;