const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const aws = require('aws-sdk');

const User = require('../models/user');

exports.login = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password incorrect');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
        role: user.role,
        userId: user._id.toString(),
      },
      'velocitech',
      { expiresIn: '10h' }
    );
    res.status(200).json({
      token: token,
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role;
  const email = req.body.email;

  try {
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      username,
      password: hashedPw,
      role,
      email
    });
    await user.save();
    res.status(200).json({ message: 'User created' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUsersReport = async (req, res, next) => {
  const email = req.params.email;
  const yesterday = moment().subtract(1, 'days').startOf('day');
  let userCounter = 0;
  try {
    const users = await User.find();
    if (!users) {
      const error = new Error('No users found');
      error.statusCode = 404;
      throw error;
    }
    users.forEach(user => {
      const dateCreated = moment(user.createdAt).startOf('day');
      if (yesterday === dateCreated) {
        userCounter++;
      }
    });
    notify(userCounter, email);
    res.status(200).json({
      message: 'Email sent'
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const notify = (userCounter, email) => {
  const subject = 'Users registered yesterday';
  const sender = 'nicolasantoniw@gmail.com';
  const receiver = email;
  const html = `
    <div style='margin-left:8rem;margin-right:8rem'>
    <div style='background:#243447;margin-bottom:2rem;padding:.7rem'>
    <h1 style='text-align:center;color:white'>Number of users registered yesterday: ${userCounter}.</h1>
    </div>
    `;
  let ses_mail = "From: <" + sender + ">\n";
  ses_mail += "To: " + receiver + "\n";
  ses_mail += "Subject: " + subject + "\n";
  ses_mail += "MIME-Version: 1.0\n";
  ses_mail += "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
  ses_mail += "--NextPart\n";
  ses_mail += "Content-Type: text/html\n\n";
  ses_mail += `${html}\n\n`;
  ses_mail += "--NextPart\n";

  const params = {
    RawMessage: { Data: ses_mail },
    Destinations: [receiver],
    Source: "'AWS SES Attchament Configuration' <" + sender + ">'"
  };

  const sendPromise = new aws.SES({
    apiVersion: '2010-12-01',
    accessKeyId: 'ses',
    secretAccessKey: 'ses',
    region: 'eu-west-3'
  }).sendRawEmail(params).promise().catch(err => console.log(err));
};