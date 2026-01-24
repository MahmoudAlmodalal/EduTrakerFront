import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Users,
    Plus,
    MoreVertical,
    Search,
    Edit,
    Trash
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../utils/api';
import './SchoolManager.css';

const DepartmentManagement = () => {
    const { t } = useTheme();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGrade, setCurrentGrade] = useState(null);
    const [formData, setFormData] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });

    useEffect(() => {
        const fetchGrades = async () => {
            setLoading(true);
            try {
                const response = await api.get('/school/grades/');
                setGrades(response.results || response);
            } catch (error) {
                console.error('Failed to fetch grades:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    const openModal = (grade = null) => {
        if (grade) {
            setCurrentGrade(grade);
            setFormData({
                name: grade.name,
                numeric_level: grade.numeric_level,
                min_age: grade.min_age,
                max_age: grade.max_age
            });
        } else {
            setCurrentGrade(null);
            setFormData({ name: '', numeric_level: '', min_age: '', max_age: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentGrade) {
                const response = await api.patch(`/school/grades/${currentGrade.id}/`, formData);
                setGrades(grades.map(g => g.id === currentGrade.id ? response : g));
            } else {
                const response = await api.post('/school/grades/create/', formData);
                setGrades([...grades, response]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save grade:', error);
            alert('Failed to save. Please verify your permissions.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this grade?')) {
            try {
                await api.post(`/school/grades/${id}/deactivate/`);
                setGrades(grades.filter(g => g.id !== id));
            } catch (error) {
                console.error('Failed to deactivate grade:', error);
            }
        }
    };

    if (loading) return <div className="department-management-page">Loading...</div>;

    return (
        <div className="department-management-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Grade & Levels Management</h1>
                <p className="school-manager-subtitle">Manage school grades, age requirements and levels.</p>
            </div>

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search grades..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add New Grade
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Grade Name</th>
                            <th>Level</th>
                            <th>Age Range</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade) => (
                            <tr key={grade.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ padding: '6px', background: 'var(--color-primary-light)', borderRadius: '6px', color: 'var(--color-primary)' }}>
                                            <Briefcase size={16} />
                                        </div>
                                        <span className="font-medium text-gray-900">{grade.name}</span>
                                    </div>
                                </td>
                                <td>Level {grade.numeric_level}</td>
                                <td>{grade.min_age} - {grade.max_age} years</td>
                                <td>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        fontSize: '12px',
                                        background: grade.is_active ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                        color: grade.is_active ? 'var(--color-success)' : 'var(--color-error)'
                                    }}>
                                        {grade.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openModal(grade)} className="icon-btn" style={{ padding: '4px', color: 'var(--color-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(grade.id)} className="icon-btn" style={{ padding: '4px', color: 'var(--color-error)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>{currentGrade ? 'Edit Grade' : 'Create Grade'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Grade Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Numeric Level</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.numeric_level}
                                    onChange={e => setFormData({ ...formData, numeric_level: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Min Age</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.min_age}
                                        onChange={e => setFormData({ ...formData, min_age: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Max Age</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.max_age}
                                        onChange={e => setFormData({ ...formData, max_age: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentManagement;

