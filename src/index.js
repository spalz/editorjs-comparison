// eslint-disable-next-line require-jsdoc
import Uploader from './uploader';
import buttonIcon from './svg/button-icon.svg';
require('./index.css').toString();

// eslint-disable-next-line require-jsdoc
export default class Comparison {
  /**
   * @param {CarousellData} data - previously saved data
   * @param {CarouselConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;
    this.data = data;
    this.IconClose = '<svg class="icon icon--cross" width="12px" height="12px"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#cross"></use></svg>';
    this.config = {
      endpoints: config.endpoints || '',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || 'image',
      types: config.types || 'image/*',
      captionPlaceholder: this.api.i18n.t('Caption'),
      buttonContent: config.buttonContent || '',
      uploader: config.uploader || undefined
    };
    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error)
    });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'cdxcarousel-comparison-wrapper',
      addButton: 'cdxcarousel-comparison-addImage',
      block: 'cdxcarousel-comparison-block',
      item: 'cdxcarousel-comparison-item',
      removeBtn: 'cdxcarousel-comparison-removeBtn',
      inputUrl: 'cdxcarousel-comparison-inputUrl',
      caption: 'cdxcarousel-comparison-caption',
      list: 'cdxcarousel-comparison-list',
      imagePreloader: 'image-tool__image-preloader'
    };
  };

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      title: 'Сравнение',
      icon: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.8438 13.6875L20.9375 10.9375M20.9375 10.9375L17.8438 8.1875M20.9375 10.9375H1M4.09375 13.6875L1 10.9375M1 10.9375L4.09375 8.1875" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="square" stroke-linejoin="bevel" fill="none"/><path d="M10.9688 19.875V2" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="square" stroke-linejoin="bevel" fill="none"/></svg>'
    };
  }

  /**
   * Renders Block content
   * @public
   *
   * @return {HTMLDivElement}
   */
  render() {
    /*
     * Structure
     * <wrapper>
     *  <list>
     *    <item/>
     *    ...
     *  </list>
     *  <addButton>
     * </wrapper>
     */
    // Создаем базу для начала
    this.wrapper = make('div', [ this.CSS.wrapper ]);
    this.list = make('div', [ this.CSS.list ]);
    this.addButton = this.createAddButton();

    this.list.appendChild(this.addButton);
    this.wrapper.appendChild(this.list);
    if (this.data.length > 0) {
      console.log('load_item render', this.data);
      for (const load of this.data) {
        const loadItem = this.creteNewItem(load.url, load.caption);

        this.list.insertBefore(loadItem, this.addButton);
      }
    }
    return this.wrapper;
  }

  // eslint-disable-next-line require-jsdoc
  save(blockContent) {
    const list = blockContent.getElementsByClassName(this.CSS.item);
    const data = [];

    if (list.length > 0) {
      for (const item of list) {
        if (item.firstChild.value) {
          data.push({
            url: item.firstChild.value,
            caption: item.lastChild.value
          });
        }
      }
    }
    return data;
  }

  /**
   * Create Image block
   * @public
   *
   * @param {string} url - url of saved or upload image
   * @param {string} caption - caption of image
   *
   * Structure
   * <item>
   *  <url/>
   *  <removeButton/>
   *  <img/>
   *  <caption>
   * </item>
   *
   * @return {HTMLDivElement}
   */
  creteNewItem(url, caption) {
    // Create item, remove button and field for image url
    const block = make('div', [ this.CSS.block ]);
    const item = make('div', [ this.CSS.item ]);
    const removeBtn = make('div', [ this.CSS.removeBtn ]);
    const imageUrl = make('input', [ this.CSS.inputUrl ]);
    const imagePreloader = make('div', [ this.CSS.imagePreloader ]);

    imageUrl.value = url;
    removeBtn.innerHTML = this.IconClose;
    removeBtn.addEventListener('click', () => {
      block.remove();
    });
    removeBtn.style.display = 'none';

    item.appendChild(imageUrl);
    item.appendChild(removeBtn);
    block.appendChild(item);
    /*
     * If data already yet
     * We create Image view
     */
    if (url) {
      this._createImage(url, item, caption, removeBtn);
    } else {
      item.appendChild(imagePreloader);
    }
    return block;
  }

  /**
   * Create Image View
   * @public
   *
   * @param {string} url - url of saved or upload image
   * @param {HTMLDivElement} item - block of created image
   * @param {string} captionText - caption of image
   * @param {HTMLDivElement} removeBtn - button for remove image block
   *
   * @return {HTMLDivElement}
   */
  _createImage(url, item, captionText, removeBtn) {
    const image = document.createElement('img');
    const caption = make('input', [this.CSS.caption, this.CSS.input]);

    image.src = url;
    if (captionText) {
      caption.value = captionText;
    }
    caption.placeholder = this.config.captionPlaceholder;

    removeBtn.style.display = 'flex';

    item.appendChild(image);
    item.appendChild(caption);
  }

  /**
   * File uploading callback
   * @private
   *
   * @param {Response} response
   */
  onUpload(response) {
    if (response.success && response.file) {
      // Берем последний созданный элемент и ставим изображение с сервера
      console.log(this.list);
      console.log(this.list.childNodes.length);
      console.log(this.list.childNodes.length - 1);
      this._createImage(response.file.url, this.list.childNodes[this.list.childNodes.length - 2].firstChild, '', this.list.childNodes[this.list.childNodes.length - 2].firstChild.childNodes[1]);
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.childNodes[2].style.backgroundImage = '';
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.firstChild.value = response.file.url;
      this.list.childNodes[this.list.childNodes.length - 2].firstChild.classList.add('cdxcarousel-comparison-item--empty');
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   * @private
   *
   * @param {string} errorText
   */
  uploadingFailed(errorText) {
    console.log('Сравнение: загрузка не удалась из-за', errorText);

    this.api.notifier.show({
      message: this.api.i18n.t('Не получается загрузить изображение, попробуйте другое'),
      style: 'error'
    });
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
  }

  // eslint-disable-next-line require-jsdoc
  onSelectFile() {
    // Создаем элемент
    this.uploader.uploadSelectedFile({
      onPreview: (src) => {
        const newItem = this.creteNewItem('', '');

        newItem.firstChild.lastChild.style.backgroundImage = `url(${src})`;
        console.log('preload', newItem.firstChild.lastChild);
        this.list.insertBefore(newItem, this.addButton);
        console.log(src);
      }
    });
  }

  /**
   * Create add button
   * @private
   */
  createAddButton() {
    const addButton = make('div', [this.CSS.button, this.CSS.addButton]);
    const block = make('div', [ this.CSS.block ]);

    addButton.innerHTML = `${buttonIcon} Изображение для сравнения`;
    addButton.addEventListener('click', () => {
      this.onSelectFile();
    });
    block.appendChild(addButton);

    return block;
  }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {array|string} classNames  - list or name of CSS class
 * @param  {Object} attributes        - any attributes
 * @return {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    el[attrName] = attributes[attrName];
  }

  return el;
};
