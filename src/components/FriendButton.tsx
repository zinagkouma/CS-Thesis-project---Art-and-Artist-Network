import React, {useState, useEffect, useRef} from 'react';
import {useAuth} from '../context/AuthContext';
import Swal from 'sweetalert2';

import acceptIcon from '../assets/icons/add-friend.png';

import './FriendButton.css';



interface FriendButtonProps {
  targetUserId: string;
  targetUserRole: string; 
  targetUsername: string;   
}


const FriendButton: React.FC<FriendButtonProps> = ({targetUserId, targetUserRole, targetUsername}) => {
  const {user, authHeader} = useAuth();

  const [status, setStatus] = useState<"pending" | "accepted" | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isRequester, setIsRequester] = useState(false);
  const [showMenu, setShowMenu] = useState(false); 

  const menuRef = useRef<HTMLDivElement | null>(null); 

  const [loading, setLoading] = useState(false);

  if (targetUserRole === "Admin" || user?.id === targetUserId || user?.role === "Admin") return null;


  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false); 
      }
    };

    //Attach listener to the document 
    document.addEventListener("mousedown", handleClickOut);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOut);
    };
 
  }, [showMenu]);


  useEffect(() => {
    checkStatus();
  }, [targetUserId]);


  const checkStatus = async () => {
    try {
     const res = await fetch(`http://localhost:5000/api/friends/status/${targetUserId}`, {
       headers: authHeader() 
     });
     
     const data = await res.json();
     
     if (data && data._id) {
       setStatus(data.status);
       setFriendshipId(data._id);
       setIsRequester(data.requester === user?.id); 

     } else {
       setStatus(null);
     }

    } catch (err) {
      console.error(err); 
    }
  };


  const sendRequest = async () => {
    setLoading(true); 
    try {
     const res = await fetch(`http://localhost:5000/api/friends/request`, {
       method: "POST",
       headers: {"Content-Type": "application/json", ...authHeader()},
       body: JSON.stringify({receiverId: targetUserId}) 
     });

     if (res.ok) checkStatus();

    } catch (err) {
      console.error(err);

    } finally {
      setLoading(false); 
    }
  };


  const acceptRequest = async () => {
    if (!friendshipId) return;

    setLoading(true);
    setShowMenu(false); 

    try {
     const res = await fetch(`http://localhost:5000/api/friends/accept/${friendshipId}`, {
       method: "PUT",
       headers: authHeader() 
     });
     
     if (res.ok) checkStatus();

    } catch (err) {
      console.error(err);

    } finally {
      setLoading(false);
    }
  };


  const removeFriendship = async () => {
    if (!friendshipId) return;
    
    const result = await Swal.fire({
      title: "Remove Friend?",
      text: `Are you sure you want to remove ${targetUsername} from your friends?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#a1a1a1',
      confirmButtonText: "Remove",
      scrollbarPadding: false
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setShowMenu(false); 

    try {
     const res = await fetch(`http://localhost:5000/api/friends/${friendshipId}`, {
       method: "DELETE",
       headers: authHeader()
     });

     if (res.ok) {
       setStatus(null);
       setFriendshipId(null); 
     }

    } catch (err) {
      console.error(err);

    } finally {
      setLoading(false);
    }
  };


  if (loading) return <button disabled>...</button>;

  if (status === "accepted") {
    return (
     <button className='friend_btn remove' onClick={removeFriendship}>
       Unfriend
     </button>
    );
  }


  if (status === "pending") {
    if (isRequester) {
     return (
      <button className='friend_btn pending' onClick={removeFriendship}>
        Request sent
      </button>
     );  

    } else {
      return (
       //Wrapper for dropdown menu
       <div className='friend_menu-container' ref={menuRef}>
        <button
         className={`friend_btn respond ${showMenu ? 'active' : ''}`}
         onClick={() => setShowMenu(!showMenu)}
        >
         <img src={acceptIcon} alt="" className="accept-icon" />

          Respond <span className='arrow_icon'>▼</span> 
        </button>

        {/*Drop down menu*/}
        {showMenu && (
          <div className='friend_dropdown'>
           <button className='dropdown_item accept' onClick={acceptRequest}>
             Accept
           </button>
           <button className='dropdown_item reject' onClick={removeFriendship}>
             Reject
           </button>
          </div>
        )}
       </div> 
      );
    }
  }

  return (
     <button className='friend_btn add' onClick={sendRequest}>
       + Add Friend
     </button>
  ); 

};


export default FriendButton; 