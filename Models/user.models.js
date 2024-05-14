const mongoose = require("mongoose")
const bcrypt = require("bcrypt")


let schema = mongoose.Schema({
    Fullname: { type: String, required: true },
    Number: { type: Number, required: true },
    Email: { type: String, unique: true, required: true },
    Password: { type: String, required: true }, 
})




let saltRound = 10
schema.pre("save", function (next) {
    bcrypt.hash(this.Password, saltRound, (err, hash) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(hash);
            this.Password = hash;
            next()
        }
    })
})
schema.methods.compareUser = async function (userPass) {
    try {
        const user = await bcrypt.compare(userPass, this.Password)
        return user
    } catch (err) {
        console.log(err);
    }
}


const Userschema = mongoose.model("useranimalinvest", schema)
module.exports = {Userschema}