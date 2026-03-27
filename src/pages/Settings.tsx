import React, {useEffect, useState} from "react";
import {FaUserShield, FaBell, FaLock, FaTrashAlt} from "react-icons/fa";
import {useAuth} from "../context/AuthContext";
import {toast} from "react-toastify";
import Swal from "sweetalert2"; 
import { getAvatarURL } from "../utils/avatarUtils";


import UserLayout from "./User/userLayout";
import ArtistLayout from "./Artist/artistLayout";
import AdminLayout from "./Admin/adminLayout";

import './Settings.css';



type SettingsTab = "Account" | "Notifications" | "Privacy";


const Settings: React.FC = () => {
  const {user, authHeader} = useAuth(); 
  const [activeTab, setActiveTab] = useState<SettingsTab>("Account");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState(""); 
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false); 

  const [email, setEmail] = useState(""); 

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const [activeStatus, setActiveStatus] = useState(true);
  const [friendVisibility, setFriendVisibility] = useState("everyone");
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]); 


  //Fetch initial privacy settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
       const res = await fetch("http://localhost:5000/api/users/profile", {
         headers: authHeader()
       }); 
 
       if (res.ok) {
         const data = await res.json();

         setActiveStatus(data.showActiveStatus);
         setFriendVisibility(data.friendVisibility);
       }  

      } catch (err) {
        console.error("Could not load settings", err); 
      }
    };

    fetchSettings();
  }, []);


  //Handle password update
  const handlePassUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPass !== confirmPass) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
     setLoading(true);
     
     const res = await fetch("http://localhost:5000/api/users/change-password", {
       method: "PATCH",
       headers: {
        "Content-Type": "application/json",
         ...authHeader()
       },
       body: JSON.stringify({
         currentPassword: currentPass,
         newPassword: newPass
       }) 
     });

     const data = await res.json();

     if (!res.ok) {
       throw new Error(data.message || "Failed to update password"); 
     }

     toast.success("Password updated successfully!");

     setCurrentPass("");
     setNewPass("");
     setConfirmPass("");

    } catch (err: any) {
      toast.error(err.message);

    } finally {
      setLoading(false);
    }
  }; 


  //Handle email update
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]); 

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (email === user?.email) {
      toast.info("No changes made to email");
      return; 
    }

    try {
     setLoading(true);
     const res = await fetch("http://localhost:5000/api/users/update-email", {
       method: "PATCH",
       headers: {"Content-Type": "application/json", ...authHeader()},
       body: JSON.stringify({newEmail: email})
     });
     
     const data = await res.json();
     if (!res.ok) throw new Error(data.message);

     toast.success("Email updated!"); 

    } catch (err: any) {
      toast.error(err.message);

    } finally {
      setLoading(false); 
    }
  };


  //Handle account deletion
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      cancelButtonColor:'#d33',
      confirmButtonText: "Yes",
      confirmButtonColor: '#25b795ff'
    });

    if (result.isConfirmed) {
      try {
       const res = await fetch("http://localhost:5000/api/users/delete-account", {
         method: "DELETE",
         headers: authHeader()
       });
       
       if (!res.ok) throw new Error("Could not delete account");

       await Swal.fire(
        "Deleted",
        "Your account has been deleted",
        "success"
       );

       //Logout and redirect
       localStorage.removeItem("token");
       localStorage.removeItem("user");
       window.location.href = "/";
         
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: err.message,
        }); 
      }
    }
  };


  //Hadle notification preferences update
  const handleNotificationToggle = async (type: "email" | "inApp", currentValue: boolean) => {
    //Update UI 
    const newValue = !currentValue;
    if (type === "email") setEmailNotifications(newValue);
    if (type === "inApp") setInAppNotifications(newValue);

    //Send update to backend
    try {
     const bodyPayload = type === "email"
          ? {emailNotifications: newValue}
          : {inAppNotifications: newValue}; 

     const res = await fetch("http://localhost:5000/api/users/notifications", {
       method: "PATCH",
       headers: {"Content-Type": "application/json", ...authHeader()},
       body: JSON.stringify(bodyPayload)
     });
     
     if (!res.ok) throw new Error("Could not save preference"); 
     
     toast.success("Preferences updated!");

    } catch (err: any) {
      //Revert UI
      toast.error(err.message); 
      if (type === 'email') setEmailNotifications(currentValue);
      if (type === 'inApp') setInAppNotifications(currentValue);
    }
  }; 


  //Handle activity status toggle and friend list change
  const handleActiveStatusToggle = async () => {
    const newValue = !activeStatus;
    setActiveStatus(newValue);

    try {
     const res = await fetch("http://localhost:5000/api/users/privacy", {
       method: "PATCH",
       headers: {"Content-Type": "application/json", ...authHeader()},
       body: JSON.stringify({showActiveStatus: newValue})
     });
     
     if (!res.ok) throw new Error("Could not save setting");

     toast.success("Setting updated!");

    } catch (err: any) {
      toast.error(err.message);
      setActiveStatus(!newValue);  
    }
  };

  const handleFriendVisibilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const oldValue = friendVisibility;

    setFriendVisibility(newValue); 

    try {
     const res = await fetch("http://localhost:5000/api/users/privacy", {
       method: "PATCH",
       headers: {"Content-Type": "application/json", ...authHeader()},
       body: JSON.stringify({friendVisibility: newValue}) 
     }); 

     if (!res.ok) throw new Error("Could not save setting");

     toast.success("Setting updated!");

    } catch (err: any) {
      toast.error(err.message);
      setFriendVisibility(oldValue); 
    }
  };


  //Fetch blocked users when you open "Privacy" tab
  useEffect(() => {
    if (activeTab === "Privacy") {
      const fetchBlockedUsers = async () => {
        try {
         const res = await fetch("http://localhost:5000/api/users/blocked", {
           headers: authHeader()
         });

         if (res.ok) {
           const data = await res.json();
           setBlockedUsers(data); 
         }

        } catch (err) {
          console.error("Could not fetch data", err); 
        }
      };

      fetchBlockedUsers();
    }
  }, [activeTab]);


  //Handle unblock
  const handleUnblock = async (targetId: string) => {
    try {
     const res = await fetch(`http://localhost:5000/api/users/${targetId}/block`, {
       method: "POST",
       headers: authHeader() 
     }); 
     
     if (!res.ok) throw new Error("Could not unblock user");

     setBlockedUsers(prev => prev.filter(u => u._id !== targetId));
     toast.success("User unblocked!");

    } catch (err: any) {
      toast.error(err.message); 
    }
  };


  //Render content helpers
  const renderAccountSecurity = () => (
    <div className="setting_section">
     <div className="setting_header">  
      <h2>Account & Security</h2>
      <p className="setting_desc">Manage your login details and account security.</p>
     </div>

     <div className="setting_grid">
      {/*Update password*/}
      <div className="setting_card">
       <h3>Update Password</h3>
       <form className="settings_form" onSubmit={handlePassUpdate}>
        <div className="form_group">
         <label>Current Password</label>
         <input
          type="password"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
          placeholder="••••••••" 
          required
          />
        </div>

        <div className="form_group">
         <label>New Password</label>
         <input 
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          placeholder="••••••••"
          required
          />
        </div>

        <div className="form_group">
         <label>Confirm New Password</label>
         <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          placeholder="••••••••"
          required
          />
        </div>

        <button
         className="btn-primary"
         disabled={loading}
         >
          {loading ? "Updating..." : "Update Password"}
         </button>

       </form>
      </div>


      {/*Update Email & Account delete*/}
      <div className="settings_column">
       <div className="setting_card">
        <h3>Update Email Address</h3>
        <form className="settings_form" onSubmit={handleEmailUpdate}>
          <div className="form_group">
           <label>Email Address</label>
           <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
           />
          </div>

          <button className="btn-secondary" disabled={loading}>
            Save Email
          </button>

        </form>
       </div>

       <div className="setting_card danger">
        <div className="danger_header">
          <h3>Delete Account</h3>
          <FaTrashAlt className="danger_icon" />
        </div>
        <p>You cannot reverse this action, so choose carefully.</p>

        <button 
         className="btn-danger"
         type="button"
         onClick={handleDeleteAccount}
        >
         Delete my account
        </button>
       </div> 
      </div>

     </div> 
    </div> 
  );
    
  
const renderNotifications = () => (
  <div className="setting_section">
   <div className="setting_header">
    <h2>Notification Preferences</h2>
    <p className="setting_desc">Control how and when you want to be notified.</p>
   </div>

   <div className="setting_card single-col">
    <div className="toggle-row">
     <div className="toggle-info">
       <h3>Email Notifications</h3>
       <p>Receive emails about new followers, events, and account updates.</p>
     </div>

     <label className="switch">
       <input
        type="checkbox"
        checked={emailNotifications}
        onChange={() => handleNotificationToggle("email", emailNotifications)}
     />

       <span className="slider round"></span>
     </label>
    </div>

    <hr className="divider"/>

    <div className="toggle-row">
     <div className="toggle-info">
       <h3>In-App Notifications</h3>
       <p>Show notifications within the application dashboard.</p>
     </div>

     <label className="switch">
       <input
        type="checkbox"
        checked={inAppNotifications}
        onChange={() => handleNotificationToggle("inApp", inAppNotifications)}
       />

       <span className="slider round"></span>
     </label>
    </div>
   </div>
  </div>
);


const renderPrivacy = () => (
  <div className="setting_section">
   <div className="setting_header">
     <h2>Profile & Privacy</h2>
     <p className="setting_desc">Manage who can see your activity.</p>
   </div>

   <div className="setting_card single_col">
    <div className="toggle-row">
     <div className="toggle-info">
       <h3>Active Status</h3>
       <p>Allow others to see when you are currently online.</p>
     </div>

     <label className="switch">
       <input 
        type="checkbox"
        checked={activeStatus}
        onChange={handleActiveStatusToggle}
       />

       <span className="slider round"></span>
     </label>
    </div>

    <hr className="divider"/>

    <div className="form_group">
     <h3>Friend list visibility</h3>
     <p className="sub-text">Who can see your friends list?</p>

     <select 
      value={friendVisibility}
      className="settings_select"
      onChange={handleFriendVisibilityChange}
     >
       <option value="everyone">Everyone (Public)</option>
       <option value="friends">Friends Only</option>
       <option value="me">Only Me</option>
     </select>
    </div>

    <hr className="divider"/>

    <div className="blocked_section">
     <h3>Blocked Accounts</h3>
     <p className="sub-text">Users you have blocked will not be able to interact with you.</p>

     {/*Blocked list*/} 
     <div className="blocked_list">
       {blockedUsers.length === 0 ? (
        <div className="empty_state">You haven't blocked anyone yet.</div>
       ) : (
         blockedUsers.map((blockedUser) => (
          <div key={blockedUser._id} className="blocked_item"> 
           <div className="blocked_item-info">
             <img
              src={getAvatarURL(blockedUser.username)}
              alt={blockedUser.username}
              className="blocked_avatar"
             />

             <span className="blocked_name">{blockedUser.username}</span>
           </div>

           <button
            className="unblock_btn"
            onClick={() => handleUnblock(blockedUser._id)}
           >
            Unblock
           </button>
          </div>
         )) 

       )}
     </div>

    </div>

   </div>
  </div>
);


let Layout;
switch (user?.role) {
  case "Artist":
    Layout = ArtistLayout;
    break;

  case "Admin":
    Layout = AdminLayout;
    break;
    
  default:
    Layout = UserLayout;   
}


  return (
   <Layout>
    <div className="settings_container">
     <div className="settings_layout">
      
      {/*Header*/}
      <div className="settings_top-bar">
       <h1>Settings</h1>
       <div className="settings_tabs">
         <button
          className={`tab-item ${activeTab === "Account" ? "active" : ""}`}
          onClick={() => setActiveTab("Account")}
         >
           <FaUserShield className="tab-icon" />
           <span>Account</span>
         </button>

         <button
          className={`tab-item ${activeTab === "Notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("Notifications")}
         >
           <FaBell className="tab-icon" />
           <span>Notifications</span>
         </button>
          
         <button
          className={`tab-item ${activeTab === "Privacy" ? "active" : ""}`}
          onClick={() => setActiveTab("Privacy")}
         >
           <FaLock className="tab-icon" />
           <span>Privacy</span>
         </button> 
       </div>
      </div>


      {/*Main content*/}
      <main className="settings_content">
        {activeTab === "Account" && renderAccountSecurity()}
        {activeTab === "Notifications" && renderNotifications()}
        {activeTab === "Privacy" && renderPrivacy()}
      </main>

     </div>
    </div>
  </Layout>  
  );
}; 


export default Settings; 