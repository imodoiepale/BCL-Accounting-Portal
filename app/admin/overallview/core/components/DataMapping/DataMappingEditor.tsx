// /components/DataMapping/DataMappingEditor.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DataSourceSelector } from './DataSourceSelector';
import { ColumnMapper } from './ColumnMapper';
import { PreviewData } from './PreviewData';
import { DataMapping, DataSource } from '../../core/types';

export const DataMappingEditor: React.FC<{
    configId: string;
    onUpdate: (mapping: DataMapping) => void;
}> = ({ configId, onUpdate }) => {
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
    const [mapping, setMapping] = useState<DataMapping>({});
    const [previewData, setPreviewData] = useState<any[]>([]);

    const handleSourceSelect = async (source: DataSource) => {
        setSelectedSource(source);
        const columns = await fetchSourceColumns(source);
        setMapping(prev => ({
            ...prev,
            [source.id]: { columns: columns, relationships: [] }
        }));
    };

    const handleMappingUpdate = async (updates: Partial<DataMapping>) => {
        const newMapping = { ...mapping, ...updates };
        setMapping(newMapping);
        onUpdate(newMapping);

        // Update preview data
        const preview = await generatePreviewData(newMapping);
        setPreviewData(preview);
    };

    return (
        <div className="data-mapping-editor">
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                    <DataSourceSelector
                        selectedSource={selectedSource}
                        onSelect={handleSourceSelect}
                    />
                </div>

                <div className="col-span-5">
                    <ColumnMapper
                        mapping={mapping}
                        selectedSource={selectedSource}
                        onUpdate={handleMappingUpdate}
                    />
                </div>

                <div className="col-span-4">
                    <PreviewData data={previewData} />
                </div>
            </div>
        </div>
    );
};