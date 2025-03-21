// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from 'react-hot-toast';
import { EmailList } from './components/EmailList';
import { useEmailAccounts } from './hooks/useEmailAccounts';
import { useGmailFilters } from './hooks/useGmailFilters';
import EmailPopup from './components/EmailPopup';
import FilterManager from './components/FilterManager';
import { AddAccountModal } from './components/AddAccountModal';
import { PlusCircle, RefreshCw, Trash2, Search, Inbox, Mail, Star, Settings2, X, UserCircle } from 'lucide-react';
import { getEmailColor } from './utils/colors';

export default function GmailManager() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showPopup, setShowPopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [showFilterManager, setShowFilterManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  const {
    accounts,
    loading,
    showAddAccount,
    setShowAddAccount,
    addAccount,
    removeAccount,
    fetchMessages,
    sendMessage
  } = useEmailAccounts();

  const {
    filters,
    selectedFilter,
    setSelectedFilter,
    addFilter,
    editFilter,
    removeFilter,
    resetFilters,
    applyFilters
  } = useGmailFilters();

  // Filter accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!accountSearchQuery) return accounts;
    return accounts.filter(account => 
      account.email.toLowerCase().includes(accountSearchQuery.toLowerCase())
    );
  }, [accounts, accountSearchQuery]);

  const handleEmailClick = (message: any) => {
    setCurrentMessage(message);
    setShowPopup(true);
  };

  const handleReply = async (message: any, content: string) => {
    try {
      await sendMessage(message.accountEmail, {
        to: [message.payload.headers.find(h => h.name === 'From')?.value],
        subject: `Re: ${message.payload.headers.find(h => h.name === 'Subject')?.value}`,
        text: content,
      });
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handleForward = async (message: any, to: string[], content: string) => {
    try {
      await sendMessage(message.accountEmail, {
        to,
        subject: `Fwd: ${message.payload.headers.find(h => h.name === 'Subject')?.value}`,
        text: content,
      });
    } catch (error) {
      console.error('Failed to forward message:', error);
    }
  };

  const refreshAllAccounts = async () => {
    try {
      for (const account of accounts) {
        await fetchMessages(account.email);
      }
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
    }
  };

  // Combine all messages from all accounts and add account information
  const allMessages = accounts.reduce((acc, account) => {
    if (account.messages) {
      const messagesWithAccount = account.messages.map(message => ({
        ...message,
        accountEmail: account.email
      }));
      return [...acc, ...messagesWithAccount];
    }
    return acc;
  }, []);

  // Filter messages based on the selected account
  const filteredMessages = selectedAccount === 'all'
    ? allMessages
    : allMessages.filter(message => message.accountEmail === selectedAccount);

  // Apply custom filters
  const customFilteredMessages = applyFilters(filteredMessages).sort((a, b) => {
    return parseInt(b.internalDate) - parseInt(a.internalDate);
  });

  // Filter messages based on search query
  const searchFilteredMessages = customFilteredMessages.filter(message => {
    const subject = message.payload.headers.find(header => header.name === 'Subject')?.value || '';
    const from = message.payload.headers.find(header => header.name === 'From')?.value || '';
    const snippet = message.snippet || '';
    return (
      subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r flex flex-col">
        <div className="p-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Accounts</h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowAddAccount(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Add Account
            </button>
            {accounts.length > 0 && (
              <button
                onClick={refreshAllAccounts}
                className="w-full flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-sm"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh All
              </button>
            )}
          </div>
          
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full h-8 text-sm mt-2">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                <SelectValue placeholder="Select account" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <SelectItem value="all" className="rounded-md">
                  <span className="font-medium">All Accounts</span>
                </SelectItem>
                {filteredAccounts.map((account) => (
                  <SelectItem 
                    key={account.email} 
                    value={account.email}
                    className="rounded-md"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getEmailColor(account.email)}`}>
                          {account.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {account.authMethod === 'oauth' ? 'OAuth' : 'IMAP'}
                        </Badge>
                      </div>
                      {selectedAccount === account.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAccount(account.email);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Controls */}
        <div className="bg-white border-b px-4 py-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                selectedFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setSelectedFilter('unread')}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                selectedFilter === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Unread
            </button>
            <button
              onClick={() => setSelectedFilter('important')}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                selectedFilter === 'important' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4" />
              Important
            </button>
            <button
              onClick={() => setShowFilterManager(true)}
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
            >
              <Settings2 className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto">
          <EmailList
            messages={searchFilteredMessages}
            onLoadMore={() => fetchMessages(selectedAccount === 'all' ? accounts[0]?.email : selectedAccount)}
            hasMore={true}
            loading={loading}
            onEmailClick={handleEmailClick}
          />
        </div>
      </div>

      {/* Popups */}
      {showPopup && currentMessage && (
        <EmailPopup
          message={currentMessage}
          onClose={() => setShowPopup(false)}
          onReply={handleReply}
          onForward={handleForward}
        />
      )}

      {showFilterManager && (
        <FilterManager
          filters={filters}
          onAddFilter={addFilter}
          onEditFilter={editFilter}
          onRemoveFilter={removeFilter}
          onClose={() => setShowFilterManager(false)}
        />
      )}

      {showAddAccount && (
        <AddAccountModal
          isOpen={showAddAccount}
          onClose={() => setShowAddAccount(false)}
          onAccountAdded={(account) => {
            setShowAddAccount(false);
            // Refresh accounts list
            fetchMessages(account.email);
          }}
          onOAuthSelected={() => {
            setShowAddAccount(false);
            addAccount({
              email: '',
              provider: 'gmail',
              authMethod: 'oauth'
            });
          }}
        />
      )}
    </div>
  );
}