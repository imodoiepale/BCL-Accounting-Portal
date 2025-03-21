import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Key } from 'lucide-react';
import { EmailClient, EmailAccount } from '@/lib/emailClient';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: (account: EmailAccount) => void;
  onOAuthSelected: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
  onOAuthSelected,
}) => {
  const [authMethod, setAuthMethod] = useState<'oauth' | 'app_password'>('oauth');
  const [provider, setProvider] = useState<EmailAccount['provider']>('gmail');
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMethod === 'oauth') {
        onOAuthSelected();
        onClose();
        return;
      }

      const emailClient = EmailClient.getInstance();
      const account = await emailClient.addAccount(
        email,
        provider as EmailAccount['provider'],
        appPassword
      );
      onAccountAdded(account);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAuthMethod('oauth');
    setProvider('gmail');
    setEmail('');
    setAppPassword('');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      resetForm();
      onClose();
    }}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Add Email Account</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Authentication Method</label>
              <Select value={authMethod} onValueChange={(value: 'oauth' | 'app_password') => setAuthMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oauth">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      OAuth 2.0
                    </div>
                  </SelectItem>
                  <SelectItem value="app_password">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      App Password
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authMethod === 'app_password' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Provider</label>
                  <Select value={provider} onValueChange={(value: EmailAccount['provider']) => setProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">App Password</label>
                  <Input
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Your app-specific password"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Generate an app password from your email provider&apos;s security settings
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (authMethod === 'app_password' && (!email || !appPassword))}
              >
                {loading ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};
