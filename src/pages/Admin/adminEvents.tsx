import React, {useEffect, useMemo ,useState} from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { FaTrash } from "react-icons/fa";

import AdminLayout from "./adminLayout";
import "./adminEvents.css";



type Role = "User" | "Artist" | "Admin";


const CATEGORY_OPT = [
  "Concert", "Play", "Exhibition", "Performance",
  "Workshop", "Talk/Seminar", "Festival"
] as const;

const CITIES_OPT = [
  "Athens", "Piraeus", "Thessaloniki", "Patras", "Heraklion", "Chania",
  "Larissa", "Volos", "Ioannina", "Rhodes"
];


type Creator = {
   _id: string; 
   username: string; 
   role: Role; 
};


type EventItem = {
    _id: string; 
    title: string; 
    creator: Creator; 
    description: string; 
    category: string; 
    tags?: string[];
    coverImageURL: string; 
    gallery?: string[]; 

    startDate: string; 
    endDate?: string; 
    startTime: string; 
    timezone?: string; 
    venueName?: string; 
    city: string; 
    address: string; 

    isFree: boolean; 
    price?: number; 
    priceMin?: number;
    priceMax?: number;  
    capacity?: number; 
    attendeesCount?: number; 
    status: "draft" | "published" | "cancelled"; 

    createdAt: string; 
    updatedAt: string;
};


const formatDateTime = (isoDate: string, time?: string) => {
   const date = new Date(isoDate); 
   const datePart = date.toLocaleDateString(); 
   const timePart = time ? time : date.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"});
   return `${datePart} • ${timePart}`; 
};


const AdminEvents: React.FC = () => {
   const {user, authHeader} = useAuth(); 
   const isArtist = user?.role === "Artist"; 
   const Navigate = useNavigate(); 
   const [searchParams, setSearchParams] = useSearchParams(); 

   const [events, setEvents] = useState<EventItem[]>([]);
   const [loading, setLoading] = useState(false); 
   const [err, setErr] = useState<string | null>(null); 


   const [query, setQuery] = useState(searchParams.get("query") ?? "");
   const [category, setCategory] = useState(searchParams.get("category") ?? ""); 
   const [city, setCity] = useState(searchParams.get("city") ?? "");  
   const [from, setFrom] = useState(searchParams.get("from") ?? ""); 
   const [to, setTo] = useState(searchParams.get("to") ?? ""); 



 const listURL = useMemo( () => {
    const url = new URL("http://localhost:5000/api/events");
    const push = (k:string, v?: string) => v && v.trim() && url.searchParams.set(k, v.trim()); 
   
    push("category", category); 
    push("city", city);
    push("from", from); 
    push("to", to);

   return url.toString();
 }, [category, city, from, to]  );
 

 const syncURL = (e: React.FormEvent) => {
    e.preventDefault(); 
    const next = new URLSearchParams(); 

    if (query) next.set("query", query);
    if (category) next.set("category", category);
    if (city) next.set("city", city);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    setSearchParams(next); 
 };


 const filteredEvents = events.filter((ev) => 
   ev.title.toLowerCase().includes(query.toLowerCase())  
 );


 const fetchEvents = async () => {
    setLoading(true);
    setErr(null);

    try{
      const res = await fetch(listURL, {
         headers: {"Content-Type": "application/json", ...authHeader()}, 
      });

      if (!res.ok){
         const msg = await res.text(); 
         throw new Error(msg || `failed to fetch events (${res.status})`)
      }
      const data = (await res.json()) as EventItem[]; 
      setEvents(Array.isArray(data) ? data : [] );

    } catch(e: any) {
       setErr(e.message ?? "Could not load events");
       setEvents([]);
    } finally {
       setLoading(false); 
    }
 };
 

 useEffect(() => {
   fetchEvents();
   
 }, [listURL]);

 
 const onClear = () => {
    setQuery(""); setCategory(""); setCity(""); setFrom(""); setTo("");
    setSearchParams(new URLSearchParams());
 };


 //Handle event deletion
 const handleDelete = async (id: string, title: string) => {
   const result = await Swal.fire({
     title: `Delete event "${title}"?`,
     text: "This action cannot be undone",
     icon: "warning",
     showCancelButton: true,
     cancelButtonColor:'#d33',
     confirmButtonText: "Yes",
     confirmButtonColor: '#25b795ff'
   });
   
   if (!result.isConfirmed) return; 


   try {
    const res = await fetch(`http://localhost:5000/api/events/${id}`, {
      method: "DELETE",
      headers: {...authHeader()}
    });

    if (res.ok) {
      setEvents((prev) => prev.filter((ev) => ev._id !== id));
      Swal.fire("Deleted!", `Event "${title}" has been deleted`, "success");

    } else {
      const msg = await res.text();
      Swal.fire("Error", msg || "Could not delete event", "error");
    }

   } catch (e) {
     Swal.fire("Error", "Server error while deleting event.", "error");
   }
 };


  return (
   <AdminLayout>
     
   <div className="events_page">
    <div className="events_header">
      <h2 className="events_title">Events</h2>

      {isArtist && (
         <button className="create-btn" onClick={() => Navigate("/events/new")}>
            + Create Event
         </button>
      )}
    </div>

    <form className="filter-form" onClick={syncURL}>
      <input placeholder='Search…' value={query} onChange={(e) => setQuery(e.target.value)} />
         <select value={category} onChange={(e) => setCategory(e.target.value)}>
           <option value="">All Categories</option>

           {CATEGORY_OPT.map(opt => (
             <option key={opt} value={opt}>{opt}</option>
           ))}
         </select>

         <select value={city} onChange={(e) => setCity(e.target.value)}>
           <option value="">All Cities</option>
           
           {CITIES_OPT.map(opt => (
               <option key={opt} value={opt}>{opt}</option>
           ))}
         </select>

         <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
         <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />  
    </form>

   <div className="events_body">
     {loading && <div className="loading">Loading Events...</div>}

     {!loading && err && <div className="error">⚠️ {err}</div>}

     {!loading && !err && events.length === 0 && (
      <div className="empty-state">
        <div className="empty-badge">No events yet!</div> 
        {isArtist? (
         <>

         <p>Be the first to post an event</p>
         <button className="create-btn" onClick={() => Navigate("/events/new")}>
           Create Event
         </button>
         
         </>
         ):(
          <p>When artists publish events, they appear here.</p>  
        )}
      </div>
     )}

     {!loading && !err && events.length > 0 && (
      <div className="events_grid">
         {filteredEvents.map((event) => (
            <article key={event._id} className="event-card">
              {event.coverImageURL? (
               <div className="event-img-wrap">
                 <img src={event.coverImageURL} alt={event.title} /> 
               </div>
               ):(
               <div className="event-img-placeholder">🎟️</div>
               )}
              
              <div className="event-content">
                <h3>{event.title}</h3>
                <div className="event-meta">
                  <span>{formatDateTime(event.startDate, event.startTime)}</span>
                  <span>•</span>
                  <span>{event.city}</span>
                   {event.venueName && (
                     <>
                       
                     <span>•</span>
                     <span>{event.venueName}</span>
                     </>
                   )}
                </div>

                <div className="event-tags">
                  <span className="event-category">{event.category}</span>
                  <span className="event-price">
                    {event.isFree 
                           ? "Free"
                           :event.priceMin && event.priceMax
                             ? `${event.priceMin}€ - ${event.priceMax}€`  //Handle price range 
                             : event.price
                               ? `${event.price.toFixed(2)}€`
                               : '-'
                     } 


                  </span>
                </div>

                {event.creator?.username && (
                  <div className="event-by">
                    Posted by <b>{event.creator.username}</b>
                    {event.creator.role === "Artist" ? " (Artist)" : ""}
                  </div>
                )}

                <button
                 className="event_delete-btn"
                 onClick={() => handleDelete(event._id, event.title)}
                 title="Delete Event"
                >
                  <FaTrash/>
                </button>

              </div>
            </article>

         ))}
      </div>
     )}

   </div>
 </div>

   </AdminLayout>  
  );
};






export default AdminEvents; 