import React, { useState } from 'react';
import { Plus, Search, MapPin, Users, Edit, CheckCircle, Eye, Trash2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Workstream.css';

const SchoolManagement = () => {
    const { t } = useTheme();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [schools, setSchools] = useState(() => {
        const saved = localStorage.getItem('ws_schools');
        return saved ? JSON.parse(saved) : [
            { id: 101, name: 'Al-Noor Academy', location: 'Gaza City', capacity: 500, students: 420, teachers: 25, performanceScore: 92, attendanceRate: 95, classrooms: 20, status: 'Active' },
            { id: 102, name: 'Gaza Central', location: 'Rafah', capacity: 400, students: 380, teachers: 22, performanceScore: 88, attendanceRate: 88, classrooms: 18, status: 'Active' },
        ];
    });

    React.useEffect(() => {
        localStorage.setItem('ws_schools', JSON.stringify(schools));
    }, [schools]);

    const [newSchool, setNewSchool] = useState({ 
        name: '', location: '', capacity: '', students: '', teachers: '', classrooms: '', 
        isEditing: false, id: null 
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [viewSchool, setViewSchool] = useState(null);

    const handleCreateSchool = (e) => {
        e.preventDefault();
        const schoolData = {
            name: newSchool.name,
            location: newSchool.location,
            capacity: parseInt(newSchool.capacity),
            students: parseInt(newSchool.students) || 0,
            teachers: parseInt(newSchool.teachers) || 0,
            classrooms: parseInt(newSchool.classrooms) || 0,
            attendanceRate: Math.floor(Math.random() * 20) + 80, // Random 80-100% since we don't input it
            performanceScore: Math.floor(Math.random() * 30) + 70 // Random 70-100%
        };

        if (newSchool.isEditing) {
            setSchools(schools.map(school =>
                school.id === newSchool.id
                    ? { ...school, ...schoolData }
                    : school
            ));
        } else {
            const school = {
                id: Date.now(),
                ...schoolData,
                status: 'Active'
            };
            setSchools([...schools, school]);
        }
        setNewSchool({ name: '', location: '', capacity: '', students: '', teachers: '', classrooms: '', isEditing: false, id: null });
        setShowCreateForm(false);
    };

    const handleActivateAll = () => {
        if (window.confirm(t('workstream.schools.confirmActivate'))) {
            setSchools(schools.map(school => ({ ...school, status: 'Active' })));
        }
    };

    const handleDeleteSchool = (id) => {
        if (window.confirm(t('workstream.schools.confirmDelete'))) {
            setSchools(schools.filter(school => school.id !== id));
        }
    };

    const handleEditSchool = (id) => {
        const schoolToEdit = schools.find(s => s.id === id);
        if (schoolToEdit) {
            setNewSchool({
                name: schoolToEdit.name,
                location: schoolToEdit.location,
                capacity: schoolToEdit.capacity,
                students: schoolToEdit.students,
                teachers: schoolToEdit.teachers,
                classrooms: schoolToEdit.classrooms,
                isEditing: true,
                id: schoolToEdit.id
            });
            setShowCreateForm(true);
        }
    };

    const filteredSchools = schools.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.schools.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.schools.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={handleActivateAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>
                            <CheckCircle size={18} />
                            {t('workstream.schools.activateAll')}
                        </button>
                        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                            <Plus size={20} />
                            {t('workstream.schools.create')}
                        </button>
                    </div>
                </div>
            </div>

            {showCreateForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>{newSchool.isEditing ? t('workstream.schools.form.editTitle') : t('workstream.schools.form.createTitle')}</h3>
                    <form onSubmit={handleCreateSchool} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '600px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.name')}</label>
                            <input
                                type="text"
                                required
                                value={newSchool.name}
                                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder={t('workstream.schools.form.name')}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.location')}</label>
                            <input
                                type="text"
                                required
                                value={newSchool.location}
                                onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder={t('workstream.schools.form.location')}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.capacity')}</label>
                            <input
                                type="number"
                                required
                                value={newSchool.capacity}
                                onChange={(e) => setNewSchool({ ...newSchool, capacity: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder={t('workstream.schools.form.capacity')}
                            />
                        </div>
                         <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.dashboard.totalStudents')}</label>
                            <input
                                type="number"
                                required
                                value={newSchool.students}
                                onChange={(e) => setNewSchool({ ...newSchool, students: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="Number of Students"
                            />
                        </div>
                         <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.dashboard.totalTeachers')}</label>
                            <input
                                type="number"
                                required
                                value={newSchool.teachers}
                                onChange={(e) => setNewSchool({ ...newSchool, teachers: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="Number of Teachers"
                            />
                        </div>
                         <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Classrooms</label>
                            <input
                                type="number"
                                required
                                value={newSchool.classrooms}
                                onChange={(e) => setNewSchool({ ...newSchool, classrooms: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="Number of Classrooms"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', gridColumn: 'span 2' }}>
                            <button type="submit" className="btn-primary">{newSchool.isEditing ? t('common.save') : t('common.create')}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewSchool({ name: '', location: '', capacity: '', students: '', teachers: '', classrooms: '', isEditing: false, id: null });
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewSchool && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="management-card" style={{ padding: '2rem', width: '500px', maxWidth: '90%', position: 'relative' }}>
                        <button
                            onClick={() => setViewSchool(null)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.schools.table.actions')}</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.name')}</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{viewSchool.name}</div>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.location')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} /> {viewSchool.location}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.capacity')}</label>
                                <div>{viewSchool.students} / {viewSchool.capacity} {t('workstream.schools.table.students')}</div>
                                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px' }}>
                                    <div style={{
                                        width: `${(viewSchool.students / viewSchool.capacity) * 100}%`,
                                        height: '100%',
                                        background: 'var(--color-primary)',
                                        borderRadius: '4px'
                                    }}></div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.status')}</label>
                                <div>
                                    <span className={`status-badge ${viewSchool.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                        {viewSchool.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('workstream.schools.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Filter placeholder */}
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('workstream.schools.table.name')}</th>
                            <th>{t('workstream.schools.table.location')}</th>
                            <th>{t('workstream.schools.table.capacity')}</th>
                            <th>{t('workstream.schools.table.status')}</th>
                            <th>{t('workstream.schools.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSchools.map((school) => (
                            <tr key={school.id}>
                                <td>
                                    <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{school.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{school.id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)' }}>
                                        <MapPin size={14} />
                                        {school.location}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Users size={14} color="var(--color-text-muted)" />
                                        <span>{school.students} / {school.capacity}</span>
                                    </div>
                                    <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                        <div style={{
                                            width: `${(school.students / school.capacity) * 100}%`,
                                            height: '100%',
                                            background: 'var(--color-primary)',
                                            borderRadius: '2px'
                                        }}></div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${school.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                        {school.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setViewSchool(school)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-text-main)' }}
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleEditSchool(school.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                            title="Edit School"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSchool(school.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                            title="Delete School"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchoolManagement;
