import paginatorFunctionFactory from "./lib/paginator.ts";

const { getPaginatedResult, decodeCursor } = paginatorFunctionFactory();

export { paginatorFunctionFactory, getPaginatedResult, decodeCursor };
