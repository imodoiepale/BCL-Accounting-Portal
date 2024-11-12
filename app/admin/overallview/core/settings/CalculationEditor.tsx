// /settings/CalculationEditor.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalculationRule } from '../types';

export const CalculationEditor: React.FC<{
    calculations: Record<string, CalculationRule>;
    structure: TableStructure;
    onUpdate: (updates: Record<string, CalculationRule>) => void;
}> = ({ calculations, structure, onUpdate }) => {
    const [selectedCalc, setSelectedCalc] = useState<string | null>(null);

    const addCalculation = () => {
        const newCalc: CalculationRule = {
            id: generateId(),
            type: 'sum',
            formula: '',
            dependencies: [],
            conditions: []
        };

        onUpdate({
            ...calculations,
            [newCalc.id]: newCalc
        });
        setSelectedCalc(newCalc.id);
    };

    const updateCalculation = (id: string, updates: Partial<CalculationRule>) => {
        onUpdate({
            ...calculations,
            [id]: {
                ...calculations[id],
                ...updates
            }
        });
    };

    return (
        <div className="calculation-editor">
            <div className="toolbar">
                <Button onClick={addCalculation}>Add Calculation</Button>
            </div>

            <div className="calculations-list">
                {Object.entries(calculations).map(([id, calc]) => (
                    <div
                        key={id}
                        className={`calculation-item ${selectedCalc === id ? 'selected' : ''}`}
                        onClick={() => setSelectedCalc(id)}
                    >
                        <span className="calc-name">{calc.name || 'Unnamed Calculation'}</span>
                        <span className="calc-type">{calc.type}</span>
                    </div>
                ))}
            </div>

            {selectedCalc && (
                <CalculationForm
                    calculation={calculations[selectedCalc]}
                    structure={structure}
                    onUpdate={(updates) => updateCalculation(selectedCalc, updates)}
                />
            )}
        </div>
    );
};