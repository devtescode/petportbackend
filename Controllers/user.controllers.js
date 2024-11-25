const { Userschema, Plan, Notification, Comment } = require("../Models/user.models")
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const env = require("dotenv")
const UAParser = require('ua-parser-js');
const secret = process.env.SECRET
const PAYVESSEL_API_KEY = process.env.PAYVESSEL_API_KEY
const PAYVESSEL_API_SECRET = process.env.PAYVESSEL_API_SECRET
const cloudinary = require("cloudinary")
const adminsecret = process.env.ADMIN_SECRET
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose")
const cron = require('node-cron');
const paymentTable = require('../Models/webhookModel')
env.config()

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRETCLOUD
});


module.exports.userWelcome = (req, res) => {
    res.send('welcome here my user')

}

module.exports.signUp = async (req, res) => {
    const { Email } = req.body;
    try {
        const existingUser = await Userschema.findOne({ Email: Email });
        if (existingUser) {
            console.log("Email is already in use");
            return res.status(200).json({ message: "Email is already in use", status: false });
        } else {
            const mailOptions = {
                from: process.env.USER_EMAIL,
                to: req.body.Email,
                subject: 'PETPORT',
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td align="center">
                                    <h1 style="color: #333333;">PETPORT</h1>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <p style="color: #555555;">Hello ${req.body.Fullname},</p>
                                    <p style="color: #555555;">Thanks for creating an account with PETPORT click on the link below to join the group</p>
                                    <p style="color: #555555;">https://wa.me/message/6L2NE6QD6DYFN1</p>
                                    
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding-top: 20px;">
                                    <a href="http://localhost:5173" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 20px; color: #777777;">
                                    
                                     <p>Best regards,<br>PETPORT Team</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            };
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            const newUser = new Userschema(req.body);
            await newUser.save();
            console.log("User saved");
            res.send({ status: true, message: "Success" });
        }
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.Email) {
            console.log("Email is already registered");
            return res.status(400).json({ message: "Email is already registered", status: false });
        } else {
            console.log("Error occurred:", err);
            return res.status(500).json({ message: "Internal Server Error", status: false });
        }
    }
};


function getCurrentDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return now.toLocaleDateString('en-US', options);
}




module.exports.signIn = (req, res) => {
    const currentDateTime = getCurrentDateTime();
    const parser = new UAParser();
    const userAgent = req.headers['user-agent'];
    const parsedUserAgent = parser.setUA(userAgent).getResult();
    const deviceInfo = `${parsedUserAgent.browser.name} on ${parsedUserAgent.os.name}`;
    let { Email, Password } = req.body;
    Userschema.findOne({ Email: Email }).then(async (user) => {
        if (!user) {
            res.status(200).json({ message: "Email Not Found", status: false })
            console.log("Email not found");
        }
        else {
            const correctpassword = await user.compareUser(Password)
            if (!correctpassword) {
                res.status(200).json({ message: "Incorrect Password", status: false })
                console.log("Incorrect Password");
            }
            else {
                let token = jwt.sign({ id: user.id }, secret, { expiresIn: "24h" })
                const userData = {
                    userId: user.id,
                    fullName: user.Fullname,
                    number: user.Number,
                    email: user.Email,
                    products: user.Product,
                    balance: user.Balance,
                    uploadimg: user.Uploadimg,
                    totalinvest: user.Totalinvest,
                    amountinvest: user.Amountinvest,
                    codetoken: user.Codetoken,
                    TokenGenerationAttempts: user.tokenGenerationAttempts,
                    FirstAttemptTimestamp: user.firstAttemptTimestamp,
                    History: user.history,
                }
                res.status(200).json({ message: "Login Success", status: true, token, userData })
                // console.log("user success texting mode", userData)
                console.log(token);
                const mailOptions = {
                    from: process.env.USER_EMAIL,
                    to: req.body.Email,
                    subject: 'PETPORT',
                    html: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Email</title>
                        </head>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                <tr>
                                    <td align="center">
                                        <h1 style="color: #333333;">PETPORT</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p style="color: #555555;">Hello ${user.Fullname},</p>
                                        <p style="color: #555555;">
                                        You successfully logged into your account on ${currentDateTime} using ${deviceInfo}. Thank you for your patronage.

                                        </p>
                                       
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <a href="http://localhost:5173" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 20px; color: #777777;">
                                        <p>Best regards,<br>PETPORT Team</p>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `
                };
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent: ' + info.response);
            }
        }
    })
        .catch((err) => {
            console.log("error occured", err);
            return res.status(200).json({ message: "Error Occured", status: false })
        })
};


// module.exports.dashBoard = (req, res) => {
//     let token = req.headers.authorization.split(" ")[1]
//     console.log(token);
//     jwt.verify(token, secret, ((err, result) => {
//         if (err) {
//             res.send({ status: false, message: "wrong token" })
//             console.log(err);
//         }
//         else {
//             Userschema.findOne({ _id: result.id }).then((user) => {
//                 res.send({ status: true, message: "Success token correct", user })
//                 console.log(user);
//             })
//                 .catch((err) => {
//                     console.log("error Occured", err);
//                     res.status(500).send({ status: false, message: "Internal server error" });
//                 })
//         }
//     }))
// }

module.exports.dashBoard = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).send({ status: false, message: "Authorization token missing" });
    }

    try {
        const decoded = await jwt.verify(token, secret);
        const user = await Userschema.findById(decoded.id).populate('investments.planId');

        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" });
        }

        // Calculate total investment
        const totalInvestment = user.investments.reduce((sum, investment) => {
            const plan = investment.planId;
            return sum + (plan ? plan.price : 0);
        }, 0);

        // Get the number of investments
        const investmentCount = user.investments.length;

        // Get the number of unique products
        const uniqueProducts = new Set(user.investments.map(investment => investment.planId ? investment.planId._id.toString() : null));
        uniqueProducts.delete(null); // Remove any null values that may have been added
        const uniqueProductCount = uniqueProducts.size;

        // Update the user with the new calculated values
        user.Totalinvest = totalInvestment;
        user.Amountinvest = investmentCount;

        await user.save();

        // Send the user data along with total investment, investment count, and unique product count
        res.send({
            status: true,
            message: "Success token correct",
            user: {
                ...user.toObject(),
                Totalinvest: user.Totalinvest,
                Amountinvest: user.Amountinvest,
                uniqueProductCount
            }
        });

    } catch (err) {
        console.error("Error:", err);
        if (err.name === 'JsonWebTokenError') {
            res.status(401).send({ status: false, message: "Invalid token" });
        } else {
            res.status(500).send({ status: false, message: "Internal server error" });
        }
    }
};





const products = [
    { id: 1, name: 'Dog', description: 'A lovely picture of a Dog', price: "40,000", image: 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 2, name: 'Dog', description: 'A cute picture of a Dog', price: "50,000", image: 'https://images.pexels.com/photos/3361722/pexels-photo-3361722.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 3, name: 'Dog', description: 'A cute picture of a Dog', price: "60,000", image: 'https://images.pexels.com/photos/1420405/pexels-photo-1420405.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 4, name: 'Dog', description: 'A cute picture of a Dog', price: "40,000", image: 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 5, name: 'Dog', description: 'A cute picture of a Dog', price: "35,000", image: 'https://images.pexels.com/photos/245035/pexels-photo-245035.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 6, name: 'Pig', description: 'A cute picture of a Pig', price: "70,000", image: 'https://imgs.search.brave.com/3Yw7eiejZQpE_mgQrPMZb2FSH1OfiNN3eEgKnjpeIOo/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTU2/MzY1NDQwL3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9Y3FXdzZ5d3Z0/X3ZsVlpOWmQtOGdW/NmVaZ21CR3M1N0NR/SnBwT1JTTUhnbz0' },
    { id: 7, name: 'Pig', description: 'A cute picture of a Pig', price: "80,000", image: 'https://imgs.search.brave.com/ziKARirV5F1EnhjDU6638VavAGgXWzUrQe62-QH42Fc/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAwLzAyLzc0Lzc0/LzM2MF9GXzI3NDc0/ODdfUU1XWGhEVm9U/bGVueFVkSWJsUWlX/QlRIWk5nTDhlLmpw/Zw' },
    { id: 8, name: 'Pig', description: 'A cute picture of a Pig', price: "90,000", image: 'https://imgs.search.brave.com/nnCzVw4LuYz2o3uO-2-KsgpqRQ2RU4fSuTaWUxQXas4/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzkxLzI3/LzM2MF9GXzg5OTEy/NzM4X2laNW84NUZN/QU1PSDhoTUd1ZWtn/ZjNvRWZ1VUFNbWN2/LmpwZw' },
    { id: 9, name: 'Pig', description: 'A cute picture of a Pig', price: "95,000", image: 'https://imgs.search.brave.com/SIfT35RBOh1_TWrqgWKBD_qM53GxSTBKtHbTyHo2qmQ/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzMwLzczLzcx/LzM2MF9GXzMwNzM3/MTE4X0g5Sk82dUZD/WjlkaExHQ0Y5Mm1o/cWQwd3hYQ0lqZzNx/LmpwZw' },
    { id: 10, name: 'Pig', description: 'A cute picture of a Pig', price: "75,000", image: 'https://imgs.search.brave.com/_W5HgyOcYog77trl4flkvvEHyudd9pwv4dEjCyc4wGA/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzczLzIwLzYz/LzM2MF9GXzczMjA2/MzU2XzY2aFVXd1Jj/MXZzZmlsazFtSDJI/cnFid1UweGliTVpY/LmpwZw' },
    { id: 11, name: 'Pig', description: 'A cute picture of a Pig', price: "80,000", image: 'https://imgs.search.brave.com/88XTazFskkh84F4WJVOquGfGZ6pp_-mGrsDM3Hgs-rk/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAyLzY1Lzg5LzU2/LzM2MF9GXzI2NTg5/NTYyNl93cnAxdjFR/eEFlSWFVUTFrTncz/a3J1MWllN0oySjBn/NS5qcGc' },
    { id: 12, name: 'Pig', description: 'A cute picture of a Pig', price: "95,000", image: 'https://imgs.search.brave.com/oz24HLd6GWPiEKZqcCpMQltJyuiXXiS8Tgr8nscCZO0/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvODYx/NTM1NDY4L3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9QkFReDB0SDJs/ZmVlM200WjBzaFda/NUk5aEN2VVgxVUVM/UlFyV2FZMmNGbz0' },
    { id: 13, name: 'Dog', description: 'A cute picture of a Dog', price: "120,000", image: 'https://images.pexels.com/photos/1458908/pexels-photo-1458908.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 14, name: 'Dog', description: 'A cute picture of a Dog', price: "100,000", image: 'https://images.pexels.com/photos/69433/pexels-photo-69433.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 15, name: 'Dog', description: 'A cute picture of a Dog', price: "130,000", image: 'https://images.pexels.com/photos/4587979/pexels-photo-4587979.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 16, name: 'Pig', description: 'A cute picture of a Pig', price: "180,000", image: 'https://images.pexels.com/photos/10012853/pexels-photo-10012853.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 17, name: 'Pig', description: 'A cute picture of a Pig', price: "200,000", image: 'https://images.pexels.com/photos/7013008/pexels-photo-7013008.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 18, name: 'Pig', description: 'A cute picture of a Pig', price: "230,000", image: 'https://images.pexels.com/photos/7854936/pexels-photo-7854936.jpeg?auto=compress&cs=tinysrgb&w=600' },

];
module.exports.product = (req, res) => {
    res.json(products);
}

module.exports.productid = (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).send('Product not found');
    res.json(product);
}



// module.exports.investnow = async (req, res) => {
//     const {productId, Email} = req.body;
//     try {   
//         const finduser = await Userschema.findOne({Email})
//         if (finduser){            
//             const getProduct = products.find((product) => product.id == productId)
//             finduser.Product.push(getProduct);
//             await finduser.save();
//             const userData = {
//                 fullName: finduser.Fullname,
//                 number: finduser.Number,
//                 email: finduser.Email,
//                 products: finduser.Product,
//                 balance: finduser.Balance   
//             }
//             console.log("Product saved Successfully");
//             res.send({message: "Successfully saved", userData})

//         }
//         else{
//             console.log("Not found");
//             res.status(404).send('User not found');
//         }
//     } catch (error) {
//         console.error("Error saving product", error);
//         res.status(500).send('Internal server error');
//     }
// }
module.exports.investnow = async (req, res) => {
    const { productId, Email } = req.body;
    try {
        const finduser = await Userschema.findOne({ Email });
        if (finduser) {
            const getProduct = products.find((product) => product.id == productId);
            if (!getProduct) {
                return res.status(404).send('Product not found');
            }

            const productPrice = parseInt(getProduct.price.replace(/,/g, ''), 10);
            if (finduser.Balance >= productPrice) {
                finduser.Product.push(getProduct);
                finduser.Balance -= productPrice;
                finduser.Totalinvest += 1;
                finduser.Amountinvest += productPrice;


                const investment = {
                    productId: getProduct.id,
                    productName: getProduct.name,
                    productPrice: getProduct.price
                };
                finduser.history.push(investment);


                await finduser.save();

                const userData = {
                    fullName: finduser.Fullname,
                    number: finduser.Number,
                    email: finduser.Email,
                    products: finduser.Product,
                    balance: finduser.Balance,
                    totalInvest: finduser.Totalinvest,
                    amountInvest: finduser.Amountinvest,
                    history: finduser.history
                };
                console.log("Product saved successfully");
                res.send({ message: "Successfully saved", userData });
                const mailOptions = {
                    from: process.env.USER_EMAIL,
                    to: req.body.Email,
                    subject: 'PETPORT',
                    html: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Email</title>
                        </head>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                <tr>
                                    <td align="center">
                                        <h1 style="color: #333333;">PETPORT</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p style="color: #555555;">Hello ${finduser.Fullname},</p>
                                        <p style="color: #555555;">Your investment in the following product was successful:</p>
                                        <ul style="color: #555555;">
                                            <li><strong>Product ID:</strong> ${getProduct.id}</li>
                                            <li><strong>Product Name:</strong> ${getProduct.name}</li>
                                            <li><strong>Product Price:</strong> ${getProduct.price}</li>
                                        </ul>
                                        <img src="${getProduct.image}" alt="${getProduct.name}" style="width: 100%; max-width: 200px; display: block; margin: 20px auto;">
                                        <p style="color: #555555;">Thank you for your patronage!</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <a href="http://localhost:5173/" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 20px; color: #777777;">
                                        <p>Best regards,<br>PETPORT Team</p>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `
                };
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent: ' + info.response);
            } else {
                console.log("Insufficient balance");
                res.status(400).send('Insufficient balance');
            }
        } else {
            console.log("User not found");
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error("Error saving product", error);
        res.status(500).send('Internal server error');

    }
};



module.exports.changepassword = async (req, res) => {
    jwt.verify(req.body.token, secret, async (err, result) => {
        if (err) {
            res.send({ status: false, message: "wrong token" });
            console.log(err);
        } else {
            try {
                const user = await Userschema.findOne({ _id: result.id });
                if (!user) {
                    return res.status(200).json({ message: "Username Not Found", status: false });
                } else {
                    const correctpassword = await user.compareUser(req.body.OldPassword);
                    if (!correctpassword) {
                        console.log("incorrect password");
                        return res.status(200).json({ message: "Incorrect Password", status: false });
                    } else if (req.body.OldPassword === req.body.NewPassword) {
                        console.log("old password and new password are the same");
                        return res.status(200).json({ message: "New password cannot be the same as the old password", status: false });
                    } else {
                        user.Password = req.body.NewPassword;
                        await user.save();
                        console.log("password changed successfully");
                        return res.status(200).json({ message: "Password changed successfully", status: true });
                    }
                }
            } catch (err) {
                res.send({ message: 'Error Occurred' });
                console.log(err, "Error Occurred");
            }
        }
    });
}


module.exports.profile = async (req, res) => {
    console.log(req.body)
    jwt.verify(req.body.token, secret, (err, result) => {
        if (err) {
            console.log("error" + err.message);
            res.send({ message: 'Upload Fail' });
        } else {
            const myfile = req.body.file;

            cloudinary.v2.uploader.upload(myfile, (err, cloudinaryResult) => {
                if (err) {
                    console.log("error" + err.message);
                    res.send({ message: 'Upload failed. Please check and try again.' });
                } else {
                    Userschema.findOneAndUpdate(
                        { _id: result.id },
                        { Uploadimg: cloudinaryResult.secure_url }
                    )
                        .then((user) => {
                            res.send({
                                status: true,
                                message: "Upload Success",
                                image: cloudinaryResult.secure_url
                            });

                        })
                        .catch((err) => {
                            console.log("Error updating user document", err);
                            res.send({ message: 'Error Occured' });
                        });
                }
            })
        }
    })
}


// module.exports.emailpage = (req, res) => {
//     const userEmail = req.body.Emailpage;
//     Userschema.findOne({ Email: userEmail }).then(async (user) => {
//         if (user) {
//             var mailOptions = {
//                 from: process.env.USER_EMAIL,
//                 to: req.body.Emailpage,
//                 subject: 'ProPulses',
//                 html: `
//                       <!DOCTYPE html>
//                       <html lang="en">
//                       <head>
//                         <meta charset="UTF-8">
//                         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                         <title>Email</title>
//                       </head>
//                       <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">

//                         <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
//                           <tr>
//                             <td align="center">
//                               <h1 style="color: #333333;">PETPORT</h1>
//                             </td>
//                           </tr> 
//                           <tr>
//                             <td>
//                               <p style="color: #555555;">Hello Gud day,</p>
//                               <p style="color: #555555;">Your Forget Password is ${req.body.randomToken}</p>
//                             </td>
//                           </tr>
//                         </table>
//                       </body>
//                       </html>
//                     `
//             };
//             await transporter.sendMail(mailOptions, function (error, info) {
//                 if (error) {
//                     console.log(error.message);
//                 } else {
//                     console.log('Email sent: ' + info.response);
//                 }
//             });
//             // console.log(user)
//             Userschema.updateOne({ _id: user.id }, { $set: { Codetoken: req.body.randomToken } })
//                 .then((user) => {
//                     res.send({ status: true, message: "Successfully sent" })
//                     console.log("The Reset passsword is ", req.body.randomToken);
//                 })
//                 .catch((err) => {
//                     console.log(err, "Error Occured");
//                 })

//             // res.send({ status: true, message: "Success, user found", user, setmycode });
//             // console.log(user);
//         }
//         else {
//             res.send({ status: false, message: "User not found" });
//         }
//     }).catch((error) => {
//         console.error("Error finding user:", error);
//         res.status(500).send({ status: false, message: "Internal server error" });
//     });
// }



module.exports.emailpage = (req, res) => {
    const userEmail = req.body.Emailpage;
    Userschema.findOne({ Email: userEmail }).then(async (user) => {
        if (!user) {
            return res.send({ status: false, message: "User not found" });
        }
        const now = new Date();
        const tenMinutes = 10 * 60 * 1000;

        if (user.tokenGenerationAttempts >= 5) {
            if (now - new Date(user.firstAttemptTimestamp) < tenMinutes) {
                return res.send({ status: false, message: "You have reached the maximum number of attempts. Please wait 10 minutes before trying again." });
            } else {
                user.tokenGenerationAttempts = 0;
                user.firstAttemptTimestamp = null;
            }
        }

        const randomToken = generateRandomToken();

        var mailOptions = {
            from: process.env.USER_EMAIL,
            to: req.body.Emailpage,
            subject: 'ProPulses',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <tr>
                            <td align="center">
                                <h1 style="color: #333333;">PETPORT</h1>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="color: #555555;">Hello Gud day, ${user.Fullname}</p>
                                <p style="color: #555555;">Your Forget Password is ${randomToken}</p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        try {
            await transporter.sendMail(mailOptions);

            user.Codetoken = randomToken;
            user.tokenGenerationAttempts += 1;
            if (user.tokenGenerationAttempts === 1) {
                user.firstAttemptTimestamp = now;
            }
            await user.save();

            res.send({ status: true, message: "Successfully sent" });
        } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).send({ status: false, message: "Internal server error" });
        }
    }).catch((error) => {
        console.error("Error finding user:", error);
        res.status(500).send({ status: false, message: "Internal server error" });
    });
};

function generateRandomToken() {
    const min = 1000;
    const max = 9999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.forgetpassword = async (req, res) => {
    Codetoken = req.body.Forgetmailone
    if (req.body.Forgetmailtwo !== req.body.Forgetmailthree) {
        res.send({ message: "Check the password and try again", status: false });
        return;
    }
    Userschema.findOne({ Codetoken }).then((user) => {
        console.log(user);
        console.log(Codetoken);
        if (!user) {
            res.send({ message: "invaild token", status: false })
        }

        // if (user.Password == req.body.Forgetmailone){
        //     res.send({ message: "New password must be different from the current password", status: false });
        //     console.log("Password must be different from the current password");
        // }
        else {
            user.Password = req.body.Forgetmailtwo
            user.save().then((user) => {
                res.send({ message: "Success", status: true })

            })
        }
    })
        .catch((err) => {
            console.log(err, "Error Occuer");
            res.send({ message: "Something went wrong", status: false })
        })
}

// module.exports.fundaccount = async (req, res) => {
//     console.log(req.body);
//     const { email, amount } = req.body;
//     try {
//         const user = await Userschema.findOne({ Email: email });

//         if (!user) {
//             return res.status(404).send('User not found');
//         }
//         console.log(user.Fullname);

//         const response = await axios.post('https://api.payvessel.com/api/external/request/customerReservedAccount/', {

//             "email": `${email}`,
//             "name": `${user.Fullname}`,
//             "phoneNumber": `0${user.Number}`,
//             // "phoneNumber": "08064864821",
//             "bankcode": ["120001"],
//             "account_type": "DYNAMIC",
//             "businessid": "B1CB53D683864E2B86A8B1FBCEA113A4",
//         }, {
//             headers: {
//                 'api-key': `${PAYVESSEL_API_KEY}`,
//                 'api-secret': `Bearer ${PAYVESSEL_API_SECRET}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         if (response.data.status === 'success') {
//             user.Balance += amount;
//             await user.save();
//             res.send({ status: true, message: 'Account funded successfully', balance: user.Balance });
//             console.log("account successfully");
//         } else {
//             res.status(400).send('Funding failed');
//             console.log("fail");
//         }
//     } catch (error) {
//         console.error('Error funding account', error.response.data);
//         res.status(500).send('Internal server error');
//     }
// }



module.exports.fundaccount = async (req, res) => {
    const { email, amount } = req.body;
    try {
        const user = await Userschema.findOne({ Email: email });

        if (!user) {
            return res.status(404).send('User not found');
        }
        console.log(user.Fullname);

        // Create a transaction request with Paystack
        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
            email: email,
            fullname : user.Fullname,
            phone: user.Number,
            amount: amount * 100, // Paystack requires the amount in kobo
         
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.API_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status) {
            // If the transaction is successful, redirect the user to the Paystack payment page
            res.send({
                status: true,
                message: 'Account funding success',
                authorization_url: response.data.data.authorization_url // This URL will take the user to Paystack for payment
            });
            // console.log("Accout",response.data.data.reference);
            
            console.log("link response successfully sent");
        } else {
            res.status(400).send('Funding failed');
            console.log("Funding failed");
        }
    } catch (error) {
        console.error('Error funding account', error.response ? error.response.data : error.message);
        res.status(500).send('Internal server error');
    }
};



// module.exports.paystackWebhook = async (req, res) => {
//     const { event, data } = req.body;

//     // Paystack sends different events, we're only interested in successful transactions
//     if (event === 'charge.success') {
//         const transactionRef = data.reference;

//         // Verify transaction with Paystack to be sure it's valid
//         // console.log(verifyResponse);
        
//         try {
//             const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${transactionRef}`, {
//                 headers: {
//                     'Authorization': `Bearer ${process.env.API_SECRET}`
//                 }
//             });

//             if (verifyResponse.data.status && verifyResponse.data.data.status === 'success') {
//                 // Find the user by email or other identifier
//                 const user = await Userschema.findOne({ Email: verifyResponse.data.data.customer.email });

//                 if (user) {
//                     // Update the user's balance
//                     user.Balance += verifyResponse.data.data.amount / 100; // Convert kobo to Naira
//                     await user.save();

//                     console.log('User balance updated successfully');
//                     res.status(200).send('Webhook processed successfully');
//                 } else {
//                     res.status(404).send('User not found');
//                     console.log("user not found");
                    
//                 }
//             } else {
//                 res.status(400).send('Transaction verification failed');
//                 console.log("Transaction verification failed");
                
//             }
//         } catch (error) {
//             console.error('Error verifying transaction:', error);
//             res.status(500).send('Server error');
//         }
//     } else {
//         res.status(400).send('Event not handled');
//     }
// };



// module.exports.getBalance = async (req, res) => {
//     const { email } = req.params; // Extract email from URL

//     try {
//         const user = await Userschema.findOne({ Email: email });
//         // console.log("my user balance", user.Balance);
        
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Send user's balance in the response
//         res.status(200).json({ Balance: user.Balance });
//         console.log(user.Balance);
        
//     } catch (error) {
//         console.error('Error fetching user balance:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

module.exports.userBalanceWallet= async (req, res) => {
    try {
        const { email } = req.params;
        console.log(email, "payer")
        const user = await Userschema.findOne({ Email:email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ walletBalance: user.Balance });
    } catch (error) {
        console.error('Error fetching wallet balance:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};




module.exports.getHistory = async (req, res) => {
    const email = req.body.email;
    console.log(req.body);

    try {
        const user = await Userschema.findOne({ Email: email });
        console.log(user);
        if (!user) {
            console.log("User not found");
            return res.status(404).send('User not found');
        }
        console.log("User Found", user.history);
        const history = user.history
        res.send({ message: 'History found', history });
    } catch (error) {
        console.error("Error fetching investment history", error);
        res.status(500).send('Internal server error');
    }
}

module.exports.investperform = (req, res) => {
    res.json(products)
}



const promoteToAdmin = async (Email) => {
    try {
        const user = await Userschema.findOne({ Email });
        if (!user) {
            console.log('User not found');
            return;
        }
        user.role = 'admin';
        await user.save();
        console.log(`User ${Email} promoted to admin`);
    } catch (error) {
        console.error('Error promoting user:', error);
    }
};
promoteToAdmin('petport09@gmail.com');


// module.exports.Adminlogin = async (req, res) => {
//     const { Email, password } = req.body;
//     try {
//         const user = await Userschema.findOne({ Email });
//         if (!user) {
//             return res.json({ message: 'Admin Email not found', status: false });
//         }

//         if (user.role !== 'admin') {
//             return res.json({ message: 'Access denied', status: false });
//         }

//         const isMatch = await user.compareUser(password);
//         if (!isMatch) {
//             return res.json({ message: 'Incorrect Password', status: false });
//         }

//         const admintoken = jwt.sign({ userId: user._id, role: user.role }, adminsecret, { expiresIn: '1h' });
//         return res.send({ message: 'Login Success', status: true, admintoken });
//     } catch (error) {
//         console.error('Error during login:', error);
//         return res.status(500).send('Internal server error');
//     }
// };

module.exports.Adminlogin = async (req, res) => {
    const { Email, password } = req.body;
    try {
        console.log('Admin login attempt:', Email);

        const user = await Userschema.findOne({ Email });
        console.log(user);
        if (!user) {
            console.log('Admin Email not found');
            return res.json({ message: 'Admin Email not found', status: false });
        }

        console.log('User found:', user.Email, 'Role:', user.role);

        if (user.role !== 'admin') {
            console.log('Access denied for user:', user.Email);
            return res.json({ message: 'Access denied', status: false });
        }

        const isMatch = await user.compareUser(password);
        if (!isMatch) {
            console.log('Incorrect Password for user:', user.Email);
            return res.json({ message: 'Incorrect Password', status: false });
        }

        const admintoken = jwt.sign({ userId: user._id, role: user.role }, adminsecret, { expiresIn: '1h' });
        console.log('Login Success for admin:', user.Email);
        return res.send({ message: 'Login Success', status: true, admintoken });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).send('Internal server error');
    }
};


// const authAdmin = (req, res, next) => {
//     const token = req.header('x-auth-token');

//     if (!token) {
//         return res.status(401).send('No token, authorization denied');
//     }

//     try {
//         const decoded = jwt.verify(token, 'your_jwt_secret');
//         if (decoded.role !== 'admin') {
//             return res.status(403).send('Access denied');
//         }
//         req.user = decoded.userId;
//         next();
//     } catch (error) {
//         res.status(401).send('Token is not valid');
//     }
// };

module.exports.Admindb = (req, res) => {
    let admintoken = req.headers.authorization.split(" ")[1]
    jwt.verify(admintoken, adminsecret, ((err, result) => {
        if (err) {
            res.send({ status: false, message: "wrong token" })
            console.log(err);
        }
        else {
            // console.log(admintoken);
            // res.send({ status: true, message: "Valid token" })
            // console.log(result);
            Userschema.findOne({ _id: result.userId }).then((user) => {
                res.send({ status: true, message: "Valid token", user })
                console.log(user);
            })
        }
    }))
}

module.exports.getall = async (req, res) => {
    try {
        const users = await Userschema.find()
        res.json(users);
        console.log(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message);
    }
}


// router.put('/:id', async (req, res) => {
//     try {
//       const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
//       if (!updatedUser) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       res.json(updatedUser);
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
//   });

module.exports.putall = async (req, res) => {
    try {
        const updatedUser = await Userschema.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });

        }
        res.json(updatedUser);
        // console.log(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}


// router.post('/', async (req, res) => {
//     const user = new User(req.body);
//     try {
//       const newUser = await user.save();
//       res.statu          s(201).json(newUser);
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
//   });

module.exports.postall = async (req, res) => {
    const user = new Userschema(req.body);
    try {
        const newUser = await user.save();
        // res.status(201).json(newUser);
        res.json(newUser);
        console.log(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports.delecteach = async (req, res) => {
    console.log(req.body);
    try {
        const deletedUser = await Userschema.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // res.json(deletedUser);
        res.json({ message: 'User deleted' });
        console.log(deletedUser);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.getuseranimalinvest = async (req, res) => {

    try {
        const users = await Userschema.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.totalbalance = async (req, res) => {
    try {
        const totalBalance = await Userschema.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: "$Balance" }
                }
            }
        ]);

        res.json({ totalBalance: totalBalance[0]?.totalBalance || 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.totalAmountInvested = async (req, res) => {
    // try {
    //     const totalAmountInvested = await Userschema.aggregate([
    //         {
    //             $group: {
    //                 _id: null,
    //                 totalAmountInvested: { $sum: "$Amountinvest" }
    //             }
    //         }
    //     ]);

    //     res.json({ totalAmountInvested: totalAmountInvested[0]?.totalAmountInvested || 0 });
    // } catch (err) {
    //     res.status(500).json({ message: err.message });
    // }
    try {
        const result = await Userschema.aggregate([
            { $unwind: "$investments" },
            { $lookup: { from: "plans", localField: "investments.planId", foreignField: "_id", as: "plan" } },
            { $unwind: "$plan" },
            { $group: { _id: null, totalAmountInvested: { $sum: "$plan.price" } } }
        ]);
        const totalAmountInvested = result[0]?.totalAmountInvested || 0;
        res.json({ totalAmountInvested });
    } catch (err) {
        console.error('Error fetching total amount invested:', err);
        res.status(500).send({ status: false, message: "Internal server error" });
    }
}

module.exports.Totalinvest = async (req, res) => {
    // try {
    //     const totalinvesttogether = await Userschema.aggregate([
    //         {
    //             $group: {
    //                 _id: null,
    //                 totalinvesttogether: { $sum: "$Totalinvest" }
    //             }
    //         }
    //     ])
    //     res.json({ totalinvesttogether: totalinvesttogether[0]?.totalinvesttogether || 0 });
    // }
    // catch (err) {
    //     res.status(500).json({ message: err.message });
    // }

    try {
        const totalInvest = await Userschema.aggregate([
            { $unwind: "$investments" },
            { $count: "totalinvesttogether" }
        ]);
        res.json({ totalinvesttogether: totalInvest[0]?.totalinvesttogether || 0 });
    } catch (err) {
        console.error('Error fetching total investments:', err);
        res.status(500).send({ status: false, message: "Internal server error" });
    }
}

module.exports.changePasswordAdmin = async (req, res) => {
    const { email, oldPassword, newPassword, admintoken } = req.body;

    jwt.verify(admintoken, adminsecret, async (err, decoded) => {
        if (err) {
            return res.status(200).send({ success: false, message: "Invalid token" });
        }

        try {
            const user = await Userschema.findOne({ Email: email });
            if (!user || user.role !== 'admin') {
                console.log("User not found");
                return res.status(200).send({ success: false, message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.Password);
            // const correctpassword = await user.compareUser(req.body.OldPassword);
            if (!isMatch) {
                console.log("incorrcet pass", isMatch);
                console.log("Incorrect current password");
                return res.status(200).send({ success: false, message: 'Incorrect current password' });
            }

            if (oldPassword === newPassword) {
                console.log("New password cannot be the same as the old password");
                return res.status(200).send({ success: false, message: 'New password cannot be the same as the old password' });
            }
            else {
                user.Password = req.body.newPassword;
                await user.save();

                console.log("Password changed successfully");
                return res.status(200).send({ success: true, message: 'Password changed successfully' });
            }
        } catch (error) {
            console.error('Error changing password', error);
            res.send({ message: 'Error Occurred' });
        }
    });
};

module.exports.createplan = async (req, res) => {

    const { name, description, price, file, investmentPeriods } = req.body;

    try {
        let imageUrl = '';
        if (file) {
            const uploadResult = await cloudinary.uploader.upload(file);
            imageUrl = uploadResult.secure_url;
        }

        const newPlan = new Plan({
            name,
            description,
            price,
            image: imageUrl,
            investmentPeriods
        });
        console.log(newPlan);
        await newPlan.save();
        res.json({ success: true, message: 'Plan created successfully' });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


module.exports.getuserplans = async (req, res) => {
    try {
        const plans = await Plan.find();
        // console.log(plans);
        res.json({ success: true, message: 'Plan get successfully', plans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports.adminplansdelect = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        else {
            await Plan.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Plan deleted successfully' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

module.exports.updateplan = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPlan = await Plan.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedPlan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        res.json({ success: true, plan: updatedPlan });
    } catch (err) {
        console.error('Error updating plan:', err.message);
        res.status(500).send('Server Error');
    }
}

module.exports.getplan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        res.json({ success: true, plan });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

module.exports.planinvestnow = async (req, res) => {
    const { planId, email, productImage, investmentPeriod, investmentPrice } = req.body;

    try {
        console.log('Plan ID:', planId);
        console.log('Email:', email);
        console.log('Investment Period:', investmentPeriod);
        console.log('Investment Price:', investmentPrice);

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const user = await Userschema.findOne({ Email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the user has enough balance for the selected investment price
        if (user.Balance < investmentPrice) {
            return res.status(400).json({ success: false, message: 'Insufficient balance for this investment' });
        }

        // Deduct the selected investment amount from the user’s balance
        user.Balance -= investmentPrice;

        // Calculate the earnings based on the investment period
        let percentageIncrease = 0;
        let months = 0;

        if (investmentPeriod.includes('3-month')) {
            percentageIncrease = 10;
            months = 3;
        } else if (investmentPeriod.includes('6-month')) {
            percentageIncrease = 20;
            months = 6;
        } else if (investmentPeriod.includes('9-month')) {
            percentageIncrease = 30;
            months = 9;
        }

        const earnings = (investmentPrice * percentageIncrease) / 100 + investmentPrice;

        // Calculate the end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + months);

        // Update the user's history and investments
        user.history.push({
            productId: planId,
            productName: plan.name,
            productPrice: investmentPrice,
            productImage: productImage,
            investmentPeriod: investmentPeriod,
            investmentPrice: investmentPrice,
            expectedEarnings: earnings,
            endDate: endDate.toISOString()
        });

        user.investments.push({
            planId,
            investmentDate: startDate,
            investmentPeriod: investmentPeriod,
            investmentPrice: investmentPrice,
            expectedEarnings: earnings,
            endDate: endDate
        });

        await user.save();

        const userData = {
            fullName: user.Fullname,
            number: user.Number,
            email: user.Email,
            products: user.Product,
            balance: user.Balance,
            totalInvest: user.Totalinvest,
            amountInvest: user.Amountinvest,
            history: user.history
        };

        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: email,
            subject: 'PETPORT Investment Confirmation',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <tr>
                            <td align="center">
                                <h1 style="color: #333333;">PETPORT</h1>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="color: #555555;">Hello ${user.Fullname},</p>
                                <p style="color: #555555;">Your investment in the following plan was successful:</p>
                                <ul style="color: #555555;">
                                    <li><strong>Plan Name:</strong> ${plan.name}</li>
                                    <li><strong>Investment Price:</strong> ₦${investmentPrice}</li>
                                    <li><strong>Investment Period:</strong> ${investmentPeriod}</li>
                                    <li><strong>Expected Earnings:</strong> ₦${earnings}</li>
                                    <li><strong>End Date:</strong> ${endDate.toDateString()}</li>
                                </ul>
                                <img src="${plan.image}" alt="${plan.name}" style="width: 100%; max-width: 200px; display: block; margin: 20px auto;">
                                <p style="color: #555555;">Thank you for your patronage!</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-top: 20px;">
                                <a href="http://localhost:5173/" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top: 20px; color: #777777;">
                                <p>Best regards,<br>PETPORT Team</p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.json({
            success: true,
            message: 'Investment successful!',
            userData: userData
        });

    } catch (error) {
        console.error('Error during investment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




module.exports.adnotification = async (req, res) => {
    console.log(req.body);
    try {
        const { message, userId } = req.body;

        if (userId === 'all') {
            // Create a single notification for all users
            const newNotification = new Notification({
                message,
                userId: 'all' // Set userId to 'all'
            });

            await newNotification.save();
            res.status(201).json({ message: 'Notification sent to all users', notification: newNotification });
        } else {
            // Send notification to a specific user
            const newNotification = new Notification({
                message,
                userId
            });

            await newNotification.save();
            res.status(201).json({ message: 'Notification sent to user', notification: newNotification });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};




module.exports.getusernotification = async (req, res) => {
    console.log(req.body);

    try {
        const { userId } = req.query;
        let notifications;

        if (userId === 'all') {
            notifications = await Notification.find(); // Fetch all notifications
        } else {
            notifications = await Notification.find({
                $or: [{ userId: userId }, { userId: 'all' }]
            });
        }

        res.status(200).json({ notification: notifications });
        console.log("Fetched Notifications:", notifications);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.fetchUsersNotifications = async (req, res) => {
    try {
        const users = await Userschema.find({}, '_id Email Fullname');
        res.status(200).json(users);
        console.log(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find();
        res.status(200).json({ notifications });
        console.log(notifications);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports.likeplan = async (req, res) => {
    const { userId, planId } = req.body;

    try {
        const plan = await Plan.findById(planId);

        const hasLiked = plan.likes.includes(userId);

        if (hasLiked) {
            plan.likes = plan.likes.filter(id => id.toString() !== userId.toString());
            plan.likesCount -= 1;
        } else {
            plan.likes.push(userId);
            plan.likesCount += 1;
        }

        await plan.save();

        res.status(200).json({
            likes: plan.likes,
            likesCount: plan.likesCount,
        });

        console.log("Like count", plan.likesCount);
        console.log("Plan likes", plan.likes);


    } catch (error) {
        res.status(500).json({ error: 'An error occurred while liking/unliking the plan.' });
    }
}


module.exports.addcomment = async (req, res) => {
    const { userId, planId, commentText } = req.body;

    try {
        const comment = new Comment({ userId, planId, commentText });
        await comment.save();

        // Get the updated comment count
        const commentCount = await Comment.countDocuments({ planId });

        res.status(200).json({
            message: 'Comment added successfully',
            comment,
            commentCount  // Return the updated count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
};

module.exports.getcomments = async (req, res) => {
    try {
        const comments = await Comment.find({ planId: req.params.id })
            .populate('userId', 'Fullname Email Uploadimg')
            .exec();

        // Get the comment count
        const commentCount = comments.length;

        res.status(200).json({ comments, commentCount });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
};


module.exports.getusernotificationcount = async (req, res) => {
    const userId = req.query.userId; // Adjust according to your auth logic

    try {
        const count = await Notification.countDocuments({
            userId: { $in: ['all', userId] },
            read: false, // Assuming you have a field that marks notifications as read/unread
        });

        res.status(200).json({ count });
        console.log("Notification count", count);

    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notification count' });
    }
}

module.exports.testdashboard = async (req, res) => {
    try {
        const data = await Userschema.find();
        res.json(data);
        console.log(data);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}


module.exports.deletecomment = async (req, res) => {
    try {
        const comment = await Comment.findByIdAndDelete(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment deleted successfully', comment });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment', error });
    }
}

module.exports.getuserallcomments = async (req, res) => {
    try {
        const commentsall = await Comment.find()
            .populate('userId', 'Fullname Uploadimg')
            .populate('planId', 'image likes likesCount');
        res.status(200).json({ commentsall });
        console.log(commentsall);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
}

module.exports.getallinvest = async (req, res) => {
    try {
        // Query for recent investments from all users
        const users = await Userschema.find()
            .populate({
                path: 'investments.planId', // Populate plan details
                select: 'name image' // Select fields to include in the populated plan
            })
            .exec();

        // Flatten and sort investments
        const investments = users.flatMap(user => user.investments);
        investments.sort((a, b) => b.investmentDate - a.investmentDate); // Sort by investmentDate

        // Limit to the most recent 5 investments
        const recentInvestments = investments.slice(0, 5);

        console.log(recentInvestments);

        if (!recentInvestments.length) {
            return res.status(404).json({ success: false, message: 'No recent investments found' });
        }

        res.json({ success: true, investments: recentInvestments });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

};


module.exports.addupaccount = async (req, res) => {
    const { AccountNumber, Bankcode, bank, token } = req.body;

  
    if (!AccountNumber || !Bankcode || !bank || !token) {
        return res.status(400).json({ status: false, error: "Missing required fields." });
    }

    try {
 
        const paystackResponse = await axios.get(`https://api.paystack.co/bank/resolve`, {
            params: {
                account_number: AccountNumber,
                bank_code: Bankcode,
                currency: 'NGN'
            },
            headers: {
                Authorization: `Bearer ${process.env.API_SECRET}`
            }
        });

        const accountData = paystackResponse.data;

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, secret); 
        } catch (err) {
            console.error("JWT Verification Error:", err);
            return res.status(401).json({ status: false, message: "Invalid or expired token." });
        }

        // Update user account information
        const updatedUser = await Userschema.findOneAndUpdate(
            { _id: decoded.id },
            { 
                $set: { 
                    Account: AccountNumber, 
                    AccountName: accountData.data.account_name, 
                    bank: bank 
                } 
            },
            { new: true } // Return the updated document
        );
        // console.log(updatedUser);
        

        if (!updatedUser) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        // Successful response
        console.log("account successfully added");
        return res.status(200).json({ 
            status: true, 
            message: "Account successfully added.", 
            accountName: accountData.data.account_name 
            
        });

    } catch (err) {
        // Handle specific axios errors
        if (err.response) {
            // Errors from Paystack API
            console.error("Paystack API Error:", err.response.data);
            return res.status(err.response.status).json({ 
                status: false, 
                error: err.response.data.message || "Error resolving bank account." 
            });
        } else if (err.request) {
            // Network errors
            console.error("Network Error:", err.request);
            return res.status(503).json({ status: false, error: "Service Unavailable." });
        } else {
            // Other errors
            console.error("Server Error:", err.message);
            return res.status(500).json({ status: false, error: "Internal Server Error." });
        }
    }
}

module.exports.getPayoutDetails = async (req, res) => {
    const { email } = req.query; // Assuming email is passed as a query parameter

    try {
        const user = await Userschema.findOne({ Email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch investment history or active investments
        const investments = user.history; // Adjust field based on your schema
        if (!investments || investments.length === 0) {
            return res.status(200).json({ success: true, message: 'No investments found', investments: [] });
        }

        res.json({ success: true, investments });
    } catch (error) {
        console.error('Error fetching payout details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



