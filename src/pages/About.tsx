import React from 'react'
import {useAuth} from '../context/AuthContext';
import UserLayout from './User/userLayout';
import ArtistLayout from './Artist/artistLayout';

import './About.css'



const About: React.FC = () => {
  const {isAuthenticated, user} = useAuth(); 

  const PageLayout = !isAuthenticated
       ? React.Fragment
       : (user?.role === "Artist" ? ArtistLayout : UserLayout); 


  return (
   <PageLayout>  
    <div className="about-container">
      <h1>Our goal: to bring the world’s live art to your doorstep</h1>

      <div className="our-story">

      <h2>Our story</h2>
      <p>It all started when Zina Gkouma, a CS student in Piraeus grew tired of having to endless scroll
         loads of listings across dozens of websites just to find a single weekend concert. 
         That was when she decided to create a platform that would bring together all the live art events of Greece in one place,
         so that anyone could easily find and attend them. Since then, Event Finder has blossomed into a vibrant community of culture-lovers and creators.
         We are proud to have helped thousands of people discover and enjoy the arts, and we are committed to continuing to do so for many years to come.</p>
         
      </div>

      <div className="what-we-offer">
        <h2>What we offer</h2>
        <ul>
          <li>
            <h3>Diverse event listings</h3>
            <p>From intimate acoustic concerts and avant-garde gallery openings 
              to Broadway-style theater and contemporary dance showcases, browse thousands of events happening near you.</p>            
          </li>

          <li>            
            <h3>Advanced search and easy discovery</h3>
            <p>Easily navigate our extensive catalog by filtering events by city, category, or date. Find exactly what you are looking for in seconds, 
               whether it's a local gig or a major festival.</p>
          </li>

          <li>
            <h3>Save favorites and explore venues</h3>
            <p>Build a personal list of your favorite upcoming events with a single click, and use our integrated interactive maps to get precise directions to
               any venue across Greece.</p>
          </li>

          <li>
            <h3>Showcase your work and connect with audiences </h3>
            <p>If you are an artist, you can promote your work and reach wider audiences through our platform. </p>
         </li> 

          <li>
            <h3>A community of culture-lovers and creators</h3>
            <p>Join a community of like-minded individuals who share your passion for the arts. Connect with fellow attendees
               and creators to share experiences, collaborate, and celebrate creativity together.</p>
          </li>
        </ul>
      </div>
      
    </div>
   </PageLayout> 
)}

export default About
