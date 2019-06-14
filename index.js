const paginatorFunctionFactory = require('./lib/paginator');

const { getPaginatedResult, decodeCursor } = paginatorFunctionFactory();

module.exports = {
  paginatorFunctionFactory,
  getPaginatedResult,
  decodeCursor
};
