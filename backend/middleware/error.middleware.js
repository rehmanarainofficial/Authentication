import { sendError } from "../utils/apiResponse.js";

export const errorHandler = (err, req, res, next) => {

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.code === 11000) {
    message = "Duplicate field value entered (e.g. email already exists)";
    statusCode = 400;
  }

  sendError(res, statusCode, message);
};

export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
