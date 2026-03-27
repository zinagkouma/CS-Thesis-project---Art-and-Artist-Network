import React, {useEffect, useState, useRef} from 'react';
import UserListModal, {SimpleUser} from '../components/UserListModal';
import {useParams} from 'react-router-dom'; 
import {useAuth} from '../context/AuthContext';
import {getAvatarURL} from '../utils/avatarUtils';
import FriendButton from '../components/FriendButton';

import { FaEllipsisV } from 'react-icons/fa';

import UserLayout from './User/userLayout';
import ArtistLayout from './Artist/artistLayout';
import './userProfile.css';



type UserProfileData = {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "User" | "Artist";
  createdAt: string;
  followingCount: number;
  followersCount: number;   
  isFollowing: boolean; 
  friendsCount: number; 
  canViewFriends: boolean; 
}


const UserProfile: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const {authHeader, user} = useAuth();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false); 

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalUsers, setModalUsers] = useState<SimpleUser[]>([]); 

  const [showMenu, setShowMenu] = useState(false); 
  const menuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false); 
      } 
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }; 
  });


  useEffect(() => {
    const fetchProfile = async () => {
      
      try {
       const res = await fetch(`http://localhost:5000/api/users/${id}/public-profile`, {
        headers: authHeader()
       });
       console.log("Response status:", res.status);
       
       if (!res.ok) throw new Error("Could not fetch profile");

       const data = await res.json();
       
       setProfile(data);
       setIsFollowing(data.isFollowing);
       setIsBlocked(data.isBlocked); 

      } catch (err) {
        setError("User not found")
      } finally {
        setLoading(false); 
      }
    };
    
    if (id) fetchProfile();
  }, [id]);

  
  //Toggle follow/unfollow 
  const handleFollowToggle = async () => {
    try {
     const res = await fetch(`http://localhost:5000/api/users/${id}/follow`, {
       method: "POST",
       headers: authHeader()
     });
     
     if (!res.ok) throw new Error("Action failed");

     const data = await res.json();
     setIsFollowing(data.isFollowing);
     
     if (profile) {
      setProfile({...profile, followersCount: data.followersCount});
     }
    } catch (err) {
      console.error(err); 
    } 
  };


  const handleStatClick = async (type: "followers" | "following" | "friends") => {
     if (!profile) return;

     //Don't open if count is 0 
     const count = type === "followers" ? profile?.followersCount :
                   type === "following" ? profile?.followingCount :
                   profile?.friendsCount;

     if (count === 0) return; 

     try {
      const res = await fetch(`http://localhost:5000/api/users/${profile?._id}/${type}`, {
        headers: authHeader()
      });

      if (res.ok) {
        const data = await res.json();
        setModalUsers(data);
        setModalTitle(
          type === "followers" ? "Followers" : 
          type === "following" ? "Following" : 
          "Friends"
        ); 

        setModalOpen(true);
      }

     } catch (err) {
       console.error("Failed to fetch list", err);
       alert("You don't have permission for this action");
     }
   };


  //Handle user block 
  const handleBlockUser = async () => {
    try {
     const res = await fetch(`http://localhost:5000/api/users/${id}/block`, {
       method: "POST",
       headers: authHeader()
     }); 

     if (!res.ok) throw new Error("Failed to block/unblock user");

     const data = await res.json(); 
     setIsBlocked(data.isBlocked);
     setShowMenu(false);

     if (data.isBlocked) {
       setIsFollowing(false);
     }

    } catch (err) {
      console.error(err);
    } 
  }; 


  if (loading) return <div className='userProf_loading'>Loading...</div>;
  if (error || !profile) return <div className='userProf_error'>{error}</div>;

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-GB');
  const ProfileLayout = user?.role === "Artist" ? ArtistLayout : UserLayout; 

  
  return (
   <ProfileLayout> 
    <div className='userProf_page'>
      <div className='userProf_card'>
       
      <div className='userProf_header'></div>

      <div className='userProf_avatar'>
        <img 
         src={profile.avatar || getAvatarURL(profile.username)}
         alt={profile.username}
         className='userProf_image'
        />
      </div>

      <div className='userProf_body'>
       <div className='userProf_name-container'>
        <h2 className='userProf_name'>{profile.username}</h2>

         <div className='userProf_menu-wrapper' ref={menuRef}>
          <FaEllipsisV
           className='userProf_menu-icon'
           onClick={() => setShowMenu(!showMenu)}
          /> 

          {showMenu && (
            <div className='userProf_dropdown'>
             <button
              className='block_btn'
              onClick={handleBlockUser}
             >
               {isBlocked ? "Unblock User" : "Block User"}
             </button>
            </div>
          )}
         </div>


       </div> 
        <span className={`userProf_badge ${profile.role.toLowerCase()}`}>
          {profile.role}  
        </span>

          <div className='userProf_action-container'>

           <FriendButton 
             targetUserId={profile._id}
             targetUserRole={profile.role}
             targetUsername={profile.username} 
           />

           {profile.role === "Artist" && (
            <button
             className={`follow_btn ${isFollowing ? "unfollow" : "follow"}`}
             onClick={handleFollowToggle}
            >
             {isFollowing ? "Following" : "Follow"}
            </button>
           )}
          </div>
      

        <div className='userProf_stats'>
          <div
           className={`stat-box ${profile.friendsCount > 0 ? 'clickable' : ''}`}
           onClick={() => {
            if (profile.canViewFriends) handleStatClick("friends");
           }}
           title={!profile.canViewFriends ? "Friend list is private" : ""}
          >
            <span className="stat-value">{profile.friendsCount}</span>
            <span className="stat-label">Friends</span>
          </div>

          <div 
          className={`stat-box ${profile.followingCount > 0 ? 'clickable' : ''}`}
          onClick={() => handleStatClick("following")}
          >
            <span className='stat-value'>{profile.followingCount}</span>
            <span className='stat-label'>Following</span>
          </div>

          {profile.role === "Artist" && (
           <div 
            className={`stat-box ${profile.followersCount > 0 ? 'clickable' : ''}`}
            onClick={() => handleStatClick("followers")}
           >
            <span className='stat-value'>{profile.followersCount}</span>
            <span className='stat-label'>Followers</span>
           </div>
          )}
        </div> 
       
       {modalOpen && (
       <UserListModal 
         title={modalTitle} 
         users={modalUsers} 
         onClose={() => setModalOpen(false)} 
       />
      )}


       {/*Details footer*/}
       <div className='userProf_footer'>
        <div className='footer_item'>
          <span className='footer-label'>EMAIL</span>  
          <span className='footer-value'>{profile.email}</span>
        </div>

        <div className='footer_item'>
          <span className='footer-label'>MEMBER SINCE:</span>  
          <span className='footer-value'>{joinDate}</span>
        </div>
       </div>

      </div>
    </div>
  </div> 

 </ProfileLayout>
  );
};


export default UserProfile; 

