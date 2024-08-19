import { toast } from "sonner";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import moment from 'moment';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setStatus: React.Dispatch<React.SetStateAction<string>>,
    companyName: string,
    documentName: string,
    companyId: number // Add companyId parameter here
) => {
    const file = e.target.files?.[0];
    if (file) {
        const fileName = file.name;
        const fileExtension = fileName.split(".").pop() || "";
        try {
            const filePath = await uploadFileToCompanyFolder(
                { data: file, name: fileName },
                companyName
            );
            const documentId = await insertDocumentRecord(
                fileName,
                documentName,
                file.size,
                fileExtension,
                filePath
            );
            setStatus("true");
            await updateCompanyDocumentsTable(
                companyId,
                documentId,
                documentName.toLowerCase()
            );
            showToast(fileName, companyName, documentName, setStatus);
            console.log("File path:", companyId);
        } catch (err) {
            console.error("Error uploading file:", err);
        }
    }
};


const showToast = (
    fileName: string,
    companyName: string,
    documentName: string,
    setStatusCallback: React.Dispatch<React.SetStateAction<string>>
) => {
    toast(`${fileName} uploaded successfully`, {
        description: `${documentName} for ${companyName}`,
        action: {
            label: "Undo",
            onClick: () => {
                setStatusCallback("false");
                console.log("Undo action triggered");
            },
        },
    });
};

async function uploadFileToCompanyFolder(
    file: { name: any; data: any },
    companyName: string
) {
    const companyFolderName = companyName.toLowerCase();
    const fileName = file.name;
    const fileData = file.data;
    const currentDate = moment(); // Get current date

    const year = currentDate.format('YYYY'); // Get current year
    const month = currentDate.format('MMMM'); // Get current month name

    const filePath = `${companyFolderName}/monthlydocs/${year}/${month}/${fileName}`;

    try {
        const { data, error } = await supabase.storage
            .from("documents")
            .upload(filePath, fileData, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Error uploading file:", error);
            throw error;
        }

        console.log("File uploaded successfully:", data.path);
        return data.path; // Return the file path
    } catch (err) {
        console.error("Error uploading file:", err);
        throw err;
    }
}

async function insertDocumentRecord(
    fileName: string,
    documentType: string,
    fileSize: number,
    fileExtension: string,
    filePath: string
) {
    const { data, error } = await supabase
        .from("documents")
        .insert([
            {
                document_name: fileName,
                document_type: documentType,
                document_size: fileSize,
                document_extension: fileExtension,
                document_path: filePath,
            },
        ])
        .select('document_id');

    if (error) {
        console.error("Error inserting document record:", error);
        throw error;
    }

    console.log("Document record inserted successfully:", data);
    return data[0].document_id;
}



async function updateCompanyDocumentsTable(


    companyId: number,
    documentId: number,
    documentType: string
) {

    console.log("companyId (inside updateCompanyDocumentsTable):", companyId);

    const formattedDocumentType = documentType.toLowerCase().replace(/ /g, "_");

    const { data, error } = await supabase
        .from("companies_documents")
        .insert([
            {
                company_id: companyId,
                document_id: documentId,
                [formattedDocumentType]: true,
            },
        ])
        .single();

    if (!companyId) {
        console.error("Error: companyId is null or undefined");
        return; // Or handle the error more gracefully
    }

    console.log("companies_documents table updated successfully:", data);
}


export async function checkFileExists(
    companyId: number,
    documentType: string
): Promise<boolean> {
    const formattedDocumentType = documentType.toLowerCase().replace(/ /g, "_");

    try {
        const { data, error } = await supabase
            .from("companies_documents")
            .select("id")
            .eq("company_id", companyId)
            .eq(formattedDocumentType, true)
            .limit(1); // Limit to fetch only one record

        if (error) {
            console.error("Error fetching document status:", error);
            return false; // Assuming 'false' as default on error
        }

        return data.length > 0; // True if a record is found
    } catch (error) {
        console.error("Error in checkFileExists:", error);
        return false;
    }
}


async function deleteDocument(documentId: number) {
    try {
        const { data, error } = await supabase
            .from('documents')
            .delete()
            .eq('document_id', documentId);

        if (error) {
            console.error('Error deleting document:', error);
            throw error;
        }

        console.log('Document deleted successfully:', data);
        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        return false;
    }
}

export const handleDocumentUpdateOrDelete = async (companyId: number, documentId: number) => {
    try {
        // Log the company ID and document ID before deletion
        console.log('Deleting document:', documentId, 'for company:', companyId);

        // Call the deleteDocument function with the document ID
        const deleted = await deleteDocument(documentId);

        if (deleted) {
            console.log('Document deleted successfully');
            // You can perform further actions if needed
        } else {
            console.error('Failed to delete document');
            // Handle the case where the document couldn't be deleted
        }
    } catch (error) {
        console.error('Error handling document update or delete:', error);
    }
};
