// @ts-nocheck
import { supabase } from './supabaseClient';

interface ArrayConfig {
  fields?: {
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
    
    // Build a detailed field description including array structures
    const fieldPrompts = document.fields?.map(field => {
      if (field.type === 'array') {
        const subFields = field.arrayConfig?.fields?.map(sf => 
          `${sf.name} (${sf.type})`
        ).join(', ');
        return `${field.name}: array of objects containing [${subFields}]`;
      }
      return `${field.name} (${field.type})`;
    }).join('\n');

    // Create a structured example of the expected output
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
    }, {});

    const fileType = fileUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

    let content = [];
    if (fileType === 'pdf') {
      const pdfResponse = await fetch(fileUrl);
      const pdfData = await pdfResponse.blob();
      content = [
        {
          type: "text",
          text: `Extract the following fields from the PDF document:\n\n${fieldPrompts}\n\n
                Return the results in JSON format with field names as keys.
                For array fields, ensure the data is returned as an array of objects.
                Expected format example: ${JSON.stringify(exampleOutput, null, 2)}`
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
          text: `Extract the following fields from the image:\n\n${fieldPrompts}\n\n
                Return the results in JSON format with field names as keys.
                For array fields, ensure the data is returned as an array of objects.
                Expected format example: ${JSON.stringify(exampleOutput, null, 2)}`
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
            content
          }
        ],
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const json = await response.json();
    const output = json.choices[0].message.content;
    console.log('Raw extraction output:', output);

    const parsedData = parseExtractionResponse(output);
    console.log('Parsed extraction data:', parsedData);

    // Process array fields
    const processedData = { ...parsedData };
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
            processedItem[subField.name] = item[subField.name] || null;
          });
          return processedItem;
        });
      }
    });

    return processedData;
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

    if (uploadUpdate.error) {
      throw uploadUpdate.error;
    }
    if (documentUpdate.error) {
      throw documentUpdate.error;
    }

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

    if (error) {
      throw error;
    }
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw new Error('Failed to generate document URL');
  }
};// Helper function to validate extracted data against field types
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
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const result = await performExtraction(fileUrl, document, apiKey);
      if (validateExtractedData(result, document.fields || [])) {
        return result;
      }
      throw new Error('Validation failed for extracted data');
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  throw new Error(`Extraction failed after ${maxRetries} attempts: ${lastError?.message}`);
};
