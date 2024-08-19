//@ts-nocheck
"use client"
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { BankStatementsClient} from '../bank-table/MonthlyDocsBanks';

const PreviousMonthsBanks = () => {
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
    console.log('PreviousMonths - Month selected:', month);
    setSelectedMonth(month);
  }, []);

  useEffect(() => {
    console.log('PreviousMonths - Effect - Selected Month:', selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-44 p-4 border-b md:border-b-0 md:border-r">
        <h2 className="text-md font-bold mb-4 text-center">Previous Months</h2>
        <div className="space-y-2">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              onClick={() => handleMonthSelect(month)}
              className="w-full"
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full md:w-3/4 lg:w-4/5 p-4">
        <BankStatementsClient
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  );
};

export default PreviousMonthsBanks;