// @ts-nocheck
"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperclipIcon, SendIcon, PlusIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseKey);

const Tickets = () => {
  const { userId } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useUser();  
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    priority: '',
    product_service: ''
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    console.log(userId)
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('acc_portal_tickets')
      .select('*')
      .order('date_submitted', { ascending: false })
      .eq('userid', userId);
    
    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setTickets(data);
    }
  };

  // const handleTicketSelect = (ticket) => {
  //   setSelectedTicket(ticket);
  //   setMessages([
  //     {
  //       id: 1,
  //       sender: 'system',
  //       content: `Ticket #${ticket.id}: ${ticket.subject}`,
  //       timestamp: new Date(ticket.date_submitted).toLocaleString(),
  //     },
  //   ]);
  // };

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    // Fetch messages for this ticket
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data);
    }
  };

  useEffect(() => {
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('public:ticket_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, handleNewMessage)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // const handleSendMessage = () => {
  //   if (newMessage.trim() === '') return;
    
  //   setMessages([
  //     ...messages,
  //     {
  //       id: messages.length + 1,
  //       sender: 'client',
  //       content: newMessage,
  //       timestamp: new Date().toLocaleTimeString(),
  //     },
  //   ]);
  //   setNewMessage('');
  // };

  const handleNewMessage = (payload) => {
    if (payload.new && payload.new.ticket_id === selectedTicket?.id) {
      setMessages(prevMessages => [...prevMessages, payload.new]);
    }
  };

  
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      ticket_id: selectedTicket.id,
      sender_id: userId, 
      content: newMessage,
      is_admin: false
    };

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert([newMsg])
      .select();

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };


  const handleCreateTicket = async (event) => {
    event.preventDefault();
    const { data, error } = await supabase
      .from('acc_portal_tickets')
      .insert([
        { 
          ...newTicket,
          userid: userId ,
          status: 'New'
        }
      ])
      .select();

    if (error) {
      console.error('Error creating ticket:', error);
      alert("Failed to create ticket");
    } else {
      alert("New ticket created");
      setTickets([data[0], ...tickets]);
      setNewTicket({
        subject: '',
        description: '',
        category: '',
        priority: '',
        product_service: ''
      });
    }
  };

  return (
    <div className="flex ">
      <div className="w-1/3 border-r">
        <header className="bg-background border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">My Tickets</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTicket}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">
                      Subject
                    </Label>
                    <Input 
                      id="subject" 
                      className="col-span-3"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select onValueChange={(value) => setNewTicket({...newTicket, priority: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product_service" className="text-right">
                      Product/Service
                    </Label>
                    <Input 
                      id="product_service" 
                      className="col-span-3"
                      value={newTicket.product_service}
                      onChange={(e) => setNewTicket({...newTicket, product_service: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input 
                      id="description" 
                      className="col-span-3"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Create Ticket</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        <Tabs defaultValue="open" className="p-4">
          <TabsList>
            <TabsTrigger value="open">Open Tickets</TabsTrigger>
            <TabsTrigger value="closed">Closed Tickets</TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {tickets
                .filter((ticket) => ticket.status !== 'Closed')
                .map((ticket) => (
                  <Card key={ticket.id} className="mb-4 cursor-pointer" onClick={() => handleTicketSelect(ticket)}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <span>{ticket.subject}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ticket.priority === 'High' ? 'bg-red-500 text-white' :
                          ticket.priority === 'Medium' ? 'bg-yellow-500 text-black' :
                          'bg-green-500 text-white'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>Ticket #{ticket.id}</p>
                      <p>Status: {ticket.status}</p>
                      <p>Category: {ticket.category}</p>
                    </CardContent>
                  </Card>
                ))}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="closed">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {tickets
                .filter((ticket) => ticket.status === 'Closed')
                .map((ticket) => (
                  <Card key={ticket.id} className="mb-4 cursor-pointer" onClick={() => handleTicketSelect(ticket)}>
                    <CardHeader>{ticket.subject}</CardHeader>
                    <CardContent>
                      <p>Ticket #{ticket.id}</p>
                      <p>Priority: {ticket.priority}</p>
                      <p>Category: {ticket.category}</p>
                    </CardContent>
                  </Card>
                ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <div className="w-2/3 flex flex-col h-screen">
        {selectedTicket ? (
          <>
            <header className="bg-background border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Ticket #{selectedTicket.id}: {selectedTicket.subject}</h2>
              <p className="text-sm text-muted-foreground">Status: {selectedTicket.status} | Priority: {selectedTicket.priority} | Category: {selectedTicket.category}</p>
            </header>
            <ScrollArea className="flex-1 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender_id === userId ? 'justify-end' : 'justify-start'
                  } mb-4 items-end`}
                >
                  {message.sender_id !== userId && (
                    <Avatar className="mr-2">
                      <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender_id === userId
                        ? 'bg-blue-500 text-white max-w-xs lg:max-w-md'
                        : 'bg-gray-200 text-gray-800 max-w-xs lg:max-w-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  {message.sender_id === userId && (
                    <Avatar className="ml-2">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName} />
                      <AvatarFallback>{user?.fullName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="border-t p-4 flex items-center gap-2">
              <Input 
                placeholder="Type a message..." 
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button variant="ghost" size="icon">
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage}>
                <SendIcon className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a ticket to view the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;