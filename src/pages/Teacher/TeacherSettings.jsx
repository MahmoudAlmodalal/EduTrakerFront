import React, { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useAuth } from '../../context/AuthContext';
import { useTeacherProfile, useUpdateTeacherProfileMutation } from '../../hooks/useTeacherQueries';
import './Teacher.css';

const emptyProfessionalForm = {
    specialization: '',
    hire_date: '',
    employment_status: '',
    highest_degree: '',
    office_location: ''
};

const TeacherSettings = () => {
    const { user } = useAuth();
    const teacherUserId = useMemo(() => user?.id || user?.user_id || null, [user?.id, user?.user_id]);

    const {
        data: teacherProfileData,
        isLoading: loadingTeacherProfile
    } = useTeacherProfile(teacherUserId, {
        enabled: Boolean(teacherUserId)
    });

    const updateTeacherProfileMutation = useUpdateTeacherProfileMutation();

    const [professionalOverrides, setProfessionalOverrides] = useState({});

    const professionalForm = useMemo(() => ({
        specialization: professionalOverrides.specialization ?? teacherProfileData?.specialization ?? emptyProfessionalForm.specialization,
        hire_date: professionalOverrides.hire_date ?? teacherProfileData?.hire_date ?? emptyProfessionalForm.hire_date,
        employment_status: professionalOverrides.employment_status ?? teacherProfileData?.employment_status ?? emptyProfessionalForm.employment_status,
        highest_degree: professionalOverrides.highest_degree ?? teacherProfileData?.highest_degree ?? emptyProfessionalForm.highest_degree,
        office_location: professionalOverrides.office_location ?? teacherProfileData?.office_location ?? emptyProfessionalForm.office_location
    }), [professionalOverrides, teacherProfileData]);

    const handleSaveProfessionalInfo = async (event) => {
        event.preventDefault();

        if (!teacherUserId) {
            toast.error('Teacher profile not found for this account.');
            return;
        }

        const payload = {
            specialization: professionalForm.specialization || null,
            hire_date: professionalForm.hire_date || null,
            employment_status: professionalForm.employment_status || null,
            highest_degree: professionalForm.highest_degree || null,
            office_location: professionalForm.office_location || null
        };

        try {
            await updateTeacherProfileMutation.mutateAsync({
                userId: teacherUserId,
                payload
            });
            setProfessionalOverrides({});
            toast.success('Professional information updated.');
        } catch (error) {
            toast.error(error?.message || 'Failed to update professional information.');
        }
    };

    return (
        <div className="teacher-page" style={{ gap: '1.2rem' }}>
            <UnifiedSettingsPage
                title="Teacher Settings"
                subtitle="Manage your profile, preferences, and account security settings."
            />

            <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Professional Info</h3>
                    <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                        Teacher-specific profile fields for staffing and academic management.
                    </p>
                </div>

                {loadingTeacherProfile ? (
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading professional profile...</p>
                ) : (
                    <form onSubmit={handleSaveProfessionalInfo} style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    value={professionalForm.specialization}
                                    onChange={(event) => setProfessionalOverrides((prev) => ({ ...prev, specialization: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Hire Date
                                </label>
                                <input
                                    type="date"
                                    value={professionalForm.hire_date}
                                    onChange={(event) => setProfessionalOverrides((prev) => ({ ...prev, hire_date: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Employment Status
                                </label>
                                <select
                                    value={professionalForm.employment_status}
                                    onChange={(event) => setProfessionalOverrides((prev) => ({ ...prev, employment_status: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                >
                                    <option value="">Select status</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="substitute">Substitute</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Highest Degree
                                </label>
                                <input
                                    type="text"
                                    value={professionalForm.highest_degree}
                                    onChange={(event) => setProfessionalOverrides((prev) => ({ ...prev, highest_degree: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Office Location
                                </label>
                                <input
                                    type="text"
                                    value={professionalForm.office_location}
                                    onChange={(event) => setProfessionalOverrides((prev) => ({ ...prev, office_location: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={updateTeacherProfileMutation.isPending}
                                style={{ opacity: updateTeacherProfileMutation.isPending ? 0.7 : 1 }}
                            >
                                <Save size={15} />
                                {updateTeacherProfileMutation.isPending ? 'Saving...' : 'Save Professional Info'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TeacherSettings;
