import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

import ArtistLayout from './artistLayout';
import './venueDetails.css';



type Venue = {
  _id: string;
  name: string;
  description: string;
  venueType: string;
  city: string;
  address: string;
  capacity?: number;
  contactNumber: string;
  image?: string;
  gallery?: string[]; 
  location: {
    type: "Point";
    coordinates: [number, number]  //[lon, lat]
  }
};


const VenueDetails: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const {authHeader} = useAuth();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0); 
  
  
  //Fetch venue details
  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
       const res = await fetch(`http://localhost:5000/api/venues/${id}`, {
         headers: {...authHeader()}
       }); 

       if (!res.ok) {
         throw new Error("Could not fetch venue details");
       }

       const data = await res.json();
       setVenue(data); 

      } catch (err) {
        console.error(err);
        setError("Could not load venue"); 

      } finally {
        setLoading(false); 
      } 
    };

    fetchVenueDetails(); 
  }, [id, authHeader]);
  
  
  //Swipe through gallery images 
  const galleryImages = venue?.gallery ?? [];

  const openLightBox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const closeLightBox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLightboxOpen(false); 
  }
  
  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => 
     prev === 0 ? galleryImages.length - 1 : prev - 1       
    );
  };
  
  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) =>
     prev === galleryImages.length - 1 ? 0: prev + 1 
    );
  };


  if (loading) {
    return <ArtistLayout><div className='venueDetails_loading'>Loading...</div></ArtistLayout>
  }
  
  if (error || !venue) {
    return(
      <ArtistLayout>
       <p>{error || "Venue not found"}</p> 
      </ArtistLayout>  
    );
  }


  //Take coordinates from GeoJSON location
  let lat: number | null = null;
  let lon: number | null = null;

  if (venue.location && venue.location.coordinates.length === 2) {
    const [lonCoord, latCoord] = venue.location.coordinates;
    lat = latCoord;
    lon = lonCoord;
  }

  const hasCoords = (lat !== null) && (lon !== null);

  const mapSrc = hasCoords 
       ? `https://maps.google.com/maps?q=${lat},${lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`
       : "";


  return(
    <ArtistLayout>
     <div className='venueDetails_container'>
       <div className='venueDetails_card'>
        
        {/*Header*/}
        {venue.image && (
         <div className='venueDetails_cover'>
          <img src={venue.image} alt={venue.name} onError={(e) => (e.currentTarget.style.display = "none")} />
         </div>
        )}

        <div className='venueDetails_content'>
          <div className='venueDetails_header'>
           <h2>{venue.name}</h2>
           <span className='venueDetails_badge'>{venue.venueType}</span>
          </div>

          <div className='venueDetails_info-grid'>
           <div className='info_item'>
            <span className='info_label'>Location: </span>
            <span className='info_value'>{venue.city}, {venue.address}</span>
           </div>

           <div className='info_item'>
            <span className='info_label'>Capacity: </span>
            <span className='info_value'>{venue.capacity ? `${venue.capacity} people` : "Not specified"}</span>
           </div>

           <div className='info_item'>
            <span className='info_label'>Contact: </span>
            <span className='info_value'>{venue.contactNumber}</span>
           </div>
          </div>

          {/*Description*/}
          {venue.description && (
            <div className='venueDetails_section'>
             <h3>About</h3>
             <p>{venue.description}</p>
            </div> 
          )}

          {/*Gallery*/}
          {venue.gallery && venue.gallery.length > 0 && (
            <div className='venueDetails_section'>
             <h3>Gallery</h3>

             <div className='venueDetails_gallery'>
              {venue.gallery.map((img, index) => (
                <button
                 key={index}
                 type="button"
                 className='venueDetails_gallery-item'
                 onClick={() => openLightBox(index)}
                >
                 <img src={img} alt={`Gallery image ${index + 1}`} />
                </button>
              ))}
             </div>
            </div>
          )} 

          {/*Map*/}
          <div className='venueDetails_section'>
           <h3>Location on map</h3>
           {hasCoords ? (
             <div className='venueDetails_map-wrapper'>
              <iframe
               title="Venue location"
               src={mapSrc}
               loading="lazy"
               referrerPolicy="no-referrer-when-downgrade"
              >
              </iframe>
             </div>
            ) : (
              <p className='venueDetails_no-map'>
                Location coordinates are not available
              </p>  
            )}
          </div>
        </div>

       </div>
     </div>


     {/*Gallery modal*/}
     {lightboxOpen && galleryImages.length > 0 && (
       <div className='venueDetails_lightbox' onClick={closeLightBox}>
        <div className='venueDetails_lightbox-inner' onClick={(e) => e.stopPropagation()}>
         <button
          className='venueDetails_lightbox-close'
          type="button"
          onClick={closeLightBox}
         >
           x
         </button> 

         <button
          className='venueDetails_lightbox-nav--prev'
          type="button"
          onClick={showPrev}
         >
           ‹
         </button>

         <img
          src={galleryImages[lightboxIndex]}
          alt={`Gallery image ${lightboxIndex + 1}`}
          className='venueDetails_lightbox-img'
         />

         <button
          className='venueDetails_lightbox-nav--next'
          type="button"
          onClick={showNext}
         >
           ›
         </button>

         <div className="venueDetails_lightbox-counter">
          {lightboxIndex + 1}/{galleryImages.length}
         </div>

        </div> 
       </div> 
     )}

    </ArtistLayout>
  ); 
};


export default VenueDetails; 