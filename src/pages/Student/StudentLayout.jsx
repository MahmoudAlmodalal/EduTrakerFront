import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import styles from '../../components/Layout/MainLayout.module.css';
import './Student.css';

const StudentLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`${styles.mainContent} ${isSidebarOpen ? '' : styles.expanded}`}>
                <Header toggleSidebar={toggleSidebar} />
                <main className={styles.contentArea}>
                    <div className="fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;

