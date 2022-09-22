const express = require('express')
const { format, createLogger, transports } = require("winston");

const { combine, timestamp, label, printf } = format;
const CATEGORY = "winston custom format";

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(label({ label: CATEGORY }), timestamp(), customFormat),
  transports: [new transports.Console()],
});

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(require('./routes/routes'))

app.listen(3000)

logger.info("CLIENT RUNNING ON PORT 3000")
