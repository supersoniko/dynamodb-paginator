import paginatorFunctionFactory from "../lib/paginator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NativeAttributeValue = any;

const encode = (cursor: Record<string, NativeAttributeValue>) =>
  Buffer.from(JSON.stringify(cursor)).toString("hex");

const decode = (encodedCursor: string) =>
  JSON.parse(Buffer.from(encodedCursor, "hex").toString());

describe("DynamoDB Paginator", () => {
  const { decodeCursor, getPaginatedResult } = paginatorFunctionFactory();

  describe("getPaginatedResult", () => {
    it("should return an empty paginated result", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [],
        Count: 0,
        $metadata: {},
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);

      expect(paginatedResult).toEqual({
        data: [],
        meta: {
          limit,
          cursor: undefined,
          hasMoreData: false,
          count: 0,
        },
      });
    });
    it("should handle empty Items and an unempty LastEvaluatedKey", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [],
        Count: 0,
        LastEvaluatedKey: { id: 2 },
        $metadata: {},
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);

      expect(paginatedResult).toEqual({
        data: [],
        meta: {
          limit,
          cursor: undefined,
          hasMoreData: false,
          count: 0,
        },
      });
    });

    it("should return a paginated list with a single result", () => {
      const params = { TableName: "Users" };
      const result = { Items: [{ name: "aap" }], Count: 1, $metadata: {} };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);

      expect(paginatedResult).toEqual({
        data: [{ name: "aap" }],
        meta: {
          limit,
          cursor: undefined,
          hasMoreData: false,
          count: 1,
        },
      });
    });

    it("should return a paginated list which has more pages left", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        Count: 2,
        LastEvaluatedKey: { id: 2 },
        $metadata: {},
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);

      expect(paginatedResult).toEqual({
        data: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        meta: {
          limit,
          // eslint-disable-next-line max-len
          cursor:
            "eyJUYWJsZU5hbWUiOiJVc2VycyIsIkV4Y2x1c2l2ZVN0YXJ0S2V5Ijp7ImlkIjoyfSwicHJldmlvdXNLZXlzIjpbeyJpZCI6Mn1dLCJiYWNrIjpmYWxzZX0=",
          hasMoreData: true,
          count: 2,
        },
      });
    });

      it("should return a paginated list which has more pages left when using a GSI to search", () => {
          const params = { TableName: "Users", IndexName: "GSI1" };
          const result = {
              Items: [
                  { PK: 1, SK: "2024-01-02", GSI1PK: "a@aap.be", GSI1SK: "2024-01-02" },
                  { PK: 2, SK: "2024-02-02", GSI1PK: "b@aap.be", GSI1SK: "2024-01-02" },
              ],
              Count: 2,
              LastEvaluatedKey: { PK: 2, SK: "2024-02-02", GSI1PK: "b@aap.be", GSI1SK: "2024-01-02" },
              $metadata: {},
          };
          const limit = 25;

          const paginatedResult = getPaginatedResult(params, limit, result);

          expect(paginatedResult).toEqual({
              data: [
                  { PK: 1, SK: "2024-01-02", GSI1PK: "a@aap.be", GSI1SK: "2024-01-02" },
                  { PK: 2, SK: "2024-02-02", GSI1PK: "b@aap.be", GSI1SK: "2024-01-02" },
              ],
              meta: {
                  backCursor: undefined,
                  limit,
                  // eslint-disable-next-line max-len
                  cursor:
                      "eyJUYWJsZU5hbWUiOiJVc2VycyIsIkluZGV4TmFtZSI6IkdTSTEiLCJFeGNsdXNpdmVTdGFydEtleSI6eyJQSyI6MiwiU0siOiIyMDI0LTAyLTAyIiwiR1NJMVBLIjoiYkBhYXAuYmUiLCJHU0kxU0siOiIyMDI0LTAxLTAyIn0sInByZXZpb3VzS2V5cyI6W3siUEsiOjIsIlNLIjoiMjAyNC0wMi0wMiIsIkdTSTFQSyI6ImJAYWFwLmJlIiwiR1NJMVNLIjoiMjAyNC0wMS0wMiJ9XSwiYmFjayI6ZmFsc2V9",
                  hasMoreData: true,
                  count: 2,
              },
          });
      });

    it("should return a paginated list which has more pages left with a custom encoding function", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        Count: 2,
        LastEvaluatedKey: { id: 2 },
        $metadata: {},
      };
      const limit = 25;

      const encode2 = (cursor: Record<string, NativeAttributeValue>) =>
        Buffer.from(JSON.stringify(cursor)).toString("hex").slice(0, 12);

      const paginatedResult = getPaginatedResult(
        params,
        limit,
        result,
        encode2
      );

      expect(paginatedResult).toEqual({
        data: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        meta: {
          limit,
          cursor: "7b225461626c",
          hasMoreData: true,
          count: 2,
        },
      });
    });
  });

  describe("decodeCursor", () => {
    it("should decode a cursor successfully", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        Count: 2,
        LastEvaluatedKey: { id: 2 },
        $metadata: {},
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        ExclusiveStartKey: { id: 2 },
        back: false,
        previousKeys: [{ id: 2 }],
      });
    });

    it("should decode a cursor successfully with back navigation disabled and have no previouskeys", () => {
      const params = { TableName: "Users" };
      const result = {
        Items: [
          { id: 1, email: "a@aap.be" },
          { id: 2, email: "b@aap.be" },
        ],
        Count: 2,
        LastEvaluatedKey: { id: 2 },
        $metadata: {},
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(
        params,
        limit,
        result,
        encode,
        false
      );
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor, decode);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        ExclusiveStartKey: { id: 2 },
        back: false,
      });
    });

    it("should decode a cursor successfully on a back navigation", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "2" },
        previousKeys: [{ id: "1", date: "2" }],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "3" },
          { id: "1", date: "4" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "4" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "4" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
        ],
        back: false,
      });

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        previousKeys: [],
        back: true,
      });
    });

    it("should decode a cursor successfully for the last result page without results", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "8" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
          { id: "1", date: "8" },
        ],
        back: false,
      };
      const result = { Items: [], Count: 0, ScannedCount: 0, $metadata: {} };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual(undefined);

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: true,
      });
    });

    it("should decode a cursor successfully for the last result page with results", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: false,
      };
      const result = {
        Items: [{ id: "1", date: "7" }],
        Count: 1,
        ScannedCount: 1,
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual(undefined);

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "4" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
        ],
        back: true,
      });
    });

    it("should decode a cursor successfully when going back from last result page with results", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "2" },
        previousKeys: [{ id: "1", date: "2" }],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "3" },
          { id: "1", date: "4" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "4" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "4" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
        ],
        back: false,
      });

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        previousKeys: [],
        back: true,
      });
    });

    it("should decode a cursor successfully when going back from last result page without results", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "7" },
          { id: "1", date: "8" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "8" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "8" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
          { id: "1", date: "8" },
        ],
        back: false,
      });

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "4" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
        ],
        back: true,
      });
    });

    it("should decode a cursor successfully when going back to first result", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        previousKeys: [],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", meep: "fsdfdsfasd", date: "1" },
          { id: "1", meep: "aap", date: "2" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "2" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedBackCursor = decodeCursor(paginatedResult.meta.backCursor);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        previousKeys: [{ id: "1", date: "2" }],
        back: false,
        ExclusiveStartKey: { id: "1", date: "2" },
      });

      expect(decodedBackCursor).toEqual(undefined);
    });

    it("should return undefined when decodeCusor is called without a LastEvaluatedKey", () => {
      const params = { TableName: "Users" };
      const result = { Items: [{ name: "aap" }], Count: 1, $metadata: {} };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor);

      expect(decodedCursor).toEqual(undefined);
    });
    it("should decode a cursor successfully when going back from last result page with results and a custom encoding function", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "2" },
        previousKeys: [{ id: "1", date: "2" }],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "3" },
          { id: "1", date: "4" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "4" },
        $metadata: {},
      };

      const limit = 2;

      const paginatedResult = getPaginatedResult(params, limit, result, encode);
      const decodedBackCursor = decodeCursor(
        paginatedResult.meta.backCursor,
        decode
      );
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor, decode);

      expect(decodedCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "4" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
        ],
        back: false,
      });

      expect(decodedBackCursor).toEqual({
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        previousKeys: [],
        back: true,
      });
    });

    it("should have a backCursor on the meta object when backNavigation is given as true", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "7" },
          { id: "1", date: "8" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "8" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(
        params,
        limit,
        result,
        encode,
        true
      );

      expect(paginatedResult.meta.backCursor).toBeDefined();
    });

    it("should have a backCursor on the meta object when backNavigation is not given", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "7" },
          { id: "1", date: "8" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "8" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(
        params,
        limit,
        result,
        encode,
        true
      );

      expect(paginatedResult.meta.backCursor).toBeDefined();
    });

    it("should not have a backCursor on the meta object when backNavigation is given as false", () => {
      const params = {
        TableName: "Users",
        Limit: 2,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": "1" },
        ExclusiveStartKey: { id: "1", date: "6" },
        previousKeys: [
          { id: "1", date: "2" },
          { id: "1", date: "4" },
          { id: "1", date: "6" },
        ],
        back: true,
      };
      const result = {
        Items: [
          { id: "1", date: "7" },
          { id: "1", date: "8" },
        ],
        Count: 2,
        ScannedCount: 2,
        LastEvaluatedKey: { id: "1", date: "8" },
        $metadata: {},
      };
      const limit = 2;

      const paginatedResult = getPaginatedResult(
        params,
        limit,
        result,
        encode,
        false
      );

      expect(paginatedResult.meta.backCursor).toBeUndefined();
    });
  });
});
