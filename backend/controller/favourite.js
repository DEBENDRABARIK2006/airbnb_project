const User=require("../models/user")

exports.addfavourite=async(req,res,next)=>{
  try{
    const userid=req.session.user.id;
    const homeid=req.params.id;
    const userdata=await User.findById(userid);
    if(!userdata.favourite.includes(homeid)){
    userdata.favourite.push(homeid);
    await userdata.save();
    }
    res.status(200).json({
      message: "Home added to favourites",
      favourite: userdata.favourite,
    });
  }catch(err){
    console.error("Add favourite error:", err);
    res.status(500).send("Server error");
  }
};

exports.removefavourite=async(req,res,next)=>{
  try{
    const homeid=req.params.id;
    const userid=req.session.user.id;
    const userdata=await User.findById(userid);
    if (!userdata) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.findByIdAndUpdate(userid,{$pull:{favourite:homeid}});
    res.status(200).json({
      message: "Home removed from favourites",
      favourite: userdata.favourite,
    });
  }catch(err){
    console.error("Remove favourite error:", err);
    res.status(500).send("Server error");
  }
}

exports.getfavourite = async (req, res, next) => {
  try {
    const userid = req.session.user.id;
    const userdata = await User.findById(userid).populate("favourite");
    res.status(200).json({
      favourite: userdata.favourite,
    });
  } catch (err) {
    console.error("Get favourite error:", err);
    res.status(500).send("Server error");
  }
};