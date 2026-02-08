import React, { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    Calendar as CalendarIcon,
    Clock,
    UserPlus,
    MessageSquare,
    School,
    ArrowUpRight,
    Search,
    Bell,
    Settings,
    ChevronRight,
    Plus,
    TrendingUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        unreadMessages: 0,
        absentToday: 0,
        schoolName: '',
    });
    const [recentApplications, setRecentApplications] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, applicationsData, yearsData] = await Promise.all([
                    secretaryService.getDashboardStats(),
                    secretaryService.getApplications({ page: 1 }),
                    secretaryService.getAcademicYears()
                ]);

                setStats({
                    totalStudents: statsData.statistics?.total_students || 0,
                    unreadMessages: statsData.statistics?.unread_messages || 0,
                    absentToday: statsData.statistics?.absent_today || 0,
                    schoolName: statsData.statistics?.school_name || 'My School'
                });

                setRecentApplications((applicationsData.results || applicationsData || []).slice(0, 5));
                setAcademicYears(yearsData.results || yearsData || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const currentYear = academicYears.find(y => {
        const now = new Date();
        const start = new Date(y.start_date);
        const end = new Date(y.end_date);
        return now >= start && now <= end;
    }) || academicYears[0];

    // Mock data for the trend chart (could be real if backend provided history)
    const trendData = [
        { name: 'Mon', count: Math.floor(stats.totalStudents * 0.95) },
        { name: 'Tue', count: Math.floor(stats.totalStudents * 0.92) },
        { name: 'Wed', count: Math.floor(stats.totalStudents * 0.96) },
        { name: 'Thu', count: Math.floor(stats.totalStudents * 0.94) },
        { name: 'Fri', count: Math.max(0, stats.totalStudents - stats.absentToday) },
    ];

    const StatCard = ({ label, value, icon: Icon, trend, colorClass }) => (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg ${colorClass}`}>
                    <Icon size={20} className="text-white" />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                        <TrendingUp size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Navbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <School size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900 text-lg leading-tight">{stats.schoolName}</h1>
                            <p className="text-slate-500 text-xs">Secretary Control Panel</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 relative">
                                <Bell size={18} />
                                {stats.unreadMessages > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-8">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
                        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
                    </div>
                    <button
                        onClick={() => navigate('/secretary/admissions')}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        New Admission
                    </button>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Students"
                        value={stats.totalStudents}
                        icon={Users}
                        colorClass="bg-indigo-600"
                        trend="+12% this month"
                    />
                    <StatCard
                        label="Unread Messages"
                        value={stats.unreadMessages}
                        icon={MessageSquare}
                        colorClass="bg-amber-500"
                    />
                    <StatCard
                        label="Attendance Rate"
                        value={`${stats.totalStudents > 0 ? Math.round(((stats.totalStudents - stats.absentToday) / stats.totalStudents) * 100) : 0}%`}
                        icon={TrendingUp}
                        colorClass="bg-emerald-500"
                    />
                    <StatCard
                        label="Absent Today"
                        value={stats.absentToday}
                        icon={Clock}
                        colorClass="bg-rose-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Attendance Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-slate-900">Weekly Attendance Trend</h3>
                                <p className="text-xs text-slate-500">Student حضور/إحصاء tracking for the current week</p>
                            </div>
                            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none">
                                <option>Current Week</option>
                                <option>Last Week</option>
                            </select>
                        </div>
                        <div className="h-[300px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Access Sidebar */}
                    <div className="space-y-6">
                        {/* Current Session Info */}
                        <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
                            <div className="relative z-10">
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Current Session</p>
                                <h3 className="text-2xl font-bold mb-1">{currentYear?.academic_year_code || '---'}</h3>
                                <p className="text-indigo-200 text-sm mb-6">Status: <span className="text-white font-medium uppercase text-xs px-2 py-0.5 bg-indigo-700/50 rounded-full ml-1">Active</span></p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm border-t border-indigo-800 pt-3">
                                        <span className="text-indigo-300">Start Date</span>
                                        <span className="font-medium">{currentYear?.start_date || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-indigo-800 pt-3">
                                        <span className="text-indigo-300">End Date</span>
                                        <span className="font-medium">{currentYear?.end_date || '---'}</span>
                                    </div>
                                </div>
                            </div>
                            <CalendarIcon size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
                        </div>

                        {/* Recent Enrollments Peek */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h4 className="font-bold text-slate-900 text-sm">Recent Activity</h4>
                                <button onClick={() => navigate('/secretary/admissions')} className="text-xs text-indigo-600 font-bold hover:underline">View CRM</button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentApplications.map((app) => (
                                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                                                {(app.student_name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{app.student_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Applied for: {app.grade_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                ))}
                                {recentApplications.length === 0 && (
                                    <div className="py-8 text-center text-slate-400 text-xs italic">No activity yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: UserPlus, label: "Student Registry", sub: "Manage all students", link: "/secretary/students" },
                        { icon: CalendarIcon, label: "Attendance Log", sub: "Daily reports", link: "/secretary/attendance" },
                        { icon: MessageSquare, label: "Parent Broadcast", sub: "Send updates", link: "/secretary/communication" },
                        { icon: FileText, label: "Enrollment Center", sub: "Process apps", link: "/secretary/admissions" },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(btn.link)}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col group"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-600">
                                <btn.icon size={20} />
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{btn.label}</span>
                            <span className="text-xs text-slate-400 mt-1">{btn.sub}</span>
                            <div className="mt-4 flex items-center text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Open Module
                                <ArrowUpRight size={14} className="ml-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SecretaryDashboard;
