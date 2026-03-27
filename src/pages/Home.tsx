import React from 'react';
import './Home.css';


import block1 from '../assets/block1.jpg';
import block2 from '../assets/block2.jpg';
import block3 from '../assets/block3.jpg';

interface HomeProps {
  onGetStartedClick: () => void; 
}


type Card ={
    title: string; 
    text: string; 
    imgSrc: string; 
    imgAlt: string; 
}

const cards: Card[] = [

    {
    title: 'Join events',
    text: 'Discover concerts, exhibitions, and theater performances happening in your city. Search by category or date and never miss the local art scene.',
    imgSrc: block1,
    imgAlt: 'Block 1',
  },
  {
    title: 'Get yourself known',
    text: 'Create and manage your own event listings with ease. Track your follower growth and view engagement statistics to build your audience.',
    imgSrc: block2,
    imgAlt: 'Block 2',
  },
  {
    title: 'Help the community',
    text: 'If you are a proffesional in the art field, connect with other peers via listings to help eachother.',
    imgSrc: block3,
    imgAlt: 'Block 3',
  },
];

const Home: React.FC<HomeProps> = ({onGetStartedClick}) => {
  return (
    <>
    <div className='home-page'> 
      <div className="home-header">
        <h1>In Event Finder, you can..</h1>
      </div>

     <section className="home-section">

      {cards.map((c) => (
        <div key={c.title} className="home-card">
          <img src={c.imgSrc} alt={c.imgAlt} />
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </div>
      ))}

    </section>

   <div className="get-started-container">
      <button className="get-started-btn" onClick={onGetStartedClick}>
         Get Started!
      </button>
     </div>

    </div>
    
    
    </>
  );
};

export default Home
