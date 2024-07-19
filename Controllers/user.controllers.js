const { Userschema } = require("../Models/user.models")
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
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require('uuid');
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
                    fullName: user.Fullname,
                    number: user.Number,
                    email: user.Email,
                    products: user.Product,
                    balance: user.Balance,
                    uploadimg: user.Uploadimg
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
                    res.status(500).send({ status: false, message: "Internal server error" });
                })
        }
    }))
}


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

module.exports.fundaccount = async (req, res) => {
    console.log(req.body);
    const { email, amount } = req.body;
    try {
        const user = await Userschema.findOne({ Email: email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const response = await axios.post('https://api.payvessel.com/api/external/request/customerReservedAccount/', {
            "email": `${email}`,
            "name": `${user.Fullname}`,
            "phoneNumber": `${user.Number}`,
            "bankcode": ["120001"],
            "account_type": "DYNAMIC",
            "businessid": "B1CB53D683864E2B86A8B1FBCEA113A4",
        }, {
            headers: {
                'api-key': `${PAYVESSEL_API_KEY}`,
                'api-secret': `Bearer ${PAYVESSEL_API_SECRET}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.status === 'success') {
            user.Balance += amount;
            await user.save();
            res.send({ status: true, message: 'Account funded successfully', balance: user.Balance });
            console.log("account successfully");
        } else {
            res.status(400).send('Funding failed');
            console.log("fail");
        }
    } catch (error) {
        console.error('Error funding account', error.response.data);
        res.status(500).send('Internal server error');
    }
}


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
module.exports.Adminlogin = async (req, res) => {
    const { Email, password } = req.body;
    try {
        const user = await Userschema.findOne({ Email: Email });
        if (!user) {
            return res.json({ message: 'Admin Email not found', status: false });
        }

        if (user.role !== 'admin') {
            return res.json({ message: 'Access denied', status: false });
        }

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.json({ message: 'Incorrect Password', status: false });
        }
        else {
            const admintoken = jwt.sign({ userId: user._id, role: user.role }, adminsecret, { expiresIn: '1h' });
            // console.log(user);
            console.log(admintoken);
            return res.send({ message: "Login Success", status: true, admintoken });
        }
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
                // console.log(user);
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

module.exports.totalbalance = async (req, res) =>{
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