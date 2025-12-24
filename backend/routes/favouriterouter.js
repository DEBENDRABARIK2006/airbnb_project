const express=require("express");
const favouriterouter=express.Router();
const {isauth}=require("../controller/authcontroller")
const favouritecontroller=require("../controller/favourite")

favouriterouter.get("/favourite",isauth,favouritecontroller.getfavourite);
favouriterouter.post("/favourite/:id",isauth,favouritecontroller.addfavourite);
favouriterouter.post("/favourite/remove/:id",isauth,favouritecontroller.removefavourite);

module.exports=favouriterouter;