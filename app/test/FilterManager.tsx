import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FilterCriteria {
  type: 'from' | 'to' | 'subject' | 'unread' | 'important' | 'bodyContent';
  value: string | boolean;
}

interface Filter {
  name: string;
  criteria: FilterCriteria[];
}

interface FilterManagerProps {
  filters: Filter[];
  onAddFilter: (filter: Filter) => void;
  onEditFilter: (filterName: string) => void;
  onRemoveFilter: (filterName: string) => void;
  onClose: () => void;
}

const FILTER_TYPES = [
  { id: 'from', label: 'From Address', type: 'text' },
  { id: 'to', label: 'To Address', type: 'text' },
  { id: 'subject', label: 'Subject', type: 'text' },
  { id: 'bodyContent', label: 'Body Content', type: 'text' },
  { id: 'unread', label: 'Unread Status', type: 'boolean' },
  { id: 'important', label: 'Important Status', type: 'boolean' }
] as const;

type FilterStep = 'name' | 'type' | 'value';

const FilterManager: React.FC<FilterManagerProps> = ({ 
  filters, 
  onAddFilter, 
  onEditFilter, 
  onRemoveFilter, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState<FilterStep>('name');
  const [newFilterName, setNewFilterName] = useState('');
  const [selectedType, setSelectedType] = useState<typeof FILTER_TYPES[number] | null>(null);
  const [filterValue, setFilterValue] = useState<string | boolean>('');
  const [currentCriteria, setCurrentCriteria] = useState<FilterCriteria[]>([]);
  const [error, setError] = useState<string>('');

  const resetForm = () => {
    setCurrentStep('name');
    setNewFilterName('');
    setSelectedType(null);
    setFilterValue('');
    setCurrentCriteria([]);
    setError('');
  };

  const handleAddCriteria = () => {
    if (!selectedType) return;

    const newCriteria: FilterCriteria = {
      type: selectedType.id,
      value: filterValue
    };

    setCurrentCriteria([...currentCriteria, newCriteria]);
    setSelectedType(null);
    setFilterValue('');
    setCurrentStep('type');
  };

  const handleAddFilter = () => {
    if (currentCriteria.length === 0) {
      setError('Please add at least one criteria');
      return;
    }

    onAddFilter({
      name: newFilterName,
      criteria: currentCriteria
    });
    resetForm();
  };

  const handleRemoveCriteria = (index: number) => {
    setCurrentCriteria(currentCriteria.filter((_, i) => i !== index));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="space-y-4">
            <label className="block">
              <span className="text-gray-700">Filter Name</span>
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                placeholder="Enter filter name"
              />
            </label>
            <button
              onClick={() => {
                if (!newFilterName.trim()) {
                  setError('Please enter a filter name');
                  return;
                }
                if (filters.some(f => f.name === newFilterName)) {
                  setError('Filter name already exists');
                  return;
                }
                setError('');
                setCurrentStep('type');
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 'type':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {FILTER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type);
                    setCurrentStep('value');
                  }}
                  className={`p-2 rounded border ${
                    selectedType?.id === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {currentCriteria.length > 0 && (
              <button
                onClick={handleAddFilter}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Finish Filter
              </button>
            )}
          </div>
        );

      case 'value':
        return (
          <div className="space-y-4">
            <label className="block">
              <span className="text-gray-700">{selectedType?.label} Value</span>
              {selectedType?.type === 'boolean' ? (
                <select
                  value={filterValue.toString()}
                  onChange={(e) => setFilterValue(e.target.value === 'true')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={filterValue.toString()}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  placeholder={`Enter ${selectedType?.label.toLowerCase()}`}
                />
              )}
            </label>
            <button
              onClick={() => {
                if (!filterValue && selectedType?.type !== 'boolean') {
                  setError('Please enter a value');
                  return;
                }
                handleAddCriteria();
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Add Criteria
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Manage Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {currentCriteria.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Current Criteria:</h3>
              <div className="space-y-2">
                {currentCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>
                      {FILTER_TYPES.find(t => t.id === criteria.type)?.label}: {criteria.value.toString()}
                    </span>
                    <button
                      onClick={() => handleRemoveCriteria(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderStep()}

          <div className="mt-6">
            <h3 className="font-medium mb-2">Existing Filters:</h3>
            <div className="space-y-2">
              {filters.map((filter) => (
                <div key={filter.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{filter.name}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => onEditFilter(filter.name)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveFilter(filter.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterManager;