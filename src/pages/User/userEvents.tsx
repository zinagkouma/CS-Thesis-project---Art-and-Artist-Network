import React, {useEffect, useMemo, useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link, useSearchParams} from 'react-router-dom';

import { FaHeart, FaRegHeart } from 'react-icons/fa';


import UserLayout from './userLayout';
import './userEvents.css';


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
}

type EventItem = {
  _id: string;
  title: string;
  creator: Creator;
  description: string;
  category: string;
  tags?: string[];
  coverImageURL: string;
  startDate: string;
  startTime: string;
  venueName?: string;
  city: string;
  isFree: boolean;
  price?: number;
  priceMin?: number;
  priceMax?: number; 
  avgRating?: number;
  status: "published";
};


const formatDateTime = (isoDate: string, time?: string) => {
  const date = new Date(isoDate); 
  const datePart = date.toLocaleDateString();
  const timePart = time ? time : date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
  return `${datePart} • ${timePart}`;
}



const UserEvents: React.FC = () => {
  const {authHeader} = useAuth();
  const [searchParams, setSearchParams] = useSearchParams(); 
  
  const [events, setEvents] = useState<EventItem[]>([]); 
  const [loading, setLoading] = useState(false); 
  const [err, setErr] = useState<string | null>(null); 

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const [favorites, setFavorites] = useState<string[]>([]);


  const listURL = useMemo(() => {
    const url = new URL("http://localhost:5000/api/events");
    const push = (k: string, v?: string) => v && v.trim() && url.searchParams.set(k, v.trim());

    push("category", category);
    push("city", city);
    push("from", from);
    push("to", to);

    //Users can only see published events
    url.searchParams.set("status", "published"); 
    return url.toString();

  }, [category, city, from, to]);


  const fetchEvents = async () => {
    setLoading(true); 
    setErr(null);

    try {
      const res = await fetch(listURL, {
        headers: {"Content-Type" : "application/json", ...authHeader()}
      });

      if (!res.ok) {
        const msg = await res.text(); 
        throw new Error(msg || `Failed to fetch events (${res.status})`);
      }
      const data = await res.json(); 
      setEvents(Array.isArray(data) ? data : []);

    } catch (e: any) {
      setErr(e.message ?? "Could not load events");
      setEvents([]);
    } finally {
      setLoading(false); 
    }
  }; 


  useEffect(() => {
    fetchEvents();
  }, [listURL]);


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


  //Fetch user's favorites on load 
  useEffect(() => {
    if (!authHeader()) return; 

    fetch("http://localhost:5000/api/users/favorites", {
      headers: {...authHeader()}
    })
    .then(res => res.ok ? res.json(): [])
    .then(data => {
      const ids = data.map((item: any) => item._id || item); 
      setFavorites(ids);
    })
    .catch(console.error);

   }, []);


  const toggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
   
   try {
    const res = await fetch(`http://localhost:5000/api/users/favorites/${eventId}`, {
      method: "POST",
      headers: {"Content-Type": "application/json", ...authHeader()}
    });
 
    if (res.ok) {
     const data = await res.json();
     setFavorites(data.favorites); 
    }
 
   } catch (err) {
     console.error("Failed toggle")
   }
 };


  return(
   <UserLayout> 
    
    <div className='events_page'>
      <div className='events_header'>
        <h2 className='events_title'>Events</h2>
      </div>

      <form className='filter_form' onClick={syncURL}>
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

         
      <div className='events_body'>
        {loading && <div className='loading'>Loading Events...</div>}

        {!loading && err && <div className='error'>⚠️ {err}</div>}

        {!loading && !err && events.length === 0 && (
          <div className='empty-state'>
           <div className='empty-badge'>No events found!</div>
          </div>
        )}

        {!loading && !err && events.length > 0 && (
          <div className='events_grid'>
           {filteredEvents.map((event) => {

            return (
             <Link key={event._id} className='event-card' to={`/events/${event._id}`}>
              {/*Favorite button*/}
              <button
               className={`fav-btn ${favorites.includes(event._id) ? "active" : '' }`}
               title="Add to favorites"
               onClick={(e) => toggleFavorite(e, event._id)}
              >
                {favorites.includes(event._id) ? <FaHeart/> : <FaRegHeart/>}
              </button>


               {event.coverImageURL ? (
                <div className='event-img-wrap'>
                  <img src={event.coverImageURL} alt={event.title} />
                </div>
               ) : (
                <div className="event-img-placeholder">🎟️</div>
               )}

            <div className='event-content'>
             <h3>{event.title}</h3> 

             <div className='event-meta'>
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

             <div className='event-tags'>
              <span className='event-category'>{event.category}</span>
              <span className='event-price'>
                {event.isFree 
                      ? "Free"
                      :event.priceMin && event.priceMax
                        ? `${event.priceMin}€ - ${event.priceMax}€`  
                        : event.price
                          ? `${event.price.toFixed(2)}€`
                          : '-'
                     }
              </span>

              {event.avgRating && event.avgRating > 0 ? (
                <span className='event-rating'>
                  <span className='star-icon'>★</span>
                   {event.avgRating.toFixed(1)}
                </span>
              ) : null}
             </div>

             {event.creator?.username && (
              <div className='event-by'>
                Posted by <b>{event.creator.username}</b> 
              </div>
             )}

            </div>
                
          </Link>

           )}
          )}
          </div>
        )}
      </div>

    </div>


   </UserLayout>
  );
};


export default UserEvents;
