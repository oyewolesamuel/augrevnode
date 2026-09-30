const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    transactionType: {
      type: String,
      required: true,
      enum: ["credit", "debit", "withdrawal", "deposit","transfer"],
    },
    amount: { type: Number, required: true },
    description: { type: String },
    transactionStatus: {
      type: String,
      required: true,
      enum: ["failed", "successful", "pending"],
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:function(){
            return["debit", "withdrawal", "transfer"].includes(this.transactionType)
        }
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:function(){
            return["credit", "deposit", "transfer"].includes(this.transactionType)
        }
    }
  
  },

  { timestamps: true, strict: "throw" },
);


const TransactionModel =mongoose.model("transaction", TransactionSchema)


module.exports=TransactionModel