//@ts-nocheck
"use client"

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
import { GmailMessage } from "../types"

interface MailDisplayProps {
  mail: GmailMessage | null
  onReply?: (message: string) => void
  onForward?: (message: string) => void
  onDelete?: () => void
  onArchive?: () => void
  onSnooze?: (date: Date) => void
}

export function MailDisplay({ 
  mail,
  onReply,
  onForward,
  onDelete,
  onArchive,
  onSnooze 
}: MailDisplayProps) {
  const today = new Date()
  
  const getHeader = (headers: Array<{ name: string; value: string }>, name: string) => {
    return headers?.find(header => header.name === name)?.value || ''
  }

  const getName = (mail: GmailMessage) => {
    const from = getHeader(mail.payload.headers, 'From')
    return from.split('<')[0].trim()
  }

  const getEmail = (mail: GmailMessage) => {
    const from = getHeader(mail.payload.headers, 'From')
    const matches = from.match(/<(.+)>/)
    return matches ? matches[1] : from
  }

  const getSubject = (mail: GmailMessage) => {
    return getHeader(mail.payload.headers, 'Subject')
  }

  const getDate = (mail: GmailMessage) => {
    return new Date(parseInt(mail.internalDate))
  }

  const handleReply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('reply') as string
    if (message && onReply) {
      onReply(message)
    }
  }

  if (!mail) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium">No message selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a message from the list to view its contents
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onArchive}
              >
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onDelete}
              >
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
                  <Button variant="ghost" size="icon">
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button 
                      variant="ghost" 
                      className="justify-start font-normal"
                      onClick={() => onSnooze?.(addHours(today, 4))}
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start font-normal"
                      onClick={() => onSnooze?.(addDays(today, 1))}
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start font-normal"
                      onClick={() => onSnooze?.(nextSaturday(today))}
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start font-normal"
                      onClick={() => onSnooze?.(addDays(today, 7))}
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar 
                    mode="single"
                    selected={today}
                    onSelect={(date) => date && onSnooze?.(date)}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onReply?.('')}
              >
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onForward?.('')}
              >
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
            <Button variant="ghost" size="icon">
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
                <span className="font-medium">Reply-To:</span> {getEmail(mail)}
              </div>
              {mail.labelIds?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {mail.labelIds.map((label, index) => (
                    <Badge 
                      key={`${label}-${index}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {label.replace('CATEGORY_', '').toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {format(getDate(mail), "PPpp")}
          </div>
        </div>
        <Separator />
        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
          {mail.snippet}
          {mail.payload?.body?.data && (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: atob(mail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
              }} 
            />
          )}
        </div>
        <Separator className="mt-auto" />
        <form onSubmit={handleReply} className="p-4">
          <div className="grid gap-4">
            <Textarea
              name="reply"
              className="p-4"
              placeholder={`Reply to ${getName(mail)}...`}
            />
            <div className="flex items-center">
              <Label
                htmlFor="mute"
                className="flex items-center gap-2 text-xs font-normal"
              >
                <Switch id="mute" aria-label="Mute thread" /> Mute this thread
              </Label>
              <Button type="submit" size="sm" className="ml-auto">
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}