import { useState } from 'react';
import { toast } from 'react-hot-toast';
import settings from '../settings.json';

export interface FilterCriteria {
  type: 'from' | 'to' | 'subject' | 'unread' | 'important' | 'bodyContent';
  value: string | boolean;
}

export interface Filter {
  name: string;
  criteria: FilterCriteria[];
}

export const useGmailFilters = () => {
  const [filters, setFilters] = useState<Filter[]>(settings.defaultFilters);
  const [selectedFilter, setSelectedFilter] = useState<string>(filters[0].name);

  const addFilter = (newFilter: Filter) => {
    setFilters((prev) => [...prev, newFilter]);
    setSelectedFilter(newFilter.name);
    toast.success('Filter added successfully');
  };

  const editFilter = (oldName: string, newFilter: Filter) => {
    setFilters((prev) => prev.map(filter =>
      filter.name === oldName ? newFilter : filter
    ));
    setSelectedFilter(newFilter.name);
    toast.success('Filter updated successfully');
  };

  const removeFilter = (filterName: string) => {
    setFilters((prev) => prev.filter(filter => filter.name !== filterName));
    setSelectedFilter(filters[0]?.name || 'All');
    toast.success('Filter removed successfully');
  };

  const resetFilters = () => {
    setFilters(settings.defaultFilters);
    setSelectedFilter(settings.defaultFilters[0].name);
  };

  const applyFilters = (messages: any[]) => {
    const activeFilter = filters.find(filter => filter.name === selectedFilter);
    if (!activeFilter) return messages;

    return messages.filter((message) => {
      return activeFilter.criteria.every((criterion) => {
        const getHeader = (name: string) => {
          return message.payload.headers.find((header: any) => header.name === name)?.value || '';
        };

        switch (criterion.type) {
          case 'from':
            return getHeader('From').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'to':
            return getHeader('To').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'subject':
            return getHeader('Subject').toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'bodyContent':
            return message.snippet.toLowerCase().includes(criterion.value.toString().toLowerCase());
          case 'unread':
            return criterion.value ? message.labelIds.includes('UNREAD') : true;
          case 'important':
            return criterion.value ? message.labelIds.includes('IMPORTANT') : true;
          default:
            return true;
        }
      });
    });
  };

  return {
    filters,
    selectedFilter,
    setSelectedFilter,
    addFilter,
    editFilter,
    removeFilter,
    resetFilters,
    applyFilters
  };
};
