const dynamobPaginatorFactory = require('../lib/paginator');

describe('DynamoDB Paginator', () => {
  const { decodeCursor, getPaginatedResult } = dynamobPaginatorFactory();

  describe('getPaginatedResult', () => {
    it('should return an empty paginated result', () => {
      const params = { TableName: 'Users' };
      const result = { Items: [], Count: 0 };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);

      expect(paginatedResult).toEqual(
        {
          data: [],
          meta: {
            limit,
            cursor: undefined,
            hasMoreData: false,
            count: 0,
          },
        },
      );
    });
  });

  it('should return a paginated list with a single result', () => {
    const params = { TableName: 'Users' };
    const result = { Items: [{ name: 'aap' }], Count: 1 };
    const limit = 25;

    const paginatedResult = getPaginatedResult(params, limit, result);

    expect(paginatedResult).toEqual({
      data: [{ name: 'aap' }],
      meta: {
        limit,
        cursor: undefined,
        hasMoreData: false,
        count: 1,
      },
    });
  });

  it('should return a paginated list which has more pages left', () => {
    const params = { TableName: 'Users' };
    const result = {
      Items:
        [
          { id: 1, email: 'a@aap.be' },
          { id: 2, email: 'b@aap.be' },
        ],
      Count: 2,
      LastEvaluatedKey: { id: 2 },
    };
    const limit = 25;

    const paginatedResult = getPaginatedResult(params, limit, result);

    expect(paginatedResult).toEqual({
      data: [
        { id: 1, email: 'a@aap.be' },
        { id: 2, email: 'b@aap.be' },
      ],
      meta: {
        limit,
        cursor: 'eyJUYWJsZU5hbWUiOiJVc2VycyIsIkV4Y2x1c2l2ZVN0YXJ0S2V5Ijp7ImlkIjoyfX0=',
        hasMoreData: true,
        count: 2,
      },
    });
  });

  describe('decodeCursor', () => {
    it('should decode a cursor successfully', () => {
      const params = { TableName: 'Users' };
      const result = {
        Items:
          [
            { id: 1, email: 'a@aap.be' },
            { id: 2, email: 'b@aap.be' },
          ],
        Count: 2,
        LastEvaluatedKey: { id: 2 },
      };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor || '');

      expect(decodedCursor).toEqual({
        TableName: 'Users',
        ExclusiveStartKey: { id: 2 },
      });
    });

    it('should return undefined when decodeCusor is called without a LastEvaluatedKey', () => {
      const params = { TableName: 'Users' };
      const result = { Items: [{ name: 'aap' }], Count: 1 };
      const limit = 25;

      const paginatedResult = getPaginatedResult(params, limit, result);
      const decodedCursor = decodeCursor(paginatedResult.meta.cursor || '');

      expect(decodedCursor).toEqual(undefined);
    });
  });
});
