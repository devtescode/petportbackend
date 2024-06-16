const { Userschema } = require("../Models/user.models")
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const env = require("dotenv")
const UAParser = require('ua-parser-js');
const secret = process.env.SECRET
const cloudinary = require("cloudinary")
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
                                    <p style="color: #555555;">Hello Gud day,</p>
                                    <p style="color: #555555;">Thanks for creating an account with PETPORT click on the link below to join the group</p>
                                    <p style="color: #555555;">https://wa.me/message/6L2NE6QD6DYFN1</p>
                                    
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding-top: 20px;">
                                    <a href="#" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 20px; color: #777777;">
                                    <p>Best regards,<br>${req.body.Fullname}</p>
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
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return now.toLocaleDateString('en-US', options);
}
const currentDateTime = getCurrentDateTime();




module.exports.signIn = (req, res) => {
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
                    fullName: user.Fullname,
                    number: user.Number,
                    email: user.Email,
                    products: user.Product,
                    balance: user.Balance

                }
                res.status(200).json({ message: "Login Success", status: true, token, userData })
                console.log("user success", userData)
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
                                        <p style="color: #555555;">Hello Gud day,</p>
                                        <p style="color: #555555;">
                                        You successfully logged into your account on ${currentDateTime} using ${deviceInfo}. Thank you for your patronage.

                                        </p>
                                       
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <a href="#" style="text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 20px; border-radius: 5px; display: inline-block;">Read More</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 20px; color: #777777;">
                                        <p>Best regards,<br>${user.Fullname}</p>
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


module.exports.dashBoard = (req, res) => {
    let token = req.headers.authorization.split(" ")[1]
    console.log(token);
    jwt.verify(token, secret, ((err, result) => {
        if (err) {
            res.send({ status: false, message: "wrong token" })
            console.log(err);
        }
        else {
            Userschema.findOne({ _id: result.id }).then((user) => {
                res.send({ status: true, message: "Success token correct", user })
                console.log(user);

            })
                .catch((err) => {
                    console.log("error Occured", err);
                })
        }
    }))
}


const products = [
    { id: 1, name: 'Dog Picture', description: 'A lovely picture of a Dog', price: "40,000", image: 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 2, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "50,000", image: 'https://images.pexels.com/photos/3361722/pexels-photo-3361722.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 3, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "60,000", image: 'https://images.pexels.com/photos/1420405/pexels-photo-1420405.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 4, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "40,000", image: 'https://images.pexels.com/photos/1390784/pexels-photo-1390784.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 5, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "35,000", image: 'https://images.pexels.com/photos/245035/pexels-photo-245035.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 6, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "70,000", image: 'https://imgs.search.brave.com/3Yw7eiejZQpE_mgQrPMZb2FSH1OfiNN3eEgKnjpeIOo/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTU2/MzY1NDQwL3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9Y3FXdzZ5d3Z0/X3ZsVlpOWmQtOGdW/NmVaZ21CR3M1N0NR/SnBwT1JTTUhnbz0' },
    { id: 7, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "80,000", image: 'https://imgs.search.brave.com/ziKARirV5F1EnhjDU6638VavAGgXWzUrQe62-QH42Fc/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAwLzAyLzc0Lzc0/LzM2MF9GXzI3NDc0/ODdfUU1XWGhEVm9U/bGVueFVkSWJsUWlX/QlRIWk5nTDhlLmpw/Zw' },
    { id: 8, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "90,000", image: 'https://imgs.search.brave.com/nnCzVw4LuYz2o3uO-2-KsgpqRQ2RU4fSuTaWUxQXas4/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzkxLzI3/LzM2MF9GXzg5OTEy/NzM4X2laNW84NUZN/QU1PSDhoTUd1ZWtn/ZjNvRWZ1VUFNbWN2/LmpwZw' },
    { id: 9, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "95,000", image: 'https://imgs.search.brave.com/SIfT35RBOh1_TWrqgWKBD_qM53GxSTBKtHbTyHo2qmQ/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzMwLzczLzcx/LzM2MF9GXzMwNzM3/MTE4X0g5Sk82dUZD/WjlkaExHQ0Y5Mm1o/cWQwd3hYQ0lqZzNx/LmpwZw' },
    { id: 10, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "75,000", image: 'https://imgs.search.brave.com/_W5HgyOcYog77trl4flkvvEHyudd9pwv4dEjCyc4wGA/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzczLzIwLzYz/LzM2MF9GXzczMjA2/MzU2XzY2aFVXd1Jj/MXZzZmlsazFtSDJI/cnFid1UweGliTVpY/LmpwZw' },
    { id: 11, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "80,000", image: 'https://imgs.search.brave.com/88XTazFskkh84F4WJVOquGfGZ6pp_-mGrsDM3Hgs-rk/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAyLzY1Lzg5LzU2/LzM2MF9GXzI2NTg5/NTYyNl93cnAxdjFR/eEFlSWFVUTFrTncz/a3J1MWllN0oySjBn/NS5qcGc' },
    { id: 12, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "95,000", image: 'https://imgs.search.brave.com/oz24HLd6GWPiEKZqcCpMQltJyuiXXiS8Tgr8nscCZO0/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvODYx/NTM1NDY4L3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9QkFReDB0SDJs/ZmVlM200WjBzaFda/NUk5aEN2VVgxVUVM/UlFyV2FZMmNGbz0' },
    { id: 13, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "120,000", image: 'https://images.pexels.com/photos/1458908/pexels-photo-1458908.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 14, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "100,000", image: 'https://images.pexels.com/photos/69433/pexels-photo-69433.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 15, name: 'Dog Picture', description: 'A cute picture of a Dog', price: "130,000", image: 'https://images.pexels.com/photos/4587979/pexels-photo-4587979.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 16, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "180,000", image: 'https://images.pexels.com/photos/10012853/pexels-photo-10012853.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 17, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "200,000", image: 'https://images.pexels.com/photos/7013008/pexels-photo-7013008.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 18, name: 'Pig Picture', description: 'A cute picture of a Pig', price: "230,000", image: 'https://images.pexels.com/photos/7854936/pexels-photo-7854936.jpeg?auto=compress&cs=tinysrgb&w=600' },

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
                await finduser.save();

                const userData = {
                    fullName: finduser.Fullname,
                    number: finduser.Number,
                    email: finduser.Email,
                    products: finduser.Product,
                    balance: finduser.Balance,
                    totalInvest: finduser.Totalinvest,
                    amountInvest: finduser.Amountinvest
                };

                console.log("Product saved successfully");

                res.send({ message: "Successfully saved", userData });
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
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

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