import React, {useEffect, useState} from 'react';
import {useAuth} from '../../context/AuthContext';

import AdminLayout from './adminLayout';
import './AddVenue.css';



const AddVenue: React.FC = () => {
  const {authHeader} = useAuth();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venueType, setVenueType] = useState("Theater");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [image, setImage] = useState("");
  const [gallery, setGallery] = useState(""); 

  const [lon, setLon] = useState("");
  const [lat, setLat] = useState("");

  //Search address autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({text: "", type: ""}); 


  //Real time address search
  useEffect(() => {
    if (address.length < 3 || !city) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
       const query = `${address}, ${city}, Greece`;
       const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
       
       const res = await fetch(url, {
         headers: {"User-Agent": "EventFinder/1.0"}
       });

       const data = await res.json();
       setSuggestions(data);
       setShowDropdown(true);

      } catch (err) {
        console.error("Autocomplete fetch failed", err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 500); 
    return () => clearTimeout(timer);

  }, [address, city]);


  //Handle venue submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({text: "", type: ""});

    if (!lon || !lat) {
      setMessage({text: "Please select a valid address from the dropdown!", type: "error"});
      setLoading(false);
      return; 
    }


    const galleryArray = gallery
         .split('\n')  //Split by newlines
         .map(url => url.trim())
         .filter(url => url.length > 0);

    if (galleryArray.length > 3) {
      setMessage({text: "You can only add up to 3 images!", type: "error"});
      setLoading(false);
      return;
    }     

    const payload = {
      name,
      venueType,
      description,
      city,
      address,
      capacity: capacity ? Number(capacity) : undefined,
      contactNumber,
      image,
      gallery: galleryArray,

      location: {
        type: "Point",
        coordinates: [Number(lon), Number(lat)]
      }
    };

    try {
     const res = await fetch("http://localhost:5000/api/venues/add", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
          ...authHeader()
       },
       body: JSON.stringify(payload)
     }); 

     if (res.ok) {
       setMessage({text: "Venue added successfully!", type: "success"});
       
       //Clear form 
       setName(""); 
       setDescription("");
       setCity("");
       setAddress("");
       setCapacity("");
       setContactNumber("");
       setLon("");
       setLat("");
       setVenueType("Theater");
       setImage("");
       setGallery(""); 

     } else {
      const errorText = await res.text();
      let errorMsg = "Could not add venue";

      try {
       const errData = JSON.parse(errorText); 
       errorMsg = errData.message || errorMsg;

      } catch (parseErr) {
        console.error("Error parsing error response", errorText);
      }
      
      setMessage({text: errorMsg, type: "error"});
     }

    } catch (err) {
      console.error(err);
      setMessage({text: "Network error occured!", type: "error"}); 

    } finally {
      setLoading(false);
    }
  };


  return(
   <AdminLayout>
    <div className='addVenue_container'>
     <div className='addVenue_card'>
      <h2>Add a new venue</h2>
      <p className='addVenue_sub'>Create a new venue for artists to scout.</p>

      {message.text && (
       <div className={`addVenue_msg ${message.type}`}>
        {message.text}
       </div> 
      )} 

      <form className='addVenue_form' onSubmit={handleSubmit}>

       {/*Left side*/}
       <div className='form_left'>  
        <div className='form_group'>
         <label>Venue Name *</label> 
         <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div> 

        <div className='form_group'>
         <label>Venue Type *</label>
         <select value={venueType} onChange={e => setVenueType(e.target.value)}>
          <option value="Theater">Theater</option>
          <option value="Live Music">Live Music</option>
          <option value="Stadium">Stadium</option>
          <option value="Other">Other</option>
         </select>
        </div>

        <div className='form_group full_width'>
         <label>Description</label>
         <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className='form_group'>
         <label>City *</label>
         <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
        </div>
  
        <div className='form_group address'>
         <label>Address *</label>
         <input 
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={city ? "Search address.." : "Type a city first..."}
          disabled={!city}
          required
         />
        

        {/*Dropdown menu for address*/}
        {showDropdown && suggestions.length > 0 && (
          <ul className='address_dropdown'>
           {suggestions.map((s, i) => (
            <li key={i} onClick={() => {
              setLon(s.lon);
              setLat(s.lat);
              setSuggestions([]);
              setShowDropdown(false);
            }}>
             {s.display_name}
            </li>
           ))}
          </ul> 
        )}
     </div>


        <div className='form_group'>
         <label>Capacity</label>
         <input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
        </div>

        <div className='form_group'>
         <label>Contact Number *</label>
         <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
        </div>
       </div> 


       {/*Right side*/}
       <div className='form_right'>
        <div className='form_group'>
        <label>Main image URL</label>

        <input
         type="text"
         value={image}
         onChange={e => setImage(e.target.value)}
         placeholder="Enter image URL"
        /> 

        {/*Image preview*/}
        {image.trim() && (
          <div className='image_preview'>
           <img
            src={image}
            alt="img"
            onError={(e) => (e.currentTarget.style.display = "none")}
           />
          </div>
        )}
        </div>

        <div className='form_group'>
         <label>Gallery URLs</label>

         <textarea
          value={gallery}
          onChange={e => setGallery(e.target.value)}
          rows={3}
          placeholder="Enter up to 3 URLs (one per line)"    
         />

         {/*Gallery preview*/}
         {gallery.trim() && (
           <div className='gallery_preview'>
            {gallery.split('\n').map((url, index) => {
             const cleanUrl = url.trim();
             
             if (!cleanUrl) return null;

             return(
              <img 
               key={index} 
               src={cleanUrl} 
               alt={`Gallery ${index + 1}`} 
               onError={(e) => (e.currentTarget.style.display = "none")}
              />
             );
            })}
           </div>
         )}

        </div>
       </div>

        <button type="submit" className="addVenue_submit" disabled={loading}>
         {loading ? "Saving..." : "Add Venue"}
        </button>
      </form>

     </div>
    </div>
   </AdminLayout>
  );
};


export default AddVenue; 