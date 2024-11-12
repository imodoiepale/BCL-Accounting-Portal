// /settings/DisplayEditor.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { DisplayConfig } from '../core/types';

export const DisplayEditor: React.FC<{
    display: DisplayConfig;
    onUpdate: (updates: Partial<DisplayConfig>) => void;
}> = ({ display, onUpdate }) => {
    return (
        <div className="display-editor">
            <Tabs defaultValue="layout">
                <TabsList>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="responsive">Responsive</TabsTrigger>
                </TabsList>

                <TabsContent value="layout">
                    <LayoutSettings
                        layout={display.layout}
                        onUpdate={(updates) =>
                            onUpdate({ layout: { ...display.layout, ...updates } })
                        }
                    />
                </TabsContent>

                <TabsContent value="theme">
                    <ThemeSettings
                        theme={display.theme}
                        onUpdate={(updates) =>
                            onUpdate({ theme: { ...display.theme, ...updates } })
                        }
                    />
                </TabsContent>

                <TabsContent value="behavior">
                    <BehaviorSettings
                        behavior={display.behavior}
                        onUpdate={(updates) =>
                            onUpdate({ behavior: { ...display.behavior, ...updates } })
                        }
                    />
                </TabsContent>

                <TabsContent value="responsive">
                    <ResponsiveSettings
                        responsive={display.responsive}
                        onUpdate={(updates) =>
                            onUpdate({ responsive: { ...display.responsive, ...updates } })
                        }
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const LayoutSettings: React.FC<{
    layout: LayoutConfig;
    onUpdate: (updates: Partial<LayoutConfig>) => void;
}> = ({ layout, onUpdate }) => {
    return (
        <div className="layout-settings">
            <div className="form-group">
                <label>Sticky Header</label>
                <Switch
                    checked={layout.stickyHeader}
                    onCheckedChange={(checked) => onUpdate({ stickyHeader: checked })}
                />
            </div>

            <div className="form-group">
                <label>Maximum Height</label>
                <Input
                    value={layout.maxHeight}
                    onChange={(e) => onUpdate({ maxHeight: e.target.value })}
                    placeholder="e.g., 500px"
                />
            </div>

            <div className="form-group">
                <label>Dense Mode</label>
                <Switch
                    checked={layout.dense}
                    onCheckedChange={(checked) => onUpdate({ dense: checked })}
                />
            </div>
        </div>
    );
};