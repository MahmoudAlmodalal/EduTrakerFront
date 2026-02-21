import React, { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const normalizeList = (response) => {
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response)) return response;
    return [];
};

const toActionBadgeClass = (actionLabel) => {
    const normalized = String(actionLabel || '').toUpperCase();
    if (['LOGIN', 'CREATE', 'ACTIVATE'].includes(normalized)) return 'status-active';
    if (['LOGOUT', 'DELETE', 'DEACTIVATE'].includes(normalized)) return 'status-inactive';
    return '';
};

const SystemActivityLog = () => {
    const { user } = useAuth();
    const { t } = useTheme();

    const toRoleLabel = (role) => {
        const normalized = String(role || '').toLowerCase();
        if (normalized === 'manager_school') return t('activity.roles.schoolManager');
        if (normalized === 'manager_workstream') return t('activity.roles.workstreamManager');
        if (normalized === 'teacher') return t('activity.roles.teacher');
        if (normalized === 'secretary') return t('activity.roles.secretary');
        if (normalized === 'admin') return t('activity.roles.admin');
        if (normalized === 'system') return t('activity.roles.system');
        return role || t('activity.roles.unknown');
    };

    const formatTimeParts = (value) => {
        if (!value) {
            return { date: t('activity.time.notRecorded'), time: t('activity.time.notRecorded') };
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return { date: t('activity.time.notRecorded'), time: t('activity.time.notRecorded') };
        }

        return {
            date: date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [userType, setUserType] = useState('all');
    const [actionType, setActionType] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const schoolId = user?.school_id
        || user?.school?.id
        || (typeof user?.school === 'number' ? user.school : null);
    const hasSchoolId = schoolId !== null && schoolId !== undefined && schoolId !== '';

    const queryParams = useMemo(() => {
        const params = { page, page_size: pageSize };
        if (hasSchoolId) params.school_id = schoolId;
        if (userType !== 'all') params.user_type = userType;
        if (actionType !== 'all') params.action_type = actionType;
        if (deferredSearchTerm.trim()) params.search = deferredSearchTerm.trim();
        return params;
    }, [actionType, deferredSearchTerm, hasSchoolId, page, schoolId, userType]);

    const {
        data: activityResponse,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['school-manager', 'system-activity-logs', queryParams],
        queryFn: () => managerService.getActivityLogs(queryParams),
        enabled: hasSchoolId,
        staleTime: 10000,
        refetchInterval: 30000
    });

    const rows = normalizeList(activityResponse);
    const totalPages = Number(activityResponse?.total_pages) || 1;
    const totalCount = Number(activityResponse?.count) || 0;

    const handleUserTypeChange = (event) => {
        setUserType(event.target.value);
        setPage(1);
    };

    const handleActionTypeChange = (event) => {
        setActionType(event.target.value);
        setPage(1);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(1);
    };

    return (
        <div className="teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('activity.title')}</h1>
            </div>

            <div className="management-card">
                <div className="table-header-actions activity-log-toolbar">
                    <div className="activity-log-toolbar-top">
                        <div className="sm-search-wrap sm-search-control">
                            <Search size={18} className="sm-search-icon" />
                            <input
                                type="text"
                                placeholder={t('activity.searchPlaceholder')}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="sm-search-input"
                            />
                        </div>

                        <button type="button" className="btn-secondary activity-log-refresh-btn" onClick={() => refetch()}>
                            <RefreshCw size={16} />
                            {t('activity.refresh')}
                        </button>
                    </div>

                    <div className="activity-log-filter-row">
                        <select
                            className="sm-form-select sm-select-control"
                            value={userType}
                            onChange={handleUserTypeChange}
                        >
                            <option value="all">{t('activity.filter.allUserTypes')}</option>
                            <option value="manager_school">{t('activity.roles.schoolManager')}</option>
                            <option value="teacher">{t('activity.roles.teacher')}</option>
                            <option value="secretary">{t('activity.roles.secretary')}</option>
                            <option value="system">{t('activity.roles.system')}</option>
                        </select>

                        <select
                            className="sm-form-select sm-select-control"
                            value={actionType}
                            onChange={handleActionTypeChange}
                        >
                            <option value="all">{t('activity.filter.allActions')}</option>
                            <option value="LOGIN">{t('activity.action.login')}</option>
                            <option value="LOGOUT">{t('activity.actions.logout')}</option>
                            <option value="CREATE">{t('activity.action.create')}</option>
                            <option value="UPDATE">{t('activity.action.update')}</option>
                            <option value="ACTIVATE">{t('activity.actions.activate')}</option>
                            <option value="DEACTIVATE">{t('activity.actions.deactivate')}</option>
                            <option value="DELETE">{t('activity.actions.delete')}</option>
                        </select>
                    </div>
                </div>

                <div className="sm-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('activity.table.name')}</th>
                                <th>{t('activity.table.userType')}</th>
                                <th>{t('activity.table.action')}</th>
                                <th>{t('activity.table.details')}</th>
                                <th>{t('activity.table.time')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasSchoolId ? (
                                <tr>
                                    <td colSpan="5" className="sm-empty-state">
                                        {t('activity.status.missingSchool')}
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan="5" className="sm-loading-state">
                                        {t('activity.status.loading')}
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="sm-empty-state">
                                        {error?.message || t('activity.status.error')}
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="sm-empty-state">
                                        {t('activity.status.noMatch')}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const actionLabel = row.action_label || row.action_type || 'N/A';
                                    const badgeClass = toActionBadgeClass(actionLabel);
                                    const target = row.entity_id
                                        ? `${row.entity_type || 'N/A'} #${row.entity_id}`
                                        : (row.entity_type || 'N/A');
                                    const timeParts = formatTimeParts(row.created_at);

                                    return (
                                        <tr key={row.id}>
                                            <td>
                                                <div className="teacher-row-identity">
                                                    <div className="teacher-avatar">
                                                        {row.actor_name?.charAt(0)?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className="teacher-name">{row.actor_name || 'System'}</div>
                                                        <div className="teacher-email">{row.actor_email || 'system@edutraker.com'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="activity-user-type-badge">{toRoleLabel(row.actor_role)}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${badgeClass}`}>{actionLabel}</span>
                                            </td>
                                            <td>
                                                <div className="activity-details-wrap">
                                                    <p className="activity-details-main">{row.description || t('activity.status.noDetails')}</p>
                                                    <span className="activity-details-target">{target}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="activity-time-wrap">
                                                    <span className="activity-time-main">{timeParts.time}</span>
                                                    <span className="activity-time-sub">{timeParts.date}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-header-actions" style={{ marginTop: '1rem' }}>
                    <div className="sm-muted-cell">
                        {t('activity.pagination.info', { page, totalPages, totalCount })}
                    </div>
                    <div className="sm-inline-controls">
                        <button
                            type="button"
                            className="sm-btn-secondary"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1 || isLoading}
                        >
                            {t('activity.pagination.previous')}
                        </button>
                        <button
                            type="button"
                            className="sm-btn-secondary"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages || isLoading}
                        >
                            {t('activity.pagination.next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemActivityLog;
