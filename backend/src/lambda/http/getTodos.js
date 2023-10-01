import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { getUserId } from '../utils.mjs';
const dynamoDBClient = new DynamoDBClient({region: 'us-east-1'});
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('getTodo');

export async function handler(event, context, callback) {
  try {
    let userId = getUserId(event);

    const params = {
      TableName: process.env.TODOS_TABLE,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':userId': {
          S: userId
        }
      }
    };

    let scanResults = [];
    let items;

    do {
        const command = new QueryCommand(params);
        items = await dynamoDBClient.send(command);
        items.Items.forEach((item) => {
          scanResults.push({
            todoId: item.todoId.S,
            userId: item.userId.S,
            name: item.name.S,
            dueDate: item.dueDate.S,
            createdAt: item.createdAt.S,
            done: item.done.BOOL,
            attachmentUrl: item.attachmentUrl ? item.attachmentUrl.S: undefined
          })
        });
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    logger.debug('Get Todos success');
    callback(null, 
      {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(scanResults)
      });
  } catch(err) {
    logger.error('Get Todos failure');
    callback(null,
      {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(err.message)
      });
  }
}
