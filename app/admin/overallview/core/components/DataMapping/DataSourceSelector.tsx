// /components/DataMapping/DataSourceSelector.tsx
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchDataSources } from '@/lib/api';
import { DataSource } from '../../core/types';

export const DataSourceSelector: React.FC<{
    selectedSource: DataSource | null;
    onSelect: (source: DataSource) => void;
}> = ({ selectedSource, onSelect }) => {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDataSources();
    }, []);

    const loadDataSources = async () => {
        const availableSources = await fetchDataSources();
        setSources(availableSources);
    };

    const filteredSources = sources.filter(source =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <Input
                    placeholder="Search sources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="space-y-2">
                    {filteredSources.map(source => (
                        <div
                            key={source.id}
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 
                ${selectedSource?.id === source.id ? 'bg-primary/10' : ''}`}
                            onClick={() => onSelect(source)}
                        >
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-gray-500">{source.type}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};