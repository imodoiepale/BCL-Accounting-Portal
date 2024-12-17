// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Record {
  id: string;
  [key: string]: any;
}

interface DetailsTabProps {
  selectedMainTab: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DetailsTab({ selectedMainTab }: DetailsTabProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'acc' | 'imm' | 'sheria' | 'audit' | null>(null);
  const [formData, setFormData] = useState<Record | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [selectedMainTab, filterType]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', selectedMainTab);

      if (filterType) {
        query = query.eq('client_type', filterType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : { [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setLoading(true);
      const { error: submitError } = await supabase
        .from('profile_category_table_mapping_2')
        .upsert([formData]);

      if (submitError) throw submitError;
      
      setIsDialogOpen(false);
      fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading records...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex space-x-4 mb-4">
        <Select onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by client type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acc">ACC Clients</SelectItem>
            <SelectItem value="imm">IMM Clients</SelectItem>
            <SelectItem value="sheria">Sheria Clients</SelectItem>
            <SelectItem value="audit">Audit Clients</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add/Edit Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Dynamic form fields based on structure */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <Button onClick={handleSubmit} disabled={loading}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Client Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.name}</TableCell>
              <TableCell>{record.client_type}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(record);
                    setIsDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
