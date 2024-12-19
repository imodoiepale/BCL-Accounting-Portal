
4. Details Tab:
Dynamic Data Table:

Display a table with the data fetched for the selected main_tab.
Each row will show data based on the fields listed in the structure JSON.
Add New or Modify Existing Data:

Allow users to select an existing record or add a new entry.
The form should be populated with fields as defined in the structure JSON.
6. Tab Merging Strategy (Enhanced):
- When multiple tabs have the same names, implement comprehensive merging:
  * Combine structure data including:
    - Order of fields
    - Field configurations
    - Sections
    - Visibility settings
    - Relationship mappings
  * Merge verification statuses for:
    - Row verifications
    - Field verifications
    - Section verifications
  * Deduplicate tabs and related information
    * Preserve all unique data from original tabs
- Ensure no data loss during merging process
- Display only one merged tab instance for tabs with identical names
- Maintain original functionality and data structure integrity
7. Dynamic Field Rendering Strategy:
- Implement Context-Aware Field Generation
  * Parse JSON structure to dynamically render fields
  * Support nested sections and subsections
  * Generate appropriate input types based on field configuration
- Field Rendering Features
  * Dynamically create input and dropdown fields
  * Use predefined dropdown options from JSON structure
  * Support varying field types and configurations
  * Maintain existing functionality (Info, Docs, Bulk Upload)
- Rendering Optimization
  * Utilize React's useMemo for efficient field generation
  * Minimize unnecessary re-renders
  * Support complex, nested field structures
- User Interface Considerations
  * Maintain responsive grid layout
  * Provide context-specific field rendering
  * Enhance user experience with dynamic, adaptive forms
8. Field Filtering and Customization:
- Implement Selective Field Rendering
  * Remove predefined, generic input fields
  * Dynamically filter out specific field names
  * Support flexible field exclusion strategy
- Excluded Fields
  * Company Name
  * Account Manager Position
  * KRA Station
- Filtering Mechanism
  * Use array-based field name filtering
  * Maintain dynamic field generation logic
  * Preserve context-specific rendering
- Rendering Considerations
  * Ensure no data loss during field filtering
  * Maintain responsive layout
  * Support varying tab structures
9. Dynamic Table and Record Management:
- Table Name Extraction Strategy
  * Parse JSON structure to identify tables
  * Support nested and complex configurations
  * Handle multiple tables within subsections
- Record Name Discovery
  * Dynamically identify name-like columns
  * Fallback to generic naming conventions
  * Support variations in column naming
- Record Retrieval Mechanism
  * Extract table names from tab structure
  * Implement flexible record name fetching
  * Handle potential database schema variations
- Error Handling and Robustness
  * Provide comprehensive error logging
  * Implement fallback strategies for missing data
  * Ensure graceful handling of unexpected structures
- User Interface Considerations
  * Create dynamic, adaptive record selection
  * Provide intuitive dropdown experiences
  * Maintain clean, responsive design
10. Functionality:
Add/Update/Delete Data:

Ensure functionality for adding new records or updating existing ones.
Validate input based on field definitions (e.g., dropdown options, mandatory fields).
File Upload:

Allow file uploads in the Docs section, and handle uploading of multiple files.
Error Handling:

Implement error handling for missing required fields, verification failures, and invalid data.
11. Database Interaction:
Querying the Profile Data:
Use SQL to fetch the main category data, field data, and any other related information (e.g., bank details).
Data Insertion/Update:
Implement functionality to add new records or update existing ones within the appropriate tables.
12. UI/UX Design:
Onboarding Stage:
Display form fields and file upload options clearly, with instructions for each field.
Ensure users can easily navigate through Info and Docs stages.
Details Tab:
Display fetched data in a clean, easy-to-read table format.
Allow users to choose between modifying existing records or adding new entries.
13. Additional Features:
Success/Failure Messages:
Show success messages when records are successfully added or updated.
Display appropriate error messages if a required field is missing or if validation fails.
14. use supabase to connect to the database and get the data , using .env