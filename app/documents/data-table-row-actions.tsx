// @ts-nocheck
//@ts-ignore
import { useState } from 'react';
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { createClient } from '@supabase/supabase-js';
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuItemSeparator,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { priorities } from './data'; // Assuming this is where priorities data is located
import Link from 'next/link';

const supabaseUrl = "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DataTableRowActionsProps<TData> {
    row: Row<TData>
}

export function DataTableRowActions<TData>({ row, companyId }: DataTableRowActionsProps<TData>) {

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [caseAction, setCaseAction] = useState(row.original.caseAction);

    const handleCloseDialog = () => setIsDialogOpen(false);

    const [documents, setDocuments] = useState(null); // To store fetched documents

    const openDocumentViewer = async () => {
        try {
            const documentIds = await fetchDocumentIds(companyId);
            const documentsData = await fetchDocuments(documentIds);

            // Update the state to store fetched documents
            setDocuments(documentsData);
            setIsDialogOpen(true); // Open the dialog

        } catch (error) {
            console.error('Error fetching documents:', error);
            // Handle errors, e.g., display an error message
        }
    };

    const fetchDocumentIds = async (companyId) => {
        const { data, error } = await supabase
            .from('companies_documents')
            .select('document_id')
            .eq('company_id', companyId);

        if (error) {
            throw error;
        }

        const documentIds = data.map(item => item.document_id);
        console.log('Fetched Document IDs:', documentIds); // Log fetched document IDs
        return documentIds;
    };

    const fetchDocuments = async (documentIds) => {
        const { data, error } = await supabase
            .from('documents')
            .select('document_type, document_path') // Fetch both name and path
            .in('document_id', documentIds);

        if (error) {
            throw error;
        }

        return data.map(item => ({
            name: item.document_type,
            link: constructFullDocumentLink(item.document_path)
        }));
    };


    const constructFullDocumentLink = (relativePath) => {
        const storageBaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/documents/';
        return storageBaseUrl + relativePath;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                        <DotsHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={openDocumentViewer}>View Documents</DropdownMenuItem>
                    <DropdownMenuItem>Ask for Documents</DropdownMenuItem>
                    <DropdownMenuItem>Share Documents</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        Delete
                        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogTitle>Uploaded Documents </DialogTitle>
                    <DialogDescription>
                        Click respective title to view document
                    </DialogDescription>
                    {documents ? (
                        <ul>
                            {documents.map((doc) => (
                                <li key={doc.link}> {/* Or a unique identifier if you have one */}
                                    <Link href={doc.link} passHref legacyBehavior>
                                        <a target="_blank" rel="noopener noreferrer">
                                            {doc.name}
                                        </a>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Loading documents...</p>
                    )}
                    <DialogFooter>
                        <Button onClick={handleCloseDialog}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
