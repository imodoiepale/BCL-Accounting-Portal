// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TabData {
  id: number;
  main_tab: string;
  structure: any;
  verification_status: any;
  created_at: string;
  updated_at: string;
}

interface SidebarTabsProps {
  onTabChange: (tab: string, structure: any) => void;
}

export default function SidebarTabs({ onTabChange }: SidebarTabsProps) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to format tab name (replace 'Details' with 'Registry')
  const formatTabName = (name: string) => {
    return name.replace(/\bDetails\b/g, 'Registry');
  };

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await fetch('/api/profile-management/sidebar-tabs');
        if (!response.ok) {
          throw new Error('Failed to fetch tabs');
        }
        const data = await response.json();

        // Process and format the tab names
        const formattedData = data.map((tab: TabData) => ({
          ...tab,
          main_tab: formatTabName(tab.main_tab)
        }));

        // Remove duplicates based on main_tab
        const uniqueTabs = Array.from(
          new Map(formattedData.map(tab => [tab.main_tab, tab])).values()
        );

        setTabs(uniqueTabs);
        if (uniqueTabs.length > 0) {
          const firstTab = uniqueTabs[0];
          setSelectedTab(firstTab.main_tab);
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

  const handleTabChange = (mainTab: string) => {
    setSelectedTab(mainTab);
    const tabData = tabs.find(t => t.main_tab === mainTab);
    if (tabData) {
      onTabChange(mainTab, tabData.structure);
      console.log(`Selected sidebar-item: ${mainTab}`);
    }
  };

  if (loading) {
    return <div className="px-4 pt-3">Loading tabs...</div>;
  }

  if (error) {
    return <div className="px-4 pt-3 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full pt-20 space-y-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={selectedTab === tab.main_tab ? "secondary" : "ghost"}
          className={`w-full justify-start text-left px-4 py-2 ${
            selectedTab === tab.main_tab ? 'bg-blue-50 text-blue-600' : ''
          }`}
          onClick={() => handleTabChange(tab.main_tab)}
        >
          {tab.main_tab}
        </Button>
      ))}
    </div>
  );
}
