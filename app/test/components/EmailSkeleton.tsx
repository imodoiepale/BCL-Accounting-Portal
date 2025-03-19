import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const EmailSkeleton: React.FC = () => (
  <div className="p-4 animate-pulse">
    <div className="flex gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  </div>
);
