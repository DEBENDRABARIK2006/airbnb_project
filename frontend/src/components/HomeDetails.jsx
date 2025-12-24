// src/components/HomeDetails.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StarInput = ({ value, onChange }) => (
  <div>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        style={{
          border: "none",
          background: "transparent",
          fontSize: "1.5rem",
          color: n <= value ? "#FFD700" : "#ccc",
          cursor: "pointer",
        }}
        onClick={() => onChange(n)}
      >
        ★
      </button>
    ))}
  </div>
);

const HomeDetails = () => {
  const { id } = useParams();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const res = await axios.get(`http://localhost:3004/home/${id}`, {
          withCredentials: true,
        });
        setHome(res.data.home);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHome();
  }, [id]);

  const submitRating = async () => {
    setSubmitting(true);
    try {
      await axios.post(
        `http://localhost:3004/home/${id}/rate`,
        { stars, comment },
        { withCredentials: true }
      );
      setSubmitMsg("✅ Rating submitted!");
      const fresh = await axios.get(`http://localhost:3004/home/${id}`, {
        withCredentials: true,
      });
      setHome(fresh.data.home);
    } catch (err) {
      console.error(err);
      setSubmitMsg("❌ Failed to submit rating");
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitMsg(""), 3000);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!home) return <p>Home not found</p>;

  const avgRating =
    home.ratings && home.ratings.length > 0
      ? (
          home.ratings.reduce((s, r) => s + r.stars, 0) /
          home.ratings.length
        ).toFixed(1)
      : "No ratings yet";

  return (
    <div className="container mt-4">
      {/* --- HOME DETAILS --- */}
      <h2 className="fw-bold text-primary">{home.homename}</h2>
      <p className="text-muted">
        {home.location} • <b>₹{home.price}</b>
      </p>
      <p>{home.description}</p>

      {/* --- PHOTOS --- */}
      <h5 className="mt-4 mb-2">Photos</h5>
      <div className="d-flex gap-3 flex-wrap">
        {home.images && home.images.length > 0 ? (
          home.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`home-${idx}`}
              style={{
                width: "250px",
                height: "170px",
                objectFit: "cover",
                borderRadius: "8px",
                boxShadow: "0 0 6px rgba(0,0,0,0.1)",
              }}
            />
          ))
        ) : (
          <img
            src={home.photo || "https://via.placeholder.com/250x170"}
            alt="home"
            style={{
              width: "250px",
              height: "170px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        )}
      </div>

      {/* --- RULES SECTION --- */}
      <h5 className="mt-4 mb-2">Rules & Regulations</h5>
      {home.rulesFile ? (
        <button
          className="btn btn-outline-danger fw-semibold"
          onClick={() => window.open(home.rulesFile, "_blank")}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i> View Rules & Regulations
        </button>
      ) : (
        <p className="text-muted">No rules file provided.</p>
      )}

      {/* --- RATINGS SECTION --- */}
      <h5 className="mt-4">Ratings — Average: ⭐ {avgRating}</h5>

       {/* --- RATING INPUT FORM --- */}
      <div className="mt-4 p-3 border rounded bg-light shadow-sm">
        <h6 className="mb-2">Leave a rating</h6>
        <StarInput value={stars} onChange={setStars} />
        <textarea
          className="form-control mt-2"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment..."
        />
        <button
          className="btn btn-primary mt-2"
          onClick={submitRating}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Rating"}
        </button>
        {submitMsg && (
          <div className="mt-2 text-success fw-semibold">{submitMsg}</div>
        )}
      </div>

      {(home.ratings || []).length > 0 ? (
        home.ratings.map((r, idx) => {
          const user = r.user || {};
          const fullname = [user.firstname, user.middlename, user.lastname]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={idx}
              className="border rounded p-3 mb-3"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              
              {fullname && (
                <p className="mb-1 text-primary fw-semibold">
                  Reviewed by {fullname}
                </p>
              )}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div>
                  <strong className="text-warning">⭐ {r.stars}</strong>{" "}
                  <span className="text-muted">/ 5</span>
                </div>
                <small className="text-muted">
                  {new Date(r.createdAt).toLocaleDateString()}
                </small>
              </div>


              <p className="mb-0 text-secondary">
                {r.comment ? r.comment : "No comment provided."}
              </p>
            </div>
          );
        })
      ) : (
        <p className="text-muted">No ratings yet.</p>
      )}

     
    </div>
  );
};

export default HomeDetails;
