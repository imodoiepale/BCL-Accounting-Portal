//@ts-nocheck
"use client"

import { useCallback, useRef, useMemo } from "react"
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
  const messageCache = useRef(new Set())

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

  // Process messages with memoization to prevent unnecessary recalculations
  const processedMessages = useMemo(() => {
    // Clear cache when processing new messages
    messageCache.current.clear()

    const allMessages = accounts.reduce((acc, account) => {
      if (account.messages) {
        const messagesWithAccount = account.messages.map(message => {
          // Create a unique identifier for the message
          const baseKey = `${account.email}-${message.id}`
          
          // If this message was already processed, add a suffix
          let uniqueKey = baseKey
          let counter = 1
          while (messageCache.current.has(uniqueKey)) {
            uniqueKey = `${baseKey}-${counter}`
            counter++
          }
          
          // Add to cache
          messageCache.current.add(uniqueKey)

          return {
            ...message,
            accountEmail: account.email,
            uniqueKey
          }
        })
        return [...acc, ...messagesWithAccount]
      }
      return acc
    }, [])

    // Filter messages based on selected account
    const filtered = selectedAccount === 'all'
      ? allMessages
      : allMessages.filter(message => message.accountEmail === selectedAccount)

    // Sort messages by date
    return filtered.sort((a, b) => parseInt(b.internalDate) - parseInt(a.internalDate))
  }, [accounts, selectedAccount])

  if (!processedMessages.length && !loading) {
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
        {processedMessages.map((message, index) => {
          const isLast = index === processedMessages.length - 1
          
          const emailComponent = (
            <Email 
              key={message.uniqueKey}
              message={message} 
              accountEmail={message.accountEmail}
              selected={mail.selected === message.id}
              onClick={() => setMail({ ...mail, selected: message.id })}
            />
          )
          
          return isLast ? (
            <div ref={lastEmailRef} key={`last-${message.uniqueKey}`}>
              {emailComponent}
            </div>
          ) : emailComponent
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
  const getHeader = useCallback((headers, name) => {
    return headers.find(header => header.name === name)?.value || ''
  }, [])

  const formatDate = useCallback((internalDate) => {
    const date = new Date(parseInt(internalDate))
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }, [])

  const hasAttachments = message.payload.parts?.some(part => part.filename && part.filename.length > 0)
  const from = getHeader(message.payload.headers, 'From')
  const subject = getHeader(message.payload.headers, 'Subject')

  return (
    <div 
      className={cn(
        "px-4 py-3 border-b hover:bg-gray-50 transition-colors cursor-pointer",
        selected && "bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{from.split('<')[0].trim()}</span>
            <Badge 
              variant="secondary" 
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {accountEmail}
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

        <div className="text-sm">
          <span className="font-medium">{subject || '(no subject)'}</span>
        </div>

        <div className="text-sm text-gray-600 line-clamp-1">
          {message.snippet}
        </div>

        <div className="flex gap-2 mt-1">
          {message.labelIds?.map((label, index) => {
            const labelText = label.toLowerCase().replace('category_', '')
            if (['inbox', 'important', 'work', 'meeting', 'budget'].includes(labelText)) {
              return (
                <Badge 
                  key={`${message.uniqueKey}-label-${index}`} 
                  variant="outline" 
                  className="text-xs"
                >
                  {labelText}
                </Badge>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}

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
)