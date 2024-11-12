// /components/CellRenderer.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { ColumnDefinition } from '../core/types';

export const CellRenderer: React.FC<{
    column: ColumnDefinition;
    value: any;
    row: any;
    onUpdate: (value: any) => void;
    isNested?: boolean;
    level?: number;
}> = ({ column, value, row, onUpdate, isNested, level }) => {
    const [editMode, setEditMode] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleValueChange = (newValue: any) => {
        setCurrentValue(newValue);
        if (column.config.updateOnChange) {
            onUpdate(newValue);
        }
    };

    const renderEditControl = () => {
        switch (column.type) {
            case 'text':
                return (
                    <Input
                        value={currentValue || ''}
                        onChange={(e) => handleValueChange(e.target.value)}
                        onBlur={() => setEditMode(false)}
                        autoFocus
                    />
                );
            case 'select':
                return (
                    <Select
                        value={currentValue}
                        options={column.config.options}
                        onChange={handleValueChange}
                        onBlur={() => setEditMode(false)}
                    />
                );
            case 'date':
                return (
                    <DatePicker
                        value={currentValue}
                        onChange={handleValueChange}
                        onClose={() => setEditMode(false)}
                    />
                );
            case 'checkbox':
                return (
                    <Checkbox
                        checked={currentValue}
                        onCheckedChange={handleValueChange}
                    />
                );
            default:
                return (
                    <Input
                        value={currentValue || ''}
                        onChange={(e) => handleValueChange(e.target.value)}
                        onBlur={() => setEditMode(false)}
                    />
                );
        }
    };

    const renderDisplayValue = () => {
        if (column.config.renderer) {
            return column.config.renderer(value, row);
        }

        switch (column.type) {
            case 'date':
                return value ? new Date(value).toLocaleDateString() : '';
            case 'checkbox':
                return value ? '✓' : '✗';
            case 'select':
                return column.config.options.find(opt => opt.value === value)?.label || value;
            default:
                return value;
        }
    };

    return (
        <div
            className={`cell-content ${isNested ? 'nested-cell' : ''}`}
            style={isNested ? { paddingLeft: `${level * 20}px` } : undefined}
        >
            {editMode ? renderEditControl() : (
                <div
                    className="display-value"
                    onClick={() => column.config.editable && setEditMode(true)}
                >
                    {renderDisplayValue()}
                </div>
            )}
        </div>
    );
};