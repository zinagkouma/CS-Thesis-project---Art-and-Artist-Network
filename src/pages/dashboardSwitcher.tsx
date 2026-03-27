import React from 'react';
import { useAuth } from '../context/AuthContext';

import UserOverview from './User/userOverview';
import ArtistOverview from './Artist/artistOverview';
import AdminUsers from './Admin/adminUsers';


const DashboardSwitcher: React.FC = () => {

    const { user } = useAuth();

    if (!user) return null; 

    switch (user.role) {
        case 'User':
            return <UserOverview />;
        case 'Artist':
            return <ArtistOverview />;
        case 'Admin':
            return <AdminUsers />;
        default:
            return <div>Invalid role</div>;
    }
};

export default DashboardSwitcher;