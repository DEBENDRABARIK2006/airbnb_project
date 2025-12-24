import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../redux/authslice";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    confirmpassword: "",
    usertype: "",
    terms: false,
  });

  // Changed from array [] to object {} to map errors to specific fields
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstname.trim()) newErrors.firstname = "First name is required.";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required.";
    
    // Basic Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";

    if (formData.password !== formData.confirmpassword) {
      newErrors.confirmpassword = "Passwords do not match.";
    }

    if (!formData.usertype) newErrors.usertype = "Please select a user type.";
    if (!formData.terms) newErrors.terms = "You must accept the Terms & Conditions.";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear local errors before dispatching
    setErrors({});
    
    const result = await dispatch(signupUser(formData));
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/"); // redirect after successful signup
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "450px", borderRadius: "12px" }}>
        <h2 className="text-center mb-4" style={{ color: "#FF385C", fontWeight: "bold" }}>
          Sign Up
        </h2>

        {/* Global Server Error (e.g. "Email already exists") */}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          {/* First Name */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="First Name"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              className={`form-control ${errors.firstname ? "is-invalid" : ""}`}
            />
            <div className="invalid-feedback">{errors.firstname}</div>
          </div>

          {/* Middle Name (Optional - no validation needed) */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Middle Name"
              name="middlename"
              value={formData.middlename}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          {/* Last Name */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Last Name"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              className={`form-control ${errors.lastname ? "is-invalid" : ""}`}
            />
            <div className="invalid-feedback">{errors.lastname}</div>
          </div>

          {/* Email */}
          <div className="mb-2">
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
            />
            <div className="invalid-feedback">{errors.email}</div>
          </div>

          {/* Password */}
          <div className="mb-2">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
            />
            <div className="invalid-feedback">{errors.password}</div>
          </div>

          {/* Confirm Password */}
          <div className="mb-2">
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmpassword"
              value={formData.confirmpassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmpassword ? "is-invalid" : ""}`}
            />
            <div className="invalid-feedback">{errors.confirmpassword}</div>
          </div>

          {/* User Type */}
          <div className="mb-3">
            <select
              name="usertype"
              value={formData.usertype}
              onChange={handleChange}
              className={`form-select ${errors.usertype ? "is-invalid" : ""}`}
            >
              <option value="">-- Select User Type --</option>
              <option value="guest">Guest</option>
              <option value="host">Host</option>
            </select>
            <div className="invalid-feedback">{errors.usertype}</div>
          </div>

          {/* Terms Checkbox */}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
              name="terms"
              id="termsCheck"
              checked={formData.terms}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="termsCheck">
              Accept Terms & Conditions
            </label>
            <div className="invalid-feedback">{errors.terms}</div>
          </div>

          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{ backgroundColor: "#FF385C", color: "white" }}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {/* OAuth Signup Buttons */}
        <div className="mt-2 text-center">
          <p className="text-muted small mb-2">Or sign up with</p>
          <div className="d-flex gap-2">
            <a
              href="http://localhost:3004/auth/google"
              className="btn btn-outline-danger w-50"
            >
              <i className="bi bi-google me-2"></i> Google
            </a>
            <a
              href="http://localhost:3004/auth/github"
              className="btn btn-outline-dark w-50"
            >
              <i className="bi bi-github me-2"></i> GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;