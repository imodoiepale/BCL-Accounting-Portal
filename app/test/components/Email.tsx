import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Paperclip, Clock } from "lucide-react";

interface EmailProps {
  message: any;
  accountEmail: string;
  onClick: (message: any) => void;
}

export const Email: React.FC<EmailProps> = ({ message, accountEmail, onClick }) => {
  const getHeader = (headers: any[], name: string) => {
    return headers.find(header => header.name === name)?.value || '';
  };

  const formatDate = (internalDate: string) => {
    const date = new Date(parseInt(internalDate));
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const hasAttachments = message.payload.parts?.some((part: any) => part.filename && part.filename.length > 0);

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
