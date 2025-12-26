import React, { useState } from 'react';
import { Book, FileText, Upload, ChevronRight, Download } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../../Student/Student.css';

// Sub-component helper
const CheckCircleIcon = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const StudentSubjects = () => {
    const { t } = useTheme();
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Mock Data
    const subjects = [
        {
            id: 1,
            name: 'Mathematics',
            teacher: 'Dr. Smith',
            description: 'Advanced Calculus and Linear Algebra',
            progress: 75,
            materials: [
                { id: 1, title: 'Week 1: Introduction to Limits', type: 'lecture', date: '2025-01-10' },
                { id: 2, title: 'Calculus Cheat Sheet', type: 'resource', date: '2025-01-12' },
            ],
            assignments: [
                { id: 1, title: 'Homework 3', due: '2025-12-15', statusKey: 'pending' },
                { id: 2, title: 'Midterm Project', due: '2025-12-20', statusKey: 'pending' },
            ]
        },
        {
            id: 2,
            name: 'Physics',
            teacher: 'Prof. Johnson',
            description: 'Mechanics and Thermodynamics',
            progress: 60,
            materials: [
                { id: 1, title: 'Newton Laws Notes', type: 'lecture', date: '2025-01-11' },
            ],
            assignments: [
                { id: 1, title: 'Lab Report', due: '2025-12-18', statusKey: 'submitted' },
            ]
        },
        {
            id: 3,
            name: 'English Literature',
            teacher: 'Ms. Davis',
            description: 'Modern American Literature',
            progress: 90,
            materials: [],
            assignments: []
        },
        {
            id: 4,
            name: 'Computer Science',
            teacher: 'Mr. Wilson',
            description: 'Algorithms and Data Structures',
            progress: 45,
            materials: [],
            assignments: []
        },
    ];

    if (selectedSubject) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedSubject(null)}
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors"
                >
                    <ChevronRight className="rotate-180" size={20} />
                    {t('student.subjects.backToSubjects')}
                </button>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 mb-2">{selectedSubject.name}</h1>
                            <p className="text-slate-500 text-lg">{t('student.subjects.instructor')}: {selectedSubject.teacher}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-slate-500 mb-1">{t('student.subjects.courseProgress')}</div>
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${selectedSubject.progress}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{selectedSubject.progress}% {t('student.subjects.complete')}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Educational Content */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Book size={20} className="text-blue-500" />
                                {t('student.subjects.courseMaterials')}
                            </h3>
                            <div className="space-y-3">
                                {selectedSubject.materials.length > 0 ? selectedSubject.materials.map((material) => (
                                    <div key={material.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded shadow-sm text-blue-600">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{material.title}</div>
                                                <div className="text-xs text-slate-500 capitalize">{material.type} • {material.date}</div>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-blue-600">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-slate-500 italic text-sm">{t('student.subjects.noMaterials')}</div>
                                )}
                            </div>
                        </div>

                        {/* Assignments Portal */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Upload size={20} className="text-orange-500" />
                                {t('student.subjects.assignmentsSubmissions')}
                            </h3>
                            <div className="space-y-3">
                                {selectedSubject.assignments.length > 0 ? selectedSubject.assignments.map((assignment) => (
                                    <div key={assignment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-slate-800">{assignment.title}</div>
                                            {assignment.statusKey === 'submitted' ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{t('student.subjects.submitted')}</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">{t('student.subjects.pending')}</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3">{t('student.subjects.dueDate')}: {assignment.due}</div>

                                        {assignment.statusKey !== 'submitted' && (
                                            <div className="flex gap-2">
                                                <button className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2">
                                                    <Upload size={14} />
                                                    {t('student.subjects.uploadWork')}
                                                </button>
                                            </div>
                                        )}
                                        {assignment.statusKey === 'submitted' && (
                                            <div className="text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircleIcon size={12} />
                                                {t('student.subjects.fileUploaded')}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-slate-500 italic text-sm">{t('student.subjects.noAssignments')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-subjects">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">{t('student.subjects.title')}</h1>
                <p className="text-slate-500">{t('student.subjects.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <div
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Book size={24} />
                            </div>
                            <div className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {subject.materials.length} {t('student.subjects.resources')}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{subject.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{subject.teacher}</p>

                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-blue-600 rounded-full group-hover:bg-blue-500 transition-colors"
                                style={{ width: `${subject.progress}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                            {t('student.subjects.viewDetails')} <ChevronRight size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentSubjects;
