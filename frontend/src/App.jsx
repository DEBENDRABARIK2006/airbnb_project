import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

import Header from "./components/Header";
import Login from "./components/login";
import Signup from "./components/signup";
import HomeList from "./components/homelist";
import FavouriteList from "./components/favourite";
import MyHomes from "./components/hosthomelist";
import AddHome from "./components/addhome";
import EditHome from "./components/edithome";
import HomeDetails from "./components/HomeDetails";

// Import auth action
import { fetchHomes } from "./redux/homeslice";
import { fetchCurrentUser } from "./redux/authslice";

export default function App() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Fetch Homes
    dispatch(fetchHomes());
    // 2. Restore Session (Fixes Google Login / Refresh issue)
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomeList />} />
        
        {/* Redirect to Home if already logged in */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

        {/* Host Routes */}
        {user?.usertype === "host" && (
          <>
            <Route path="/myhomes" element={<MyHomes />} />
            <Route path="/addhome" element={<AddHome />} />
            <Route path="/edithome/:id" element={<EditHome />} />
          </>
        )}

        {/* Guest Routes */}
        {user?.usertype === "guest" && (
          <Route path="/favourite" element={<FavouriteList />} />
        )}

        <Route path="/home/:id" element={<HomeDetails />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}