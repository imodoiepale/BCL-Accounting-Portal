'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SortAsc, SortDesc } from "lucide-react"

export default function DocumentManagement() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const companies = [
    "Company A", "Company B", "Company C", "Company D", "Company E",
    "Company F", "Company G", "Company H", "Company I", "Company J"
  ]

  const monthlySubTabs = ["Supplier Statements", "Bank Statements"]

  const filteredAndSortedCompanies = companies
    .filter(company => 
      company.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.localeCompare(b)
      }
      return b.localeCompare(a)
    })

  return (
    <div className="flex h-screen bg-background">
      {/* Left column: Companies list */}
      <div className="w-[180px] border-r">
        <div className="p-2 border-b">
          <h2 className="text-sm font-semibold mb-2">Companies</h2>
          <div className="relative mb-2">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
            <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs py-1 h-7"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
            {sortOrder === "asc" ? (
              <SortAsc className="h-3 w-3 ml-1" />
            ) : (
              <SortDesc className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-1">
            {filteredAndSortedCompanies.map((company) => (
              <Button
                key={company}
                variant={selectedCompany === company ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 text-xs h-7 px-2"
                onClick={() => setSelectedCompany(company)}
              >
                {company}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      {/* Right column: Document tabs */}
      <div className="flex-1 p-4 overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">
          {selectedCompany ? `${selectedCompany} Documents` : "Select a Company"}
        </h2>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="monthly">Monthly Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <Tabs defaultValue={monthlySubTabs[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                {monthlySubTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              {monthlySubTabs.map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="p-4 border rounded-lg mt-4">
                    <h3 className="text-base font-semibold mb-2">{tab}</h3>
                    <p className="text-sm text-muted-foreground">Document list for {tab} will be displayed here.</p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}