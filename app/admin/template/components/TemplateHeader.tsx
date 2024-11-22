import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TemplateHeaderProps {
    isEditing: boolean
    templateName: string
    version: number
    onSave: () => void
    onReset: () => void
}

export function TemplateHeader({ 
    isEditing,
    templateName,
    version,
    onSave,
    onReset
}: TemplateHeaderProps) {
    return (
        <div className="flex justify-between items-center p-4 border-b bg-white">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold">
                    {templateName || 'New Template'}
                </h1>
                {version > 0 && (
                    <Badge variant="secondary">
                        v{version}
                    </Badge>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    onClick={onReset}
                >
                    Reset
                </Button>
                <Button
                    onClick={onSave}
                >
                    {isEditing ? 'Update Template' : 'Save Template'}
                </Button>
            </div>
        </div>
    )
}