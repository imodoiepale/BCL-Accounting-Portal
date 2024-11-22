import { useEffect, useState } from 'react'
import { MoreVertical, Pencil, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  
import { supabase } from '@/lib/supabaseClient'

interface Template {
    id: string
    name: string
    description: string
    created_at: string
    version: number
    status: string
}

interface TemplateSidebarProps {
    onTemplateSelect: (templateId: string) => void
    selectedTemplateId: string | null
    onNewTemplate: () => void
    onDeleteTemplate: (templateId: string) => Promise<void>
}

export function TemplateSidebar({ 
    onTemplateSelect, 
    selectedTemplateId,
    onNewTemplate,
    onDeleteTemplate 
}: TemplateSidebarProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('id, name, description, created_at, version, status')
                .eq('status', 'active')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error loading templates:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="w-80 border-r h-screen bg-white flex flex-col">
        <div className="p-4 border-b">
            <Button 
                className="w-full"
                onClick={onNewTemplate}
            >
                Create New Template
            </Button>
        </div>
        
        <div className="p-4 border-b">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search templates..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

                
                <ScrollArea className="h-[calc(100vh-130px)]">
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="p-4 text-center">Loading templates...</div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No templates found
                            </div>
                        ) : (
                            filteredTemplates.map((template) => (
                                <Card
                                key={template.id}
                                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedTemplateId === template.id 
                                        ? 'border-primary ring-2 ring-primary/20' 
                                        : ''
                                }`}
                            >
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div 
                                            className="flex-1"
                                            onClick={() => onTemplateSelect(template.id)}
                                        >
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                            <CardDescription className="text-sm line-clamp-2">
                                                {template.description}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onTemplateSelect(template.id)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this template?')) {
                                                            onDeleteTemplate(template.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                            </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        
    )
}