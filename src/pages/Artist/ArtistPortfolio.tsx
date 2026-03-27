import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';


import {FaMapMarkerAlt, FaEnvelope} from 'react-icons/fa';

import ArtistLayout from './artistLayout';
import './ArtistPortfolio.css';



const ArtistPortfolio: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const {authHeader, user} = useAuth();
  const navigate = useNavigate(); 
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); 

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0); 
  
  
  //Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
       const res = await fetch(`http://localhost:5000/api/users/${id}/public-profile`, {
         headers: { ...authHeader() }
       }); 

       if (res.ok) {
         const data = await res.json(); 
         setProfile(data);

       } else {
         setError("Profile not found");
       }

      } catch (err) {
        console.error("Could not fetch profile", err);
        setError("An error occured");

      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProfile();
  }, [id, authHeader]);


  //Swipe through gallery images 
  const galleryImages = profile?.gallery ?? [];

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


  if (loading) return <ArtistLayout><div className="loading_message">Loading profile...</div></ArtistLayout>;
  if (error || !profile) return <ArtistLayout><div className="error_message">{error}</div></ArtistLayout>;
  

  return(
    <ArtistLayout>
     <div className='portfolio_container'>
       
       <div className='portfolio_card'>
        <div className='portfolio_header'>
         <div className='portfolio_banner'></div>
        </div>

        <div className='portfolio_content'>
         <div className='portfolio_top-row'>
          <div className='portfolio_titles'>
           <h2>{profile.username}</h2>

           <span className='portfolio_role'>
            {profile.professionType && profile.professionType !== "None" ? profile.professionType : profile.role}
           </span>

          </div>

          {/*Message button*/}
          {user?.id !== profile._id && (
            <button
             className='message_btn'
             onClick={() => navigate("/chat", {
              state: {
                startChatWith: {
                  _id: profile._id,
                  username: profile.username,
                  avatar: profile.avatar 
                }
               }
             })}
            >
              <FaEnvelope/> Message 
            </button>
          )}

         </div>

         <div className='portfolio_meta'>
          {profile.city && <span className='meta_item'><FaMapMarkerAlt/> {profile.city}</span>}

          {profile.LookingForCollab && (
            <span className="collab_badge">Open to Collaborations</span>
          )}
         </div>

   
         <div className="divider"></div>


         <div className='portfolio_details'>

          {profile.skills && profile.skills.length > 0 && (
           <div className='detail_section'>
            <h3>Skills</h3>

            <div className="skills_grid">
             {profile.skills.map((skill: string, index: number) => (
               <span key={index} className="skill_tag">{skill}</span>
             ))}
            </div>
           </div>
          )} 

          <div className='detail_section'>
           <h3>About</h3>

           <p>{profile.portfolio || "This artist hasn't written a portfolio yet."}</p>
          </div>

          {/*Photo gallery*/}
          {profile.gallery && profile.gallery.length > 0 && (
            <div className='detail_section'>
             <h3>Gallery</h3>

             <div className='portfolio_gallery'>
              {profile.gallery.map((img: string, index: number) => (
                <button
                 key={index}
                 type="button"
                 className='portfolio_gallery-item'
                 onClick={() => openLightBox(index)}
                >
                  <img src={img} alt={`Gallery image ${index + 1}`} />
                </button>
              ))}
             </div> 
            </div>
          )}

         </div>
        </div>
       </div>
     </div>

     {/*Gallery modal*/}
     {lightboxOpen && galleryImages.length > 0 && (
       <div className="portfolio_lightbox" onClick={closeLightBox}>
        <div className="portfolio_lightbox-inner" onClick={(e) => e.stopPropagation()}>
         <button
          className="portfolio_lightbox-close"
          type="button"
          onClick={closeLightBox}
         >
           x
         </button>

         <button
          className="portfolio_lightbox-nav--prev"
          type="button"
          onClick={showPrev}
         >
           ‹
         </button>

         <img
          src={galleryImages[lightboxIndex]}
          alt={`Gallery image ${lightboxIndex + 1}`}
          className="portfolio_lightbox-img"
         />

         <button
          className="portfolio_lightbox-nav--next"
          type="button"
          onClick={showNext}
         >
           ›
         </button>

         <div className="portfolio_lightbox-counter">
          {lightboxIndex + 1}/{galleryImages.length}
         </div>

        </div> 
       </div>
     )}

    </ArtistLayout>
  );
};


export default ArtistPortfolio; 