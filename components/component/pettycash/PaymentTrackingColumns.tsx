// @ts-nocheck


import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Eye } from 'lucide-react';

export const paymentTrackingColumns = [
    {
        header: 'Total Amount',
        width: '120px',
        cell: (entry: any) => formatCurrency(entry.amount),
        alwaysVisible: true
    },
    {
        header: 'Paid Amount',
        width: '120px',
        cell: (entry: any) => formatCurrency(entry.paid_amount || 0),
        alwaysVisible: true
    },
    {
        header: 'Balance',
        width: '120px',
        cell: (entry: any) => formatCurrency((entry.amount || 0) - (entry.paid_amount || 0)),
        alwaysVisible: true
    },
    {
        header: 'Last Payment',
        width: '120px',
        cell: (entry: any) => entry.last_payment_date ?
            format(new Date(entry.last_payment_date), 'dd/MM/yyyy') : '-',
        toggleable: true
    },
    {
        header: 'Next Due',
        width: '120px',
        cell: (entry: any) => entry.next_payment_date ?
            format(new Date(entry.next_payment_date), 'dd/MM/yyyy') : '-',
        toggleable: true
    },
    {
        header: 'Status',
        width: '120px',
        cell: (entry: any) => {
            const balance = (entry.amount || 0) - (entry.paid_amount || 0);
            const status = balance <= 0 ? 'Paid' :
                entry.paid_amount > 0 ? 'Partial' : 'Pending';
            const colors = {
                'Paid': 'bg-green-100 text-green-800',
                'Partial': 'bg-yellow-100 text-yellow-800',
                'Pending': 'bg-red-100 text-red-800'
            };
            return (
                <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
                    {status}
                </span>
            );
        },
        alwaysVisible: true
    },
    {
        header: 'Payments',
        width: '100px',
        cell: (entry: any) => (
            <Button
                className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                onClick={() => entry.onViewPayments(entry)}
            >
                <Eye size={12} /> View
            </Button>
        ),
        alwaysVisible: true
    }
];