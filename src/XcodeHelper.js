/*
 * XcodeHelper.js
 *
 * Logic to transcode files to the desired format and update them in
 * S3 and close the loop with the database
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Author:  Tamara Hills
 */
const execFile = require('child_process').execFile;
const spawn = require('child_process').spawn;
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const join = require('path').join;
const fs = require('fs');
const createWriteStream = require('fs').createWriteStream;
const createReadStream = require('fs').createReadStream;
const tmpdir = require('os').tmpdir;
const basename = require('path').basename;
const extname = require('path').extname;
const Database = require('./database');
const database = new Database();
const logger = require('./src/logger');

process.env['PATH'] += ':' + process.env['LAMBDA_TASK_ROOT'];
process.env['FFMPEG_PATH'] = '/var/task/binaries/ffmpeg/ffmpeg';
//-codec:a libopus -ar 48000 -b:a 24k -f caf
class XcodeHelper {
  ffprobe(file) {
    logger.debug('before promise');
    logger.debug(process.env.PATH);
    return new Promise((resolve, reject) => {
      const args = [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        '-i',
        file
      ];

      const opts = {};

      const cb = (error, stdout) => {
        if (error) {
          logger.error('Error:' + error);
          reject(error);
        }

        logger.debug(stdout);
        const result = JSON.parse(stdout);

        if (!result.streams) {
          return reject('This file has no streams');
        }

        const isValidFile = result.streams.some(
          ({ codec_type }) => codec_type === 'video' || codec_type === 'audio'
        );

        if (!isValidFile) {
          return reject('FFprobe: no valid media stream found');
        } else {
          logger.debug('Valid file found. FFProbe finished');
          return resolve(result);
        }
      };
      logger.debug('before execFile');
      logger.debug('args: ' + args);
      logger.debug('opts: ' + opts);

      execFile('./binaries/ffmpeg/ffprobe', args, opts, cb).on('error', reject);
    });
  }

  download(Bucket, Key) {
    logger.debug(`Downloading file: ${Key} from bucket: ${Bucket}`);

    return new Promise((resolve, reject) => {
      const destPath = join(tmpdir(), basename(Key));
      const file = createWriteStream(destPath);
      file.on('close', () => resolve(destPath));
      file.on('error', reject);

      s3.getObject({ Bucket, Key })
        .on('error', reject)
        .createReadStream()
        .pipe(file);
    });
  }

  upload(newAudioFile) {
    return new Promise((resolve, reject) => {
      var bucketParams = {
        Bucket: process.env.POLLY_S3_BUCKET,
        Key: '',
        Body: ''
      };

      var fileStream = createReadStream(newAudioFile);
      fileStream.on('error', function(err) {
        logger.error('File Error' + err);
        reject('File error:' + err);
        return;
      });

      bucketParams.Body = fileStream;
      bucketParams.Key = basename(newAudioFile);
      s3.upload(bucketParams, function(err, data) {
        if (err) {
          logger.error('error uploading');
          reject('error uploading:' + err);
        } else {
          logger.debug('Upload Success' + data.Location);
          // Return the URL of the Mp3 in the S3 bucket.
          resolve(data.Location);
        }
      });
    });
  }

  //process.env.XCODE_ARGS.split(' ');
  getXcodeArgs(codec) {
    let args = '';
    if (codec == 'opus-caf') {
      args = process.env.OPUS_CAF_ARGS;
    } else if (codec == 'opus-ogg') {
      args = process.env.OPUS_OGG_ARGS;
    } else {
      logger.error(`Error: Invalid codec: ${codec}`);
    }
    return args;
  }

  ffmpeg(file, extension, codec) {
    return new Promise((resolve, reject) => {
      const outputDirectory = tmpdir();

      let xcodeArgs = getXcodeArgs(codec);
      let newFileName = `${join(
        outputDirectory,
        basename(file, extname(file))
      )}.${extension}`;
      logger.debug('New filename: ' + newFileName);

      const args = [
        '-y',
        '-loglevel',
        'warning',
        '-i',
        file,
        ...(xcodeArgs || []),
        newFileName
      ];

      logger.debug('Running: ffmpeg', args.join(' '));

      const opts = {};

      const child = spawn('./binaries/ffmpeg/ffmpeg', args, opts)
        .on('message', msg => logger.debug(msg))
        .on('error', reject)
        .on('close', () => resolve(newFileName));

      child.stdout.on('data', data => process.stdout.write(data));
      child.stderr.on('data', data => process.stdout.write(data));
    });
  }

  updateDatabase(file, item_id, codec) {
    return new Promise((resolve, reject) => {
      let url = `https://s3.amazonaws.com/${
        process.env.POLLY_S3_BUCKET
      }/${file}`;
      try {
        await database.updateDatabaseWithUrl(item_id, url, codec);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  deleteFile(file) {
    return new Promise((resolve, reject) => {
      logger.debug('Entering deleteFile: ' + file);
      fs.unlink(file, function(err) {
        if (err) {
          logger.error('Error:  Deletion failed for:  ' + file);
          reject(file);
        } else {
          logger.debug('File deleted successfully');
          resolve();
        }
      });
    });
  }
}

module.exports = XcodeHelper;