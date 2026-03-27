import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

import AdminLayout from './adminLayout';
import './VenueList.css'; 



const VenueList: React.FC = () => {
  const {authHeader} = useAuth();
  const navigate = useNavigate();
  
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<string>("");


  //Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
       setLoading(true);
       
       //Build the URL depending on whether a filter is selected
       let url = "http://localhost:5000/api/venues/scout";
       if (filterType) {
         url += `?venueType=${encodeURIComponent(filterType)}`;
       }

       const res = await fetch(url, {
         headers: {...authHeader()}
       });

       if (res.ok) {
         const data = await res.json();
         setVenues(data); 
       }

      } catch (err) {
        console.error("Could not fetch venues", err);

      } finally {
        setLoading(false);
      } 
    };

    fetchVenues();
  }, [authHeader, filterType]);


  return(
   <AdminLayout>
    <div className='venueList_container'>

     <div className='venueList_wrapper'>   
      {/*Header*/}
      <div className='venueList_header'>
       <div>
        <h2>Venue List</h2>
       </div>

       <button
        className='addVenue_btn'
        onClick={() => navigate('/admin/add-venue')}
       >
        + Add Venue
       </button>
      </div>

      {/*Filter*/}
      <div className='venueList_filter'>
       <label>Filter by type: </label>  
       <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
         <option value="">All Venues</option>
         <option value="Theater">Theater</option>
         <option value="Live Music">Live Music</option>
         <option value="Stadium">Stadium</option>
         <option value="Other">Other</option>
       </select>
      </div>


      {/*Venue list*/}
      <div className='venueList_list'>
       {loading ? (
         <p className='loading_text'>Loading...</p>
        ) : venues.length > 0 ? (
          venues.map((v) => (
            <div key={v._id} className='venueList_item'>
             <div className='venue_top'>
               <h3>{v.name}</h3>
               <span className='venue_type'>{v.venueType}</span> 
             </div> 

             <div className='venue_details'>
              <p><strong>City:</strong>{v.city}</p>
              <p><strong>Capacity:</strong>{v.capacity ? `${v.capacity} people` : 'N/A'}</p>
              <p><strong>Contact:</strong>{v.contactNumber}</p>
             </div>

             {v.description && (
              <p className='venue_desc'>{v.description}</p>  
             )}
            </div>
          ))  

        ) : (
          <div className='no-venues_text'>
           <p>No venues found</p>
          </div>  
        )}
      </div>

     </div>
    </div>
   </AdminLayout>
  );
};


export default VenueList; 