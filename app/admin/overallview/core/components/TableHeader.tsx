
// /components/TableHeader.tsx
import { TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Section, Category, SubCategory } from '../core/types';

export const TableHeader: React.FC<{
    structure: TableStructure;
    onSort?: (columnId: string) => void;
}> = ({ structure, onSort }) => {
    return (
        <TableHead>
            <TableRow className="section-row">
                {structure.sections.map(section => (
                    <SectionHeader
                        key={section.id}
                        section={section}
                        categories={structure.categories}
                    />
                ))}
            </TableRow>

            <TableRow className="category-row">
                {structure.categories.map(category => (
                    <CategoryHeader
                        key={category.id}
                        category={category}
                        subCategories={structure.subCategories}
                    />
                ))}
            </TableRow>

            <TableRow className="column-row">
                {structure.columns.map(column => (
                    <ColumnHeader
                        key={column.id}
                        column={column}
                        onSort={onSort}
                    />
                ))}
            </TableRow>
        </TableHead>
    );
};