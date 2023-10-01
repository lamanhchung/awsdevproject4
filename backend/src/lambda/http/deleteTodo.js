import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
const dynamoDBClient = new DynamoDBClient({region: 'us-east-1'});
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
const s3Client = new S3Client({region: 'us-east-1'});
import { getUserId } from '../utils.mjs';
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('deleteTodo');

export async function handler(event, context, callback) {
  const todoId = event.pathParameters.todoId

  try {
    let userId = getUserId(event);

    const dynamoParams = {
      TableName: process.env.TODOS_TABLE,
      Key: {
        userId: {
          S: userId
        },
        todoId: {
          S: todoId
        }
      }
    };
    const dynamoCommand = new DeleteItemCommand(dynamoParams);
    await dynamoDBClient.send(dynamoCommand);

    // const s3Params = {
    //   Bucket: process.env.TODOS_BUCKET,
    //   Key: ''
    // };
    // const s3Command = new DeleteObjectCommand(s3Params);
    // await s3Client.send(s3Command)

    logger.debug('Delete Todo successs');

    callback(null, 
      {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify('Todo with id ' + todoId + ' is deleted')
      });
  } catch(err) {
    logger.error('Todo delete failure');
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

