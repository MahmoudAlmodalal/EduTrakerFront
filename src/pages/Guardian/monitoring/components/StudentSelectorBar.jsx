import React from 'react';
import { getInitials } from '../utils/monitoringUtils';

const getStudentMeta = (student) => {
    return (
        student?.grade
        || student?.grade_name
        || student?.class_name
        || student?.classroom_name
        || ''
    );
};

const StudentSelectorBar = ({ students = [], selectedId = null, onSelect }) => {
    if (students.length === 0) {
        return (
            <div className="guardian-card">
                <div className="monitoring-empty-state">No linked students found.</div>
            </div>
        );
    }

    return (
        <div className="student-selector-bar" role="tablist" aria-label="Student Selector">
            {students.map((student) => {
                const studentId = student.student_id;
                const studentName = student.student_name || `Student #${studentId}`;
                const isActive = selectedId === studentId;
                const meta = getStudentMeta(student);

                return (
                    <button
                        key={studentId}
                        type="button"
                        className={`student-selector-card ${isActive ? 'active' : ''}`}
                        onClick={() => onSelect(studentId)}
                        aria-pressed={isActive}
                    >
                        <span className="student-selector-avatar">{getInitials(studentName)}</span>
                        <span className="student-selector-content">
                            <span className="student-selector-name">{studentName}</span>
                            <span className="student-selector-meta">{meta || 'Student'}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default StudentSelectorBar;
