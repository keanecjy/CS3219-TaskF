const cors = require('cors');
const express = require("express");
const axios = require("axios");
const redis = require("redis");

const redisClient = redis.createClient();
const app = express();
app.use(cors());


app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;
    const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
        const {data} = await axios.get("https://jsonplaceholder.typicode.com/photos", {
            params: {albumId}
        });
        return data;
    });

    res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
    const id = req.params.id;
    const photo = await getOrSetCache(`photos:${id}`, async () => {
        const {data} = await axios.get(`https://jsonplaceholder.typicode.com/photos/${id}`);
        return data;
    });

    res.json(photo);
});

function getOrSetCache(key, cb) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, async (error, data) => {
            if (error) {
                return reject(error);
            }
            if (data != null) {
                console.log(`${key} Cache hit!`);
                return resolve(JSON.parse(data));
            }
            console.log(`${key} Cache miss!`);
            // Not able to find the data
            const freshData = await cb();
            redisClient.setex(key, 600, JSON.stringify(freshData));
            return resolve(freshData);
        })
    })
}

app.listen(3000);
