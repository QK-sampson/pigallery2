import {IGalleryManager} from '../interfaces/IGalleryManager';
import {DirectoryDTO} from '../../../common/entities/DirectoryDTO';
import * as path from 'path';
import * as fs from 'fs';
import {DirectoryEntity} from './enitites/DirectoryEntity';
import {SQLConnection} from './SQLConnection';
import {DiskManager} from '../DiskManger';
import {PhotoEntity} from './enitites/PhotoEntity';
import {Utils} from '../../../common/Utils';
import {ProjectPath} from '../../ProjectPath';
import {Config} from '../../../common/config/private/Config';
import {ISQLGalleryManager} from './IGalleryManager';
import {ReIndexingSensitivity} from '../../../common/config/private/IPrivateConfig';

export class GalleryManager implements IGalleryManager, ISQLGalleryManager {


  public async listDirectory(relativeDirectoryName: string,
                             knownLastModified?: number,
                             knownLastScanned?: number): Promise<DirectoryDTO> {
    relativeDirectoryName = path.normalize(path.join('.' + path.sep, relativeDirectoryName));
    const directoryName = path.basename(relativeDirectoryName);
    const directoryParent = path.join(path.dirname(relativeDirectoryName), path.sep);
    const connection = await SQLConnection.getConnection();
    const stat = fs.statSync(path.join(ProjectPath.ImageFolder, relativeDirectoryName));
    const lastModified = Math.max(stat.ctime.getTime(), stat.mtime.getTime());
    let dir = await connection
      .getRepository(DirectoryEntity)
      .createQueryBuilder('directory')
      .where('directory.name = :name AND directory.path = :path', {
        name: directoryName,
        path: directoryParent
      })
      .leftJoinAndSelect('directory.directories', 'directories')
      .leftJoinAndSelect('directory.photos', 'photos')
      .getOne();


    if (dir && dir.lastScanned != null) {
      //If it seems that the content did not changed, do not work on it
      if (knownLastModified && knownLastScanned
        && lastModified == knownLastModified &&
        dir.lastScanned == knownLastScanned) {

        if (Config.Server.indexing.reIndexingSensitivity == ReIndexingSensitivity.low) {
          return null;
        }
        if (Date.now() - knownLastScanned <= Config.Server.indexing.cachedFolderTimeout &&
          Config.Server.indexing.reIndexingSensitivity == ReIndexingSensitivity.medium) {
          return null;
        }
      }
      if (dir.photos) {
        for (let i = 0; i < dir.photos.length; i++) {
          dir.photos[i].directory = dir;
          dir.photos[i].readyThumbnails = [];
          dir.photos[i].readyIcon = false;
        }
      }
      if (dir.directories) {
        for (let i = 0; i < dir.directories.length; i++) {
          dir.directories[i].photos = await connection
            .getRepository(PhotoEntity)
            .createQueryBuilder('photo')
            .where('photo.directory = :dir', {
              dir: dir.directories[i].id
            })
            .orderBy('photo.metadata.creationDate', 'ASC')
            .limit(Config.Server.indexing.folderPreviewSize)
            .getMany();
          dir.directories[i].isPartial = true;

          for (let j = 0; j < dir.directories[i].photos.length; j++) {
            dir.directories[i].photos[j].directory = dir.directories[i];
            dir.directories[i].photos[j].readyThumbnails = [];
            dir.directories[i].photos[j].readyIcon = false;
          }
        }
      }


      if (dir.lastModified != lastModified) {
        return this.indexDirectory(relativeDirectoryName);
      }

      //not indexed since a while, index it in a lazy manner
      if ((Date.now() - dir.lastScanned > Config.Server.indexing.cachedFolderTimeout &&
        Config.Server.indexing.reIndexingSensitivity >= ReIndexingSensitivity.medium) ||
        Config.Server.indexing.reIndexingSensitivity >= ReIndexingSensitivity.high) {
        //on the fly reindexing
        this.indexDirectory(relativeDirectoryName).catch((err) => {
          console.error(err);
        });
      }
      return dir;


    }

    //never scanned (deep indexed), do it and return with it
    return this.indexDirectory(relativeDirectoryName);


  }


  public indexDirectory(relativeDirectoryName): Promise<DirectoryDTO> {
    return new Promise(async (resolve, reject) => {
      try {
        const scannedDirectory = await DiskManager.scanDirectory(relativeDirectoryName);

        //returning with the result
        scannedDirectory.photos.forEach(p => p.readyThumbnails = []);
        resolve(scannedDirectory);

        await this.saveToDB(scannedDirectory);

      } catch (error) {
        console.error(error);
        return reject(error);
      }

    });
  }


  private async saveToDB(scannedDirectory: DirectoryDTO) {
    const connection = await SQLConnection.getConnection();

    //saving to db
    const directoryRepository = connection.getRepository(DirectoryEntity);
    const photosRepository = connection.getRepository(PhotoEntity);


    let currentDir = await directoryRepository.createQueryBuilder('directory')
      .where('directory.name = :name AND directory.path = :path', {
        name: scannedDirectory.name,
        path: scannedDirectory.path
      }).getOne();

    if (!!currentDir) {//Updated parent dir (if it was in the DB previously)
      currentDir.lastModified = scannedDirectory.lastModified;
      currentDir.lastScanned = scannedDirectory.lastScanned;
      currentDir = await directoryRepository.save(currentDir);
    } else {
      (<DirectoryEntity>scannedDirectory).lastScanned = scannedDirectory.lastScanned;
      currentDir = await directoryRepository.save(<DirectoryEntity>scannedDirectory);
    }

    let childDirectories = await directoryRepository.createQueryBuilder('directory')
      .where('directory.parent = :dir', {
        dir: currentDir.id
      }).getMany();

    for (let i = 0; i < scannedDirectory.directories.length; i++) {
      //Was this child Dir already indexed before?
      let directory: DirectoryEntity = null;
      for (let j = 0; j < childDirectories.length; j++) {
        if (childDirectories[j].name == scannedDirectory.directories[i].name) {
          directory = childDirectories[j];
          childDirectories.splice(j, 1);
          break;
        }
      }

      if (directory != null) { //update existing directory
        if (!directory.parent || !directory.parent.id) { //set parent if not set yet
          directory.parent = currentDir;
          delete directory.photos;
          await directoryRepository.save(directory);
        }
      } else {
        scannedDirectory.directories[i].parent = currentDir;
        (<DirectoryEntity>scannedDirectory.directories[i]).lastScanned = null; //new child dir, not fully scanned yet
        const d = await directoryRepository.save(<DirectoryEntity>scannedDirectory.directories[i]);
        for (let j = 0; j < scannedDirectory.directories[i].photos.length; j++) {
          scannedDirectory.directories[i].photos[j].directory = d;
        }

        await photosRepository.save(scannedDirectory.directories[i].photos);
      }
    }

    //Remove child Dirs that are not anymore in the parent dir
    await directoryRepository.remove(childDirectories);


    let indexedPhotos = await photosRepository.createQueryBuilder('photo')
      .where('photo.directory = :dir', {
        dir: currentDir.id
      }).getMany();


    let photosToSave = [];
    for (let i = 0; i < scannedDirectory.photos.length; i++) {
      let photo = null;
      for (let j = 0; j < indexedPhotos.length; j++) {
        if (indexedPhotos[j].name == scannedDirectory.photos[i].name) {
          photo = indexedPhotos[j];
          indexedPhotos.splice(j, 1);
          break;
        }
      }
      if (photo == null) {
        scannedDirectory.photos[i].directory = null;
        photo = Utils.clone(scannedDirectory.photos[i]);
        scannedDirectory.photos[i].directory = scannedDirectory;
        photo.directory = currentDir;
      }

      if (photo.metadata.keywords != scannedDirectory.photos[i].metadata.keywords ||
        photo.metadata.cameraData != scannedDirectory.photos[i].metadata.cameraData ||
        photo.metadata.positionData != scannedDirectory.photos[i].metadata.positionData ||
        photo.metadata.size != scannedDirectory.photos[i].metadata.size) {

        photo.metadata.keywords = scannedDirectory.photos[i].metadata.keywords;
        photo.metadata.cameraData = scannedDirectory.photos[i].metadata.cameraData;
        photo.metadata.positionData = scannedDirectory.photos[i].metadata.positionData;
        photo.metadata.size = scannedDirectory.photos[i].metadata.size;
        photosToSave.push(photo);
      }
    }
    await photosRepository.save(photosToSave);
    await photosRepository.remove(indexedPhotos);


  }

}
