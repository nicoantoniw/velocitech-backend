const jwt = require('jsonwebtoken');

exports.isAdmin = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'velocitech');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  if (decodedToken.role !== 'admin') {
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};

exports.isPCC = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'velocitech');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  if (decodedToken.role !== 'admin' && decodedToken.role !== 'pcc') {
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};

exports.isCyclist = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'velocitech');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  if (decodedToken.role !== 'admin' && decodedToken.role !== 'cyclist') {
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};