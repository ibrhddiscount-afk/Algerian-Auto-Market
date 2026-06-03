import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

function parseCorsOrigins() {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

const allowedCorsOrigins = new Set(parseCorsOrigins());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!isProduction) {
        callback(null, true);
        return;
      }

      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      callback(null, allowedCorsOrigins.has(normalizedOrigin));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
