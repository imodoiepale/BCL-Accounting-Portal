import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Account {
  email: string;
  token: any;
  messages?: any[];
}

export const useGmailMessages = (accounts: Account[], setAccounts: (accounts: Account[]) => void) => {
  const [loading, setLoading] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = async (email: string, nextPageToken: string | null = null) => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        pageToken: nextPageToken
      });

      const messagesData = await Promise.all(
        response.result.messages.map(async (message: any) => {
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

  const refreshAllAccounts = async () => {
    setLoading(true);
    for (const account of accounts) {
      gapi.client.setToken(account.token);
      await fetchMessages(account.email);
    }
    setLoading(false);
  };

  const handleReply = async (message: any, replyContent: string) => {
    try {
      const getHeader = (headers: any[], name: string) => {
        return headers.find(header => header.name === name)?.value || '';
      };

      const originalFrom = getHeader(message.payload.headers, 'From');
      const originalSubject = getHeader(message.payload.headers, 'Subject');
      const originalMessageId = getHeader(message.payload.headers, 'Message-ID');
      const originalReferences = getHeader(message.payload.headers, 'References');

      const replySubject = originalSubject.startsWith('Re:')
        ? originalSubject
        : `Re: ${originalSubject}`;

      const replyTo = originalFrom.match(/<(.+)>/)
        ? originalFrom.match(/<(.+)>/)[1]
        : originalFrom;

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

      const encodedMessage = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const account = accounts.find(acc => acc.email === message.accountEmail);
      if (!account) {
        throw new Error('Account not found');
      }

      gapi.client.setToken(account.token);

      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
          threadId: message.threadId
        }
      });

      if (response.status === 200) {
        await fetchMessages(message.accountEmail);
        toast.success('Reply sent successfully!');
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleForward = async (message: any, forwardTo: string, forwardContent: string) => {
    try {
      const getHeader = (headers: any[], name: string) => {
        return headers.find(header => header.name === name)?.value || '';
      };

      const originalFrom = getHeader(message.payload.headers, 'From');
      const originalSubject = getHeader(message.payload.headers, 'Subject');
      const originalDate = getHeader(message.payload.headers, 'Date');

      const forwardSubject = originalSubject.startsWith('Fwd:')
        ? originalSubject
        : `Fwd: ${originalSubject}`;

      const decodeBase64 = (data: string) => {
        const buffer = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        return buffer.toString('utf8');
      };

      const getEmailParts = (payload: any) => {
        const parts: any[] = [];

        const processPart = (part: any) => {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            parts.push({
              mimeType: part.mimeType,
              content: part.body.data ? decodeBase64(part.body.data) : '',
            });
          } else if (part.parts) {
            part.parts.forEach(processPart);
          }

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

      const emailParts = getEmailParts(message.payload);
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

      const boundary = `boundary_${Math.random().toString(36).substr(2)}`;
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

      const textContent = emailParts.find(part => part.mimeType === 'text/plain')?.content || '';
      const htmlContent = emailParts.find(part => part.mimeType === 'text/html')?.content || '';

      emailContent += textContent || htmlContent;
      emailContent += '\r\n';

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

      emailContent += `--${boundary}--`;

      const encodedMessage = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const account = accounts.find(acc => acc.email === message.accountEmail);
      if (!account) {
        throw new Error('Account not found');
      }

      gapi.client.setToken(account.token);

      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage
        }
      });

      if (response.status === 200) {
        await fetchMessages(message.accountEmail);
        toast.success('Message forwarded successfully');
      } else {
        throw new Error('Failed to forward message');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message: ' + error.message);
    }
  };

  return {
    loading,
    hasMore,
    pageToken,
    fetchMessages,
    refreshAllAccounts,
    handleReply,
    handleForward
  };
};
