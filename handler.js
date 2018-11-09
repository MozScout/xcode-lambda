'use strict';
const XcodeHelper = require('./src/XcodeHelper');
const xcodeHelper = new XcodeHelper();
const logger = require('./src/logger');

module.exports.xcode = async event => {
  logger.debug('event is: ' + JSON.stringify(event));
  const body = JSON.parse(event.Records[0].body);
  logger.debug('codec is: ' + body.targetCodec);
  logger.debug('filename is: ' + body.filename);

  const destPath = await xcodeHelper.download(
    process.env.POLLY_S3_BUCKET,
    body.filename
  );
  logger.debug('Dest Path is:  ' + destPath);

  try {
    const outputPath = await xcodeHelper.ffmpeg(destPath, 'caf');
    logger.debug(outputPath);
    await xcodeHelper.upload(outputPath);
    await xcodeHelper.deleteFile(outputPath);
    await xcodeHelper.updateDatabase();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '',
        input: event
      })
    };
  } catch (err) {
    logger.error('Error: ' + err);
    //Put on failure queue
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '',
        input: event
      })
    };
  }
};
