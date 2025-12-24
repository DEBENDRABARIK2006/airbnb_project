// src/components/HostHomeList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";

const HostHomeList = () => {
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchHomes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3004/host/ownhome", {
        withCredentials: true,
      });
      setHomes(Array.isArray(res.data.homes) ? res.data.homes : []);
    } catch (err) {
      console.error(err);
      setHomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomes();
    if (location.state?.updated) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this home?")) {
      try {
        await axios.post(
          `http://localhost:3004/host/deletehome/${id}`,
          {},
          { withCredentials: true }
        );
        fetchHomes();
      } catch (err) {
        console.error(err);
        alert("Failed to delete home. Try again.");
      }
    }
  };

  if (loading) return <p className="text-center mt-4">Loading homes...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-3">My Homes</h2>
      <button
        className="btn btn-primary mb-4"
        onClick={() => navigate("/addhome")}
      >
        + Add New Home
      </button>

      <div className="row">
        {homes.length > 0 ? (
          homes.map((home) => (
            <div key={home._id} className="col-md-4 mb-4">
              <div className="card shadow-sm" style={{ borderRadius: "10px" }}>
                <Link
                  to={`/home/${home._id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {home.images && home.images.length > 0 ? (
                    <img
                      src={home.images[0]}
                      alt={home.homename}
                      className="card-img-top"
                      style={{
                        height: "220px",
                        objectFit: "cover",
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "220px",
                        background: "#e9ecef",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px",
                      }}
                    >
                      <p className="text-muted mb-0">No Image</p>
                    </div>
                  )}
                </Link>

                <div className="card-body">
                  <h5 className="card-title text-primary">{home.homename}</h5>
                  <p className="mb-1">
                    <strong>Location:</strong> {home.location}
                  </p>
                  <p className="mb-1">
                    <strong>Price:</strong> ₹{home.price}
                  </p>
                  <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                    {home.description?.slice(0, 60)}...
                  </p>

                  <div className="d-flex justify-content-between mt-3">
                    <Link
                      to={`/home/${home._id}`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      View Details
                    </Link>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => navigate(`/edithome/${home._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(home._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No homes found.</p>
        )}
      </div>
    </div>
  );
};

export default HostHomeList;
