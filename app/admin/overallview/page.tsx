// OverallView.tsx

// @ts-nocheck
"use client";
import React, { useEffect, useState, useCallback, useReducer } from 'react';
import { formFields } from './formfields';
import { supabase } from '@/lib/supabaseClient';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyTaxTable, DirectorsTable, ComplianceTable, NSSFTable, NHIFTable, EmployeesTable, BankingTable, PAYETable, VATTable, NITATable, HousingLevyTable, TourismLevyTable, StandardLevyTable, ClientCategoryTable, SheriaDetailsTable, ECitizenTable, TaxStatusTable, CompanyGeneralTable } from './components/tableComponents';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from "sonner";
import { useTableFunctionalities, CompanyEditDialog } from './components/functionalities'
import { Search, Filter, X } from 'lucide-react';
import { groupFieldsByCategory, groupDataByCategory, calculateFieldStats, handleExport, handleFileImport, calculateTotalFields, calculatePendingFields, calculateCompletedFields } from './components/utility';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SettingsDialog } from './components/overview/Dialogs/settingsDialog';
import { MissingFieldsDialog, getMissingFields } from './components/missingFieldsDialog';
import { Input } from "@/components/ui/input";
import { EditableCell } from './components/overview/EditableCell';
import { ImportDialog } from './components/overview/Dialogs/ImportDialog';
import { renderSeparatorCell, Table, TableComponents } from './components/overview/TableComponents';
// Types
interface TableStructure {
    section: string;
    fields: Field[];
    subsections: SubSection[];
    columnMappings: Record<string, string>;
    tableNames: string[];
}

interface SubSection {
    subsection: string;
    fields: Field[];
    columnMappings: Record<string, string>;
    tableNames: string[];
}

interface Field {
    name: string;
    label: string;
    table?: string;
    category?: string;
    reference?: string;
}

interface State {
    mainTabs: string[];
    mainSections: Record<string, string[]>;  // Object with arrays
    mainSubsections: Record<string, string[]>;
    formFields: Record<string, any>;
    data: any[];
    loading: boolean;
}

const initialState: State = {
    mainTabs: [],
    mainSections: {},  // Initialize as empty object
    mainSubsections: {},
    formFields: {},
    data: [],
    loading: true
};

// Reducer
function reducer(state: State, action: any): State {
    switch (action.type) {
        case 'SET_MAIN_TABS':
            return { ...state, mainTabs: action.payload };
        case 'SET_MAIN_SECTIONS':
            return { ...state, mainSections: action.payload };
        case 'SET_MAIN_SUBSECTIONS':
            return { ...state, mainSubsections: action.payload };
        case 'SET_FORM_FIELDS':
            return { ...state, formFields: action.payload };
        case 'SET_DATA':
            return { ...state, data: action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
}

// Utilities
const safeJSONParse = (jsonString: string, defaultValue = {}) => {
    try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch {
        return defaultValue;
    }
};

// Generate Reference Numbers
function generateReferenceNumbers(sections) {
    let sectionCounter = 1;

    return sections.map(section => {
        if (section.isSeparator) return section;
        if (section.name === 'index') return section;

        const sectionRef = `${sectionCounter}`;

        if (section.categorizedFields) {
            let categoryCounter = 1;

            const processedCategories = section.categorizedFields.map(category => {
                if (category.isSeparator) return category;

                const categoryRef = `${sectionRef}.${categoryCounter}`;
                categoryCounter++;

                let fieldCounter = 1;
                const processedFields = category.fields.map(field => {
                    const fieldRef = `${categoryRef}.${fieldCounter}`;
                    fieldCounter++;

                    return {
                        ...field,
                        reference: fieldRef
                    };
                });

                return {
                    ...category,
                    reference: categoryRef,
                    fields: processedFields
                };
            });

            if (section.name !== 'index') sectionCounter++;
            return {
                ...section,
                reference: sectionRef,
                categorizedFields: processedCategories
            };
        }

        if (section.name !== 'index') sectionCounter++;
        return section;
    });
}

// Table Component
const DynamicTable = React.memo(({ data, structure, onRowClick }) => {
    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Index</TableHead>
                        {structure.fields.map(field => (
                            <TableHead key={field.name}>
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((item, index) => (
                        <TableRow
                            key={item.company.id}
                            onClick={() => onRowClick(item.company)}
                            className="hover:bg-gray-50 cursor-pointer"
                        >
                            <TableCell>{index + 1}</TableCell>
                            {structure.fields.map(field => (
                                <TableCell key={field.name}>
                                    {item.company[field.name]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </table>
        </div>
    );
});

DynamicTable.displayName = 'DynamicTable';
// Main Component
const OverallView: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMissingFields, setSelectedMissingFields] = useState(null);
    const [isMissingFieldsOpen, setIsMissingFieldsOpen] = useState(false);

    const fetchAllData = async () => {
        try {
            const [
                { data: companies, error: companiesError },
                { data: users, error: usersError },
                { data: directors, error: directorsError },
                { data: nssfData, error: nssfError },
                { data: nhifData, error: nhifError },
                { data: passwordCheckers, error: passwordCheckersError },
                { data: ecitizenData, error: ecitizenError },
                { data: etimsData, error: etimsError },
                { data: accPortalDirectors, error: accPortalDirectorsError }
            ] = await Promise.all([
                supabase.from('acc_portal_company_duplicate').select('*').order('id', { ascending: true }),
                supabase.from('acc_portal_clerk_users_duplicate').select('*'),
                supabase.from('acc_portal_directors_duplicate').select('*'),
                supabase.from('nssf_companies_duplicate').select('*'),
                supabase.from('nhif_companies_duplicate2').select('*'),
                supabase.from('PasswordChecker_duplicate').select('*'),
                supabase.from('ecitizen_companies_duplicate').select('*'),
                supabase.from('etims_companies_duplicate').select('*'),
                supabase.from('acc_portal_directors_duplicate').select('*')
            ]);

            // Error Handling
            if (companiesError || usersError || directorsError || nssfError || nhifError ||
                passwordCheckersError || ecitizenError || etimsError || accPortalDirectorsError) {
                throw new Error('Failed to fetch data from one or more tables');
            }

            // Process and combine data
            const groupedData = companies.map(company => {
                const user = users.find(u => u.userid === company.userid);
                const companyDirectors = directors.filter(d => d.company_name === company.company_name);
                const nssfInfo = nssfData.find(n => n.company_name === company.company_name);
                const nhifInfo = nhifData.find(n => n.company_name === company.company_name);
                const passwordCheckerInfo = passwordCheckers.find(p => p.company_name === company.company_name);
                const ecitizenInfo = ecitizenData.find(e => e.name === company.company_name);
                const etimsInfo = etimsData.find(e => e.company_name === company.company_name);
                const accPortalDirectorInfo = accPortalDirectors.filter(d => d.company_id === company.id);

                return {
                    company: {
                        ...company,
                        ...user?.metadata,
                        ...nssfInfo,
                        ...nhifInfo,
                        ...passwordCheckerInfo,
                        ...etimsInfo,
                        ...ecitizenInfo,
                    },
                    directors: accPortalDirectorInfo,
                    rows: [{
                        ...company,
                        ...user?.metadata,
                        ...nssfInfo,
                        ...nhifInfo,
                        ...passwordCheckerInfo,
                        ...ecitizenInfo,
                        ...etimsInfo,
                        isFirstRow: true
                    }],
                    rowSpan: 1
                };
            });

            dispatch({ type: 'SET_DATA', payload: groupedData });
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        }
    };

    const fetchStructure = async () => {
        try {
            const { data: mappings, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .order('Tabs', { ascending: true });

            if (error) throw error;
            if (!mappings) {
                console.error('No mappings found');
                return;
            }

            // Process the structure with null checks
            const tabs = [...new Set(mappings.map(m => m.Tabs || ''))].filter(Boolean);
            const sections = {};
            const subsections = {};
            const formFields = {};

            mappings.forEach(mapping => {
                const sectionsData = safeJSONParse(mapping.sections_sections);
                const subsectionsData = safeJSONParse(mapping.sections_subsections);
                const columnMappings = safeJSONParse(mapping.column_mappings);

                if (mapping.Tabs) {
                    if (!sections[mapping.Tabs]) {
                        sections[mapping.Tabs] = [];
                    }

                    Object.keys(sectionsData || {}).forEach(section => {
                        if (!sections[mapping.Tabs].includes(section)) {
                            sections[mapping.Tabs].push(section);
                        }

                        if (subsectionsData?.[section]) {
                            if (!subsections[section]) {
                                subsections[section] = [];
                            }

                            const subs = Array.isArray(subsectionsData[section])
                                ? subsectionsData[section]
                                : [subsectionsData[section]];

                            subsections[section] = [...new Set([...subsections[section], ...subs])];

                            // Process form fields
                            subs.forEach(subsection => {
                                if (!formFields[subsection]) {
                                    formFields[subsection] = [];
                                }

                                Object.entries(columnMappings || {}).forEach(([key, label]) => {
                                    formFields[subsection].push({
                                        name: key.split('.')[1] || key,
                                        label: label || key,
                                        table: key.split('.')[0] || '',
                                        category: subsection
                                    });
                                });
                            });
                        }
                    });
                }
            });

            // Update state
            dispatch({ type: 'SET_MAIN_TABS', payload: tabs });
            dispatch({ type: 'SET_MAIN_SECTIONS', payload: sections });
            dispatch({ type: 'SET_MAIN_SUBSECTIONS', payload: subsections });
            dispatch({ type: 'SET_FORM_FIELDS', payload: formFields });

        } catch (error) {
            console.error('Error fetching structure:', error);
            toast.error('Failed to fetch structure');
        }
    };

    // Effects
    useEffect(() => {
        fetchAllData();
        fetchStructure();

        const handleRefresh = () => fetchAllData();
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
    }, []);

    // Event Handlers
    const handleCompanyClick = useCallback((company) => {
        setSelectedCompany(company);
        setIsEditDialogOpen(true);
    }, []);

    const handleEditSave = useCallback((updatedData) => {
        dispatch({
            type: 'SET_DATA',
            payload: state.data.map(item =>
                item.company.id === updatedData.id
                    ? { ...item, company: updatedData }
                    : item
            )
        });
        setIsEditDialogOpen(false);
    }, [state.data]);

    const handleExport = useCallback(() => {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(
                state.data.map(item => item.company)
            );
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
            XLSX.writeFile(workbook, 'companies_export.xlsx');
        } catch (error) {
            toast.error('Export failed');
        }
    }, [state.data]);

    // Calculations
    const calculateMissingFields = useCallback((row) => {
        const fields = Object.keys(row).filter(key =>
            key !== 'index' &&
            key !== 'isFirstRow' &&
            key !== 'rowSpan' &&
            !key.startsWith('data.')
        );

        const totalFields = fields.length;
        const completedFields = fields.filter(field =>
            row[field] !== null && row[field] !== ''
        ).length;
        const missingFields = totalFields - completedFields;

        return { totalFields, completedFields, missingFields };
    }, []);

    // Component Rendering
    if (state.loading) {
        return <div>Loading...</div>;
    }
    return (
        <div className="container mx-auto py-6">
            {/* Header Actions */}
            <div className="flex gap-4 mb-6">
                <SettingsDialog
                    mainTabs={state.mainTabs}
                    mainSections={state.mainSections}
                    mainSubsections={state.mainSubsections}
                    onStructureChange={fetchStructure}
                />

                <Button
                    onClick={() => setIsImportDialogOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Upload className="h-4 w-4" />
                    Import
                </Button>

                <Button
                    onClick={handleExport}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Main Tabs Structure */}
            <Tabs defaultValue={state.mainTabs[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-10 bg-gray-100 rounded-lg p-1">
                    {state.mainTabs.map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition-colors"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {state.mainTabs.map(tab => (
                    <TabsContent key={tab} value={tab} className="mt-4">
                        {Array.isArray(state.mainSections[tab]) && state.mainSections[tab].map(section => {
                            // Ensure subsections exist
                            const subsections = state.mainSubsections[section] || [];

                            return subsections.map(subsection => {
                                // Safely get fields
                                const fields = getSubsectionFields(state.formFields, subsection);

                                return (
                                    <Card key={`${section}-${subsection}`} className="mb-8">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold">
                                                    {subsection || 'Untitled Section'}
                                                </h3>

                                                {/* Missing Fields Counter */}
                                                {state.data[0]?.rows[0] && (
                                                    <div className="flex gap-2 text-sm">
                                                        {calculateMissingFields(state.data[0].rows[0]).missingFields > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedMissingFields({
                                                                        section,
                                                                        subsection,
                                                                        fields: getMissingFields(state.data)
                                                                    });
                                                                    setIsMissingFieldsOpen(true);
                                                                }}
                                                            >
                                                                View Missing Fields
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <ScrollArea className="rounded-lg border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-14">Index</TableHead>
                                                            {fields.map(field => (
                                                                <TableHead key={field.name}>
                                                                    {field.label || field.name}
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {state.data.map((item, index) => (
                                                            <TableRow
                                                                key={`${item.company?.id || index}`}
                                                                className="cursor-pointer hover:bg-gray-50"
                                                                onClick={() => handleCompanyClick(item.company)}
                                                            >
                                                                <TableCell>{index + 1}</TableCell>
                                                                {fields.map(field => (
                                                                    <TableCell key={field.name}>
                                                                        <EditableCell
                                                                            value={item.company?.[field.name] ?? ''}
                                                                            field={field}
                                                                            row={item}
                                                                            onEdit={handleEditSave}
                                                                        />
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                <ScrollBar orientation="horizontal" />
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                );
                            });
                        })}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <div className="grid gap-4">
                        <h2 className="text-lg font-semibold">Edit Company Details</h2>
                        {selectedCompany && (
                            <div className="grid gap-4">
                                {Object.entries(selectedCompany).map(([key, value]) => (
                                    <div key={key} className="grid gap-2">
                                        <label className="text-sm font-medium">{key}</label>
                                        <input
                                            type="text"
                                            value={value as string}
                                            onChange={(e) => {
                                                setSelectedCompany({
                                                    ...selectedCompany,
                                                    [key]: e.target.value
                                                });
                                            }}
                                            className="p-2 border rounded-md"
                                        />
                                    </div>
                                ))}
                                <Button onClick={() => handleEditSave(selectedCompany)}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent>
                    <ImportDialog
                        onImport={(data) => {
                            dispatch({ type: 'SET_DATA', payload: data });
                            setIsImportDialogOpen(false);
                        }}
                        onClose={() => setIsImportDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isMissingFieldsOpen} onOpenChange={setIsMissingFieldsOpen}>
                <DialogContent>
                    <MissingFieldsDialog
                        data={selectedMissingFields}
                        onClose={() => setIsMissingFieldsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OverallView;