import {AuthenticationMWs} from '../middlewares/user/AuthenticationMWs';
import {GalleryMWs} from '../middlewares/GalleryMWs';
import {RenderingMWs} from '../middlewares/RenderingMWs';
import {ThumbnailGeneratorMWs} from '../middlewares/thumbnail/ThumbnailGeneratorMWs';
import {UserRoles} from '../../common/entities/UserDTO';

export class GalleryRouter {
  public static route(app: any) {

    this.addGetImageIcon(app);
    this.addGetImageThumbnail(app);
    this.addGetImage(app);
    this.addDirectoryList(app);

    this.addSearch(app);
    this.addInstantSearch(app);
    this.addAutoComplete(app);
  }

  private static addDirectoryList(app) {
    app.get(['/api/gallery/content/:directory(*)', '/api/gallery/', '/api/gallery//'],
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authoriseDirectory,
      GalleryMWs.listDirectory,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.removeCyclicDirectoryReferences,
      RenderingMWs.renderResult
    );
  }


  private static addGetImage(app) {
    app.get(['/api/gallery/content/:imagePath(*\.(jpg|bmp|png|gif|jpeg))'],
      AuthenticationMWs.authenticate,
      // TODO: authorize path
      GalleryMWs.loadImage,
      RenderingMWs.renderFile
    );
  }

  private static addGetImageThumbnail(app) {
    app.get('/api/gallery/content/:imagePath(*\.(jpg|bmp|png|gif|jpeg))/thumbnail/:size?',
      AuthenticationMWs.authenticate,
      // TODO: authorize path
      GalleryMWs.loadImage,
      ThumbnailGeneratorMWs.generateThumbnail,
      RenderingMWs.renderFile
    );
  }

  private static addGetImageIcon(app) {
    app.get('/api/gallery/content/:imagePath(*\.(jpg|bmp|png|gif|jpeg))/icon',
      AuthenticationMWs.authenticate,
      // TODO: authorize path
      GalleryMWs.loadImage,
      ThumbnailGeneratorMWs.generateIcon,
      RenderingMWs.renderFile
    );
  }

  private static addSearch(app) {
    app.get('/api/search/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      GalleryMWs.search,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.removeCyclicDirectoryReferences,
      RenderingMWs.renderResult
    );
  }

  private static addInstantSearch(app) {
    app.get('/api/instant-search/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      GalleryMWs.instantSearch,
      ThumbnailGeneratorMWs.addThumbnailInformation,
      GalleryMWs.removeCyclicDirectoryReferences,
      RenderingMWs.renderResult
    );
  }

  private static addAutoComplete(app) {
    app.get('/api/autocomplete/:text',
      AuthenticationMWs.authenticate,
      AuthenticationMWs.authorise(UserRoles.Guest),
      GalleryMWs.autocomplete,
      RenderingMWs.renderResult
    );
  }

}
