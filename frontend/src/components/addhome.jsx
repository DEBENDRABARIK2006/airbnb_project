// src/components/addhome.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddHome = () => {
  const [formData, setFormData] = useState({
    homename: "",
    description: "",
    location: "",
    price: "",
  });
  const [images, setImages] = useState([]);
  const [rulesFile, setRulesFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImages = (e) => {
    setImages(Array.from(e.target.files)); // handle multiple
  };

  const handleRulesFile = (e) => {
    setRulesFile(e.target.files[0] || null);
  };

  const validateForm = () => {
    const errs = [];
    if (!formData.homename.trim()) errs.push("Home name is required.");
    if (!formData.description.trim()) errs.push("Description is required.");
    if (!formData.location.trim()) errs.push("Location is required.");
    if (!formData.price || formData.price <= 0)
      errs.push("Price must be a positive number.");
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");
    const errs = validateForm();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("homename", formData.homename);
      fd.append("description", formData.description);
      fd.append("location", formData.location);
      fd.append("price", formData.price);

      // append multiple images
      images.forEach((file) => fd.append("images", file));

      // append rules file (pdf/doc)
      if (rulesFile) fd.append("rulesfile", rulesFile);

      const res = await axios.post("http://localhost:3004/host/addhome", fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Home added successfully!");
      setTimeout(() => navigate("/myhomes", { state: { updated: true } }), 1000);
    } catch (err) {
      console.error("Error adding home:", err);
      setApiError(err.response?.data?.error || "Failed to add home");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add New Home</h2>

      {apiError && <p className="alert alert-danger">{apiError}</p>}
      {successMsg && <p className="alert alert-success">{successMsg}</p>}
      {errors.length > 0 && (
        <ul className="alert alert-danger">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label>Home Name</label>
          <input
            type="text"
            name="homename"
            className="form-control"
            value={formData.homename}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>Description</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="mb-3">
          <label>Location</label>
          <input
            type="text"
            name="location"
            className="form-control"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>Price</label>
          <input
            type="number"
            name="price"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Correct field name for multer */}
        <div className="mb-3">
          <label>Photos (select multiple)</label>
          <input
            type="file"
            name="images" // ✅ Added name
            multiple
            accept="image/*"
            className="form-control"
            onChange={handleImages}
          />
        </div>

        {/* ✅ Correct field name for multer */}
        <div className="mb-3">
          <label>Rules / Regulations (PDF or DOC)</label>
          <input
            type="file"
            name="rulesfile" // ✅ Added name
            accept=".pdf,.doc,.docx"
            className="form-control"
            onChange={handleRulesFile}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Add Home
        </button>
      </form>
    </div>
  );
};

export default AddHome;
