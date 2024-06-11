const { Userschema } = require("../Models/user.models")
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const env = require("dotenv")
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


module.exports.signIn = (req, res) => {
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
                console.log("user success", userData)
                return res.status(200).json({ message: "Login Success", status: true, token, userData })
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
    { id: 1, name: 'Dog Picture', description: 'A lovely picture of a dog', price: "40,000", image: 'https://imgs.search.brave.com/EyF2d37ECqQjj_VKRgXk4co-xc_B0MI-Sz5LZWweezo/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9idXJz/dC5zaG9waWZ5Y2Ru/LmNvbS9waG90b3Mv/c2FkLWRvZy5qcGc_/d2lkdGg9MTAwMCZm/b3JtYXQ9cGpwZyZl/eGlmPTAmaXB0Yz0w' },
    { id: 2, name: 'Dog Picture', description: 'A cute picture of a cat', price: "50,000", image: 'https://imgs.search.brave.com/6F1Iwg06KgMESprZsZgI6ax7GAIs77ubAO1Cgj9kfL4/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2LzEwLzcxLzY0/LzM2MF9GXzYxMDcx/NjQ5M195Zm1SaUdI/MTZZdFQ2emZPbFNk/WnJnb25iS24xbER0/UC5qcGc' },
    { id: 3, name: 'Dog Picture', description: 'A cute picture of a cat', price: "60,000", image: 'https://imgs.search.brave.com/lI9yF1H8NNJ2eKvRaLHJISmPFhFqGlsf75ksfWU7Fug/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNjk3/OTQ2NDMwL3Bob3Rv/L3BpdGJ1bGwtZG9n/LXBvcnRyYWl0LXdp/dGgtaHVtYW4tZXhw/cmVzc2lvbi5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9dVdU/OXZCb0NaUFB5Zzl4/a0owY1FJLUhxV2Q1/c2xmN19Rc2Rpd1l2/YXpTWT0' },
    { id: 4, name: 'Dog Picture', description: 'A cute picture of a cat', price: "40,000", image: 'https://imgs.search.brave.com/1-p2jC4M0PEF8IqbhheAEjtAlE87PbTR8JFxD4rE-DA/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9idXJz/dC5zaG9waWZ5Y2Ru/LmNvbS9waG90b3Mv/c3VwZXItcHVwcHku/anBnP3dpZHRoPTEw/MDAmZm9ybWF0PXBq/cGcmZXhpZj0wJmlw/dGM9MA' },
    { id: 5, name: 'Dog Picture', description: 'A cute picture of a cat', price: "35,000", image: 'https://imgs.search.brave.com/ueOFIIcmTZSkV4OLHCFnKEgDNIp30AvP41lcV3bvRLw/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2Lzk1LzQwLzQw/LzM2MF9GXzY5NTQw/NDA3Ml9oazFYTGFG/NG12dGdnWTY2ek9N/RzRnMFM3cmRVMFpS/by5qcGc' },
    { id: 6, name: 'Pig Picture', description: 'A cute picture of a cat', price: "70,000", image: 'https://imgs.search.brave.com/3Yw7eiejZQpE_mgQrPMZb2FSH1OfiNN3eEgKnjpeIOo/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTU2/MzY1NDQwL3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9Y3FXdzZ5d3Z0/X3ZsVlpOWmQtOGdW/NmVaZ21CR3M1N0NR/SnBwT1JTTUhnbz0' },
    { id: 7, name: 'Pig Picture', description: 'A cute picture of a cat', price: "80,000", image: 'https://imgs.search.brave.com/ziKARirV5F1EnhjDU6638VavAGgXWzUrQe62-QH42Fc/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAwLzAyLzc0Lzc0/LzM2MF9GXzI3NDc0/ODdfUU1XWGhEVm9U/bGVueFVkSWJsUWlX/QlRIWk5nTDhlLmpw/Zw' },
    { id: 8, name: 'Pig Picture', description: 'A cute picture of a cat', price: "90,000", image: 'https://imgs.search.brave.com/nnCzVw4LuYz2o3uO-2-KsgpqRQ2RU4fSuTaWUxQXas4/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzkxLzI3/LzM2MF9GXzg5OTEy/NzM4X2laNW84NUZN/QU1PSDhoTUd1ZWtn/ZjNvRWZ1VUFNbWN2/LmpwZw' },
    { id: 9, name: 'Pig Picture', description: 'A cute picture of a cat', price: "95,000", image: 'https://imgs.search.brave.com/SIfT35RBOh1_TWrqgWKBD_qM53GxSTBKtHbTyHo2qmQ/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzMwLzczLzcx/LzM2MF9GXzMwNzM3/MTE4X0g5Sk82dUZD/WjlkaExHQ0Y5Mm1o/cWQwd3hYQ0lqZzNx/LmpwZw' },
    { id: 10, name: 'Pig Picture', description: 'A cute picture of a cat', price: "75,000", image: 'https://imgs.search.brave.com/_W5HgyOcYog77trl4flkvvEHyudd9pwv4dEjCyc4wGA/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzczLzIwLzYz/LzM2MF9GXzczMjA2/MzU2XzY2aFVXd1Jj/MXZzZmlsazFtSDJI/cnFid1UweGliTVpY/LmpwZw' },
    { id: 11, name: 'Pig Picture', description: 'A cute picture of a cat', price: "80,000", image: 'https://imgs.search.brave.com/88XTazFskkh84F4WJVOquGfGZ6pp_-mGrsDM3Hgs-rk/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAyLzY1Lzg5LzU2/LzM2MF9GXzI2NTg5/NTYyNl93cnAxdjFR/eEFlSWFVUTFrTncz/a3J1MWllN0oySjBn/NS5qcGc' },
    { id: 12, name: 'Pig Picture', description: 'A cute picture of a cat', price: "95,000", image: 'https://imgs.search.brave.com/oz24HLd6GWPiEKZqcCpMQltJyuiXXiS8Tgr8nscCZO0/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvODYx/NTM1NDY4L3Bob3Rv/L3BpZy1vbi13aGl0/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9QkFReDB0SDJs/ZmVlM200WjBzaFda/NUk5aEN2VVgxVUVM/UlFyV2FZMmNGbz0' },

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
                await finduser.save();

                const userData = {
                    fullName: finduser.Fullname,
                    number: finduser.Number,
                    email: finduser.Email,
                    products: finduser.Product,
                    balance: finduser.Balance,
                    totalInvest: finduser.Totalinvest
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

