const AudioFiles = require('../data/models/AudioFiles');
const constants = require('./constants');
const logger = require('./logger');

class Database {
  async updateDatabaseWithUrl(item_id, url, codec, size, locale) {
    logger.info(`updateDatabaseWithUrl for ${item_id}`);
    let uuid = await this.getItemUuid(item_id, codec, locale);
    logger.info(`uuid is:  ${uuid}`);
    await this.updateItem(item_id, uuid, url, size);
  }

  async updateItem(item_id, uuid, url, size) {
    logger.info('Entering updateItem');
    return new Promise((resolve, reject) => {
      AudioFiles.update(
        { item_id: item_id, uuid: uuid },
        { url: url, size: size },
        function(err) {
          if (err) {
            reject(err);
            logger.error(`Error updating:  ${err}`);
          } else {
            logger.info('Updated database');
            resolve();
          }
        }
      );
    });
  }

  async getItemUuid(item_id, codec, locale) {
    return new Promise((resolve, reject) => {
      let localeSplit = locale.split('-')[1];
      logger.debug('getItemUuid locale: ' + localeSplit);
      AudioFiles.query('item_id')
        .eq(item_id)
        .filter(constants.strings.TYPE_FIELD)
        .eq(constants.strings.MOBILE_TYPE)
        .filter(constants.strings.CODEC_FIELD)
        .eq(codec)
        .filter(constants.strings.LOCALE_FIELD)
        .eq(localeSplit)
        .exec()
        .then(function(data) {
          if (data.count) {
            resolve(data[0].uuid);
            if (data.count > 1) {
              logger.warn('duplicate entries!!!');
            } else {
              logger.info('found entry');
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
