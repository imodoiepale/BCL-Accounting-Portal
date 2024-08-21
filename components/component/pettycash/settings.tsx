/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export function PettyCashSettings({ settings, setSettings, accountsToReplenish, handleReplenishAll, handleReplenishAccount, handleExportToExcel }) {
  const [currentSettingsTab, setCurrentSettingsTab] = useState('accounts');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSettingChange = (section, key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [key]: value,
      },
    }));
  };

  const handleUserLimitChange = (index, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: prevSettings.accounts.userLimits.map((limit, i) => 
          i === index ? { ...limit, [field]: value } : limit
        ),
      },
    }));
  };

  const handleAddUserLimit = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: [
          ...prevSettings.accounts.userLimits,
          { userName: '', accountType: '', limit: 0 },
        ],
      },
    }));
  };

  const handleRemoveUserLimit = (index) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      accounts: {
        ...prevSettings.accounts,
        userLimits: prevSettings.accounts.userLimits.filter((_, i) => i !== index),
      },
    }));
  };

  const handleAddCategory = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      categories: [
        ...prevSettings.categories,
        { type: 'Expense', name: '' },
      ],
    }));
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setEditingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingCategory) {
      setSettings(prevSettings => ({
        ...prevSettings,
        categories: prevSettings.categories.map(cat =>
          cat === editingCategory.original ? editingCategory : cat
        ),
      }));
    }
    setIsEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (editingCategory) {
      setSettings(prevSettings => ({
        ...prevSettings,
        categories: prevSettings.categories.filter(cat => cat !== editingCategory),
      }));
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 flex overflow-hidden">
        <Tabs defaultValue={currentSettingsTab} className="flex w-full">
          <TabsList className="flex flex-col w-36 space-y-1.5 mt-24 border-r gap-2 pl-6">
            {['accounts', 'transactions', 'replenishment', 'reports', 'expense categories'].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="justify-center px-3 py-1.5 w-36 capitalize hover:bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Separator orientation="vertical" className="h-2/3 m-3" />

          <div className="flex-1 overflow-auto">
          <ScrollArea className="h-[800px] p-4">
                <TabsContent value="accounts" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-2">General Account Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableMultiCurrency" className="text-xs">Multi-Currency Support</Label>
                        <Switch
                          id="enableMultiCurrency"
                          checked={settings.accounts.enableMultiCurrency}
                          onCheckedChange={(checked) => handleSettingChange('accounts', 'enableMultiCurrency', checked)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="defaultCurrency" className="text-xs whitespace-nowrap">Default Currency</Label>
                        <Input
                          id="defaultCurrency"
                          value={settings.accounts.defaultCurrency}
                          onChange={(e) => handleSettingChange('accounts', 'defaultCurrency', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-2">User Account Limits</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">User</TableHead>
                          <TableHead className="text-xs">Account Type</TableHead>
                          <TableHead className="text-xs">Limit</TableHead>
                          <TableHead className="text-xs w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings.accounts.userLimits?.map((limit, index) => (
                          <TableRow key={index}>
                            <TableCell className="py-2">
                              <Input
                                value={limit.userName}
                                onChange={(e) => handleUserLimitChange(index, 'userName', e.target.value)}
                                className="h-7 text-xs"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Input
                                value={limit.accountType}
                                onChange={(e) => handleUserLimitChange(index, 'accountType', e.target.value)}
                                className="h-7 text-xs"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Input
                                type="number"
                                value={limit.limit}
                                onChange={(e) => handleUserLimitChange(index, 'limit', e.target.value)}
                                className="h-7 text-xs w-20"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveUserLimit(index)}
                                className="h-7 text-xs px-2"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button onClick={handleAddUserLimit} className="mt-2 h-7 text-xs">Add User Limit</Button>
                  </Card>
                </TabsContent>

                  <TabsContent value="transactions">
                    <Card>
                      <CardContent className="space-y-3 pt-4">
                        <h3 className="text-base font-medium">Transaction Settings</h3>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireApproval">Require Approval for Transactions</Label>
                          <Switch
                            id="requireApproval"
                            checked={settings.transactions.requireApproval}
                            // onCheckedChange={(checked) => handleSettingChange('transactions', 'requireApproval', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="attachmentRequired">Require Attachment for Transactions</Label>
                          <Switch
                            id="attachmentRequired"
                            checked={settings.transactions.attachmentRequired}
                            // onCheckedChange={(checked) => handleSettingChange('transactions', 'attachmentRequired', checked)}
                          />
                        </div>
                            
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="replenishment">
                    <Card>
                      <CardContent className="space-y-3 pt-4">
                        <h3 className="text-base font-medium">Accounts to Replenish</h3>
                        <div className="flex justify-between mb-3">
                          <Button onClick={handleReplenishAll}>Replenish All</Button>
                          <Button onClick={handleExportToExcel} className="flex items-center">
                            <Download className="mr-1.5 h-3 w-3" />
                            Export to Excel
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account ID</TableHead>
                              <TableHead>Account Name</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Current Balance</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accountsToReplenish.map((account) => (
                              <TableRow key={account.id}>
                                <TableCell>{account.id}</TableCell>
                                <TableCell>{account.account_name}</TableCell>
                                <TableCell>{account.users.name}</TableCell>
                                <TableCell>{account.balance}</TableCell>
                                <TableCell>{account.currency}</TableCell>
                                <TableCell>
                                  <Button onClick={() => handleReplenishAccount(account.id)}>Replenish</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-2 grid grid-cols-2 gap-4 top-0">
                    <Card className="px-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md">Report View Settings</CardTitle>
                        <CardDescription className="text-sm">Customize report display and generation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                        <Label htmlFor="defaultView" className="text-sm">Default View</Label>
                        <Select
                            defaultValue={settings.reports.defaultView}
                            onValueChange={(value) => handleSettingChange('reports', 'defaultView', value)}
                        >
                            <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                            {settings.reports.viewOptions.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                        <Label htmlFor="autoGenerate" className="text-sm">Auto-generate Reports</Label>
                        <Switch
                            id="autoGenerate"
                            checked={settings.reports.autoGenerate}
                            onCheckedChange={(checked) => handleSettingChange('reports', 'autoGenerate', checked)}
                        />
                        </div>
                        
                        {settings.reports.autoGenerate && (
                        <div className="flex items-center justify-between">
                            <Label htmlFor="generateFrequency" className="text-sm">Generation Frequency</Label>
                            <Select
                            defaultValue={settings.reports.generateFrequency}
                            onValueChange={(value) => handleSettingChange('reports', 'generateFrequency', value)}
                            >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        )}
                    </CardContent>
                    </Card>

                    <Card className="px-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md">Report Content</CardTitle>
                        <CardDescription className="text-sm">Configure included information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeTransactions"
                            checked={settings.reports.includeTransactions}
                            onCheckedChange={(checked) => handleSettingChange('reports', 'includeTransactions', checked)}
                        />
                        <Label htmlFor="includeTransactions" className="text-sm">Include Transactions</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeBalances"
                            checked={settings.reports.includeBalances}
                            onCheckedChange={(checked) => handleSettingChange('reports', 'includeBalances', checked)}
                        />
                        <Label htmlFor="includeBalances" className="text-sm">Include Account Balances</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeCharts"
                            checked={settings.reports.includeCharts}
                            onCheckedChange={(checked) => handleSettingChange('reports', 'includeCharts', checked)}
                        />
                        <Label htmlFor="includeCharts" className="text-sm">Include Charts and Graphs</Label>
                        </div>
                    </CardContent>
                    </Card>

                    <Card className="px-4 col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md">Report Customization</CardTitle>
                        <CardDescription className="text-sm">Fine-tune your report settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="space-y-2">
                        <Label htmlFor="dataRetention" className="text-sm">Data Retention Period (months)</Label>
                        <Slider
                            id="dataRetention"
                            min={1}
                            max={36}
                            step={1}
                            value={[settings.reports.dataRetentionMonths]}
                            onValueChange={(value) => handleSettingChange('reports', 'dataRetentionMonths', value[0])}
                        />
                        <div className="text-right text-sm text-muted-foreground">
                            {settings.reports.dataRetentionMonths} months
                        </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                        <Label className="text-sm">Report Generation Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[240px] pl-3 text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {settings.reports.generationDate ? format(settings.reports.generationDate, "PPP") : "Pick a date"}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={settings.reports.generationDate}
                                onSelect={(date) => handleSettingChange('reports', 'generationDate', date)}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>
                
                  <TabsContent value="expense categories" className="space-y-4">
                    <Card className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium">Expense Categories</h3>
                        <Button onClick={handleAddCategory} className="h-8 text-xs">Add Category</Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings.categories.map((category, index) => (
                            <TableRow key={index}>
                              <TableCell className="py-2">{category.type}</TableCell>
                              <TableCell className="py-2">{category.name}</TableCell>
                              <TableCell className="py-2">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>

                     {/* Edit Category Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-type" className="text-right">
                              Type
                            </Label>
                            <Input
                              id="edit-type"
                              value={editingCategory?.type || ''}
                              onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="edit-name"
                              value={editingCategory?.name || ''}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleSaveEdit}>Save changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Category Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Delete Category</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>Are you sure you want to delete the category "{editingCategory?.name}"?</p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default PettyCashSettings;