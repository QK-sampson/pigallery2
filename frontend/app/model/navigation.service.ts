import {Injectable} from '@angular/core';

import {Router} from '@angular/router';
import {ShareService} from '../gallery/share.service';

@Injectable()
export class NavigationService {


  constructor(private _router: Router,
              private _shareService: ShareService) {

  }

  public isLoginPage() {
    return this._router.isActive('login', true) || this._router.isActive('shareLogin', true);
  }

  public async toLogin() {
    console.log('toLogin');
    await this._shareService.wait();
    if (this._shareService.isSharing()) {
      return this._router.navigate(['shareLogin'], {queryParams: {sk: this._shareService.getSharingKey()}});
    } else {
      return this._router.navigate(['login']);
    }
  }

  public async toGallery() {
    console.log('toGallery');
    await this._shareService.wait();
    if (this._shareService.isSharing()) {
      return this._router.navigate(['gallery', ''], {queryParams: {sk: this._shareService.getSharingKey()}});
    } else {
      return this._router.navigate(['gallery', '']);
    }
  }
}
