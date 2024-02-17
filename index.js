require("dotenv").config();

const express = require('express');
const app = express();

app.listen(3001);

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
    // Note: 'bucket' is not a valid AWS SDK configuration property
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
          },
          key: function (req, file, cb) {
            // cb(null, Date.now().toString())
            cb(null, file.originalname)
          }
    })
});

app.post('/upload', upload.single('file'), async function (req, res, next) {
    res.send('Successfully uploaded ' + req.file.location + ' location!');
});

app.get("/list", async (req, res) => {
    try {
        let r = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();
        let x = r.Contents.map(item => item.Key);
        res.send(x);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/download/:filename", async (req, res) => {
    const filename = req.params.filename;
    try {
        let x = await s3.getObject({ Bucket: BUCKET_NAME, Key: filename }).promise();
        res.send(x.Body);
    } catch (error) {
        console.error(error);
        res.status(404).send("File Not Found");
    }
});

app.delete("/delete/:filename", async (req, res) => {
    const filename = req.params.filename;
    try {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filename }).promise();
        res.send("File Deleted Successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
