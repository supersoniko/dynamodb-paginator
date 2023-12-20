import paginatorFunctionFactory from "./lib/paginator";

const { getPaginatedResult, decodeCursor } = paginatorFunctionFactory();

export { paginatorFunctionFactory, getPaginatedResult, decodeCursor };
