import React, { useState, ChangeEvent, FormEvent } from 'react';

interface FilterProps {
  onAddFilter: (filter: FilterState) => void;
}

interface FilterState {
  from: string;
  subject: string;
  unread: boolean;
  important: boolean;
}

const EmailFilter = ({ onAddFilter }: FilterProps) => {
  const [filter, setFilter] = useState<FilterState>({
    from: '',
    subject: '',
    unread: false,
    important: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddFilter(filter);
  };    

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-4">
        <input
          type="text"
          name="from"
          placeholder="From"
          value={filter.from}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={filter.subject}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            name="unread"
            checked={filter.unread}
            onChange={handleChange}
            className="mr-2"
          />
          Unread
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="important"
            checked={filter.important}
            onChange={handleChange}
            className="mr-2"
          />
          Important
        </label>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Filter
        </button>
      </div>
    </form>
  );
};

export default EmailFilter;