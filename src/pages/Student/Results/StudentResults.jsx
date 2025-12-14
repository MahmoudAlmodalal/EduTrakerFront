import React from 'react';
import { Award, TrendingUp, BarChart2, AlertCircle } from 'lucide-react';
import '../../Student/Student.css';

const StudentResults = () => {
    // Mock Result Data
    const results = [
        {
            subject: 'Mathematics',
            assessments: [
                { title: 'Quiz 1', date: '2024-10-15', grade: 92, total: 100, average: 85 },
                { title: 'Midterm', date: '2024-11-20', grade: 88, total: 100, average: 75 },
                { title: 'Homework 3', date: '2024-12-05', grade: 95, total: 100, average: 88 },
            ],
            finalGrade: 91,
            trend: 'up'
        },
        {
            subject: 'Physics',
            assessments: [
                { title: 'Updates on Motion', date: '2024-10-18', grade: 78, total: 100, average: 80 },
                { title: 'Lab Report', date: '2024-11-25', grade: 85, total: 100, average: 82 },
            ],
            finalGrade: 81,
            trend: 'stable'
        },
        {
            subject: 'English',
            assessments: [
                { title: 'Essay 1', date: '2024-10-22', grade: 88, total: 100, average: 85 },
                { title: 'Poetry Analysis', date: '2024-11-30', grade: 90, total: 100, average: 86 },
            ],
            finalGrade: 89,
            trend: 'up'
        },
        {
            subject: 'Computer Science',
            assessments: [
                { title: 'Algorithm Test', date: '2024-11-10', grade: 95, total: 100, average: 70 },
                { title: 'Project Phase 1', date: '2024-12-01', grade: 98, total: 100, average: 85 },
            ],
            finalGrade: 96,
            trend: 'up'
        },
    ];

    return (
        <div className="student-results">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Academic Results</h1>
                <p className="text-slate-500">Track your grades and performance across all subjects.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* GPA / Overview Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-green-100 text-green-600 rounded-full">
                        <Award size={32} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">3.8</div>
                        <div className="text-sm text-slate-500">Current GPA</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">Top 10%</div>
                        <div className="text-sm text-slate-500">Class Ranking</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
                        <BarChart2 size={32} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">92%</div>
                        <div className="text-sm text-slate-500">Overall Success Rate</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {results.map((result, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{result.subject}</h3>
                                <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    Current Grade: <span className="font-bold text-blue-600">{result.finalGrade}%</span>
                                    {result.trend === 'up' && <span className="text-green-500 text-xs flex items-center bg-green-50 px-1.5 py-0.5 rounded">Trending Up <TrendingUp size={12} className="ml-1" /></span>}
                                    {result.trend === 'down' && <span className="text-red-500 text-xs flex items-center bg-red-50 px-1.5 py-0.5 rounded">Trending Down <TrendingUp size={12} className="ml-1 rotate-180" /></span>}
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <span className="text-xs text-slate-400">Class Average Comparison</span>
                                <div className="w-48 h-2 bg-slate-200 rounded-full mt-1 relative">
                                    {/* Class Average Marker */}
                                    <div
                                        className="absolute h-4 w-1 bg-slate-400 -top-1 rounded"
                                        style={{ left: '80%' }}
                                        title="Class Average: ~80%"
                                    ></div>
                                    {/* Student Grade */}
                                    <div
                                        className={`h-full rounded-full ${result.finalGrade >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${result.finalGrade}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 font-semibold">Assessment</th>
                                        <th className="p-4 font-semibold">Date</th>
                                        <th className="p-4 font-semibold">Score</th>
                                        <th className="p-4 font-semibold">Average</th>
                                        <th className="p-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.assessments.map((assessment, aIndex) => (
                                        <tr key={aIndex} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{assessment.title}</td>
                                            <td className="p-4">{assessment.date}</td>
                                            <td className="p-4">
                                                <span className={`font-bold ${assessment.grade >= 90 ? 'text-green-600' : assessment.grade >= 80 ? 'text-blue-600' : 'text-slate-600'}`}>
                                                    {assessment.grade}/{assessment.total}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {assessment.average}
                                            </td>
                                            <td className="p-4">
                                                {assessment.grade < assessment.average ? (
                                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                                        Below Avg
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                                        Above Avg
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentResults;
