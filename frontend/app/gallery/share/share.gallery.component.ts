import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Utils} from '../../../../common/Utils';
import {ShareService} from '../share.service';
import {GalleryService} from '../gallery.service';
import {ContentWrapper} from '../../../../common/entities/ConentWrapper';
import {SharingDTO} from '../../../../common/entities/SharingDTO';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {Config} from '../../../../common/config/public/Config';
import {NotificationService} from '../../model/notification.service';
import {DirectoryDTO} from '../../../../common/entities/DirectoryDTO';
import {I18n} from '@ngx-translate/i18n-polyfill';


@Component({
  selector: 'gallery-share',
  templateUrl: './share.gallery.component.html',
  styleUrls: ['./share.gallery.component.css'],
})
export class GalleryShareComponent implements OnInit, OnDestroy {
  @ViewChild('shareModal') public childModal: ModalDirective;

  enabled: boolean = true;
  url: string = '';

  input = {
    includeSubfolders: true,
    valid: {
      amount: 30,
      type: ValidityTypes.Days
    },
    password: ''
  };
  currentDir: string = '';
  sharing: SharingDTO = null;
  contentSubscription = null;
  passwordProtection = false;
  ValidityTypes: any;

  constructor(private _sharingService: ShareService,
              public _galleryService: GalleryService,
              private  _notification: NotificationService,
              public i18n: I18n) {
    this.ValidityTypes = ValidityTypes;
  }


  ngOnInit() {
    this.contentSubscription = this._galleryService.content.subscribe((content: ContentWrapper) => {
      this.enabled = !!content.directory;
      if (!this.enabled) {
        return;
      }
      this.currentDir = Utils.concatUrls((<DirectoryDTO>content.directory).path, (<DirectoryDTO>content.directory).name);
    });
    this.passwordProtection = Config.Client.Sharing.passwordProtected;
  }

  ngOnDestroy() {
    if (this.contentSubscription !== null) {
      this.contentSubscription.unsubscribe();
    }
  }

  calcValidity() {
    switch (parseInt(this.input.valid.type.toString())) {
      case ValidityTypes.Minutes:
        return this.input.valid.amount * 1000 * 60;
      case ValidityTypes.Hours:
        return this.input.valid.amount * 1000 * 60 * 60;
      case ValidityTypes.Days:
        return this.input.valid.amount * 1000 * 60 * 60 * 24;
      case ValidityTypes.Months:
        return this.input.valid.amount * 1000 * 60 * 60 * 24 * 30;
    }
    throw new Error('unknown type: ' + this.input.valid.type);
  }

  async update() {
    if (this.sharing == null) {
      return;
    }
    this.url = 'loading..';
    this.sharing = await this._sharingService.updateSharing(this.currentDir, this.sharing.id, this.input.includeSubfolders, this.input.password, this.calcValidity());
    this.url = Config.Client.publicUrl + '/share/' + this.sharing.sharingKey;
  }

  async get() {
    this.url = 'loading..';
    this.sharing = await this._sharingService.createSharing(this.currentDir, this.input.includeSubfolders, this.calcValidity());
    this.url = Config.Client.publicUrl + '/share/' + this.sharing.sharingKey;
  }

  async showModal() {
    await this.get();
    this.input.password = '';
    this.childModal.show();
    document.body.style.paddingRight = '0px';
  }

  onCopy() {
    this._notification.success(this.i18n('Url has been copied to clipboard'));
  }

  public hideModal() {
    this.childModal.hide();
    this.sharing = null;
  }


}


export enum ValidityTypes {
  Minutes = 0, Hours = 1, Days = 2, Months = 3
}
