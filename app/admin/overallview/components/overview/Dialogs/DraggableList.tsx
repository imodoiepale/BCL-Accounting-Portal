import React from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DraggableListProps {
  items: StructureItem[];
  type: string;
  onEdit: (item: StructureItem) => void;
  onDelete: (item: StructureItem) => void;
  onVisibilityChange: (item: StructureItem, visible: boolean) => void;
  onDragEnd: (result: any) => void;
}

export function DraggableList({
  items,
  type,
  onEdit,
  onDelete,
  onVisibilityChange,
  onDragEnd
}: DraggableListProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={type} type={type}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      "flex items-center gap-2 p-2 bg-background rounded-md group",
                      snapshot.isDragging ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div {...provided.dragHandleProps} className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-grow">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.visible}
                        onCheckedChange={(checked) => onVisibilityChange(item, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="text-destructive opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}