import React, {useEffect, useState, useRef} from "react";
import UserListModal, {SimpleUser} from "../components/UserListModal";
import { useAuth } from "../context/AuthContext";
import { getAvatarURL } from "../utils/avatarUtils";

import {FaCamera, FaPen, FaSave, FaTimes} from "react-icons/fa";

import UserLayout from "./User/userLayout";
import ArtistLayout from "./Artist/artistLayout";
import './myProfile.css';


interface userData {
  id: string;
  username: string;
  email: string; 
  role: "User" | "Artist" | "Admin";
  status: string;
  createdAt: string;
  followersCount: number; 
  followingCount: number; 
  friendsCount: number;  
  avatar?: string;
  bio?: string; 
}


const MyProfile: React.FC = () => {
  const {authHeader} = useAuth();
  
  const [profile, setProfile] = useState<userData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalUsers, setModalUsers] = useState<SimpleUser[]>([]); 

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); 


  useEffect(() =>{
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: {...authHeader()},
          cache: "no-store"
        });

        if (!res.ok) throw new Error("Failed to load profile");
        
        const data = await res.json();
        setProfile(data);

        setEditBio(data.bio || ""); 
        setPreviewAvatar(data.avatar || null); 

      } catch (err: any) {
        setError(err.message); 
      } finally {
        setLoading(false); 
      }
    };
    fetchProfile();
   }, []);


   //Toggle Edit mode
   const handleEditToggle = () => {
     if (!profile) return;
     setIsEditing(!isEditing);

     if (isEditing) {
       setEditBio(profile.bio || "");
       setPreviewAvatar(profile.avatar || null);
       setSelectedFile(null);
     }
   };


   //Handle image selection
   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setSelectedFile(file);
       setPreviewAvatar(URL.createObjectURL(file));
     }
   };
   
   
   //Save changes
   const handleSave = async () => {
     if (!profile) return;

     try {
      const formData = new FormData();
      formData.append("bio", editBio);

      if (selectedFile) {
        formData.append("avatar", selectedFile); 
      }

      const headers = authHeader() as any; 

      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Authorization": headers.Authorization 
        }, 
        body: formData
      });

      if (!res.ok) throw new Error("Could not update profile"); 

      const updatedData = await res.json(); 
      setProfile(updatedData);
      setPreviewAvatar(null);
      setSelectedFile(null);

      setIsEditing(false);

     } catch (err: any) {
       alert("Error updating profile: " + err.message); 
     }
   };


   const handleStatClick = async (type: "followers" | "following" |  "friends") => {
     //Don't open if count is 0 
     const count = type === "followers" ? profile?.followersCount :
                   type === "following" ? profile?.followingCount :
                   profile?.friendsCount; 
                   
     if (count === 0) return; 

     try {
      const res = await fetch(`http://localhost:5000/api/users/${profile?.id}/${type}`, {
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
     }
   };


  if (loading) return <div className="loading">Loading...</div> 
  if (error) return <div className="error">⚠️ {error}</div>
  if (!profile) return null; 

  const ProfileLayout = profile.role === "Artist" ? ArtistLayout : UserLayout;
  
  
   return(
    <ProfileLayout>  
    <div className="profile_page">
     <div className="profile_card">
      <div className="profile_header"></div>

      <div className="profile_content">

       {/*Avatar section*/}
       <div className="profile_avatar-wrapper">
        <div className="profile_avatar">
         <img 
          src={previewAvatar || (profile.avatar ? profile.avatar : getAvatarURL(profile.username))}
          alt={profile.username}
          className="avatar_img"
         />
        </div>

        {/*Camera icon (in Edit mode)*/}
        {isEditing && (
          <div
           className="avatar_edit-overlay"
           title="Change profile picture"
           onClick={() => fileInputRef.current?.click()}
          >
           <FaCamera/>

           <input
            type="file"
            ref={fileInputRef}
            style={{display: "none"}}
            onChange={handleImageChange}
            accept="image/*"
           />
          </div>
        )}
       </div>

       
       <div className="profile_body">

        {/*Username and actions row*/}
        <div className="profile_identity_row">
         <h2>{profile.username}</h2>

         {!isEditing ? (
           <button className="btn_icon_text edit" onClick={handleEditToggle}>
             <FaPen/> <span>Edit</span>
           </button>
         ) : (
           <div className="edit_actions_group">
            <button className="btn_icon_text save" onClick={handleSave}>
              <FaSave/> <span>Save</span>
            </button>

            <button className="btn_icon cancel" onClick={handleEditToggle}>
              <FaTimes/>
            </button>
           </div>
         )}
        </div>

        <span className="profile_badge">{profile.role}</span>

        {/*Bio section*/}
        <div className="profile_bio-wrapper">
         {isEditing ? (
          <textarea
           className="bio_input"
           value={editBio}
           placeholder="Tell us about yourself..."
           onChange={(e) => setEditBio(e.target.value)}
           maxLength={150}
          />

          ) : (
            <p className={`profile_bio ${!profile.bio ? 'empty' : ''}`}>
              {profile.bio || "No bio added yet"}
            </p> 
          )}
        </div>

        {/*Stats section*/}
        <div className="profile_stats-container">
   
          <div
           className={`stat-box ${profile.friendsCount > 0 ? 'clickable' : ''}`}
           onClick={() => handleStatClick("friends")}
          >
            <span className="stat-value">{profile.friendsCount}</span>
            <span className="stat-label">Friends</span>
          </div>

          <div
           className={`stat-box ${profile.followingCount > 0 ? 'clickable' : ''}`}
           onClick={() => handleStatClick("following")}
          >
            <span className="stat-value">{profile.followingCount}</span>
            <span className="stat-label">Following</span>
          </div>

          {profile.role === "Artist" && (
            <div
             className={`stat-box ${profile.followersCount > 0 ? 'clickable' : ''}`}
             onClick={() => handleStatClick("followers")}
            >
              <span className="stat-value">{profile.followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
          )}
        </div>


        {/*Modal list*/}
        {modalOpen && (
         <UserListModal
          title={modalTitle}
          users={modalUsers} 
          onClose={() => setModalOpen(false)}
         /> 
        )}


        {/*Details footer*/}
        <div className="profile_details-grid">
         <div className="detail_item">
          <label>Email</label>
          <p>{profile.email}</p>
         </div>

         <div className="detail_item">
           <label>Member Since: </label>  
           <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
         </div>
        </div>

       </div>

        
      </div>
     </div>  
    </div>  
   </ProfileLayout>
   ); 
};


export default MyProfile; 