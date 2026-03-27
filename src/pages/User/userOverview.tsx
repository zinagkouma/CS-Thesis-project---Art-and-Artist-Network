import React, {useState, useEffect} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import {getAvatarURL} from '../../utils/avatarUtils';

import {FaHeart, FaTrash} from 'react-icons/fa';

import UserLayout from './userLayout';
import './userOverview.css'; 



type EventItem = {
  _id: string;
  title: string;
  startDate: string;
  coverImageURL: string;
  city: string;
  startTime: string; 
  avgRating: number; 
};

type UpdateItem = {
  _id: string;
  title: string; 
  coverImageURL: string; 
  createdAt: string; 
  creator: {
    username: string;
  };
};

type FriendUser = {
  _id: string;
  username: string;
  avatar?: string;
  lastSeen: string; 
  showActiveStatus?: boolean;  
}

type FriendshipItem = {
  _id: string; 
  requester: FriendUser;
  receiver: FriendUser;
  status: "accepted" | "pending" | "rejected";
  createdAt: string;  
}


const UserOverview: React.FC = () => {
  const {user, authHeader} = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState<EventItem[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false); 

  const [trending, setTrending] = useState<EventItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"active" | "requests">("active");
  const [friendships, setFriendships] = useState<FriendshipItem[]> ([]);
  const [friendsLoading, setFriendsLoading] = useState(false); 


  //Fetch the events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/events?status=published", {
          headers: {"Content-Type": "application/json", ...authHeader()}
        });

        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }

      } catch (err) {
        console.error("Failed to fetch events", err); 

      } finally {
        setLoading(false); 
      }
    };

    fetchEvents();
   }, []); 


   //Fetch favorites
   useEffect(() => {
     const fetchFavorites = async () => {
       setFavLoading(true);
       try {
         const res = await fetch("http://localhost:5000/api/users/favorites", {
           headers: {...authHeader()}
         });

         if (res.ok) {
           const data = await res.json();
           setFavorites(data); 
         }

       } catch (err) {
         console.error("Failed to fetch events", err);
         
       } finally {
         setFavLoading(false);
       }
     };

     fetchFavorites();
   }, [authHeader]);


    //Handle delete favorite
    const removeFavorite = async (e: React.MouseEvent, eventId: string) => {
      e.stopPropagation();

      try {
       const res = await fetch(`http://localhost:5000/api/users/favorites/${eventId}`, {
         method: "POST",
         headers: { "Content-Type": "application/json", ...authHeader() }
       });
       
       if (res.ok) {
        setFavorites((prev) => prev.filter((item) => item._id !== eventId)); 
       }

      } catch (err) {
        console.error("Failed to remove favorite", err); 
      }
    };


    //Fetch updates list
    useEffect(() => {
      const fetchUpdates = async () => {
        setUpdatesLoading(true);
        try {
         const res = await fetch("http://localhost:5000/api/users/updates", {
           headers: {...authHeader()}
         }); 
    
         if (res.ok) {
          const data = await res.json();
          setUpdates(data);
         }

        } catch (err) {
          console.error("Failed to fetch updates");

        } finally {
          setUpdatesLoading(false); 
        }
      };

      fetchUpdates(); 
     }, [authHeader]);
   

    //Fetch trending events 
    useEffect(() => {
      const fetchTrending = async () => {
        setTrendingLoading(true);
        try {
         const res = await fetch("http://localhost:5000/api/events/trending");
         
         if (res.ok) {
          const data = await res.json();
          setTrending(data);
         }

        } catch (err) {
          console.error("Failed to fetch trending events", err);

        } finally {
          setTrendingLoading(false); 
        }
      };

      fetchTrending(); 
    }, []); 


    //Fetch friend data 
    useEffect(() => {
      const fetchFriendData = async () => {
        setFriendsLoading(true);
        try {
         const res = await fetch("http://localhost:5000/api/friends", {
           headers: {...authHeader()}
         });
         
         if (res.ok) {
           const data = await res.json();
           setFriendships(data); 
         }

        } catch (err) {
          console.error(err);
     
        } finally {
          setFriendsLoading(false); 
        }
      };

      fetchFriendData();
     }, [authHeader]); 

    
    //Filter the list based on the active tab
    const incomingRequests = friendships.filter(f =>
      f.status === "pending" && f.receiver._id === user?.id
    );


    //Active friends from last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).getTime(); 

    const activeFriends = friendships
         .filter(f => f.status === "accepted")
         .map(f => {
           return f.requester._id === user?.id ? f.receiver : f.requester;
         })
         .filter(friend => {
           //Check if online
           if (friend.showActiveStatus === false) return false;
           if (!friend.lastSeen) return false; 

           return new Date(friend.lastSeen).getTime() > fiveMinsAgo;
         });


    //Handle request accept
    const handleAccept = async (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      try {
       const res = await fetch(`http://localhost:5000/api/friends/accept/${requestId}`, {
         method: "PUT",
         headers: {...authHeader()}
       });
  
       if (res.ok) {
         //Find item and change status to "accepted"
         setFriendships(prev => prev.map(f =>
          f._id === requestId ? {...f, status: "accepted"} : f
         ));
       }

      } catch (err) {
        console.error("Action failed", err);
      }
    };


    //Handle request decline
    const handleDecline = async (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      try {
       const res = await fetch(`http://localhost:5000/api/friends/${requestId}`, {
         method: "DELETE",
         headers: {...authHeader()}
       });
     
       if (res.ok) {
         setFriendships(prev => prev.filter(f => f._id !== requestId));
       }

      } catch (err) {
        console.error("Action failed", err); 
      }
    };
     

    //Calendar helpers
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    
    //Check if a specific day has events
    const getEventsForDay = (day: number) => {
      return events.filter(e => {
       const eDate = new Date(e.startDate);
       return (
        eDate.getDate() === day &&
        eDate.getMonth() === currentDate.getMonth() &&
        eDate.getFullYear() === currentDate.getFullYear() 
       ); 
      });
    };


    const selectedDateEvents = events.filter(e => {
      const eDate = new Date(e.startDate);
      return (
       eDate.getDate() === selectedDate.getDate() &&
       eDate.getMonth() === selectedDate.getMonth() &&
       eDate.getFullYear() === selectedDate.getFullYear() 
      );
    });


    const renderCalendarDays = () => {
      const totalDays = daysInMonth(currentDate);
      const startDay = firstDayOfMonth(currentDate);
      const days = [];

      // Empty slots for previous month
      for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className='calendar_day empty'></div>);
      }

      for (let d = 1; d <= totalDays; d++) {
        const dayEvents = getEventsForDay(d); 
        const isSelected = 
         selectedDate.getDate() === d &&
         selectedDate.getMonth() === currentDate.getMonth();

        days.push(
         <div
          className={`calendar_day ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-event' : ''}`}
          key={d}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
         >
          <span className='day_number'>{d}</span>

          <div className='day_dots'>
           {dayEvents.slice(0, 3).map(ev => <span key={ev._id} className='dot'></span>)}
          </div>
         </div> 
        ); 
      }
      return days; 

    };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
 
 


  return(
   <UserLayout> 
   <div className='Overview_container'>

    <div className='Overview_header'>
     <h1>Welcome back!</h1>
    </div>

    {/*Dashboard grid*/}
    <div className='Overview_grid'>
     
     {/*Calendar and upcoming events widget*/} 
     <div className='Overview_card calendar-widget'>
      <div className='calendar_section'>
       <div className='calendar_header'>
         <button onClick={handlePrevMonth}>&lt;</button>
         <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
         <button onClick={handleNextMonth}>&gt;</button>
       </div>

       <div className='calendar_weekdays'>
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
       </div>

       <div className='calendar_grid'>
        {renderCalendarDays()}
       </div>
      </div>

      {/*Side panel for events list*/}
      <div className='calendar_side-panel'>
       <h4>
        {selectedDate.toLocaleDateString('en-US', {weekday: "long", month: "short", day: "numeric"})}
       </h4>

       <div className='side-panel_content'>
        {loading ? <p>Loading...</p> : (
          selectedDateEvents.length > 0 ? (
           selectedDateEvents.map(ev => (
            <div className='mini-event_card' key={ev._id} onClick={() => navigate(`/events/${ev._id}`)}>
              <div className='mini-event_time'>{ev.startTime}</div>
              <div className='mini-event_info'>
                <strong>{ev.title}</strong>
                <span>{ev.city}</span>
              </div>
            </div>
           )) 
          ) : (
            <div className='no_events-mini'>
             <p>No events on this day!</p>
             <button onClick={() => navigate('/artist/events')}>Find Events</button>
            </div>
          )
        )}
       </div>
      </div>
     </div>


     <div className='Overview dashboard-sidebar'>

     {/*Favorites list*/} 
     <div className='Overview_card favorites-widget'>
      <h3>Your favorites <FaHeart color="#ff4d4f"/></h3> 

      <div className='favorites_list'>
       {favLoading && <div className='loading-text'>Loading...</div>} 

       {!favLoading && favorites.length === 0 && (
         <div className='field_empty'>
          <p>No favorites yet!</p>
         </div>
       )}

       {!favLoading && favorites.length > 0 && favorites.map((ev: any) => (
         <div key={ev._id} className='favorite_item' onClick={() => navigate(`/events/${ev._id}`)}>

          <div className='favorites_left-group'>
           {ev.coverImageURL ?
             <img src={ev.coverImageURL} alt={ev.title} className='favorite_img' />:
             <div className='favorite_img placeholder'>🎟️</div>
           }

           <div className='favorite_info'>
             <span className='favorite_title'>{ev.title}</span>
             <span className='favorite_date'>
               {new Date(ev.startDate).toLocaleDateString(undefined, {month:"short", day:"numeric"})}
             </span>
           </div>
          </div>

          {/*Delete button*/}
          <button
           className='favorites_delete-btn'
           title='Remove from favorites'
           onClick={(e) => removeFavorite(e, ev._id)}
          >
            <FaTrash/>
          </button>

         </div>
       ))}

      </div>
     </div>

     {/*Following updates*/}
     <div className='Overview_card updates-widget'>
      <h3>Updates on Events</h3>

      <div className='updates_list'>
       {updatesLoading && <div className='loading-text'>Loading...</div>}

       {!updatesLoading && updates.length === 0 && (
        <div className='field_empty'>
         <p>There are no new updates!</p>
        </div>
       )} 

       {!updatesLoading && updates.map(update => (
         <div
          key={update._id}
          className='updates_item'
          onClick={() => navigate(`/events/${update._id}`)}
         >
          {/*Header*/}
          <div className='updates_header'>
           <strong>{update.creator.username}</strong> published a new event 
          </div>

          {/*Mini event card*/}
          <div className='updates_content'>
           {update.coverImageURL ?
            <img src={update.coverImageURL} alt={update.title} /> :
            <div className='updates_img-placeholder'>🎟️</div>
           }
           <span className='updates_title'>{update.title}</span>
          </div>

          <span className='updates_time'>
           {new Date(update.createdAt).toLocaleDateString()}
          </span>

         </div>
       ))}

      </div>
     </div> 

    </div>
  </div>

    
    <div className='Overview_bottom'> 
    <div className='trending_section'>
      <h3>Trending Now</h3>

      <div className='trending_grid'>
       {trending.map(ev => (
         <div key={ev._id} className='trending_card' onClick={() => navigate(`/events/${ev._id}`)}>
          <img src={ev.coverImageURL} alt={ev.title} />
          <div className='trending_overlay'>
            <span className='trending_rating'>★ {ev.avgRating.toFixed(1)}</span>
          </div>
          <div className='trending_info'>
            <h4>{ev.title}</h4>
          </div>
         </div>
       ))} 

      </div>
    </div>

    <div className='Overview_card friends-widget'>
      <div className='friends_tabs'>
       <button
       className={`tab_btn ${activeTab === 'active' ? 'active' : ''}`}
       onClick={() => setActiveTab("active")}
       > 
         Active Now 
       </button>

       <button
        className={`tab_btn ${activeTab === 'requests' ? 'active' : ''}`}
        onClick={() => setActiveTab("requests")}
        >
         Requests 
        {incomingRequests.length > 0 && <span className='req_badge'>{incomingRequests.length}</span>}
       </button> 
      </div>
    
    
    <div className='friends_content'>
     {friendsLoading && <div className='loading-text'>Loading...</div>}

     {/*Active friends tab*/}
     {!friendsLoading && activeTab === 'active' && (
      <div className="friends_list">
        {activeFriends.length === 0 ? (
           <div className='field_empty'><p>No friends online</p></div>
        ) : (
          activeFriends.map(friend => (
            <div key={friend._id} className="friend_item">
               <div className="friend_avatar-container">
                 {friend.avatar ? 
                   <img src={friend.avatar} className="friend_avatar_img" alt={friend.username}/> :
                   <img src={getAvatarURL(friend.username)} className="friend_avatar_img" alt={friend.username} />
                 }
                 <span className="online_dot"></span>
               </div>
            
               <span className="friend_name">{friend.username}</span>
            </div>
          ))
        )}
      </div>
    )}

    {/*Requests tab*/}
    {!friendsLoading && activeTab === 'requests' && (
      <div className="friends_list">
         {incomingRequests.length === 0 ? (
           <div className='field_empty'><p>No pending requests</p></div>
         ) : (
           incomingRequests.map(req => (
             <div key={req._id} className="friend_request-item">
                <div className="req_left">

                  <div className="friend_avatar-container">
                   <img 
                    src={req.requester.avatar || getAvatarURL(req.requester.username)}
                    className="friend_avatar_img" 
                    alt={req.requester.username} 
                   />
                  </div>

                  <div className="req_info">
                     <span className="friend_name">{req.requester.username}</span>
                     <span className="req_date">wants to connect</span>
                  </div>
                </div>
                
                <div className="req_actions">
                   <button className="req_btn accept" onClick={(e) => handleAccept(e, req._id)}>✓</button>
                   <button className="req_btn decline" onClick={(e) => handleDecline(e, req._id)}>✕</button>
                </div>
             </div>
           ))
         )}
      </div>

     )}
      

    </div>
   </div>
  </div> 
    
  </div>
  

   </UserLayout>
  );
};


export default UserOverview;
