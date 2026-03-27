import React, {useState, useEffect, useRef} from 'react'
import {useAuth} from '../context/AuthContext';
import logo from '../assets/Event Finder.png';
import {Link, useNavigate} from 'react-router-dom';
import {getAvatarURL} from '../utils/avatarUtils';

import {FaSearch, FaBell, FaComment} from 'react-icons/fa';
import AvatarMenu from './AvatarMenu';

import './Navbar.css';



interface NavbarProps {
  onLoginClick: () => void;
}

type SearchResult = {
  _id: string;
  avatar?: string;
  username: string; 
  role: "User" | "Artist"; 
};

type Notification = {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender?: {_id: string; username: string; avatar?: string};  
  eventId?: string;
};


const Navbar: React.FC<NavbarProps> = ({onLoginClick}) => {
   
  const {isAuthenticated, user, authHeader} = useAuth();
  console.log('Current user:', user);
  const navigate = useNavigate();

  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotCount, setUnreadNotCount] = useState(0);
  const [showNotDropdown, setShowNotDropdown] = useState(false); 

  //Search timeout
  const searchTimeout = useRef<NodeJS.Timeout | null>(null); 


  //Handle outside click
  const notRef = useRef<HTMLDivElement>(null);

  useEffect (() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notRef.current && !notRef.current.contains(event.target as Node)) {
        setShowNotDropdown(false); 
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.trim().length > 0) {
      //Wait 300ms after user stops typing to fetch
      searchTimeout.current = setTimeout(() =>{
        fetchUsers(val);
      }, 300);
      setResults([]);
      setShowDropdown(false); 
    }
  };


  const handleResultClick = (userId: string) => {
    setShowDropdown(false);
    setQuery("");

    //Navigate to user's profile 
    navigate(`/profile/${userId}`);
  };


  const handleNotificationClick = (not: Notification) => {
    setShowNotDropdown(false);

    if (not.type === "event_published" && not.eventId) {
      navigate(`/events/${not.eventId}`);

    } else if (not.sender?._id) {
      navigate(`/profile/${not.sender._id}`); 
    }
  }; 


  const fetchUsers = async (search: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/search/public?q=${search}`)
      if (res.ok) {
        const data = await res.json(); 
        setResults(data); 
        setShowDropdown(true);
      }

    } catch (err) {
      console.error("Search failed");
    }
  };


  //Fetch unread messages and notifications 
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
         const chatRes = await fetch("http://localhost:5000/api/chat/unread/count", {
           headers: authHeader()
         }); 

         const chatData = await chatRes.json();
         setUnreadCount(chatData.count);

         const notRes = await fetch("http://localhost:5000/api/notifications", {
           headers: authHeader() 
         });

         const notData = await notRes.json();
         setNotifications(notData.notifications);
         setUnreadNotCount(notData.unreadCount);

        } catch (err) {
          console.error(err);
        }
      };

      fetchData();

      //Update every 10s
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval); 
    }
  }, [isAuthenticated]); 


  //Handle bell icon click
  const handleBellIcon = async () => {
    setShowNotDropdown(!showNotDropdown);
    
    //Mark all notifications as read
    if (!showNotDropdown && unreadNotCount > 0) {
      try {
       await fetch("http://localhost:5000/api/notifications/mark-read", {
         method: "PATCH",
         headers: authHeader()
       }); 

       setUnreadNotCount(0);

       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        
      } catch (err) {
        console.error("Could not mark as read", err); 
      }
    } 
  }; 


  const handleNotificationDelete = async (e: React.MouseEvent, notId: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n._id !== notId)); 

    try {
     await fetch(`http://localhost:5000/api/notifications/${notId}`, {
       method: "DELETE",
       headers: authHeader()
     });  

    } catch (err) {
      console.error("Could not delete notification", err);
    }
  };


  //Timestamp helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
  };

  
  return (
    <nav>
        <div className='logo'>
         <img src={logo} alt='' />
        </div>
       
     <div className="nav-links"> 
       <ul>
        {!isAuthenticated && (
          <li><Link to="/" className="btn">Home</Link></li>
        )}
       
        {user?.role !== "Admin" && (
          <>
           <li><Link to="/about" className="btn">About</Link></li>
           <li><Link to="/contact" className="btn">Contact Us</Link></li>
          </>
        )}
       </ul>
     </div>

     
  {/*Search Bar*/}
   {isAuthenticated && user?.role !== "Admin" && (
   <div className='searchbar_container'>
    <form className='searchbar' onSubmit={(e) => e.preventDefault()}>
      <input 
       type='text'
       placeholder='Search users...'
       value={query}
       onChange={handleSearchChange}
       onFocus={() => {if (results.length > 0) setShowDropdown(true);}}
       onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      <button type='submit'>
       <FaSearch/>
      </button> 

    </form>

    {/*Pop up result list*/}
     {showDropdown && results.length > 0 && (
      <div className='searchbar_dropdown'>
        {results
         .filter((u) => u._id !== user?.id) 
         .map((u) =>(
          <div
           key={u._id}
           className='searchbar-item'
           onClick={() => handleResultClick(u._id)}
          >
           {/*User's avatar image*/}
           <img
            src={u.avatar || getAvatarURL(u.username)}
            alt={u.username}
            className='searchbar-item-avatar'
           /> 

           {/*Username*/}
           <span className='searchbar-item-name'>{u.username}</span>

           {/*Role badge*/}
           <span className={`searchbar-role-badge ${u.role.toLowerCase()}`}>
             {u.role}
           </span>
          </div>
        ))}
      </div>
     )}
   </div> 
  )}
  

   {/*Different shi depending of logged in status*/}
    {isAuthenticated && user ? ( 
     <div className='user_actions'>

     {user?.role !== "Admin" && (
      <div className='nav-Icons'> 

      <div className='nav_icon-wrapper' ref={notRef}>
       <div className='nav_icon' title='notifications' onClick={handleBellIcon}>
          <FaBell/>

          {unreadNotCount > 0 && (
            <span className='nav_badge'>
             {unreadNotCount > 9 ? "9+" : unreadNotCount}
            </span>
          )}
       </div>

       {/*Notifications dropdown*/}
       {showNotDropdown && (
         <div className='notification_dropdown'>
          <div className='notification_header'>
           <h4>Notifications</h4>
          </div>

          <div className='notification_list'>
           {notifications.length === 0 ? (
             <div className='empty_notifications'>No new notifications yet!</div>
             ) : (
               notifications.map(n => (
                <div 
                 key={n._id}
                 className={`notification_item ${!n.isRead ? 'unread' : ''}`}
                 onClick={() => handleNotificationClick(n)}
                >
                 <img
                  src={n.sender?.avatar || getAvatarURL(n.sender?.username)}
                  alt="avatar"
                  className='notification_avatar'
                 />
    
                 <div className='notification_context'>
                  <p className='notification_text'>{n.message}</p>
                  <span className='notification_time'>{formatDate(n.createdAt)}</span>
                 </div>

                 <button
                  className='notification_close'
                  title="Remove Notification"
                  onClick={(e) => handleNotificationDelete(e, n._id)}
                 > 
                   &times;
                 </button>
                </div>
               ))
             )
          
          }
          </div>

         </div>
       )}
      </div> 


       <Link to='/chat' className='nav_icon' title='messages'>
         <FaComment/>
         {unreadCount > 0 && (
           <span className='nav_badge'>
             {unreadCount > 9 ? "9+" : unreadCount}
           </span>
         )}
       </Link>
      </div> 
     )} 


       <AvatarMenu/>
      </div>

      ) : ( 
        <button className="login-btn" onClick={onLoginClick}>
          Login/Sign Up
        </button>
      )}
    </nav>

  );
};

export default Navbar;
