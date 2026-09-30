const bcryptjs = require("bcryptjs");
const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  secret_key: process.env.CLOUD_SECRET,
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "youremail@gmail.com",
    pass: "process.env.APP_PASS",
  },
});

const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, tag, photo } = req.body;
  try {
    const saltround = await bcryptjs.genSalt(10);

    const hashpass = await bcryptjs.hash(password, saltround);

    const number = `${Math.ceil(Math.random() * 1000000)}`.padStart(7, "8");

    const generatedAccount = `MRK${number}`;

    // const userAccount = await AccountModel.create({
    //   accountNumber: `MRK${number}`,
    // });
    const image = await cloudinary.uploader.upload(photo, {
      resource_type: "image",
    });
    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      tag,
      password: hashpass,
      accountNumber: generatedAccount,
      profilePicture: {
        secure_url: image.secure_url,
        public_id: image.public_id,
      },
    });

    const token = await jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m", algorithm: "HS256" },
    );

    // let mailOptions = {
    //   from: "process.env.APP_EMAIL",
    //   to: ["oderinuoluwaferanmi@gmail.com", "tonyharrydax@gmail.com"];
    //   subject: `Welcome to Augbank ${firstname}`,
    //   text: `Welcome to August bank where transaction is made easy, your account number is ${user.accountNumber}`,
    // };

    let mailOptions = {
      from: "process.env.APP_EMAIL",
      bcc: ["oderinuoluwaferanmi@gmail.com", "tonyharrydax@gmail.com"],
      subject: `Welcome to Augbank ${firstname}`,
      text: `Welcome to August bank where transaction is made easy, your account number is ${user.accountNumber}`,
    };

    res.status(201).send({
      message: "User created successfully",
      data: {
        firstname,
        lastname,
        email,
        tag: tag ? tag : null,
        accountNumber: generatedAccount,
        token,
        balance: user.balance,
        photo: user.profilePicture.secure_url,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code == 11000) {
      res.status(400).send({
        message: "Email or tag already exixt",
      });
    } else {
      console.error(error);
      res.status(400).send({
        message: "user cannot be created at this time",
      });
    }
  }
};

const registerOperator = async (req, res) => {
  const { firstname, lastname, email, password, tag } = req.body;
  try {
    const saltround = await bcryptjs.genSalt(10);

    const hashpass = await bcryptjs.hash(password, saltround);

    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      tag,
      password: hashpass,
      role: "operator",
    });

    const token = await jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m", algorithm: "HS256" },
    );

    res.status(201).send({
      message: "Operator created successfully",
      data: {
        firstname,
        lastname,
        email,
        tag: tag ? tag : null,
        token,
      },
    });
  } catch (error) {
    if (error.code == 11000) {
      res.status(400).send({
        message: "Email or tag already exixt",
      });
    } else {
      console.error(error);
      res.status(400).send({
        message: "Operator cannot be created at this time",
      });
    }
  }
};

const getUser = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(400).send({
        message: "User not found",
      });

      return;
    }

    res.status(200).send({
      message: "user fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).send({
      message: "user cannot be fetched at this time",
    });
  }
};

const getUserByOperator = async (req, res) => {
  const { id, role } = req.user;
  const { userId } = req.params;
  try {
    if (role != "admin" && role != "operator") {
      res.status(403).send({
        message: "Forbidden resources",
      });

      return;
    }
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(400).send({
        message: "User not found",
      });

      return;
    }

    res.status(200).send({
      message: "user fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).send({
      message: "user cannot be fetched at this time",
    });
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1]
      ? req.headers["authorization"].split(" ")[1]
      : req.headers["authorization"].split(" ")[0];

    const user = await jwt.verify(
      token,
      process.env.JWT_SECRET,
      function (err, decoded) {
        if (err) {
          res.status(401).send({
            message: "User unauthorized!",
          });
          return;
        }

        req.user = decoded;
        console.log(decoded);

        next();
      },
    );
  } catch (error) {
    console.log(error);

    res.status(401).send({
      message: "User unauthorized!",
    });
    return;
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isUser = await UserModel.findOne({ email }).select("+password");

    if (!isUser) {
      res.status(400).send({
        message: "account does not exist",
      });

      return;
    }

    const isMatch = await bcrypt.compare(password, isUser.password);

    if (!isMatch) {
      res.status(400).send({
        message: "invalid credentials",
      });

      return;
    }
    const token = jwt.sign(
      { id: isUser._id, role: isUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" },
    );
    res.status(200).send({
      message: "login successful",
      data: {
        firstname: isUser.firstname,
        lastname: isUser.lastname,
        email: isUser.email,
        token,
        tag: tag ? tag : null,
        balance: isUser.balance,
      },
    });
  } catch (error) {
    res.status(400).send({
      message: "invalid credentials",
    });
  }
};

const loginOperator = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isOperator = await UserModel.findOne({ email }).select("+password");

    if (!isOperator) {
      res.status(400).send({
        message: "account does not exist",
      });

      return;
    }

    const isMatch = await bcrypt.compare(password, isUser.password);

    if (!isMatch) {
      res.status(400).send({
        message: "invalid credentials",
      });

      return;
    }
    const token = jwt.sign(
      { id: isOperator._id, role: isOperator.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h", algorithm: "HS256" },
    );
    res.status(200).send({
      message: "login successful",
      data: {
        firstname: isUser.firstname,
        lastname: isUser.lastname,
        email: isUser.email,
        token,
      },
    });
  } catch (error) {
    res.status(400).send({
      message: "invalid credentials",
    });
  }
};

const resolveAccount = async (req, res) => {
  try {
    const user = await UserModel.findOne({ accountNumber });

    if (!user) {
      return res.status(400).send({
        message: "cannot resolve account number ",
      });
    }

    res.status(200).send({
      message: "account retrieved",
      data: {
        accountname: user.firstname + " " + user.lastname,
        tag: user.tag ? user.tag : null,
        id: user._id,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      message: "cannot resolve account number",
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const { firstname, lastname } = req.body;

  try {
    if (role !== "operator" && role !== "admin") {
      return res.status(403).send({
        message: "Forbidden Resources",
      });
    }

    const allowedUpdate = {
      ...(firstname && { firstname: firstname.trim() }),
      ...(lastname && { lastname: lastname.trim() }),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      { id },
      allowedUpdate,
      { returnDocument: "after", runValidators },
    );

    if (!UpdatedUser) {
      return res.status(400).send({
        message: "User not found",
      });
    }

    res.status(200).send({
      message: "User updated successfully",
      data: {
        updatedUser,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send({
        message: "Email or tag already exists",
      });
      return;
    }

    console.error(error);

    res.status(400).send({
      message: "User cannot be updated at this time",
    });
  }
};

module.exports = {
  registerUser,
  registerOperator,
  getUser,
  verifyUser,
  loginUser,
  loginOperator,
  getUserByOperator,
  updateUser,
  resolveAccount,
};