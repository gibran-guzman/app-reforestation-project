const validate = (schemaFn) => {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
