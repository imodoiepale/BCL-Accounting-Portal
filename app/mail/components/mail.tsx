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
  Tags,
  Settings2,
  Filter,
  X,
  MoreHorizontal,
  Edit,
  Trash,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
        <TabsTrigger value="table" className="flex-1">Table View</TabsTrigger>
        <TabsTrigger value="cards" className="flex-1">Card View</TabsTrigger>
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
      <TabsContent value="cards" className="mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filters.map((filter) => (
            <Card key={filter.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  {filter.name}
                </CardTitle>
                <CardDescription>
                  {filter.conditions.length} condition(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {filter.conditions.map((condition, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border p-2 text-sm"
                    >
                      <div className="font-medium">{condition.field}</div>
                      <div className="text-muted-foreground">
                        {condition.operator} "{condition.value}"
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(filter)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => onDelete(filter.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
const MailHeader: React.FC<MailHeaderProps> = ({
  onSearch,
  activeTab,
  onTabChange,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<'all' | 'unread'>('all')
  const [customFilters, setCustomFilters] = React.useState<CustomFilter[]>(DEFAULT_FILTERS)
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
  }

  const createFilter = () => {
    if (newFilter.name.trim() === "") return

    if (editingFilter) {
      updateFilter()
    } else {
      const filterId = newFilter.name.toLowerCase().replace(/\s+/g, "-")
      const newCustomFilter = {
        ...newFilter,
        id: filterId,
      }

      setCustomFilters([...customFilters, newCustomFilter])
      setIsCreateFilterOpen(false)
      setNewFilter({
        id: "",
        name: "",
        conditions: [{ field: "subject", operator: "contains", value: "" }],
      })
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

    // Filter based on active tab and custom filters
    const activeFilter = DEFAULT_FILTERS.find(f => f.id === activeTab)
    if (activeFilter) {
      messages = messages.filter(msg => {
        return activeFilter.conditions.every(condition => {
          if (condition.field === 'labels') {
            return msg.labelIds?.some(label => 
              label.toLowerCase().includes(condition.value.toLowerCase())
            )
          }
          // Add other filter condition checks as needed
          return true
        })
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
          <div className={cn("flex h-[52px] items-center justify-center", 
            isCollapsed ? "h-[52px]" : "px-2")}>
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