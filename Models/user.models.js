const mongoose = require("mongoose")
const bcrypt = require("bcrypt")


const investmentSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  productPrice: String,
  investmentDate: { type: Date, default: Date.now }
});


let schema = mongoose.Schema({
    Fullname: { type: String, required: true },
    Number: { type: Number, required: true },
    Email: { type: String, unique: true, required: true },
    Password: { type: String, required: true }, 
    Product: {type: [], default:[] },
    Balance: {type: Number, default:0},
    Uploadimg: { type: String, required: false },
    Totalinvest: {type: Number, default:0},
    Amountinvest: {type: Number, default:0},
    Codetoken: { type: Number, required: false },
    tokenGenerationAttempts: { type: Number, default: 0 }, 
    firstAttemptTimestamp: { type: Date, default: null },
    history: { type: [investmentSchema], default: [] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' } 
})




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


const Userschema = mongoose.model("useranimalinvest", schema)
module.exports = {Userschema}