import { useState, useEffect, useCallback } from 'react';
import { EmailService, AddAccountOptions } from '@/lib/emailService';
import { EmailAccount } from '@/lib/emailClient';

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailService = EmailService.getInstance();

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAccounts = await emailService.getAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (options: AddAccountOptions) => {
    try {
      setError(null);
      const newAccount = await emailService.addAccount(options);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add email account');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    addAccount,
    refreshAccounts: fetchAccounts,
  };
}
