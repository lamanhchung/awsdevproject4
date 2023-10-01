import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
const dynamoDBClient = new DynamoDBClient({region: 'us-east-1'});
import { getUserId } from '../utils.mjs';
import * as uuid from 'uuid';
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('createTodo');

export async function handler(event, context, callback) {
  const newTodo = JSON.parse(event.body);

  try {
    let userId = getUserId(event);

    let todoId = uuid.v4();
    let createdAt = new Date().toISOString().slice(0,19);

    let params = {
      TableName: process.env.TODOS_TABLE,
      Item: {
        userId: {
          S: userId
        },
        todoId: {
          S: todoId
        },
        name: {
          S: newTodo.name
        },
        dueDate: {
          S: newTodo.dueDate
        },
        done: {
          BOOL: false
        },
        createdAt: {
          S: createdAt
        }
      }
    };
    const command = new PutItemCommand(params)
    await dynamoDBClient.send(command);

    newTodo.userId = userId;
    newTodo.todoId = todoId;
    newTodo.createdAt = createdAt;
    newTodo.done = false

    logger.debug('Create Todo success');

    callback(null, {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(newTodo)
    });
  } catch (err) {
    logger.error('Create Todo failure');
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

