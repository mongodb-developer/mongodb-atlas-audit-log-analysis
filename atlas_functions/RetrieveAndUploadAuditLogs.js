exports = async function(){
  
  const atlasAdminAPIPublicKey = context.values.get("AtlasAdminAPIPublicKey"); 
  const atlasAdminAPIPrivateKey = context.values.get("AtlasAdminAPIPrivateKeyLinkToSecret");
  
  const awsAccessKeyID = context.values.get("AWSAccessKeyID")
  const awsSecretAccessKey = context.values.get("AWSSecretAccessKeyLinkToSecret")
  
  console.log(`Atlas Public + Private Keys: ${atlasAdminAPIPublicKey}, ${atlasAdminAPIPrivateKey}`)
  console.log(`AWS Access Key ID + Secret Access Key: ${awsAccessKeyID}, ${awsSecretAccessKey}`)
  
  //////////////////////////////////////////////////////////////////////////////////////////////////
  
  const logType = "mongodb-audit-log"; // the other option is "mongodb" -> that allows you to download database logs

  // Atlas Cluster information -- change it accordingly
  const groupId = '5ca48430012b99f31118bbcf'; 
  const host = "xyzdata-shard-00-01.5aaa5.mongodb.net";

  // defining startDate and endDate of Audit Logs
  const endDate = new Date();
  const durationInMinutes = 20; // the audit logs within this amount of minutes will be fetched
  const durationInMilliSeconds = durationInMinutes * 60 * 1000
  const startDate = new Date(endDate.getTime()-durationInMilliSeconds)
  
  const auditLogsArguments = { 
    scheme: 'https', 
    host: 'cloud.mongodb.com', 
    path: `api/atlas/v1.0/groups/${groupId}/clusters/${host}/logs/${logType}.gz`, 
    username: atlasAdminAPIPublicKey, 
    password: atlasAdminAPIPrivateKey,
    headers: {'Content-Type': ['application/json'], 'Accept-Encoding': ['application/gzip']},
    digestAuth:true,
    query: {
    "startDate": [Math.round(startDate / 1000).toString()],
    "endDate": [Math.round(endDate / 1000).toString()]
  }
  };
  
  console.log(`Arguments:${JSON.stringify(auditLogsArguments)}`)
  
  const response = await context.http.get(auditLogsArguments)
  auditData = response.body;
  console.log("AuditData:"+(auditData))
  console.log("JS Type:" + typeof auditData)

  // convert it to base64 and then Buffer
  var bufferAuditData = Buffer.from(auditData.toBase64(),'base64')
  console.log("Buffered Audit Data" + bufferAuditData)
  
  // uploading into S3  
  
  const AWS = require('aws-sdk');
  
  // configure AWS credentials
  const config = {
    accessKeyId: awsAccessKeyID,
    secretAccessKey: awsSecretAccessKey
  };
  
  // configure S3 parameters  
  const fileName= `auditlogs/auditlog-${new Date().getTime()}.gz`
  const S3params = {
    Bucket: "fuat-sungur-bucket",
    Key: fileName,
    Body: bufferAuditData
  };
  const S3 = new AWS.S3(config);

  // create the promise object
  const s3Promise = S3.putObject(S3params).promise();
  
  s3Promise.then(function(data) {
    console.log('Put Object Success');
    return { success: true }
  }).catch(function(err) {
    console.log(err);
    return { success: false, failure: err }
  });

};
