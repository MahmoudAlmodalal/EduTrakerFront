import React from 'react';
import TeacherProfileCard from './TeacherProfileCard';
import './Teacher.css';

const TeacherInfo = () => {
    return (
        <div className="teacher-page" style={{ gap: '1.2rem' }}>
            <div>
                <h1 className="teacher-title" style={{ marginBottom: '0.35rem' }}>Teacher Info</h1>
                <p className="teacher-subtitle" style={{ margin: 0 }}>
                    Full school context, classrooms, and professional network overview.
                </p>
            </div>

            <TeacherProfileCard />
        </div>
    );
};

export default TeacherInfo;
