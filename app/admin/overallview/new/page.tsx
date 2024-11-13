"use client"

// TableDemo.tsx
import React from 'react';
import AdvancedTable from './AdvancedTable';
import AdvancedTablePage from './AdvancedTable';

const TableDemo = () => {
    const sampleData = {
        sections: [
            {
                id: 'sales',
                name: 'Sales Department',
                categories: [
                    {
                        id: 'retail',
                        name: 'Retail Sales',
                        subCategories: [
                            {
                                id: 'domestic',
                                name: 'Domestic Market',
                                rows: [
                                    {
                                        id: 1,
                                        product: 'Laptop Pro',
                                        quantity: 150,
                                        price: 1299.99,
                                        lastUpdated: '2024-03-15',
                                        status: 'In Stock',
                                        responsible: 'John Doe'
                                    },
                                    {
                                        id: 2,
                                        product: 'Desktop Ultimate',
                                        quantity: 75,
                                        price: 1999.99,
                                        lastUpdated: '2024-03-14',
                                        status: 'Low Stock',
                                        responsible: 'Jane Smith'
                                    }
                                ]
                            },
                            {
                                id: 'international',
                                name: 'International Market',
                                rows: [
                                    {
                                        id: 3,
                                        product: 'Laptop Pro',
                                        quantity: 200,
                                        price: 1399.99,
                                        lastUpdated: '2024-03-15',
                                        status: 'In Stock',
                                        responsible: 'Alice Johnson'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'wholesale',
                        name: 'Wholesale Sales',
                        subCategories: [
                            {
                                id: 'distributors',
                                name: 'Distributors',
                                rows: [
                                    {
                                        id: 4,
                                        product: 'Laptop Pro Bulk',
                                        quantity: 1000,
                                        price: 999.99,
                                        lastUpdated: '2024-03-15',
                                        status: 'In Stock',
                                        responsible: 'Bob Wilson'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Advanced Table Demo</h1>
            <AdvancedTablePage />
        </div>
    );
};

export default TableDemo;