// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";

const DataFetchingWrapper = ({ 
  userid, 
  table, 
  children, 
  additionalFilters = {},
  renderLoading,
  renderError,
  renderEmpty 
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userid) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from(table)
          .select('*')
          .eq('userid', userid);
          
        // Apply any additional filters
        Object.entries(additionalFilters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data, error } = await query;

        if (error) throw error;
        
        setData(data || []);
      } catch (err) {
        console.error(`Error fetching ${table}:`, err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userid, table, JSON.stringify(additionalFilters)]);

  if (isLoading) {
    return renderLoading ? renderLoading() : (
      <Card className="p-8 flex justify-center items-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return renderError ? renderError(error) : (
      <Card className="p-8 flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return renderEmpty ? renderEmpty() : (
      <Card className="p-8 flex justify-center items-center">
        <div className="text-gray-500">No data available</div>
      </Card>
    );
  }

  return children(data);
};

export default DataFetchingWrapper;