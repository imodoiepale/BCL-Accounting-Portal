import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddLicenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}

export const AddLicenceModal: React.FC<AddLicenceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'renewal',
    validity_days: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('acc_portal_licence')
      .insert([formData])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add licence');
      return;
    }

    toast.success('Licence added successfully');
    onAdd(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add New Licence</DialogTitle>
          <p className="text-sm text-gray-500">Add a new licence to the system. Fill in the required information below.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Licence Name</Label>
              <Input
                placeholder="Enter licence name"
                className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({...formData, document_type: value})}
              >
                <SelectTrigger className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal" className="text-sm">Renewal Document</SelectItem>
                  <SelectItem value="one-off" className="text-sm">One-off Document</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose Renewal for documents that need periodic renewal, One-off for single-time documents.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Validity Period (Days)</Label>
              <Input
                type="number"
                placeholder="Enter number of days"
                className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
                value={formData.validity_days}
                onChange={(e) => setFormData({...formData, validity_days: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                Leave empty for one-off documents or enter days for renewal documents.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Licence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};