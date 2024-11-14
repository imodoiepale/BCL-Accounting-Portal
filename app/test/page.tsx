// @ts-nocheck
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Paperclip, Star, Clock } from "lucide-react";
import EmailFilter from './EmailFilter';
import EmailPopup from './EmailPopup';
import FilterManager from './FilterManager';
import settings from './settings.json'; // Import settings from JSON
import { toast, Toaster } from 'react-hot-toast';

interface FilterCriteria {
  type: 'from' | 'to' | 'subject' | 'unread' | 'important' | 'bodyContent';
  value: string | boolean;
}

interface Filter {
  name: string;
  criteria: FilterCriteria[];
}

const Email = ({ message, accountEmail, onClick }) => {
  const getHeader = (headers, name) => {
    return headers.find(header => header.name === name)?.value || '';
  };

  const formatDate = (internalDate) => {
    const date = new Date(parseInt(internalDate));
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const hasAttachments = message.payload.parts?.some(part => part.filename && part.filename.length > 0);

  return (
    <div onClick={() => onClick(message)} className="p-4 border-b hover:bg-blue-50 transition-colors cursor-pointer group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
            {getHeader(message.payload.headers, 'From').charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-gray-900 truncate pr-2">
              {getHeader(message.payload.headers, 'Subject') || '(no subject)'}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAttachments && (
                <Paperclip className="w-4 h-4 text-gray-400" />
              )}
              <Badge variant="outline" className="text-xs">
                {accountEmail}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span className="font-medium truncate">
              {getHeader(message.payload.headers, 'From').split('<')[0].trim()}
            </span>
            <span className="text-gray-400">•</span>
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">{formatDate(message.internalDate)}</span>
          </div>

          <div className="text-sm text-gray-500 line-clamp-2">
            {message.snippet}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailList = ({ messages, onLoadMore, hasMore, loading, onEmailClick }) => {
  const observer = useRef();
  const lastEmailRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, onLoadMore]);

  if (!messages.length && !loading) {
    return (
      <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium">No messages to display</p>
        <p className="text-sm">Add an account to start viewing emails</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y overflow-y-auto max-h-[60vh]">
      {messages.map((message, index) => {
        if (index === messages.length - 1) {
          return (
            <div ref={lastEmailRef} key={`${message.accountEmail}-${message.id}`}>
              <Email message={message} accountEmail={message.accountEmail} onClick={onEmailClick} />
            </div>
          );
        }
        return (
          <Email
            key={`${message.accountEmail}-${message.id}`}
            message={message}
            accountEmail={message.accountEmail}
            onClick={onEmailClick}
          />
        );
      })}
      {loading && (
        <div className="p-4">
          <EmailSkeleton />
          <EmailSkeleton />
          <EmailSkeleton />
        </div>
      )}
    </div>
  );
};

const EmailSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  </div>
);

export default function GmailManager() {
  const [filters, setFilters] = useState(settings.defaultFilters);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState(filters[0].name);
  const [tokenClient, setTokenClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [showFilterManager, setShowFilterManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  const CLIENT_ID = '342538819907-2v86oir8ip9m4nvurqs6g4j1ohsqc2sg.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyCAtdOy5Tj8Orjm4HM5LlwOl8bWEf2-81c';
  const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify';

  useEffect(() => {
    const loadGapiScript = document.createElement('script');
    loadGapiScript.src = 'https://apis.google.com/js/api.js';
    loadGapiScript.onload = initGapi;
    document.body.appendChild(loadGapiScript);

    const loadGsiScript = document.createElement('script');
    loadGsiScript.src = 'https://accounts.google.com/gsi/client';
    loadGsiScript.onload = initGsi;
    document.body.appendChild(loadGsiScript);

    return () => {
      document.body.removeChild(loadGapiScript);
      document.body.removeChild(loadGsiScript);
    };
  }, []);

  const initGapi = async () => {
    await new Promise((resolve) => gapi.load('client', resolve));
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    });
  };

  const initGsi = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
      redirect_uri: window.location.origin,
    });
    setTokenClient(client);
  };

  const handleTokenResponse = async (response) => {
    if (response.error) return;

    try {
      const userInfo = await gapi.client.gmail.users.getProfile({ userId: 'me' });
      const email = userInfo.result.emailAddress;

      if (!accounts.find(acc => acc.email === email)) {
        const newAccount = {
          email,
          token: gapi.client.getToken()
        };
        setAccounts(prev => [...prev, newAccount]);
        setSelectedAccount(email);
        await fetchMessages(email);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
  };

  const addNewAccount = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const removeAccount = () => {
    const account = accounts.find(acc => acc.email === selectedAccount);
    if (account?.token) {
      google.accounts.oauth2.revoke(account.token.access_token);
    }
    setAccounts(prev => prev.filter(acc => acc.email !== selectedAccount));
    setSelectedAccount(accounts[0]?.email || 'all');
  };

  const refreshAllAccounts = async () => {
    setLoading(true);
    for (const account of accounts) {
      gapi.client.setToken(account.token);
      await fetchMessages(account.email);
    }
    setLoading(false);
  };

  const fetchMessages = async (email, nextPageToken = null) => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        pageToken: nextPageToken
      });

      const messagesData = await Promise.all(
        response.result.messages.map(async (message) => {
          const details = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });
          return details.result;
        })
      );

      setPageToken(response.result.nextPageToken || '');
      setHasMore(!!response.result.nextPageToken);

      setAccounts(prev => prev.map(acc => {
        if (acc.email === email) {
          return {
            ...acc,
            messages: nextPageToken
              ? [...(acc.messages || []), ...messagesData]
              : messagesData
          };
        }
        return acc;
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore || !selectedAccount) return;
    await fetchMessages(selectedAccount === 'all' ? accounts[0].email : selectedAccount, pageToken);
  };

  const addFilter = (newFilter: Filter) => {
    setFilters((prev) => [...prev, newFilter]);
    setSelectedFilter(newFilter.name);
    toast.success('Filter added successfully');
  };

  const editFilter = (oldName: string, newFilter: Filter) => {
    setFilters((prev) => prev.map(filter =>
      filter.name === oldName ? newFilter : filter
    ));
    setSelectedFilter(newFilter.name);
    toast.success('Filter updated successfully');
  };

  const removeFilter = (filterName: string) => {
    setFilters((prev) => prev.filter(filter => filter.name !== filterName));
    setSelectedFilter(filters[0]?.name || 'All');
    toast.success('Filter removed successfully');
  };

  const applyFilters = (messages) => {
    const activeFilter = filters.find(filter => filter.name === selectedFilter);
    if (!activeFilter) return messages;

    return messages.filter((message) => {
      return activeFilter.criteria.every((criterion) => {
        const getHeader = (name) => {
          return message.payload.headers.find(header => header.name === name)?.value || '';
        };

        switch (criterion.type) {
          case 'from':
            return getHeader('From').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'to':
            return getHeader('To').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'subject':
            return getHeader('Subject').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'bodyContent':
            return message.snippet.toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'unread':
            return criterion.value ? message.labelIds.includes('UNREAD') : true;
          case 'important':
            return criterion.value ? message.labelIds.includes('IMPORTANT') : true;
          default:
            return true;
        }
      });
    });
  };

  const handleEmailClick = (message) => {
    setCurrentMessage(message);
    setShowPopup(true);
  };

  const handleReply = async (message, replyContent) => {
    try {
      // Get the necessary headers from the original message
      const getHeader = (headers, name) => {
        return headers.find(header => header.name === name)?.value || '';
      };

      const originalFrom = getHeader(message.payload.headers, 'From');
      const originalSubject = getHeader(message.payload.headers, 'Subject');
      const originalMessageId = getHeader(message.payload.headers, 'Message-ID');
      const originalReferences = getHeader(message.payload.headers, 'References');

      // Construct the reply subject
      const replySubject = originalSubject.startsWith('Re:')
        ? originalSubject
        : `Re: ${originalSubject}`;

      // Construct the reply-to email address
      const replyTo = originalFrom.match(/<(.+)>/)
        ? originalFrom.match(/<(.+)>/)[1]
        : originalFrom;

      // Create the email content in MIME format
      const emailContent = [
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${originalMessageId}`,
        `References: ${originalReferences ? originalReferences + ' ' : ''}${originalMessageId}`,
        '',
        replyContent,
        '',
        '---Original Message---',
        `From: ${originalFrom}`,
        `Subject: ${originalSubject}`,
        `${message.snippet}...`
      ].join('\r\n');

      // Encode the email content in base64URL format
      const encodedMessage = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Get the account that received the original message
      const account = accounts.find(acc => acc.email === message.accountEmail);
      if (!account) {
        throw new Error('Account not found');
      }

      // Set the token for the correct account
      gapi.client.setToken(account.token);

      // Send the reply using Gmail API
      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
          threadId: message.threadId
        }
      });

      if (response.status === 200) {
        // Refresh messages after successful reply
        await fetchMessages(message.accountEmail);

        // Show success notification (you'll need to implement this)
        toast.success('Reply sent to successfully!');
      } else {
        throw new Error('Failed to send reply');
      }

    } catch (error) {
      console.error('Error sending reply:', error);
      // Show error notification (you'll need to implement this)
      toast.error('Failed to send reply');
    }
  };


  const handleForward = async (message, forwardTo, forwardContent) => {
    try {
      // Get headers from original message
      const getHeader = (headers, name) => {
        return headers.find(header => header.name === name)?.value || '';
      };

      const originalFrom = getHeader(message.payload.headers, 'From');
      const originalSubject = getHeader(message.payload.headers, 'Subject');
      const originalDate = getHeader(message.payload.headers, 'Date');

      // Construct the forward subject
      const forwardSubject = originalSubject.startsWith('Fwd:')
        ? originalSubject
        : `Fwd: ${originalSubject}`;

      // Function to decode base64 content
      const decodeBase64 = (data) => {
        const buffer = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        return buffer.toString('utf8');
      };

      // Function to get email body and attachments
      const getEmailParts = (payload) => {
        const parts = [];

        const processPart = (part) => {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            parts.push({
              mimeType: part.mimeType,
              content: part.body.data ? decodeBase64(part.body.data) : '',
            });
          } else if (part.parts) {
            part.parts.forEach(processPart);
          }

          // Handle attachments
          if (part.filename && part.body.attachmentId) {
            parts.push({
              mimeType: part.mimeType,
              filename: part.filename,
              attachmentId: part.body.attachmentId,
            });
          }
        };

        if (payload.parts) {
          payload.parts.forEach(processPart);
        } else {
          processPart(payload);
        }

        return parts;
      };

      // Get email parts
      const emailParts = getEmailParts(message.payload);

      // Get attachments if any
      const attachments = [];
      for (const part of emailParts) {
        if (part.attachmentId) {
          try {
            const attachment = await gapi.client.gmail.users.messages.attachments.get({
              userId: 'me',
              messageId: message.id,
              id: part.attachmentId
            });

            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              data: attachment.result.data
            });
          } catch (error) {
            console.error('Error fetching attachment:', error);
          }
        }
      }

      // Generate boundary for multipart message
      const boundary = `boundary_${Math.random().toString(36).substr(2)}`;

      // Construct email content
      let emailContent = [
        'MIME-Version: 1.0',
        `To: ${forwardTo}`,
        `Subject: ${forwardSubject}`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        forwardContent,
        '',
        '---------- Forwarded message ----------',
        `From: ${originalFrom}`,
        `Date: ${originalDate}`,
        `Subject: ${originalSubject}`,
        '',
      ].join('\r\n');

      // Add original message content
      const textContent = emailParts.find(part => part.mimeType === 'text/plain')?.content || '';
      const htmlContent = emailParts.find(part => part.mimeType === 'text/html')?.content || '';

      emailContent += textContent || htmlContent;
      emailContent += '\r\n';

      // Add attachments
      for (const attachment of attachments) {
        emailContent += [
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.data,
          ''
        ].join('\r\n');
      }

      // Close multipart message
      emailContent += `--${boundary}--`;

      // Encode the email content in base64URL format
      const encodedMessage = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Get the account that received the original message
      const account = accounts.find(acc => acc.email === message.accountEmail);
      if (!account) {
        throw new Error('Account not found');
      }

      // Set the token for the correct account
      gapi.client.setToken(account.token);

      // Send the forwarded message
      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage
        }
      });

      if (response.status === 200) {
        // Refresh messages after successful forward
        await fetchMessages(message.accountEmail);
        showNotification('Message forwarded successfully', 'success');
      } else {
        throw new Error('Failed to forward message');
      }

    } catch (error) {
      console.error('Error forwarding message:', error);
      showNotification('Failed to forward message: ' + error.message, 'error');
    }
  };

  // Add this utility function for notifications
  const showNotification = (message, type = 'info') => {
    // You can implement this using your preferred notification system
    // For example, using a toast library or custom notification component
    console.log(`${type.toUpperCase()}: ${message}`);

    // Example implementation using alert (replace with proper UI notification)
    alert(message);
  };

  // Add this component to your project
  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
        {message}
      </div>
    );
  };

  // Add state for notifications in GmailManager
  const [notification, setNotification] = useState(null);

  // Add to your GmailManager return statement
  {
    notification && (
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)}
      />
    )
  }

  const resetFilters = () => {
    setFilters(settings.defaultFilters);
    setSelectedFilter(settings.defaultFilters[0].name);
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
  const finalMessages = applyFilters(filteredMessages).sort((a, b) => {
    return parseInt(b.internalDate) - parseInt(a.internalDate);
  });

  // Filter messages based on search query
  const searchFilteredMessages = finalMessages.filter(message => {
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
                  onClick={removeAccount}
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
            messages={searchFilteredMessages} // Use the filtered messages based on search
            onLoadMore={loadMore}
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
            onEditFilter={(oldName, newFilter) => editFilter(oldName, newFilter)}
            onRemoveFilter={removeFilter}
            onClose={() => setShowFilterManager(false)}
          />
        )}
      </div>
    </div>
  );
}