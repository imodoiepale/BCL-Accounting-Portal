import React, { useState } from 'react';

interface FilterCriteria {
  from: string;
  subject: string;
  unread: boolean;
  important: boolean;
}

interface Filter {
  name: string;
  criteria: FilterCriteria;
}

interface FilterManagerProps {
  filters: Filter[];
  onAddFilter: (filter: Filter) => void;
  onEditFilter: (filterName: string) => void;
  onRemoveFilter: (filterName: string) => void;
  onClose: () => void;
}

const FilterManager = ({ filters, onAddFilter, onEditFilter, onRemoveFilter, onClose }: FilterManagerProps) => {
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterCriteria, setNewFilterCriteria] = useState<FilterCriteria>({ from: '', subject: '', unread: false, important: false });

  const handleAddFilter = () => {
    if (newFilterName) {
      onAddFilter({ name: newFilterName, criteria: newFilterCriteria });
      setNewFilterName('');
      setNewFilterCriteria({ from: '', subject: '', unread: false, important: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 float-right">Close</button>
        <h2 className="text-xl font-bold mb-4">Manage Filters</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter Name"
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="From"
            value={newFilterCriteria.from}
            onChange={(e) => setNewFilterCriteria({ ...newFilterCriteria, from: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Subject"
            value={newFilterCriteria.subject}
            onChange={(e) => setNewFilterCriteria({ ...newFilterCriteria, subject: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={newFilterCriteria.unread}
              onChange={(e) => setNewFilterCriteria({ ...newFilterCriteria, unread: e.target.checked })}
              className="mr-2"
            />
            Unread
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={newFilterCriteria.important}
              onChange={(e) => setNewFilterCriteria({ ...newFilterCriteria, important: e.target.checked })}
              className="mr-2"
            />
            Important
          </label>
          <button onClick={handleAddFilter} className="bg-blue-500 text-white px-4 py-2 rounded">Add Filter</button>
        </div>
        <div>
          {filters.map((filter) => (
            <div key={filter.name} className="flex items-center justify-between mb-2">
              <span>{filter.name}</span>
              <div>
                <button onClick={() => onEditFilter(filter.name)} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                <button onClick={() => onRemoveFilter(filter.name)} className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterManager;