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

6. Update the SQS_QUEUE url env var in scout-ua.  This will make the scout-ua send a transcoding request to the Queue.  You can get the URL of the Queue in the SQS console. 

# Other Useful commands

## Remove the entire stack you deployed

```
$ serverless remove
```

## Deploy just the lambda function

```
$ serverless deploy function --function xcode
```

# Acknowledgements
Uses a precompiled version of ffmpeg from https://github.com/binoculars/ffmpeg-build-lambda/releases.  Should we ever need to rebuild ffmpeg, the build instructions are here: https://trac.ffmpeg.org/wiki/CompilationGuide
