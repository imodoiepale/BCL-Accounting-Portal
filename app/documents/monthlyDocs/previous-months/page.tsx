//@ts-nocheck
"use client"
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import MonthlyDocs from '../page';

interface MonthlyDocsProps {
  selectedMonth: string;
  isCurrentMonth: boolean;
}

const PreviousMonths = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const generateMonths = useCallback(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      currentDate.setMonth(currentDate.getMonth() - 1);
      months.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  }, []);

  const months = useMemo(() => generateMonths(), [generateMonths]);

  const handleMonthSelect = useCallback((month: string) => {
    setSelectedMonth(month);
  }, []);

  return (
    <div className="flex">
      <div className="w-1/8 p-4 border-r">
        <h2 className="text-xl font-bold mb-4 text-center">Months</h2>
        <div className="space-y-2 ">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              onClick={() => handleMonthSelect(month)}
              className="w-full "
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-7/8 p-4">
        {selectedMonth ? (
          <MonthlyDocs selectedMonth={selectedMonth} isCurrentMonth={false} />
        ) : (
          <p>Please select a month to view supplier statements.</p>
        )}
      </div>
    </div>
  );
};

export default PreviousMonths;