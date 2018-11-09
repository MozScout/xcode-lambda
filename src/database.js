const AudioFiles = require('../data/models/AudioFiles');
const constants = require('./constants');
const logger = require('./logger');

class Database {
  async updateDatabaseWithUrl(item_id, url, codec) {
    logger.info(`updateDatabaseWithUrl for ${item_id}`);
    return new Promise((resolve, reject) => {
      try {
        let uuid = await this.getItemUuid(item_id, codec);
        logger.debug('uuid is:  ' + uuid);
        AudioFiles.update(
          { item_id: item_id, uuid: uuid },
          { url: url },
          function(err) {
            if (err) {
              logger.error('Error updating: ' + err);
              reject(err);
            } else {
              logger.debug('Updated database');
              resolve();
            }
          }
        );
      } catch (err) {
        logger.error('error is: ' + err);
        reject(err);
      }
    });
  }

  async getItemUuid(item_id, codec) {
    return new Promise((resolve, reject) => {
      AudioFiles.query('item_id')
        .eq(item_id)
        .filter(constants.strings.TYPE_FIELD)
        .eq(constants.strings.MOBILE_TYPE)
        .filter(constants.strings.CODEC_FIELD)
        .eq(codec)
        .exec()
        .then(function(data) {
          if (data.count) {
            resolve(data[0].uuid);
            if (data.count > 1) {
              logger.warn('duplicate entries!!!');
            }
          } else {
            logger.error('No entry found');
            reject('No entry found');
          }
        });
    });
  }
}

module.exports = Database;
