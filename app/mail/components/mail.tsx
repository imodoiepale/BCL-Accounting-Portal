// @ts-nocheck
"use client"

import * as React from "react"
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Send,
  Search,
  Trash2,
  Users2,
  AlertCircle,
  Settings,
  Plus,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { AccountSwitcher } from "./account-switcher"
import { MailDisplay } from "./mail-display"
import { MailList } from "./mail-list"
import { Nav } from "./nav"
import { useGmail } from "../hooks/use-gmail"
import { useMail } from "../hooks/use-mail"
import { MailProps } from "../types"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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

interface MailHeaderProps {
  onSearch: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  loading: boolean;
  filters: CustomFilter[];
  onCreateFilter: (filter: CustomFilter) => void;
  onEditFilter: (filter: CustomFilter) => void;
  onDeleteFilter: (filterId: string) => void;
}

const MailHeader: React.FC<MailHeaderProps> = ({
  onSearch,
  activeTab,
  onTabChange,
  loading,
  filters,
  onCreateFilter,
  onEditFilter,
  onDeleteFilter,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateFilterOpen, setIsCreateFilterOpen] = React.useState(false)
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

  const createFilter = () => {
    if (newFilter.name.trim() === "") return

    const filterId = newFilter.name.toLowerCase().replace(/\s+/g, "-")
    const newCustomFilter = {
      ...newFilter,
      id: filterId,
    }

    if (editingFilter) {
      onEditFilter(newCustomFilter)
    } else {
      onCreateFilter(newCustomFilter)
    }

    setIsCreateFilterOpen(false)
    setNewFilter({
      id: "",
      name: "",
      conditions: [{ field: "subject", operator: "contains", value: "" }],
    })
    setEditingFilter(null)
  }

  return (
    <div className="border-b">
      {/* Top row with Inbox title and view options */}
      <div className="flex items-center justify-between p-2 pb-0">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={cn(
              "transition-colors",
              activeTab === 'all' 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-100 hover:bg-gray-200"
            )}
            onClick={() => onTabChange('all')}
            disabled={loading}
          >
            All mail
          </Button>
          <Button
            variant="ghost"
            className={cn(
              activeTab === 'unread' && "bg-gray-100"
            )}
            onClick={() => onTabChange('unread')}
            disabled={loading}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Search bar */}
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

      {/* Category tabs */}
      <div className="px-2 flex items-center justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={onTabChange}
          className="w-full"
        >
          <TabsList className="w-full justify-start gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="primary" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Primary
            </TabsTrigger>
            <TabsTrigger 
              value="social"
              className="data-[state=active]:bg-gray-100 px-4 py-2 rounded"
              disabled={loading}
            >
              Social
            </TabsTrigger>
            <TabsTrigger 
              value="promotions"
              className="data-[state=active]:bg-gray-100 px-4 py-2 rounded"
              disabled={loading}
            >
              Promotions
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateFilterOpen} onOpenChange={setIsCreateFilterOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                disabled={loading}
              >
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
                    <Input
                      placeholder="Field"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, "field", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Operator"
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, "operator", e.target.value)}
                      className="flex-1"
                    />
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
                        <Trash2 className="h-4 w-4" />
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
                <Button onClick={createFilter}>Create filter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                disabled={loading}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
              <DialogHeader>
                <DialogTitle>Manage Filters</DialogTitle>
                <DialogDescription>
                  View, edit, and manage your custom email filters.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <span className="font-medium">{filter.name}</span>
                      <div className="flex flex-col">
                        {filter.conditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="w-fit">
                            {condition.field} {condition.operator} "{condition.value}"
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => {
                        setEditingFilter(filter)
                        setNewFilter(filter)
                        setIsCreateFilterOpen(true)
                      }}>
                        Edit
                      </Button>
                      <Button onClick={() => onDeleteFilter(filter.id)} className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => toast.success('Filters managed!')}>
                  Close
                </Button>
              </DialogFooter>
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
  const [mail] = useMail()
  
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

  const [customFilters, setCustomFilters] = React.useState<CustomFilter[]>(DEFAULT_FILTERS)

  // Load layout from cookie
  React.useEffect(() => {
    const layout = document.cookie
      .split('; ')
      .find(row => row.startsWith('react-resizable-panels:layout'))
      ?.split('=')[1]

    if (layout) {
      try {
        const sizes = JSON.parse(layout)
        // Validate sizes here if needed
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
    // Implement search functionality here
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Implement tab change functionality here
  }

  const createFilter = (filter: CustomFilter) => {
    setCustomFilters((prev) => [...prev, filter])
  }

  const editFilter = (updatedFilter: CustomFilter) => {
    setCustomFilters((prev) =>
      prev.map((filter) => (filter.id === updatedFilter.id ? updatedFilter : filter))
    )
  }

  const deleteFilter = (filterId: string) => {
    setCustomFilters((prev) => prev.filter((filter) => filter.id !== filterId))
  }

  // Filter messages based on search and active tab
  const filteredMessages = React.useMemo(() => {
    let messages = accounts.flatMap(acc => acc.messages || [])

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

    if (activeTab !== 'primary') {
      messages = messages.filter(msg => {
        // Add logic to filter by tab (social, promotions, etc.)
        return msg.labelIds?.includes(activeTab.toUpperCase())
      })
    }

    return messages
  }, [accounts, searchQuery, activeTab])

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
          <div className={cn("flex h-[52px] items-center justify-center", isCollapsed ? "h-[52px]" : "px-2")}>
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={accounts.map(acc => ({
                label: acc.email.split('@')[0],
                email: acc.email,
                icon: <Users2 className="h-4 w-4" />
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
                title: "Inbox",
                label: filteredMessages.length.toString(),
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
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
                title: "Social",
                label: filteredMessages.filter(msg => 
                  msg.labelIds?.includes('CATEGORY_SOCIAL')
                ).length.toString(),
                icon: Users2,
                variant: "ghost",
              },
              {
                title: "Updates",
                label: filteredMessages.filter(msg => 
                  msg.labelIds?.includes('CATEGORY_UPDATES')
                ).length.toString(),
                icon: AlertCircle,
                variant: "ghost",
              },
              {
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
            filters={customFilters}
            onCreateFilter={createFilter}
            onEditFilter={editFilter}
            onDeleteFilter={deleteFilter}
          />
          <MailList
            accounts={accounts}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            selectedAccount={selectedAccount}
            searchQuery={searchQuery}
            activeTab={activeTab}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={filteredMessages.find(msg => msg.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}