import { sendError } from "../utils/apiResponse.js";
import { ZodError } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues.map((e) => e.message).join(", ");
      return sendError(res, 400, message);
    } else {
      next(err);
    }
  }
};

export default validate;
