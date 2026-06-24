function respond(res, data, options = {}) {
  const { status = 200, message } = options;
  const body = { data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

function respondPaginated(res, data, meta) {
  return res.status(200).json({ data, meta });
}

module.exports = { respond, respondPaginated };
