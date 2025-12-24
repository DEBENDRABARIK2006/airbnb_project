import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavourite, removeFavourite } from "../redux/favouriteslice";
import { useNavigate } from "react-router-dom";

const Favourite = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items = [], loading, error } = useSelector((state) => state.favourite);

  useEffect(() => {
    dispatch(fetchFavourite());
  }, [dispatch]);

  // ✅ Fix: safe error message rendering
  if (loading) return <p className="text-center mt-5">Loading favourites...</p>;
  if (error) {
    const errorMsg =
      typeof error === "string"
        ? error
        : error?.errormessage || "An unexpected error occurred.";
    return <p className="text-danger text-center mt-4">Error: {errorMsg}</p>;
  }
  if (items.length === 0)
    return <p className="text-center mt-4">No favourites added yet.</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4 fw-bold text-primary">
        My Favourite Homes ❤️
      </h2>

      <div className="row justify-content-center">
        {items.map((home) => (
          <div key={home._id} className="col-md-4 col-sm-6 mb-4">
            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-6px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {/* Image Section */}
              <div
                style={{ position: "relative", cursor: "pointer" }}
                onClick={() => navigate(`/home/${home._id}`)}
              >
                <img
                  src={
                    home.images?.[0] ||
                    home.photo ||
                    "https://via.placeholder.com/300x200"
                  }
                  alt={home.homename || "Home"}
                  className="card-img-top"
                  style={{
                    height: "220px",
                    width: "100%",
                    objectFit: "cover",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                />

                {/* Overlay Label */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(4px)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    color: "#333",
                    fontWeight: "500",
                  }}
                >
                  ❤️ Guest Favourite
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <h5
                  className="card-title text-primary fw-bold"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/home/${home._id}`)}
                >
                  {home.homename || "N/A"}
                </h5>

                <p className="text-muted mb-1">
                  <i className="bi bi-geo-alt-fill text-danger"></i>{" "}
                  {home.location || "Unknown location"}
                </p>

                <p className="text-success fw-semibold mb-1">
                  <i className="bi bi-currency-rupee"></i>
                  {home.price ?? "N/A"} / night
                </p>

                <p className="text-secondary mb-2" style={{ fontSize: "0.9rem" }}>
                  {home.description
                    ? home.description.slice(0, 80) + "..."
                    : "No description available."}
                </p>

                <p className="mb-0">
  <b style={{ color: "green" }}>Rating:</b>{" "}
  <i className="bi bi-star-fill text-warning"></i>{" "}
  {home.averageRating && home.averageRating > 0
    ? home.averageRating
    : "No ratings yet"}
</p>
              </div>

              {/* Footer */}
              <div className="card-footer bg-white border-0 text-center pb-3">
                <button
                  className="btn btn-outline-danger w-75 fw-semibold"
                  style={{
                    borderRadius: "30px",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => dispatch(removeFavourite(home._id))}
                >
                  <i className="bi bi-heartbreak me-2"></i>
                  Remove Favourite
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favourite;
