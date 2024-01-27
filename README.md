![npm](https://img.shields.io/npm/v/dynamodb-paginator.svg)
![NPM](https://img.shields.io/npm/l/dynamodb-paginator.svg)
![CircleCI](https://img.shields.io/circleci/build/github/supersoniko/dynamodb-paginator.svg)
[![codecov](https://codecov.io/gh/supersoniko/dynamodb-paginator/branch/master/graph/badge.svg)](https://codecov.io/gh/supersoniko/dynamodb-paginator)

**NOTE**: This pagination library only works on indexes with a sort key.

# Usage

Compatible with AWS SDK v3

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getPaginatedResult, decodeCursor } from "dynamodb-paginator";

interface UserPet {
  userId: number; // partition key (hash)
  petId: number; // sort key (range)
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const limit = 25;
const defaultInput = {
  TableName: "UserPets",
  Limit: limit,
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": 1,
  },
  ConsistentRead: true,
};

// Could be a cursor from a previous paginated result
const cursor = undefined;
const paginationInput = decodeCursor(cursor) || defaultInput;

const command = new QueryCommand(paginationInput);

const response = await docClient.send(command);

// By default the cursors are encoded in base64, but you can supply your own encoding function
const paginatedResult = getPaginatedResult<UserPet>(
  paginationInput,
  limit,
  response
);

// Output:
// {
//     data: T[],
//     meta: {
//         limit: number,
//         hasMoreData: boolean,
//         cursor: string,
//         backCursor: string,
//         count: number
//     }
// }
```

## Security disclaimer

It's important to validate that the cursor has been generated by your service before passing it to the DynamoDB. If you don't, this opens a NoSQL vulnerability.
A solution for this is signing/encrypting the cursor with a key.

Without encrypting the cursor, the partition and range key are also visible to the client consuming the cursor.

If your service offers authentication, it's also wise to validate that the cursor being parsed, was originally generated for that user/session. This is to prevent replay attacks.

### Cursor encryption example

A simplified example of encrypting and decrypting the generated pagination cursor.

It's recommended to encapsulate the secured pagination code in a service, for ease of use.

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { getPaginatedResult, decodeCursor } from "dynamodb-paginator";

const ENC_KEY = randomBytes(32); // set random encryption key
const IV = randomBytes(16); // set random initialisation vector
const ALGORITHM = "aes-256-cbc";

const encrypt = (val) => {
  const cipher = createCipheriv(ALGORITHM, ENC_KEY, IV);
  let encrypted = cipher.update(JSON.stringify(val), "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
};

const decrypt = (encrypted) => {
  const decipher = createDecipheriv(ALGORITHM, ENC_KEY, IV);
  const decrypted = decipher.update(encrypted, "base64", "utf8");

  return JSON.parse(decrypted + decipher.final("utf8"));
};

const limit = 2;
const params = { TableName: "UserPets", Limit: limit };
// Example DynamoDB Output
const result = {
  Count: 2,
  Items: [
    { userId: 1, petId: 1 },
    { userId: 1, petId: 2 },
  ],
  LastEvaluatedKey: { userId: 1, petId: 2 },
  ScannedCount: 2,
};

// Pass a custom encoding function
const paginatedResult = getPaginatedResult(params, limit, result, encrypt);

// Pass a custom decoding function
const decodedCursor = decodeCursor(paginatedResult.meta.cursor, decrypt);

console.log(decodedCursor);
// Output:
// {
//   TableName: 'UserPets',
//   Limit: 2,
//   ExclusiveStartKey: { userId: 1, petId: 2 },
//   previousKeys: [ { userId: 1, petId: 2 } ],
//   back: false
// }
```
