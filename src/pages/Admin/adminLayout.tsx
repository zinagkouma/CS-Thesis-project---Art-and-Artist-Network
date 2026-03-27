import React, {ReactNode} from 'react';
import { NavLink } from 'react-router-dom';
import './AdminLayout.css';

import eventIcon from '../../assets/icons/event.png';
import usersIcon from '../../assets/icons/user.png';
import statsIcon from '../../assets/icons/chart-analysis.png';
import settingIcon from '../../assets/icons/setting.png'

type Props = {children?: ReactNode};


const AdminLayout: React.FC<Props> = ({children}) => {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h3 className="admin-title">Admin</h3>
        <div className="admin-nav">

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
          <img src={usersIcon} alt="" className="admin-icon" />
            Users &amp; Roles
          </NavLink>

          <NavLink
            to="/admin/events"
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
          <img src={eventIcon} alt="" className="admin-icon" />  
            Events
          </NavLink>

          <NavLink
            to="/admin/statistics"
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
          <img src={statsIcon} alt="" className="admin-icon" />  
            Statistics
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
          <img src={settingIcon} alt="" className="admin-icon" />  
            Settings
          </NavLink>

        </div>
      </aside>

     <main className='admin-content'>
      {children}
     </main>

 </div>
  );
};

export default AdminLayout;
