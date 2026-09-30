const express= require("express")
const { registerUser, registerOperator, verifyUser, getUser, getUserByOperator, loginUser, updateUser, resolveAccount } = require("../controllers/user.controller")
const router = express.Router()


router.post("/register", registerUser)
router.post("/registerOperator", registerOperator)
router.get("/user", verifyUser, getUser)
router.get("/user/:userId", verifyUser, getUserByOperator)
router.post("/login", loginUser)
router.patch("/user/:id", verifyUser, updateUser)
router.get("/user/:accountNumber", verifyUser, resolveAccount)


module.exports=router