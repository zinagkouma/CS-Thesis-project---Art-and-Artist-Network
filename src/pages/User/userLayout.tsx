import React, {ReactNode} from 'react';
import { NavLink } from 'react-router-dom';
import './userLayout.css';

import dashboardIcon from '../../assets/icons/dashboard.png';
import eventIcon from '../../assets/icons/event.png';
import settingIcon from '../../assets/icons/setting.png';


type Props = {children?: ReactNode};

const UserLayout: React.FC<Props> = ({children}) => {
  return (
    <div className="user-shell">
      <aside className="user-sidebar">
        <h3 className="user-title">User</h3>
        <div className="user-nav">


          <NavLink
            to="/user/overview"
            className={({ isActive }) => `user-link ${isActive ? 'active' : ''}`}
          >
          <img src={dashboardIcon} alt="" className="user-icon" />
            Overview
          </NavLink>

          <NavLink
            to="/user/events"
            className={({ isActive }) => `user-link ${isActive ? 'active' : ''}`}
          >
          <img src={eventIcon} alt="" className="user-icon" />  
            Events
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `user-link ${isActive ? 'active' : ''}`}
          >
          <img src={settingIcon} alt="" className="user-icon" />  
            Settings
          </NavLink>
          

        </div>
      </aside>

     <main className='user-content'>
      {children}
     </main>

 </div>

  );
};  


export default UserLayout; 