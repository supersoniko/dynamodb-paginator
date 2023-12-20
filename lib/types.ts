import { QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export interface QueryCommandInputEnhanced extends QueryCommandInput {
  // Fix the interface declaration
  back?: boolean;
  backKey?: Record<string, NativeAttributeValue>;
  previousKeys?: Record<string, NativeAttributeValue>[];
}

export interface MetaData {
  limit: number;
  hasMoreData?: boolean;
  cursor?: string;
  backCursor?: string | undefined;
  count?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: MetaData;
}

export type CursorEncodingFunction = (
  cursor: QueryCommandInputEnhanced
) => string;
export type CursorDecodingFunction = (
  encodedCursor: string
) => QueryCommandInputEnhanced;

export interface Paginator {
  getPaginatedResult<T>(
    params: QueryCommandInputEnhanced,
    limit: number,
    result: QueryCommandOutput,
    cursorEncodingFunction?: CursorEncodingFunction,
    enableBackNavigation?: boolean
  ): PaginatedResult<T>;
  decodeCursor(cursor: string): QueryCommandInputEnhanced;
}
