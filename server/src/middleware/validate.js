// Usage: router.post('/x', validate(zodSchema), handler)
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body); // throws ZodError -> errorHandler
  next();
};
