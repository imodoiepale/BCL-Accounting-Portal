// @ts-nocheck
 "use client"

tsxCopy// components/EmailReminderInterface.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const EmailReminderInterface = () => {
  const [reminderText, setReminderText] = useState('');
  const [interval, setInterval] = useState(30);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load initial reminder text from localStorage or set a default
    const savedReminderText = localStorage.getItem('reminderText') || 'Please upload your monthly documents.';
    setReminderText(savedReminderText);
  }, []);

  const handleStartStop = async () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      await sendReminders();
    }
  };

  const sendReminders = async () => {
    if (!isRunning) return;

    try {
      const suppliers = await fetchSuppliers();
      const banks = await fetchBanks();

      for (const supplier of suppliers) {
        await sendEmail(supplier.contact_email, 'Monthly Document Reminder', reminderText);
      }

      for (const bank of banks) {
        await sendEmail(bank.relationship_manager_email, 'Monthly Document Reminder', reminderText);
      }

      console.log('Reminders sent successfully');
    } catch (error) {
      console.error('Error sending reminders:', error);
    }

    // Schedule the next batch of reminders
    setTimeout(sendReminders, interval * 1000);
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .select('contact_email')
      .eq('status', true);
    
    if (error) throw error;
    return data;
  };

  const fetchBanks = async () => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .select('relationship_manager_email')
      .eq('status', true);
    
    if (error) throw error;
    return data;
  };

  const sendEmail = async (to: string, subject: string, html: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html,
        fromName: 'Your Company Name',
        fromEmail: 'noreply@yourcompany.com'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Email Reminder Settings</h2>
      <div className="mb-4">
        <label htmlFor="reminderText" className="block mb-2">Reminder Text:</label>
        <textarea
          id="reminderText"
          value={reminderText}
          onChange={(e) => {
            setReminderText(e.target.value);
            localStorage.setItem('reminderText', e.target.value);
          }}
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="interval" className="block mb-2">Interval (seconds):</label>
        <input
          type="number"
          id="interval"
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
          min="1"
        />
      </div>
      <button
        onClick={handleStartStop}
        className={`px-4 py-2 rounded ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
      >
        {isRunning ? 'Stop Reminders' : 'Start Reminders'}
      </button>
    </div>
  );
};

export default EmailReminderInterface;