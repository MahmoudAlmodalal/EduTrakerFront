import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CommunicationView from '../../components/shared/Communication/CommunicationView';

const GeneralCommunication = () => {
    const { user } = useAuth();

    // Normalize role for CommunicationView
    const roleMap = {
        'SUPER_ADMIN': 'super_admin',
        'WORKSTREAM_MANAGER': 'workstream_manager',
        'SCHOOL_MANAGER': 'school_manager',
        'SECRETARY': 'secretary',
        'TEACHER': 'teacher',
        'GUARDIAN': 'guardian',
        'STUDENT': 'student'
    };

    const role = roleMap[user?.role] || user?.role?.toLowerCase() || 'staff';

    return <CommunicationView role={role} />;
};

export default GeneralCommunication;
