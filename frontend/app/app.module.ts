import {Injectable, LOCALE_ID, NgModule, TRANSLATIONS} from '@angular/core';
import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {AgmCoreModule} from '@agm/core';
import {AppComponent} from './app.component';
import {appRoutes} from './app.routing';
import {UserService} from './model/network/user.service';
import {GalleryService} from './gallery/gallery.service';
import {NetworkService} from './model/network/network.service';
import {ThumbnailLoaderService} from './gallery/thumnailLoader.service';
import {GalleryCacheService} from './gallery/cache.gallery.service';
import {FullScreenService} from './gallery/fullscreen.service';
import {AuthenticationService} from './model/network/authentication.service';
import {UserMangerSettingsComponent} from './settings/usermanager/usermanager.settings.component';
import {FrameComponent} from './frame/frame.component';
import {GalleryLightboxPhotoComponent} from './gallery/lightbox/photo/photo.lightbox.gallery.component';
import {GalleryPhotoLoadingComponent} from './gallery/grid/photo/loading/loading.photo.grid.gallery.component';
import {GalleryNavigatorComponent} from './gallery/navigator/navigator.gallery.component';
import {GallerySearchComponent} from './gallery/search/search.gallery.component';
import {GalleryLightboxComponent} from './gallery/lightbox/lightbox.gallery.component';
import {GalleryDirectoryComponent} from './gallery/directory/directory.gallery.component';
import {GalleryGridComponent} from './gallery/grid/grid.gallery.component';
import {GalleryPhotoComponent} from './gallery/grid/photo/photo.grid.gallery.component';
import {LoginComponent} from './login/login.component';
import {AdminComponent} from './admin/admin.component';
import {GalleryComponent} from './gallery/gallery.component';
import {StringifyRole} from './pipes/StringifyRolePipe';
import {GalleryMapComponent} from './gallery/map/map.gallery.component';
import {GalleryMapLightboxComponent} from './gallery/map/lightbox/lightbox.map.gallery.component';
import {ThumbnailManagerService} from './gallery/thumnailManager.service';
import {OverlayService} from './gallery/overlay.service';
import {Config} from '../../common/config/public/Config';
import {LAZY_MAPS_API_CONFIG} from '@agm/core/services';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {GalleryShareComponent} from './gallery/share/share.gallery.component';
import {ShareLoginComponent} from './sharelogin/share-login.component';
import {ShareService} from './gallery/share.service';
import {ModalModule} from 'ngx-bootstrap/modal';
import {DatabaseSettingsComponent} from './settings/database/database.settings.component';
import {ToastModule} from 'ng2-toastr/ng2-toastr';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NotificationService} from './model/notification.service';
import {JWBootstrapSwitchModule} from 'jw-bootstrap-switch-ng2';
import {ClipboardModule} from 'ngx-clipboard';
import {NavigationService} from './model/navigation.service';
import {InfoPanelLightboxComponent} from './gallery/lightbox/infopanel/info-panel.lightbox.gallery.component';
import {MapSettingsComponent} from './settings/map/map.settings.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ThumbnailSettingsComponent} from './settings/thumbnail/thumbanil.settings.component';
import {SearchSettingsComponent} from './settings/search/search.settings.component';
import {SettingsService} from './settings/settings.service';
import {ShareSettingsComponent} from './settings/share/share.settings.component';
import {BasicSettingsComponent} from './settings/basic/basic.settings.component';
import {OtherSettingsComponent} from './settings/other/other.settings.component';
import {HttpClientModule} from '@angular/common/http';
import {DefaultUrlSerializer, UrlSerializer, UrlTree} from '@angular/router';
import {IndexingSettingsComponent} from './settings/indexing/indexing.settings.component';
import {LanguageComponent} from './language/language.component';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Injectable()
export class GoogleMapsConfig {
  apiKey: string;

  constructor() {
    this.apiKey = Config.Client.Map.googleApiKey;
  }
}

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    'swipe': {direction: 31} // enable swipe up
  };
}

export class CustomUrlSerializer implements UrlSerializer {
  private _defaultUrlSerializer: DefaultUrlSerializer = new DefaultUrlSerializer();

  parse(url: string): UrlTree {
    // Encode parentheses
    url = url.replace(/\(/g, '%28').replace(/\)/g, '%29');
    // Use the default serializer.
    return this._defaultUrlSerializer.parse(url);
  }

  serialize(tree: UrlTree): string {
    return this._defaultUrlSerializer.serialize(tree).replace(/%28/g, '(').replace(/%29/g, ')');
  }
}

declare const require;

export function translationsFactory(locale: string) {
  locale = locale || 'en'; // default to english if no locale
  console.log('locale', locale);
  return require(`raw-loader!../translate/messages.${locale}.xlf`);
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    appRoutes,
    ClipboardModule,
    JWBootstrapSwitchModule,
    TooltipModule.forRoot(),
    ToastModule.forRoot(),
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    AgmCoreModule.forRoot(),
    SlimLoadingBarModule.forRoot()
  ],
  declarations: [AppComponent,
    LoginComponent,
    ShareLoginComponent,
    GalleryComponent,
    // misc
    FrameComponent,
    LanguageComponent,
    // Gallery
    GalleryLightboxPhotoComponent,
    GalleryPhotoLoadingComponent,
    GalleryGridComponent,
    GalleryDirectoryComponent,
    GalleryLightboxComponent,
    GalleryMapComponent,
    GalleryMapLightboxComponent,
    FrameComponent,
    GallerySearchComponent,
    GalleryShareComponent,
    GalleryNavigatorComponent,
    GalleryPhotoComponent,
    AdminComponent,
    InfoPanelLightboxComponent,
    // Settings
    UserMangerSettingsComponent,
    DatabaseSettingsComponent,
    MapSettingsComponent,
    ThumbnailSettingsComponent,
    SearchSettingsComponent,
    ShareSettingsComponent,
    BasicSettingsComponent,
    OtherSettingsComponent,
    IndexingSettingsComponent,
    StringifyRole],
  providers: [
    {provide: UrlSerializer, useClass: CustomUrlSerializer},
    {provide: LAZY_MAPS_API_CONFIG, useClass: GoogleMapsConfig},
    {provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig},
    NetworkService,
    ShareService,
    UserService,
    GalleryCacheService,
    GalleryService,
    AuthenticationService,
    ThumbnailLoaderService,
    ThumbnailManagerService,
    NotificationService,
    FullScreenService,
    NavigationService,
    SettingsService,
    OverlayService,
    {
      provide: TRANSLATIONS,
      useFactory: translationsFactory,
      deps: [LOCALE_ID]
    },
    I18n
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
