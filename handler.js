'use strict';
const XcodeHelper = require('./src/XcodeHelper');
const xcodeHelper = new XcodeHelper();
const logger = require('./src/logger');
const basename = require('path').basename;

module.exports.xcode = async event => {
  logger.debug('event is: ' + JSON.stringify(event));
  const body = JSON.parse(event.Records[0].body);
  logger.debug('codec is: ' + body.targetCodec);
  logger.debug('filename is: ' + body.filename);

  const destPath = await xcodeHelper.download(
    process.env.POLLY_S3_BUCKET,
    body.filename
  );
  logger.info(`Dest Path is: ${destPath}`);

  try {
    const outputPath = await xcodeHelper.ffmpeg(destPath, body.targetCodec);
    logger.info(`Transcoded ${outputPath}`);
    // Upload the file to the S3 Bucket
    await xcodeHelper.upload(outputPath);
    let filesize = xcodeHelper.getFileSize(outputPath);

    // Delete the file.
    await xcodeHelper.deleteFile(outputPath);

    // Update the database with size, path, etc.
    await xcodeHelper.updateDatabase(
      basename(outputPath),
      body.item_id,
      body.targetCodec,
      filesize,
      body.locale
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '',
        input: event
      })
    };
  } catch (err) {
    logger.error(`Error:  ${err}`);
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
