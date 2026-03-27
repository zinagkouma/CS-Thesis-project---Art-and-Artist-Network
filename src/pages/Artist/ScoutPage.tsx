import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext'; 
import ArtistLayout from './artistLayout';

import { FaUser } from 'react-icons/fa';
import './ScoutPage.css';



type RoleA = "Director" | "Musician" | "None"; 
type RoleB = "Actor" | "Musician" | "Venue" | "";


const ScoutPage: React.FC = () => {
  const navigate = useNavigate(); 
  const {authHeader, user} = useAuth();

  const [roleA, setRoleA] = useState<RoleA>("None");
  const [roleB, setRoleB] = useState<RoleB>("");
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false); 
  
  
  //Match B options based on A value
  const getBOptions = (): RoleB[] => {
    if (roleA === "Director") return ["Actor", "Venue"];
    if (roleA === "Musician") return ["Musician", "Venue"];
    return []; 
  };


  const handleRoleAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoleA = e.target.value as RoleA;
    setRoleA(newRoleA);
    setRoleB("");
    setResults([]); 
    setHasSearched(false); 
  };


  //Fetch the results 
  const handleSearch = async () => {
    if (!roleB) return;
    setLoading(true);
    setHasSearched(true); 

    try {
     //Choose the correct route according to what is being searched  
     let endpoint = ""; 
     if (roleB === "Venue") {
       endpoint = "http://localhost:5000/api/venues/scout";

     } else {
       endpoint = `http://localhost:5000/api/users/scout?professionType=${roleB}`;
     }

     const res = await fetch(endpoint, {
       headers: {...authHeader()}
     });

     if (res.ok) {
       const data = await res.json();

       const filteredData = data.filter((item: any) => item._id !== user?.id); //Exclude current user 
       setResults(filteredData);

     } else {
       console.error("Failed to fetch search results");
     }
     
    } catch (err) {
      console.error("Scouting error:", err);

    } finally {
      setLoading(false);
    }
  }; 


  return(
   <ArtistLayout>
    <div className='scout_page'>

     <div className='scout_header'>  
      <h2 className='scout_title'>Scout collaborators and venues</h2>

      <button
       className='scout_profile-btn'
       onClick={() => navigate('/artist/profile')}
      >
       <FaUser/>
       My Profile 
      </button>
     </div> 

     <div className='scout_sentence-container'>
       <span className='scout_text'>I am a</span> 

       <select
        className='scout_select'
        value={roleA}
        onChange={handleRoleAChange}
       >
         <option value="None">Select Speciality</option>
         <option value="Director">Director</option>
         <option value="Musician">Musician</option>
       </select>

       <span className='scout_text'>looking for a</span>

       <select 
        className='scout_select'
        value={roleB}
        onChange={(e) => setRoleB(e.target.value as RoleB)}
        disabled={roleA === "None"}
       >
         <option value="">{roleA === 'None' ? '...' : 'Select Target...'}</option>
          {getBOptions().map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
       </select>

       <button
        className='scout_btn'
        onClick={handleSearch}
        disabled={!roleB || loading}
       >
         {loading ? 'Searching...' : 'Search'}
       </button>
     </div>


     {/*Show the results*/} 
     <div className={`scout_results-container ${results.length > 0 ? "has-results" : ""}`}>
       {loading ? (
         <p className='scout_placeholder'>Scouting for {roleB}s...</p>

       ) : hasSearched && results.length === 0 ? (
         <p className='scout_placeholder'>No {roleB}s found</p>

       ) : results.length > 0 ? (

        <div className='scout_results-grid'>
          {results.map((item) => (
           <div key={item._id} className='scout_result-card'>
            <h4>{item.username || item.name}</h4>
         
            <p className='result_type'>{item.professionType || item.venueType}</p>
            <p className='result_city'>{item.city}</p>

            {item.skills && item.skills.length > 0 && (
             <p className='result_skills'><strong>Skills: </strong> {item.skills.join(", ")}</p> 
            )}

            {item.capacity && (
             <p className='result_capacity'><strong>Capacity: </strong> {item.capacity} people</p> 
            )}

            <button
             className='result_link'
             onClick={() => navigate(
              roleB === "Venue"
                   ? `/venues/${item._id}`
                   : `/artist/portfolio/${item._id}`
             )}
            >
             {roleB === "Venue" ? "View Details" : "View Portfolio"}
            </button>
           </div>

          ))}
        </div>
       ) : (

         <p className='scout_placeholder'>Results will appear here...</p>
       )}

     </div>
    </div>
   </ArtistLayout> 
  );
};


export default ScoutPage; 