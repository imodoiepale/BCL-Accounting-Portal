//@ts-nocheck

/* eslint-disable react/no-unescaped-entities */
"use client"

import * as React from "react"
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Filter,
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
import { AccountSwitcher } from "./account-switcher"
import { Nav } from "./nav"
import { MailList } from "./mail-list"
import { MailDisplay } from "./mail-display"
import { useMail } from "./use-mail"
import { Mail } from "../data"

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
import { Edit, MoreHorizontal, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface FilterManagementProps {
  filters: CustomFilter[]
  onEdit: (filter: CustomFilter) => void
  onDelete: (filterId: string) => void
}


interface CustomFilter {
  id: string
  name: string
  conditions: FilterCondition[]
  color?: string
}

interface MailProps {
  accounts: {
    label: string
    email: string
    icon: React.ReactNode
  }[]
  mails: Mail[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
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

export function Mail({
  accounts,
  mails,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [mail] = useMail()
  const [currentFilter, setCurrentFilter] = React.useState("primary")
  const [customFilters, setCustomFilters] = React.useState<CustomFilter[]>(DEFAULT_FILTERS)
  const [isCreateFilterOpen, setIsCreateFilterOpen] = React.useState(false)

  const [isManageFiltersOpen, setIsManageFiltersOpen] = React.useState(false)
  const [editingFilter, setEditingFilter] = React.useState<CustomFilter | null>(null)

  const [newFilter, setNewFilter] = React.useState<CustomFilter>({
    id: "",
    name: "",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
  })

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

  const handleEditFilter = (filter: CustomFilter) => {
    setEditingFilter(filter)
    setNewFilter({
      ...filter,
      conditions: [...filter.conditions]
    })
    setIsCreateFilterOpen(true)
  }

  const handleDeleteFilter = (filterId: string) => {
    setCustomFilters(filters => filters.filter(f => f.id !== filterId))
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


  const FilterManagement = ({ filters, onEdit, onDelete }: FilterManagementProps) => {
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
                        <Badge key={idx} variant="outline" className="w-fit">
                          {condition.field} {condition.operator} "{condition.value}"
                        </Badge>
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


  const getFilteredMails = (filterId: string, mailList: Mail[]) => {
    const filter = customFilters.find((f) => f.id === filterId)
    if (!filter) return mailList

    return mailList.filter((mail) => {
      return filter.conditions.every((condition) => {
        const value = mail[condition.field as keyof Mail]
        if (Array.isArray(value)) {
          return value.some((v) =>
            condition.operator === "includes" ?
              v.toLowerCase().includes(condition.value.toLowerCase()) :
              v.toLowerCase() === condition.value.toLowerCase()
          )
        }
        if (typeof value === "string") {
          switch (condition.operator) {
            case "contains":
              return value.toLowerCase().includes(condition.value.toLowerCase())
            case "equals":
              return value.toLowerCase() === condition.value.toLowerCase()
            case "startsWith":
              return value.toLowerCase().startsWith(condition.value.toLowerCase())
            default:
              return true
          }
        }
        return false
      })
    })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(sizes)}`
        }}
        className="h-full max-h-[800px] items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`
          }}
          onResize={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`
          }}
          className={cn(
            isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px]" : "px-2"
            )}
          >
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={accounts}
            />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Compose",
                label: "Write a new Email",
                icon: Pencil,
                variant: "outline",
              },
              {
                title: "Automations",
                label: "Automate & Schedule",
                icon: SettingsIcon,
                variant: "outline",
              },
              {
                title: "Inbox",
                label: "128",
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
                label: "972",
                icon: Users2,
                variant: "ghost",
              },
              {
                title: "Updates",
                label: "342",
                icon: AlertCircle,
                variant: "ghost",
              },
              {
                title: "Forums",
                label: "128",
                icon: MessagesSquare,
                variant: "ghost",
              },
              {
                title: "Shopping",
                label: "8",
                icon: ShoppingCart,
                variant: "ghost",
              },
              {
                title: "Promotions",
                label: "21",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <div className="border-t">
              <div className="flex items-center justify-between px-4 py-2">
                <Tabs defaultValue={currentFilter} className="w-full" onValueChange={setCurrentFilter}>
                  <ScrollArea className="w-full">
                    <TabsList className="inline-flex w-full justify-start rounded-none border-b p-0">
                      {customFilters.map((filter) => (
                        <TabsTrigger
                          key={filter.id}
                          value={filter.id}
                          className="gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-50 transition-colors"
                        >
                          <Tags className="h-4 w-4" />
                          {filter.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </ScrollArea>
                </Tabs>
                <Dialog open={isCreateFilterOpen} onOpenChange={setIsCreateFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
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
                      <Button onClick={createFilter}>Create filter</Button>
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
            <TabsContent value="all" className="m-0">
              <MailList items={getFilteredMails(currentFilter, mails)} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={getFilteredMails(currentFilter, mails.filter((item) => !item.read))} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}