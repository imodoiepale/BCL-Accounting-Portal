//@ts-nocheck
"use client"
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from './data-table';
import { Pencil, Trash2, Info, Upload, MessageSquare, CheckCircle, Star } from "lucide-react";
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient'


export default function TicketSystem() {
  const { user } = useUser();

  const [tickets, setTickets] = useState([]);
  const [editFormFields, setEditFormFields] = useState(null);
  const [formFields, setFormFields] = useState({
    subject: '',
    description: '',
    category: '',
    priority: '',
    product_service: '',
    status: 'New',
    attachments: [],
    communication_history: [],
    resolution: '',
    satisfaction_rating: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_tickets')
        .select('*')
        .eq('userid', user?.id)
        .order('id', { ascending: true });

      if (error) throw error;
      const formattedTickets = data.map(ticket => ({
        ...ticket,
        date_submitted: new Date(ticket.date_submitted).toLocaleDateString(),
        time_submitted: new Date(ticket.date_submitted).toLocaleTimeString()
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleFieldChange = (e) => {
    const { id, value } = e.target;
    setFormFields(prevFields => ({
      ...prevFields,
      [id]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const now = new Date();
      const newTicket = {
        ...formFields,
        date_submitted: now.toISOString(),
        userid: user?.id, 
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from('acc_portal_tickets')
          .update(newTicket)
          .eq('id', editingTicketId)
          .select();

        if (error) throw error;

        if (data) {
          const updatedTickets = tickets.map(ticket => 
            ticket.id === editingTicketId ? {
              ...data[0],
              date_submitted: now.toLocaleDateString(),
              time_submitted: now.toLocaleTimeString(),
              userid: user?.id,
            } : ticket
          );
          setTickets(updatedTickets);
          setIsEditing(false);
          setEditingTicketId(null);
        }
      } else {
        const { data, error } = await supabase
          .from('acc_portal_tickets')
          .insert([newTicket])
          .select();

        if (error) throw error;

        if (data) {
          const formattedNewTicket = {
            ...data[0],
            date_submitted: now.toLocaleDateString(),
            time_submitted: now.toLocaleTimeString()
          };
          setTickets([formattedNewTicket, ...tickets]);
        }
      }

      alert(isEditing ? 'Ticket updated successfully!' : 'Ticket submitted successfully!');
      setFormFields({
        subject: '',
        description: '',
        category: '',
        priority: '',
        product_service: '',
        status: 'New',
        attachments: [],
        communication_history: [],
        resolution: '',
        satisfaction_rating: null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting/updating ticket:', error);
      alert('Error submitting/updating ticket.');
    }
  };

  const handleEdit = (ticket) => {
    setIsEditing(true);
    setEditingTicketId(ticket.id);
    setEditFormFields(ticket);
    setFormFields({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      product_service: ticket.product_service,
      status: ticket.status,
      attachments: ticket.attachments || [],
      communication_history: ticket.communication_history || [],
      resolution: ticket.resolution || '',
      satisfaction_rating: ticket.satisfaction_rating || null,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        const { error } = await supabase
          .from('acc_portal_tickets')
          .delete()
          .eq('id', id)
          .eq('userid', user?.id);
  
        if (error) throw error;
  
        setTickets(tickets.filter(ticket => ticket.id !== id));
        alert('Ticket deleted successfully!');
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('Error deleting ticket. Please try again.');
      }
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormFields(prevFields => ({
      ...prevFields,
      attachments: [...prevFields.attachments, ...files]
    }));
  };

  const ticketColumns = [
    { accessorKey: "id", header: "Ticket ID" },
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "priority", header: "Priority" },  
    { accessorKey: "product_service", header: "Product/Service" },
    { accessorKey: "date_submitted", header: "Date Submitted" },
    { accessorKey: "time_submitted", header: "Time Submitted" },
    { accessorKey: "status", header: "Status" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Link href={`/communication/${row.original.id}`} passHref>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
  
  return (
    <main className="p-6 bg-white dark:bg-gray-800">
      <h1 className="text-2xl font-bold mb-4">Ticket System</h1>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">Create New Ticket</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="subject">Subject</label>
              <Input id="subject" value={formFields.subject} onChange={handleFieldChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description">Description</label>
              <Textarea id="description" value={formFields.description} onChange={handleFieldChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category">Category</label>
              <Select id="category" value={formFields.category} onValueChange={(value) => setFormFields(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="product">Product Inquiry</SelectItem>
                  <SelectItem value="feedback">General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="priority">Priority</label>
              <Select id="priority" value={formFields.priority} onValueChange={(value) => setFormFields(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="product_service">Product/Service</label>
              <Select id="product_service" value={formFields.product_service} onValueChange={(value) => setFormFields(prev => ({ ...prev, product_service: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select product/service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product1">Product 1</SelectItem>
                  <SelectItem value="product2">Product 2</SelectItem>
                  <SelectItem value="service1">Service 1</SelectItem>
                  <SelectItem value="service2">Service 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="attachments">Attachments</label>
              <Input id="attachments" type="file" multiple onChange={handleFileUpload} className="col-span-3" />
            </div>
            {isEditing && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="status">Status</label>
                  <Select id="status" value={formFields.status} onValueChange={(value) => setFormFields(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Awaiting Your Response">Awaiting Your Response</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="resolution">Resolution</label>
                  <Textarea id="resolution" value={formFields.resolution} onChange={handleFieldChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="satisfaction_rating">Satisfaction Rating</label>
                  <Select id="satisfaction_rating" value={formFields.satisfaction_rating} onValueChange={(value) => setFormFields(prev => ({ ...prev, satisfaction_rating: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>{isEditing ? 'Update Ticket' : 'Submit Ticket'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable 
        columns={ticketColumns} 
        data={tickets}
      />
    </main>
  );
}