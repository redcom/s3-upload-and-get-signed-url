import AWS from 'aws-sdk'
import fs from 'fs'
import fetch from 'node-fetch'

const createS3Client = () => {
  const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION,
    maxRetries: 5,
    sslEnabled: true,
    correctClockSkew: true,
    logger: console.log,
    apiVersion: 'latest'
  }

  if (process.env.AWS_S3_SIGNATURE_VERSION) {
    s3Config.signatureVersion = process.env.AWS_S3_SIGNATURE_VERSION
  }

  return new AWS.S3(s3Config)
}


const client = createS3Client()


const dataFile = fs.readFileSync('./e2e-1.jpg',
  {flag:'r'});

const paramsFile = {
  Bucket: process.env.AWS_S3_BUCKET,
  Key: `s3-e2e-${1* new Date()}`,
  Body: Buffer.from(dataFile, 'binary'),
}

// Create the an S3 secure url to upload files in S3. Limit the TTL of url to 10 seconds
const createSignedUploadUrl = async () => {
  try {

    const data = await client.getSignedUrl('putObject', {
      Bucket: paramsFile.Bucket,
      Key: paramsFile.Key,
      Expires: 10
    });

    console.log(`URL to upload to.\n (Valid for 10 Seconds:)\n` , data)

    return data
  } catch(e) {
    console.log('Error generating upload url', e)
  }
}

// grap a file content and upload it to the signed url
const runUploadFile = async (signedUploadUrl) => {
  if (!signedUploadUrl) {
    console.log("\nPlease provide a signed url to upload")
  }
  try {
  const response = await fetch(signedUploadUrl, {
    method: 'PUT',
    body: paramsFile.Body,
    headers: {'Content-Type': 'image/jpeg'} // this needs the correct mime-type of the file
  });
    if (response.status === 200) {
      console.log("\nFile uploaded successfully")
    }
  } catch(e) {
    console.log('\nError uploading the file\n', e)
  }
}

// with object in the S3, generate a secure link to download the file 
const getSignedDownloadUrl = async (key) => {
  if (!key) {
    console.log('\nPlease provide a object key')
    return null
  }
  try {
    const signedAsset = client.getSignedUrl('getObject', {
      Bucket: paramsFile.Bucket,
      Key: key,
      Expires: 60 * 60 * 1,
    })
    console.log(`\n${key} with signed url valid 1 hour:\n` , signedAsset)
  } catch(e) {
    console.log('\nError Getting the download sign url', e)
  }
}

const run = async () => {
  const signedUpload = await createSignedUploadUrl()
  await runUploadFile(signedUpload)
  await getSignedDownloadUrl(paramsFile.Key)
}

run()


