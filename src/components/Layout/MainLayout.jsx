import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './MainLayout.module.css';

const MainLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={isSidebarOpen} />
            <div className={`${styles.mainContent} ${isSidebarOpen ? '' : styles.expanded}`}>
                <Header toggleSidebar={toggleSidebar} />
                <main className={styles.contentArea}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
