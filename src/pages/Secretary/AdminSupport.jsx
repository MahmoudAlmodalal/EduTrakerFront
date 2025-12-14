import React, { useState } from 'react';
import { FileText, Printer, Lock, Search, Download, AlertCircle, CheckCircle } from 'lucide-react';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const AdminSupport = () => {

    const [resetUser, setResetUser] = useState('');

    // Mock Data
    const printQueue = [
        { id: 1, doc: 'Class Schedule 1-A', user: 'Mrs. Krabappel', time: '10:30 AM', status: 'Ready' },
        { id: 2, doc: 'Midterm Report - Bart Simpson', user: 'Principal Skinner', time: '11:15 AM', status: 'Printing...' },
    ];

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Administrative Support</h1>
                <p>Issue certificates, manage schedules, and assisting users.</p>
            </header>

            <div className="secretary-widgets-grid">
                {/* Certificate Station */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Certificate Station</h2>
                        <FileText size={20} className="text-blue-500" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Select Student</label>
                        <div className="search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input type="text" className="search-input" placeholder="Search student..." />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Certificate Type</label>
                        <select className="form-select">
                            <option>Enrollment Verification</option>
                            <option>Good Conduct Certificate</option>
                            <option>Transfer Certificate</option>
                            <option>Academic Transcript</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes / Remarks</label>
                        <textarea className="form-input" rows="3" placeholder="Optional notes..."></textarea>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button className="btn-primary flex-1 justify-center">
                            <Printer size={18} style={{ marginRight: '8px' }} />
                            Issue & Print
                        </button>
                        <button className="btn-secondary flex-1 justify-center" style={{ border: '1px solid #d1d5db', background: 'white' }}>
                            <Download size={18} style={{ marginRight: '8px' }} />
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* User Helpdesk */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>User Helpdesk</h2>
                        <Lock size={20} className="text-orange-500" />
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 mb-6">
                        <div className="flex gap-3">
                            <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-orange-800 text-sm">Quick Password Reset</h4>
                                <p className="text-orange-700 text-xs mt-1">Verify user identity before resetting credentials.</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Find User Account</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Username or Email"
                                value={resetUser}
                                onChange={(e) => setResetUser(e.target.value)}
                            />
                            <button className="btn-secondary" style={{ padding: '0.5rem', border: '1px solid #d1d5db', background: '#f9fafb' }}>
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    {resetUser && (
                        <div className="mt-4 p-4 border border-gray-200 rounded-lg animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                    {resetUser.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{resetUser}</p>
                                    <p className="text-xs text-gray-500">Parent / Guardian</p>
                                </div>
                            </div>
                            <button className="btn-primary w-full justify-center bg-red-600 hover:bg-red-700 border-none">
                                <Lock size={16} style={{ marginRight: '8px' }} />
                                Reset Password
                            </button>
                        </div>
                    )}
                </div>

                {/* Schedule Management */}
                <div className="widget-card lg:col-span-2">
                    <div className="widget-header">
                        <h2>Schedule Center</h2>
                        <Printer size={20} className="text-gray-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-gray-700 mb-4">Print Schedules</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                                    <h4 className="font-bold text-gray-800">Class Schedules</h4>
                                    <p className="text-xs text-gray-500 mt-1">Print constraints for all classes</p>
                                </button>
                                <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                                    <h4 className="font-bold text-gray-800">Teacher Timetables</h4>
                                    <p className="text-xs text-gray-500 mt-1">Individual staff schedules</p>
                                </button>
                                <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                                    <h4 className="font-bold text-gray-800">Exam Schedules</h4>
                                    <p className="text-xs text-gray-500 mt-1">Upcoming examination dates</p>
                                </button>
                                <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                                    <h4 className="font-bold text-gray-800">Room Allocation</h4>
                                    <p className="text-xs text-gray-500 mt-1">Room usage distribution</p>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-700 mb-4">Recent Print Jobs</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {printQueue.map((job) => (
                                    <div key={job.id} className="p-3 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-sm text-gray-800">{job.doc}</p>
                                            <p className="text-xs text-gray-500">Requested by {job.user}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-green-600 block">{job.status}</span>
                                            <span className="text-xs text-gray-400">{job.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSupport;
