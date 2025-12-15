import React from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle, Bell } from 'lucide-react';

const TeacherDashboard = () => {
    // Mock Data for Schedule
    const schedule = [
        { id: 1, day: 'Monday', time: '08:00 AM - 09:30 AM', subject: 'Mathematics', class: 'Grade 10-A', room: 'Room 101' },
        { id: 2, day: 'Monday', time: '10:00 AM - 11:30 AM', subject: 'Physics', class: 'Grade 11-B', room: 'Lab 2' },
        { id: 3, day: 'Tuesday', time: '09:00 AM - 10:30 AM', subject: 'Mathematics', class: 'Grade 10-B', room: 'Room 102' },
        { id: 4, day: 'Wednesday', time: '08:00 AM - 09:30 AM', subject: 'Mathematics', class: 'Grade 10-A', room: 'Room 101' },
        { id: 5, day: 'Thursday', time: '12:00 PM - 01:30 PM', subject: 'Physics', class: 'Grade 11-A', room: 'Lab 1' },
    ];

    // Mock Data for Notifications
    const notifications = [
        { id: 1, type: 'alert', message: '5 students have overdue assignments in Grade 10-A', time: '2 hours ago' },
        { id: 2, type: 'info', message: ' Staff meeting scheduled for Friday at 2 PM', time: '5 hours ago' },
        { id: 3, type: 'success', message: 'Grade 11-B Physics results published successfully', time: '1 day ago' },
        { id: 4, type: 'alert', message: 'Student "Ahmed Ali" has 3 consecutive absences', time: '2 days ago' },
    ];

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                    <p className="text-gray-600">Welcome back, Mr. Teacher</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-full shadow-sm relative">
                        <Bell size={20} className="text-gray-600" />
                        <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="text-sm text-right hidden sm:block">
                        <p className="font-semibold text-gray-800">Dec 15, 2025</p>
                        <p className="text-gray-500">Monday</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Schedule Section */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            My Schedule
                        </h2>
                        <button className="text-blue-600 text-sm hover:underline">View Full Timetable</button>
                    </div>

                    <div className="space-y-4">
                        {schedule.map((slot) => (
                            <div key={slot.id} className="flex items-center p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-800">{slot.subject}</h3>
                                        <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                                            {slot.day}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {slot.class} • {slot.time}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        {slot.room}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Notifications Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Bell size={20} className="text-orange-500" />
                        Quick Notifications
                    </h2>

                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="flex gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                <div className={`mt-1 flex-shrink-0`}>
                                    {notif.type === 'alert' && <AlertCircle size={18} className="text-red-500" />}
                                    {notif.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
                                    {notif.type === 'info' && <AlertCircle size={18} className="text-blue-500" />}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 font-medium leading-tight">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-center text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        View All Notifications
                    </button>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-2 text-xs font-medium text-center bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                + New Assignment
                            </button>
                            <button className="p-2 text-xs font-medium text-center bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                                Attendence Check
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
