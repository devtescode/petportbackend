const mongoose = require("mongoose")

const bcrypt = require("bcrypt")


const investmentSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  productPrice: String,
  investmentDate: { type: Date, default: Date.now },
  productImage: { type: String, required: false },
  investmentPeriod: { type: String, required: false },  // Add this line
  investmentPrice: { type: String, required: false },  // Add this line
  cashOutPercentage: {
    type: Number,
    default: 0
  }
});

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: false },
  investmentPeriods: {
    '3-month': {
      type: Number,
      required: true,
    },
    '6-month': {
      type: Number,
      required: true,
    },
    '9-month': {
      type: Number,
      required: true,
    },
  },
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User', // assuming you have a User model
    default: [], // initialize as an empty array
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

let schema = mongoose.Schema({
  Fullname: { type: String, required: true },
  Number: { type: Number, required: true },
  Email: { type: String, unique: true, required: true },
  Password: { type: String, required: true },
  Product: { type: [], default: [] },
  Balance: { type: Number, default: 0 },
  Uploadimg: { type: String, required: false },
  Totalinvest: { type: Number, default: 0 },
  Amountinvest: { type: Number, default: 0 },
  Codetoken: { type: Number, required: false },
  tokenGenerationAttempts: { type: Number, default: 0 },
  firstAttemptTimestamp: { type: Date, default: null },
  history: { type: [investmentSchema], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  investments: [
    {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      investmentDate: { type: Date }
    }
  ],
  Account: { type: String, required: false },        
  AccountName: { type: String, required: false },    
  bank: { type: String, required: false },
  virtualAccounts: [
    {
        accountNumber: String,
        accountBank: String,
        accountName: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        isActive: { type: Boolean, default: true },
    },
], 
}, { timestamps: true })



const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'useranimalinvest', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  commentText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// const NotificationSchema = new mongoose.Schema({
//   message: { type: String, required: true },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   isRead: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });


const NotificationSchema = new mongoose.Schema({
  // userId: { type: String, required: true }, // "all" for all users or specific user ID
  userId: {
    type: String,
    default: 'all', // 'all' means the notification is for all users
  },
  message: { type: String, required: true },
  read: {
    type: Boolean,
    default: false, // Default to unread
  },
  createdAt: { type: Date, default: Date.now }
});



// let saltRound = 10
// schema.pre("save", function (next) {
//     bcrypt.hash(this.Password, saltRound, (err, hash) => {
//         if (err) {
//             console.log(err);
//         }
//         else {
//             console.log(hash);
//             this.Password = hash;
//             next()
//         }
//     })
// })

const saltRounds = 10;
schema.pre("save", async function (next) {
  if (this.isModified("Password")) {
    try {
      const hashedPassword = await bcrypt.hash(this.Password, saltRounds);
      this.Password = hashedPassword;
      next();
    } catch (err) {
      console.error("Error hashing password:", err);
      next(err);
    }
  } else {
    next();
  }
});





schema.methods.compareUser = async function (userPass) {
  try {
    const user = await bcrypt.compare(userPass, this.Password)
    console.log(this.Password);
    return user

  } catch (err) {
    console.log(err);
  }
}

const Notification = mongoose.model('Notification', NotificationSchema);
const Userschema = mongoose.model("useranimalinvest", schema)
const Plan = mongoose.model("Plan", PlanSchema);
const Comment = mongoose.model('Comment', commentSchema);
module.exports = { Userschema, Plan, Notification, Comment }