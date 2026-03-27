import React from 'react';
import {Link} from 'react-router-dom';
import {getAvatarURL} from '../utils/avatarUtils';

import './UserListModal.css';



export interface SimpleUser {
  _id: string;
  username: string;
  role: string;
  avatarUrl?: string;   
}

interface UserListModalProps {
  title: string;
  users: SimpleUser[];
  onClose: () => void;   
}


const UserListModal: React.FC<UserListModalProps> = ({title, users, onClose}) => {
  return (
    <div className='modal_backdrop' onClick={onClose}>
     <div className='modal_content' onClick={(e) => e.stopPropagation()}>
       <div className='modal_header'>
        <h3>{title}</h3> 
        <button className='close-btn' onClick={onClose}>&times;</button>
       </div>

       <div className='modal_list'>
        {users.map((u) => (
          <Link key={u._id} to={`/profile/${u._id}`} className='modal_item' onClick={onClose}>
            <img 
             src={u.avatarUrl && !u.avatarUrl.includes("ui-avatars") ? u.avatarUrl : getAvatarURL(u.username)}
             alt={u.username}
             className='modal_avatar' 
            />

            <div className='modal_info'>
             <span className='modal_username'>{u.username}</span>
             <span className='modal_role'>{u.role}</span>
            </div>
          </Link>  
        ))}
       </div>  

     </div>
    </div>
  );  
};


export default UserListModal; 