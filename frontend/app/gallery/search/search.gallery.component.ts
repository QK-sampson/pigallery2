import {Component} from '@angular/core';
import {AutoCompleteService} from './autocomplete.service';
import {AutoCompleteItem, SearchTypes} from '../../../../common/entities/AutoCompleteItem';
import {ActivatedRoute, Params, RouterLink} from '@angular/router';
import {GalleryService} from '../gallery.service';
import {Config} from '../../../../common/config/public/Config';

@Component({
  selector: 'gallery-search',
  templateUrl: './search.gallery.component.html',
  styleUrls: ['./search.gallery.component.css'],
  providers: [AutoCompleteService, RouterLink]
})
export class GallerySearchComponent {

  autoCompleteItems: Array<AutoCompleteRenderItem> = [];
  public searchText: string = '';
  private cache = {
    lastAutocomplete: '',
    lastInstantSearch: ''
  };

  SearchTypes: any = [];

  private subscription = null;

  constructor(private _autoCompleteService: AutoCompleteService,
              private _galleryService: GalleryService,
              private _route: ActivatedRoute) {

    this.SearchTypes = SearchTypes;

    this.subscription = this._route.params.subscribe((params: Params) => {
      let searchText = params['searchText'];
      if (searchText && searchText != '') {
        this.searchText = searchText;
      }
    });
  }


  ngOnDestroy() {
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
    }
  }

  onSearchChange(event: KeyboardEvent) {

    let searchText = (<HTMLInputElement>event.target).value.trim();

    if (Config.Client.Search.autocompleteEnabled && this.cache.lastAutocomplete != searchText) {
      this.cache.lastAutocomplete = searchText;
      this.autocomplete(searchText);
    }

    if (Config.Client.Search.instantSearchEnabled && this.cache.lastInstantSearch != searchText) {
      this.cache.lastInstantSearch = searchText;
      this._galleryService.instantSearch(searchText);
    }
  }

  public onSearch() {
    if (Config.Client.Search.enabled) {
      this._galleryService.search(this.searchText);
    }
  }

  public search(item: AutoCompleteItem) {
    this.searchText = item.text;
    this.onSearch();
  }


  mouseOverAutoComplete: boolean = false;

  public setMouseOverAutoComplete(value: boolean) {
    this.mouseOverAutoComplete = value;
  }

  public onFocusLost() {
    if (this.mouseOverAutoComplete == false) {
      this.autoCompleteItems = [];
    }
  }

  public onFocus() {
    this.autocomplete(this.searchText);
  }

  private emptyAutoComplete() {
    this.autoCompleteItems = [];
  }

  private async autocomplete(searchText: string) {
    if (!Config.Client.Search.autocompleteEnabled) {
      return;
    }
    if (searchText.trim() == '.') {
      return;
    }


    if (searchText.trim().length > 0) {
      try {
        const items = await this._autoCompleteService.autoComplete(searchText);
        this.showSuggestions(items, searchText);
      } catch (error) {
        console.error(error);
      }

    } else {
      this.emptyAutoComplete();
    }
  }

  private showSuggestions(suggestions: Array<AutoCompleteItem>, searchText: string) {
    this.emptyAutoComplete();
    suggestions.forEach((item: AutoCompleteItem) => {
      let renderItem = new AutoCompleteRenderItem(item.text, searchText, item.type);
      this.autoCompleteItems.push(renderItem);
    });
  }

  public setSearchText(searchText: string) {
    this.searchText = searchText;
  }

}

class AutoCompleteRenderItem {
  public preText: string = '';
  public highLightText: string = '';
  public postText: string = '';
  public type: SearchTypes;

  constructor(public text: string, searchText: string, type: SearchTypes) {
    let preIndex = text.toLowerCase().indexOf(searchText.toLowerCase());
    if (preIndex > -1) {
      this.preText = text.substring(0, preIndex);
      this.highLightText = text.substring(preIndex, preIndex + searchText.length);
      this.postText = text.substring(preIndex + searchText.length);
    } else {
      this.postText = text;
    }
    this.type = type;
  }
}

