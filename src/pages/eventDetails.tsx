import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {getAvatarURL} from "../utils/avatarUtils";

import {FaStar, FaFlag} from "react-icons/fa";

import UserLayout from "./User/userLayout";
import ArtistLayout from "./Artist/artistLayout";

import "./eventDetails.css"; 



type Event = {
  _id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];

  coverImageURL: string;
  gallery: string[];

  startDate: string;
  endDate?: string;
  startTime: string;
  city: string; 
  address: string;
  venueName: string;

  location: {
    type: "Point",
    coordinates: [number, number]; // [lon, lat]
  };
  
  avgRating: number; 
  ratingCount: number;

  attendeesCount: number;

  isFree: boolean;
  price?: number; 
  priceMin?: number;
  priceMax?: number; 
};


type Comment = {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
    role: string; 
  };
};



const EventDetails: React.FC = () => {
  const {id} = useParams<{id: string}>(); 
  const {token, isAuthenticated, user} = useAuth();
   
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lighboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightBoxIndex] = useState(0);

  const [userRating, setUserRating] = useState<number | null>(null); 
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [ratingSubmit, setRatingSubmit] = useState(false);

  const [isAttending, setIsAttending] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false); 

  const [reportModal, setReportModal] = useState<{show: boolean, comId: string | null}>({
    show: false,
    comId: null 
  })
  const [reportReason, setReportReason] = useState("Harassment"); 


  useEffect(() => {
    const fetchEvent = async () => {
      try{
        const res = await fetch(`http://localhost:5000/api/events/${id}`,{
          headers: token? {Authorization: `Bearer ${token}`} : {},
        });

        if(!res.ok) {
           setError("Could not load event");
           setLoading(false);
           return; 
        }
        const data: Event = await res.json();
        setEvent(data);

      } catch(e) {
        setError("Network error");

      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvent();
  }, [id, token]);


  //Handle event join
  const handleJoin = async () => {
    if (!id || !token) {
      alert("You must be logged in to join the event");
      return;
    }

    try {
     const res = await fetch(`http://localhost:5000/api/events/${id}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`
      }
     });

     if (!res.ok) {
      const msg = await res.text();

      alert(JSON.parse(msg).message);
      return;
     }

     const data = await res.json();

     //Update UI
     setEvent((prev) => prev ? {...prev, attendeesCount: data.attendeesCount} : prev);
     setIsAttending(true);

    } catch (e) {
      console.error("Join event failed", e);
    }
   }
  

  const handleRate = async (rating: number) => {
    if (!id || !isAuthenticated || !token) return;
    setRatingSubmit(true);

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}/rate`,
      {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({rating})

      });

      if (!res.ok) {
        console.error("Rating failed", res.status);
        return;
      }

      const data = await res.json();
      setUserRating(rating);
      setEvent((prev) => prev ? {
       
        ...prev,
        avgRating: data.avgRating,
        ratingCount: data.ratingCount
      } 
      : prev
    );

      } finally {
        setRatingSubmit(false);
      }
  };  


  //Fetch comments 
  useEffect(() => {
    const fetchComments = async () => {
      try {
       const res = await fetch(`http://localhost:5000/api/events/${id}/comments`);
       
       if (!res.ok) {
         console.error("Could not load comments");
         return;
       }

       const data = await res.json();
       setComments(data);

      } catch (e) {
        console.error("Network error loading comments");

      } finally {
        setCommentLoading(false); 
      }
    }; 

    if (id) fetchComments();

  }, [id]);

 
  //Handle comment posting 
  const handleCommentPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return; 

    try {
     const res = await fetch(`http://localhost:5000/api/events/${id}/comments`, {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
       },
       body: JSON.stringify({text: newComment})
     });
     
     if (res.ok) {
       const savedComment = await res.json();

       //Add new comment to the top of the list
       setComments((prev) => [savedComment, ...prev]);
       setNewComment("");
     }

    } catch (err) {
      console.error("Could not post comment", err); 
    }
  };


  //Handle report submission
  const handleReportSubmit = async () => {
    if (!reportModal.comId) return;

    const targetComment = comments.find(c => c._id === reportModal.comId);
    if (!targetComment) return; 

    try {
     const res = await fetch("http://localhost:5000/api/reports", {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`
       },
       body: JSON.stringify({
        reportedItem: reportModal.comId,
        reportedUser: targetComment.user._id,
        itemType: "Comment",
        reason: reportReason
       })
     }); 

     if (res.ok) {
       alert("Report submitted for review");
       setReportModal({show: false, comId: null});

     } else {
       alert("Failed to report comment");
     }

    } catch (err) {
      console.error(err); 
    }
  };


  //Swipe through gallery images 
  const galleryImages = event?.gallery ?? [];
  
  const openLightbox = (index: number) => {
    setLightBoxIndex(index);
    setLightboxOpen(true); 
  };

  const closeLightBox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLightboxOpen(false);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightBoxIndex((prev) => 
     prev === 0 ? galleryImages.length - 1 : prev - 1       
   );
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightBoxIndex((prev) =>
     prev === galleryImages.length - 1 ? 0: prev + 1 
   );
  };


  if (loading) return <div className="eventDetails_loading">Loading...</div>;

  if (error || !event) 
    return(
    <div className="eventDetails_error">
    {error || "Event not found"}
    </div>
  );

  const date = new Date(event.startDate).toLocaleString("el-GR", {
    dateStyle:"full",
    timeStyle:"short"
  });


  //Take coordinates from GeoJSON location
  let lat: number | null = null;
  let lon: number | null = null;

  if (event.location && event.location.coordinates.length === 2) {
    const [lonCoord, latCoord] = event.location.coordinates;
    lat = latCoord;
    lon = lonCoord;
  }
  
  const hasCoords = (lat !== null) && (lon !== null);
  const mapSrc = hasCoords 
       ? `https://www.google.com/maps?q=${encodeURIComponent(event.address + ", " + event.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
       : "";

  const displayedRating = userRating ?? Number.isFinite(event.avgRating)
        ? event.avgRating
        : 0; 
   

  const ProfileLayout = user?.role === "Artist" ? ArtistLayout : UserLayout;          
       

 return (
   <ProfileLayout>
   <div className="eventDetails">
    <div className="eventDetails_card">
      {/*Cover image*/}
      <div className="eventDetails_cover">
        <img src={event.coverImageURL} alt={event.title} />
        <div className="eventDetails_cover-overlay">
          <span className="eventDetails_category">{event.category}</span>
        </div>
      </div>


      {/*Header*/}
      <div className="eventDetails_header">
        <div>
          <h1 className="eventDetails_title">{event.title}</h1>
          <p className="eventDetails_meta">
            <span>{date}</span>
            <span>
              {event.venueName
               ? `${event.venueName}, ${event.city}`
               : event.city }
            </span>
          </p>

          <p className="eventDetails_address">
            <strong>Address: </strong> {event.address}
          </p>
        </div>

        {/*Join event button*/}
        <div className="eventDetails_header-right">
        <div className="eventDetails_actions">
         <button
          className="join_event-btn"
          onClick={handleJoin}
          disabled={isAttending}
         >
          {isAttending ? "Attending" : "Attend Event"}
         </button>

         <span className="attendees-badge">
          👥 {event.attendeesCount} going 
         </span>
        </div>


        <div className="eventDetails_price">
         {event.isFree ? (
          "Free Entry"

         ): event.priceMin && event.priceMax ? (
           `${event.priceMin}€ - ${event.priceMax}€`

         ): event.price !== null ? (
            `${event.price?.toFixed(2)}€`

         ) : (
           "Ticketed Event"
         )
        }
        </div>
       </div>
      </div>


      {/*Description and side column*/}
      <div className="eventDetails_layout">
        <section className="eventDetails_main">
          <h2 className="eventDetails_section-title">Description</h2>
          <p className="eventDetails_description">{event.description}</p>

          {event.tags && event.tags.length > 0 && (
            <div className="eventDetails_tags">
              {event.tags.map((t) => (
                <span key={t} className="eventDetails_tag">
                  #{t}
                </span>
              ))}
            </div>
          )}


      {/*Gallery section*/}
       {event.gallery && event.gallery.length > 0 && (
         <section className="eventDetails_section">
          <h2 className="eventDetails_section-title">Gallery</h2>
          <div className="eventDetails_gallery">
            {event.gallery.map((img, index) => (
              <button
               key={index}
               type="button"
               className="eventDetails_gallery-item"
               onClick={() => openLightbox(index)}
              >
                <img src={img} alt={`${event.title} - image ${index + 1}`} />
              </button>
            ))}
          </div>
         </section>
       )}


      {/*Rating section*/}
      <section className="eventDetails_section">
        <h2 className="eventDetails_section-title">Rating</h2>
        <div className="eventDetails_rating-row">
          <div className="eventDetails_stars">
            {[1, 2, 3, 4, 5].map((star) => {
             const active = 
              (hoverRating ?? userRating ?? event.avgRating ?? 0) >= 
               star; 

             return(
              <button
               key={star}
               className={`eventDetails_star ${
                active ? "eventDetails_star--active" : ""
               }`}
               onMouseEnter={() => setHoverRating(star)}
               onMouseLeave={() => setHoverRating(null)}
               onClick={() => handleRate(star)}
               disabled={!isAuthenticated || ratingSubmit}
              >
                <FaStar/>
              </button>
             );
            })}
          </div>

      
      <div className="eventDetails_rating-text">
        <span>
          {displayedRating.toFixed(1)} / 5{" "}
          <span className="eventDetails_rating-count">
            ({event.ratingCount} ratings)
          </span>
        </span>

        {userRating && (
          <span className="eventDetails_rating-login" />
        )}
      </div>
    </div>
    </section>
   </section>


    {/*Side column map*/}
    <aside className="eventDetails_side">
      <h2 className="eventDetails_section-title">Location on map</h2>
       
      {hasCoords ? (
        <div className="eventDetails_map-wrapper">
          <iframe
           title="Event location"
           src={mapSrc}
           loading="lazy"
           referrerPolicy="no-referrer-when-downgrade"
          > 
          </iframe>
        </div>
      ):(
       <p className="eventDetails_no-map">
         Location coordinates are not available
       </p> 
      )}


    {/*Comment section*/}
    <div className="eventDetails_comment-section">
      <h2 className="eventDetails_section-title">Comments</h2>
      
      {/*Input*/}
      <form className="comment_form" onSubmit={handleCommentPost}>
       <textarea
        className="comment_input"
        value={newComment}
        placeholder="Share your thoughts..."
        rows={3}
        onChange={(e) => setNewComment(e.target.value)}
       /> 

       <button
        type="submit"
        className="comment_submit-btn"
        disabled={commentLoading || !newComment.trim()}
       >
         {commentLoading ? "Posting..." : "Post Comment"}
       </button>
      </form>


      {/*Comment list*/}
      <div className="comment_list">
        {comments.length > 0 ? (
          comments.map((c) => (
           <div key={c._id} className="comment_item">
             <div className="comment_avatar">
              <img 
               src={c.user.avatar || getAvatarURL(c.user.username)}
               alt={c.user.username}
              />
             </div>

             <div className="comment_content">
              <div className="comment_header">
                <span className="comment_username">{c.user.username}</span>
                <span className="comment_date">
                 {new Date(c.createdAt).toLocaleDateString()} 
                </span>

                {/*Report button*/}
                {isAuthenticated && c.user.username !== user?.username && (
                  <button
                   className="report-btn"
                   title="Report this comment"
                   onClick={() => setReportModal({show: true, comId: c._id})}
                  >
                   <FaFlag/>
                  </button>
                )}
              </div>

              <p className="comment_text">{c.text}</p>
             </div>
           </div> 
          )) 
         ) : (
           <p className="no_comments">Be the first to comment!</p> 
        )} 

      </div>
    </div>

    </aside>
    </div>

    {/*Photo gallery*/}
     {lighboxOpen && galleryImages.length > 0 && (
       <div className="eventDetails_lightbox" onClick={closeLightBox}>
        <div className="eventDetails_lightbox-inner" onClick={(e) => e.stopPropagation()}>
          <button
           className="eventDetails_lightbox-close"
           type="button"
           onClick={closeLightBox}
          >
            x
          </button>

          <button
           className="eventDetails_lightbox-nav--prev"
           type="button"
           onClick={showPrev}
          >
            ‹
          </button>

          <img 
           src={galleryImages[lightboxIndex]}
           alt={`${event.title} - image ${lightboxIndex + 1}`} 
           className="eventDetails_lightbox-img"
           />

           <button
           className="eventDetails_lightbox-nav--next"
           type="button"
           onClick={showNext}
          >
            ›
          </button>

          <div className="eventDetails_lightbox-counter">
            {lightboxIndex + 1}/{galleryImages.length}
          </div>

        </div>
       </div>
     )}
   </div>

   {/*Report modal*/}
   {reportModal.show && (
     <div className="modal_backdrop">
      <div className="modal_content">
        <h3>Report Comment</h3>
        <p className="report_text">Why are you reporting this?</p>  

        <select
         className="report_reason"
         value={reportReason}
         onChange={(e) => setReportReason(e.target.value)}
        >
          <option value="Harassment">Harassment</option>
          <option value="Spam">Spam</option>
          <option value="Inappropriate Content">Inappropriate Content</option>
          <option value="Hate Speech">Hate Speech</option>
          <option value="Other">Other</option>
        </select>

        <div className="report_actions">
          <button 
           className="report_cancel"
           onClick={() => setReportModal({show: false, comId: null})}
          >
           Cancel
          </button>

          <button
           className="report_submit"
           onClick={handleReportSubmit}
          >
           Report 
          </button>
        </div>

      </div>
     </div>
   )} 
   

  </div>
  </ProfileLayout>
 );
};


export default EventDetails; 