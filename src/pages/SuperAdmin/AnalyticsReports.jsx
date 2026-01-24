import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css'; // Reusing dashboard styles for consistency

const AnalyticsReports = () => {
    const { t } = useTheme();

    // Fetch data from local storage
    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        const workstreams = JSON.parse(localStorage.getItem('edutraker_workstreams') || '[]');
        const schools = JSON.parse(localStorage.getItem('ws_schools') || '[]');
        const users = JSON.parse(localStorage.getItem('edutraker_users') || '[]');

        const chartData = workstreams.map(ws => {
            const schoolCount = schools.filter(s => 
                (s.workstream === ws.name) || 
                (s.location && s.location.includes(ws.name))
            ).length;
            
            const userCount = users.filter(u => u.workstream === ws.name).length;

            return {
                name: ws.name,
                schools: schoolCount,
                users: userCount
            };
        });

        setData(chartData);
    }, []);

    const handleDownload = (type) => {
        if (type === 'PDF') {
            window.print();
        } else if (type === 'CSV') {
            const users = JSON.parse(localStorage.getItem('edutraker_users') || '[]');
            const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Workstream'];
            const csvContent = [
                headers.join(','),
                ...users.map(user => [user.id, user.name, user.email, user.role, user.status, user.workstream].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `system_usage_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>{t('analytics.title')}</h1>

            <div className={styles.contentGrid}>
                <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                    <h2 className={styles.cardTitle}>{t('analytics.academic')}</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="schools" fill="#8884d8" name={t('workstreams.card.schools')} />
                                <Bar dataKey="users" fill="#82ca9d" name={t('workstreams.card.users')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.cardTitle}>{t('analytics.downloads')}</h2>
                    <ul className={styles.activityList}>
                        <li className={styles.activityItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t('analytics.globalReport')}</span>
                            <button className={styles.actionBtn} onClick={() => handleDownload('PDF')} style={{ color: '#2563eb', fontWeight: 'bold' }}>{t('analytics.downloadPDF')}</button>
                        </li>
                        <li className={styles.activityItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t('analytics.systemUsage')}</span>
                            <button className={styles.actionBtn} onClick={() => handleDownload('CSV')} style={{ color: '#2563eb', fontWeight: 'bold' }}>{t('analytics.downloadCSV')}</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReports;
