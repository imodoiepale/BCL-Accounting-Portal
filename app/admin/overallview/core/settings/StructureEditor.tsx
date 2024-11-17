// /settings/StructureEditor.tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableStructure, Section } from '../types';

export const StructureEditor: React.FC<{
    structure: TableStructure;
    onUpdate: (updates: Partial<TableStructure>) => void;
}> = ({ structure, onUpdate }) => {
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const newSections = Array.from(structure.sections);
        const [removed] = newSections.splice(source.index, 1);
        newSections.splice(destination.index, 0, removed);

        onUpdate({ ...structure, sections: newSections });
    };

    const addSection = () => {
        const newSection: Section = {
            id: generateId(),
            name: 'New Section',
            order: structure.sections.length,
            categories: []
        };

        onUpdate({
            ...structure,
            sections: [...structure.sections, newSection]
        });
    };

    return (
        <div className="structure-editor">
            <div className="toolbar">
                <Button onClick={addSection}>Add Section</Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections" type="SECTION">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="sections-container">
                            {structure.sections.map((section, index) => (
                                <SectionItem
                                    key={section.id}
                                    section={section}
                                    index={index}
                                    structure={structure}
                                    onUpdate={onUpdate}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

const SectionItem: React.FC<{
    section: Section;
    index: number;
    structure: TableStructure;
    onUpdate: (updates: Partial<TableStructure>) => void;
}> = ({ section, index, structure, onUpdate }) => {
    const updateSection = (updates: Partial<Section>) => {
        const newSections = structure.sections.map(s =>
            s.id === section.id ? { ...s, ...updates } : s
        );

        onUpdate({
            ...structure,
            sections: newSections
        });
    };

    return (
        <Draggable draggableId={section.id} index={index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} className="section-item">
                    <div className="section-header" {...provided.dragHandleProps}>
                        <Input
                            value={section.name}
                            onChange={(e) => updateSection({ name: e.target.value })}
                            className="section-name-input"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSection({ expanded: !section.expanded })}
                        >
                            {section.expanded ? 'Collapse' : 'Expand'}
                        </Button>
                    </div>

                    {section.expanded && (
                        <CategoryList
                            sectionId={section.id}
                            categories={structure.categories.filter(c => c.sectionId === section.id)}
                            structure={structure}
                            onUpdate={onUpdate}
                        />
                    )}
                </div>
            )}
        </Draggable>
    );
};