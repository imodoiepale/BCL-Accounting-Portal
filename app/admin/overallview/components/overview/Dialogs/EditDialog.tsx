// @ts-nocheck 
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';

interface EditFieldDialogProps {
  editFieldDialogOpen: boolean;
  setEditFieldDialogOpen: (open: boolean) => void;
  editingField: any;
  setEditingField: (field: any) => void;
  handleSaveFieldEdit: () => Promise<void>;
  structure: any[];
  selectedTab: string;
  selectedSection: any;
  selectedSubsection: string;
  supabase: any;
  fetchStructure: () => Promise<void>;
}

export const EditFieldDialog: React.FC<EditFieldDialogProps> = ({
  editFieldDialogOpen,
  setEditFieldDialogOpen,
  editingField,
  setEditingField,
  handleSaveFieldEdit,
  structure,
  selectedTab,
  selectedSection,
  selectedSubsection,
  supabase,
  fetchStructure
}) => {
  console.log('EditFieldDialog props:', {
    editFieldDialogOpen,
    editingField
  });

  if (!editingField) return null;

  return (
    <Dialog open={editFieldDialogOpen} onOpenChange={setEditFieldDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Table Name</label>
              <Input value={editingField.tableName} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Column Name</label>
              <Input value={editingField.columnName} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={editingField.displayName}
              onChange={(e) => setEditingField(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Has Dropdown Options?</label>
            <Select
              value={editingField.hasDropdown}
              onValueChange={(value: 'yes' | 'no') => setEditingField(prev => ({
                ...prev,
                hasDropdown: value,
                dropdownOptions: value === 'no' ? [] : prev.dropdownOptions
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingField.hasDropdown === 'yes' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Dropdown Options</label>
              <div className="space-y-2">
                {editingField.dropdownOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingField.dropdownOptions];
                        newOptions[index] = e.target.value;
                        setEditingField(prev => ({
                          ...prev,
                          dropdownOptions: newOptions
                        }));
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingField(prev => ({
                          ...prev,
                          dropdownOptions: prev.dropdownOptions.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingField(prev => ({
                      ...prev,
                      dropdownOptions: [...prev.dropdownOptions, '']
                    }));
                  }}
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditFieldDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleSaveFieldEdit(
            editingField,
            structure,
            selectedTab,
            selectedSection,
            selectedSubsection,
            supabase,
            fetchStructure,
            setEditFieldDialogOpen
          )}>
            Save Changes
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}