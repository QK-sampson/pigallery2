import {SettingsService} from '../settings.service';

export abstract class AbstractSettingsService<T> {

  constructor(public _settingsService: SettingsService) {

  }

  get Settings() {
    return this._settingsService.settings;
  }


  public getSettings(): Promise<void> {
    return this._settingsService.getSettings();
  }

  isSupported() {
    return true;
  }

  abstract updateSettings(settings: T): Promise<void>;
}
