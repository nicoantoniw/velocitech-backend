const fs = require('fs');
const aws = require('aws-sdk');

const User = require('../models/user');
const Csv = require('../models/csv');

exports.addCSV = async (req, res, next) => {
    const userId = req.userId;
    const s3 = new aws.S3({
        accessKeyId: 's3',
        secretAccessKey: 's3',
        Bucket: 'velocitech-csv'
    });
    const ext = req.file.originalname.split('.').pop();
    const file = fs.readFileSync(`/home/nicolas/Documents/dev/Projects/Velocitech/assets/file.${ext}`);
    fs.unlinkSync(`/home/nicolas/Documents/dev/Projects/Velocitech/assets/file.${ext}`);
    const params = {
        Bucket: 'velocitech-csv',
        acl: 'public-read',
        Key: `${Date.now()}-${req.file.originalname}`,
        Body: file,
        ContentType: `text/csv`,
    };
    try {
        const user = await User.findById(userId);
        s3.upload(params, (err, data) => {
            if (err) {
                throw err;
            }
            const csv = new Csv({
                name: req.file.originalname,
                key: data.Key,
                user
            });
            csv.save().then(success => {
                res.status(200).json({
                    message: 'File uploaded'
                });
            }).catch(err => console.log(err));
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getCSVs = async (req, res, next) => {
    try {
        const totalItems = await Csv.find(
        ).countDocuments();
        const csvs = await Csv.find()
            .populate('user', { username: 1, _id: 1 })
            .sort({ createdAt: -1 });

        if (totalItems === 0) {
            const error = new Error('No csv found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            csvs
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.downloadCsv = async (req, res, next) => {
    const key = req.params.key;
    try {
        const s3 = new aws.S3({
            accessKeyId: 's3',
            secretAccessKey: 's3',
            Bucket: 'velocitech-csv'
        });
        const response = await s3.getObject(
            { Bucket: "velocitech-csv", Key: key }
        ).promise();
        res.send(response.Body);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};