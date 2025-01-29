import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

interface StructureItem {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
  table?: string;
  parent?: {
    maintab?: string;
    subtab?: string;
    section?: string;
    subsection?: string;
  };
}

interface EditSheetProps {
  item: StructureItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: StructureItem) => Promise<void>;
  type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
  parentItem?: StructureItem;
}

export function EditSheet({
  item,
  isOpen,
  onClose,
  onSave,
  type,
  parentItem
}: EditSheetProps) {
  const [name, setName] = useState(item?.name || '');
  const [table, setTable] = useState(item?.table || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setTable(item.table || '');
    } else {
      setName('');
      setTable('');
    }
  }, [item]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updatedItem: StructureItem = {
        id: item?.id || `${type}-${Date.now()}`,
        name: name.trim(),
        order: item?.order || 0,
        visible: item?.visible ?? true,
        type,
        ...(table && { table }),
        ...(parentItem && {
          parent: {
            ...(parentItem.type === 'maintab' && { maintab: parentItem.name }),
            ...(parentItem.type === 'subtab' && { subtab: parentItem.name }),
            ...(parentItem.type === 'section' && { section: parentItem.name }),
            ...(parentItem.type === 'subsection' && { subsection: parentItem.name }),
          }
        })
      };

      await onSave(updatedItem);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item ? 'Edit' : 'Add'} {type}</SheetTitle>
          <SheetDescription>
            {item ? 'Edit the details of this item' : 'Add a new item to the structure'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          {type === 'field' && (
            <div>
              <Label htmlFor="table">Table</Label>
              <Input
                id="table"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="Enter table name"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}