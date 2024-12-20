// @ts-nocheck
/* eslint-disable react/no-unescaped-entities */
"use client"

import * as React from "react"
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Settings2,
  SettingsIcon,
  ShoppingCart,
  Star,
  Tags,
  Trash2,
  Users2,
  X,
  MoreHorizontal,
  Edit,
  Trash,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,      
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AccountSwitcher } from "./account-switcher"
import { MailDisplay } from "./mail-display"
import { MailList } from "./mail-list"
import { Nav } from "./nav"
import { useGmail } from "../hooks/use-gmail"
import { useMail } from "../hooks/use-mail"
import { MailProps } from "../types"
import toast from "react-hot-toast"

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface CustomFilter {
  id: string
  name: string
  conditions: FilterCondition[]
  color?: string
}

interface FilterManagementProps {
  filters: CustomFilter[]
  onEdit: (filter: CustomFilter) => void
  onDelete: (filterId: string) => void
}

interface MailHeaderProps {
  onSearch: (query: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  loading: boolean
  customFilters: CustomFilter[]
  setCustomFilters: React.Dispatch<React.SetStateAction<CustomFilter[]>>
}
const DEFAULT_FILTERS: CustomFilter[] = [
  {
    id: "primary",
    name: "Primary",
    conditions: [{ field: "labels", operator: "includes", value: "work" }],
    color: "blue",
  },
  {
    id: "social",
    name: "Social",
    conditions: [{ field: "labels", operator: "includes", value: "personal" }],
    color: "green",
  },
  {
    id: "promotions",
    name: "Promotions",
    conditions: [{ field: "labels", operator: "includes", value: "promotions" }],
    color: "yellow",
  },
]

const filterFields = [
  { value: "subject", label: "Subject" },
  { value: "from", label: "From" },
  { value: "to", label: "To" },
  { value: "labels", label: "Labels" },
  { value: "text", label: "Content" },
]

const filterOperators = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "includes", label: "Includes" },
  { value: "startsWith", label: "Starts with" },
]

const FilterManagement: React.FC<FilterManagementProps> = ({
  filters,
  onEdit,
  onDelete,
}) => {
  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="table" className="flex-1">Filters</TabsTrigger>
        
      </TabsList>
      <TabsContent value="table" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filter Name</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filters.map((filter) => (
              <TableRow key={filter.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    {filter.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {filter.conditions.map((condition, idx) => (
                      <div key={idx} className="text-sm">
                        {condition.field} {condition.operator} "{condition.value}"
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(filter)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(filter.id)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    
    </Tabs>
  )
}
const MailHeader: React.FC<MailHeaderProps> = ({
  onSearch,
  activeTab,
  onTabChange,
  loading,
  customFilters,
  setCustomFilters,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<'all' | 'unread'>('all')
  const [isCreateFilterOpen, setIsCreateFilterOpen] = React.useState(false)
  const [isManageFiltersOpen, setIsManageFiltersOpen] = React.useState(false)
  const [editingFilter, setEditingFilter] = React.useState<CustomFilter | null>(null)
  const [newFilter, setNewFilter] = React.useState<CustomFilter>({
    id: "",
    name: "",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
  })

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const addCondition = () => {
    setNewFilter({
      ...newFilter,
      conditions: [
        ...newFilter.conditions,
        { field: "subject", operator: "contains", value: "" },
      ],
    })
  }

  const removeCondition = (index: number) => {
    setNewFilter({
      ...newFilter,
      conditions: newFilter.conditions.filter((_, i) => i !== index),
    })
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const updatedConditions = [...newFilter.conditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }
    setNewFilter({ ...newFilter, conditions: updatedConditions })
  }

  const handleEditFilter = (filter: CustomFilter) => {
    setEditingFilter(filter)
    setNewFilter({
      ...filter,
      conditions: [...filter.conditions],
    })
    setIsCreateFilterOpen(true)
  }

  const handleDeleteFilter = (filterId: string) => {
    setCustomFilters(filters => filters.filter(f => f.id !== filterId))
    toast.success('Filter deleted successfully')
  }

  const createFilter = () => {
    if (newFilter.name.trim() === "") {
      toast.error('Filter name is required')
      return
    }

    if (editingFilter) {
      updateFilter()
    } else {
      const filterId = newFilter.name.toLowerCase().replace(/\s+/g, "-")
      const newCustomFilter = {
        ...newFilter,
        id: filterId,
      }

      setCustomFilters(prev => [...prev, newCustomFilter])
      setIsCreateFilterOpen(false)
      setNewFilter({
        id: "",
        name: "",
        conditions: [{ field: "subject", operator: "contains", value: "" }],
      })
      toast.success('Filter created successfully')
    }
  }

  const updateFilter = () => {
    if (editingFilter && newFilter.name.trim() !== "") {
      setCustomFilters(filters =>
        filters.map(f => f.id === editingFilter.id ? {
          ...newFilter,
          id: editingFilter.id
        } : f)
      )
      setIsCreateFilterOpen(false)
      setEditingFilter(null)
      setNewFilter({
        id: "",
        name: "",
        conditions: [{ field: "subject", operator: "contains", value: "" }],
      })
      toast.success('Filter updated successfully')
    }
  }

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-2 pb-0">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={cn(
              "transition-colors",
              viewMode === 'all' 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-100 hover:bg-gray-200"
            )}
            onClick={() => setViewMode('all')}
            disabled={loading}
          >
            All mail
          </Button>
          <Button
            variant="ghost"
            className={cn(
              viewMode === 'unread' && "bg-gray-100"
            )}
            onClick={() => setViewMode('unread')}
            disabled={loading}
          >
            Unread
          </Button>
        </div>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input 
            className="w-full pl-9 bg-gray-50" 
            placeholder="Search emails..." 
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            disabled={loading}
          />
        </div>
      </div>

      <div className="px-2 flex items-center justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={onTabChange}
          className="w-full"
        >
          <TabsList className="w-full justify-start gap-2 bg-transparent h-auto p-0">
            {customFilters.map((filter) => (
              <TabsTrigger
                key={filter.id}
                value={filter.id}
                className={cn(
                  "data-[state=active]:bg-blue-500 data-[state=active]:text-white px-4 py-2 rounded",
                  filter.color && `data-[state=active]:bg-${filter.color}-500`
                )}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  {filter.name}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Dialog open={isCreateFilterOpen} onOpenChange={setIsCreateFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingFilter ? "Edit Filter" : "Create Filter"}
                </DialogTitle>
                <DialogDescription>
                  Create a new filter to organize your emails. Add one or more conditions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input
                    placeholder="Filter name"
                    value={newFilter.name}
                    onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                  />
                </div>
                {newFilter.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, "field", value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, "operator", value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOperators.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    {newFilter.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={addCondition}
                >
                  Add condition
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFilterOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFilter}>
                  {editingFilter ? "Update" : "Create"} filter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isManageFiltersOpen} onOpenChange={setIsManageFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
              <DialogHeader>
                <DialogTitle>Manage Filters</DialogTitle>
                <DialogDescription>
                  View, edit, and manage your custom email filters
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <FilterManagement
                  filters={customFilters}
                  onEdit={handleEditFilter}
                  onDelete={handleDeleteFilter}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize = 4,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("primary")
  const [customFilters, setCustomFilters] = React.useState<CustomFilter[]>(DEFAULT_FILTERS)
  const [selectedMail, setSelectedMail] = React.useState<any>(null)
  const [mail, setMail] = useMail()
  
  const {
    accounts,
    selectedAccount,
    loading,
    hasMore,
    setSelectedAccount,
    addAccount,
    removeAccount,
    refreshAllAccounts,
    loadMore
  } = useGmail()

  React.useEffect(() => {
    const layout = document.cookie
      .split('; ')
      .find(row => row.startsWith('react-resizable-panels:layout'))
      ?.split('=')[1]

    if (layout) {
      try {
        const sizes = JSON.parse(layout)
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
      } catch (e) {
        console.error('Error parsing layout from cookie:', e)
      }
    }
  }, [])

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(collapsed)}`
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleMailSelect = (selectedMail: any) => {
    setSelectedMail(selectedMail)
    setMail({ ...mail, selected: selectedMail.id })
  }

  // Filter messages based on search and active tab
  const filteredMessages = React.useMemo(() => {
    let messages = accounts.flatMap(acc => acc.messages || [])

    // Apply search filter
    if (searchQuery) {
      messages = messages.filter(msg => {
        const subject = msg.payload.headers.find(h => h.name === 'Subject')?.value
        const from = msg.payload.headers.find(h => h.name === 'From')?.value
        return (
          subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.snippet.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Filter based on active tab and custom filters
    if (activeTab && customFilters) {
      const activeFilter = customFilters.find(f => f.id === activeTab)
      if (activeFilter) {
        messages = messages.filter(msg => {
          return activeFilter.conditions.every(condition => {
            switch (condition.field) {
              case 'labels':
                return msg.labelIds?.some(label => 
                  label.toLowerCase().includes(condition.value.toLowerCase())
                )
              case 'subject':
                const subject = msg.payload.headers.find(h => h.name === 'Subject')?.value || ''
                return subject.toLowerCase().includes(condition.value.toLowerCase())
              case 'from':
                const from = msg.payload.headers.find(h => h.name === 'From')?.value || ''
                return from.toLowerCase().includes(condition.value.toLowerCase())
              case 'to':
                const to = msg.payload.headers.find(h => h.name === 'To')?.value || ''
                return to.toLowerCase().includes(condition.value.toLowerCase())
              case 'text':
                return msg.snippet.toLowerCase().includes(condition.value.toLowerCase())
              default:
                return true
            }
          })
        })
      }
    }

    return messages.sort((a, b) => parseInt(b.internalDate) - parseInt(a.internalDate))
  }, [accounts, searchQuery, activeTab, customFilters])



  const handleReply = async (message, replyContent) => {
    try {
      // Get the necessary headers from the original message
      const getHeader = (headers, name) => {
        return headers.find(header => header.name === name)?.value || '';
      };
      
      const originalFrom = getHeader(message.payload.headers, 'From');
      const originalSubject = getHeader(message.payload.headers, 'Subject');
      const originalMessageId = getHeader(message.payload.headers, 'Message-ID');
      const originalReferences = getHeader(message.payload.headers, 'References');
      
      // Construct the reply subject
      const replySubject = originalSubject.startsWith('Re:') 
        ? originalSubject 
        : `Re: ${originalSubject}`;
  
      // Construct the reply-to email address
      const replyTo = originalFrom.match(/<(.+)>/) 
        ? originalFrom.match(/<(.+)>/)[1] 
        : originalFrom;
  
      // Create the email content in MIME format
      const emailContent = [
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${originalMessageId}`,
        `References: ${originalReferences ? originalReferences + ' ' : ''}${originalMessageId}`,
        '',
        replyContent,
        '',
        '---Original Message---',
        `From: ${originalFrom}`,
        `Subject: ${originalSubject}`,
        `${message.snippet}...`
      ].join('\r\n');
  
      // Encode the email content in base64URL format
      const encodedMessage = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
  
      // Get the account that received the original message
      const account = accounts.find(acc => acc.email === message.accountEmail);
      if (!account) {
        throw new Error('Account not found');
      }
  
      // Set the token for the correct account
      gapi.client.setToken(account.token);
  
      // Send the reply using Gmail API
      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
          threadId: message.threadId
        }
      });
  
      if (response.status === 200) {
        // Refresh messages after successful reply
        await fetchMessages(message.accountEmail);
        
        // Show success notification (you'll need to implement this)
        toast.success('Reply sent to successfully!');
      } else {
        throw new Error('Failed to send reply');
      }
  
    } catch (error) {
      console.error('Error sending reply:', error);
      // Show error notification (you'll need to implement this)
      toast.error('Failed to send reply');
    }
  };

  const handleMailActions = {
    reply: (message: string) => {
      if (selectedMail) {
        toast.success('Reply sent')
        console.log('Reply to:', selectedMail.id, 'with message:', message)
      }
    },
    forward: (message: string) => {
      if (selectedMail) {
        toast.success('Mail forwarded')
        console.log('Forward:', selectedMail.id, 'with message:', message)
      }
    },
    delete: () => {
      if (selectedMail) {
        toast.success('Mail moved to trash')
        console.log('Delete:', selectedMail.id)
        setSelectedMail(null)
      }
    },
    archive: () => {
      if (selectedMail) {
        toast.success('Mail archived')
        console.log('Archive:', selectedMail.id)
      }
    },
    snooze: (date: Date) => {
      if (selectedMail) {
        toast.success(`Mail snoozed until ${date.toLocaleDateString()}`)
        console.log('Snooze until:', date)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
        }}
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => handleCollapse(true)}
          onExpand={() => handleCollapse(false)}
          className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
        >
          <div className={cn("flex h-[52px] items-center justify-center", 
            isCollapsed ? "h-[52px]" : "px-2")}>
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={accounts.map(acc => ({
                id: `account-${acc.email}`,
                label: acc.email.split('@')[0],
                email: acc.email,
                icon: <Users2 className="h-4 w-4" />,
                messages: acc.messages
              }))}
              selectedAccount={selectedAccount}
              onAccountSelect={setSelectedAccount}
              onAddAccount={addAccount}
              onRemoveAccount={removeAccount}
              onRefreshAccounts={refreshAllAccounts}
            />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                key: "nav-inbox",
                title: "Inbox",
                label: filteredMessages.length.toString(),
                icon: Inbox,
                variant: "default",
              },
              {
                key: "nav-drafts",
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                key: "nav-sent",
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                key: "nav-junk",
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                key: "nav-trash",
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                key: "nav-archive",
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                key: "nav-social",
                title: "Social",
                label: filteredMessages.filter(msg => 
                  msg.labelIds?.includes('CATEGORY_SOCIAL')
                ).length.toString(),
                icon: Users2,
                variant: "ghost",
              },
              {
                key: "nav-updates",
                title: "Updates",
                label: filteredMessages.filter(msg => 
                  msg.labelIds?.includes('CATEGORY_UPDATES')
                ).length.toString(),
                icon: AlertCircle,
                variant: "ghost",
              },
              {
                key: "nav-forums",
                title: "Forums",
                label: filteredMessages.filter(msg => 
                  msg.labelIds?.includes('CATEGORY_FORUMS')
                ).length.toString(),
                icon: MessagesSquare,
                variant: "ghost",
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <MailHeader
            onSearch={handleSearch}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            loading={loading}
            customFilters={customFilters}
            setCustomFilters={setCustomFilters}
          />
          <MailList
            accounts={accounts}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            selectedAccount={selectedAccount}
            searchQuery={searchQuery}
            activeTab={activeTab}
            onMailSelect={handleMailSelect}
            selectedMail={selectedMail}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={selectedMail}
            handleReply={handleMailActions.handleReply}
            onForward={handleMailActions.forward}
            onDelete={handleMailActions.delete}
            onArchive={handleMailActions.archive}
            onSnooze={handleMailActions.snooze}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}