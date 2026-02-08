import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    Calendar,
    Bell,
    Plus,
    FileText,
    UserCheck,
    Search,
    ChevronRight,
    Loader2,
    TrendingUp,
    Users,
    GraduationCap,
    ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import secretaryService from '../../services/secretaryService';
import notificationService from '../../services/notificationService';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({
        avgAttendance: '0%',
        pendingAssignments: 0,
        totalToGrade: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [notifData, statsResponse] = await Promise.all([
                    notificationService.getNotifications({ page_size: 5 }),
                    secretaryService.getDashboardStats()
                ]);

                setNotifications(notifData.results || notifData || []);

                if (statsResponse && statsResponse.statistics) {
                    const s = statsResponse.statistics;
                    setStats({
                        avgAttendance: s.average_attendance ? `${Math.round(s.average_attendance)}%` : '0%',
                        pendingAssignments: s.pending_assignments_count || 0,
                        totalToGrade: s.total_submissions_to_grade || 0
                    });
                }

                const date = new Date().toISOString().split('T')[0];
                const scheduleData = await teacherService.getSchedule(date);
                setSchedule(scheduleData.results || scheduleData || []);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
            </div>
        );
    }

    const StatCard = ({ label, value, subValue, icon: Icon, colorClass }) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                {subValue && (
                    <span className="text-[10px] font-bold uppercase py-1 px-2 rounded-full bg-indigo-50 text-indigo-600">
                        {subValue}
                    </span>
                )}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
        </div>
    );

    const QuickAction = ({ label, sub, icon: Icon, onClick, colorClass, iconColor }) => (
        <button
            onClick={onClick}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left w-full group"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} ${iconColor} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
                <p className="text-xs text-gray-500 truncate">{sub}</p>
            </div>
            <ArrowUpRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in overflow-hidden px-4 sm:px-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('teacher.dashboard.title')}
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" />
                        {t('teacher.dashboard.welcome')}, <span className="font-semibold text-gray-700">{user?.full_name || user?.username}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="pr-4 border-r border-gray-100">
                            <p className="text-sm font-bold text-gray-900 leading-none">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{new Date().getFullYear()}</p>
                        </div>
                        <div className="relative cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors"
                            onClick={() => navigate('/teacher/communication', { state: { activeTab: 'notifications' } })}>
                            <Bell size={22} className="text-gray-500" />
                            {notifications.some(n => !n.is_read) && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label={t('teacher.dashboard.avgAttendance')}
                    value={stats.avgAttendance}
                    icon={UserCheck}
                    colorClass="bg-emerald-500 text-white"
                    subValue="Overall"
                />
                <StatCard
                    label={t('teacher.dashboard.assignmentsToGrade')}
                    value={stats.totalToGrade}
                    icon={FileText}
                    colorClass="bg-amber-500 text-white"
                    subValue={`${stats.pendingAssignments} Active`}
                />
                <StatCard
                    label="Current Classes"
                    value={schedule.length}
                    icon={GraduationCap}
                    colorClass="bg-indigo-600 text-white"
                />
                <StatCard
                    label="Active Students"
                    value="---"
                    icon={Users}
                    colorClass="bg-sky-500 text-white"
                />
            </div>

            {/* Main Content & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Schedule Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Clock size={18} />
                                </div>
                                {t('teacher.dashboard.mySchedule')}
                            </h2>
                            <button
                                onClick={() => navigate('/teacher/classes')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                            >
                                {t('teacher.dashboard.viewTimetable')}
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        <div className="p-6">
                            {schedule.length > 0 ? (
                                <div className="space-y-4">
                                    {schedule.map((slot) => (
                                        <div key={slot.id} className={`flex items-center gap-5 p-4 rounded-2xl border transition-all ${slot.status === 'current'
                                                ? 'bg-indigo-50/50 border-indigo-100 shadow-sm ring-1 ring-indigo-100'
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                            }`}>
                                            <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 shadow-xs flex flex-col items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-indigo-600">{slot.time.split(' ')[0]}</span>
                                                <Clock size={14} className="text-gray-300 mt-1" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-900 truncate">{slot.subject}</h3>
                                                    {slot.status === 'current' && (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                            {t('teacher.dashboard.now')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} className="text-gray-400" />
                                                        {slot.class}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="flex items-center gap-1 uppercase tracking-tight">
                                                        {slot.room}
                                                    </span>
                                                </div>
                                            </div>

                                            {slot.status === 'current' && (
                                                <button
                                                    onClick={() => navigate('/teacher/attendance')}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    {t('teacher.dashboard.start')}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                                        <Calendar className="text-gray-300" size={32} />
                                    </div>
                                    <p className="text-gray-500 font-medium">{t('teacher.dashboard.noSchedule') || 'No classes scheduled for today'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Desktop Grid */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-md font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <QuickAction
                                label={t('teacher.dashboard.createAssessment')}
                                sub="New Assignment"
                                icon={Plus}
                                onClick={() => navigate('/teacher/assessments')}
                                colorClass="bg-indigo-50"
                                iconColor="text-indigo-600"
                            />
                            <QuickAction
                                label={t('teacher.dashboard.recordAttendance')}
                                sub="Today's Classes"
                                icon={UserCheck}
                                onClick={() => navigate('/teacher/classes')}
                                colorClass="bg-emerald-50"
                                iconColor="text-emerald-600"
                            />
                            <QuickAction
                                label={t('teacher.dashboard.findStudent')}
                                sub="Student Profiles"
                                icon={Search}
                                onClick={() => navigate('/teacher/classes')}
                                colorClass="bg-amber-50"
                                iconColor="text-amber-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Notification Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-md font-bold text-gray-900 flex items-center gap-2">
                                <Bell size={18} className="text-amber-500" />
                                {t('teacher.dashboard.notifications')}
                            </h2>
                            <button
                                onClick={async () => {
                                    try {
                                        await notificationService.markAllAsRead();
                                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                                    } catch (err) { console.error('Error:', err); }
                                }}
                                className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                            >
                                {t('teacher.dashboard.markAllRead')}
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={async () => {
                                            if (!notif.is_read) {
                                                try {
                                                    await notificationService.markAsRead(notif.id);
                                                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                                } catch (err) { console.error('Error:', err); }
                                            }
                                            if (notif.action_url) navigate(notif.action_url);
                                        }}
                                        className={`p-4 rounded-xl flex gap-4 cursor-pointer transition-all ${!notif.is_read ? 'bg-amber-50/50 border border-amber-100 shadow-xs' : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.notification_type === 'grade_posted' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            <Bell size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm leading-tight mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-xs text-gray-400 italic">No new notifications</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-50 bg-gray-50/20">
                            <button
                                onClick={() => navigate('/teacher/communication', { state: { activeTab: 'notifications' } })}
                                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                            >
                                {t('teacher.dashboard.viewAllNotifications')}
                            </button>
                        </div>
                    </div>

                    {/* Small Support Widget */}
                    <div className="bg-indigo-900 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-lg">
                        <div className="relative z-10">
                            <h3 className="font-bold text-sm mb-2">Technical Support</h3>
                            <p className="text-indigo-200 text-[11px] mb-4">Facing issues with the dashboard? Our team is here to help.</p>
                            <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-colors">
                                Contact IT Desk
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={80} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
