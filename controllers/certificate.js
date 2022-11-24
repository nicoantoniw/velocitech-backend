const fs = require('fs');
const path = require('path');

const aws = require('aws-sdk');
const { parse } = require("csv-parse");
const PdfMake = require('pdfmake');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Certificate = require('../models/certificate');
const Csv = require('../models/csv');

exports.getCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findOne({ user: req.userId })
            .populate('user', { username: 1, _id: 1 });

        if (!certificate) {
            const error = new Error('No certificate found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            certificate
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.addCertificate = async (req, res, next) => {
    const s3 = new aws.S3({
        accessKeyId: 's3',
        secretAccessKey: 's3',
        Bucket: 'velocitech-csv'
    });
    const csv = await Csv.findById(req.body.csvId);
    const response = await s3.getObject(
        { Bucket: "velocitech-csv", Key: req.body.key }
    ).promise();
    fs.writeFileSync('/home/nicolas/Documents/dev/Projects/Velocitech/assets/file.csv', response.Body);
    fs.createReadStream('/home/nicolas/Documents/dev/Projects/Velocitech/assets/file.csv')
        .pipe(parse({ delimiter: ",", columns: true }))
        .on("data", (row) => {
            const hashedPassword = new Promise((resolve, reject) => {
                bcrypt.hash(row.password, 12, function (err, hash) {
                    if (err) reject(err);
                    resolve(hash);
                });
            });
            hashedPassword.then((value) => {
                const user = new User({
                    username: row.username,
                    password: value,
                    email: row.email,
                    role: 'cyclist'
                });
                user.save().then(() => {
                    const certificate = new Certificate({
                        licenseRegistrationDate: row.licenseRegistrationDate,
                        licenseExpirationDate: row.licenseExpirationDate,
                        licenseCode: row.licenseCode,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        age: row.age,
                        email: row.email,
                        user: user
                    });
                    this.createPDF(certificate, false, false);
                    certificate.save().then(() => {
                        sendCertificate(certificate);
                        notify(user, csv);
                    });
                });
            });

        })
        .on("end", () => {
            csv.processed = 'Processed';
            csv.save();
            fs.unlinkSync(`/home/nicolas/Documents/dev/Projects/Velocitech/assets/file.csv`);
            setTimeout(() => {
                fs.unlinkSync(`/home/nicolas/Documents/dev/Projects/Velocitech/assets/certificate.pdf`);
            }, 8000);
            res.status(200).json({
                message: 'File processed'
            });
        })
        .on("error", (err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            throw (err);
        });
};

exports.downloadCertificate = async (req, res, next) => {
    console.log(req.userId);
    try {
        const certificate = await Certificate.findOne({ user: req.userId })
            .populate('user', { username: 1, _id: 1 });
        if (!certificate) {
            const error = new Error('No certificate found');
            error.statusCode = 404;
            throw error;
        }
        this.createPDF(certificate, true, res);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPDF = async (certificate, download, res) => {
    if (Number.isInteger(certificate.age)) {
        certificate.age = certificate.age.toFixed(2);
    }
    const fonts = {
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        },
    };
    const printer = new PdfMake(fonts);
    let docDefinition;

    docDefinition = {
        content: [
            {
                columns: [

                    [
                        {
                            text: 'Cyclist License',
                            color: '#333333',
                            width: '*',
                            fontSize: 28,
                            bold: true,
                            alignment: 'left',
                            margin: [0, 0, 0, 5],
                        },
                    ],
                ],
                margin: [0, 0, 0, 20]
            },
            table(certificate, ['Name', 'Last Name', 'Age', 'License Code', 'Registration', 'Expiration']),
            '\n',
            '\n\n',
        ],
        styles: {
            notesTitle: {
                fontSize: 10,
                bold: true,
                margin: [0, 50, 0, 3],
            },
            notesText: {
                fontSize: 10,
            },
        },
        defaultStyle: {
            columnGap: 20,
            font: 'Helvetica',
        },

    };
    try {
        if (download) {
            let pdfDoc = printer.createPdfKitDocument(docDefinition);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(`Content-Disposition`, `inline; filename= certificate.pdf`);
            pdfDoc.pipe(res);
            pdfDoc.end();
        } else {
            let pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(fs.createWriteStream(path.join('assets', 'certificate.pdf')));
            pdfDoc.end();
        }
    } catch (error) {
        console.log(error);
    }
};

const table = (certificate, columns) => {
    return {
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: buildTableBody(certificate, columns)
        },
        layout: {
            defaultBorder: false,
            hLineWidth: function (i, node) {
                return 1;
            },
            vLineWidth: function (i, node) {
                return 1;
            },
            hLineColor: function (i, node) {
                if (i === 1 || i === 0) {
                    return '#bfdde8';
                }
                return '#eaeaea';
            },
            vLineColor: function (i, node) {
                return '#eaeaea';
            },
            hLineStyle: function (i, node) {
                // if (i === 0 || i === node.table.body.length) {
                return null;
                //}
            },
            // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
            paddingLeft: function (i, node) {
                return 10;
            },
            paddingRight: function (i, node) {
                return 10;
            },
            paddingTop: function (i, node) {
                return 2;
            },
            paddingBottom: function (i, node) {
                return 2;
            },
            fillColor: function (rowIndex, node, columnIndex) {
                return '#fff';
            },
        }
    };
};

const buildTableBody = (certificate, columns) => {
    const body = [];
    body.push([{
        text: 'Name',
        fillColor: '#eaf2f5',
        border: [false, true, false, true],
        margin: [0, 5, 0, 5],

    },
    {
        text: 'Last Name',
        border: [false, true, false, true],
        alignment: 'left',
        fillColor: '#eaf2f5',
        margin: [0, 5, 0, 5],

    },
    {
        text: 'Age',
        border: [false, true, false, true],
        alignment: 'right',
        fillColor: '#eaf2f5',
        margin: [0, 5, 0, 5],

    },
    {
        text: 'License Code',
        border: [false, true, false, true],
        alignment: 'right',
        fillColor: '#eaf2f5',
        margin: [0, 5, 0, 5],

    },
    {
        text: 'Registration',
        border: [false, true, false, true],
        alignment: 'right',
        fillColor: '#eaf2f5',
        margin: [0, 5, 0, 5],

    },
    {
        text: 'Expiration',
        border: [false, true, false, true],
        alignment: 'right',
        fillColor: '#eaf2f5',
        margin: [0, 5, 0, 5],

    },
    ]);
    const dataRow = [];

    const led = formatDate(certificate.licenseExpirationDate);
    const lrd = formatDate(certificate.licenseRegistrationDate);

    for (let o = 0; o < columns.length; o++) {
        const column = columns[o];

        if (column === 'Name') {
            dataRow.push({
                text: certificate['firstName'],
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'left',
            });
        } else if (column === 'Last Name') {
            dataRow.push({
                text: certificate['lastName'],
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'left',
            });
        } else if (column === 'Age') {
            dataRow.push({
                text: certificate['age'],
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'right',
            });
        } else if (column === 'License Code') {
            dataRow.push({
                text: certificate['licenseCode'],
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'right',
            });
        } else if (column === 'Registration') {
            dataRow.push({
                text: `${lrd}`,
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'right',
            });
        } else if (column === 'Expiration') {
            dataRow.push({
                text: `${led}`,
                border: [false, false, false, true],
                margin: [0, 10, 0, 10],
                alignment: 'right',
            });
        }
    }
    body.push(dataRow);

    return body;
};

const sendCertificate = (certificate) => {
    const filename = `CERTIFICATE-${certificate.firstName}-${certificate.lastName}.pdf`;
    const subject = 'Certificate';
    const sender = 'nicolasantoniw@gmail.com';
    const receiver = certificate.email;
    const data = fs.readFileSync(`/home/nicolas/Documents/dev/Projects/Velocitech/assets/certificate.pdf`);
    const html = `
      <div style='margin-left:8rem;margin-right:8rem'>
      <div style='background:#243447;margin-bottom:2rem;padding:.7rem'>
      <h1 style='text-align:center;color:white'>Here's your certificate</h1>
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
    ses_mail += `Content-Type: application/octet-stream; name=\"${filename}\"\n`;
    ses_mail += "Content-Transfer-Encoding: base64\n";
    ses_mail += "Content-Disposition: attachment\n\n";
    ses_mail += data.toString("base64").replace(/([^\0]{76})/g, "$1\n") + "\n\n";
    ses_mail += "--NextPart--";

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
    }).sendRawEmail(params).promise();

    sendPromise.then(
        (data) => {
            return;
        }).catch(
            (err) => {
                console.error(err, err.stack);
            });
};

const notify = (user, csv) => {
    const subject = 'File processed';
    const sender = 'nicolasantoniw@gmail.com';
    const receiver = user.email;
    const html = `
      <div style='margin-left:8rem;margin-right:8rem'>
      <div style='background:#243447;margin-bottom:2rem;padding:.7rem'>
      <h1 style='text-align:center;color:white'>The file ${csv.name} has been processed.</h1>
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

const formatDate = (date) => {
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedDate = dd + '/' + mm + '/' + yyyy;
    return formattedDate;
};