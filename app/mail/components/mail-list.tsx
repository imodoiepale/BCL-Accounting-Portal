//@ts-nocheck
"use client"
import { ComponentProps } from "react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Mail } from "../data"
import { useMail } from "./use-mail"

interface MailListProps {
  items: Mail[]
}

function getSenderLabel(email: string) {
  // Extract domain to determine email provider
  const domain = email.split('@')[1]
  if (domain === 'example.com') return 'BOOKSMART CONSULTANCY LIMITED'
  if (domain === 'gmail.com') return 'Gmail'
  if (domain === 'me.com') return 'iCloud'
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
}

export function MailList({ items }: MailListProps) {
  const [mail, setMail] = useMail()

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              mail.selected === item.id && "bg-muted"
            )}
            onClick={() =>
              setMail({
                ...mail,
                selected: item.id,
              })
            }
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {/* <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                    {getSenderLabel(item.email)}
                  </Badge> */}
                  {!item.read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* <div className="font-semibold">{item.name}</div> */}
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                    {getSenderLabel(item.email)}
                  </Badge>
                  {/* {!item.read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )} */}
                </div>
                
                <div
                  className={cn(
                    "text-xs",
                    mail.selected === item.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.text.substring(0, 300)}
            </div>
            {item.labels.length ? (
              <div className="flex items-center gap-2">
                {item.labels.map((label) => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
