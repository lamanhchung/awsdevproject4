import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const dynamoDBClient = new DynamoDBClient({region: 'us-east-1'});
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserId } from '../utils.mjs';
const s3Client = new S3Client();
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('generateUploadUrl');

export async function handler(event, context, callback) {
  const todoId = event.pathParameters.todoId;

  try {
    let userId = getUserId(event);

    const s3Param = {
      Bucket: process.env.TODOS_BUCKET,
      Key: todoId
    }
    const s3Command = new PutObjectCommand(s3Param)
    let attachmentUrl = await getSignedUrl(s3Client, s3Command,
      {
        expiresIn: 3600, 
        signableHeaders: 
          new Set(['Cache-Control', 'Content-Type', 'x-amz-acl'])
      });

    let dynamoParams = {
      TableName: process.env.TODOS_TABLE,
      Key: {
        userId: {
          S: userId
        },
        todoId: {
          S: todoId
        }
      },
      UpdateExpression: "set #attachmentUrl = :attachmentUrl",
      ExpressionAttributeNames: {
          "#attachmentUrl": "attachmentUrl"
      },
      ExpressionAttributeValues: {
          ":attachmentUrl": {
            S: `https://${process.env.TODOS_BUCKET}.s3.amazonaws.com/${todoId}`
          }
      }
    };

    const dynamoCommand = new UpdateItemCommand(dynamoParams)
    await dynamoDBClient.send(dynamoCommand);

    logger.debug('Generate upload url success');
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({uploadUrl: attachmentUrl})
    });
  } catch (err) {
    logger.error('Generate upload url failure');
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

