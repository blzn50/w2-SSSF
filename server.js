'use strict';
require('dotenv').config();
const express = require('express');
const moment = require('moment');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const jsonfile = require('jsonfile');
const file = __dirname + '/public/data1.json';
const ExifImage = require('exif').ExifImage;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const port = 35000;
const baseURL = 'http://localhost:35000';

/* image storage */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + moment().format('YYYYMMDDHHmmss') + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
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

// resizing image
const resize = (input, output, w, h) => {
    return new Promise((res, rej) => {
        sharp(input)
            .resize(w, h)
            .toFile(output, (err, info) => {
                if (err) {
                    rej(err);
                }
                if (info) {
                    res(info);
                }
            });
    });
};

/* getting coordinate from image */
const getCoordinates = (pathToImage) => {
    return new Promise((resolve, reject) => {
        new ExifImage({image: pathToImage}, (error, exifData) => {
            if (error) {
                reject('Error: ' + error.message);
            } else {
                resolve({
                    lat: gpsToDecimal(exifData.gps.GPSLatitude,
                        exifData.gps.GPSLatitudeRef),
                    lng: gpsToDecimal(exifData.gps.GPSLongitude,
                        exifData.gps.GPSLongitudeRef),
                });
            }
        });
    });
};

/* converting gps value to google maps format */
const gpsToDecimal = (gpsData, hem) => {
    let d = parseFloat(gpsData[0]) + parseFloat(gpsData[1] / 60) +
        parseFloat(gpsData[2] / 3600);
    return (hem === 'S' || hem === 'W') ? d *= -1 : d;
};

// cat schema
const catSchema = new Schema({
    title: String,
    age: Number,
    category: String,
    details: String,
    coordinates: {
        lat: String,
        lng: String,
    },
    time: String,
    original: String,
    thumbnail: String,
    image: String,
});

const Cat = mongoose.model('Cat', catSchema);

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
});

app.get('/cat', (req, res) => {
    Cat.find().then((data) => {
        res.send(data);
    }).catch((err) => console.log(err));
});

app.post('/upload', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.log('you fucked up' + err);
            res.sendStatus(400);
        } else {
            req.body['original'] = 'uploads/' + req.file.filename;
            req.body['time'] = moment().format('YYYY-MM-DD HH:mm');
            console.log('successful file upload');
            next();
        }
    });
});

// get coordinates from EXIF
app.use('/upload', (req, res, next) => {
    getCoordinates(req.file.path).then((coords) => {
        req.body.coordinates = coords;
        console.log('exif working');
        next();
    });
});

// make small thumbnail
app.use('/upload', (req, res, next) => {
    const thumbPath = '/uploads/thumbnails/' + req.file.filename;
    resize(req.file.path, 'public' + thumbPath, 320, 320).
        then((res) => {
            console.log('image to thumbnail');
            req.body.thumbnail = thumbPath;
            next();
        });
});

// make medium thumbnail
app.use('/upload', (req, res, next) => {
    const medPath = '/uploads/image/' + req.file.filename;
    resize(req.file.path, 'public' + medPath, 770, 720).
        then((res) => {
            console.log('normal sized');
            req.body.image = medPath;
            next();
        });
});

// app.use('/upload', (req, res) => {
//     /* post to data1.json */
//     jsonfile.readFile(file, (err, obj) => {
//         let data = obj;
//         data.push(req.body);
//         jsonfile.writeFile(file, data, {spaces: 4}, (err) => {
//             console.log(err);
//         });
//     });
//     res.send('posted to json');
// });

app.use('/upload', (req, res) => {
    Cat.create(req.body).then((post) => {
        res.send(post);
    });
});

app.get('/:id', (req, res) => {
    Cat.findById(req.params.id).then((err, data) => {
        if (err) res.send(err);
        else {
            res.send('cat fetched with id\n' + data)
        };
    });
});

// mongoose connection to db
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`).then(() => {
    console.log('Connected successfully');
    app.listen(port, () => console.log(`server running on port ${port}`));
}, (err) => {
    console.log('connection to db failed:' + err);
});
// app.listen(port, () => console.log(`server running on port ${port}`));

