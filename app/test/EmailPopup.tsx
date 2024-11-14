import React, { useState } from 'react';
import { X } from 'lucide-react'; // Make sure to import X icon

interface EmailHeader {
  name: string;
  value: string;
}

interface EmailPayload {
  headers: EmailHeader[];
  parts?: EmailPart[];
  mimeType?: string;
  body?: {
    data?: string;
    attachmentId?: string;
  };
}

interface EmailPart {
  mimeType: string;
  filename?: string;
  body: {
    data?: string;
    attachmentId?: string;
  };
  parts?: EmailPart[];
}

interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: EmailPayload;
  internalDate: string;
  accountEmail?: string;
}

interface EmailPopupProps {
  message: EmailMessage;
  onClose: () => void;
  onReply: (message: EmailMessage, replyContent: string) => void;
  onForward: (message: EmailMessage, forwardTo: string, forwardContent: string) => void;
}

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {message}
    </div>
  );
};

const EmailPopup: React.FC<EmailPopupProps> = ({ message, onClose, onReply, onForward }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardContent, setForwardContent] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getHeader = (name: string): string => {
    return message.payload.headers.find(h => h.name === name)?.value || '';
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) {
      showNotification('Please write a reply message', 'error');
      return;
    }
    onReply(message, replyContent);
    setIsReplying(false);
    setReplyContent('');
  };

  const handleForwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardTo.trim() || !forwardContent.trim()) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forwardTo)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    
    onForward(message, forwardTo, forwardContent);
    setIsForwarding(false);
    setForwardTo('');
    setForwardContent('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {getHeader('Subject') || '(no subject)'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>From: {getHeader('From')}</p>
            <p>Date: {new Date(parseInt(message.internalDate)).toLocaleString()}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="prose max-w-none">
            {message.snippet}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsReplying(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => setIsForwarding(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Forward
            </button>
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="p-4 border-t">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full h-32 p-2 border rounded-lg resize-y"
              placeholder="Write your reply..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsReplying(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send Reply
              </button>
            </div>
          </div>
        )}

        {/* Forward Form */}
        {isForwarding && (
          <div className="p-4 border-t">
            <input
              type="email"
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              className="w-full p-2 border rounded-lg mb-2"
              placeholder="Forward to email address..."
            />
            <textarea
              value={forwardContent}
              onChange={(e) => setForwardContent(e.target.value)}
              className="w-full h-32 p-2 border rounded-lg resize-y"
              placeholder="Add a message..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsForwarding(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForwardSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Forward
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default EmailPopup;