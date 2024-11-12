// /settings/HelperHeaderEditor.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelperHeaderConfig, HelperHeaderType } from '../types';

export const HelperHeaderEditor: React.FC<{
    headers: HelperHeaderConfig[];
    onUpdate: (updates: HelperHeaderConfig[]) => void;
}> = ({ headers, onUpdate }) => {
    const [selectedHeader, setSelectedHeader] = useState<string | null>(null);

    const addHeader = () => {
        const newHeader: HelperHeaderConfig = {
            id: generateId(),
            type: 'calculation',
            position: 'bottom',
            label: 'New Helper Header',
            config: {
                calculation: null,
                display: {
                    style: {},
                    visibility: true
                }
            }
        };

        onUpdate([...headers, newHeader]);
        setSelectedHeader(newHeader.id);
    };

    const updateHeader = (id: string, updates: Partial<HelperHeaderConfig>) => {
        onUpdate(
            headers.map(header =>
                header.id === id ? { ...header, ...updates } : header
            )
        );
    };

    return (
        <div className="helper-header-editor">
            <div className="toolbar">
                <Button onClick={addHeader}>Add Helper Header</Button>
            </div>

            <div className="editor-content">
                <div className="headers-list">
                    {headers.map(header => (
                        <Card
                            key={header.id}
                            className={`header-item ${selectedHeader === header.id ? 'selected' : ''}`}
                            onClick={() => setSelectedHeader(header.id)}
                        >
                            <div className="header-summary">
                                <span className="header-label">{header.label}</span>
                                <span className="header-type">{header.type}</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {selectedHeader && (
                    <HeaderConfigForm
                        header={headers.find(h => h.id === selectedHeader)!}
                        onUpdate={(updates) => updateHeader(selectedHeader, updates)}
                    />
                )}
            </div>
        </div>
    );
};

const HeaderConfigForm: React.FC<{
    header: HelperHeaderConfig;
    onUpdate: (updates: Partial<HelperHeaderConfig>) => void;
}> = ({ header, onUpdate }) => {
    return (
        <div className="header-config-form">
            <div className="form-group">
                <label>Label</label>
                <Input
                    value={header.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label>Type</label>
                <Select
                    value={header.type}
                    onValueChange={(value) => onUpdate({ type: value as HelperHeaderType })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="calculation">Calculation</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Additional configuration based on header type can be added here */}
        </div>
    );
};