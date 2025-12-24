import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHomes } from "../redux/homeslice";
import { addFavourite, removeFavourite, fetchFavourite } from "../redux/favouriteslice";
import { useNavigate } from "react-router-dom";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

const HomeList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { homes = [], loading, error } = useSelector((state) => state.home);
  const { items: favouriteItems = [] } = useSelector((state) => state.favourite);
  const { user } = useSelector((state) => state.auth);

  const [isLoadingFav, setIsLoadingFav] = useState(false);

  useEffect(() => {
    dispatch(fetchHomes());
    if (user?.usertype === "guest") dispatch(fetchFavourite());
  }, [dispatch, user]);

  const toggleFavourite = async (home) => {
    if (isLoadingFav) return;
    setIsLoadingFav(true);

    try {
      if (favouriteItems.some((f) => f._id === home._id)) {
        await dispatch(removeFavourite(home._id));
      } else {
        await dispatch(addFavourite(home._id));
      }
      await dispatch(fetchFavourite());
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    } finally {
      setIsLoadingFav(false);
    }
  };

  if (loading) return <p className="text-center mt-5">Loading homes...</p>;
  if (error) return <p className="text-danger text-center">Error: {error.message || error}</p>;
  if (!Array.isArray(homes) || homes.length === 0)
    return <p className="text-center mt-4">No homes available.</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold text-primary text-center">Available Homes</h2>
      <div className="row justify-content-center">
        {homes.map((home) => {
          const isFavourite = favouriteItems.some((f) => f._id === home._id);

          return (
            <div key={home._id} className="col-md-3 col-sm-6 mb-4">
              <div
                className="card border-0 shadow-sm h-100 position-relative"
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-6px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
                
                {/* ===== IMAGE SECTION ===== */}
                <div style={{ position: "relative" }}>
                  {/* Guest Favourite Badge */}
                  <div
                    className="position-absolute top-0 start-0 m-2 px-3 py-1"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      borderRadius: "20px",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      color: "#333",
                    }}>
                    Guest favourite
                  </div>

                  {/* Heart Icon */}
                  {user?.usertype === "guest" && (
                    <button
                      onClick={() => toggleFavourite(home)}
                      disabled={isLoadingFav}
                      className="position-absolute top-0 end-0 m-2 border-0"
                      style={{
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                      {isFavourite ? (
                        <AiFillHeart color="#ff385c" size={22} />
                      ) : (
                        <AiOutlineHeart color="#000" size={22} />
                      )}
                    </button>
                  )}

                  {/* Clickable Image */}
                  <div onClick={() => navigate(`/home/${home._id}`)} style={{ cursor: "pointer" }}>
                    <img
                      src={
                        home.images?.[0] ||
                        home.photo ||
                        "https://via.placeholder.com/250x160?text=No+Image"
                      }
                      alt={home.homename || "Home"}
                      className="card-img-top"
                      style={{
                        height: "180px",
                        width: "100%",
                        objectFit: "cover",
                        borderBottom: "1px solid #eee",
                      }}
                    />
                  </div>
                </div>

                {/* ===== CARD BODY ===== */}
                <div className="card-body">
                  <h6
                    className="fw-bold mb-1 text-dark"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/home/${home._id}`)}>
                    {home.homename?.length > 25
                      ? home.homename.slice(0, 25) + "..."
                      : home.homename}
                  </h6>

                  <p className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-geo-alt-fill text-danger"></i> {home.location || "Unknown"}
                  </p>

                  <p className="mb-1 fw-semibold text-success">
                    ₹{home.price ?? "N/A"} / night
                  </p>

                 <p className="mb-0">
  <b style={{ color: "green" }}>Rating:</b>{" "}
  <i className="bi bi-star-fill text-warning"></i>{" "}
  {home.averageRating && home.averageRating > 0
    ? home.averageRating
    : "No ratings yet"}
</p>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeList;
