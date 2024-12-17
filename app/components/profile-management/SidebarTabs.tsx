// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Field {
  section: string;
  field: string;
  visible?: boolean;
  [key: string]: any;
}

interface TabData {
  main_tab: string;
  structure: any;
  fields: Field[];
}

interface SidebarTabsProps {
  onTabChange: (tab: string, tabStructure: any) => void;
}

export default function SidebarTabs({ onTabChange }: SidebarTabsProps) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await fetch('/api/profile-management/sidebar-tabs');
        if (!response.ok) {
          throw new Error('Failed to fetch tabs');
        }
        const data = await response.json();
        
        // Log main tabs for debugging
        console.log('Sidebar Tabs:', data.map((tab: TabData) => tab.main_tab));
        
        setTabs(data);
        if (data.length > 0) {
          const firstTab = data[0];
          setSelectedTab(firstTab.main_tab);
          // Pass the first tab's structure when initializing
          onTabChange(firstTab.main_tab, firstTab.structure);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tabs');
      } finally {
        setLoading(false);
      }
    };

    fetchTabs();
  }, []);

  if (loading) {
    return <div className="px-4 pt-3">Loading tabs...</div>;
  }

  if (error) {
    return <div className="px-4 pt-3 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full pt-20">
      <Tabs
        value={selectedTab}
        onValueChange={(tab) => {
          // Find the full tab data to pass its structure
          const selectedTabData = tabs.find(t => t.main_tab === tab);
          setSelectedTab(tab);
          onTabChange(tab, selectedTabData?.structure || {});
        }}
        className="w-full"
      >
        <TabsList className="flex flex-col space-y-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.main_tab}
              value={tab.main_tab}
              className="w-full justify-start px-4 py-2 text-left"
            >
              {tab.main_tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
