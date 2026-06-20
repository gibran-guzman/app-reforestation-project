const validateQuery = (schemaFn) => {
  return (req, res, next) => {
    try {
      req.filters = schemaFn(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateQuery;
