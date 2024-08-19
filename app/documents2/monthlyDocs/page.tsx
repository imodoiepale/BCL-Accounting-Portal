import React from 'react';
import { MonthlyDocsClient } from './MonthlyDocsSupp';

export default function MonthlyDocsPage() {
  return <MonthlyDocsClient isCurrentMonth={true} />;
}