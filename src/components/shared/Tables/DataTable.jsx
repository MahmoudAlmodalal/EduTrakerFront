import React, { useState, useMemo } from 'react';
import {
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Download,
    MoreVertical,
    Check
} from 'lucide-react';
import './DataTable.css';

/**
 * Configurable DataTable Component
 * Role-aware table with sorting, filtering, pagination, and actions
 * 
 * @param {array} columns - Column definitions
 * @param {array} data - Data rows
 * @param {array} actions - Row-level action definitions
 * @param {function} onRowClick - Click handler for rows
 * @param {boolean} selectable - Enable row selection
 * @param {boolean} exportable - Show export button
 * @param {boolean} filterable - Show filter controls
 * @param {boolean} sortable - Enable column sorting
 * @param {number} pageSize - Rows per page
 * @param {boolean} loading - Show loading state
 * @param {string} emptyMessage - Message when no data
 */
const DataTable = ({
    columns = [],
    data = [],
    actions = [],
    onRowClick,
    selectable = false,
    exportable = false,
    filterable = true,
    sortable = true,
    pageSize = 10,
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    onExport,
    onBulkAction,
}) => {
    // State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const handleSort = (columnKey) => {
        if (!sortable) return;

        setSortConfig(prev => ({
            key: columnKey,
            direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filtering and sorting data
    const processedData = useMemo(() => {
        let result = [...data];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(row =>
                columns.some(col => {
                    const value = row[col.key];
                    return value && String(value).toLowerCase().includes(searchLower);
                })
            );
        }

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                const comparison = aVal < bVal ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig, columns]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = processedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Selection
    const handleSelectAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(paginatedData.map((_, i) => i)));
        }
    };

    const handleSelectRow = (index) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRows(newSelected);
    };

    const isAllSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length;

    // Export handler
    const handleExport = () => {
        if (onExport) {
            onExport(processedData);
        }
    };

    // Render cell content
    const renderCell = (row, column) => {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        return row[column.key];
    };

    if (loading) {
        return (
            <div className={`data-table-container ${className}`}>
                <div className="data-table-loading">
                    <div className="data-table-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`data-table-container ${className}`}>
            {/* Toolbar */}
            <div className="data-table-toolbar">
                {/* Search */}
                {filterable && (
                    <div className="data-table-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="data-table-actions">
                    {filterable && (
                        <button
                            className={`data-table-btn ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                            Filters
                        </button>
                    )}

                    {exportable && (
                        <button className="data-table-btn" onClick={handleExport}>
                            <Download size={18} />
                            Export
                        </button>
                    )}

                    {selectable && selectedRows.size > 0 && onBulkAction && (
                        <button
                            className="data-table-btn data-table-btn--primary"
                            onClick={() => onBulkAction(Array.from(selectedRows).map(i => paginatedData[i]))}
                        >
                            Action ({selectedRows.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="data-table-checkbox">
                                    <button
                                        className={`data-table-checkbox-btn ${isAllSelected ? 'checked' : ''}`}
                                        onClick={handleSelectAll}
                                    >
                                        {isAllSelected && <Check size={14} />}
                                    </button>
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${sortable && column.sortable !== false ? 'sortable' : ''} ${column.align ? `align-${column.align}` : ''}`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable !== false && handleSort(column.key)}
                                >
                                    <div className="data-table-th-content">
                                        <span>{column.label}</span>
                                        {sortable && column.sortable !== false && (
                                            <span className="data-table-sort-icon">
                                                {sortConfig.key === column.key ? (
                                                    sortConfig.direction === 'asc' ?
                                                        <ChevronUp size={14} /> :
                                                        <ChevronDown size={14} />
                                                ) : (
                                                    <ChevronUp size={14} className="inactive" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions.length > 0 && <th className="data-table-actions-cell">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                    className="data-table-empty"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className={`${selectedRows.has(rowIndex) ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {selectable && (
                                        <td className="data-table-checkbox">
                                            <button
                                                className={`data-table-checkbox-btn ${selectedRows.has(rowIndex) ? 'checked' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectRow(rowIndex);
                                                }}
                                            >
                                                {selectedRows.has(rowIndex) && <Check size={14} />}
                                            </button>
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={column.align ? `align-${column.align}` : ''}
                                        >
                                            {renderCell(row, column)}
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td className="data-table-actions-cell">
                                            <div className="data-table-row-actions">
                                                {actions.map((action, actionIndex) => (
                                                    <button
                                                        key={actionIndex}
                                                        className={`data-table-action-btn ${action.variant || ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(row);
                                                        }}
                                                        title={action.label}
                                                    >
                                                        {action.icon && <action.icon size={16} />}
                                                        {!action.icon && action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="data-table-pagination">
                    <span className="data-table-pagination-info">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length}
                    </span>
                    <div className="data-table-pagination-controls">
                        <button
                            className="data-table-pagination-btn"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    className={`data-table-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            className="data-table-pagination-btn"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
