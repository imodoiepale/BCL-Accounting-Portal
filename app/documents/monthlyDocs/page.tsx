import React from 'react';
import { MonthlyDocsClient } from './MonthlyDocsClient';

export default function MonthlyDocsPage() {
  return <MonthlyDocsClient isCurrentMonth={true} />;
}