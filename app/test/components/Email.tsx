import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Paperclip, Clock, Star, Trash2, Tag, Check, Circle } from "lucide-react";

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
  const isUnread = message.labelIds?.includes('UNREAD');
  const from = getHeader(message.payload.headers, 'From');
  const subject = getHeader(message.payload.headers, 'Subject') || '(no subject)';

  return (
    <div 
      onClick={() => onClick(message)} 
      className="group px-3 py-2 border-b hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3"
    >
      {/* Status and Avatar */}
      <div className="flex flex-col items-center gap-1 pt-1">
        {isUnread && <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />}
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm">
          {from.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate text-gray-900">
                {from.split('<')[0].trim()}
              </span>
              <span className="text-xs text-gray-400">{formatDate(message.internalDate)}</span>
            </div>
            <h3 className={`text-sm ${isUnread ? 'font-medium' : 'font-normal'} text-gray-900 truncate`}>
              {subject}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1">{message.snippet}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <Star className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <Tag className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-1">
          {hasAttachments && <Paperclip className="w-3 h-3 text-gray-400" />}
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            {accountEmail}
          </Badge>
        </div>
      </div>
    </div>
  );
};
