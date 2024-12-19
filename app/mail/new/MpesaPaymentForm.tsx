
// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
  phoneNumber: z.string().regex(/^254[0-9]{9}$/, {
    message: "Phone number must be in the format 254XXXXXXXXX",
  }),
  amount: z.coerce
    .number()
    .min(1, { message: "Amount must be at least 1 KES" })
    .max(300000, { message: "Amount must not exceed 300,000 KES" }),
})

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mpesa-stk-bg00.onrender.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'insufficient_balance' | 
                        'cancelled_by_user' | 'timeout' | 'less_than_minimum' | 
                        'more_than_maximum';

interface Transaction {
  id: string;
  status: TransactionStatus;
  amount: number;
  phone_number: string;
  transaction_code?: string;
  transaction_date?: string;
  result_description?: string;
}

function getStatusDetails(status: TransactionStatus) {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        icon: '⏳',
        message: 'Waiting for your confirmation on the M-Pesa prompt...'
      };
    case 'completed':
      return {
        color: 'bg-green-50',
        textColor: 'text-green-700',
        icon: '✅',
        message: 'Payment completed successfully'
      };
    case 'insufficient_balance':
      return {
        color: 'bg-red-50',
        textColor: 'text-red-700',
        icon: '❌',
        message: 'Transaction failed due to insufficient balance'
      };
    case 'cancelled_by_user':
      return {
        color: 'bg-gray-50',
        textColor: 'text-gray-700',
        icon: '🚫',
        message: 'Transaction was cancelled by the user'
      };
    case 'timeout':
      return {
        color: 'bg-orange-50',
        textColor: 'text-orange-700',
        icon: '⌛',
        message: 'Transaction timed out. Please try again'
      };
    case 'less_than_minimum':
      return {
        color: 'bg-red-50',
        textColor: 'text-red-700',
        icon: '⚠️',
        message: 'Amount is less than the minimum allowed'
      };
    case 'more_than_maximum':
      return {
        color: 'bg-red-50',
        textColor: 'text-red-700',
        icon: '⚠️',
        message: 'Amount exceeds the maximum allowed'
      };
    default:
      return {
        color: 'bg-red-50',
        textColor: 'text-red-700',
        icon: '❌',
        message: 'Transaction failed'
      };
  }
}

function TransactionStatusCard({ transaction }: { transaction: Transaction }) {
  const statusDetails = getStatusDetails(transaction.status);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className={`p-4 rounded-lg ${statusDetails.color} border border-${statusDetails.color.replace('bg-', '')}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{statusDetails.icon}</span>
            <h3 className="font-semibold">Transaction Status</h3>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-600">Amount: {transaction.amount} KES</p>
            <p className="text-sm text-gray-600">Phone: {transaction.phone_number}</p>
            {transaction.transaction_code && (
              <p className="text-sm text-gray-600 font-medium">
                Transaction Code: {transaction.transaction_code}
              </p>
            )}
            {transaction.transaction_date && (
              <p className="text-sm text-gray-600">
                Date: {new Date(transaction.transaction_date).toLocaleString()}
              </p>
            )}
            <p className={`text-sm font-medium ${statusDetails.textColor}`}>
              Status: {transaction.status.charAt(0).toUpperCase() + 
                      transaction.status.slice(1).replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-gray-600">
              {statusDetails.message}
            </p>
            {transaction.result_description && (
              <p className="text-sm text-gray-600 italic">
                {transaction.result_description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MpesaPaymentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      amount: "",
    },
  })

  useEffect(() => {
    if (currentTransaction?.id) {
      const checkStatus = async () => {
        setIsChecking(true);
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', currentTransaction.id)
            .single();

          if (data && !error) {
            setCurrentTransaction(data);
            
            if (data.status !== 'pending') {
              if (data.status === 'completed') {
                toast({
                  title: "Payment Successful",
                  description: `Payment completed with transaction code: ${data.transaction_code}`,
                });
              } else {
                toast({
                  title: "Payment Status",
                  description: data.result_description || getStatusDetails(data.status).message,
                  variant: data.status === 'completed' ? 'default' : 'destructive',
                });
              }
              return true; // Status finalized
            }
          }
          return false; // Status still pending
        } catch (error) {
          console.error('Error checking transaction status:', error);
          return false;
        } finally {
          setIsChecking(false);
        }
      };

      // Initial check
      checkStatus();

      // Set up polling
      const pollInterval = setInterval(async () => {
        const isFinalized = await checkStatus();
        if (isFinalized) {
          clearInterval(pollInterval);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [currentTransaction?.id, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentTransaction({
          id: data.data.transaction_id,
          status: 'pending',
          amount: Number(values.amount),
          phone_number: values.phoneNumber,
        })
        
        toast({
          title: "Payment Initiated",
          description: `A payment request of ${values.amount} KES has been sent to ${values.phoneNumber}. Please check your phone to complete the transaction.`,
        })
        form.reset()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to initiate payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">M-Pesa Payment</h1>
        <p className="text-gray-600">Enter your details to make a payment</p>
      </div>

      {currentTransaction && (
        <TransactionStatusCard transaction={currentTransaction} />
      )}

      {isChecking && (
        <div className="text-center text-sm text-gray-500 mb-4">
          <Loader2 className="animate-spin inline-block mr-2" size={16} />
          Checking transaction status...
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>M-Pesa Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="254XXXXXXXXX" {...field} />
                </FormControl>
                <FormDescription>
                  Enter your M-Pesa registered phone number starting with 254.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Enter the amount you wish to pay in Kenyan Shillings.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            disabled={isSubmitting || isChecking}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Pay with M-Pesa"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}