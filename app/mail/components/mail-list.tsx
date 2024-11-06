//@ts-nocheck
"use client"

import { useCallback, useRef } from "react"
import { Clock, Mail, Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useMail } from "../hooks/use-mail"
import { MailListProps } from "../types"

export function MailList({ accounts, onLoadMore, hasMore, loading, selectedAccount }: MailListProps) {
  const [mail, setMail] = useMail()
  const observer = useRef()

  const lastEmailRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore()
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore, onLoadMore])

  const allMessages = accounts.reduce((acc, account) => {
    if (account.messages) {
      const messagesWithAccount = account.messages.map(message => ({
        ...message,
        accountEmail: account.email
      }))
      return [...acc, ...messagesWithAccount]
    }
    return acc
  }, [])

  const filteredMessages = selectedAccount === 'all'
    ? allMessages
    : allMessages.filter(message => message.accountEmail === selectedAccount)

  const sortedMessages = filteredMessages.sort((a, b) => {
    return parseInt(b.internalDate) - parseInt(a.internalDate)
  })

  if (!sortedMessages.length && !loading) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium">No messages to display</p>
        <p className="text-sm">Add an account to start viewing emails</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col">
        {sortedMessages.map((message, index) => {
          const isLast = index === sortedMessages.length - 1
          const component = (
            <Email 
              key={`${message.accountEmail}-${message.id}`} 
              message={message} 
              accountEmail={message.accountEmail} // Pass the account email here
              selected={mail.selected === message.id}
              onClick={() => setMail({ ...mail, selected: message.id })}
            />
          )
          
          return isLast ? (
            <div ref={lastEmailRef} key={`${message.accountEmail}-${message.id}`}>
              {component}
            </div>
          ) : component
        })}
        {loading && (
          <div className="p-4">
            <EmailSkeleton />
            <EmailSkeleton />
            <EmailSkeleton />
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

const Email = ({ message, accountEmail, selected, onClick }) => {
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
  const from = getHeader(message.payload.headers, 'From');
  const subject = getHeader(message.payload.headers, 'Subject');

  return (
    <div 
      className={cn(
        "px-4 py-3 border-b hover:bg-gray-50 transition-colors cursor-pointer",
        selected && "bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{from.split('<')[0].trim()}</span>
            <Badge 
              variant="secondary" 
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {accountEmail} {/* Display the email account here */}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-blue-500 text-sm">
            {hasAttachments && <Paperclip className="h-4 w-4" />}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDate(message.internalDate)}</span>
            </div>
          </div>
        </div>

        {/* Subject Row */}
        <div className="text-sm">
          <span className="font-medium">{subject || '(no subject)'}</span>
        </div>

        {/* Snippet Row */}
        <div className="text-sm text-gray-600 line-clamp-1">
          {message.snippet}
        </div>

        {/* Labels Row */}
        <div className="flex gap-2 mt-1">
          {message.labelIds?.map((label, index) => {
            let labelText = label.toLowerCase().replace('category_', '');
            // Only show specific labels
            if (['inbox', 'important', 'work', 'meeting', 'budget'].includes(labelText)) {
              return (
                <Badge key={index} variant="outline" className="text-xs">
                  {labelText}
                </Badge>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

const EmailSkeleton = () => (
  <div className="px-4 py-3 border-b">
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <Skeleton className="h-4 w-[70%]" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
    </div>
  </div>
);