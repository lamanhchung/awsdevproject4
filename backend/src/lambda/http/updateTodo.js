import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const dynamoDBClient = new DynamoDBClient({region: 'us-east-1'});
import { getUserId } from '../utils.mjs';
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('updateTodo');

export async function handler(event, context, callback) {
  const todoId = event.pathParameters.todoId
  const updatedTodo = JSON.parse(event.body)
  
  try {
    let userId = getUserId(event);

    let params = {
      TableName: process.env.TODOS_TABLE,
      Key: {
        userId: {
          S: userId
        },
        todoId: {
          S: todoId
        }
      },
      UpdateExpression: "set #name = :name, #dueDate = :dueDate, #done = :done",
      ExpressionAttributeNames: {
          "#name": "name",
          "#dueDate": "dueDate",
          "#done": "done"
      },
      ExpressionAttributeValues: {
          ":name": {
            S: updatedTodo.name
          },
          ":dueDate": {
            S: updatedTodo.dueDate
          },
          ":done": {
            BOOL: updatedTodo.done
          }
      }
    };

    const command = new UpdateItemCommand(params)

    await dynamoDBClient.send(command);

    logger.debug('Update Todo success');
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(updatedTodo)
    });
  } catch (err) {
    logger.error('Update Todo failure');
    callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(err.message)
    });
  }
}
