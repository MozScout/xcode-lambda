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

4. Define the following local variables before deploying to cloud on your AWS infrastructure and replace the X's with your actual AWS Account that can be found in My Account|Account Settings.   
  ```
  $ export AWS_ACCOUNT=XXXXXXXXX
  ```  
5. You must have your account credentials setup in ~/.aws/credentials with a key and secret with enough permissions to deploy.

6. Deploy.  This will create queues & the xcode-lambda function (if not already created).
  ```
  $ serverless deploy -v
  ```  
