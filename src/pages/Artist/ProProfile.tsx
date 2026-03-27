import React, {useState, useEffect} from 'react';
import { useAuth } from '../../context/AuthContext';

import ArtistLayout from './artistLayout';
import './ProProfile.css'; 



const ProProfile: React.FC = () => {
  const {user, authHeader} = useAuth(); 
  
  const [professionType, setProfessionType] = useState("None");
  const [city, setCity] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [skills, setSkills] = useState("");
  const [lookingForCollab, setLookingForCollab] = useState(false); 
  const [gallery, setGallery] = useState(""); 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  //Fetch profile data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
       const res = await fetch(`http://localhost:5000/api/users/profile`, {
         headers: {...authHeader()}
       }); 

       if (res.ok) {
         const data = await res.json();

         if (data.professionType) setProfessionType(data.professionType);
         if (data.city) setCity(data.city);
         if (data.portfolio) setPortfolio(data.portfolio);
         if (data.lookingForCollab) setLookingForCollab(data.lookingForCollab);
         if (data.skills) setSkills(data.skills.join(", "));
         if (data.gallery) setGallery(data.gallery.join("\n"));
       }

      } catch (err) {
        console.error("Failed to load profile", err); 
      } 
    };
   
    if (user?.id) fetchProfile(); 
  }, [user, authHeader]);


  //Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    //Convert comma-sep skills to an array 
    const skillsArray = skills.split(",").map(skill => skill.trim()).filter(s => s !== ""); 

    const galleryArray = gallery
         .split("\n")
         .map(url => url.trim())
         .filter(url => url.length > 0);

    if (galleryArray.length > 3) {
      setMessage("You can only add up to 3 images!");
      setLoading(false);
      return;  
    }     


    const payload = {
      professionType,
      city,
      portfolio,
      skills: skillsArray,
      lookingForCollab,
      gallery: galleryArray  
    };

    try {
     const res = await fetch("http://localhost:5000/api/users/profile/edit", {
       method: "PUT",
       headers: {
        "Content-Type" : "application/json",
        ...authHeader()
       },
       body: JSON.stringify(payload)
     }); 
     
     if (res.ok) {
       setMessage("Profile updated successfully!");

     } else {
       setMessage("Failed to update profile"); 
     } 
    } catch (err) {
      console.error(err);
      setMessage("An error occured");

    } finally {
      setLoading(false); 
    }
  };


  return(
   <ArtistLayout>
    <div className='proProfile_container'>
     <div className='proProfile_card'>
       <h2>Setup your professional profile</h2>
       <p className='proProfile_sub'>Fill this out so other professionals can scout you!</p>

       {message && <div className={`proProfile_msg ${message.includes("successfully") ? "success" : "error"}`}>{message}</div>}

       <form className='proProfile_form' onSubmit={handleSubmit}>
        
        {/*Left side*/}
        <div className='form_left'>
         <div className='form_group'>
          <label>Profession Type</label>
          <select 
           value={professionType}
           onChange={(e) => setProfessionType(e.target.value)}
          >
            <option value="None">None</option>
            <option value="Director">Director</option>
            <option value="Musician">Musician</option>
            <option value="Actor">Actor</option>
          </select>
         </div>

         <div className='form_group'>
          <label>Base City</label>
          <input 
           type="text"
           value={city}
           placeholder="Athens, Thessaloniki"
           onChange={(e) => setCity(e.target.value)}
          />
         </div>

         <div className='form_group full_width'>
           <label>Skills</label>
           <input 
            type="text"
            value={skills}
            placeholder="Enter your skills (comma-sep)"
            onChange={(e) => setSkills(e.target.value)} 
           />
         </div>

         <div className='form_group full_width'>
          <label>Portfolio</label>
          <textarea 
           value={portfolio}
           className='portfolio_input'
           placeholder=" Your portfolio here"
           rows={4}
           maxLength={1500}
           onChange={(e) => setPortfolio(e.target.value)} 
          />
         </div>

         <div className='form_group checkbox-group full_width'>
          <input
           type="checkbox"
           id="collab"
           checked={lookingForCollab}
           onChange={(e) => setLookingForCollab(e.target.checked)}
          />
          <label htmlFor="collab">I am currently looking for collaborations</label>
         </div>
        </div>


        {/*Right side*/}
        <div className='form_right'>
          <div className='form_group'>
           <label>Gallery URLs</label>
           <textarea
            value={gallery}
            onChange={e => setGallery(e.target.value)}
            rows={4}
            placeholder="Enter up to 3 URLs (one per line)"
           />

           {/*Gallery preview*/}
           {gallery.trim() && (
             <div className='gallery_preview'>
              {gallery.split("\n").map((url, index) => {
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


         <button type="submit" className='proProfile_submit' disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
         </button>

       </form>
     </div>
    </div>
   </ArtistLayout>
  );
 };


 export default ProProfile; 