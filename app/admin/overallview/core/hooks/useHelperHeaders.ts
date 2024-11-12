// /core/hooks/useHelperHeaders.ts
import { useAtom } from 'jotai';
import { helperHeadersAtom } from '../store/tableStore';
import { HelperHeader, HelperHeaderConfig } from '../types';

export const useHelperHeaders = (config: HelperHeaderConfig[]) => {
    const [headers, setHeaders] = useAtom(helperHeadersAtom);

    const processHeaders = async () => {
        const processedHeaders: Record<string, HelperHeader> = {};

        for (const headerConfig of config) {
            try {
                const processed = await processHelperHeader(headerConfig);
                processedHeaders[headerConfig.id] = processed;
            } catch (error) {
                console.error(`Error processing helper header ${headerConfig.id}:`, error);
            }
        }

        setHeaders(processedHeaders);
    };

    return {
        headers,
        processHeaders
    };
};