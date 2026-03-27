import React, {useState, useEffect} from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
  } from 'recharts'; 
import { useAuth } from '../../context/AuthContext';

import ArtistLayout from './artistLayout';
import './artistStats.css';



type tabOption = "Followers" | "Events"; 


interface FollowerStats {
  total: number;
  newThisMonth: number; 
  growthRate: number; 
  chartData: {month: string, count: number}[]; 

  recentFollowers: {
    _id: string;
    username: string;
    role: string; 
    date: string; 
  }[]; 

  breakdown: {name: string; value: number}[];
}


interface EventStats {
  publishedEvents: number;
  averageRating: number; 
  totalRatingsCount: number;  

  totalAttendees: number;
  avgAttendees: number;
  totalRevenue: number; 

  statusBreakdown: {name: string, value: number}[]; 
  chartData: {month: string, count: number}[]; 
}


const ArtistStats: React.FC = () => {
  const {authHeader} = useAuth(); 
  const [activeTab, setActiveTab] = useState<tabOption>("Followers");

  //States for the data
  const [stats, setStats] = useState<FollowerStats | null>(null); 
  const [eventStats, setEventStats] = useState<EventStats | null>(null);

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 

  
  const fetchFollowerStats = async () => {
    setLoading(true);
    setError(null); 
    try {
     const res = await fetch("http://localhost:5000/api/stats/followers", {
       headers: {...authHeader()}
     });
     
     if (!res.ok) throw new Error("Failed to load data");
     
     const data = await res.json(); 
     setStats(data); 

    } catch (err) {
      console.error(err); 
      setError("Could not load statistics!"); 

    } finally {
      setLoading(false); 
    }
  };


  const fetchEventStats = async () => {
    setLoading(true); 
    setError(null);
    try {
     const res = await fetch("http://localhost:5000/api/stats/events", {
       headers: {...authHeader()}
     });
     
     if (!res.ok) throw new Error("Failed to load data");

     const data = await res.json();
     setEventStats(data); 
     
    } catch (err) {
      console.error(err);
      setError("Could not load stats!");

    } finally {
      setLoading(false); 
    }
  };


  //Fetch according to tab
  useEffect(() => {
    if (activeTab === "Followers"){
      fetchFollowerStats();
    } else if (activeTab === "Events") {
      fetchEventStats();
    }
  }, [activeTab]);


  //Make the gauge chart
  const GAUGE_COLORS = ['#fbc02d', '#e0e0e0'];

  const ratingValue = eventStats?.averageRating || 0; 
  const gaugeData = [
    {name: "Score", value: ratingValue},
    {name: "Remaining", value: 5 - ratingValue}
  ];

   
  

   return (
    <ArtistLayout>
     <div className='artistStats'>
      <div className='artistStats_header'>
        <h2 className='artistStats_title'>Statistics</h2>

        {/*Tab Menu*/}
        <div className='artistStats_tab-container'>
          <button
           className={`stats_tab ${activeTab === "Followers" ? "active" : ""}`}
           onClick={() => setActiveTab("Followers")}
          >
            Followers
          </button>

          <button
           className={`stats_tab ${activeTab === "Events" ? "active" : ""}`}
           onClick={() => setActiveTab("Events")}
          >
            Events
          </button>
        </div>
      </div>

      {/*Content Area*/}
      <div className='artistStats_content'>
       
       {loading && <div>Loading...</div>}

       {!loading && error && <div>{error}</div>}
 
       {!loading && !error && activeTab === "Followers" && stats && (
         <div className='artistStats_followers-container'>

          {/*TOP: Top cards*/}
          <div className='artistStats_cards-row'>
            <div className='artistStats_card'>
             <h4>Total Followers</h4>
             <div className='artistStats_big-num'>{stats.total}</div>
            </div>

            <div className='artistStats_card'>
             <h4>New (This month)</h4> 
             <div className='artistStats_big-num'>{stats.newThisMonth}</div>
             <span className={`stats_trend ${stats.growthRate >= 0 ? "positive" : "negative"}`}>
               {stats.growthRate >= 0 ? "+" : ""}{stats.growthRate}% vs last month
             </span>
            </div>

            <div className='artistStats_card'>
              <h4>Average Growth</h4>
              <div className='artistStats_big-num'>--</div>
              <span className='artistStats_sub'>Not enough data</span>
            </div>
          </div>


          {/*MIDDLE: Line and pie charts*/}
          <div className='artistStats_charts-row'>
            
          {/*Growth chart*/}
          <div className='artistStats_chart'>
            <h3>New followers (Last 6 months)</h3>
            <div className='artistStats_chart-wrapper'>
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
               <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{fill: "#888", fontSize: 12}}
                dy={10}
               /> 

               <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: "#888", fontSize: 12}}
                allowDecimals={false}
               />

               <Tooltip
                contentStyle={{borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}}
               />

               <Line
                type="monotone"
                dataKey="count"
                stroke="#0a48a4"
                strokeWidth={3}
                dot={{r: 4, fill: "#0a48a4", strokeWidth: 2, stroke: "#fff"}}
                activeDot={{r: 6}}
               />

              </LineChart>
             </ResponsiveContainer>

            </div>
          </div>


          {/*Followers's roles pie chart*/}  
          <div className='artistStats_pie-chart'>
            <h3>Follower Composition</h3>
            {stats.breakdown.length > 0 ? (
             <div className='pie-wrapper'>
               <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <PieChart>
                 <Pie
                  data={stats.breakdown}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  cx='50%'
                  cy='50%'
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={true}
                 >
                  {stats.breakdown.map((entry, index) => (
                    //Blue for Artist and green for User 
                    <Cell key={`cell-${index}`} fill={entry.name === "Artist" ? '#1976d2' : '#2c9985'} />
                  ))}
                                                 
                </Pie> 
                <Tooltip
                 contentStyle={{borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}} 
                /> 
                <Legend verticalAlign="bottom" iconType="circle" />
               </PieChart> 
               </ResponsiveContainer>            
              
             </div>

            ) : (
               <div className='field_empty'>Not enough data</div>
            )
          }    
          </div>
         </div>
             

          {/*BOTTOM: Recent followers list*/}
          <div className='artistStats_recent'>
           <h3>Recent Followers</h3>
           {stats.recentFollowers.length === 0 ? (
             <div className='field_empty'>No followers yet</div>
           ) : (
             <ul className='recent_list'>
              {stats.recentFollowers.map((user) => (
                <li key={user._id} className='recent_item'>
                 <div className='recent_avatar'>
                   {user.username.charAt(0).toUpperCase()} 
                 </div>

                 <div className='recent_info'>
                  <span className='recent_name'>{user.username}</span>
                  <span className='recent_date'>
                   {new Date(user.date).toLocaleDateString()} 
                  </span>
                 </div>
                </li>
              ))}
             </ul>
           )} 

          </div>

      </div>
    
        )}


       {!loading && !error && activeTab === "Events" && eventStats && (
        <div className='artistStats_events-container'>
         <div className='artistStats_cards-row'>
          
         {/*Global rating card*/}
         <div className='artistStats_card'>
          <h3>Global events rating</h3>

          <div className='gauge_container'>
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
             <Pie
              data={gaugeData}
              cx="50%"
              cy="85%"
              startAngle={180} 
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
             >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
              ))}  
             </Pie> 
            </PieChart>
           </ResponsiveContainer>

           <div className='gauge_score-text'>
            <div className='score-value'>
             {ratingValue}<span className='score-max'>/5</span> 
            </div>

            <div className='score-label'>
              Average Score
            </div>
           </div>
          </div>

          <span className='artistStats_sub centered'>
            Based on {eventStats?.totalRatingsCount || 0} ratings across {eventStats?.publishedEvents || 0} {eventStats?.publishedEvents === 1 ? "event" : "events"}
          </span>
         </div> 

         {/*Total revenue card*/}
         <div className='artistStats_card'>
          <h3>Total revenue</h3>
          <div className='artistStats_big-num' style={{color: "#10b981"}}>
           {eventStats?.totalRevenue.toLocaleString('en-GR', {
             style: "currency",
             currency: "EUR"
           })}
          </div>

          <div style={{marginTop: 'auto'}}>
           <span className='artistStats_sub'>
            Estimated earnings from ticket sales
           </span>
          </div>
         </div>

         {/*Attendance and Volume card*/}
         <div className='artistStats_card'>
          <h3>Total attendance</h3>

          <div className='artistStats_big-num'>
            {eventStats?.totalAttendees}
          </div>

          {/*Trend indicator*/}
          <div className='stats_trend positive'>
           <span>{eventStats?.avgAttendees}</span> avg. per event 
          </div>

          <span className='artistStats_sub auto-margin'>
           Total people reached across {eventStats?.publishedEvents} {eventStats?.publishedEvents === 1 ? "event" : "events"}
          </span>
         </div>
       </div>


         <div className='artistStats_charts-row'>
          <div className='artistStats_chart'>
           <h3>Ticket sales trend</h3>
            
           <div className='artistStats_chart-wrapper'>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventStats.chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke='#eee' />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: "#888", fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: "#888", fontSize: 12}} allowDecimals={false} />
                <Tooltip contentStyle={{borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}} />
                <Line 
                 type="monotone"
                 dataKey="count"
                 stroke='#10b981'
                 strokeWidth={3}
                 dot={{r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff"}}
                 activeDot={{r: 6}}
                />

              </LineChart>
            </ResponsiveContainer>
           </div> 
          </div>




          {/*Status pie chart*/}
          <div className='artistStats_event-pie'>
            <h3>Status breakdown</h3>
            {eventStats?.statusBreakdown && eventStats.statusBreakdown.length > 0 ? (
             <div className='pie-wrapper'>
              <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                <Pie
                 data={eventStats.statusBreakdown}
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={2}
                 cx='50%'
                 cy='50%'
                 dataKey="value"
                 nameKey="name"
                 isAnimationActive={true}
                >
                 {eventStats.statusBreakdown.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.name === "Published" ? '#12b0d7' : 'coral'} /> 
                 ))}
                </Pie>

                <Tooltip
                 contentStyle={{borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}}
                />
                
                <Legend verticalAlign="bottom" iconType="circle"/>
               </PieChart>
              </ResponsiveContainer>
             </div>

            ) : (
             <div className='field_empty'>No events created yet</div> 
          )}
          </div>

         </div>


         
       </div>
       )}

      </div>  
     </div>

    </ArtistLayout>
 ); 
};


export default ArtistStats;