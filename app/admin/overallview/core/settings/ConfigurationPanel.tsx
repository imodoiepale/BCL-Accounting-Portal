// /settings/ConfigurationPanel.tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StructureEditor } from './StructureEditor';
import { CalculationEditor } from './CalculationEditor';
import { HelperHeaderEditor } from './HelperHeaderEditor';
import { DisplayEditor } from './DisplayEditor';
import { useTableConfiguration } from '../hooks/useTableConfiguration';

export const ConfigurationPanel: React.FC = () => {
    const { config, loading, loadConfiguration } = useTableConfiguration('advanced-table-config');
    const [activeTab, setActiveTab] = useState('structure');

    const handleConfigUpdate = async (section: keyof TableConfiguration, updates: any) => {
        try {
            // Update logic here
        } catch (error) {
            console.error('Error updating configuration:', error);
        }
    };

    if (loading) return <div>Loading configuration...</div>;

    return (
        <div className="configuration-panel">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                    <TabsTrigger value="calculations">Calculations</TabsTrigger>
                    <TabsTrigger value="helper-headers">Helper Headers</TabsTrigger>
                    <TabsTrigger value="display">Display</TabsTrigger>
                </TabsList>

                <TabsContent value="structure">
                    <StructureEditor
                        structure={config.structure}
                        onUpdate={(updates) => handleConfigUpdate('structure', updates)}
                    />
                </TabsContent>

                <TabsContent value="calculations">
                    <CalculationEditor
                        calculations={config.calculations}
                        structure={config.structure}
                        onUpdate={(updates) => handleConfigUpdate('calculations', updates)}
                    />
                </TabsContent>

                <TabsContent value="helper-headers">
                    <HelperHeaderEditor
                        headers={config.helperHeaders}
                        onUpdate={(updates) => handleConfigUpdate('helperHeaders', updates)}
                    />
                </TabsContent>

                <TabsContent value="display">
                    <DisplayEditor
                        display={config.display}
                        onUpdate={(updates) => handleConfigUpdate('display', updates)}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};