import express from "express";
import { config } from "dotenv";

const app = express();

config();

app.get('/', (req, res) => {
    return res.json({ hi: "hello" })
})
app.listen(process.env.PORT, () => {
    console.log(`API gateway is running at Port ${process.env.PORT}`);
})