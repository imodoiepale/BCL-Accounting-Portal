import React, { useState } from 'react';

interface EmailPopupProps {
  message: {
    payload: {
      headers: {
        name: string;
        value: string;
      }[];
    };
    internalDate: string;
    snippet: string;
  };
  onClose: () => void;
  onReply: (message: any, replyContent: string) => void;
}

const EmailPopup = ({ message, onClose, onReply }: EmailPopupProps) => {
  const [replyContent, setReplyContent] = useState('');

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
  };

  const handleReplySubmit = () => {
    onReply(message, replyContent);
    setReplyContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 float-right">Close</button>
        <h2 className="text-xl font-bold mb-4">{message.payload.headers.find(header => header.name === 'Subject')?.value || '(no subject)'}</h2>
        <div className="mb-4">
          <p><strong>From:</strong> {message.payload.headers.find(header => header.name === 'From')?.value}</p>
          <p><strong>Date:</strong> {new Date(parseInt(message.internalDate)).toLocaleString()}</p>
        </div>
        <div className="mb-4">
          <p>{message.snippet}</p>
        </div>
        <textarea
          value={replyContent}
          onChange={handleReplyChange}
          placeholder="Write your reply..."
          className="w-full p-2 border rounded mb-4"
        />
        <button onClick={handleReplySubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Send Reply</button>
      </div>
    </div>
  );
};

export default EmailPopup;