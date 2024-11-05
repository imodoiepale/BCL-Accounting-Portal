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

const MailHeader = () => {
  return (
    <div className="border-b">
      {/* Top row with Inbox title and view options */}
      <div className="flex items-center justify-between p-2 pb-0">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <div className="flex gap-2">
          <Button variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
            All mail
          </Button>
          <Button variant="ghost">Unread</Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input 
            className="w-full pl-9 bg-gray-50" 
            placeholder="Search" 
            type="search"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-2 flex items-center justify-between">
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="w-full justify-start gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="primary" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-4 py-2 rounded"
            >
              Primary
            </TabsTrigger>
            <TabsTrigger 
              value="social"
              className="data-[state=active]:bg-gray-100 px-4 py-2 rounded"
            >
              Social
            </TabsTrigger>
            <TabsTrigger 
              value="promotions"
              className="data-[state=active]:bg-gray-100 px-4 py-2 rounded"
            >
              Promotions
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Mail({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
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

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(collapsed)}`
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
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <MailHeader />
          <MailList
            accounts={accounts}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            selectedAccount={selectedAccount}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={accounts
              .flatMap(acc => acc.messages || [])

              .find(msg => msg.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}