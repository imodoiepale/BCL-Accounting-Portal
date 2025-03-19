import React, { useState } from 'react';
import { X } from 'lucide-react';

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
    } text-white animate-fade-in`}>
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

  const getHeader = (name: string) => {
    return message.payload.headers?.find(h => h.name === name)?.value || '';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header Section */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {getHeader('Subject') || '(no subject)'}
              </h2>
              <div className="text-sm space-y-1">
                <p className="text-gray-500">
                  From: <span className="text-gray-700">{getHeader('From')}</span>
                </p>
                <p className="text-gray-500">
                  Date: <span className="text-gray-700">{new Date(parseInt(message.internalDate)).toLocaleString()}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="p-6 bg-white">
          <div className="prose max-w-none text-lg leading-relaxed">
            {message.snippet}
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsReplying(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              Reply
            </button>
            <button
              onClick={() => setIsForwarding(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
            >
              Forward
            </button>
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="p-6 border-t bg-gray-50">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write your reply..."
            />
            <div className="mt-3 flex justify-end gap-3">
              <button
                onClick={() => setIsReplying(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                Send Reply
              </button>
            </div>
          </div>
        )}

        {/* Forward Form */}
        {isForwarding && (
          <div className="p-6 border-t bg-gray-50">
            <input
              type="email"
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Forward to email address..."
            />
            <textarea
              value={forwardContent}
              onChange={(e) => setForwardContent(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg resize-y focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Add a message..."
            />
            <div className="mt-3 flex justify-end gap-3">
              <button
                onClick={() => setIsForwarding(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForwardSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
              >
                Forward
              </button>
            </div>
          </div>
        )}
      </div>

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