// TableComponents.tsx
// @ts-nocheck
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formFields } from '../formfields';

export const CompanyGeneralTable = ({ data }) => {
    const generalFields = formFields.companyDetails.fields.filter(
        field => !field.category || field.category === 'General Information'
    );
    
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-100">
                    <TableHead className="w-20">#</TableHead>
                    {generalFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                        <TableCell>{index + 1}</TableCell>
                        {generalFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const CompanyTaxTable = ({ data }) => {
    const taxFields = formFields.companyDetails.fields.filter(
        field => field.category === 'KRA Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-sky-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {taxFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-sky-50">
                         <TableCell>{index + 1}</TableCell>
                        {taxFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const DirectorsTable = ({ data }) => {
    const directorFields = formFields.directorDetails.fields;

    // Transform the data to handle both array and object structures
    const directors = Array.isArray(data) 
        ? data 
        : Object.values(data || {}).flatMap(group => group?.directors || []);

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-emerald-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {directorFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {directors.length > 0 ? (
                    directors.map((director, index) => (
                        <TableRow key={index} className="hover:bg-emerald-50">
                            
                            {directorFields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {director[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={directorFields.length} className="text-center py-4">
                            No director data available
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export const ComplianceTable = ({ data }) => {
    const complianceFields = [
        ...formFields.companyDetails.fields.filter(field =>
            field.category === 'NSSF Details' ||
            field.category === 'NHIF Details' ||
            field.category === 'Housing Levy Details' ||
            field.category === 'Standard Levy Details'
        )
    ];

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-violet-100">
                    {complianceFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((company, index) => (
                    <TableRow key={index} className="hover:bg-violet-50">
                        {complianceFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export const NSSFTable = ({ data }) => {
    const nssfFields = formFields.companyDetails.fields.filter(
        field => field.category === 'NSSF Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-emerald-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {nssfFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-emerald-50">
                         <TableCell>{index + 1}</TableCell>
                    
                        {nssfFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {item[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const NHIFTable = ({ data }) => {
    const nhifFields = formFields.companyDetails.fields.filter(
        field => field.category === 'NHIF Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-teal-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {nhifFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-teal-50">
                         <TableCell>{index + 1}</TableCell>
                     
                        {nhifFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {item[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const EmployeesTable = ({ data }) => {
    const employeeFields = formFields.employeeDetails.fields;

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-rose-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {employeeFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((employee, index) => (
                    <TableRow key={index} className="hover:bg-rose-50">
                         <TableCell>{index + 1}</TableCell>
                
                        {employeeFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {employee[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const BankingTable = ({ data }) => {
    const bankFields = formFields.bankDetails.fields;

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-amber-100">
                <TableHead className="w-20">#</TableHead>
                <TableHead>Company Name</TableHead>
                    {bankFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((bank, index) => (
                    <TableRow key={index} className="hover:bg-amber-50">
                         <TableCell>{index + 1}</TableCell>
                         
                        {bankFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {bank[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const PAYETable = ({ data }) => {
    const payeFields = formFields.companyDetails.fields.filter(
        field => field.category === 'PAYE Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-lime-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {payeFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-lime-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {payeFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const VATTable = ({ data }) => {
    const vatFields = formFields.companyDetails.fields.filter(
        field => field.category === 'VAT Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-orange-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {vatFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-orange-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {vatFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const NITATable = ({ data }) => {
    const nitaFields = formFields.companyDetails.fields.filter(
        field => field.category === 'NITA Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-violet-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {nitaFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-violet-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {nitaFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const HousingLevyTable = ({ data }) => {
    const housingFields = formFields.companyDetails.fields.filter(
        field => field.category === 'Housing Levy Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-purple-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {housingFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-purple-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {housingFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const TourismLevyTable = ({ data }) => {
    const tourismFields = formFields.companyDetails.fields.filter(
        field => field.category === 'Tourism Levy Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-rose-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {tourismFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-rose-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {tourismFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const StandardLevyTable = ({ data }) => {
    const standardLevyFields = formFields.companyDetails.fields.filter(
        field => field.category === 'Standard Levy Details'
    );

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-fuchsia-100">
                <TableHead className="w-20">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    {standardLevyFields.map(field => (
                        <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                            {field.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((companyGroup, index) => (
                    <TableRow key={index} className="hover:bg-fuchsia-50">
                         <TableCell>{index + 1}</TableCell>
                        <TableCell>{companyGroup.company.company_name}</TableCell>
                        {standardLevyFields.map(field => (
                            <TableCell key={field.name} className="whitespace-nowrap">
                                {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

    // Add new table components for each category
export const ClientCategoryTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Client Category'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-blue-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-blue-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    // Add new table components for each category
export const SheriaDetailsTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Sheria Details'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-blue-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-blue-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

export const TaxStatusTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'Tax Status'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-orange-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-orange-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

export const ECitizenTable = ({ data }) => {
        const fields = formFields.companyDetails.fields.filter(
            field => field.category === 'E-Citizen Details'
        );

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-indigo-100">
                        <TableHead className="whitespace-nowrap font-semibold">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        {fields.map(field => (
                            <TableHead key={field.name} className="whitespace-nowrap font-semibold">
                                {field.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((companyGroup, index) => (
                        <TableRow key={index} className="hover:bg-indigo-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{companyGroup.company.company_name}</TableCell>
                            {fields.map(field => (
                                <TableCell key={field.name} className="whitespace-nowrap">
                                    {companyGroup.company[field.name] || <span className="text-red-500 font-medium">Missing</span>}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };
