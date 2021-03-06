![npm](https://img.shields.io/npm/v/dynamodb-paginator.svg)
![NPM](https://img.shields.io/npm/l/dynamodb-paginator.svg)
![David](https://img.shields.io/david/supersoniko/dynamodb-paginator.svg)
![CircleCI](https://img.shields.io/circleci/build/github/supersoniko/dynamodb-paginator.svg)
[![codecov](https://codecov.io/gh/supersoniko/dynamodb-paginator/branch/master/graph/badge.svg)](https://codecov.io/gh/supersoniko/dynamodb-paginator)

Implementation of pagination for DynamoDB from the following article: https://hackernoon.com/guys-were-doing-pagination-wrong-f6c18a91b232

**NOTE**: This pagination library only works on indexes with a range key.

# Usage

```javascript
import { getPaginatedResult, decodeCursor } from 'dynamodb-paginator';

const limit = 25;
const params =
  decodeCursor(cursor)
  || {
    TableName: 'Users',
    Limit: limit,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
        ':id': '1'
    },
  };

const result = await dynoDB.query(params).promise();

return getPaginatedResult<IUser>(params, limit, result);
```

# API Reference

## Functions

<dl>
<dt><a href="#getPaginatedResult">getPaginatedResult(params, limit, result)</a> ⇒ <code>PaginatedResult&lt;T&gt;</code></dt>
<dd></dd>
<dt><a href="#decodeCursor">decodeCursor(cursor)</a> ⇒ <code>DynamoDBParams</code> | <code>undefined</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DynamoDBParams">DynamoDBParams</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#DynamoDBResult">DynamoDBResult</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#MetaData">MetaData</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#PaginatedResult">PaginatedResult</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="getPaginatedResult"></a>

## getPaginatedResult(params, limit, result) ⇒ <code>PaginatedResult&lt;T&gt;</code>
**Kind**: function

| Param | Type |
| --- | --- |
| params | [<code>DynamoDBParams</code>](#DynamoDBParams) |
| limit | <code>number</code> |
| result | [<code>DynamoDBResult</code>](#DynamoDBResult) |

<a name="decodeCursor"></a>

## decodeCursor(cursor) ⇒ <code>DynamoDBParams</code> \| <code>undefined</code>
**Kind**: function

| Param | Type |
| --- | --- |
| cursor | <code>string</code> |

<a name="DynamoDBParams"></a>

## DynamoDBParams : <code>Object</code>
**Kind**: object
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| TableName | <code>string</code> | The name of the table containing the requested items |
| [IndexName] | <code>string</code> | The name of a secondary index to scan |
| [AttributesToGet] | <code>any</code> | This is a legacy parameter. Use ProjectionExpression instead. |
| [Limit] | <code>number</code> | The maximum number of items to evaluate |
| [Select] | <code>any</code> | The attributes to be returned in the result |
| [ScanFilter] | <code>any</code> | This is a legacy parameter |
| [ConditionalOperator] | <code>any</code> | This is a legacy parameter |
| [ExclusiveStartKey] | <code>any</code> | The primary key of the first item that this operation will evaluate |
| [ReturnConsumedCapacity] | <code>any</code> | Adds the consumed capacity to the result |
| [TotalSegments] | <code>any</code> | For a parallel Scan request |
| [Segment] | <code>any</code> | For a parallel Scan request |
| [ProjectionExpression] | <code>string</code> | A string that identifies one or more attributes to retrieve from the specified table or index |
| [FilterExpression] | <code>string</code> | A string that contains conditions that DynamoDB applies after the Scan operation |
| [ExpressionAttributeNames] | <code>any</code> | One or more substitution tokens for attribute names in an expression |
| [ExpressionAttributeValues] | <code>any</code> | One or more values that can be substituted in an expression |
| [ConsistentRead] | <code>boolean</code> | A Boolean value that determines the read consistency model during the scan |

<a name="DynamoDBResult"></a>

## DynamoDBResult : <code>Object</code>
**Kind**: object
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [Items] | <code>any</code> | An array of item attributes that match the scan criteria |
| [Count] | <code>number</code> | The number of items in the response |
| [ScannedCount] | <code>number</code> | The number of items evaluated |
| [LastEvaluatedKey] | <code>any</code> | The primary key of the item where the operation stopped |
| [ConsumedCapacity] | <code>any</code> | The capacity units consumed by the Scan operation |

<a name="MetaData"></a>

## MetaData : <code>Object</code>
**Kind**: object
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| limit | <code>number</code> | The limit of the amount of returned items |
| hasMoreData | <code>boolean</code> | True if not all items in the DynamoDB table were returned that match the query |
| cursor | <code>string</code> | Used for pagination if there are more items left |
| backCursor | <code>string</code> | Used for paginating back to previous results |
| count | <code>number</code> | The amount of items returned |

<a name="PaginatedResult"></a>

## PaginatedResult : <code>Object</code>
**Kind**: object
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| data | <code>T</code> | The queried data |
| meta | [<code>MetaData</code>](#MetaData) | Metadata regarding the result |
