'use strict';
const express = require('express');
const moment = require('moment');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const jsonfile = require('jsonfile');
const file = __dirname + '/public/data1.json';

const baseURL = 'http://localhost:35000';

/* storage */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
}).single('image');

// checking file type
const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Please upload image file only');
    }
};

// app init
const app = express();

app.use(express.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// routes
app.get('/data', (req, res) => {
    jsonfile.readFile(file, (err, obj) => {
        console.log(obj);
        res.json(obj);
    });
    // res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log('you fucked up');
            res.sendStatus(400);
        } else {
            console.log(req.file);
            // console.log(req.body);
            let temp = req.body;
            temp['original'] = baseURL + '/public/uploads/' + req.file.filename;
            temp['time'] = moment().format('YYYY-MM-DD HH:mm');
            console.log(temp);
            // jsonfile.readFile(file, (err, obj) => {
            //     let data = obj;
            //     data.push(temp);
            //     jsonfile.writeFile(file, data, {spaces: 4}, (err) => {
            //         console.log(err);
            //     });
            // });
            console.log('successful file upload');
            res.send('uploaded');
            // res.redirect('/data');
        }

        sharp(req.file.filename)
        .resize(320, 300)
        .toFile('./public/uploads/thumbnails/' + req.file.filename, (err) => console.log(err));
    });
});
const port = 35000;
app.listen(port, () => console.log(`server running on port ${port}`));
