# Retrieving Audit Logs and Uploading into S3 bucket

This script can be copied into an Atlas Function. This script makes the HTTP/S calls the fetch compressed audit logs and uploads them into S3 bucket as a zip file. It has a dependency on some App Services Values and Secrets. And also `aws-sdk` npm package needs to be added as a dependency.

You can create a scheduled trigger to execute the Atlas Function regularly but please don't overlook that the maximum allowed runtime of an Atlas Function is 120 seconds. https://www.mongodb.com/docs/atlas/app-services/functions/#constraints

If you're planning to make this function executed regularly through scheduled trigger, make sure you're calculating `startTime` and `endTime` parameters for each execution. The wrong calculations might cause duplicate or missing data.