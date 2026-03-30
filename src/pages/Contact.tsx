import React, {useState} from 'react'
import {useAuth} from '../context/AuthContext';
import UserLayout from './User/userLayout';
import ArtistLayout from './Artist/artistLayout';

import './Contact.css'

const Contact: React.FC = () => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {isAuthenticated, user} = useAuth();  


  const PageLayout = !isAuthenticated 
       ? React.Fragment
       : (user?.role === "Artist" ? ArtistLayout : UserLayout);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message }),
      })

      if (res.ok) {
        setStatus('Message sent, thanks for reaching out!')
        setMessage('')
      } else {
        const payload = await res.json();
        console.error('Server responded with:', payload.error);
        setStatus(`Failed to send: ${payload.error}`);
      }
    } catch (err) {
      console.error(err)
      setStatus('Error sending message.')
    
    } finally {
      setIsLoading(false);
    }
  };

  
 const isDisabled = !isAuthenticated || isLoading || !message.trim();

 const MAX = 500; // Max characters for message

  return (
    <PageLayout>
    <div className="contact-container">
      <h2>Contact Us</h2>
      <p>We listen to our users's feedback. Send us any questions or suggestions about our website here!</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Type your message…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={MAX}
          aria-describedby='character-count'
          required
        />

       <span 
       id='character-count'
       className={`character-count ${
         MAX - message.length === 0 ? 'max-reached'
       : MAX - message.length <= 50 ? 'warning' 
       : ''

       }`}
       >
         {message.length} / {MAX}
       </span>

        <div className="submit-group"> 
        {/*Loading spinner */}

        {isLoading && (
    
         <svg
         className="spinner"
         width="40"
         height="40"
         viewBox='0 0 50 50'
         aria-hidden="true"
         >

        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b52ba"/>
            <stop offset="100%" stopColor="#f56a03"/>
          </linearGradient>
        </defs> 

        <circle
          cx="25"
          cy="25"
          r="20"
          
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="90 150"
          />

         </svg>
        )}


        {/*Bubble message wrapper */}
       <div className="bubble-msg">
         <button type="submit" disabled={isDisabled}>
          
         {isLoading ? 'Sending…' : 'Send Message'}

       </button>

       {/* Bubble renders only if not logged in */}
        {!isAuthenticated && (
          <span className="bubbleText">Log in to send message</span>
        )}
       
       </div>
      </div>
        
    </form>

      {status && <p className="contact-status">{status}</p>}
    </div>
   </PageLayout> 
 )};

export default Contact;
