const express = require('express');
const Router = express.Router();
const Msg = require('../Controller/Message')
const AuthChecker = require('../Middleware/verifyToken')


Router.post("/Send", AuthChecker.verifyToken, Msg.Send);
Router.get("/MessageList/:senderId/:receiverId", AuthChecker.verifyToken, Msg.GetConvoMessage);
Router.get("/MatchedListMsg/:Userid", AuthChecker.verifyToken, Msg.MatchedListMsg);


module.exports = Router; 