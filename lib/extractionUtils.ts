// @ts-nocheck

import { supabase } from './supabaseClient';

// Types
interface ArrayConfig {
  fields?: {
    id: string;
    name: string;
    type: string;
  }[];
}

interface Field {
  id: string;
  name: string;
  type: string;
  arrayConfig?: ArrayConfig;
}

interface Document {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  fields?: Field[];
}

interface ExtractionResult {
  [key: string]: any;
}

interface ConversionResponse {
  success: boolean;
  message: string;
  image_base64?: string;
  mime_type?: string;
  width?: number;
  height?: number;
  processed_at?: string;
}

interface ExtractedField {
  name: string;
  value: any;
  confidence?: number;
}

// Constants
const CONVERSION_SERVICE_URL = 'https://document-converter-tgxf.onrender.com';
const EXTRACTION_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpamVwYWxlQGdtYWlsLmNvbSIsImlhdCI6MTczMTUxNDExMX0.DZf2t6fUGiVQN6FXCwLOnRG2Yx48aok1vIH00sKhWS4';
const MAX_RETRIES = 3;
const EXTRACTION_TIMEOUT = 60000; // 60 seconds
const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp'];

// Utility Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isImageFile = (filepath: string): boolean => {
  if (!filepath) return false;
  const extension = filepath.split('.').pop()?.toLowerCase();
  return SUPPORTED_IMAGE_TYPES.includes(extension || '');
};

const formatExtractedValue = (value: any, fieldType: string): any => {
  if (value === null || value === undefined) return null;

  switch (fieldType) {
    case 'date':
      try {
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
      } catch {
        return null;
      }
    
    case 'number':
      const num = typeof value === 'string' ? 
        parseFloat(value.replace(/[^\d.-]/g, '')) : 
        parseFloat(String(value));
      return isNaN(num) ? null : num;
    
    case 'array':
      return Array.isArray(value) ? value : [];
    
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lowered = value.toLowerCase().trim();
        if (['true', 'yes', '1'].includes(lowered)) return true;
        if (['false', 'no', '0'].includes(lowered)) return false;
      }
      return null;
    
    default:
      return String(value).trim();
  }
};

async function convertToImage(fileUrl: string): Promise<string> {
  try {
    console.log('Converting document to image:', fileUrl);
    
    const response = await fetch(`${CONVERSION_SERVICE_URL}/convert-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: fileUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Document conversion failed');
    }

    const result: ConversionResponse = await response.json();
    if (!result.success || !result.image_base64) {
      throw new Error(result.message || 'Invalid conversion response');
    }

    console.log('Document successfully converted to image');
    return `data:${result.mime_type || 'image/png'};base64,${result.image_base64}`;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

const validateExtractedData = (
  extractedData: ExtractionResult,
  fields: Field[]
): boolean => {
  try {
    for (const field of fields) {
      const value = extractedData[field.name];
      if (value === null) continue;

      switch (field.type) {
        case 'date':
          if (value && isNaN(Date.parse(String(value)))) {
            console.warn(`Invalid date value for field ${field.name}:`, value);
            return false;
          }
          break;

        case 'number':
          if (value && isNaN(Number(value))) {
            console.warn(`Invalid number value for field ${field.name}:`, value);
            return false;
          }
          break;

        case 'array':
          if (value && !Array.isArray(value)) {
            console.warn(`Invalid array value for field ${field.name}:`, value);
            return false;
          }
          if (field.arrayConfig?.fields && Array.isArray(value)) {
            for (const item of value) {
              for (const subField of field.arrayConfig.fields) {
                const subValue = item[subField.name];
                if (subValue !== null && subValue !== undefined) {
                  const formattedValue = formatExtractedValue(subValue, subField.type);
                  if (formattedValue === null && subValue !== null) {
                    console.warn(`Invalid array item value for field ${field.name}.${subField.name}:`, subValue);
                    return false;
                  }
                }
              }
            }
          }
          break;
      }
    }
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};

export const performExtraction = async (
  fileUrl: string,
  document: Document,
  onProgress?: (message: string) => void
): Promise<ExtractionResult> => {
  try {
    onProgress?.('Preparing document for extraction...');

    // Convert document to image if it's not already an image
    const imageUrl = isImageFile(fileUrl) ? fileUrl : await convertToImage(fileUrl);
    
    onProgress?.('Extracting information from document...');

    // Build field descriptions for the AI
    const fieldPrompts = document.fields?.map(field => {
      if (field.type === 'array') {
        const subFields = field.arrayConfig?.fields?.map(sf => 
          `${sf.name} (${sf.type})`
        ).join(', ');
        return `${field.name}: array of objects containing [${subFields}]`;
      }
      return `${field.name} (${field.type})`;
    }).join('\n');

    // Create example output structure
    const exampleOutput = document.fields?.reduce((acc, field) => {
      if (field.type === 'array') {
        acc[field.name] = [{
          ...field.arrayConfig?.fields?.reduce((subAcc, subField) => {
            subAcc[subField.name] = `example_${subField.type}`;
            return subAcc;
          }, {})
        }];
      } else {
        acc[field.name] = `example_${field.type}`;
      }
      return acc;
    }, {} as Record<string, any>);

    // Make extraction API request
    const response = await fetch('https://api.hyperbolic.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXTRACTION_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2-VL-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: `You are an advanced document analysis assistant specialized in structured data extraction.
                     Extract information accurately and return it in JSON format.
                     For array fields, always return an array of objects with specified sub-fields.
                     If a field is not found or unclear, use null for that field.
                     For array fields, return an empty array if no items are found.`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `Extract the following fields from the image:\n\n${fieldPrompts}\n\n
                      Return the results in JSON format with field names as keys.
                      For array fields, ensure the data is returned as an array of objects.
                      Expected format example: ${JSON.stringify(exampleOutput, null, 2)}`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Extraction API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    const extractedData = parseExtractionResponse(result.choices[0].message.content);

    onProgress?.('Processing extracted data...');

    // Process and validate the extracted data
    const processedData = { ...extractedData };
    document.fields?.forEach(field => {
      if (field.type === 'array') {
        if (!Array.isArray(processedData[field.name])) {
          try {
            processedData[field.name] = JSON.parse(processedData[field.name]);
          } catch {
            processedData[field.name] = [];
          }
        }
        processedData[field.name] = processedData[field.name].map(item => {
          const processedItem = {};
          field.arrayConfig?.fields?.forEach(subField => {
            processedItem[subField.name] = formatExtractedValue(
              item[subField.name],
              subField.type
            );
          });
          return processedItem;
        });
      } else {
        processedData[field.name] = formatExtractedValue(
          processedData[field.name],
          field.type
        );
      }
    });

    // Validate the processed data
    if (!validateExtractedData(processedData, document.fields || [])) {
      throw new Error('Extracted data validation failed');
    }

    return processedData;
  } catch (error) {
    console.error('Extraction error:', error);
    throw error instanceof Error ? error : new Error('Failed to extract document details');
  }
};

// Save Extracted Data
export const saveExtractedData = async (
  uploadId: string,
  documentId: string,
  extractedData: ExtractionResult
): Promise<{ upload: any; document: any }> => {
  try {
    const [uploadUpdate, documentUpdate] = await Promise.all([
      supabase
        .from('acc_portal_kyc_uploads')
        .update({ extracted_details: extractedData })
        .eq('id', uploadId)
        .select()
        .single(),

      supabase
        .from('acc_portal_kyc')
        .update({ last_extracted_details: extractedData })
        .eq('id', documentId)
        .select()
        .single()
    ]);

    if (uploadUpdate.error) throw uploadUpdate.error;
    if (documentUpdate.error) throw documentUpdate.error;

    return {
      upload: uploadUpdate.data,
      document: documentUpdate.data
    };
  } catch (error) {
    console.error('Error saving extracted data:', error);
    throw new Error('Failed to save extracted data');
  }
};

// Retry Extraction
export const retryExtraction = async (
  fileUrl: string,
  document: Document,
  maxRetries: number = MAX_RETRIES,
  onProgress?: (message: string) => void
): Promise<ExtractionResult> => {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      onProgress?.(`Attempt ${attempt + 1} of ${maxRetries}...`);
      const result = await performExtraction(fileUrl, document, onProgress);
      
      if (validateExtractedData(result, document.fields || [])) {
        return result;
      }
      
      throw new Error('Validation failed for extracted data');
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt - 1) * 1000;
        onProgress?.(`Retrying in ${backoffTime/1000} seconds...`);
        await delay(backoffTime);
      }
    }
  }

  throw new Error(`Extraction failed after ${maxRetries} attempts: ${lastError?.message}`);
};

// Get Signed URL
export const getSignedUrl = async (filepath: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .storage
      .from('kyc-documents')
      .createSignedUrl(filepath, 60);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw new Error('Failed to generate document URL');
  }
};


const extractionUtils = {
  performExtraction,
  saveExtractedData,
  retryExtraction,
  getSignedUrl,
  isImageFile,
};

export default extractionUtils;
