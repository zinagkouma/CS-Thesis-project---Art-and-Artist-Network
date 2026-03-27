import React, {useEffect, useMemo, useState } from "react";
import {useAuth} from "../../context/AuthContext";
import {useNavigate} from "react-router-dom";
import Swal from "sweetalert2";
import ReportsWidget from "../../components/ReportsWidget";

import AdminLayout from "./adminLayout";

import "./adminUsers.css";



type Role = 'User' | 'Artist' | 'Admin';
type Status = 'Active' | 'Suspended';

type UserRow = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
}

const roleOptions: Role[] = ["User", "Artist", "Admin"];
const statusOptions: Status[] = ["Active", "Suspended"];



const AdminUsers: React.FC = () => {

  const {token, isAdmin} = useAuth();
  const navigate = useNavigate(); 

  //All users
  const [allRows, setAllRows] = useState<UserRow[]>([]);

  //Displayed rows (after filtering)
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  //Filters and sorting 
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [sortKey, setSortKey] = useState<keyof UserRow>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');


  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);

    try { 
     const res = await fetch('http://localhost:5000/api/users', {
     headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error('GET /api/users failed', res.status, await res.text());
      setAllRows([]);
      setRows([]);
      return;
    }
      
      const data: UserRow[] = await res.json();
      setAllRows(data);
      setRows(data);

    } catch (e) {
      console.error(e);
      setAllRows([]);
      setRows([]);

    }finally {
      setLoading(false);
    }
  };

  useEffect (() =>
     {
      if (token && isAdmin) fetchUsers();
     }, [token, isAdmin]);
  

  useEffect(() => {
    let filtered = [...allRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
      if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
      if (statusFilter) filtered = filtered.filter(u => u.status === statusFilter);

      setRows(filtered);
  
    }, [allRows,search, roleFilter, statusFilter]);
      
    
  
  const sorted = useMemo(() => {

    const copy = [...rows];
    copy.sort((a,b) => {
        const va = a[sortKey];
        const vb = b[sortKey];

        if ('createdAt' === sortKey) {
          const da = new Date(va as string).getTime();
          const db = new Date(vb as string).getTime();
          
          return sortDir === 'asc' ? da - db : db - da;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();

        if (sa < sb) return sortDir === 'asc' ? -1 : 1;
        if (sa > sb) return sortDir === 'asc' ? 1 : -1;
        return 0;
    
   });
    return copy;
}, [rows, sortKey, sortDir]);


    const toggleSort = (key: keyof UserRow) => {
       if (sortKey === key) {
         setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else { 
         setSortKey(key);
         setSortDir('asc');
    }
 };




    const toggleStatus = async (id: string, status: Status) => {
        const next = status === "Active" ? "Suspended" : "Active";
        const prev = allRows;

        setAllRows(rs => rs.map(r => (r.id === id? {...r, status: next as Status} :r )));

        try {
            const res = await fetch (`http://localhost:5000/api/users/${id}/status`, {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({status: next})  
        });

        if (!res.ok) {
         console.error('PATCH /status failed', res.status, await res.text());
         setAllRows(prev);
       }

       } catch {
        setAllRows(prev);
       }
    };
    

    // Delete user
    const deleteUser = async (id: string, username: string) => {
        const result = await Swal.fire({
          title: `Delete user ${username}?`,
          text: "This action cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes',
          confirmButtonColor: '#25b795ff'
        });

        if (!result.isConfirmed) return;
      
      
      const prev = allRows;
        setAllRows(rs => rs.filter(r => r.id !== id));

        try {
          const res = await fetch (`http://localhost:5000/api/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
         console.error('DELETE /users failed', res.status, await res.text());
         setAllRows(prev);
         Swal.fire("Error", "Could not delete user.", "error");
         return;
       }

        Swal.fire("Deleted!", `User ${username} has been deleted.`, "success");

       } catch {
        setAllRows(prev);
        Swal.fire("Error", "Server error while deleting user.", "error");
       }
    }; 

    if (!isAdmin) {
        return <div className="usersroles_gate"><b>Admins only!</b></div>
    }


    return (
     <AdminLayout>
      <div className="usersroles">
       <h2 className="usersroles_title">Users &amp; Roles</h2>

       {/*Controls*/}
       <div className="usersroles_controls">
        <input 
        className="usersroles_input"
        placeholder="Search by username or email.."
        value={search}
        onChange={e => setSearch(e.target.value)}
        />


        <select
         className="usersroles_select"
         value={roleFilter}
         onChange={e => setRoleFilter(e.target.value as Role | '')}
         >
            <option value="">All roles</option>
            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
        className="usersroles_select"
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value as Status | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button className="usersroles_refresh" onClick={fetchUsers}>
           Refresh 
        </button>

        <button
         className="venueList_btn"
         onClick={() => navigate('/admin/venues')}
        >
         Venue List 
        </button>
       </div>


       <div className="usersroles_tablewrapper">
        <table className="usersroles_table">

           <thead>
            <tr className="usersroles_thead-row">
            {[
               ["username", "Username"],
               ["email", "Email"],
               ["role", "Role"],
               ["status", "Status"],
               ["createdAt", "Sign Up Date"],
               ["id", "Actions"]

            ] .map(([key, label]) => (
                
               <th
               key={key}
               className={`usersroles_th ${key !== 'id' ? 'usersroles_th--sortable' : ''}`}
               onClick={() => key !== 'id' && toggleSort(key as keyof UserRow) }
               >
                {label}{''}
                {sortKey === key && (sortDir === 'asc' ? '▲' : '▼')}

               </th>

            ))}

            </tr>
           </thead> 

           <tbody>
            {loading && (
               <tr><td colSpan={6} className="usersroles_loading">Loading...</td></tr> 
            )}

            {!loading && sorted.length === 0 && (
                <tr><td colSpan={6} className="usersroles_empty">No users found</td></tr>
            )}

            {!loading && sorted.map(u => (
                <tr key={u.id} className="usersroles_tbody-row">
                  <td className="usersroles-td">{u.username}</td>
                  <td className="usersroles-td">{u.email}</td> 
                  <td className="usersroles-td">
                   {u.role}    
                  </td>
                
                  <td className="usersroles-td">
                   <span className ={
                    `usersroles_status ${
                      u.status === 'Active'
                        ? 'usersroles_status--active'
                        : 'usersroles_status--suspended'
                    }`

                   }>
                    {u.status}
                   </span>
                  </td>
     
                  <td className="usersroles-td">
                    {new Date (u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="usersroles-td">
                    <div className="usersroles_actions">
                       
                       <button
                       className="usersroles_btn"
                       onClick={() => toggleStatus(u.id, u.status)}
                       title={u.status === 'Active' ? 'suspend User' : 'activate User'}
                       >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                       </button>

                       <button
                       className="usersroles_btn delete"
                       onClick={() => {
                         deleteUser(u.id, u.username);
                       }}
                       title="Delete User"
                       >
                        Delete
                       </button>
                    </div>
                  </td> 
                </tr>

            ))}

           </tbody>
        </table>
          
       </div>

      <ReportsWidget/> 

      </div> 
     </AdminLayout>    
  );
};


export default AdminUsers;