const grpc = require("@grpc/grpc-js");
const PROTO_PATH = "./src/proto/message.proto";
var redis = require("redis");
var protoLoader = require("@grpc/proto-loader");
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

const OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const redis_client = redis.createClient(6379, "localhost");
// const redis_client_2 = redis.createClient(6380, 'localhost');
// const redis_client_3 = redis.createClient(6381, 'localhost');

redis_client.on("ready", () => {});
// redis_client_2.on('ready',()=>{})
// redis_client_3.on('ready',()=>{})

redis_client.connect();
// redis_client_2.connect();
// redis_client_3.connect();

var packageDefinition = protoLoader.loadSync(PROTO_PATH, OPTIONS);

const WebsitesSearch =
  grpc.loadPackageDefinition(packageDefinition).search.WebsitesSearchService;
const client = new WebsitesSearch(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

const searchWebsites = (req, res) => {
  const query = req.query.keyword;
  console.time("query");
  (async () => {
    let response = await redis_client.get(query);
    if (response) {
      logger.info("the response was on cache");
      console.timeEnd("query");
      parsed_response = JSON.parse(response);
      res.status(200).json(parsed_response);
    } else {
      logger.info(
        "the res ponse wasn't on cache, querying to the grpc server instead..."
      );
      client.GetWebsitesFromKeywords({ message: query }, (error, items) => {
        if (error) {
          res.status(400).json(error);
        } else {
          logger.info("data obtained from database and stored on cache!");
          console.timeEnd("query");
          parsed_response = JSON.stringify(items);
          redis_client.set(query, parsed_response);
          res.status(200).json(items);
        }
      });
    }
  })();
};

module.exports = {
  searchWebsites,
};
