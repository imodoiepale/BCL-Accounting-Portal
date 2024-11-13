// components/AdvancedTable/TableHeader.tsx
import { TableHead, TableRow, TableCell } from '@/components/ui/table';

export const TableHeader: React.FC<{
    structure: TableStructure;
}> = ({ structure }) => {
    return (
        <TableHead>
            {/* Section Row */}
            <TableRow>
                {structure.sections.map(section => (
                    <TableCell
                        key={section.id}
                        colSpan={calculateSectionSpan(section, structure)}
                    >
                        {section.name}
                    </TableCell>
                ))}
            </TableRow>

            {/* Category Row */}
            <TableRow>
                {structure.categories.map(category => (
                    <TableCell
                        key={category.id}
                        colSpan={calculateCategorySpan(category, structure)}
                    >
                        {category.name}
                    </TableCell>
                ))}
            </TableRow>

            {/* Column Headers Row */}
            <TableRow>
                {structure.columns.map(column => (
                    <TableCell key={column.id}>
                        {column.name}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

// Helper functions for calculating spans
const calculateSectionSpan = (section: Section, structure: TableStructure) => {
    return section.categories.reduce((total, categoryId) => {
        const category = structure.categories.find(c => c.id === categoryId);
        return total + calculateCategorySpan(category!, structure);
    }, 0);
};

const calculateCategorySpan = (category: Category, structure: TableStructure) => {
    return category.subCategories.reduce((total, subCategoryId) => {
        const subCategory = structure.subCategories.find(sc => sc.id === subCategoryId);
        return total + subCategory!.columns.length;
    }, 0);
};