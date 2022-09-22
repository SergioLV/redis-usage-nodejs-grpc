const grpc = require("@grpc/grpc-js");
const PROTO_PATH = "./proto/message.proto";
var protoLoader = require("@grpc/proto-loader");
const { client } = require("./src/db_connection");
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

var packageDefinition = protoLoader.loadSync(PROTO_PATH, OPTIONS);

const websitesProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

server.addService(websitesProto.search.WebsitesSearchService.service, {
  GetWebsitesFromKeywords: (call, callback) => {
    const query = call.request.message;
    logger.info("keyword received: " + query);
    client.connect((err, client, release) => {
      if (err) {
        return console.error("Error acquiring client", err.stack);
      }
      client.query(
        `SELECT * FROM websites where $1 = ANY(keywords)`,[query],
        (err, result) => {
          release();
          if (err) {
            return console.error("Error executing query", err.stack);
          }
          logger.info(
            "connection to database successful, deliverying results to the client..."
          );
          callback(null, { website: result.rows });
        }
      );
    });
  },
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    logger.info("GRPC SERVER STARTED ON PORT 50051");
    server.start();
  }
);
