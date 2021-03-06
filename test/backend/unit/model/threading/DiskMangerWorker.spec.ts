import {expect} from 'chai';
import {DiskMangerWorker} from '../../../../../backend/model/threading/DiskMangerWorker';
import * as path from 'path';
import {Config} from '../../../../../common/config/private/Config';
import {ProjectPath} from '../../../../../backend/ProjectPath';

describe('DiskMangerWorker', () => {

  it('should parse metadata', async () => {
    Config.Server.imagesFolder = path.join(__dirname, '/../../assets');
    ProjectPath.ImageFolder = path.join(__dirname, '/../../assets');
    const dir = await DiskMangerWorker.scanDirectory('/');
    expect(dir.photos.length).to.be.equals(1);
    expect(dir.photos[0].name).to.be.equals('test image öüóőúéáű-.,.jpg');
    expect(dir.photos[0].metadata.keywords).to.deep.equals(['Berkley', 'USA', 'űáéúőóüö ŰÁÉÚŐÓÜÖ']);
    expect(dir.photos[0].metadata.fileSize).to.deep.equals(62392);
    expect(dir.photos[0].metadata.size).to.deep.equals({width: 140, height: 93});
    expect(dir.photos[0].metadata.cameraData).to.deep.equals({
      ISO: 3200,
      model: 'óüöúőűáé ÓÜÖÚŐŰÁÉ',
      make: 'Canon',
      fStop: 5.6,
      exposure: 0.00125,
      focalLength: 85,
      lens: 'EF-S15-85mm f/3.5-5.6 IS USM'
    });

    expect(dir.photos[0].metadata.positionData).to.deep.equals({
      GPSData: {
        latitude: 37.871093333333334,
        longitude: -122.25678,
        altitude: 102.4498997995992
      },
      country: 'mmóüöúőűáé ÓÜÖÚŐŰÁÉmm-.,|\\mm\u0000',
      state: 'óüöúőűáé ÓÜÖÚŐŰÁ',
      city: 'óüöúőűáé ÓÜÖÚŐŰÁ'
    });

    expect(dir.photos[0].metadata.creationDate).to.be.equals(1436610566000);

  });

});
