const path = require('path');

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificate');
const csvRoutes = require('./routes/csv');

const app = express();
const dbURI =
    'mongodb+srv://test-user:eyxQ9iChvlHpbkEY@cluster0.ejly7rj.mongodb.net/?retryWrites=true&w=majority';

const storage = multer.diskStorage({
    destination: './assets',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + path.extname(file.originalname));
    }
});

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');

    next();
});

app.use(
    multer({ storage: storage }).single('file')
);

app.use('/api/auth', authRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/csv', csvRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose
    .connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(succes => {
        app.listen(process.env.PORT || 3000);
        console.log('Database connected.');
    })
    .catch(err => console.log(err));
