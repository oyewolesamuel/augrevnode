const mongoose=require("mongoose")

const AccountSchema=new mongoose.Schema({
    accountNumber:{type:"string", require:"true", unique:"true"},

},{strict:"throw", timestamps:true})