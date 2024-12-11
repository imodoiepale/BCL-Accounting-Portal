interface DocumentInfo {
    name: string;
    url: string;
  }
  
  export function createDocumentSharingTemplate(
    companyName: string,
    documents: DocumentInfo[],
    customMessage?: string
  ): string {
    const documentsList = documents
      .map((doc, index) => `${index + 1}. ${doc.name}`)
      .join('\n');
  
    return `
  *Document Sharing from ${companyName}*
  
  ${customMessage ? `${customMessage}\n\n` : ''}You have received ${documents.length} document${documents.length !== 1 ? 's' : ''}.
  
  *Documents:*
  ${documentsList}
  
  The documents will be sent in separate messages following this one.
  
  _Note: Document links will expire in 1 hour for security purposes._
  
  Best regards,
  ${companyName} Team
  `.trim();
  }
  
  export function createDocumentErrorTemplate(
    companyName: string,
    errorType: 'expired' | 'unavailable' | 'generic'
  ): string {
    const errorMessages = {
      expired: 'The document links have expired for security reasons.',
      unavailable: 'The requested documents are currently unavailable.',
      generic: 'There was an issue accessing the documents.'
    };
  
    return `
  *Document Access Error - ${companyName}*
  
  ${errorMessages[errorType]}
  
  Please contact us for assistance or request the documents again.
  
  Best regards,
  ${companyName} Team
  `.trim();
  }
  
  export function createDocumentConfirmationTemplate(
    companyName: string,
    documentName: string
  ): string {
    return `
  *Document Received Confirmation*
  
  This message confirms that the following document has been successfully sent:
  📄 ${documentName}
  
  From: ${companyName}
  
  _Please save the document for your records._
  `.trim();
  }