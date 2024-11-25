// src/lib/extractionUtils.ts

import { supabase } from './supabaseClient';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Document {
  id: string;
  name: string;
  fields?: Field[];
}

interface ExtractionResult {
  [key: string]: string | number | null;
}

const formatExtractedValue = (value: any, fieldType: string): any => {
  if (!value) return null;

  switch (fieldType) {
    case 'date':
      try {
        // Try to parse and format the date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        return null;
      } catch {
        return null;
      }
    case 'number':
      // Extract numbers from string and convert to float
      const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
      return isNaN(num) ? null : num;
    default:
      return value.toString().trim();
  }
};

const parseExtractionResponse = (output: string): Record<string, any> => {
  try {
    // First try to parse as JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If not JSON, try to parse line by line
    const parsedData: Record<string, any> = {};
    const lines = output.split('\n');
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        if (value) {
          parsedData[key.trim()] = value;
        }
      }
    });
    return parsedData;
  } catch (error) {
    console.error('Error parsing extraction response:', error);
    throw new Error('Failed to parse extraction response');
  }
};

export const performExtraction = async (
  fileUrl: string,
  document: Document,
  apiKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpamVwYWxlQGdtYWlsLmNvbSIsImlhdCI6MTczMTUxNDExMX0.DZf2t6fUGiVQN6FXCwLOnRG2Yx48aok1vIH00sKhWS4'
): Promise<ExtractionResult> => {
  try {
    const url = 'https://api.hyperbolic.xyz/v1/chat/completions';
    const fieldPrompt = document.fields?.map(f => f.name).join(', ');
    const fileType = fileUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

    let content = [];
    if (fileType === 'pdf') {
      const pdfResponse = await fetch(fileUrl);
      const pdfData = await pdfResponse.blob();
      content = [
        {
          type: "text",
          text: `Extract the following fields from the PDF document: ${fieldPrompt}. 
                 Return the results in JSON format with field names as keys.`
        },
        {
          type: "file",
          file: pdfData
        }
      ];
    } else {
      content = [
        {
          type: "text",
          text: `Extract the following fields from the image: ${fieldPrompt}.
                 Return the results in JSON format with field names as keys.`
        },
        {
          type: "image_url",
          image_url: { url: fileUrl }
        }
      ];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2-VL-72B-Instruct',
        messages: [
          {
            role: 'system',
            content: `You are an advanced document analysis assistant. Extract information accurately and return it in JSON format.
                     For each field, ensure the value matches the expected type (text, number, or date).
                     If a field is not found or unclear, return null for that field.`
          },
          {
            role: 'user',
            content
          }
        ],
        max_tokens: 512,
        temperature: 0.1,
        top_p: 0.01,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const json = await response.json();
    const output = json.choices[0].message.content;
    const parsedData = parseExtractionResponse(output);

    // Map and format the extracted data according to field types
    const mappedData: ExtractionResult = {};
    document.fields?.forEach(field => {
      const extractedValue = parsedData[field.name];
      mappedData[field.name] = formatExtractedValue(extractedValue, field.type);
    });

    return mappedData;
  } catch (error) {
    console.error('Extraction error:', error);
    throw new Error('Failed to extract document details');
  }
};

export const saveExtractedData = async (
  uploadId: string,
  documentId: string,
  extractedData: ExtractionResult
) => {
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

// Helper function to validate extracted data against field types
export const validateExtractedData = (
  extractedData: ExtractionResult,
  fields: Field[]
): boolean => {
  try {
    for (const field of fields) {
      const value = extractedData[field.name];
      if (value === null) continue;

      switch (field.type) {
        case 'date':
          if (value && isNaN(Date.parse(value.toString()))) {
            return false;
          }
          break;
        case 'number':
          if (value && isNaN(Number(value))) {
            return false;
          }
          break;
      }
    }
    return true;
  } catch {
    return false;
  }
};

// Helper function to clean extracted data
export const cleanExtractedData = (
  extractedData: ExtractionResult,
  fields: Field[]
): ExtractionResult => {
  const cleanData: ExtractionResult = {};
  fields.forEach(field => {
    const value = extractedData[field.name];
    cleanData[field.name] = formatExtractedValue(value, field.type);
  });
  return cleanData;
};

// Helper function to retry extraction with different strategies
export const retryExtraction = async (
  fileUrl: string,
  document: Document,
  apiKey: string,
  maxRetries: number = 3
): Promise<ExtractionResult> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await performExtraction(fileUrl, document, apiKey);
      if (validateExtractedData(result, document.fields || [])) {
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError || new Error('Failed to extract data after multiple attempts');
};