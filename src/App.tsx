import React, {useEffect, useState} from 'react'
import {Routes, Route} from 'react-router-dom';
import ProtectedRoute from './routesFront/protectedRoute';
import DashboardSwitcher from './pages/dashboardSwitcher';


import Navbar from './components/Navbar'
import Back from './components/Back'
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import PasswordReset from './components/PasswordReset'; 

import AdminUsers from './pages/Admin/adminUsers';
import AuthForms from './components/AuthForms';
import {ToastContainer} from 'react-toastify';
import {getTasks} from './services/taskService';
import 'react-toastify/dist/ReactToastify.css';
import AdminEvents from './pages/Admin/adminEvents';
import AdminStats from './pages/Admin/adminStats';
import ArtistEvents from './pages/Artist/artistEvents';
import NewEvent from './pages/Artist/newEvent';
import EventDetails from './pages/eventDetails';
import ArtistOverview from './pages/Artist/artistOverview';
import ArtistStats from './pages/Artist/artistStats';
import ScoutPage from './pages/Artist/ScoutPage';


import UserProfile from './pages/userProfile';
import MyProfile from './pages/myProfile';
import UserOverview from './pages/User/userOverview';
import UserEvents from './pages/User/userEvents';
import ChatPage from './pages/Chat/ChatPage';
import Settings from './pages/Settings';
import ProProfile from './pages/Artist/ProProfile';
import ArtistPortfolio from './pages/Artist/ArtistPortfolio';
import AddVenue from './pages/Admin/AddVenue';
import VenueList from './pages/Admin/VenueList';
import VenueDetails from './pages/Artist/venueDetails';

import './App.css'; 


type Task = {
  title: string;
  completed: boolean;
};


const App:React.FC = () => {

const [tasks, setTasks] = useState<Task[]>([]);
const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    getTasks().then(setTasks);
  }, []);


  return (
    <>
      <Navbar onLoginClick={() => setShowModal(true)} />
      <Back>

      {/*Public */}
      <Routes>
        <Route path='/' element={<Home onGetStartedClick={() => setShowModal(true)} />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path="/reset-password/:token" element={<PasswordReset />} />
   

     {/*User Routes*/} 
      <Route
       path = '/user/overview'
       element = {<ProtectedRoute element={<UserOverview/>}/>}
      />

      <Route
       path = '/user/events'
       element = {<ProtectedRoute element={<UserEvents/>}/>}
      />



     {/*Artist Routes*/}
      <Route
       path = '/artist/overview'
       element = {<ProtectedRoute element={<ArtistOverview/>}/>}
      />
      
       {/*Scout shi*/}
       <Route
        path = '/artist/scout'
        element = {<ProtectedRoute element={<ScoutPage/>}/>}
       />

       <Route
        path='/artist/profile'
        element = {<ProtectedRoute element={<ProProfile/>}/>}
       />

       <Route
        path='/artist/portfolio/:id'
        element = {<ProtectedRoute element={<ArtistPortfolio/>}/>}
       />

       <Route
        path = '/venues/:id'
        element = {<ProtectedRoute element={<VenueDetails/>}/>}
       />


      <Route
       path = '/artist/events'
       element = {<ProtectedRoute element={<ArtistEvents/>}/>}
      />

      <Route
       path = '/events/new'               //For creating events 
       element = {<ProtectedRoute element={<NewEvent/>}/>}
      />

      <Route
       path = '/events/:id/edit'          //For editing drafts 
       element = {<ProtectedRoute element={<NewEvent/>}/>}
      />
    
      <Route
       path = '/artist/statistics'
       element = {<ProtectedRoute element={<ArtistStats/>}/>}
      />

      
      

      {/*Admin Routes*/}
      <Route 
       path = '/admin/users'
       element = {<ProtectedRoute element={<AdminUsers />} />}
      />

      <Route 
       path = '/admin/events'
       element = {<ProtectedRoute element={<AdminEvents />} />}
      />

      <Route 
       path = '/admin/statistics'
       element = {<ProtectedRoute element={<AdminStats />} />}
      />

      <Route
       path = '/admin/venues'
       element = {<ProtectedRoute element={<VenueList />} />}
      />

      <Route
       path = '/admin/add-venue'
       element = {<ProtectedRoute element={<AddVenue />} />}
      />
     
      {/*Details route*/}
       <Route
        path = '/events/:id'
        element = {<EventDetails/>}
       />


      {/*Profile view routes*/}
      <Route 
       path='/profile'
       element={<ProtectedRoute element={<MyProfile/>} />}  
      />

      <Route 
       path="/profile/:id" 
       element={<ProtectedRoute element={<UserProfile />} />}  
      />
      
      
      {/*Chat Route*/}
       <Route 
        path='/chat' 
        element={<ProtectedRoute element={<ChatPage />} />} 
       />


      {/*Settings Route*/}
      <Route
       path='/settings'
       element={<ProtectedRoute element={<Settings />} />}
      />

      {/*Protected */}  
       <Route path='/dashboard'
        element={<ProtectedRoute element={<DashboardSwitcher/>}/>}
        />

       </Routes>
      </Back>  
      

      {tasks.map((task, index) => (
        <div key={index}>{task.title}</div>
       )) }


        <AuthForms
         isOpen={showModal}
         onClose={() => setShowModal(false)}
        />

        <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      </>

  );
};

export default App;

  