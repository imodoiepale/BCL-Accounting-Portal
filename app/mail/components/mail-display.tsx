// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { addDays, addHours, format, nextSaturday } from "date-fns"
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Loader2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { GmailMessage, GmailThread } from "./types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface MailDisplayProps {
  mail: GmailMessage | null
  onSendReply?: (messageId: string, content: string, threadId: string) => Promise<void>
  onLoadThread?: (threadId: string, accountEmail: string) => Promise<GmailThread>
  loading?: boolean
}

export function MailDisplay({ 
  mail, 
  onSendReply,
  onLoadThread,
  loading = false 
}: MailDisplayProps) {
  const [replyContent, setReplyContent] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [threadMessages, setThreadMessages] = useState<GmailMessage[]>([])
  const [showThread, setShowThread] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  
  const getHeader = (headers: Array<{ name: string; value: string }>, name: string) => {
    return headers.find(header => header.name.toLowerCase() === name.toLowerCase())?.value || ''
  }

  const getName = (message: GmailMessage) => {
    const from = getHeader(message.payload.headers, 'From')
    return from.split('<')[0].trim()
  }

  const getEmail = (message: GmailMessage) => {
    const from = getHeader(message.payload.headers, 'From')
    const matches = from.match(/<(.+)>/)
    return matches ? matches[1] : from
  }

  const getSubject = (message: GmailMessage) => {
    return getHeader(message.payload.headers, 'Subject')
  }

  const getDate = (message: GmailMessage) => {
    return new Date(parseInt(message.internalDate))
  }

  const decodeMessageBody = (message: GmailMessage) => {
    let body = ''
    
    if (message.payload.body?.data) {
      body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    } else if (message.payload.parts) {
      const textPart = message.payload.parts.find(
        part => part.mimeType === 'text/plain'
      )
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
    }

    return body
  }

  const handleSendReply = async () => {
    if (!mail || !replyContent.trim() || !onSendReply) return

    try {
      setSendingReply(true)
      await onSendReply(mail.id, replyContent, mail.threadId)
      setReplyContent("")
      if (showThread) {
        await loadThread()
      }
    } finally {
      setSendingReply(false)
    }
  }

  const loadThread = async () => {
    if (!mail || !onLoadThread || loadingThread) return

    try {
      setLoadingThread(true)
      const thread = await onLoadThread(mail.threadId, mail.accountEmail!)
      setThreadMessages(thread.messages)
      setShowThread(true)
    } catch (error) {
      console.error('Error loading thread:', error)
    } finally {
      setLoadingThread(false)
    }
  }

  // Reset thread view when mail changes
  useEffect(() => {
    setThreadMessages([])
    setShowThread(false)
  }, [mail?.id])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button variant="ghost" className="justify-start font-normal">
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(new Date(), 4), "E, h:mm a")}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(new Date(), 1), "E, h:mm a")}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(new Date()), "E, h:mm a")}
                      </span>
                    </Button>
                    <Button variant="ghost" className="justify-start font-normal">
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(new Date(), 7), "E, h:mm a")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!mail}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : mail ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={getName(mail)} />
                <AvatarFallback>
                  {getName(mail)
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{getName(mail)}</div>
                <div className="line-clamp-1 text-xs">{getSubject(mail)}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">From:</span> {getEmail(mail)}
                </div>
                {mail.accountEmail && (
                  <Badge variant="secondary" className="w-fit">
                    {mail.accountEmail}
                  </Badge>
                )}
              </div>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              <span className="text-xs text-muted-foreground">
                {format(getDate(mail), "PPpp")}
              </span>
              {!showThread && onLoadThread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={loadThread}
                  disabled={loadingThread}
                >
                  {loadingThread ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show thread
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <Separator />
          
          {showThread && threadMessages.length > 0 ? (
            <Accordion type="single" collapsible className="flex-1">
              {threadMessages.map((message, index) => (
                <AccordionItem value={message.id} key={message.id}>
                  <AccordionTrigger className="px-4 py-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-6 w-6">
                        <AvatarImage alt={getName(message)} />
                        <AvatarFallback className="text-xs">
                          {getName(message)
                            .split(" ")
                            .map((chunk) => chunk[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1 text-left">
                        <div className="text-sm font-semibold">
                          {getName(message)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(getDate(message), "PPpp")}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-2">
                    <div className="text-sm whitespace-pre-wrap">
                      {decodeMessageBody(message)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
              {decodeMessageBody(mail)}
            </div>
          )}
          
          <Separator className="mt-auto" />
          <div className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}>
              <div className="grid gap-4">
                <Textarea
                  className="p-4"
                  placeholder={`Reply to ${getName(mail)}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={sendingReply}
                />
                <div className="flex items-center">
                  <Label
                    htmlFor="mute"
                    className="flex items-center gap-2 text-xs font-normal"
                  >
                    <Switch id="mute" aria-label="Mute thread" /> Mute this thread
                  </Label>
                  <Button
                    type="submit"
                    size="sm"
                    className="ml-auto"
                    disabled={!replyContent.trim() || sendingReply}
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  )
}

interface MessageAttachmentsProps {
  message: GmailMessage;
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ message }) => {
  const attachments = message.payload.parts?.filter(
    part => part.filename && part.filename.length > 0
  ) || []

  if (attachments.length === 0) return null

  return (
    <div className="mt-4 border rounded-md p-2">
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="h-4 w-4" />
        <span className="text-sm font-medium">Attachments</span>
      </div>
      <div className="grid gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{attachment.filename}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.body.size)}
              </span>
            </div>
            <Button variant="ghost" size="sm">
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Message Body component to handle different MIME types
interface MessageBodyProps {
  message: GmailMessage;
}

const MessageBody: React.FC<MessageBodyProps> = ({ message }) => {
  const getMessageBody = () => {
    if (message.payload.body?.data) {
      return decodeBase64(message.payload.body.data)
    }

    if (message.payload.parts) {
      const textPart = message.payload.parts.find(
        part => part.mimeType === 'text/plain'
      )
      const htmlPart = message.payload.parts.find(
        part => part.mimeType === 'text/html'
      )

      if (htmlPart?.body?.data) {
        return <div dangerouslySetInnerHTML={{ 
          __html: decodeBase64(htmlPart.body.data) 
        }} />
      }

      if (textPart?.body?.data) {
        return <pre className="whitespace-pre-wrap">
          {decodeBase64(textPart.body.data)}
        </pre>
      }
    }

    return message.snippet
  }

  return (
    <div className="text-sm">
      {getMessageBody()}
    </div>
  )
}

// Utility function to decode base64 data
function decodeBase64(data: string): string {
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'))
}

// Thread Message component for displaying individual messages in a thread
interface ThreadMessageProps {
  message: GmailMessage;
  isExpanded: boolean;
  onToggle: () => void;
}

const ThreadMessage: React.FC<ThreadMessageProps> = ({ 
  message, 
  isExpanded, 
  onToggle 
}) => {
  const name = getHeader(message.payload.headers, 'From').split('<')[0].trim()
  const date = new Date(parseInt(message.internalDate))
  
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage alt={name} />
            <AvatarFallback>
              {name.split(" ").map(chunk => chunk[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">
              {format(date, "PPpp")}
            </div>
          </div>
        </div>
        <div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <MessageBody message={message} />
          <MessageAttachments message={message} />
        </div>
      )}
    </div>
  )
}

// Helper function to get header value
function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(header => header.name === name)?.value || ''
}