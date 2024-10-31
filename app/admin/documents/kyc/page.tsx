// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTableWithDocuments from "./DataTableWithDocuments"; // Ensure the path is correct
import { supabase } from '@/lib/supabaseClient';

export default function KYCDocuments() {
    const [documents, setDocuments] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState({ kraDocs: [], sheriaDocs: [] });
    const [directorsDocs, setDirectorsDocs] = useState([]);

    useEffect(() => {
        const loadDocuments = async () => {
            const { data, error } = await supabase
                .from('acc_portal_kyc')
                .select('*');

            if (error) {
                console.error('Error fetching documents:', error);
                return;
            }

            setDocuments(data);
            const kraDocs = data.filter(doc => doc.subcategory === 'kra-docs');
            const sheriaDocs = data.filter(doc => doc.subcategory === 'sheria-docs');
            setFilteredDocs({ kraDocs, sheriaDocs });
        };

        const loadDirectorsDocuments = async () => {
            const { data, error } = await supabase
                .from('acc_portal_directors_documents')
                .select('*');

            if (error) {
                console.error('Error fetching directors documents:', error);
                return;
            }

            setDirectorsDocs(data);
        };

        loadDocuments();
        loadDirectorsDocuments();
    }, []);

    return (
        <div className="p-4 w-full">
            <h1 className="text-xl font-bold mb-4">KYC Documents</h1>
            <Tabs defaultValue="company-docs">
                <TabsList className="mb-4">
                    <TabsTrigger value="company-docs">Company Documents</TabsTrigger>
                    <TabsTrigger value="directors-docs">Director Documents</TabsTrigger>
                    <TabsTrigger value="suppliers-docs">Supplier Documents</TabsTrigger>
                    <TabsTrigger value="banks-docs">Bank Documents</TabsTrigger>
                    <TabsTrigger value="employee-docs">Employee Documents</TabsTrigger>
                    <TabsTrigger value="insurance-docs">Insurance Policy Documents</TabsTrigger>
                    <TabsTrigger value="deposits-docs">Deposit Documents</TabsTrigger>
                    <TabsTrigger value="fixed-assets-docs">Fixed Assets Register</TabsTrigger>
                </TabsList>

                <TabsContent value="company-docs">
                    <Tabs defaultValue="kra">
                        <TabsList className="mb-4">
                            <TabsTrigger value="kra">KRA Documents</TabsTrigger>
                            <TabsTrigger value="sheria">Sheria Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="kra">
                            <DataTableWithDocuments category="KRA" showDirectors={false} documents={filteredDocs.kraDocs} />
                        </TabsContent>
                        <TabsContent value="sheria">
                            <DataTableWithDocuments category="Sheria" showDirectors={false} documents={filteredDocs.sheriaDocs} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="directors-docs">
                    <DataTableWithDocuments category="Directors" showDirectors={true} documents={directorsDocs} />
                </TabsContent>

                <TabsContent value="suppliers-docs">
                    <DataTableWithDocuments category="Suppliers" showDirectors={true} documents={[]} />
                </TabsContent>

                <TabsContent value="banks-docs">
                    <DataTableWithDocuments category="Banks" showDirectors={true} documents={[]} />
                </TabsContent>

                <TabsContent value="employee-docs">
                    <DataTableWithDocuments category="Employees" showDirectors={true} documents={[]} />
                </TabsContent>

                <TabsContent value="insurance-docs">
                    <DataTableWithDocuments category="Insurance" showDirectors={false} documents={[]} />
                </TabsContent>

                <TabsContent value="deposits-docs">
                    <DataTableWithDocuments category="Deposits" showDirectors={false} documents={[]} />
                </TabsContent>

                <TabsContent value="fixed-assets-docs">
                    <Tabs defaultValue="computer-equipment">
                        <TabsList className="mb-4">
                            <TabsTrigger value="computer-equipment">Computer & Equipments</TabsTrigger>
                            <TabsTrigger value="furniture-fitting">Furniture Fitting & Equip 12.5%</TabsTrigger>
                            <TabsTrigger value="land-building">Land & Building</TabsTrigger>
                            <TabsTrigger value="plant-equipment">Plant & Equipment - 12.5 %</TabsTrigger>
                            <TabsTrigger value="motor-vehicles">Motor Vehicles - 25 %</TabsTrigger>
                        </TabsList>
                        <TabsContent value="computer-equipment">
                            <DataTableWithDocuments category="Computer Equipment" showDirectors={false} documents={[]} />
                        </TabsContent>
                        <TabsContent value="furniture-fitting">
                            <DataTableWithDocuments category="Furniture Fitting" showDirectors={false} documents={[]} />
                        </TabsContent>
                        <TabsContent value="land-building">
                            <DataTableWithDocuments category="Land Building" showDirectors={false} documents={[]} />
                        </TabsContent>
                        <TabsContent value="plant-equipment">
                            <DataTableWithDocuments category="Plant Equipment" showDirectors={false} documents={[]} />
                        </TabsContent>
                        <TabsContent value="motor-vehicles">
                            <DataTableWithDocuments category="Motor Vehicles" showDirectors={false} documents={[]} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </div>
    );
}