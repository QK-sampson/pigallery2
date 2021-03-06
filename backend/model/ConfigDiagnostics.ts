import {Config} from '../../common/config/private/Config';
import {
  DataBaseConfig,
  DatabaseType,
  IPrivateConfig,
  ThumbnailConfig,
  ThumbnailProcessingLib
} from '../../common/config/private/IPrivateConfig';
import {Logger} from '../Logger';
import {NotificationManager} from './NotifocationManager';
import {ProjectPath} from '../ProjectPath';
import {SQLConnection} from './sql/SQLConnection';
import * as fs from 'fs';
import {ClientConfig} from '../../common/config/public/ConfigClass';

const LOG_TAG = '[ConfigDiagnostics]';

export class ConfigDiagnostics {

  static async testDatabase(databaseConfig: DataBaseConfig) {
    if (databaseConfig.type != DatabaseType.memory) {
      await SQLConnection.tryConnection(databaseConfig);
    }
  }


  static async testThumbnailLib(processingLibrary: ThumbnailProcessingLib) {
    switch (processingLibrary) {
      case ThumbnailProcessingLib.sharp:
        const sharp = require('sharp');
        sharp();
        break;
      case  ThumbnailProcessingLib.gm:
        const gm = require('gm');
        await new Promise((resolve, reject) => {
          gm(ProjectPath.FrontendFolder + '/assets/icon.png').size((err, value) => {
            if (err) {
              return reject(err.toString());
            }
            return resolve();
          });
        });
        break;
    }
  }

  static async testThumbnailFolder(folder: string) {
    await new Promise((resolve, reject) => {
      fs.access(folder, fs.constants.W_OK, (err) => {
        if (err) {
          reject({message: 'Error during getting write access to temp folder', error: err.toString()});
        }
      });
      resolve();
    });
  }

  static async testImageFolder(folder: string) {
    await new Promise((resolve, reject) => {
      if (!fs.existsSync(folder)) {
        reject('Images folder not exists: \'' + folder + '\'');
      }
      fs.access(folder, fs.constants.R_OK, (err) => {
        if (err) {
          reject({message: 'Error during getting read access to images folder', error: err.toString()});
        }
      });
      resolve();
    });
  }


  static async testServerThumbnailConfig(thumbnailConfig: ThumbnailConfig) {
    await ConfigDiagnostics.testThumbnailLib(thumbnailConfig.processingLibrary);
    await ConfigDiagnostics.testThumbnailFolder(thumbnailConfig.folder);
  }

  static async testClientThumbnailConfig(thumbnailConfig: ClientConfig.ThumbnailConfig) {
    if (isNaN(thumbnailConfig.iconSize) || thumbnailConfig.iconSize <= 0) {
      throw 'IconSize has to be >= 0 integer, got: ' + thumbnailConfig.iconSize;
    }

    if (!thumbnailConfig.thumbnailSizes.length) {
      throw 'At least one thumbnail size is needed';
    }
    for (let i = 0; i < thumbnailConfig.thumbnailSizes.length; i++) {
      if (isNaN(thumbnailConfig.thumbnailSizes[i]) || thumbnailConfig.thumbnailSizes[i] <= 0) {
        throw 'Thumbnail size has to be >= 0 integer, got: ' + thumbnailConfig.thumbnailSizes[i];
      }
    }
  }


  static async testSearchConfig(search: ClientConfig.SearchConfig, config: IPrivateConfig) {
    if (search.enabled == true && config.Server.database.type == DatabaseType.memory) {
      throw 'Memory Database do not support searching';
    }
  }


  static async testSharingConfig(sharing: ClientConfig.SharingConfig, config: IPrivateConfig) {
    if (sharing.enabled == true && config.Server.database.type == DatabaseType.memory) {
      throw 'Memory Database do not support sharing';
    }
  }

  static async testMapConfig(map: ClientConfig.MapConfig) {
    if (map.enabled == true && (!map.googleApiKey || map.googleApiKey.length == 0)) {
      throw 'Maps need a valid google api key';
    }
  }


  static async runDiagnostics() {

    if (Config.Server.database.type != DatabaseType.memory) {
      try {
        await ConfigDiagnostics.testDatabase(Config.Server.database);
      } catch (err) {
        Logger.warn(LOG_TAG, '[SQL error]', err);
        Logger.warn(LOG_TAG, 'Error during initializing SQL falling back temporally to memory DB');
        NotificationManager.warning('Error during initializing SQL falling back temporally to memory DB', err);
        Config.setDatabaseType(DatabaseType.memory);
      }
    }

    if (Config.Server.thumbnail.processingLibrary != ThumbnailProcessingLib.Jimp) {
      try {
        await ConfigDiagnostics.testThumbnailLib(Config.Server.thumbnail.processingLibrary);
      } catch (err) {
        NotificationManager.warning('Thumbnail hardware acceleration is not possible.' +
          ' \'' + ThumbnailProcessingLib[Config.Server.thumbnail.processingLibrary] + '\' node module is not found.' +
          ' Falling back temporally to JS based thumbnail generation', err);
        Logger.warn(LOG_TAG, '[Thumbnail hardware acceleration] module error: ', err);
        Logger.warn(LOG_TAG, 'Thumbnail hardware acceleration is not possible.' +
          ' \'' + ThumbnailProcessingLib[Config.Server.thumbnail.processingLibrary] + '\' node module is not found.' +
          ' Falling back temporally to JS based thumbnail generation');
        Config.Server.thumbnail.processingLibrary = ThumbnailProcessingLib.Jimp;
      }
    }

    try {
      await ConfigDiagnostics.testThumbnailFolder(Config.Server.thumbnail.folder);
    } catch (err) {
      NotificationManager.error('Thumbnail folder error', err);
      Logger.error(LOG_TAG, 'Thumbnail folder error', err);
    }


    try {
      await ConfigDiagnostics.testImageFolder(Config.Server.imagesFolder);
    } catch (err) {
      NotificationManager.error('Images folder error', err);
      Logger.error(LOG_TAG, 'Images folder error', err);
    }
    try {
      await ConfigDiagnostics.testClientThumbnailConfig(Config.Client.Thumbnail);
    } catch (err) {
      NotificationManager.error('Thumbnail settings error', err);
      Logger.error(LOG_TAG, 'Thumbnail settings error', err);
    }


    try {
      await ConfigDiagnostics.testSearchConfig(Config.Client.Search, Config);
    } catch (err) {
      NotificationManager.warning('Search is not supported with these settings. Disabling temporally. Please adjust the config properly.', err);
      Logger.warn(LOG_TAG, 'Search is not supported with these settings, switching off..', err);
      Config.Client.Search.enabled = false;
    }

    try {
      await ConfigDiagnostics.testSharingConfig(Config.Client.Sharing, Config);
    } catch (err) {
      NotificationManager.warning('Sharing is not supported with these settings. Disabling temporally. Please adjust the config properly.', err);
      Logger.warn(LOG_TAG, 'Sharing is not supported with these settings, switching off..', err);
      Config.Client.Sharing.enabled = false;
    }

    try {
      await ConfigDiagnostics.testMapConfig(Config.Client.Map);
    } catch (err) {
      NotificationManager.warning('Maps is not supported with these settings. Disabling temporally. Please adjust the config properly.', err);
      Logger.warn(LOG_TAG, 'Maps is not supported with these settings. Disabling temporally. Please adjust the config properly.', err);
      Config.Client.Map.enabled = false;
    }

  }
}
