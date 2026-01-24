import React, { useState } from 'react';
import { DataTable } from '@/components/shared';

/**
 * Test page to verify horizontal scrolling functionality
 */
export const HorizontalScrollTest = () => {
    const [testData] = useState([
        {
            id: 1,
            name: 'Ahmed Hassan',
            email: 'ahmed@example.com',
            phone: '0123456789',
            city: 'Cairo',
            country: 'Egypt',
            status: 'Active',
            joinDate: '2024-01-15',
            role: 'Student',
            gpa: 3.8
        },
        {
            id: 2,
            name: 'Fatima Ali',
            email: 'fatima@example.com',
            phone: '0187654321',
            city: 'Alexandria',
            country: 'Egypt',
            status: 'Active',
            joinDate: '2024-02-20',
            role: 'Teacher',
            gpa: 3.9
        },
        {
            id: 3,
            name: 'Mohammed Ibrahim',
            email: 'mohammed@example.com',
            phone: '0198765432',
            city: 'Giza',
            country: 'Egypt',
            status: 'Inactive',
            joinDate: '2024-03-10',
            role: 'Student',
            gpa: 3.5
        },
        {
            id: 4,
            name: 'Aisha Karim',
            email: 'aisha@example.com',
            phone: '0176543210',
            city: 'Cairo',
            country: 'Egypt',
            status: 'Active',
            joinDate: '2024-04-05',
            role: 'Guardian',
            gpa: 3.7
        },
    ]);

    const columns = [
        { key: 'name', label: 'Name', width: '150px', sortable: true },
        { key: 'email', label: 'Email', width: '200px', sortable: true },
        { key: 'phone', label: 'Phone', width: '130px', sortable: false },
        { key: 'city', label: 'City', width: '120px', sortable: true },
        { key: 'country', label: 'Country', width: '120px', sortable: true },
        { key: 'status', label: 'Status', width: '100px', sortable: true },
        { key: 'joinDate', label: 'Join Date', width: '130px', sortable: true },
        { key: 'role', label: 'Role', width: '120px', sortable: true },
        { key: 'gpa', label: 'GPA', width: '80px', sortable: true },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Horizontal Scroll Test</h1>
            <p>This table has many columns and should show horizontal scroll arrows on smaller screens.</p>
            
            <DataTable
                columns={columns}
                data={testData}
                sortable={true}
                filterable={true}
                exportable={true}
                selectable={true}
                pageSize={10}
                emptyMessage="No data available"
            />
        </div>
    );
};

export default HorizontalScrollTest;
