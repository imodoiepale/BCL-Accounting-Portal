import React, { useRef, useCallback } from 'react';
import { Mail } from "lucide-react";
import { Email } from './Email';
import { EmailSkeleton } from './EmailSkeleton';

interface EmailListProps {
  messages: any[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onEmailClick: (message: any) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  messages,
  onLoadMore,
  hasMore,
  loading,
  onEmailClick
}) => {
  const observer = useRef<IntersectionObserver>();
  const lastEmailRef = useCallback((node: HTMLDivElement | null) => {
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
              <Email 
                message={message} 
                accountEmail={message.accountEmail} 
                onClick={onEmailClick} 
              />
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
