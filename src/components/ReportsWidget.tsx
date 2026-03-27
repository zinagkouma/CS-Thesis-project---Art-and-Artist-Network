import React, {useEffect, useState} from 'react';
import { useAuth } from '../context/AuthContext';

import Swal from 'sweetalert2';


import './ReportsWidget.css';



type Report = {
  _id: string;
  itemType: "Message" | "Comment"; 
  reason: string;
  description: string;
  status: "Pending" | "Resolved" | "Dismissed";
  createdAt: string; 
  reportedUser: {
    username: string;
    email: string;
  };
  
  reportedItem: {
    _id: string;
    content?: string; 
    text?: string;    
    title?: string; 
    description?: string;
  } | null;
};


const ReportsWidget:React.FC = () => {
  const {token} = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false); 
  
  
  //Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
       const res = await fetch("http://localhost:5000/api/reports", {
         headers: {Authorization: `Bearer ${token}`}
       });
       
       if (res.ok) {
         const data = await res.json(); 
         setReports(data);
       }

      } catch (err) {
        console.error(err);

      } finally {
        setLoading(false);
      }
    };

    fetchReports(); 
   }, []);


  //Update report status  
  const updateStatus = async (id: string, newStatus: string) => {
    try {
     const res = await fetch(`http://localhost:5000/api/reports/${id}/status`, {
       method: "PATCH",
       headers: {
        'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`
       },
       body: JSON.stringify({status: newStatus}) 
     });
     
     if (res.ok) {
       setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus as any } : r));
       Swal.fire("Success", `Report marked as ${newStatus}`, "success"); 
     }

    } catch (err) {
      Swal.fire("Error", "Could not update status", "error"); 
    }
  };
  

  //Helper to render content 
  const renderContent = (item: Report['reportedItem']) => {
    if (!item) return <span style={{ fontStyle: 'italic', color: '#999' }}>Content deleted</span>;
    return item.content || item.text || "No text content";
  };

 
  return(
    <div className='reports_widget'>
     <h3 className='reports_title'>User Reports</h3>

     <div className='reports_table-wrapper'>
      <table className='reports_table'>
       <thead className='reports_thead'>
        <tr>
          <th className="reports_th">Status</th>
          <th className="reports_th">Reported User</th>
          <th className="reports_th">Reason</th>
          <th className="reports_th" style={{ width: '35%' }}>Reported Content</th>
          <th className="reports_th">Date</th>
          <th className="reports_th">Actions</th>  
        </tr>
       </thead>

       <tbody>
        {loading && <tr><td colSpan={6} className='reports_loading'>Loading...</td></tr>}

        {!loading && reports.length === 0 && (
          <tr><td colSpan={6} className='reports_empty'>No active reports at the moment</td></tr>  
        )}

        {!loading && reports.map((r) => (
          <tr key={r._id}>
           <td className='reports_td'>
             <span className={`reports-status status-${r.status.toLowerCase()}`}>
              {r.status}
             </span>
           </td>

           <td className='reports_td'>
             <div><b>{r.reportedUser?.username || "Unknown"}</b></div>
             <div style={{fontSize: "0.8rem", color: "#666"}}>{r.reportedUser?.email}</div>
           </td>

           <td className='reports_td'>
             <div style={{fontWeight: 500}}>{r.itemType}</div>
             <div style={{fontSize: "0.9rem"}}>{r.reason}</div>
           </td>

           <td className='reports_td'>
             <div className='reports_content'>
              {renderContent(r.reportedItem)}
             </div>

             {r.description && (
              <div className='reports_note'>
               <strong>Note:</strong> {r.description}
              </div>   
             )}
           </td>

           <td className='reports_td'>
             {new Date(r.createdAt).toLocaleDateString()}
           </td>

           <td className='reports_td'>
             {r.status === "Pending" && (
              <div className='reports_actions'>
               <button
                className='reports_btn resolve'
                title="Mark as resolved"
                onClick={() => updateStatus(r._id, "Resolved")}
               >
                ✓
               </button>

               <button 
                className='reports-btn dismiss'
                title="Dismiss"
                onClick={() => updateStatus(r._id, "Dismissed")}
                >
                 ✕
                </button>
              </div>  
             )}
           </td>
          </tr>  
        ))}

       </tbody>

      </table>
     </div>
    </div>

  );
};

export default ReportsWidget;

