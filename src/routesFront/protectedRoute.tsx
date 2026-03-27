import React, {JSX} from "react"; 
import {Navigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext"; 

type Props = {element: JSX.Element};

const ProtectedRoute: React.FC<Props> = ({element}) => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return <div style={{
      textAlign: "center",
      marginTop: '50px'
    }}>
      Loading... 
    </div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;