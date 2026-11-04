// Valida params, query e body com schemas zod.
// Os dados já convertidos ficam em req.dados = { params, query, body }.
// (No Express 5, req.query é somente leitura, por isso não sobrescrevemos req.query.)
export function validar({ params, query, body } = {}) {
  return (req, res, next) => {
    req.dados = {
      params: params ? params.parse(req.params) : req.params,
      query: query ? query.parse(req.query) : req.query,
      body: body ? body.parse(req.body ?? {}) : req.body,
    };
    next();
  };
}
