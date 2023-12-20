import { QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import {
  CursorDecodingFunction,
  CursorEncodingFunction,
  PaginatedResult,
  QueryCommandInputEnhanced,
} from "./types.ts";

const encodeCursor = (
  params: QueryCommandInputEnhanced,
  lastEvaluatedKey: Record<string, NativeAttributeValue>,
  result: QueryCommandOutput,
  encodingFunction?: CursorEncodingFunction,
  enableBackNavigation = true
) => {
  if (
    !result.Items ||
    !result.Items.length ||
    (!lastEvaluatedKey && !params.back)
  ) {
    return undefined;
  }

  const referenceKey = lastEvaluatedKey || params.ExclusiveStartKey;
  const [hashKey, sortKey] = Object.keys(referenceKey);
  const firstKey = {
    [hashKey]: referenceKey[hashKey],
    [sortKey]: result.Items[0][sortKey],
  };
  const lastKey = {
    [hashKey]: referenceKey[hashKey],
    [sortKey]: result.Items[result.Items.length - 1][sortKey],
  };
  const startKey =
    !params.back || !params.backKey ? lastEvaluatedKey : firstKey;

  const cursor = {
    ...params,
    ExclusiveStartKey: startKey,
    previousKeys:
      enableBackNavigation && lastEvaluatedKey
        ? [...(params.previousKeys || []), lastKey]
        : params.previousKeys,
    back: false,
  };

  if (encodingFunction) {
    return encodingFunction(cursor);
  }

  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

const encodeBackCursor = (
  params: QueryCommandInputEnhanced,
  encodingFunction?: CursorEncodingFunction
) => {
  const isFirstQuery = params.previousKeys === undefined;
  const isBackToFirstPageQuery =
    params.back && params.previousKeys?.length === 0;

  if (isFirstQuery || isBackToFirstPageQuery) {
    return undefined;
  }

  if (params.previousKeys && params.previousKeys.length) {
    params.previousKeys.pop();
  }

  const backKey =
    params.previousKeys && params.previousKeys[params.previousKeys.length - 1];
  const cursor = {
    ...params,
    ExclusiveStartKey: backKey,
    back: true,
  };

  if (encodingFunction) {
    return encodingFunction(cursor);
  }

  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

const paginatorFunctionFactory = () => ({
  getPaginatedResult: <T>(
    params: QueryCommandInputEnhanced,
    limit: number,
    result: QueryCommandOutput,
    cursorEncodingFunction?: CursorEncodingFunction,
    enableBackNavigation = true
  ): PaginatedResult<T> => ({
    data: result.Items as T[],
    meta: {
      limit,
      cursor: encodeCursor(
        params,
        result.LastEvaluatedKey as Record<string, NativeAttributeValue>,
        result,
        cursorEncodingFunction,
        enableBackNavigation
      ),
      backCursor: enableBackNavigation
        ? encodeBackCursor(params, cursorEncodingFunction)
        : undefined,
      hasMoreData:
        params.back ||
        (result.LastEvaluatedKey !== undefined &&
          result.Items &&
          result.Items.length > 0),
      count: result.Count,
    },
  }),

  decodeCursor: (
    encodedCursor: string | undefined,
    decodingFunction?: CursorDecodingFunction
  ) => {
    if (!encodedCursor || !encodedCursor.length) {
      return undefined;
    }

    if (decodingFunction) {
      return decodingFunction(encodedCursor) || undefined;
    }

    return JSON.parse(Buffer.from(encodedCursor, "base64").toString());
  },
});

export default paginatorFunctionFactory;
