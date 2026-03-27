import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {toast} from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import "./AuthForms.css";


type Props = {
  isOpen: boolean;
  onClose: () => void;
  
};

const AuthForms: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isSignup, setIsSignup] = useState(true);
  const [showPassword, setShowPassword] = useState(false); 

  //Sign Up form field states 
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupRole, setSignupRole] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  //Login form field states 
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  //Forgot password states
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();  
  const {login} = useAuth();


  if (!isOpen) return null;


// Sign Up handler
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setTermsError(null);
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match");
      return;
    }
    if(!acceptedTerms){
        setTermsError("You must accept the Terms and Conditions!");
        return;
    }
    
    const payload ={
      username: signupName, 
      email: signupEmail, 
      password: signupPassword, 
      role: signupRole
    };

    try {
      const res = await fetch('http://localhost:5000/api/users/signup',{
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      if(res.ok){

        //Signup succeeded
        const data = await res.json(); 
        console.log("User created:", data)
        toast.success("Sign Up successful!");
        
        //Close modal 
        onClose(); 
      }else{

        //Handle server-side error 
        const err = await res.json();
        setSignupError(err.message || "Sign Up failed!");
        toast.error(err.message || "Sign Up failed!");
      }
       
     } catch (err){
      setSignupError('Network Error - Please try again!');
      toast.error('Network Error - Please try again!');
     }
    }


//Login handler 
async function handleLogin(e: React.FormEvent){
  e.preventDefault();
  setLoginError(null);

  try {
    await login({email: loginEmail, password: loginPassword});

    onClose();
    toast.success("Login successful!");
    navigate('/dashboard');

  } catch (err: any) {
    const errorMessage = err.message || "Login failed!";

    if (errorMessage.toLowerCase().includes("suspended")) {
      onClose(); 

      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Your account has been suspended. Please contact the administrator for more information.",
        confirmButtonColor: "#d33"
      });

    } else {
      setLoginError(errorMessage);
      toast.error(errorMessage);
    }
  }
 }


 //Forgot password handler
 async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/users/forgot-password', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: forgotEmail})
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Check your email for the reset link!");
        setIsForgot(false);  
        setForgotEmail(""); 

          } else {
            toast.error(data.message || "Could not reset password");
          }

        } catch (err) {
          toast.error("Network Error, please try again!");
        } finally {
          setForgotLoading(false);
        }
 }


  return (
   <>  
     
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>

        {isForgot ? (
          <>
            <h2>Reset Password</h2>
            <form onSubmit={handleForgotSubmit}>
              <p className="forgot-description">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <input 
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required 
              />

              <button type="submit" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            
            <p className="switch-link">
              Remembered your password?{" "}
              <span onClick={() => setIsForgot(false)}>Log In</span>
            </p>
          </>
        ) : (isSignup ? (
            <>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <input type="text"
               placeholder="Username"
               value={signupName}
               onChange={e => setSignupName(e.target.value)}
               required />

              <input type="email"
               placeholder="Email" 
               value={signupEmail}
               onChange={e => setSignupEmail(e.target.value)}
               required />
              
                <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  required />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((show) => !show)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="password-field">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={signupConfirm}
                  onChange={e => setSignupConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm((show) => !show)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <select
                 value={signupRole}
                 onChange={e => setSignupRole(e.target.value)}                         
                 className="role-select"
                 required
               >
                 <option value="" disabled>Select Role:</option>
                 <option value="User">User</option>
                 <option value="Artist">Artist</option>
                 <option value="Admin">Admin</option>
               </select>

               <label className="terms-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    required
                  />
                  I accept the{" "}
                  <a
                    href="/TermsNCond.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="terms-link"
                  >
                   Terms and Conditions
                  </a>
                </label>

              {termsError && <div className="form-error">{termsError}</div>}

              {signupError && <div className="form-error">{signupError}</div>}


              <button type="submit">Sign Up</button>
            </form>
            <p className="switch-link">
              Already have an account?{" "}
              <span onClick={() => setIsSignup(false)}>Log In</span>
            </p>
          </>
        ) : (
          <>
            <h2>Log In</h2>
            <form onSubmit={handleLogin}>
              <input type="text"
               placeholder="Username or Email"
               value={loginEmail}
               onChange={e => setLoginEmail(e.target.value)}
               required />
              
          <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((show) => !show)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <p className="forgot-password">
                <span 
                 onClick={() => setIsForgot(true)} 
                >
                  Forgot Password?
                </span>
              </p>

              {loginError && <div className="form-error">{loginError}</div>}

              <button type="submit">Log In</button>
            </form>
            <p className="switch-link">
              Don't have an account?{" "}
              <span onClick={() => setIsSignup(true)}>Sign Up</span>
            </p>
          </>
        ))}
      </div>
    </div>
    </>
  );
};


export default AuthForms;
