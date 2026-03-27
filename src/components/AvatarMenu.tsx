import React, {useEffect, useRef, useState} from "react";
import {useAuth} from "../context/AuthContext";
import {getAvatarURL} from "../utils/avatarUtils";

import './AvatarMenu.css';

import profileIcon from '../assets/icons/user1.png';
import logoutIcon from '../assets/icons/logout.png';



const AvatarMenu: React.FC = () => {
    const {user, logout, isAuthenticated} = useAuth();
    const [open, setOpen] = useState(false);

    const btnRef = useRef<HTMLButtonElement | null>(null); 
    const menuRef = useRef<HTMLUListElement | null>(null); 

    //Close when you click outside 
    useEffect(() =>{
        function onDocClick(e:MouseEvent){
            if (!open) return;
            const t = e.target as Node;

            if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)){
                setOpen(false); 
            }
        }
        document.addEventListener("mousedown", onDocClick);

        return () =>{
            document.removeEventListener("mousedown", onDocClick); 
        };

    }, [open]);

    if (!isAuthenticated || !user) return null; 


    return(
        <div className="avatarMenu">
           <button 
            ref ={btnRef}
            className="avatarMenu_button"
            onClick={() => setOpen(o => !o)}
            aria-haspopup = "menu"
            aria-expanded = {open}
            title = {user.username}
            >

             <div className="avatar-wrapper">
                <img 
                 src={user.avatar || getAvatarURL(user.username)}
                 alt={`${user.username} avatar`}
                 className="avatarMenu_img"
                 />
              
              <span className="avatar_status-dot" title="active now" />

             </div>  

            {/*Little arrow badge*/}
            <span className="avatarMenu_caret" aria-hidden>▾</span>
           </button> 

        {open && (
           <ul ref={menuRef} role="menu" className="avatarMenu_menu">

            <li className="avatarMenu_header" role="none">
             <strong>{user.username}</strong>
            </li>

            <li role="none">

             <button
               role="menuitem"
               className="avatarMenu_item"
               onClick={() => {
                 setOpen(false);
                 window.location.href = "/profile";
              }}
             >
              <img src={profileIcon} alt="" />
               View Profile
             </button>
            </li>

            

            <li role="none">
              <button
                role="menuitem"
                className="avatarMenu_item avatarMenu_danger"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
              <img src={logoutIcon} alt="" />
                Logout
              </button>
            </li>
          </ul>
                )}
                </div>
            );
        };

export default AvatarMenu; 