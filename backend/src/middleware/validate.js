import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));

      return next(new AppError("Validation failed", 400, details));
    }

    req.validated = parsed.data;
    return next();
  };
}
