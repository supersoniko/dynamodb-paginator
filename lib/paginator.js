/**
 * @typedef DynamoDBParams
 * @type {Object}
 * @property {string} TableName The name of the table containing the requested items
 * @property {string} [IndexName] The name of a secondary index to scan
 * @property {any} [AttributesToGet] This is a legacy parameter. Use ProjectionExpression instead.
 * @property {number} [Limit] The maximum number of items to evaluate
 * @property {any} [Select] The attributes to be returned in the result
 * @property {any} [ScanFilter] This is a legacy parameter
 * @property {any} [ConditionalOperator] This is a legacy parameter
 * @property {any} [ExclusiveStartKey] The primary key of the first item that this operation will evaluate
 * @property {any} [ReturnConsumedCapacity] Adds the consumed capacity to the result
 * @property {any} [TotalSegments] For a parallel Scan request
 * @property {any} [Segment] For a parallel Scan request
 * @property {string} [ProjectionExpression] A string that identifies one or more attributes to retrieve from the specified table or index
 * @property {string} [FilterExpression] A string that contains conditions that DynamoDB applies after the Scan operation
 * @property {any} [ExpressionAttributeNames] One or more substitution tokens for attribute names in an expression
 * @property {any} [ExpressionAttributeValues] One or more values that can be substituted in an expression
 * @property {boolean} [ConsistentRead] A Boolean value that determines the read consistency model during the scan
 * @property {boolean} [back] A boolean to keep track on back pagination cursors
 * @property {any} [backKey] Used as key to go back to the previous page
 * @property {any} [previousKeys] State of all previous back keys
 */

/**
 * @typedef DynamoDBResult
 * @type {Object}
 * @property {any} [Items] An array of item attributes that match the scan criteria
 * @property {number} [Count] The number of items in the response
 * @property {number} [ScannedCount] The number of items evaluated
 * @property {any} [LastEvaluatedKey] The primary key of the item where the operation stopped
 * @property {any} [ConsumedCapacity] The capacity units consumed by the Scan operation
 */

/**
 * @typedef MetaData
 * @type {Object}
 * @property {number} limit The limit of the amount of returned items
 * @property {boolean} hasMoreData True if not all items in the DynamoDB table were returned that match the query
 * @property {string | undefined} cursor Used for pagination if there are more items left
 * @property {string | undefined} backCursor Used for paginating back to previous results
 * @property {number} count The amount of items returned
 */

/**
 * @typedef PaginatedResult
 * @type {Object}
 * @property {T} data The queried data
 * @property {MetaData} meta Metadata regarding the result
 *
 * @template T
 */

/**
 * @typedef Cursor
 * @type {Object}
 * @property {any} ExclusiveStartKey Start key for navigating DynamoDB queries
 * @property {any[]| undefined} previousKeys Previous used ExclusiveStartKeys to navigate back to
 * @property {boolean | undefined} back To indicate wether it's a cursor used for forward or backwards navigation
 */

/**
 * @param {DynamoDBParams} params
 * @param {any} lastEvaluatedKey
 * @param {DynamoDBResult} result
 *
 * @returns {string | undefined}
 */
const encodeCursor = (params, lastEvaluatedKey, result) => {
  if (
    !result.Items
    || !result.Items.length
    || (!lastEvaluatedKey && !params.back)
  ) {
    return undefined;
  }

  const referenceKey = lastEvaluatedKey || params.ExclusiveStartKey;
  const [hashKey, sortKey] = Object.keys(referenceKey);
  const firstKey = { [hashKey]: referenceKey[hashKey], [sortKey]: result.Items[0][sortKey] };
  const lastKey = {
    [hashKey]: referenceKey[hashKey],
    [sortKey]: result.Items[result.Items.length - 1][sortKey],
  };
  const startKey = !params.back || !params.backKey ? lastEvaluatedKey : firstKey;

  return Buffer.from(
    JSON.stringify({
      ExclusiveStartKey: startKey,
      previousKeys: lastEvaluatedKey ? [...(params.previousKeys || []), lastKey] : params.previousKeys,
      back: false,
    }),
  ).toString('base64');
};

/**
 * @param {DynamoDBParams} params
 *
 * @returns {string | undefined}
 */
const encodeBackCursor = (params) => {
  const isFirstQuery = params.previousKeys === undefined;
  const isBackToFirstPageQuery = params.back && params.previousKeys.length === 0;

  if (isFirstQuery || isBackToFirstPageQuery) {
    return undefined;
  }

  if (params.previousKeys && params.previousKeys.length) {
    params.previousKeys.pop();
  }

  const backKey = params.previousKeys && params.previousKeys[params.previousKeys.length - 1];

  return Buffer.from(
    JSON.stringify({
      previousKeys: params.previousKeys,
      ExclusiveStartKey: backKey,
      back: true,
    }),
  ).toString('base64');
};

const paginatorFunctionFactory = () => ({
  /**
   * @param {DynamoDBParams} params
   * @param {number} limit
   * @param {DynamoDBResult} result
   *
   * @returns {PaginatedResult<T>}
   *
   * @template T
   */
  getPaginatedResult: (params, limit, result) => ({
    data: result.Items,
    meta: {
      limit,
      cursor: encodeCursor(params, result.LastEvaluatedKey, result),
      backCursor: encodeBackCursor(params),
      hasMoreData:
        params.back
        || (result.LastEvaluatedKey !== undefined
          && result.Items
          && result.Items.length > 0),
      count: result.Count,
    },
  }),

  /**
   * @param {string | undefined} encodedCursor
   *
   * @returns {Cursor | undefined}
   */
  decodeCursor: (encodedCursor) => {
    if (!encodedCursor || !encodedCursor.length) {
      return undefined;
    }

    return JSON.parse(Buffer.from(encodedCursor, 'base64').toString());
  },
});

module.exports = paginatorFunctionFactory;
