// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from 'react-hot-toast';
import { EmailList } from './components/EmailList';
import { useGmailAuth } from './hooks/useGmailAuth';
import { useGmailMessages } from './hooks/useGmailMessages';
import { useGmailFilters } from './hooks/useGmailFilters';
import EmailPopup from './components/EmailPopup';
import FilterManager from './components/FilterManager';

export default function GmailManager() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showPopup, setShowPopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [showFilterManager, setShowFilterManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    accounts,
    setAccounts,
    addNewAccount,
    removeAccount,
  } = useGmailAuth();

  const {
    loading,
    hasMore,
    fetchMessages,
    refreshAllAccounts,
    handleReply,
    handleForward
  } = useGmailMessages(accounts, setAccounts);

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

  const handleEmailClick = (message: any) => {
    setCurrentMessage(message);
    setShowPopup(true);
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
    <div className="min-h-screen bg-gray-100 py-8 flex">
      <Toaster position="top-right" />

      {/* Accounts Section */}
      <div className="w-1/4 sticky top-0 bg-white rounded-lg shadow p-4 mr-4">
        <h2 className="text-lg font-bold mb-4">Accounts</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={addNewAccount}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Account
          </button>
          {accounts.length > 0 && (
            <>
              <button
                onClick={refreshAllAccounts}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                disabled={loading}
              >
                Refresh All
              </button>
              {selectedAccount !== 'all' && (
                <button
                  onClick={() => removeAccount(selectedAccount)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </>
          )}
          <Select value={selectedAccount} onValueChange={setSelectedAccount} className="mt-4">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.email} value={account.email}>
                  {account.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="w-3/4">
        <div className="sticky top-0 bg-white z-10 shadow">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Gmail Manager
          </h1>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-lg p-2 w-100px"
            />
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => setSelectedFilter(filter.name)}
                  className={`px-4 py-2 rounded-lg ${selectedFilter === filter.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span>{filter.name}</span>
                    {filter.criteria.length > 0 && (
                      <Badge variant="secondary" className="bg-opacity-20">
                        {filter.criteria.length}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowFilterManager(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Manage Filters
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          <EmailList
            messages={searchFilteredMessages}
            onLoadMore={() => fetchMessages(selectedAccount === 'all' ? accounts[0]?.email : selectedAccount)}
            hasMore={hasMore}
            loading={loading}
            onEmailClick={handleEmailClick}
          />
        </div>

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
      </div>
    </div>
  );
}