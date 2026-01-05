import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css'; // Reusing dashboard styles for consistency

const AnalyticsReports = () => {
    const { t } = useTheme();

    const data = [
        { name: 'Gaza North', math: 85, science: 78, english: 82 },
        { name: 'Gaza City', math: 80, science: 85, english: 88 },
        { name: 'Middle Area', math: 75, science: 72, english: 79 },
        { name: 'Khan Younis', math: 82, science: 80, english: 85 },
        { name: 'Rafah', math: 78, science: 76, english: 80 },
    ];

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
                                <Bar dataKey="math" fill="#8884d8" name={t('analytics.math')} />
                                <Bar dataKey="science" fill="#82ca9d" name={t('analytics.science')} />
                                <Bar dataKey="english" fill="#ffc658" name={t('analytics.english')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.cardTitle}>{t('analytics.downloads')}</h2>
                    <ul className={styles.activityList}>
                        <li className={styles.activityItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t('analytics.globalReport')}</span>
                            <button className={styles.actionBtn} style={{ color: '#2563eb', fontWeight: 'bold' }}>{t('analytics.downloadPDF')}</button>
                        </li>
                        <li className={styles.activityItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t('analytics.systemUsage')}</span>
                            <button className={styles.actionBtn} style={{ color: '#2563eb', fontWeight: 'bold' }}>{t('analytics.downloadCSV')}</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReports;
