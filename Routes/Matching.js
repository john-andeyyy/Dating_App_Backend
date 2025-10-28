const express = require('express');
const Router = express.Router();
const Matching = require('../Controller/Matching')
const AuthChecker = require('../Middleware/verifyToken')


Router.get("/MatchedList/:Userid", AuthChecker.verifyToken, Matching.MatchedList);
Router.post("/Like_unlike", AuthChecker.verifyToken, Matching.Like_unlike);
Router.put("/unMatch", AuthChecker.verifyToken, Matching.unMatch);
Router.get("/PeopleList/:userId", AuthChecker.verifyToken, Matching.list); // random



//! not in use
Router.post("/Swipe_Left_or_Right", AuthChecker.verifyToken, Matching.Swipe_Left_or_Right); 
module.exports = Router; 