  import { createClient } from '@supabase/supabase-js'


  const NEXT_PUBLIC_SUPABASE_URL = 'https://zyszsqgdlrpnunkegipk.supabase.co'
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing'
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables for Supabase configuration')
  }

  export const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const fetchTables = async () => {
      console.log('Starting to fetch tables...');
      try {
          const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
          if (tablesError) {
              console.error('Error fetching tables:', tablesError);
              throw tablesError;
          }
          console.log('Tables data received:', tablesData);

          const tableNames = tablesData.map(t => t.table_name);
          console.log('Unique table names:', tableNames);

          console.log('Starting to fetch columns for each table...');
          // Fetch columns for each table
          const columnsPromises = tableNames.map(async (tableName) => {
              console.log(`Fetching columns for table: ${tableName}`);
              const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
                  input_table_name: tableName
              });

              if (columnsError) {
                  console.error(`Error fetching columns for ${tableName}:`, columnsError);
                  throw columnsError;
              }
              console.log(`Columns received for ${tableName}:`, columns);

              return {
                  table: tableName,
                  columns: columns.map(col => col.column_name)
              };
          });

          const allTableColumns = await Promise.all(columnsPromises);
          console.log('All table columns fetched:', allTableColumns);

          const processedColumns = allTableColumns.reduce((acc, { table, columns }) => {
              acc[table] = columns;
              return acc;
          }, {});
          console.log('Processed columns structure:', processedColumns);

          console.log('Successfully updated table columns state');
      } catch (error) {
          console.error('Error fetching tables and columns:', error);
      }
  };

  fetchTables();


// const fetchTables = async () => {
//     try {
//         const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
//         if (tablesError) throw tablesError;

//         const tableNames = tablesData.map(t => t.table_name);

//         const columnsPromises = tableNames.map(async (tableName) => {
//             const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
//                 input_table_name: tableName
//             });

//             if (columnsError) throw columnsError;

//             return {
//                 table_name: tableName,
//                 columns: columns.map(col => ({
//                     ...col,
//                     table_name: tableName
//                 }))
//             };
//         });

//         const allTableColumns = await Promise.all(columnsPromises);
//         const flattenedColumns = allTableColumns.reduce((acc, table) => {
//             return [...acc, ...table.columns];
//         }, []);

//         console.log('Tables with columns:', allTableColumns);
//         setTableColumns(flattenedColumns);
//     } catch (error) {
//         toast.error('Failed to fetch tables and columns');
//     }
// };