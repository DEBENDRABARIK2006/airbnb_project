import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/authslice';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  
  // --- Form States ---
  const [form, setForm] = useState({ username: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [resetForm, setResetForm] = useState({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });

  // --- UI Toggles ---
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false); 

  // --- OTP UI Logic & Timer State ---
  const OTP_LENGTH = 6; 
  const [timer, setTimer] = useState(30); 
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]); 

  // --- Field-Level Error States ---
  const [loginErrors, setLoginErrors] = useState({});
  const [forgotErrors, setForgotErrors] = useState({});
  const [resetErrors, setResetErrors] = useState({});

  // --- Server Messages ---
  const [forgotServerMsg, setForgotServerMsg] = useState({ type: '', text: '' });
  const [resetServerMsg, setResetServerMsg] = useState({ type: '', text: '' });

  const clearError = (field, errorState, setErrorState) => {
    if (errorState[field]) {
      setErrorState(prev => ({ ...prev, [field]: null }));
    }
  };

  // --- OTP Timer Effect ---
  useEffect(() => {
    let interval;
    if (forgotStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [forgotStep, timer]);

  // --- OTP Input Handlers ---
  const handleOtpBoxChange = (e, index) => {
    const { value } = e.target;
    if (isNaN(value)) return; 

    // Update OTP string state
    const currentOtpArray = forgotForm.otp.padEnd(OTP_LENGTH, ' ').split('');
    currentOtpArray[index] = value.substring(value.length - 1); // Get last char
    const newOtp = currentOtpArray.join('').trim();
    
    setForgotForm({ ...forgotForm, otp: newOtp });
    clearError('otp', forgotErrors, setForgotErrors);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !forgotForm.otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, OTP_LENGTH).replace(/\D/g, '');
    setForgotForm({ ...forgotForm, otp: data });
    if (data.length === OTP_LENGTH) inputRefs.current[OTP_LENGTH - 1].focus();
  };

  const handleResend = async (e) => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    await sendOTP(e);
  };

  // ================= LOGIN LOGIC =================
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    clearError(name, loginErrors, setLoginErrors);
  };

  const validateLogin = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Email is required";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmitLogin = (e) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length > 0) {
      setLoginErrors(errs);
      return;
    }
    dispatch(loginUser(form));
  };

  // ================= FORGOT PASSWORD LOGIC =================
  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotForm({ ...forgotForm, [name]: value });
    clearError(name, forgotErrors, setForgotErrors);
  };

  const validateForgotStep1 = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotForm.email) errs.email = "Email is required";
    else if (!emailRegex.test(forgotForm.email)) errs.email = "Invalid email format";
    return errs;
  };

  const validateForgotStep2 = () => {
    const errs = {};
    if (!forgotForm.otp) errs.otp = "OTP is required";
    else if (forgotForm.otp.length < OTP_LENGTH) errs.otp = "Please enter full OTP";

    if (!forgotForm.newPassword) errs.newPassword = "New password is required";
    else if (forgotForm.newPassword.length < 6) errs.newPassword = "Password must be at least 6 chars";
    
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const sendOTP = async (e) => {
    if(e) e.preventDefault();
    setForgotServerMsg({ type: '', text: '' });
    const errs = validateForgotStep1();
    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axios.post(
        'http://localhost:3004/forgot-password/send-otp', 
        { email: forgotForm.email },
        { withCredentials: true }
      );
      setForgotServerMsg({ type: 'success', text: res.data.message || 'OTP sent to your email!' });
      setForgotStep(2);
      setTimer(30); // Reset timer on successful send
      setCanResend(false);
    } catch (err) {
      console.error(err);
      setForgotServerMsg({ type: 'error', text: err.response?.data?.error || 'Failed to send OTP. Check email or try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setForgotServerMsg({ type: '', text: '' });
    const errs = validateForgotStep2();
    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axios.post(
        'http://localhost:3004/forgot-password/verify-otp', 
        {
          email: forgotForm.email,
          otp: forgotForm.otp,
          newPassword: forgotForm.newPassword,
          confirmPassword: forgotForm.confirmPassword
        },
        { withCredentials: true }
      );

      setForgotServerMsg({ type: 'success', text: res.data.message || 'Password reset successful! Logging in...' });
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotForm({ email: '', otp: '', newPassword: '', confirmPassword: '' });
        setForgotServerMsg({ type: '', text: '' });
      }, 2000);

    } catch (err) {
      console.error(err);
      setForgotServerMsg({ type: 'error', text: err.response?.data?.error || 'OTP verification failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= RESET PASSWORD LOGIC (Logged In) =================
  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetForm({ ...resetForm, [name]: value });
    clearError(name, resetErrors, setResetErrors);
  };

  const validateReset = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!resetForm.email) errs.email = "Email is required";
    else if (!emailRegex.test(resetForm.email)) errs.email = "Invalid email format";
    if (!resetForm.oldPassword) errs.oldPassword = "Current password is required";
    if (!resetForm.newPassword) errs.newPassword = "New password is required";
    else if (resetForm.newPassword.length < 6) errs.newPassword = "Password must be at least 6 chars";
    if (resetForm.newPassword !== resetForm.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetServerMsg({ type: '', text: '' });
    const errs = validateReset();
    if (Object.keys(errs).length > 0) {
      setResetErrors(errs);
      return;
    }

    try {
      const res = await axios.post('http://localhost:3004/reset-password', resetForm, { withCredentials: true });
      setResetServerMsg({ type: 'success', text: res.data.message || 'Password reset successful!' });
      setTimeout(() => {
        setShowResetPassword(false);
        setResetForm({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
        setResetServerMsg({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
      setResetServerMsg({ type: 'error', text: err.response?.data?.error || 'Reset failed' });
    }
  };

  const resetViews = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setForgotStep(1);
    setLoginErrors({});
    setForgotErrors({});
    setResetErrors({});
    setForgotServerMsg({ type: '', text: '' });
    setResetServerMsg({ type: '', text: '' });
    setTimer(30);
    setCanResend(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(120deg, #ff4e81 0%, #f3a683 100%)', 
      fontFamily: 'Montserrat, sans-serif' 
    }}>
      <div className="card shadow-lg p-4 border-0" style={{ 
        width: '390px', 
        borderRadius: '2rem', 
        minHeight: '410px', 
        background: 'rgba(255,255,255,0.92)' 
      }}>
        <div className="mb-4 text-center">
          <i className="bi bi-house-door-fill" style={{ fontSize: '38px', color: '#ff5a5f' }}></i>
          <h2 className="fw-bold mt-2 mb-1" style={{ color: '#ff5a5f', letterSpacing: '1px' }}>
            Airbnb Login
          </h2>
        </div>

        {/* --- MAIN LOGIN FORM --- */}
        {!showForgotPassword && !showResetPassword ? (
          <>
            {error && <div className="alert alert-danger text-center py-2">{error}</div>}
            <form onSubmit={handleSubmitLogin} noValidate>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input 
                  type="text" 
                  className={`form-control form-control-lg rounded-3 ${loginErrors.username ? 'is-invalid' : ''}`}
                  name="username"
                  placeholder="Enter your email" 
                  value={form.username} 
                  onChange={handleLoginChange}
                />
                <div className="invalid-feedback">{loginErrors.username}</div>
              </div>
              <div className="mb-2">
                <label className="form-label fw-semibold">Password</label>
                <input 
                  type="password" 
                  className={`form-control form-control-lg rounded-3 ${loginErrors.password ? 'is-invalid' : ''}`}
                  name="password"
                  placeholder="Enter your password" 
                  value={form.password} 
                  onChange={handleLoginChange}
                />
                <div className="invalid-feedback">{loginErrors.password}</div>
              </div>
              <button 
                type="submit" 
                className="btn btn-lg fw-bold w-100 mt-3" 
                style={{ background: 'linear-gradient(90deg, #ff5a5f 60%, #f3a683 100%)', color: '#fff', border: 'none', borderRadius: '1.5rem' }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button className="btn btn-link p-0 mb-2 w-100 text-start" onClick={() => { resetViews(); setShowForgotPassword(true); }} style={{ color: '#666', textDecoration: 'none' }}>Forgot Password?</button>
              <button className="btn btn-link p-0 w-100 text-start" onClick={() => { resetViews(); setShowResetPassword(true); }} style={{ color: '#666', textDecoration: 'none' }}>Reset Password</button>
            </div>
          </>
        ) : null}

        {/* --- FORGOT PASSWORD FORM --- */}
        {showForgotPassword && (
          <div>
            <button className="btn btn-outline-secondary w-100 mb-3" onClick={resetViews}>← Back to Login</button>
            <h5 className="text-center mb-4" style={{ color: '#ff5a5f' }}>
              {forgotStep === 1 ? 'Forgot Password' : 'Verify OTP & Reset'}
            </h5>

            {forgotServerMsg.text && (
              <div className={`alert alert-${forgotServerMsg.type === 'error' ? 'danger' : 'success'}`}>
                {forgotServerMsg.text}
              </div>
            )}
            
            {forgotStep === 1 ? (
              <form onSubmit={sendOTP} noValidate>
                <div className="mb-3">
                  <input type="email" name="email" className={`form-control form-control-lg rounded-3 ${forgotErrors.email ? 'is-invalid' : ''}`} placeholder="Enter your email" value={forgotForm.email} onChange={handleForgotChange} />
                  <div className="invalid-feedback">{forgotErrors.email}</div>
                </div>
                <button type="submit" className="btn btn-lg fw-bold w-100" style={{ backgroundColor: '#FF385C', color: 'white', borderRadius: '1rem' }} disabled={isProcessing}>
                  {isProcessing ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOTP} noValidate>
                
                {/* OTP BOXES CONTAINER */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Enter Verification Code</label>
                  <div className="d-flex justify-content-between gap-2" onPaste={handleOtpPaste}>
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        className={`form-control text-center fw-bold fs-4 ${forgotErrors.otp ? 'is-invalid border-danger' : ''}`}
                        style={{ 
                          height: '50px', 
                          width: '45px', 
                          borderRadius: '12px',
                          border: '2px solid #eee',
                          backgroundColor: '#f9f9f9'
                        }}
                        value={forgotForm.otp[index] || ''}
                        onChange={(e) => handleOtpBoxChange(e, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onFocus={(e) => e.target.select()} 
                      />
                    ))}
                  </div>
                  {forgotErrors.otp && <div className="text-danger small mt-1">{forgotErrors.otp}</div>}
                </div>

                {/* TIMER & RESEND LINK */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                   <span className="text-muted small">
                     {canResend ? "Didn't receive code?" : `Resend code in 00:${timer.toString().padStart(2, '0')}`}
                   </span>
                   <button 
                     type="button"
                     onClick={handleResend}
                     className="btn btn-link p-0 text-decoration-none fw-bold small"
                     style={{ 
                       color: canResend ? '#FF385C' : '#ccc', 
                       pointerEvents: canResend ? 'auto' : 'none' 
                     }}
                   >
                     Resend OTP
                   </button>
                </div>

                <div className="mb-2">
                  <input type="password" name="newPassword" className={`form-control form-control-lg rounded-3 ${forgotErrors.newPassword ? 'is-invalid' : ''}`} placeholder="New Password" value={forgotForm.newPassword} onChange={handleForgotChange} />
                  <div className="invalid-feedback">{forgotErrors.newPassword}</div>
                </div>
                <div className="mb-3">
                  <input type="password" name="confirmPassword" className={`form-control form-control-lg rounded-3 ${forgotErrors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Confirm New Password" value={forgotForm.confirmPassword} onChange={handleForgotChange} />
                  <div className="invalid-feedback">{forgotErrors.confirmPassword}</div>
                </div>
                <button type="submit" className="btn btn-lg fw-bold w-100 mb-2" style={{ backgroundColor: '#FF385C', color: 'white', borderRadius: '1rem' }} disabled={isProcessing}>
                   {isProcessing ? 'Verifying...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- RESET PASSWORD FORM (Logged In) --- */}
        {showResetPassword && (
          <div>
            <button className="btn btn-outline-secondary w-100 mb-3" onClick={resetViews}>← Back to Login</button>
            <h5 className="text-center mb-4" style={{ color: '#ff5a5f' }}>Reset Password</h5>
            {resetServerMsg.text && (
              <div className={`alert alert-${resetServerMsg.type === 'error' ? 'danger' : 'success'}`}>
                {resetServerMsg.text}
              </div>
            )}
            <form onSubmit={handleResetSubmit} noValidate>
              <div className="mb-2">
                <input type="email" name="email" className={`form-control form-control-lg rounded-3 ${resetErrors.email ? 'is-invalid' : ''}`} placeholder="Your Email" value={resetForm.email} onChange={handleResetChange} />
                <div className="invalid-feedback">{resetErrors.email}</div>
              </div>
              <div className="mb-2">
                <input type="password" name="oldPassword" className={`form-control form-control-lg rounded-3 ${resetErrors.oldPassword ? 'is-invalid' : ''}`} placeholder="Current Password" value={resetForm.oldPassword} onChange={handleResetChange} />
                <div className="invalid-feedback">{resetErrors.oldPassword}</div>
              </div>
              <div className="mb-2">
                <input type="password" name="newPassword" className={`form-control form-control-lg rounded-3 ${resetErrors.newPassword ? 'is-invalid' : ''}`} placeholder="New Password" value={resetForm.newPassword} onChange={handleResetChange} />
                <div className="invalid-feedback">{resetErrors.newPassword}</div>
              </div>
              <div className="mb-3">
                <input type="password" name="confirmPassword" className={`form-control form-control-lg rounded-3 ${resetErrors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Confirm New Password" value={resetForm.confirmPassword} onChange={handleResetChange} />
                <div className="invalid-feedback">{resetErrors.confirmPassword}</div>
              </div>
              <button type="submit" className="btn btn-lg fw-bold w-100" style={{ backgroundColor: '#FF385C', color: 'white', borderRadius: '1rem' }}>Update Password</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}