import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter, Loader2, Save, MoreHorizontal, FileText, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const ClassManagement = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loadingAllocations, setLoadingAllocations] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Data States
    const [allocations, setAllocations] = useState([]);
    const [students, setStudents] = useState([]);

    // Selection States
    const [selectedAllocationId, setSelectedAllocationId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('all');

    // UI States
    const [saving, setSaving] = useState(false);

    // Initial Load - Get Classes
    useEffect(() => {
        const fetchAllocations = async () => {
            try {
                setLoadingAllocations(true);
                // Fetch teacher's schedule. Use current date to get active allocations via schedule.
                // Ideally we want ALL active allocations, but schedule endpoint returns active ones for the teacher.
                // Let's pass a date to satisfy the backend param requirement.
                const allocationsData = await teacherService.getSchedule(attendanceDate);
                const uniqueAllocations = [];
                const seenIds = new Set();

                // Dedup allocations if multiple days return same course/class combo
                // Actually the backend returns CourseAllocation objects. 
                // We should distinct by class_room_id and course_id potentially, 
                // but for now let's use the allocation ID as the unique key for the dropdown.
                (allocationsData.results || allocationsData || []).forEach(alloc => {
                    if (!seenIds.has(alloc.id)) {
                        seenIds.add(alloc.id);
                        uniqueAllocations.push(alloc);
                    }
                });

                setAllocations(uniqueAllocations);

                if (uniqueAllocations.length > 0 && !selectedAllocationId) {
                    setSelectedAllocationId(uniqueAllocations[0].id.toString());
                }
            } catch (error) {
                console.error("Error fetching class data:", error);
            } finally {
                setLoadingAllocations(false);
            }
        };

        fetchAllocations();
    }, [user.school_id]); // removed attendanceDate dependence for allocation fetch to avoid re-fetching list on date change

    // Fetch Students when Class Details Change
    useEffect(() => {
        const fetchStudentsForClass = async () => {
            if (!selectedAllocationId) return;

            try {
                setLoadingStudents(true);
                const selectedAlloc = allocations.find(a => a.id.toString() === selectedAllocationId);

                if (!selectedAlloc) {
                    setLoadingStudents(false);
                    return;
                }

                // 1. Fetch students enrolled in this classroom
                // Using class_room_id from the allocation
                const studentsData = await teacherService.getStudents({
                    classroom_id: selectedAlloc.class_room_id,
                    school_id: user.school_id,
                    current_status: 'active',
                    page_size: 100 // Fetch larger batch for class list
                });

                const studentList = studentsData.results || studentsData || [];

                // 2. Fetch current attendance for this allocation/date to pre-fill
                // Note: The attendance endpoint filters are not fully standardized in my verified list
                // but usually it is GET /attendance/?course_allocation_id=X&date=Y
                const currentAttendance = await teacherService.getAttendance({
                    course_allocation_id: selectedAllocationId,
                    date: attendanceDate
                });

                const attendanceMap = {};
                (currentAttendance.results || currentAttendance || []).forEach(record => {
                    attendanceMap[record.student_id] = {
                        status: record.status ? (record.status.charAt(0).toUpperCase() + record.status.slice(1)) : 'Present', // Defaulting normalization
                        id: record.id
                    };
                });

                setStudents(studentList.map(s => ({
                    ...s,
                    attendance_status: attendanceMap[s.user_id]?.status || null,
                    attendance_record_id: attendanceMap[s.user_id]?.id || null,
                    behavior: null // Reset local behavior state on fetch
                })));
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoadingStudents(false);
            }
        };

        if (selectedAllocationId) {
            fetchStudentsForClass();
        }
    }, [selectedAllocationId, attendanceDate, allocations.length]); // Dependencies

    const handleAttendanceStatus = (studentId, status) => {
        setStudents(prev => prev.map(s => s.user_id === studentId ? { ...s, attendance_status: status } : s));
    };

    const handleSaveAttendance = async () => {
        if (!selectedAllocationId) return;

        try {
            setSaving(true);
            const attendanceRecords = students
                .filter(s => s.attendance_status)
                .map(s => ({
                    student_id: s.user_id,
                    status: s.attendance_status.toLowerCase(),
                    date: attendanceDate,
                    course_allocation_id: parseInt(selectedAllocationId)
                }));

            if (attendanceRecords.length === 0) {
                // Keep notification simple for now
                alert('No attendance marked yet.');
                setSaving(false);
                return;
            }

            // Using Promise.all for now - ideally backend supports bulk create
            await Promise.all(attendanceRecords.map(record => teacherService.recordAttendance(record)));

            // Allow UI to reflect success properly
            setTimeout(() => alert('Attendance saved successfully!'), 100);

        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Failed to save attendance.");
        } finally {
            setSaving(false);
        }
    };

    const handleBehavior = (studentId, type) => {
        setStudents(prev => prev.map(s => s.user_id === studentId ? { ...s, behavior: type } : s));
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = attendanceFilter === 'all' ||
            (attendanceFilter === 'marked' && s.attendance_status) ||
            (attendanceFilter === 'unmarked' && !s.attendance_status) ||
            s.attendance_status === attendanceFilter;
        return matchesSearch && matchesFilter;
    });

    const selectedAllocation = allocations.find(a => a.id.toString() === selectedAllocationId);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-6 pb-12 px-4 sm:px-6"
        >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('teacher.classes.title')}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Manage your classes, track attendance, and log student behavior.
                    </p>
                </div>

                {/* Global Controls */}
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="relative">
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="pl-3 pr-2 py-2 text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
                        />
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="relative min-w-[200px]">
                        {loadingAllocations ? (
                            <div className="px-3 py-2 text-sm text-gray-400">Loading classes...</div>
                        ) : (
                            <select
                                value={selectedAllocationId}
                                onChange={(e) => setSelectedAllocationId(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 text-sm font-bold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none"
                            >
                                {allocations.map(alloc => (
                                    <option key={alloc.id} value={alloc.id}>
                                        {alloc.course_name || alloc.subject} - {alloc.classroom_name || alloc.class}
                                    </option>
                                ))}
                                {allocations.length === 0 && <option value="">No active classes found</option>}
                            </select>
                        )}
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Students</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{loadingStudents ? "-" : students.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Present</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                            {loadingStudents ? "-" : students.filter(s => s.attendance_status === 'Present').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UserCheck size={20} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Absent</p>
                        <p className="text-2xl font-black text-rose-600 mt-1">
                            {loadingStudents ? "-" : students.filter(s => s.attendance_status === 'Absent').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Late</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">
                            {loadingStudents ? "-" : students.filter(s => s.attendance_status === 'Late').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </motion.div>
            </div>

            {/* Main Content Area */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden min-h-[500px] flex flex-col hover:shadow-xl transition-shadow">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('teacher.classes.searchStudent')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={attendanceFilter}
                                onChange={(e) => setAttendanceFilter(e.target.value)}
                                className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="all">All Students</option>
                                <option value="marked">Marked</option>
                                <option value="unmarked">Unmarked</option>
                                <option value="Present">Present Only</option>
                                <option value="Absent">Absent Only</option>
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveAttendance}
                        disabled={saving || loadingStudents || students.length === 0}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${saving
                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-95'
                            }`}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : t('teacher.classes.saveChanges')}
                    </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4 sm:col-span-3">Student Name</div>
                    <div className="col-span-2 hidden sm:block">Status</div>
                    <div className="col-span-4 sm:col-span-4 text-center">Mark Attendance</div>
                    <div className="col-span-4 sm:col-span-3 text-right">Behavior</div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-gray-50">
                    {loadingStudents ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-3 flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="col-span-2 hidden sm:block">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="col-span-4 flex justify-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                                <div className="col-span-3 flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </div>
                        ))
                    ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={student.user_id}
                                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 transition-colors group"
                            >
                                {/* Name */}
                                <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                        {student.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{student.full_name}</p>
                                        <p className="text-[10px] text-gray-400 hidden sm:block">ID: {student.user_id}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="col-span-2 hidden sm:block">
                                    {student.attendance_status ? (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${student.attendance_status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                            student.attendance_status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {student.attendance_status}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Not marked</span>
                                    )}
                                </div>

                                {/* Attendance Buttons */}
                                <div className="col-span-4 sm:col-span-4 flex justify-center items-center gap-2">
                                    {['Present', 'Absent', 'Late'].map((status) => {
                                        const isActive = student.attendance_status === status;
                                        let activeClass = '';
                                        let icon = null;

                                        if (status === 'Present') { activeClass = 'bg-emerald-500 text-white shadow-emerald-200'; icon = <Check size={14} />; }
                                        if (status === 'Absent') { activeClass = 'bg-rose-500 text-white shadow-rose-200'; icon = <AlertTriangle size={14} />; }
                                        if (status === 'Late') { activeClass = 'bg-amber-500 text-white shadow-amber-200'; icon = <AlertTriangle size={14} />; }

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleAttendanceStatus(student.user_id, status)}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive
                                                    ? `${activeClass} shadow-md scale-105`
                                                    : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                                    }`}
                                                title={`Mark ${status}`}
                                            >
                                                {isActive ? icon : status.charAt(0)}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Behavior */}
                                <div className="col-span-4 sm:col-span-3 flex justify-end items-center gap-2">
                                    <button
                                        onClick={() => handleBehavior(student.user_id, 'Positive')}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${student.behavior === 'Positive'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'text-gray-300 hover:bg-emerald-50 hover:text-emerald-500'
                                            }`}
                                    >
                                        <UserCheck size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleBehavior(student.user_id, 'Negative')}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${student.behavior === 'Negative'
                                            ? 'bg-rose-100 text-rose-600'
                                            : 'text-gray-300 hover:bg-rose-50 hover:text-rose-500'
                                            }`}
                                    >
                                        <AlertTriangle size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Users size={24} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No students found</h3>
                            <p className="text-gray-500 text-sm max-w-xs mt-1">Try adjusting your filters or select a different class.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ClassManagement;
