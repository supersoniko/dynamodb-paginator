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
* @param {DynamoDBParams} params
* @param {any} lastEvaluatedKey
*
* @returns {string | undefined}
*/
const encodeCursor = (params, lastEvaluatedKey) => {
  if (!lastEvaluatedKey) { return undefined; }

  return Buffer.from(JSON.stringify(
    {
      ...params,
      ...{ ExclusiveStartKey: lastEvaluatedKey },
    },
  )).toString('base64');
};

const dynamobPaginatorFactory = () => ({
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
      cursor: result.LastEvaluatedKey && encodeCursor(params, result.LastEvaluatedKey),
      hasMoreData: result.LastEvaluatedKey !== undefined,
      count: result.Count,
    },
  }),

  /**
  * @param {string} cursor
  *
  * @returns {string | undefined}
  */
  decodeCursor: (cursor) => {
    if (!cursor || !cursor.length) { return undefined; }

    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  },
});

module.exports = dynamobPaginatorFactory;
