// /components/HelperHeaders.tsx
import { useEffect, useState } from 'react';
import { HelperHeader, CalculationResult } from '../core/types';

export const HelperHeaders: React.FC<{
  config: HelperHeaderConfig[];
  data: any[];
  calculations: Record<string, CalculationResult>;
}> = ({ config, data, calculations }) => {
  const [processedHeaders, setProcessedHeaders] = useState<ProcessedHeader[]>([]);

  useEffect(() => {
    processHelperHeaders();
  }, [config, data, calculations]);

  const processHelperHeaders = () => {
    const processed = config.map(headerConfig => {
      return {
        ...headerConfig,
        value: calculateHeaderValue(headerConfig, data, calculations)
      };
    });

    setProcessedHeaders(processed);
  };

  return (
    <div className="helper-headers">
      {processedHeaders.map(header => (
        <div
          key={header.id}
          className={`helper-header ${header.type} ${header.position}`}
        >
          <span className="header-label">{header.label}</span>
          <span className="header-value">
            {formatHeaderValue(header.value, header.config.format)}
          </span>
        </div>
      ))}
    </div>
  );
};