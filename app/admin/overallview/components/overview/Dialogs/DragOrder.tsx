// @ts-nocheck 
// @ts-ignore
"use client";
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import { Edit2, Trash } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';

export const DragHandle = () => (
  <div className="cursor-move flex items-center justify-center w-6 h-6">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  </div>
);

export const onDragEnd = async (result: any, columnOrder: any, setColumnOrder: any, currentStructure: any, persistColumnOrder: any) => {
  if (!result.destination) return;

  const { source, destination, type } = result;

  if (type === 'columns') {
    const newOrder = reorderColumns(
      columnOrder.columns,
      source.index,
      destination.index
    );

    // Update local state immediately for smooth UX
    setColumnOrder(prev => ({
      ...prev,
      columns: newOrder
    }));

    // Persist to database
    await persistColumnOrder(newOrder);
  }
};

export const persistColumnOrder = async (newOrder: string[], currentStructure: any, setColumnOrder: any, fetchStructure: any) => {
  try {
    if (!currentStructure || !selectedTab) return;

    const updatedOrder = {
      ...currentStructure.column_order,
      order: {
        ...currentStructure.column_order?.order,
        columns: newOrder.reduce((acc, key, index) => ({
          ...acc,
          [key]: index
        }), {})
      }
    };

    const { error } = await supabase
      .from('profile_category_table_mapping')
      .update({
        column_order: updatedOrder
      })
      .eq('id', currentStructure.id);

    if (error) throw error;

    // Update local state
    setColumnOrder(prev => ({
      ...prev,
      columns: newOrder
    }));

    // Refresh structure
    await fetchStructure();

  } catch (error) {
    console.error('Error persisting column order:', error);
    toast.error('Failed to save column order');
  }
};
export const fetchStructure = async () => {
  const { data, error } = await supabase
    .from('profile_category_table_mapping_2')
    .select('*');

  if (error) throw error;

  return data.map(item => ({
    ...item,
    sections: item.structure.sections.map(section => ({
      ...section,
      subsections: section.subsections.map(subsection => ({
        ...subsection,
        fields: subsection.fields.map(field => ({
          ...field,
          dropdownOptions: field.dropdownOptions || []
        }))
      }))
    }))
  }));
};

export const DraggableColumns = ({
  columnMappings,
  dropdowns,
  visibilitySettings,
  columnOrder,
  onDragEnd,
  handleEditField,
  handleDeleteField,
  toggleVisibility,
  structure,
  handleOrderUpdate,
  activeMainTab
}) => {
  const mappings = columnMappings || {};
  const visibility = visibilitySettings?.columns || {};
  const order = columnOrder?.columns || {};

  const visibleColumns = React.useMemo(() => {
    return Object.entries(mappings)
      .filter(([key]) => visibility[key] !== false && key && mappings[key]) // Added validation
      .sort((a, b) => {
        const orderA = order[a[0]] || 0;
        const orderB = order[b[0]] || 0;
        return orderA - orderB;
      });
  }, [mappings, visibility, order]);

  const getDropdownOptions = (tableName: string, columnName: string) => {
    const field = structure
      ?.flatMap(item => item.sections)
      ?.flatMap(section => section.subsections)
      ?.flatMap(subsection => subsection.fields)
      ?.find(field => field.table === tableName && field.name === columnName);

    return field?.dropdownOptions || [];
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="columns" direction="vertical">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <table className="w-full">
              <thead>
                <tr className="grid grid-cols-[60px,1fr,1fr,1fr,1fr,120px] gap-2 p-2 bg-gray-50">
                <th>Order</th>
                  <th>Display Name</th>
                  <th>Table Name</th>
                  <th>Options</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleColumns.map(([key, value], index) => {
                  const [tableName, columnName] = key.split('.');
                  const draggableId = `${tableName}-${columnName}-${index}`;

                  return (
                    <Draggable key={draggableId} draggableId={draggableId} index={index}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`grid grid-cols-[60px,1fr,1fr,1fr,1fr,120px] gap-2 p-2 ${snapshot.isDragging ? 'bg-gray-100' : ''
                            }`}
                        >
                          <td className="flex items-center">
                            <span className="ml-2">{index + 1}</span>
                          </td>
                          <td>{value}</td>
                          <td>{tableName}</td>
                          <td>
                            {getDropdownOptions(tableName, columnName).map((option, idx) => (
                              <span key={idx} className="mr-1 px-2 py-1 bg-gray-100 rounded text-sm">
                                {option}
                              </span>
                            ))}
                          </td>
                          <td className="flex gap-2">
                            <Button
                              onClick={() => handleEditField(`${tableName}-${columnName}`)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>

                            <Button onClick={() => handleDeleteField(key)} variant="destructive" size="sm">
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  );
                })}
              </tbody>
            </table>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};