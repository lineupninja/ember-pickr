import Component from '@ember/component';
import layout from '../templates/components/color-picker';

import mergeDeep from "../utils/mergeDeep";

import { computed }  from '@ember/object';
import { assert } from '@ember/debug';

import Pickr from 'pickr';

export default Component.extend({
  layout,

  didInsertElement() {
    this._super(...arguments);

    this._setupPickr();
  },

  _setupPickr() {
    this._options = {
      // Start state. If true 'disabled' will be added to the button's classlist.
      disabled: this.get('disabled') || false,

      // If set to false it would directly apply the selected color on the button and preview.
      comparison: this.get('comparison') !== false,

      // Default color
      default: this.get('value') || this.get('default') || 'fff',

      // Default color representation.
      // Valid options are `HEX`, `RGBA`, `HSVA`, `HSLA` and `CMYK`.
      defaultRepresentation: this.get('defaultRepresentation') || 'HEX',

      // Option to keep the color picker always visible. You can still hide / show it via
      // 'pickr.hide()' and 'pickr.show()'. The save button keeps his functionality, so if
      // you click it, it will fire the onSave event.
      showAlways: this.get('showAlways') || false,

      // Close pickr with this specific key.
      // Default is 'Escape'. Can be the event key or code.
      closeWithKey: this.get('closeWithKey') || 'Escape',

      // Defines the position of the color-picker. Available options are
      // top, left and middle relative to the picker button.
      // If clipping occurs, the color picker will automatically choose his position.
      position: this.get('position') || 'middle',

      // Enables the ability to change numbers in an input field with the scroll-wheel.
      // To use it set the cursor on a position where a number is and scroll, use ctrl to make steps of five
      adjustableNumbers: this.get('adjustableNumbers') !== false,

      strings: {
        save: this.get('saveLabel') || 'Save',
        clear: this.get('clearLabel') || 'Clear'
      }
    };

    this._components = mergeDeep({
      palette: true,
      preview: true,
      opacity: true,
      hue: true,

      interaction: {
        hex: true,
        rgba: true,
        hsva: true,
        input: true,
        clear: true,
        save: true
      }
    }, this.get('components'));

    this._pickr = Pickr.create({
      el: this.element,

      ...this._options,

      components: {
        ...this._components
      }
    });

    this._pickr.on('init', () => {
      this.set('_value', this.formatColor(this._pickr.getColor()));
    });

    this._pickr.on('save', (...args) => {
      let [hsva, instance] = args;
      let value = this.formatColor(hsva);
      this.set('_value', value);

      if (this.onSave) {
        this.onSave(hsva, instance);
      }
    });

    this._pickr.on('change', (...args) => {
      let [hsva, instance] = args;
      if (this.onChange) {
        this.onChange(hsva, instance);
      }
    });
  },

  value: computed('_value', {
    get() {
      return this.get('_value');
    },

    set(key, value) {
      if (this._pickr) {
        let currentColor = this.formatColor(this._pickr.getColor());
        // This check is to avoid setting the same color twice one after another
        // Without this check, this will result in two computations for every color change
        if (currentColor !== value) {
          this._pickr.setColor(value);
        }
      }

      return value;
    }
  }),

  formatColor(hsva) {
    if (!hsva) {
      return null;
    }

    let value = hsva;
    let format = this.get('format');
    if (format) {
      format = format.toUpperCase();
      // backward compat till next major version
      if (format === 'HEX') {
        format = 'HEXA';
      }

      assert(
        '[ember-pickr]: Format must be one of HSVA, HSLA, RGBA, HEXA, CMYK',
        ['HSVA', 'HSLA', 'RGBA', 'HEXA', 'CMYK'].includes(format)
      );

      value = value[`to${format}`]().toString();
    }

    return value;
  },

  willDestroyElement() {
    this._pickr.destroyAndRemove();
    this._super(...arguments);
  }
});
