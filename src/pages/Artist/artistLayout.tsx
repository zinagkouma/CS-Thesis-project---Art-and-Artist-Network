import React, {ReactNode} from 'react';
import { NavLink } from 'react-router-dom';
import './artistLayout.css'

import dashboardIcon from '../../assets/icons/dashboard.png'
import eventIcon from '../../assets/icons/event.png';
import statsIcon from '../../assets/icons/chart-analysis.png'
import settingIcon from '../../assets/icons/setting.png'


type Props = {children?: ReactNode};
 

const ArtistLayout: React.FC<Props> = ({children}) => {
  
  return (
    <div className="artist-shell">
      <aside className="artist-sidebar">
        <h3 className="artist-title">Artist</h3>
        <div className="artist-nav">

          <NavLink
            to="/artist/overview"
            className={({ isActive }) => `artist-link ${isActive ? 'active' : ''}`}
          >
          <img src={dashboardIcon} alt="" className="artist-icon" />
            Overview
          </NavLink>

          <NavLink
            to="/artist/events"
            className={({ isActive }) => `artist-link ${isActive ? 'active' : ''}`}
          >
          <img src={eventIcon} alt="" className="artist-icon" />  
            Events
          </NavLink>

          <NavLink
            to="/artist/statistics"
            className={({ isActive }) => `artist-link ${isActive ? 'active' : ''}`}
          >
          <img src={statsIcon} alt="" className="artist-icon" />  
            Statistics
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `artist-link ${isActive ? 'active' : ''}`}
          >
          <img src={settingIcon} alt="" className="artist-icon" />  
            Settings
          </NavLink>
          

        </div>
      </aside>

     <main className='artist-content'>
      {children}
     </main>

 </div>

  );
};  


export default ArtistLayout; 