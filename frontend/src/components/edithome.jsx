import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    homename: "",
    description: "",
    location: "",
    price: "",
  });

  const [images, setImages] = useState([]); // new images (optional)
  const [rulesFile, setRulesFile] = useState(null); // new rules file (optional)
  const [currentImages, setCurrentImages] = useState([]);
  const [currentRulesFile, setCurrentRulesFile] = useState("");
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch current home details
  useEffect(() => {
    const fetchHome = async () => {
      try {
        const res = await axios.get(`http://localhost:3004/host/edithome/${id}`, {
          withCredentials: true,
        });
        const data = res.data.home;
        if (data) {
          setFormData({
            homename: data.homename || "",
            description: data.description || "",
            location: data.location || "",
            price: data.price || "",
          });
          setCurrentImages(data.images || []);
          setCurrentRulesFile(data.rulesFile || "");
        }
      } catch (err) {
        console.error(err);
        setApiError("Failed to fetch home data.");
      }
    };
    fetchHome();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImages = (e) => {
    setImages(Array.from(e.target.files));
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
    setErrors([]);
    setApiError("");

    const errs = validateForm();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.append("homename", formData.homename);
      form.append("description", formData.description);
      form.append("location", formData.location);
      form.append("price", formData.price);

      // multiple new images (optional)
      images.forEach((file) => form.append("images", file));

      // single rules file (optional)
      if (rulesFile) form.append("rulesfile", rulesFile);

      const res = await axios.post(
        `http://localhost:3004/host/edithome/${id}`,
        form,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
        navigate("/myhomes", { state: { updated: true } });
      }
    } catch (err) {
      console.error("Update failed:", err);
      setApiError(err.response?.data?.error || "Failed to update home.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Edit Home</h2>

      {apiError && <p className="alert alert-danger">{apiError}</p>}
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

        {/* Image upload section */}
        <div className="mb-3">
          <label>Upload New Images (optional)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="form-control"
            onChange={handleImages}
          />
          {currentImages.length > 0 && (
            <div className="mt-3">
              <p>Current Images:</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {currentImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Home"
                    style={{
                      width: "120px",
                      borderRadius: "8px",
                      boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rules file upload section */}
        <div className="mb-3">
          <label>Upload New Rules / Regulations (optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="form-control"
            onChange={handleRulesFile}
          />
          {currentRulesFile && (
            <div className="mt-3">
              <a
                href={currentRulesFile}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Current Rules File
              </a>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-success" disabled={uploading}>
          {uploading ? "Updating..." : "Update Home"}
        </button>
      </form>
    </div>
  );
};

export default EditHome;
