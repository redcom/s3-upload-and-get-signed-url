import AWS from 'aws-sdk'
import fs from 'fs'

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

const params = {
  Bucket: process.env.AWS_S3_BUCKET,
  Key: `test-${1* new Date()}`,
  Body: "aaa",
  ACL: 'private',
}


const runUpload = async () => {
  try {
    const data = await client.upload(params).promise()
    console.log("Plain Text upload:", data)
  } catch(e) {
    console.log('Error', e)
  }
}

const dataFile = fs.readFileSync('./s3.js',
  {encoding:'utf8', flag:'r'});

console.log(dataFile)
const paramsFile = {
  Bucket: process.env.AWS_S3_BUCKET,
  Key: `s3-${1* new Date()}.js`,
  Body: Buffer.from(dataFile, 'binary'),
  ACL: 'private',
}
const runUploadWithFile = async () => {
  try {
    const data = await client.upload(paramsFile).promise()
    console.log("FileUpload:", data)
  } catch(e) {
    console.log('Error', e)
  }
}

const runGetSignedUrl = async (key) => {
  if (!key) {
    console.log('Please provide a object key')
    return null
  }
  try {
    const chartAsset = client.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 60 * 60 * 1,
    })
    console.log(`\n${key} signed url:` , chartAsset)
  } catch(e) {
    console.log('Error', e)
  }
}

const run = async () => {
  await runUpload()
  await runGetSignedUrl(params.Key)


  await runUploadWithFile()
  await runGetSignedUrl(paramsFile.Key)
}

run()


