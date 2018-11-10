# xcode-lambda

Serverless transcoding

# Local Setup and deploy to cloud.

1. Install Node.js

Download: http://nodejs.org/download/

2. Install The Serverless Framework

```
$ npm install serverless -g
```

3. Install the node modules

```
$ npm install
```

4.  Setup a local env-local.yml file
    The following is an example and does not include real variable values. Replace the ACCOUNT variable with your AWS Account found in "My Account|Account Settings"

```
environment:
  ACCOUNT: XXXXXXXX
  REGION: us-east-1
  POLLY_S3_BUCKET: my-bucket
```

5. Deploy. This will create queues & the xcode-lambda function (if not already created).

```
$ serverless deploy -v
```

# Other Useful commands

## Remove the entire stack you deployed

```
$ serverless remove
```

## Deploy just the lambda function

```
$ serverless deploy function --function xcode
```
