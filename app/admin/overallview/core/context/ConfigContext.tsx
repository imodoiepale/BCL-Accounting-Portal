// /core/context/ConfigContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { TableConfiguration } from '../types';

interface ConfigContextValue {
    config: TableConfiguration;
    updateConfig: (updates: Partial<TableConfiguration>) => Promise<void>;
    reloadConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<{
    children: ReactNode;
    value: ConfigContextValue;
}> = ({ children, value }) => {
    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};