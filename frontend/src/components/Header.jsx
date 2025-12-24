import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../redux/authslice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3 py-2">
      <div className="container-fluid">
        <a
          className="navbar-brand d-flex align-items-center"
          href="/"
          style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#FF385C" }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg"
            alt="Airbnb"
            width="135"
            height="75"
            className="me-2"
          />
        </a>

        <div className="d-flex ms-auto">
          {/* Home button always visible */}
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          {!user ? (
            <>
              <button
                className="btn btn-outline-dark me-2"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="btn btn-danger"
                style={{ backgroundColor: "#FF385C", border: "none" }}
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              {user.usertype === "host" && (
                <button
                  className="btn btn-outline-primary me-2"
                  onClick={() => navigate("/myhomes")}
                >
                  My Homes
                </button>
              )}
              {user.usertype === "guest" && (
                <button
                  className="btn btn-outline-danger me-2"
                  onClick={() => navigate("/favourite")}
                >
                  Favourites
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
