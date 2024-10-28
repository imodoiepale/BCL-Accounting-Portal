import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wcmrsrnjtkrmfcjxmxpc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXJzcm5qdGtybWZjanhteHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMjcwNTA2NywiZXhwIjoyMDE4MjgxMDY3fQ.FNNRgt4R-lWE9OWRkO22DbdaKy9Y3HKYs2U1u6XvSXI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

