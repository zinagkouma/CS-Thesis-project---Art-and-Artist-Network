import React, {useEffect, useState} from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

import AdminLayout from "./adminLayout";

import "./adminStats.css"; 



interface DashboardStats {
  totalUsers: number;
  newThisMonth: number; 
  growthPercent: number; 
  history: {name: string; value: number}[]; 
  composition: {name: string; value: number}[]; 
}

const COLORS = ["#0088fe", "#00c49f", "#ffbb28"];


const AdminStats: React.FC = () => {
  const {token} = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);


  //Fetch stats 
  useEffect(() => {
    const fetchStats = async () => {
      try {
       const res = await fetch("http://localhost:5000/api/users/stats/global-analytics", {
         headers: {Authorization: `Bearer ${token}`}
       });
       
       if (res.ok) {
         const data = await res.json();
         setStats(data);
       }

      } catch (err) {
        console.error("Could not fetch stats", err); 

      } finally {
        setLoading(false); 
      }
    };

    if (token) fetchStats();

  }, [token]);


  if (loading) return <AdminLayout><div className="stats_loading">Loading...</div></AdminLayout>;
  if (!stats) return <AdminLayout><div>Error loading stats</div></AdminLayout>;



 return(
  <AdminLayout> 
   <div className="stats_container">
    <h2 className="stats_title">Platform Overview</h2>

    {/*Quick stat cards*/}
    <div className="stats_grid-top">
      <div className="stat_card">
       <h3 className="stat_card-title">Total Users</h3>
       <p className="stat_card-value">{stats.totalUsers}</p>
       <span className="stat_card-sub blue">Lifetime accounts</span>
      </div>

      <div className="stat_card">
       <h3 className="stat_card-title">New Users</h3>
       <p className="stat_card-value">{stats.newThisMonth}</p>
       <span className="stat_card-sub green">Joined this month</span>
      </div> 

      <div className="stat_card">
       <h3 className="stat_card-title">Artist Ratio</h3>
       <p className="stat_card-value">
        {Math.round((stats.composition.find(c => c.name === 'Artist')?.value || 0) / stats.totalUsers * 100)}%
       </p>
       <span className="stat_card-sub orange">Of total userbase</span> 
      </div> 
    </div>


    {/*Bottom charts*/}
    <div className="stats_grid-bottom">

      {/*Line chart*/}   
      <div className="chart_card">
       <h3 className="chart_title">User growth (Last 6 months)</h3>

       <div className="chart_wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.history}>
           <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#9ca3af", fontSize: 12}} dy={10} /> 
           <YAxis axisLine={false} tickLine={false} tick={{fill: "#9ca3af", fontSize: 12}} />
           <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
           <Line
            type="monotone"
            dataKey="value"
            stroke="#0a48a4"
            strokeWidth={3}
            dot={{r: 4, fill: "#0a48a4", strokeWidth: 2, stroke: "#fff"}}
            activeDot={{r: 6}}
           />

          </LineChart>
        </ResponsiveContainer>
       </div>
      </div>

      {/*Pie chart*/}
      <div className="chart_card">
       <h3 className="chart_title">User Composition</h3> 

       <div className="chart_wrapper center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
           <Pie
            data={stats.composition}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
           >
             {stats.composition.map((entry, index) => (
               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
             ))}
           </Pie>

           <Tooltip/>
           <Legend verticalAlign="bottom" height={36} />

          </PieChart>
        </ResponsiveContainer>
       </div>
      </div>


    </div>


   </div>

  </AdminLayout>
 );
};

export default AdminStats; 