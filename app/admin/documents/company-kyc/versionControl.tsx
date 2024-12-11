// versionControl.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";

export interface VersionControlState {
  expandedCompanies: Set<number>;
  showAllVersions: boolean;
}

export const useVersionControl = () => {
  const [state, setState] = React.useState<VersionControlState>({
    expandedCompanies: new Set(),
    showAllVersions: false,
  });

  const toggleCompanyVersions = (companyId: number) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedCompanies);
      if (newExpanded.has(companyId)) {
        newExpanded.delete(companyId);
      } else {
        newExpanded.add(companyId);
      }
      return {
        ...prev,
        expandedCompanies: newExpanded,
      };
    });
  };

  const toggleAllVersions = () => {
    setState(prev => ({
      ...prev,
      showAllVersions: !prev.showAllVersions,
      expandedCompanies: new Set(),
    }));
  };

  return {
    ...state,
    toggleCompanyVersions,
    toggleAllVersions,
  };
};

export const VersionSettings = ({ 
  showAllVersions, 
  onToggleAllVersions 
}: { 
  showAllVersions: boolean; 
  onToggleAllVersions: () => void; 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Settings2 className="h-4 w-4 mr-2" />
          Version Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex items-center justify-between cursor-pointer">
          <span className="text-xs">Show All Versions</span>
          <Switch
            checked={showAllVersions}
            onCheckedChange={onToggleAllVersions}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};