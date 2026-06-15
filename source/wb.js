/*
 * wb.js cross server and client javascript library
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * Extension class for the global this object.
 * @class globalThis
 * @singleton
 */
/** @property {Object} Wb The {#Wb} object. */
globalThis.Wb ??= {};
/** @property {Object} Globals Object for storing shared global variables. See {#Globals} for details. @priv */
globalThis.Globals = {
  isServer: !globalThis.window?.document,
  HasOwnProperty: Object.prototype.hasOwnProperty
};
/** @property {String} SysLang Current language in use. Default language for server-side, client's language for client-side. */
globalThis.SysLang = Globals.isServer ? Java.type('com.wb.common.Str').getLanguage(null) : Str.lang;
/**
 * Shared global variable storage object.
 * @class Globals
 * @singleton
 */
/** @property {Boolean} isServer Whether the script is running on the server side. */
/** @property {Function} HasOwnProperty The hasOwnProperty prototype method of objects. */

/**
 * Wb base JavaScript library for client and server programming.
 * @class Wb
 * @singleton
 */
// Extend Wb members
Object.assign(Wb, {
  /** @property {Boolean} - Whether the script is running on the server side. */
  isServer: Globals.isServer,
  /** @property {Object} classes All classes defined using {#Cls} are stored in this object, where the key is the
   * class short name and the value is the class.  */
  classes: {},
  regExp: {
    // Letters and underscore
    alpha: /^[a-zA-Z_]+$/,
    // Letters, underscore and number
    alphaNum: /^[a-zA-Z0-9_]+$/,
    // Unicode identifier
    identifier: /^[\p{L}_][\p{L}\p{N}_]*$/u,
    // Unicode identifier allow dot
    identifierDot: /^[\p{L}_][\p{L}\p{N}_.]*$/u,
    // Regular expressions that reference regular keywords
    quote: /[.?*+\^$\[\]\\(){}|\-]/g
  },
  /**
   * Convert the value to a JSON string.
   * See {#%JSON.stringify|obj:JSON/stringify} for details.
   * Example:
   *
   *     let text = Wb.encode({foo: "bar", abc: 123});
   *     // text value: '{"foo":"bar","abc":123}'
   *
   */
  encode: JSON.stringify,
  /**
   * Convert the string to a JavaScript value or object it describes.
   * See {#%JSON.parse|obj:JSON/parse} for details.
   * Example:
   *
   *     let object = Wb.decode('{"foo":"bar","abc":123}');
   *     // object value: {foo: "bar", abc: 123}
   *
   */
  decode: JSON.parse,
  /**
   * Determines whether the value is an array.
   * See {#%Array.isArray|obj:Array/isArray} for details.
   * Example:
   *
   *     let result = Wb.isArray([1, 2, 3]);
   *     // result: true
   *
   */
  isArray: Array.isArray,
  /**
   * Copies the values of all enumerable properties from one or more source objects to the target object.
   * See {#%Object.assign|obj:object/assign} for details.
   * Example:
   *
   *     let result = Wb.apply({foo: 'abc'}, {bar: 123});
   *     // result: {foo: 'abc', bar: 123}
   *     // equals to: let result = {...{foo: 'abc'}, ...{bar: 123}};
   *
   */
  apply: Object.assign,
  /** @property {String} - Uninterruptive space character, its ASCII code value is 160. */
  nbsp: '\u00A0',
  /**
   * Empty function.
   */
  emptyFn: function () { },
  /** @property {Object} - Empty object. */
  emptyObject: {},
  /** @property {Number} maxInt The maximum integer value. The value is `2147483647`. */
  maxInt: 2147483647,
  /**
   * Throw an exception with the specified message and code.
   * Example:
   *
   *     Wb.raise('error message');
   *     Wb.raise('save error.', 'file modified');
   *
   * @param {Object} msg Exception object or message.
   * @param {String} code Exception code.
   * @param {Object} error Cause error to log.
   */
  raise(msg, code, error) {
    if (error !== undefined) {
      console.error(error);
    }
    if (code)
      throw '##' + code + ':' + msg; // don't use new Error to avoid the error keyword
    else
      throw new Error(msg);
  },
  /**
   * Converts the value to a JSON string with the specified formatting.
   * @param {Object} object The object needs to be converted.
   * @return {String} Formatted JSON string.
   */
  encodePretty(object) {
    return Wb.encode(object, null, 2);
  },
  /**
   * Execute all destroy function in the object. All Objects, Arrays, Maps or Sets will be traversed, and the destroy
   * function contained in them will be executed.
   * Example:
   *
   *     Wb.destroy([obj1, obj2, obj3]);
   *
   * @param {Object/Array/Set/Map/Wb.Base} object The object or traversable that needs to execute the destroy function.
   */
  destroy(object) {
    if (!object)
      return;
    if (Wb.isArray(object) || Wb.isSet(object) || Wb.isMap(object))
      object.forEach(item => Wb.destroyIf(item));
    else if (object instanceof Wb.Base)
      Wb.destroyIf(object);
    else if (Wb.isObject(object))
      Wb.each(object, (a, v) => Wb.destroyIf(v));
  },
  /**
   * Execute the destroy method of the object, if destroy method exists.
   * @param {Object} object The object.
   */
  destroyIf(object) {
    Wb.isFunction(object?.destroy) && object.destroy();
  },
  /**
   * Returns the object represented by the script. Please note that using this method will parse and execute
   * any script. Please ensure that the script source is reliable.
   * @param {String} script Script to be executed.
   * @return {Object} Object returned after executing the script.
   */
  eval(script) {
    return new Function('return ' + script)();
  },
  /** @property {Function} - Alias of compare method of Intl.Collator. */
  compare: new Intl.Collator(SysLang).compare,
  /** @property {Function} - Case insensitive comparison method alias of Intl.Collator. */
  lowerCompare: new Intl.Collator(SysLang, { sensitivity: 'accent' }).compare,
  /**
   * Compares characters, numbers, or date equivalents and returns the comparison results.
   * @param {Mix} a Source value for comparison
   * @param {Mix} b Dest value for comparison
   * @return {Number} Results of comparison.
   * -< 0: less than
   * -= 0: equal to
   * -> 0: greater than
   */
  mixCompare(a, b) {
    let i, j, c1, c2, v, nullA, nullB;

    nullA = a == null;
    nullB = b == null;
    if (nullA || nullB)
      return (nullA ? 0 : 1) - (nullB ? 0 : 1);
    if (Wb.isDate(a) && Wb.isDate(b))
      return a.getTime() - b.getTime();
    if (Wb.isNumber(a) && Wb.isNumber(b))
      return a - b;
    a = String(a);
    b = String(b);
    j = a.length;
    for (i = 0; i < j; i++) {
      c1 = a.charCodeAt(i);
      c2 = b.charCodeAt(i);
      if (isNaN(c2))
        return 1;
      if (c1 > 0 && c1 < 128 || c2 > 0 && c2 < 128) {
        if (c1 >= 97 && c1 <= 122)
          c1 -= 32;
        if (c2 >= 97 && c2 <= 122)
          c2 -= 32;
        v = c1 - c2;
      } else {
        v = Wb.lowerCompare(a.charAt(i), b.charAt(i));
      }
      if (v != 0)
        return v;
    }
    if (b.length > j)
      return -1;
    return 0;
  },
  /**
   * Returns a boolean indicating whether this object has the specified property as its own property.
   * @param {Object} object The object to be checked.
   * @param {String/Symbol} name The String name or Symbol of the property to test.
   * @return {Boolean} `true` if the object has the specified property as own property; `false` otherwise.
   */
  hasProperty(object, name) {
    return Globals.HasOwnProperty.call(object, name);
  },
  /**
   * Create object instances by config object. If the instanced property of the object is `true`,
   * the object will be returned directly.
   * Example:
   *
   *     let object = Wb.create({cname: 'button'});
   *
   * @param {Object} configs Configuration object used to create instances.
   * @return {Wb.Base} The newly created object instance.
   */
  create(configs) {
    if (!configs || configs.instanced)
      return configs;
    return Wb.Configurable.create(configs);
  },
  /**
   * Add the suffix "px" after the number value. If the value is non number, it will be returned directly.
   * @param {Object} val Any value, `true` means ".5em". `false` means 0.
   * @return {String/Object} The string after adding "px" or value itself.
   */
  px(val) {
    if (val === true)
      return '.5em';
    if (val === false)
      return '0';
    return Wb.isNumber(val) ? val + 'px' : val;
  },
  /**
   * Convert an array to an object. The object key is an array member, and the value is true.
   * Example:
   *
   *     let object = Wb.toObject(['foo', 'bar']);
   *     // object: {foo: true, bar: true}
   *
   * @param {Array} array An array to be converted.
   * @return {Object} Converted object.
   */
  toObject(array) {
    let object = {};
    array.forEach(item => object[item] = true);
    return object;
  },
  /**
   * Convert the parameters in the object to URL encoded strings.
   * @param {Object} params The parameters object.
   * @return {String} URL encoded string.
   */
  encodeURL(params) {
    let join = false, result = '';
    Wb.each(params, (k, v) => {
      if (join)
        result += '&';
      else
        join = true;
      if (Wb.isObject(v) || Wb.isArray(v))
        v = Wb.encode(v);
      result += encodeURIComponent(k) + '=' + (v == null ? '' : encodeURIComponent(String(v)));
    });
    return result;
  },
  /**
   * Convert the name starting with "@" to the string corresponding to the name of the current region.
   * Example:
   *
   *     Wb.optText('@ok'); // returns "OK" in english
   *
   * @param {String} name The name.
   * @return {String} The string corresponding to the name or the string without "@" if not found.
   */
  optText(text) {
    if (text?.startsWith('@')) {
      text = text.substr(1);
      return Str[text] ?? text;
    } else return text;
  },
  /**
   * Convert the specified url to the sourceURL used to identify the script path.
   * @param {String} url URL path.
   * @return {String} Converted sourceURL.
   */
  getSourceURL(url) {
    return '//# sourceURL=' + (Wb.isServer ? SourceBuffer.sourceDomain :
      (location.origin + Wb.path + '/')) + url;
  },
  /**
   * Serialize the value. The difference from {#Wb.encode} is that it supports the serialization and deserialization
   * of date and function values. See {#Wb.deserialize} for deserialize.
   * @param {Object} value Value to serialize.
   * @return {String} Serialized text value.
   */
  serialize(value) {
    let doSerial;

    doSerial = v => {
      if (Wb.isString(v))
        return Wb.encode('!' + v);
      else if (Wb.isDate(v))
        return Wb.encode('@' + v.textValue);
      else if (Wb.isFunction(v))
        return Wb.encode('#' + v.toString());
      else if (Wb.isArray(v)) {
        let s = '[', addComma = false;
        v.forEach(v => {
          if (v !== undefined) {
            if (addComma)
              s += ',';
            else
              addComma = true;
            s += doSerial(v);
          }
        });
        s += ']';
        return s;
      } else if (Wb.isObject(v)) {
        let s = '{', addComma = false;
        Wb.each(v, (k, v) => {
          if (v !== undefined) {
            if (addComma)
              s += ',';
            else
              addComma = true;
            s += Wb.encode(k) + ':' + doSerial(v);
          }
        });
        s += '}';
        return s;
      } else
        return Wb.encode(v);
    };
    return doSerial(value);
  },
  /**
   * Deserialize the text serialized with the {#Wb.serialize} method and restore it to the value before
   * serialization. See {#Wb.serialize} for serialize.
   * @param {String/Object} value Serialized text or object value.
   * @param {Boolean} [noFunction] Whether to not restore the function. For security reasons, this parameter is always
   * `true` on the server side.
   * @return {Object} The value restored after deserialization.
   */
  deserialize(value, noFunction) {
    let doDeserial;

    if (Wb.isServer)
      noFunction = true;
    if (Wb.isString(value))
      value = Wb.decode(value);
    doDeserial = v => {
      if (Wb.isString(v)) {
        let body = v.substr(1);
        if (v.startsWith('@'))
          return body.dateValue;
        else if (v.startsWith('#')) {
          if (!noFunction) {
            try {
              return Wb.parse(body);
            } catch (e) {
              // Parsing functions of {fn() {}} format
              try {
                let name = body.substr(0, body.indexOf('('));
                return Wb.parse('{' + body + '}')[name];
              } catch (e) {
                return e?.toString();
              }
            }
          }
        } else
          return body;
      } else if (Wb.isArray(v)) {
        let newVal = [];
        v.forEach((val, i) => { newVal.push(doDeserial(val)) });
        return newVal;
      } else if (Wb.isObject(v)) {
        let newVal = {};
        Wb.each(v, (k, val) => { newVal[k] = doDeserial(val) });
        return newVal;
      } else {
        return v;
      }
    };
    return doDeserial(value);
  },
  /**
   * Converts the value to a string in the specified format. This method will directly call the `format` method
   * of `value`, and pass the format parameter.
   * Example:
   *
   *     // Format Numbers
   *     let val = Wb.format(1234, '#,##0.00');
   *     //val: 1,234.00
   *     //--------------------------------------------------------------------------
   *     // Format characters
   *     val = Wb.format('Name: {name}, Sex: {sex}', {name: 'Jeena', sex:'Female'});
   *     //val: Name: Jeena, Sex: Female'
   *     val = Wb.format('foo {0} bar {1} and {0}', 'abc', 123);
   *     //val: foo abc bar 123 and abc
   *     //--------------------------------------------------------------------------
   *     // Format date
   *     val = Wb.format(new Date('2021-3-10'), 'y-MM-dd');
   *     //val: 2021-03-10
   *
   * @param {Object} value Value to format.
   * @param {String} format Format text.
   * @return {String} The formatted string value. Returns `value` directly if `value` is `null`.
   */
  format(value, ...format) {
    return value == null ? value : value.format(...format);
  },
  /**
   * Convert the value to an array. If the value is an array, return the value directly. Otherwise, return the value
   * wrapped in the array.
   *
   *     array = Wb.toArray('foo'); // array: ['foo']
   *     bar = ['foo'];
   *     array = Wb.toArray(bar); // array: bar
   *
   * @param {Object} value Value to convert.
   * @return {Array} Converted array.
   */
  toArray(value) {
    return Wb.isArray(value) ? value : [value];
  },
  /**
   * Copy the properties of the configs object to the target object, and define the properties. The rules defined are:
   * - The method name starts with "get$" is the getter method, and its property name is the name after the $.
   * - The method name starts with "set$" is the setter method, and its property name is the name after the $.
   * - Others will be set directly to the target object.
   * @param {Object} object The target object.
   * @param {Object} [configs] Source configs object. Defaults means that the object is configs, and create a new object.
   * @return {Object} Target object itself.
   */
  define(object, configs) {
    let name, value, item, props = {};
    if (!configs) {
      configs = object;
      object = {};
    }
    for (name in configs) {
      value = configs[name];
      if (name.startsWith('get$')) {
        name = name.substr(4);
        item = props[name];
        if (item) {
          item.get = value;
        } else {
          item = props[name] = {
            configurable: true,
            get: value
          };
        }
      } else if (name.startsWith('set$')) {
        name = name.substr(4);
        item = props[name];
        if (item) {
          item.set = value;
        } else {
          item = props[name] = {
            configurable: true,
            set: value
          };
        }
      } else {
        object[name] = value;
      }
    }
    if (!Wb.isEmpty(props))
      Object.defineProperties(object, props);
    return object;
  },
  /**
   * Returns a random integer between 0 and maxInt, including 0 but excluding maxInt.
   * @param {Number} maxInt Limited maximum value.
   * @return {Number} Randomly generated number.
   */
  random(maxInt) {
    return Math.random() * maxInt | 0;
  },
  /**
   * Recursively traverses the object or array, executing the function for each item.
   * Example:
   *
   *     let items = [{param: 'one'}, {param: 'two', items: [{param: 'three'}]}];
   *     // output: one, two, three
   *     Wb.cascade(items, item => {console.log(item.param)}); // Using {} to prevent unexpected interruptions.
   *     Wb.cascade(parentNode, node => console.log(node), 'childNodes'); // Traverse all descendant nodes of the node
   *
   * @param {Object/Array} object The object or array to traverse.
   * @param {Function} fn Function to execute. Stops traversal if returns false; skips subitems if returns null.
   * @param {Object} fn.item Current item.
   * @param {Object} fn.parent Parent item.
   * @param {String} [itemsName] The property name of the child items. Defaults to "items".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [reverse] Whether to traverse sibling items in reverse.
   * @param {Boolean} [includeSelf] Whether to include the object itself when traversing.
   * @param {Object} [parent] Parent item parameter passed to `fn`.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  cascade(object, fn, itemsName, scope, reverse, includeSelf, parent) {
    if (!object)
      return true;
    let items, result, each;

    itemsName = itemsName ?? 'items';
    scope ??= object;
    if (includeSelf) {
      result = fn.call(scope, object, parent);
      if (result === false)
        return false;
      else if (result === null)
        return true;
    }
    each = item => {
      result = fn.call(scope, item, parent);
      if (result === false)
        return false;
      else if (result === null)
        return true;
      items = item[itemsName];
      if (items)
        return Wb.cascade(items, fn, itemsName, scope, reverse, false, item);
    };
    if (Wb.isFunction(object.each))
      return object.each(each, scope, reverse);
    else
      return Wb.PT.each.call(object, each, scope);
  },
  /**
   * Up traverses the object or array, executing the given method for each item.
   * Example:
   *
   *     let items = {param: 'one',parent: {param: 'two', parent: {param: 'three'}}};
   *     Wb.bubble(items, parent => {console.log(parent.param)}); // Using {} to prevent unexpected interruptions.
   *     // output: one, two, three
   *     Wb.bubble(childNode, parent => console.log(parent), 'parentNode');
   *     // Traverse all parent nodes of the node
   *
   * @param {Object} object The object to traverse.
   * @param {Function} fn Function to execute. Traversal will be interrupted if `false` is returned.
   * @param {Object} fn.parent Current parent.
   * @param {String} [parentName] The property name of the parent items. Defaults to "parent".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [excludeSelf] Whether to exclude the object itself when traversing.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  bubble(object, fn, parentName, scope, excludeSelf) {
    let parent;

    parentName = parentName ?? 'parent';
    scope ??= object;
    parent = excludeSelf ? object[parentName] : object;
    while (parent) {
      if (fn.call(scope, parent) === false) {
        return false;
      }
      parent = parent[parentName];
    }
    return true;
  },
  /**
   * Recursively traverses the object to find a matching item.
   * Example:
   *
   *     let object = {param: 'two', items: [{param: 'three'}]};
   *     let items = [{param: 'one'}, object];
   *     console.log(Wb.down(items, item => item.param === 'two'));
   *
   * @param {Object} object The object to traverse.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Boolean} [queryAll] Whether to return all matching items. Default return first item.
   * @param {String} [itemsName] The property name of the child items. Defaults to "items".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [includeSelf] Whether to include the object itself when traversing.
   * @return {Object/Array} If query all returns array with all matching items, else returns matching item or `null`.
   */
  down(object, fn, queryAll, itemsName, scope, includeSelf) {
    let result;

    scope ??= object;
    result = queryAll ? [] : null;
    Wb.cascade(object, item => {
      if (fn.call(scope, item)) {
        if (queryAll) {
          result.push(item);
        } else {
          result = item;
          return false;
        }
      }
    }, itemsName, true, false, includeSelf);
    return result;
  },
  /**
   * Recursively traverses the object to find all matching items.
   * @param {Object} object The object to traverse.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {String} [itemsName] The property name of the child items. Defaults to "items".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [includeSelf] Whether to include the object itself when traversing.
   * @return {Array} Array with all matching items. Returns empty array if none found.
   */
  downAll(object, fn, itemsName, scope, includeSelf) {
    return Wb.down(object, fn, true, itemsName, scope, includeSelf);
  },
  /**
   * Up traverses the object to find a matching item.
   * Example:
   *
   *     let object = {param: 'two', parent: {param: 'three'}};
   *     let items = {param: 'one', parent: object};
   *     console.log(Wb.up(items, parent => parent.param === 'two'));
   *
   * @param {Object} object The object to traverse.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.parent Current parent.
   * @param {Boolean} [queryAll] Whether to return all matching items. Default return first item.
   * @param {String} [parentName] The property name of the parent items. Defaults to "parent".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [excludeSelf] Whether to exclude the object itself when traversing.
   * @return {Object/Array} If query all returns array with all matching items, else returns matching item or `null`.
   */
  up(object, fn, queryAll, parentName, scope, excludeSelf) {
    let result;

    scope ??= this;
    result = queryAll ? [] : null;
    Wb.bubble(object, el => {
      if (fn.call(scope, el)) {
        if (queryAll) {
          result.push(el);
        } else {
          result = el;
          return false;
        }
      }
    }, parentName, true, excludeSelf);
    return result;
  },
  /**
   * Up traverses the object to find all matching items.
   * @param {Object} object The object to traverse.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.parent Current parent.
   * @param {String} [parentName] The property name of the parent items. Defaults to "parent".
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [excludeSelf] Whether to exclude the object itself when traversing.
   * @return {Array} Array with all matching items. Returns empty array if none found.
   */
  upAll(object, fn, parentName, scope, excludeSelf) {
    return Wb.up(object, fn, true, parentName, scope, excludeSelf);
  },
  /**
   * Finds the property name of the first matching item in the object.
   * Example:
   *
   *     Wb.find({foo: 123, bar: 'abc'}, (k, v) => v === 'abc'); // output "bar"
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {String} fn.key Property name of the current item.
   * @param {Object} fn.value Property value of the current item.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {String} Matching name or `undefined` if not found.
   */
  find(object, fn, scope) {
    let found;

    scope ??= object;
    Wb.each(object, (k, v) => {
      if (fn.call(scope, k, v)) {
        found = k;
        return false;
      }
    });
    return found;
  },
  /**
   * Finds the property names of all matching items in the object.
   * Example:
   *
   *     Wb.filter({foo: 123, bar: 'abc', bar1: 'abc'}, (k, v) => v === 'abc'); // output ["bar", "bar1"]
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {String} fn.key Property name of the current item.
   * @param {Object} fn.value Property value of the current item.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {String[]} Array with all matching names or empty array if none found.
   */
  filter(object, fn, scope) {
    let found = [];

    scope ??= object;
    Wb.each(object, (k, v) => {
      if (fn.call(scope, k, v)) {
        found.push(k);
      }
    });
    return found;
  },
  /**
   * Determines whether at least one item in the object matches.
   * Example:
   *
   *     Wb.some({foo: {name: 'Allen'}, bar: {name: 'David'}}, (k, v) => v.name == 'David'); // returns: true
   *
   * @param {Object} object The object to check.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {String} fn.key Property name of the current item.
   * @param {Object} fn.value Property value of the current item.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Boolean} `true` if at least one item matches, `false` otherwise.
   */
  some(object, ...args) {
    return Wb.PT.objectSome.apply(object, args);
  },
  /**
   * Determines whether all items in the object match.
   * Example:
   *
   *     Wb.every({foo: {name: 'Allen'}, bar: {name: 'David'}}, (k, v) => v.name == 'David'); // returns: false
   *
   * @param {Object} object The object to check.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {String} fn.key Property name of the current item.
   * @param {Object} fn.value Property value of the current item.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Boolean} `true` if all items match, `false` otherwise.
   */
  every(object, ...args) {
    return Wb.PT.objectEvery.apply(object, args);
  },
  /**
   * Flattens a nested array structure by recursively collecting all items including those nested
   * within descendant properties.
   * Example:
   *
   *     Wb.flatItems([{v: 1}, {v: 2, items: [{v: 3}, {v: 4}]}], true); // [{"v":1},{"v":2},{"v":3},{"v":4}]
   *
   * @param {Array} array Array to flatten.
   * @param {Boolean} [deleteItems] Whether to delete the property specified by `itemsName`.
   * @param {String} [itemsName] The property name of the child items. Defaults to "items".
   * @return {Array} A new flattened array containing all items from all levels of the original nested structure.
   */
  flatItems(array, deleteItems, itemsName) {
    let items = [];

    itemsName ??= 'items';
    Wb.cascade(array, item => items.push(item), itemsName);
    if (deleteItems)
      items.forEach(item => delete item[itemsName]);
    return items;
  },
  /**
   * Get the values of the specified names from object.
   * Example:
   *
   *     Wb.pluck({a: 123, b: 'abc', c: 'def'}, ['a', 'b']); // returns: [123, 'abc']
   *
   * @param {Object} object The source object to pluck values from.
   * @param {String[]} names Array of property names to pluck.
   * @return {Array} Array of values in the order corresponding to the names array.
   */
  pluck(object, names) {
    let result = [];
    names.forEach(k => result.push(object[k]));
    return result;
  },
  /**
   * Convert the specified object value into an HTML script.
   * @param {Object} object The object to convert.
   * @param {Boolean} [singleLine] Whether to display as a single line. `true` means line breaks will be converted to spaces.
   * @param {Boolean} [convertSpace] Whether to convert spaces to a single "&nbsp;", tabs to multiple "&nbsp;", and line
   * breaks to "<br>".
   * @return {String} The converted HTML string. Returns an empty string if the object value is null.
   */
  toHTML(object, singleLine, convertSpace) {
    return object == null ? '' : object.toString().toHTML(singleLine, convertSpace);
  },
  /**
   * Convert a color represented in RGB format to a hexadecimal format.
   * @param {String} color RGB color string.
   * @return {String} Hexadecimal color string.
   */
  rgbToHex(color) {
    let items = color.getPart('(', ')').splitTrim(), result = '#';

    items.forEach(item => {
      result += parseInt(item).toString(16).padStart(2, '0');
    });
    return result;
  },
  /**
   * Sets value for the specified namespace. Creates namespace if it doesn't exist. See {#getNS} for gets namespace.
   * Example:
   *
   *     let result = Wb.setNS('a.b.c', 123); // Creates global a = {b: {c: 123}}, result is 123
   *
   * @param {String} namespace Path of the namespace.
   * @param {Object} [value] The value to be assigned to the namespace. If this parameter is undefined, the behavior is as
   * follows: if the target namespace does not exist, it will be initialized with an empty object ({}); if the namespace
   * already exists, its current value will remain unchanged.
   * @param {Object} [scope] Root object for namespace. Defaults to `globalThis`.
   * @param {String} [separater] Path separator. Defaults to ".".
   * @return {Object} The value of the namespace.
   */
  setNS(namespace, value, scope, separater) {
    let i, j, name, nameList = namespace.split(separater || '.');
    scope ??= globalThis;
    j = nameList.length - 1;
    for (i = 0; i < j; i++) {
      name = nameList[i];
      if (scope[name] == null)
        scope[name] = {};
      scope = scope[name];
    }
    name = nameList[j];
    if (value === undefined) {
      if (scope[name] === undefined)
        scope[name] = {};
      return scope[name];
    } else {
      scope[name] = value;
      return value;
    }
  },
  /**
   * Gets value from the specified namespace. See {#setNS} for sets namespaces.
   * Example:
   *
   *     let object = {a: {b: {c: 0}}};
   *     let result = Wb.getNS('a.b.c', object);
   *     // result: 0
   *
   * @param {String} namespace Path of the namespace.
   * @param {Object} [scope] Root object for namespace. Defaults to `globalThis`.
   * @param {String} [separater] Path separator. Defaults to ".".
   * @return {Object} The value of the specified namespace, returns undefined if not exists.
   */
  getNS(namespace, scope, separater) {
    let i, j, name, value, nameList = namespace.split(separater || '.');
    value = scope ?? globalThis;
    j = nameList.length;
    for (i = 0; i < j; i++) {
      name = nameList[i];
      value = value[name];
      if (value === undefined)
        return undefined;
    }
    return value;
  },
  /**
   * Normalizes a path. Processes "./" and "../" segments according to their semantic meaning and resolves to the final path.
   * Example:
   *
   *     Wb.normalizePath('./abc/../def/gh'); // returns: "def/gh"
   *
   * @param {String} path The path to normalize.
   * @return {String} The normalized path.
   */
  normalizePath(path) {
    if (!path.includes('./'))
      return path;
    let i, j = path.length, segments = [], start = 0, seg;

    for (i = 0; i <= j; i++) {
      if (i === j || path[i] === '/') {
        seg = path.substring(start, i);
        start = i + 1;
        if (seg === '..') {
          segments.pop();
        } else if (seg !== '.') {
          segments.push(seg);
        }
      }
    }
    return segments.join('/');
  },
  /**
   * Gets the directory portion of a path.
   * Example:
   *
   *     Wb.getDirectory('aa/bb/cc'); // returns: "aa/bb/"
   *     Wb.getDirectory('aa/bb/cc/'); // returns: "aa/bb/cc/"
   *     Wb.getDirectory('aa'); // returns: (empty string)
   *
   * @param {String} path The path to process.
   * @return {String} The directory portion of the path. Returns empty string if path is null.
   */
  getDirectory(path) {
    if (!path)
      return '';
    let p = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

    if (p == -1)
      return '';
    else
      return path.substr(0, p + 1);
  },
  /**
   * Gets the parent directory path from a given path.
   * Example:
   *
   *     Wb.getParentDirectory('aa/bb/cc'); // returns: "aa/bb/"
   *     Wb.getParentDirectory('aa/bb/cc/'); // returns: "aa/bb/"
   *     Wb.getParentDirectory('aa'); // returns: (empty string)
   *
   * @param {String} path The path to process.
   * @return {String} The parent directory path. Returns empty string if path is null.
   */
  getParentDirectory(path) {
    if (!path)
      return '';
    if (path.endsWith('/'))
      path = path.slice(0, -1);
    return Wb.getDirectory(path);
  },
  /**
   * Gets the filename from a path.
   * Example:
   *
   *     Wb.getFilename('aa/bb.txt'); // returns: "bb.txt"
   *
   * @param {String} path The file path.
   * @return {String} The filename. Returns an empty string if the path is null/empty or ends with "/" or "\"
   */
  getFilename(path) {
    if (!path)
      return '';
    let p = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

    if (p == -1)
      return path;
    else
      return path.substring(p + 1);
  },
  /**
   * Gets the file extension from a file path.
   * Example:
   *
   *     Wb.getFileExt('aa/bb.txt'); // returns: "txt"
   *
   * @param {String} path The file path.
   * @return {String} The file extension. Returns an empty string if path is null.
   */
  getFileExt(path) {
    if (path) {
      let pos = path.lastIndexOf('.');
      if (pos != -1) {
        let ext = path.substring(pos + 1);
        if (ext.includes('/') || ext.includes('\\'))
          return '';
        else
          return ext;
      }
    }
    return '';
  },
  /**
   * Gets the URL of a module file based on its relative path.
   * Example:
   *
   *     Wb.getModuleUrl('foo/bar.xwl'); // returns: "m?xwl=foo/bar"
   *
   * @param {String} path The relative path of the module file.
   * @return {String} The URL of the module file.
   */
  getModuleUrl(path) {
    if (path.startsWith('m?xwl='))
      return path;
    else if (path.endsWith('.xwl'))
      return 'm?xwl=' + path.slice(0, -4);
    else
      return path;
  },
  /**
   * Gets the icon corresponding to the file type of a filename.
   * @param {String} filename The filename.
   * @return {String} The icon name.
   */
  getFileIcon(filename) {
    const iconMap = {
      xwl: 'module', 'js': 'file-js', 'javascript': 'file-js', css: 'file-css', sql: 'file-sql',
      png: 'file-png', jpg: 'file-jpg', jpeg: 'file-jpg', gif: 'gif', bmp: 'image', json: 'file-json',
      jsp: 'file-java', jar: 'file-java', html: 'file-html', htm: 'file-html', xml: 'file-xml', webp: 'image',
      java: 'file-java', txt: 'file-txt', doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel', pptx: 'ppt',
      ppt: 'ppt', mjs: 'mjs', zip: 'zip', pdf: 'pdf', mp3: 'mp3', mp4: 'mp4', py: 'python', r: 'r', flw: 'flow1'
    };
    return iconMap[Wb.getFileExt(filename)] ?? 'file'
  },
  /**
   * Determines whether the filename is an image file.
   * @param {String} filename The filename.
   * @return {Boolean} `true` if it's an image file, `false` otherwise.
   */
  isImageFile(filename) {
    const types = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return types.includes(Wb.getFileExt(filename));
  },
  /**
   * Gets the filename without its extension from a path.
   * Example:
   *
   *     Wb.getNormalName('foo/bar.xwl'); // returns: "bar"
   *
   * @param {String} path The file path.
   * @return {String} The filename without extension. Returns an empty string if path is null.
   */
  getNormalName(path) {
    let filename = Wb.getFilename(path), pos = filename.lastIndexOf('.');

    return pos == -1 ? filename : filename.substr(0, pos);
  },
  /**
   * Parses a value into a boolean. Returns `false` for "false" (case insensitive), "f" (case insensitive),
   * "0" and falsy values, otherwise returns true.
   * @param {Object} value The value to be parsed.
   * @return {Boolean} The parsed boolean value.
   */
  parseBool(value) {
    return !!value && value !== '0' && value !== 'f' && value !== 'F' && String(value).toLowerCase() !== 'false';
  },
  /**
   * Parses a text date in the specified format to a date value. For the date format, please refer to the
   * {#Date.format} method.
   * Example:
   *
   *     let result =  Wb.parseDate('2021-3-10 15:13:12.18', 'y-MM-dd HH:mm:ss.S');
   *
   * @param {String} value The text date to be converted.
   * @param {String} [format] The date format. By default, if the length of value is less than 8, it uses {#Date.ymFormat}; if
   * the length is less than 11 and contains ":", it uses {#Date.timeFormat}, otherwise, it uses {#Date.dateFormat}; for others,
   * it uses {#Date.dateTimeFormat}.
   * @param {Boolean} [defaultNow] Whether to use the current date time for the default date time.
   * -null: default value is Jan 01 1970.
   * -false: default value is today, and time part is 0.
   * -true: default value is today, and hour part is current hour, others is 0.
   * @return {Date} The converted date value. Returns null if the value is invalid.
   */
  parseDate(value, format, defaultNow) {
    if (!value)
      return null;
    if (!format) {
      let len = value.length;
      if (len < 8)
        format = Date.ymFormat;
      else if (len < 11)
        format = value.includes(':') ? Date.timeFormat : Date.dateFormat;
      else
        format = Date.dateTimeFormat;
      if (value.includes('/'))
        format = format.replaceAll('-', '/');
    }
    let date, sign, i, j, k, c, p, y, m, d, h, n, s, z, len = value.length;

    j = format.length;
    p = 0;
    for (i = 0; i < j; i++) {
      c = format.charAt(i);
      if (p >= len) {
        format = format.substr(i);
        if (format == '.S' || format == '.SSS')
          break;
        else
          return null;
      }
      switch (c) {
        case 'y':
          if (value.substr(p, 1) == '-') {
            sign = '-';
            p++;
          } else {
            sign = '';
          }
          if (format.substr(i, 4) === 'yyyy') {
            y = value.substr(p, 4);
            p += 4;
            i += 3;
          } else if (format.substr(i, 2) === 'yy') {
            y = '20' + value.substr(p, 2);
            p += 2;
            i++;
          } else {
            //y
            y = value.substr(p, 4);
            p += 4;
          }
          if (y.length != 4)
            return null;
          y = parseInt(sign + y);
          if (isNaN(y))
            return null;
          break;
        case 'M':
          if (format.charAt(i + 1) === 'M')
            i++;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          m = parseInt(value.substr(p, k)) - 1;
          if (isNaN(m) || m > 11 || m < 0)
            return null;
          p += k;
          break;
        case 'd':
          if (format.charAt(i + 1) === 'd')
            i++;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          d = parseInt(value.substr(p, k));
          if (isNaN(d) || d > 31 || d < 1)
            return null;
          p += k;
          break;
        case 'H':
          if (format.charAt(i + 1) === 'H')
            i++;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          h = parseInt(value.substr(p, k));
          if (isNaN(h) || h > 23 || h < 0)
            return null;
          p += k;
          break;
        case 'm':
          if (format.charAt(i + 1) === 'm')
            i++;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          n = parseInt(value.substr(p, k));
          if (isNaN(n) || n > 59 || n < 0)
            return null;
          p += k;
          break;
        case 's':
          if (format.charAt(i + 1) === 's')
            i++;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          s = parseInt(value.substr(p, k));
          if (isNaN(s) || s > 59 || s < 0)
            return null;
          p += k;
          break;
        case 'S':
          if (format.substr(i, 3) === 'SSS')
            i += 2;
          k = Wb.isDigit(value.substr(p + 1, 1)) ? 2 : 1;
          if (k === 2 && Wb.isDigit(value.substr(p + 2, 1)))
            k = 3;
          z = parseInt(value.substr(p, k).padEnd(3, '0'));
          if (isNaN(z) || z < 0)
            return null;
          p += k;
          break;
        default:
          if (value.charAt(p) != c)
            return null;
          p++;
      }
    }
    if (len != p)
      return null;
    if (defaultNow == null) {
      date = new Date(y ?? 1970, m ?? 0, d ?? 1, h ?? 0, n ?? 0, s ?? 0, z ?? 0);
    } else {
      let now = new Date();
      date = new Date(y ?? now.getFullYear(), m ?? now.getMonth(), d ?? now.getDate(),
        h ?? (defaultNow ? now.getHours() : 0), n ?? 0, s ?? 0, z ?? 0);
    }
    if (y > -1 && y < 100)
      date.setFullYear(y);
    if (!Wb.isServer) {
      let offset = Wb.configs.tzOffset;
      if (offset)
        date = date.addHour(-offset);
    }
    return date;
  },
  /**
   * Try to parse a text date to a date value. The difference from {#Wb.parseDate} is that it throws an exception
   * if the value parameter is non-null invalid value. See {#Wb.parseDate} for details.
   */
  tryParseDate(value, format, defaultNow) {
    let date = Wb.parseDate(value, format, defaultNow);
    if (value != null && !date)
      Wb.raise('"' + value + '" is not a valid date.');
    return date;
  },
  /**
   * Copies properties from the source object to the destination object only if they don't already exist in the destination.
   * Example:
   *
   *     Wb.applyIf({foo: 'abc'}, {foo: 'def', bar: 123}); // returns: {foo: 'abc', bar: 123}
   *
   * @param {Object} dest The destination object to copy properties to.
   * @param {Object} source The source object to copy properties from.
   * @return {Object} The `dest` object itself.
   */
  applyIf(dest, source) {
    Wb.each(source, (k, v) => {
      if (!(k in dest))
        dest[k] = v;
    });
    return dest;
  },
  /**
   * Copies all non-null and non-undefined properties from the source object to the destination object.
   * Example:
   *
   *     Wb.applyValue({foo: 'abc'}, {bar: 123, more: null}); // returns: {foo: 'abc', bar: 123}
   *
   * @param {Object} dest The destination object to copy properties to.
   * @param {Object} source The source object to copy properties from.
   * @return {Object} The `dest` object itself.
   */
  applyValue(dest, source) {
    Wb.each(source, (k, v) => {
      if (v != null)
        dest[k] = v;
    });
    return dest;
  },
  /**
   * Copies properties with the specified names from the source object to the destination object.
   * Example:
   *
   *     Wb.applyWith({foo: 'abc'}, {param1:'def', param2: 123}, ['param2']); // returns: {foo: 'abc', param2: 123}
   *
   * @param {Object} dest The destination object to copy properties to.
   * @param {Object} source The source object to copy properties from.
   * @param {Array/String} names The property names that need to be copied from the source object. If it's a string,
   * it represents names separated by commas.
   * @return {Object} The `dest` object itself.
   */
  applyWith(dest, source, names) {
    if (source) {
      if (Wb.isString(names))
        names = names.splitTrim();
      names.forEach(name => dest[name] = source[name]);
    }
    return dest;
  },
  /**
   * Copies all non-null and non-undefined properties with the specified names from the source object to the
   * destination object.
   * @param {Object} dest The destination object to copy properties to.
   * @param {Object} source The source object to copy properties from.
   * @param {Array/String} names The property names that need to be copied from the source object. If it's a string,
   * it represents names separated by commas.
   * @return {Object} The `dest` object itself.
   */
  applyValueWith(dest, source, names) {
    if (source) {
      let v;
      if (Wb.isString(names))
        names = names.splitTrim();
      names.forEach(name => {
        v = source[name];
        if (v != null)
          dest[name] = v;
      });
    }
    return dest;
  },
  /**
   * Copies properties without the specified names from the source object to the destination object.
   * Example:
   *
   *     Wb.applyWithout({foo: 'abc'}, {param1:'def', param2: 123},['param2']); // returns: {foo: 'abc', param1: 'def'}
   *
   * @param {Object} dest The destination object to copy properties to.
   * @param {Object} source The source object to copy properties from.
   * @param {Array/String} names The property names that need to be copied from the source object. If it's a string,
   * it represents names separated by commas.
   * @return {Object} The `dest` object itself.
   */
  applyWithout(dest, source, names) {
    if (source) {
      if (Wb.isString(names))
        names = names.splitTrim();
      Wb.each(source, (k, v) => {
        if (!names.includes(k))
          dest[k] = v;
      });
    }
    return dest;
  },
  /**
   * Copies and merges all properties from source objects to the destination object. The difference between this method
   * and the {#apply} method is that object members with the same name will be merged deeply.
   * Example:
   *
   *     let foo = {a: {v1: 1, v2: 2}, b: 'abc'};
   *     let bar = {a: {v3: 3, v4: 4}, c: 'xyz'};
   *     let result = Wb.applyMerge(foo, bar);
   *     // result: {a: {v1: 1, v2: 2, v3: 3, v4: 4}, b: 'abc', c: 'xyz'};
   *
   * @param {Object} dest The destination object to copy properties to. Defaults to ({}).
   * @param {...Object} source The source objects to copy properties from
   * @return {Object} The `dest` object itself.
   */
  applyMerge(object, ...source) {
    let oldV;

    object ??= {};
    source.forEach(arg => {
      if (arg) {
        Wb.each(arg, (k, v) => {
          oldV = object[k];
          if (Wb.isObject(v) && Wb.isObject(oldV)) {
            Wb.applyMerge(oldV, v);
          } else {
            object[k] = v;
          }
        });
      }
    });
    return object;
  },
  /**
   * Copies all properties from an object to a new object. The newly created object is a shallow copy. For deep cloning
   * object, please use the {#clone} method.
   * Example:
   *
   *     let object = {foo: 'bar', obj: {val: 123}};
   *     let copyObject = Wb.copy(object);
   *     copyObject.foo = 'other';
   *     copyObject.obj.val = 456;
   *     console.log(object);
   *     // output: {foo: 'bar', obj: {val: 456}}
   *
   * @param {Object} source The source object to be copied.
   * @return {Object} The new object shallow copy.
   */
  copy(source) {
    return Wb.apply({}, source);
  },
  /**
   * Clones all properties from an object to a new object. The newly created object is a deep clone. For shallow copying
   * object, please use the {#copy} method.
   * Example:
   *
   *     let object = {foo: 'bar', obj: {val: 123}};
   *     let cloneObject = Wb.clone(object);
   *     cloneObject.obj.val = 456;
   *     console.log(object);
   *     //output: {foo: 'bar', obj: {val: 123}}
   *
   * @param {Object} source The source object to be cloned.
   * @return {Object} The new object deep clone.
   */
  clone(item) {
    if (!item)
      return item;
    else if (Array.isArray(item)) {
      let clone, i = item.length;
      clone = [];
      while (i--) {
        clone[i] = Wb.clone(item[i]);
      }
      return clone;
    } else if (Wb.isObject(item)) {
      let clone;
      clone = {};
      Wb.each(item, (k, v) => { clone[k] = Wb.clone(v); });
      return clone;
    } else
      return item;
  },
  /**
   * Finds and returns the value associated with the specified key in the given object, ignoring case.
   * @param {Object} object The object to search within.
   * @param {String} key The key whose associated value is to be returned.
   * @return {*} The value associated with the specified key, or undefined if no matching key is found.
   */
  findValue(object, key) {
    if (key == null) return undefined;
    let lowerKey = key.toLowerCase(), result;
    Wb.each(object, (k, v) => {
      if (k.toLowerCase() === lowerKey) {
        result = v;
        return false;
      }
    });
    return result;
  },
  /**
   * Traverses the object, executing the given method for each owned property.
   * Example:
   *
   *     let object = {foo: 123, bar: 'abc'};
   *     Wb.each(object, (k, v) => {console.log(k)}); // Using {} to prevent unexpected interruptions.
   *     // output: foo, bar
   *
   * @param {Object} object The object to traverse.
   * @param {Function} fn Function to execute. Traversal will be interrupted if `false` is returned.
   * @param {String} fn.key The name of current property.
   * @param {Object} fn.value The value of current property.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  each(object, fn, scope) {
    if (!object) return true;
    return Wb.PT.each.call(object, fn, scope ?? object);
  },
  /**
   * Marks multiple parameter values in an array for submission as multiple parameters with the same name, and returns
   * a new array. When submitting an array value as a parameter, if marked with this method, it will submit multiple
   * parameters with the same name; otherwise, it will encode the array value using {#encode}.
   * @param {Array} array The array to be marked.
   * @return {Array} The new marked array.
   */
  markParams(array) {
    array = array.copy();
    array.canIterable = true;
    return array;
  },
  /**
   * Determines whether the specified string consists only of letters and underscores.
   * @param {String} str The string to check.
   * @return {Boolean} `true` if valid, `false` otherwise.
   */
  isAlpha(str) {
    return str != null && Wb.regExp.alpha.test(str);
  },
  /**
   * Determines whether the specified string consists only of letters, underscores, and numbers.
   * @param {String} str The string to check.
   * @return {Boolean} `true` if valid, `false` otherwise.
   */
  isAlphaNum(str) {
    return str != null && Wb.regExp.alphaNum.test(str);
  },
  /**
   * Determines whether the specified string is a valid Unicode identifier.
   * @param {String} str The string to check.
   * @param {Boolean} allowDot Whether dots are allowed in the identifier.
   * @return {Boolean} `true` if valid, `false` otherwise.
   */
  isIdentifier(str, allowDot) {
    return str != null && (allowDot ? Wb.regExp.identifierDot.test(str) : Wb.regExp.identifier.test(str));
  },
  /**
   * Determines whether a value is a JavaScript object.
   * Example:
   *
   *     Wb.isObject({foo: 'bar'}); // true
   *     Wb.isObject(new Object()); // true
   *     Wb.isObject(treeComp); // true
   *     Wb.isObject('abc'); // false
   *
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is an object, `false` otherwise.
   */
  isObject(value) {
    return toString.call(value) === '[object Object]';
  },
  /**
   * Determines whether a value is a Map.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a Map, `false` otherwise.
   */
  isMap(value) {
    return toString.call(value) === '[object Map]';
  },
  /**
   * Determines whether a value is a Set.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a Set, `false` otherwise.
   */
  isSet(value) {
    return toString.call(value) === '[object Set]';
  },
  /**
   * Determines whether a value is a String.
   * Example:
   *
   *     Wb.isString('foo'); // true
   *     Wb.isString(123); // false
   *
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a String, `false` otherwise.
   */
  isString(value) {
    return typeof value === 'string';
  },
  /**
   * Determines whether a value is a String, Number, or Boolean.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a primitive type, `false` otherwise.
   */
  isPrimitive(value) {
    let type = typeof value;

    return type == 'string' || type == 'number' || type == 'boolean';
  },
  /**
   * Determines whether a value is a JavaScript function.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a JavaScript function, `false` otherwise.
   */
  isFunction(value) {
    return typeof value === 'function';
  },
  /**
   * Determines whether a value is a Number.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a Number, `false` otherwise.
   */
  isNumber(value) {
    return typeof value === 'number';
  },
  /**
   * Determines whether a value is a Number or a string representing a numeric value.
   * Example:
   *
   *     Wb.isNumeric(12.3); // true
   *     Wb.isNumeric('12.3'); // true
   *     Wb.isNumeric('1a3'); // false
   *
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a numeric, `false` otherwise.
   */
  isNumeric(value) {
    return Wb.isNumber(value) || !isNaN(parseFloat(value)) && isFinite(value);
  },
  /**
   * Determines whether a value is a digit between 0-9.
   * @param {String} value The value to check.
   * @return {Boolean} `true` if the value is a digit, `false` otherwise.
   */
  isDigit(value) {
    return value >= '0' && value <= '9';
  },
  /**
   * Determines whether a value is a Date.
   * Example:
   *
   *     Wb.isDate(new Date()); // true
   *     Wb.isDate(123); // false
   *
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a Date, `false` otherwise.
   */
  isDate(value) {
    return toString.call(value) === '[object Date]';
  },
  /**
   * Determines whether a value is a boolean.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is a boolean, `false` otherwise.
   */
  isBoolean(value) {
    return typeof value === 'boolean';
  },
  /**
   * Determines whether a value is iterable.
   * @param {Object} value The value to check.
   * @param {Boolean} particular `true` to check for iterable types excluding Strings and Arrays without the
   * "canIterable" property, `false` to check all iterable types.
   * @return {Boolean} `true` if the value is iterable, `false` otherwise.
   */
  isIterable(value, particular) {
    if (particular && (Wb.isString(value) || Wb.isArray(value) && !value.canIterable))
      return false;
    return value && typeof value[Symbol.iterator] === 'function';
  },
  /**
   * Determines whether an object is Array like. This includes {#Array}, {#Set} or objects containing the "xLikeArray"
   * property set to `true`.
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is Array like, `false` otherwise.
   */
  likeArray(value) {
    return value?.xLikeArray;
  },
  /**
   * Wraps an iterable function into an object that can be processed as an array.
   * Example:
   *
   *     let array = Wb.wrapArray(fn => {
   *       // such as read data from stream or database
   *       fn({field1: 'abc', field2: 123});
   *       fn({field1: 'def', field2: 456});
   *     });
   *     Wb.syncFree({tableName: 'tableName', insert: array});
   *
   * @param {Function} forEach The forEach method.
   * @param {Object} .fn The method to execute when iterating over each item.
   * @param {Object} ..item The current item.
   * @param {Number} ..index The current index.
   * @return {Object} An iterable object.
   */
  wrapArray(forEach) {
    return { length: 1, xLikeArray: true, forEach };
  },
  /**
   * Determines whether a value is an empty value. Empty values are null, undefined, "", empty arrays, empty objects,
   * and other objects with a length property of 0.
   * Example:
   *
   *     Wb.isEmpty(''); // true
   *     Wb.isEmpty([]); // true
   *     Wb.isEmpty({}); // true
   *     Wb.isEmpty(null); // true
   *     Wb.isEmpty(0); // false
   *
   * @param {Object} value The value to check.
   * @return {Boolean} `true` if the value is an empty value, `false` otherwise.
   */
  isEmpty(value) {
    return value == null || value.length === 0 || Wb.isObject(value) && !Object.keys(value).length;
  },
  /**
   * Concatenates multiple arrays and returns the concatenated array.
   * @param {...Array} arrays The arrays to concatenate.
   * @return {Array} The concatenated array or empty array if no arrays.
   */
  concat(...arrays) {
    let arr = [];

    arrays?.forEach(item => {
      if (item)
        arr = arr.concat(item)
    });
    return arr;
  },
  /**
   * Finds the first key name in an object that has the specified value.
   * Example:
   *
   *     Wb.findKey({a: 123}, 123); // returns: "a"
   *
   * @param {Object} object The object to search in.
   * @param {Object} value The value to find.
   * @return {String} The found key name or undefined if not found.
   */
  findKey(object, value) {
    return Wb.find(object, (k, v) => v == value);
  },
  /**
   * Converts a value to a string.
   * @param {Object} value The value to convert.
   * @return {String} The converted string value. Returns an empty string if the value is null or undefined.
   */
  opt(value) {
    return value == null ? '' : value.toString();
  },
  /**
   * Pads the specified string repeatedly at the beginning of the value until the resulting string reaches the specified length.
   * Example:
   *
   *     Wb.padStart(9, 3, 0); // returns: "009"
   *     Wb.padStart(9, 6, 'ab'); // returns: "ababa9"
   *
   * @param {Object} value The value to pad.
   * @param {Number} size The specified length after padding.
   * @param {Object} padString The value used for padding.
   * @return {String} The value after padding.
   */
  padStart(value, size, padString) {
    return String(value).padStart(size, padString);
  },
  /**
   * Pads the specified string repeatedly at the end of the value until the resulting string reaches the specified length.
   * Example:
   *
   *     Wb.padEnd(9, 3, 0); // returns: "900"
   *     Wb.padEnd(9, 6, 'ab'); // returns: "9ababa"
   *
   * @param {Object} value The value to pad.
   * @param {Number} size The specified length after padding.
   * @param {Object} padString The value used for padding.
   * @return {String} The value after padding.
   */
  padEnd(value, size, padString) {
    return String(value).padEnd(size, padString);
  }
});
/**
 * Class manager. When defining a class and adding its reference to Cls[name], the class manager will add the class
 * reference to the namespace, and set name to the "fullName" property of the class. If the class definition has a name,
 * the name will be added to {#Wb.classes}, and the class object can be found by this name. If a non-mixin class has a
 * protos property, all members of the protos object will be copied to the class's prototype.
 * Define a class as follows
 *
 *     Cls['Wb.View'] = class view extends Wb.mixin.View(Wb.Panel) {
 *     }
 *
 * Here, `Wb.View` is the full class name, `view` is the short class name, `Wb.mixin.View` is the mixin,
 * and `Wb.Panel` is the parent class.
 * @class Cls
 * @singleton
 */
globalThis.Cls = new Proxy({}, {
  set(target, prop, value) {
    let proto, cname = value.name;

    value.fullName = prop;
    Wb.setNS(prop, value);
    target[prop] = value;
    if (cname)
      Wb.classes[cname] = value;
    // copy proto to prototype
    proto = value.prototype;
    if (proto) {
      if (Wb.hasProperty(value, 'protos')) {
        Wb.apply(proto, value.protos);
        value.protos = undefined;
      }
      proto.cname = cname;
    }
    return true;
  }
});
/**
 * JavaScript's Object. For more information about Object, please visit {#%Object}.
 * @class Object
 */
/**
 * JavaScript's Boolean. For more information about Boolean, please visit {#%Boolean}.
 * @class Boolean
 */
/**
 * JavaScript's Promise. For more information about Promise, please visit {#%Promise}.
 * @class Promise
 */
/**
 * JavaScript's regular expression. For more information about RegExp, please visit {#%RegExp}.
 * @class RegExp
 */
/**
 * A class containing common prototype methods.
 */
Cls['Wb.PT'] = class PT {
  /**
   * Traverses the object. See {#Wb.each} for details, with `object` implicitly set to `this`.
   */
  static each(fn, scope) {
    let keys, key, i, j, me = this;

    scope ??= me;
    keys = Object.keys(me);
    j = keys.length;
    for (i = 0; i < j; i++) {
      key = keys[i];
      if (fn.call(scope, key, me[key]) === false)
        return false;
    }
    return true;
  }
  /**
   * Traverses the array. See {#Array.each} for details.
   */
  static arrayEach(fn, scope, reverse) {
    let i, me = this, j = me.length;
    scope ??= me;
    if (reverse) {
      for (i = j - 1; i > -1; i--) {
        if (fn.call(scope, me[i], i) === false) {
          return false;
        }
      }
    } else {
      for (i = 0; i < j; i++) {
        if (fn.call(scope, me[i], i) === false) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns array with items not present in the specified Array/Set. See {#Array.diff} for details.
   */
  static diff(array) {
    if (array)
      return this.filter(item => !array.includes(item));
    else
      return this;
  }
  /**
   * Returns array with items present in both current and the specified Array/Set. See {#Array.intersect} for details.
   */
  static intersect(array) {
    return this.filter(item => array.includes(item));
  }
  /**
   * Extracts values of a specified property from each item in the array. See {#Array.pluck} for details.
   */
  static pluck(name) {
    let result = [];

    this.each(item => result.push(item[name]));
    return result;
  }
  /**
   * Traverses the Set. See {#Array.each} for details.
   */
  static iteratorEach(fn, scope, reverse) {
    let me = this;

    scope ??= me;
    if (reverse) {
      let i, j;
      me = [...me];
      j = me.length;
      for (i = j - 1; i > -1; i--) {
        if (fn.call(scope, me[i], i) === false) {
          return false;
        }
      }
    } else {
      let item, i = 0;
      for (item of me) {
        if (fn.call(scope, item, i++) === false) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Traverses the Map. See {#Map.each} for details.
   */
  static iteratorEach2P(fn, scope) {
    let me = this, item;
    scope ??= me;
    for (item of me) {
      if (fn.call(scope, item[0], item[1]) === false) {
        return false;
      }
    }
    return true;
  }
  /**
   * Finds the first matching item. See {#Set.find} for details.
   */
  static iteratorFind(fn, scope) {
    let me = this, item, i = 0;

    scope ??= me;
    for (item of me) {
      if (fn.call(scope, item, i++)) {
        return item;
      }
    }
    return undefined;
  }
  /**
   * Finds all matching items. See {#Set.filter} for details.
   */
  static iteratorFilter(fn, scope) {
    let me = this, item, items = [], i = 0;

    scope ??= me;
    for (item of me) {
      if (fn.call(scope, item, i++)) {
        items.push(item);
      }
    }
    return items;
  }
  /**
   * Finds the first matching entry. See {#Map.find} for details.
   */
  static iteratorFind2P(fn, scope) {
    let me = this, item;

    scope ??= me;
    for (item of me) {
      if (fn.call(scope, item[0], item[1])) {
        return item;
      }
    }
    return undefined;
  }
  /**
   * Finds all matching entries. See {#Map.filter} for details.
   */
  static iteratorFilter2p(fn, scope) {
    let me = this, item, items = [];

    scope ??= me;
    for (item of me) {
      if (fn.call(scope, item[0], item[1])) {
        items.push(item);
      }
    }
    return items;
  }
  /**
   * Determines whether at least one item in the Object matches. See {#Wb.some} for details.
   */
  static doSome(eachFn, fn, scope, ...eachParams) {
    let me = this, foundTrue = false;

    scope ??= me;
    eachFn.call(me, (...args) => {
      if (fn.apply(scope, args)) {
        foundTrue = true;
        return false;
      }
    }, scope, ...eachParams);
    return foundTrue;
  }
  /**
   * Determines whether all items in the Object match. See {#Wb.every} for details.
   */
  static doEvery(eachFn, fn, scope, ...eachParams) {
    let me = this, foundFalse = false;

    scope ??= me;
    eachFn.call(me, (...args) => {
      if (!fn.apply(scope, args)) {
        foundFalse = true;
        return false;
      }
    }, scope, ...eachParams);
    return !foundFalse;
  }
  /**
   * Determines whether at least one item in the Object matches. See {#Wb.some} for details.
   */
  static some(...args) {
    return Wb.PT.doSome.call(this, this.each, ...args);
  }
  /**
   * Determines whether at least one item in the object matches. See {#Wb.some} for details.
   */
  static objectSome(...args) {
    return Wb.PT.doSome.call(this, Wb.PT.each, ...args);
  }
  /**
   * Determines whether all items in the object match. See {#Wb.every} for details.
   */
  static every(...args) {
    return Wb.PT.doEvery.call(this, this.each, ...args);
  }
  /**
   * Determines whether all items in the object match. See {#Wb.every} for details.
   */
  static objectEvery(...args) {
    return Wb.PT.doEvery.call(this, Wb.PT.each, ...args);
  }
  /**
   * Determines whether at least one item in the parent items matches. See {#Wb.some} and {#Wb.bubble} for details.
   */
  static bubbleSome(...args) {
    return Wb.PT.doSome.call(this, this.bubble, ...args);
  }
  /**
   * Determines whether all ancestor items match. See {#Wb.every} and {#Wb.bubble} for details.
   */
  static bubbleEvery(...args) {
    return Wb.PT.doEvery.call(this, this.bubble, ...args);
  }
  /**
   * Determines whether at least one item in the descendant items matches. See {#Wb.some} and {#Wb.cascade} for details.
   */
  static cascadeSome(...args) {
    return Wb.PT.doSome.call(this, this.cascade, ...args);
  }
  /**
   * Determines whether all descendant items match. See {#Wb.every} and {#Wb.cascade} for details.
   */
  static cascadeEvery(...args) {
    return Wb.PT.doEvery.call(this, this.cascade, ...args);
  }
}
/**
 * A mixed type that can have multiple possible data types.
 * @class Mix
 */
/**
 * Expression type.
 * @class Express
 */
/**
 * Multi-line text class, same as String. See {#String} for details.
 * @class TextString
 */
/**
 * Color text class, same as String. See {#String} for details.
 * @class ColorString
 */
/**
 * Time class, same as Date. See {#Date} for details.
 * @class Time
 */
/**
 * Date time class, same as Date. See {#Date} for details.
 * @class DateTime
 */
/**
 * Year month class, same as Date. See {#Date} for details.
 * @class YearMonth
 */
/**
 * Enum class, usually representing several fixed possible values.
 * @class Enum
 */
/**
 * Text class specifying the relative path of a file, same as String. See {#String} for details.
 * @class PathString
 */
/**
 * Extended class of String. See {#%String} for details.
 * @class String
 */
Wb.apply(String.prototype, {
  /**
   * Alias of String.prototype.includes.
   */
  contains: String.prototype.includes,
  /**
   * Gets the number of occurrences of a specified string.
   * Example:
   *
   *     'foo bar foo'.occur('foo'); // returns: 2
   *
   * @param {String} str The string to check.
   * @return {Number} The number of occurrences.
   */
  occur(str) {
    let me = this, count = 0, len = str.length, pos = -len;
    while ((pos = me.indexOf(str, pos + len)) != -1)
      count++;
    return count;
  },
  /**
   * Replaces all parameters referenced using the `_$name$_` syntax in the current text.
   * @param {Object} params The parameters object.
   * @return {String} The text after replacement.
   */
  replaceParams(params) {
    let text = this, start = 0, startPos = text.indexOf('_$', start), endPos = text.indexOf('$_', startPos + 2);

    if (startPos > -1 && endPos > -1) {
      let paramName, paramValue, result = '';

      params ??= {};
      while (startPos > -1 && endPos > startPos) {
        paramName = text.substring(startPos + 2, endPos);
        paramValue = params[paramName];
        result += text.substring(start, startPos);
        if (paramValue != null)
          result += String(paramValue);
        start = endPos + 2;
        startPos = text.indexOf('_$', start);
        endPos = text.indexOf('$_', startPos + 2);
      }
      result += text.substr(start);
      return result;
    } else
      return text;
  },
  /**
   * Adds the specified string as a prefix to each line of the string separated by "\n".
   * @param {String} prefix The prefix to add.
   * @return {String} The string with the prefix added.
   */
  addPrefix(prefix) {
    let result = [];
    this.split('\n').forEach(line => {
      result.push(prefix + line);
    });
    return result.join('\n');
  },
  /**
   * Converts the current string to HTML script.
   * @param {Boolean} [singleLine] Whether to display as a single line. If specified as a single line, line breaks
   * will be converted to spaces.
   * @param {Boolean} [convertSpace] Whether to convert spaces to single "&nbsp", Tabs to multiple "&nbsp", and
   * line breaks to <br>.
   * @return {String} The converted HTML script.
   */
  toHTML(singleLine, convertSpace) {
    let me = this, i, j = me.length, result = '', c;

    for (i = 0; i < j; i++) {
      c = me.charAt(i);
      switch (c) {
        case ' ':
          result += convertSpace ? '&nbsp;' : c;
          break;
        case '"':
          result += '&quot;';
          break;
        case "'":
          result += '&#39;';
          break;
        case '<':
          result += '&lt;';
          break;
        case '>':
          result += '&gt;';
          break;
        case '&':
          result += '&amp;';
          break;
        case '\n':
          if (singleLine)
            result += convertSpace ? '&nbsp;' : ' ';
          else
            result += convertSpace ? '<br>' : c;
          break;
        case '\r':
          break;
        case '\t':
          result += convertSpace ? '&nbsp;&nbsp;&nbsp;&nbsp;' : c;
          break;
        default:
          result += c;
      }
    }
    return result;
  },
  /**
   * Splits the string by the specified delimiter and performs trim operation on each split string.
   * @param {String} [splitter] The delimiter to use for splitting. Defaults to ",".
   * @return {Array} The list of split and trimmed strings.
   */
  splitTrim(splitter = ',') {
    let arr = this.split(splitter), result = [];
    arr.forEach(item => {
      result.push(item.trim());
    });
    return result;
  },
  /**
   * Splits each keyword according to camelCase naming convention and returns a list of strings converted to lowercase.
   * @return {Array} The list of split strings.
   */
  camelCaseSplit() {
    let me = this, result = [], pos = 0, ch, i, j = me.length;

    for (i = 0; i < j; i++) {
      ch = me.charAt(i);
      if (ch >= 'A' && ch <= 'Z') {
        result.push(me.substring(pos, i).toLowerCase());
        pos = i;
      }
    }
    result.push(me.substr(pos).toLowerCase());
    return result;
  },
  /**
   * Truncates string and adds ellipsis if it exceeds max length.
   * @param {Number} [maxLength] Maximum allowed length before truncation.
   * @return {String} Original string or truncated string with ellipsis.
   */
  ellipsis(maxLength) {
    let me = this;
    maxLength ??= 200;
    if (me.length > maxLength)
      return me.substr(0, maxLength) + '...';
    else
      return me;
  },
  /**
   * Truncates string to max length with ellipsis, removing leading/trailing whitespace and replacing newlines with spaces.
   * @param {Number} [maxLength] Maximum allowed length before truncation.
   * @return {String} Original string or truncated string with ellipsis.
   */
  ellipsisLine(maxLength) {
    return this.trimLeft().ellipsis(maxLength).trimRight().replaceAll('\n', ' ');
  },
  /**
   * Determines whether the string is loosely equal to another object.
   * @param {Object} str The object to compare with.
   * @return {Boolean} `true` if loosely equal, `true` otherwise.
   */
  equals(str) {
    return this == str;
  },
  /**
   * Determines whether the string is loosely equal to another object, ignoring case.
   * @param {String} str The string to compare with.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  equalsIC(str) {
    return this.toLowerCase() == str.toLowerCase();
  },
  /**
   * Determines whether the string starts with the specified string, ignoring case.
   * @param {String} str The string to compare with.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  startsWithIC(str) {
    return this.toLowerCase().startsWith(str.toLowerCase());
  },
  /**
   * Determines whether the string ends with the specified string, ignoring case.
   * @param {String} str The string to compare with.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  endsWithIC(str) {
    return this.toLowerCase().endsWith(str.toLowerCase());
  },
  /**
   * Determines whether the string contains the specified string, ignoring case.
   * @param {String} str The string to check.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  includesIC(str) {
    return this.toLowerCase().includes(str.toLowerCase());
  },
  /**
   * Gets the position of the nth occurrence of a specified substring in the string.
   * Example:
   *
   *     let str = 'abc 123 abc 456 abc';
   *     // Get position of the 2nd occurrence of 'abc'
   *     str.timesIndexOf('abc', 2); // returns: 8
   *     // Get position of the last occurrence of 'abc'
   *     str.timesIndexOf('abc', -1);// returns: 16
   *
   * @param {String} subStr The substring to look for.
   * @param {Number} n The occurrence order. 1 for first, negative numbers for reverse order.
   * @return {Number} The position of the substring or -1 if not found.
   */
  timesIndexOf(subStr, n) {
    if (n === 0)
      return -1;
    let me = this, i, pos, negative = n < 0, len = subStr.length;

    n = Math.abs(n);
    if (negative)
      pos = me.length + len - 1;
    else
      pos = -len;
    for (i = 0; i < n; i++) {
      if (negative)
        pos = me.lastIndexOf(subStr, pos - len);
      else
        pos = me.indexOf(subStr, pos + len);
      if (pos === -1)
        return pos;
    }
    if (pos < -1)
      pos = -1;
    return pos;
  },
  /**
   * Replaces placeholders in the string with provided values. Placeholders are formatted as {key}. If first argument is an
   * object, its properties are used for substitution. Otherwise, uses index-based replacement with {0}, {1}, etc.
   * Example:
   *
   *     'foo {0} bar {1} and {0}'.format('abc', 123); // returns: foo abc bar 123 and abc
   *     'foo {value1} bar {value2}'.format({value1: 'abc', value2: 123}); // returns: foo abc bar 123
   *
   * @param {Object/...Object} values Values to replace placeholders. If first value is an object, its properties are used.
   * @return {String} String with placeholders replaced by corresponding values.
   */
  format(...values) {
    let me = this, begin, firstValue, end = -1, lastEnd = -1, result = '';

    firstValue = values[0];
    if (Wb.isObject(firstValue))
      values = firstValue;
    while (true) {
      begin = me.indexOf("{", end + 1);
      end = me.indexOf("}", begin + 2);
      if (begin > -1 && end > begin) {
        result += me.substring(lastEnd + 1, begin);
        result += String(values[me.substring(begin + 1, end)]);
        lastEnd = end;
      } else {
        result += me.substr(lastEnd + 1);
        break;
      }
    }
    return result;
  },
  /**
   * Formats the string using a pattern where '?' acts as a placeholder for characters from the original string. Skips
   * placeholder if the character matches any in the format pattern.
   * Example:
   *
   *     '23508172639'.formatGroup('???? ???? ???'); // returns: "2350 8172 639"
   *     'abc def'.formatGroup('??-?? ?? ??'); // returns: "ab-cd ef"
   *     'abc def'.formatGroup('?? ??'); // returns: "ab cd"
   *
   * @param {String} format The format pattern containing '?' placeholders.
   * @return {String} Formatted string with characters placed in '?' positions.
   */
  formatGroup(format) {
    let result = '', index = 0, c, i, j = format.length, me = this, len = me.length;

    for (i = 0; i < j; i++) {
      c = format.charAt(i);
      if (c == '?') {
        c = me.charAt(index++);
        if (format.includes(c))
          i--;
        else
          result += c;
        if (index >= len)
          return result;
      }
      else {
        result += c;
      }
    }
    return result;
  },
  /**
   * Prepends a "." to each space-separated substring in the string.
   * Example:
   *
   *     'foo bar'.padDot(); // returns: ".foo .bar"
   *
   * @param {Boolean} noBlank Whether to join substrings without spaces after adding ".".
   * @return {String} New string with "." prepended to each substring.
   */
  padDot(noBlank) {
    let result = '',
      space = noBlank ? '' : ' ';
    this.split(' ').each(item => {
      item = item.trim();
      if (result && space)
        result += space;
      result += '.' + item;
    });
    return result;
  },
  /**
   * Gets the first substring separated by the specified string.
   * Example:
   *
   *     'foo.bar.abc'.firstItem('.'); // returns: "foo"
   *
   * @param {String} separator The separator.
   * @return {String} The substring. Returns a copy of the string if the separator not found.
   */
  firstItem(separator) {
    let me = this, index = me.indexOf(separator);
    if (index === -1)
      return me.slice();
    else
      return me.substr(0, index);
  },
  /**
   * Gets the last substring separated by the specified string.
   * Example:
   *
   *     'foo.bar.abc'.lastItem('.'); // returns: "abc"
   *
   * @param {String} separator The separator.
   * @return {String} The substring. Returns a copy of the string if the separator not found.
   */
  lastItem(separator) {
    let me = this, index = me.lastIndexOf(separator);
    if (index === -1)
      return me.slice();
    else
      return me.substr(index + separator.length);
  },
  /**
   * Gets the substring before the last occurrence of the specified separator.
   * Example:
   *
   *     'foo.bar.abc'.beforeItem('.'); // returns: "foo.bar"
   *
   * @param {String} separator The separator.
   * @return {String} The substring. Returns a copy of the string if the separator not found.
   */
  beforeItem(separator) {
    let me = this, index = me.lastIndexOf(separator);
    if (index === -1)
      return me.slice();
    else
      return me.substr(0, index);
  },
  /**
   * Gets the substring after the first occurrence of the specified separator.
   * Example:
   *
   *     'foo.bar.abc'.afterItem('.'); // returns: "bar.abc"
   *
   * @param {String} separator The separator.
   * @return {String} The substring. Returns a copy of the string if the separator not found.
   */
  afterItem(separator) {
    let me = this, index = me.indexOf(separator);
    if (index === -1)
      return me.slice();
    else
      return me.substr(index + separator.length);
  },
  /**
   * Gets the substring between two specified strings.
   * Example:
   *
   *     'foo(bar)'.getPart('(', ')'); // returns: "bar"
   *
   * @param {String} begin The starting string.
   * @param {String} end The ending string.
   * @return {Sring} The substring between the begin and end strings. Returns an empty string if not found.
   */
  getPart(begin, end) {
    let me = this, b = me.indexOf(begin), e = me.indexOf(end);

    if (b != -1 && e > b)
      return me.substring(b + begin.length, e);
    return '';
  }
});
Object.defineProperties(String.prototype, {
  /**
   * @property {String} - The string with its first letter converted to uppercase.
   * Example:
   *
   *     'allen'.capital; // returns: "Allen"
   * @getter
   */
  capital: {
    get() {
      let me = this;
      return me.length ? (me[0].toUpperCase() + me.substr(1)) : '';
    },
    configurable: true
  },
  /**
   * @property {String} - The current string represented as HTML. Spaces, tabs and line breaks will be converted to HTML.
   * @getter
   */
  html: {
    get() {
      return this.toHTML(false, true);
    },
    configurable: true
  },
  /**
   * @property {String} - The current string represented as HTML. Spaces, tabs and line breaks will not be converted to HTML.
   * @getter
   */
  htmlText: {
    get() {
      return this.toHTML();
    },
    configurable: true
  },
  /**
   * @property {String} - The current string represented as single-line HTML. Line breaks will be converted to spaces.
   * @getter
   */
  htmlLine: {
    get() {
      return this.toHTML(true);
    },
    configurable: true
  },
  /**
   * @property {String} - The error code included in the string. The error code is a substring starting with "##" and
   * ending with ":". Returns null if it does not exist.
   * @getter
   */
  errorCode: {
    get() {
      let me = this, pos = me.indexOf(':');
      if (me.startsWith('##') && pos > 1)
        return me.substring(2, pos);
      else
        return null;
    },
    configurable: true
  },
  /**
   * @property {String} - The error text included in the string. If {#errorCode} exists, the substring starting
   * from ":" to the end is the error text. Returns null if it does not exist.
   * @getter
   */
  errorText: {
    get() {
      let me = this, pos = me.indexOf(':');
      if (me.startsWith('##') && pos > 1)
        return me.substr(pos + 1).trim();
      else
        return null;
    },
    configurable: true
  },
  /**
   * @property {String} - Converts the current string to a regular expression-friendly string, where all regular
   * expression special characters in the string are escaped.
   * @getter
   */
  regexpText: {
    get() {
      return this.replace(Wb.regExp.quote, '\\$&');
    },
    configurable: true
  },
  /**
   * @property {Date} - Converts the current string to a date value using {#Date.dateFormat}. See {#Date.textValue} for
   * reverse conversion.
   * Example:
   *
   *     '2021-03-12 14:19:39.614'.dateValue; // returns: corresponding date value
   *
   * @getter
   */
  dateValue: {
    get() {
      return Wb.parseDate(this);
    },
    configurable: true
  },
  /**
   * @property {Date} - Converts the current string to a numeric value after removing thousand separators and whitespace
   * characters. This property recognizes thousand separator symbols according to the current region.
   * Example:
   *
   *     '3,45 6.12'.numValue; // returns: 3456.12 in US
   *
   * @getter
   */
  numValue: {
    get() {
      return parseFloat(this.replaceAll(Number.thousandChar, '').replaceAll(' ', ''));
    },
    configurable: true
  }
});
/**
 * Extended class of Function. See {#%Function} for details.
 * @class Function
 */
Wb.apply(Function.prototype, {
  /**
   * Gets the body script of the function.
   * @return {String} The function body script.
   */
  toScript() {
    let s = this.toString(), arrowPos = s.indexOf('=>'), bPos = s.indexOf('{');
    if (bPos == -1 || arrowPos != -1 && arrowPos < bPos) {
      // arrow function
      s = s.substr(arrowPos + 2).trim();
      if (s.startsWith('{'))
        s = s.slice(1, -1).trim();
      return s;
    }
    return s.slice(bPos + 1, -1).trim();
  }
});
/**
 * Extended class of Number. See {#%Number} for details.
 * @class Number
 */
Wb.apply(Number, {
  /** @property {NumberFormat} - Default number formatter. @static */
  numFormatter: new Intl.NumberFormat(SysLang, { maximumFractionDigits: 20 }),
  /** @property {NumberFormat} - Integer formatter. @static */
  intFormatter: new Intl.NumberFormat(SysLang, { maximumFractionDigits: 0 }),
  /** @property {NumberFormat} - Floating formatter with preserved decimal places. @static */
  floatFormatter: new Intl.NumberFormat(SysLang, { minimumFractionDigits: 0, maximumFractionDigits: 20 }),
  /** @property {NumberFormat} - Percentage formatter with fixed 2 decimal places. @static */
  percentFormatter: new Intl.NumberFormat(SysLang, {
    style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
  }),
  /** @property {NumberFormat} - Percentage formatter without decimal places. @static */
  percentIntFormatter: new Intl.NumberFormat(SysLang, {
    style: 'percent'
  }),
  /** @property {String} - Decimal point symbol. @readonly */
  decimalChar: (f => {
    let str = new Intl.NumberFormat(SysLang, { maximumFractionDigits: 1 }).format(1.1);
    return str.replaceAll('1', '');
  })(),
  /** @property {String} - Thousands separator symbol. @readonly */
  thousandChar: (f => {
    let str = new Intl.NumberFormat(SysLang).format(11111);
    return str.replaceAll('1', '');
  })(),
  /** @property {NumberFormat} - Percentage formatter with a maximum of 2 decimal places. @static */
  percentAutoFormatter: new Intl.NumberFormat(SysLang, { style: 'percent', maximumFractionDigits: 2 }),
  /** @property {NumberFormat} - USD number formatter. @static */
  usdFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'USD' }),
  /** @property {NumberFormat} - RMB number formatter. @static */
  cnyFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'CNY' }),
  /** @property {NumberFormat} - EUR number formatter. @static */
  eurFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'EUR' }),
  /** @property {NumberFormat} - GBP number formatter. @static */
  gbpFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'GBP' }),
  /** @property {NumberFormat} - JPY number formatter. @static */
  jpyFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'JPY' }),
  /** @property {NumberFormat} - CAD number formatter. @static */
  cadFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'CAD' }),
  /** @property {NumberFormat} - AUD number formatter. @static */
  audFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'AUD' }),
  /** @property {NumberFormat} - HKD number formatter. @static */
  hkdFormatter: new Intl.NumberFormat(SysLang, { style: 'currency', currency: 'HKD' })
});
Wb.apply(Number.prototype, {
  /**
   * Rounds the number to the nearest multiple of the specified step value.
   * Example:
   *
   *     (92).snap(5); // returns: 90
   *     (93).snap(5); // returns: 95
   *
   * @param {Number} step The interval at which to snap the number.
   * @return {Number} The nearest multiple of the step value.
   */
  snap(step) {
    return Math.round(this / step) * step;
  },
  /**
   * Constrains the number within [minValue, maxValue] range.
   * Example:
   *
   *     (56).constrain(80, 90); / returns: 80
   *
   * @param {Number} [minValue] Minimum boundary. Defaults to -Number.MAX_VALUE.
   * @param {Number} [maxValue] Maximum boundary. Defaults to Number.MAX_VALUE.
   * @return {Number} The constrained number.
   */
  constrain(minValue, maxValue) {
    let val = this.valueOf();
    minValue ??= -Number.MAX_VALUE;
    maxValue ??= Number.MAX_VALUE;
    if (val > maxValue)
      val = maxValue;
    if (val < minValue)
      val = minValue;
    return val;
  },
  /**
   * Converts the number to a string in the specified format.
   * Example:
   *
   *     (12345.625).format('$#,##0.00'); // "$12,345.63"
   *     (12345.625).format('0.0###'); // "12345.625"
   *     (1.23).format('000'); // "001"
   *     (1.235).format('0.00%'); // "1.24%"
   *
   * @param {String} format Format template string with 4 special symbols:
   * -'0':  Uses 0 to fill if it does not exist.
   * -'#': Omits the digit if it does not exist.
   * -',': Thousand separator (region-dependent, e.g., '.' in Germany).
   * -'.': Decimal separator (region-dependent, e.g., ',' in Germany).
   * @return {String} Formatted string.
   */
  format(format) {
    let me = this, i, j, k, c, startFormat, endFormat, intPart, rawIntPart, decimalPart, isKey, hasThousand,
      decimalStart = -1, decimalEnd, prefix = '', suffix = '', result = '', intFormat = '', decimalFormat = '';

    j = format.length;
    for (i = 0; i < j; i++) {
      c = format.charAt(i);
      isKey = true;
      switch (c) {
        case '0':
        case '#':
          if (decimalStart === -1) {
            intFormat += c;
          } else {
            decimalFormat += c;
            decimalEnd = i;
          }
          break;
        case ',':
          hasThousand = true;
          break;
        case '.':
          decimalStart = i;
          break;
        case '"':
          continue;
        default:
          isKey = false;
      }
      if (isKey) {
        startFormat = true;
      } else {
        if (startFormat)
          endFormat = true;
      }
      if (!startFormat)
        prefix += c;
      if (endFormat)
        suffix += c;
    }
    if (decimalStart === -1) {
      intPart = result = me.roundFixed();
      decimalPart = '';
    } else {
      result = me.roundFixed(decimalEnd - decimalStart);
      i = result.indexOf('.');
      if (i === -1) {
        intPart = result;
        decimalPart = '';
      } else {
        intPart = result.substr(0, i);
        decimalPart = result.substr(i + 1);
      }
    }
    if (intPart === '0')
      intPart = '';
    i = intFormat.indexOf('0');
    if (i != -1)
      intPart = intPart.padStart(intFormat.length - i, '0');
    if (decimalPart) {
      // remove trailing unnecessary zeros
      j = decimalPart.length;
      k = decimalFormat.length;
      c = 0;
      for (i = j - 1; i >= 0; i--) {
        if (decimalPart.charAt(i) === '0' && decimalFormat.charAt(--k) === '#')
          c++;
        else
          break;
      }
      if (c > 0)
        decimalPart = decimalPart.substr(0, j - c);
      if (decimalPart)
        decimalPart = Number.decimalChar + decimalPart;
    }
    if (hasThousand) {
      if (intPart.startsWith('-')) {
        prefix += '-';
        intPart = intPart.substr(1);
      }
      j = intPart.length;
      k = j - 1;
      rawIntPart = intPart;
      intPart = '';
      for (i = 0; i < j; i++) {
        c = rawIntPart.charAt(i);
        intPart += c;
        if ((j - i) % 3 === 1 && i < k)
          intPart += Number.thousandChar;
      }
    }
    return prefix + intPart + decimalPart + suffix;
  },
  /**
   * Rounds the number to the specified precision.
   * Example:
   *
   *     (3.568).round(2); // 3.57
   *     (258).round(-2); // 300
   *
   * @param {Number} [digits] Precision for rounding. Positive values set decimal places, negative values set powers of
   * 10 for rounding. Defaults to 0.
   * @return {Number} The rounded value.
   */
  round(digits) {
    let me = this;
    digits ??= 0;
    if (digits == 0) {
      return Math.round(me);
    } else if (digits < 0) {
      let p = Math.pow(10, -digits);
      return Math.round(me / p) * p;
    } else {
      return Number(Math.round(me + 'e' + digits) + 'e-' + digits);
    }
  },
  /**
   * Converts the number to a string with fixed number of decimal places.
   * Example:
   *
   *     (258.6215).roundFixed(3); // "258.622"
   *     (258.62).roundFixed(3); // "258.620"
   *     (1258.6215).roundFixed(3, true); // "1,258.622"
   *
   *
   * @param {Number} [digits] Number of decimal places. Defaults to 0.
   * @param {Boolean} [autoFormat] Whether to format with thousand separators(region-dependent, e.g., '.' in Germany).
   * @return {String} The converted string.
   */
  roundFixed(digits, autoFormat) {

    let v = this.round(digits), pos;

    digits ??= 0;
    v = autoFormat ? v.floatText : v.toString();
    if (digits > 0) {
      pos = v.lastIndexOf(Number.decimalChar);
      if (pos == -1) {
        v += Number.decimalChar;
        pos = 0;
      } else
        pos = v.substr(pos + 1).length;
      return v + '0'.repeat(digits - pos);
    } else
      return v;
  }
});
Object.defineProperties(Number.prototype, {
  /**
   * @property {Number} - The length of decimal places.
   * @getter
   */
  decimalCount: {
    get() {
      let str = this.toString(), dotPos = str.indexOf('.');
      return dotPos == -1 ? 0 : str.length - dotPos - 1;
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted text.
   * Example:
   *
   *     (1234.5678).text // returns: "1,234.5678" in US
   * @getter
   */
  text: {
    get() {
      return Number.numFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted integer text.
   * Example:
   *
   *     (1234.5678).intText // returns: "1,235" in US
   *
   * @getter
   */
  intText: {
    get() {
      return Number.intFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted float text with preserved decimal places.
   * Example:
   *
   *     (1234.2).floatText // returns: "1,234.2" in US
   * @getter
   */
  floatText: {
    get() {
      return Number.floatFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted Percentage text with fixed 2 decimal places.
   * Example:
   *
   *     (1.203).percent // returns: "120.30%" in US
   * @getter
   */
  percent: {
    get() {
      return Number.percentFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted percentage text without decimals.
   * Example:
   *
   *     (1.2).percentInt // returns: "120%"
   * @getter
   */
  percentInt: {
    get() {
      return Number.percentIntFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted percentage text with a maximum of 2 decimal places.
   * Example:
   *
   *     (1.2).percentAuto // returns: "120%"
   * @getter
   */
  percentAuto: {
    get() {
      return Number.percentAutoFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted USD (US Dollar) text.
   * Example:
   *
   *     (1234.5).usd // returns: "$1,234.50" in US
   * @getter
   */
  usd: {
    get() {
      return Number.usdFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted CNY (Chinese Yuan) text.
   * Example:
   *
   *     (1234.5).cny // returns: "¥1,234.50" in China
   * @getter
   */
  cny: {
    get() {
      return Number.cnyFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted EUR (Euro) text.
   * Example:
   *
   *     (1234.5).eur // returns: "1.234,50 €" in Germany
   * @getter
   */
  eur: {
    get() {
      return Number.eurFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted GBP (British Pound) text.
   * Example:
   *
   *     (1234.5).gbp // returns: "£1,234.50" in UK
   * @getter
   */
  gbp: {
    get() {
      return Number.gbpFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted JPY (Japanese Yen) text.
   * Example:
   *
   *     (1234.5).jpy // returns: "¥1,235" in Japan
   * @getter
   */
  jpy: {
    get() {
      return Number.jpyFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted CAD (Canadian Dollar) text.
   * Example:
   *
   *     (1234.5).cad // returns: "C$1,234.50" in Canada (en)
   * @getter
   */
  cad: {
    get() {
      return Number.cadFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted AUD (Australian Dollar) text.
   * Example:
   *
   *     (1234.5).aud // returns: "$1,234.50" in Australia
   * @getter
   */
  aud: {
    get() {
      return Number.audFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The locale formatted HKD (Hong Kong Dollar) text.
   * Example:
   *
   *     (1234.5).hkd // returns: "HK$1,234.50" in Hong Kong
   * @getter
   */
  hkd: {
    get() {
      return Number.hkdFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - The local formatted file size text in KB. Values less than 1KB are displayed as 1KB.
   * Example:
   *
   *     (12345678).kb // returns: "12,056 KB"
   *     (0.1).kb // returns: "1 KB"
   *
   * @getter
   */
  kb: {
    get() {
      const kb = 1024;
      let val = this;
      if (val > 0 && val < kb)
        val = kb;
      return (val / kb).intText + ' KB';
    },
    configurable: true
  },
  /**
   * @property {String} - The local formatted file size text in MB. Values less than 1MB are displayed as 1MB.
   * Example:
   *
   *     (12345678912).mb // returns: "11,774 MB"
   *     (0.1).mb // returns: "1 MB"
   *
   * @getter
   */
  mb: {
    get() {
      const mb = 1048576;
      let val = this;
      if (val > 0 && val < mb)
        val = mb;
      return (val / mb).intText + ' MB';
    },
    configurable: true
  },
  /**
   * @property {String} - The local formatted file size text, which uses units (B/KB/MB) depending on the actual size.
   * @getter
   */
  fileSize: {
    get() {
      const mb = 1048576, kb = 1024;
      let val = this;
      if (val < kb)
        val = val + ' B';
      else if (val < mb)
        val = val.kb;
      else
        val = val.mb;
      return val;
    },
    configurable: true
  }
});
/**
 * Extended class of Array. See {#%Array} for details.
 * @class Array
 */
Wb.apply(Array.prototype, {
  /**
   * Traverses the array, executing the given method for each item in the array. The difference between this method and
   * the forEach method is that it can interrupt iteration by returning `false` and can iterate in reverse.
   * Example:
   *
   *     [1, 2, 3].each(n => {
   *       if (n === 1)
   *         return false;
   *       console.log(n);
   *     }, null, true);
   *     //output: 3 2
   *
   * @param {Function} fn Function to execute. Traversal will be interrupted if `false` is returned.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @param {Boolean} [reverse] Whether to iterate in reverse, `true` for reverse.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  each: Wb.PT.arrayEach,
  /**
   * Extracts values of a specified property from each item in the Array.
   * Example:
   *
   *     [{name: 'Allen'}, {name:'David'}].pluck('name'); // returns: ["Allen", "David"]
   *
   * @param {String} name The property name to extract values from.
   * @return {Array} Array of extracted property values.
   */
  pluck: Wb.PT.pluck,
  /**
   * Returns array with items not present in the specified Array/Set.
   * Example:
   *
   *     [1, 2, 3].diff([1, 2]); // returns: [3]
   *
   * @param {Array/Set} array The array to compare.
   * @return {Array} Filtered array, or original array if array is null.
   */
  diff: Wb.PT.diff,
  /**
   * Returns array with items present in both current and the specified Array/Set.
   * Example:
   *
   *     [1, 2, 3].intersect([2, 4]); // returns: [2]
   *
   * @param {Array/Set} array The array to compare.
   * @return {Array} Intersection of the two collections.
   */
  intersect: Wb.PT.intersect,
  /** @property {Boolean} - Array-like flag. @priv */
  xLikeArray: true,
  /**
   * Merges this array with an iterable object.
   * Example:
   *
   *     [1, 2, 3].merge(new Set([3, 4, 5])); // returns: [1, 2, 3, 3, 4, 5]
   *     [1, 2, 3].merge('abc'); // returns: [1, 2, 3, "a", "b", "c"]
   *
   * @param {Iterable} iterable The iterable to merge (Array, Set, String, etc.)
   * @return {Array} The new merged array.
   */
  merge(iterable) {
    if (iterable)
      return [...this, ...iterable];
    return this;
  },
  /**
   * Merges this array with an iterable object and returns a distinct array.
   * Example:
   *
   *     [1, 2, 1, 3].unique(); // returns: [1, 2, 3]
   *     [1, 2, 3].unique([3, 4, 5]); // returns: [1, 2, 3, 4, 5]
   *     ['a', 'b', 'c'].unique(['d', 'b'], true); // returns: ['a', 'c', 'd', 'b']
   *
   * @param {Iterable} [iterable] The iterable to merge (Array, Set, String, etc.)
   * @param {Boolean} [subtract] Whether to remove duplicate items from this array before merging.
   * @return {Array} The new merged and distinct array.
   */
  unique(iterable, subtract) {
    let arr = this;
    if (iterable) {
      if (subtract)
        arr = arr.filter(item => !iterable.includes(item));
      return [...new Set([...arr, ...iterable])];
    } else {
      return [...new Set(arr)];
    }
  },
  /**
   * Adds all items from the specified iterable to the current array in order.
   * Example:
   *
   *     let arr = [1, 2, 3];
   *     arr.pushAll([4, 5]); // arr is: [1, 2, 3, 4, 5]
   *
   * @param {Iterable} iterable The iterable object.
   * @return {Number} The new length of the array.
   */
  pushAll(iterable) {
    let me = this;
    iterable?.each(item => { me.push(item) });
    return me.length;
  },
  /**
   * Copies all values from the current array to a new array. The newly created array is a shallow copy. For deep
   * clone see {#Wb.clone}.
   * @return {Array} The newly created array after shallow copy.
   */
  copy: Array.prototype.slice,
  /**
   * Determines whether the current array is strictly equal to another array.
   * @param {Array} array The target array to compare with.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  equals(array) {
    if (this.length != array?.length)
      return false;
    return this.every((item, i) => array[i] === item);
  },
  /**
   * Sorts the values in the array according to the local regional rules.
   * Example:
   *
   *     [{a: 3, b: 2}, {a: 1, b: 4}].normalSort(['a', 'b'], [false, true]);
   *
   * @param {String/String[]} [keys] If sorting objects, specify the key name(s) of the objects to sort by.
   * @param {Boolean/Boolean[]} [desc] Whether to sort in reverse order.
   * @return {Array} The sorted array itself.
   */
  normalSort(keys, desc) {
    return this.mixSort(keys, desc, Wb.compare);
  },
  /**
   * Sorts the values in the array according to the local regional rules case-insensitively.
   * Example:
   *
   *     [{a: 'A', b: 2}, {a: 'z', b: 4}].lowerSort('a', true);
   *
   * @param {String/String[]} [keys] If sorting objects, specify the key name(s) of the objects to sort by.
   * @param {Boolean/Boolean[]} [desc] Whether to sort in reverse order.
   * @return {Array} The sorted array itself.
   */
  lowerSort(keys, desc) {
    return this.mixSort(keys, desc, Wb.lowerCompare);
  },
  /**
   * Sorts the mixed values in the array according to the local regional rules case-insensitively.
   * Example:
   *
   *     [{a: 'A', b: 2}, {a: new Date(), b: 'abc'}].mixSort('a');
   *
   * @param {String/String[]} [keys] If sorting objects, specify the key name(s) of the objects to sort by.
   * @param {Boolean/Boolean[]} [desc] Whether to sort in reverse order.
   * @param {Function} [fn] The compare function. Defaults to {#Wb.mixCompare}.
   * @return {Array} The sorted array itself.
   */
  mixSort(keys, desc, fn) {
    fn ??= Wb.mixCompare;
    if (keys == null) {
      if (desc)
        return this.sort((a, b) => fn(b, a));
      else
        return this.sort(fn);
    } else {
      let value, v1, v2, defaultDesc;
      keys = Wb.toArray(keys);
      desc = Wb.toArray(desc);
      defaultDesc = desc[0];
      return this.sort((a, b) => {
        keys.each((key, i) => {
          v1 = a[key];
          v2 = b[key];
          value = (desc[i] ?? defaultDesc) ? fn(v2, v1) : fn(v1, v2);
          if (value != 0)
            return false;
        });
        return value;
      });
    }
  },
  /**
   * Removes the first occurrence of a specified item from the array. See {#erase} for related method.
   * Example:
   *
   *     let array = [1, 2, 3, 2];
   *     array.remove(2); // returns: true
   *     // array: [1, 3, 2]
   *
   * @param {Object} item The item to remove from the array.
   * @return {Boolean} `true` if item is removed, `false` otherwise.
   */
  remove(item) {
    let index = this.indexOf(item);

    if (index === -1) {
      return false;
    } else {
      this.splice(index, 1);
      return true;
    }
  },
  /**
   * Removes all specified items from the array. See {#remove} for related method.
   * Example:
   *
   *     let array = [1, 2, 3, 2];
   *     array.removeAll(2); // returns: true
   *     // array: [1, 3]
   *
   * @param {Object} item The item to remove from the array.
   * @return {Boolean} `true` if item is removed, `false` otherwise.
   */
  removeAll(item) {
    let me = this, i, j = me.length, result = false;

    for (i = j - 1; i > -1; i--) {
      if (me[i] == item) {
        me.splice(i, 1);
        result ||= true;
      }
    }
    return result;
  },
  /**
   * Removes all matching items in this array.
   * Example:
   *
   *     let array = [1, 2, 3, 2];
   *     array.removeBy(item => item === 2); // returns: true
   *     // array: [1, 3]
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to this array.
   * @return {Boolean} `true` if any items are removed, `false` otherwise.
   */
  removeBy(fn, scope) {
    let me = this, i, j = me.length, result = false;

    scope ??= me;
    for (i = j - 1; i > -1; i--) {
      if (fn.call(scope, me[i], i)) {
        me.splice(i, 1);
        if (!result)
          result = true;
      }
    }
    return result;
  },
  /**
   * Removes the first matching item in this array.
   * Example:
   *
   *     let array = [1, 2, 3, 2];
   *     array.removeFirst(item => item === 2); // returns: true
   *     // array: [1, 3, 2]
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to this array.
   * @return {Boolean} `true` if the item is removed, `false` otherwise.
   */
  removeFirst(fn, scope) {
    let me = this, i, j = me.length;

    scope ??= me;
    for (i = 0; i < j; i++) {
      if (fn.call(scope, me[i], i)) {
        me.splice(i, 1);
        return true;
      }
    }
    return false;
  },
  /**
   * Removes the item at the specified index. Use {#remove} method to remove item.
   * Example:
   *
   *     let array = [1, 2, 3];
   *     array.erase(2); // returns: true
   *     // array: [1, 2]
   *
   * @param {Number} index The index number of the item to be removed.
   * @return {Boolean} `true` if removed, `false` otherwise.
   */
  erase(index) {
    return this.splice(index, 1).length === 1;
  },
  /**
   * Inserts new items at the specified index.
   * Example:
   *
   *     [1, 2, 3].insert(0, 'a', 'b'); // returns: ["a", "b", 1, 2, 3]
   *
   * @param {Number} index The index where items will be inserted. Negative values indicate positions from the end.
   * @param {...Object} item The items to be inserted.
   * @return {Array} The array itself.
   */
  insert(index, ...item) {
    this.splice(index, 0, ...item);
    return this;
  },
  /**
   * Adds all non-null and non-undefined items to the array.
   * Example:
   *
   *     let array = [1, 2, 3];
   *     array.pushIf(null, 'b'); // returns: 4
   *     // array: [1, 2, 3, 'b']
   *
   * @param {...Object} items The items to be added.
   * @return {Number} The new length of the array.
   */
  pushIf(...items) {
    let me = this;
    items.each(item => {
      if (item != null)
        me.push(item);
    });
    return me.length;
  }
});
Object.defineProperties(Array.prototype, {
  /** @property {Object} - The first item of the array. @getter */
  firstItem: {
    // must implement, prevent reset firstItem property
    set(value) {
      this.firstItem$ = value;
    },
    get() {
      return this.firstItem$ ?? this[0];
    },
    configurable: true
  },
  /** @property {Object} - The last item of the array. @getter */
  lastItem: {
    // must implement, prevent reset lastItem property
    set(value) {
      this.lastItem$ = value;
    },
    get() {
      return this.lastItem$ ?? this[this.length - 1];
    },
    configurable: true
  }
});
/**
 * Extended class of Set. See {#%Set} for details.
 * @class Set
 */
Wb.apply(Set.prototype, {
  /** @property {Boolean} - Array-like flag. @priv */
  xLikeArray: true,
  /**
   * Extracts values of a specified property from each item in the Set. See {#Array.pluck} for details.
   */
  pluck: Wb.PT.pluck,
  /**
   * Removes an item from the Set. Alias of `delete`.
   */
  remove: Set.prototype.delete,
  /**
   * Determines whether an item exists. Alias of `has`.
   */
  includes: Set.prototype.has,
  /**
   * Returns array with items not present in the specified Array/Set. See {#Array.diff} for details.
   */
  diff: Wb.PT.diff,
  /**
   * Returns array with items present in both current and the specified Array/Set. See {#Array.intersect} for details.
   */
  intersect: Wb.PT.intersect,
  /**
   * Finds the first matching item.
   * Example:
   *
   *    (new Set([{a: 1}, {a: 2}, {a: 3}])).find(item => item.a == 2); // returns: {a: 2}
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Object} First matching item or undefined if not found.
   */
  find: Wb.PT.iteratorFind,
  /**
   * Finds all matching items.
   * Example:
   *
   *    (new Set([{a: 1}, {a: 2}, {a: 1}])).filter(item => item.a == 1); // returns: [{a: 1}, {a: 1}]
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Array} Array with all matching items. Returns empty array if none found.
   */
  filter: Wb.PT.iteratorFilter,
  /**
   * Traverses the Set. See {#Array.each} for details.
   */
  each: Wb.PT.iteratorEach,
  /**
   * Determines whether at least one item in the Set matches.
   * Example:
   *
   *    (new Set([1, 2, 3])).some(item => item == 2); // returns: true
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Boolean} `true` if at least one item matches, `false` otherwise.
   */
  some: Wb.PT.some,
  /**
   * Determines whether all items in the Set match.
   * Example:
   *
   *    (new Set(['Allen', 'David', 'Jenna'])).every(item => item.includes('e')); // return: false
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.item Current item.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Boolean} `true` if all items match, `false` otherwise.
   */
  every: Wb.PT.every,
  /**
   * Merges this set with an iterable object and returns a distinct array. See {#Array.unique} for details.
   */
  unique: Array.prototype.unique,
  /**
   * Adds distinct items to the Set.
   * @param {...Object} items Items to add
   * @return {Number} New size of the Set.
   */
  push(...items) {
    let me = this;
    items.each(item => { me.add(item) });
    return me.size;
  },
  /**
   * Adds all distinct items of the specified Iterable to the Set.
   * @param {Iterable} iterable Iterable object.
   * @return {Number} New size of the Set.
   */
  pushAll(iterable) {
    let me = this;
    iterable.each(item => { me.add(item) });
    return me.size;
  },
  /**
   * Joins all items of the Set into a string using the specified separator. See {#%Array.join|obj:Array/join} for details.
   */
  join(...args) {
    return [...this].join(...args);
  },
  /**
   * Sorts all items in the Set. See {#%Array.sort|obj:Array/sort} for details.
   */
  sort(...args) {
    return [...this].sort(...args);
  },
  /**
   * Sorts the values in the Set according to the local regional rules. See {#Array.normalSort} for details.
   */
  normalSort(key) {
    return [...this].normalSort(key);
  },
  /**
   * Sorts the values in the array according to the local regional rules case-insensitively. See {#Array.lowerSort} for
   * details.
   */
  lowerSort(key) {
    return [...this].lowerSort(key);
  },
  /**
   * Sorts the mixed values in the array according to the local regional rules case-insensitively. See
   * {#Array.mixSort} for details.
   */
  mixSort(key) {
    return [...this].mixSort(key);
  },
  /**
   * Convert to JSON method.
   * @return {Array} Array list.
   */
  toJSON() {
    return [...this];
  }
});
/**
 * Extended class of Map. See {#%Map} for details.
 * @class Map
 */
Wb.apply(Map.prototype, {
  /**
   * Removes an entry with the specified key from the Map. Alias of `delete`.
   */
  remove: Map.prototype.delete,
  /**
   * Finds the first matching entry. See {#Wb.find} for details, with `object` implicitly set to this `Map`.
   */
  find: Wb.PT.iteratorFind2P,
  /**
   * Finds all matching entries.
   * Example:
   *
   *     (new Map([['key1', 'Allen'], ['key2', 'David']])).filter((k, v) => v.includes('e'));
   *     //returns: [['key1', 'Allen']]
   *
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Object} fn.key Current key.
   * @param {Object} fn.value Current value.
   * @param {Object} [scope] `this` in the function. Defaults to the current object.
   * @return {Array} Array with all matching entries. Returns empty array if none found.
   */
  filter: Wb.PT.iteratorFilter2p,
  /**
   * Traverses the Map. See {#Wb.each} for details, with `object` implicitly set to this `Map`.
   */
  each: Wb.PT.iteratorEach2P,
  /**
   * Determines whether at least one entry in the Map matches. See {#Wb.some} for details, with `object` implicitly set to
   * this `Map`.
   */
  some: Wb.PT.some,
  /**
   * Determines whether all entries in the Set match. See {#Wb.every} for details, with `object` implicitly set to this `Map`.
   */
  every: Wb.PT.every
});
/**
 * Extended class of Date. See {#%Date} for details.
 * @class Date
 */
Wb.apply(Date, {
  /** @property {String} - Default year-month format for parsing dates, value: "y-MM", representing the full
   * year and month. @static */
  ymFormat: 'y-MM',
  /** @property {String} - Default date format for parsing dates, value: "y-MM-dd", representing the full year,
   * month and day. @static */
  dateFormat: 'y-MM-dd',
  /** @property {String} - Default time format for parsing time, value: "HH:mm:ss.SSS", representing the full hours,
   * minutes, seconds and milliseconds. @static */
  timeFormat: 'HH:mm:ss.SSS',
  /** @property {String} - Default date-time format for parsing date-time, value: "y-MM-dd HH:mm:ss.SSS",
   * representing full year, month, day, hours, minutes, seconds and milliseconds. @static */
  dateTimeFormat: 'y-MM-dd HH:mm:ss.SSS',
  /** @property {DateTimeFormat} - Date formatter for 2-digit month and day.  @static */
  dateFormatter: new Intl.DateTimeFormat(SysLang, { year: 'numeric', month: '2-digit', day: '2-digit' }),
  /** @property {DateTimeFormat} - Date formatter for year and month with short month names. @static */
  yearMonthFormatter: new Intl.DateTimeFormat(SysLang, { year: 'numeric', month: 'short' }),
  /** @property {DateTimeFormat} - Date formatter for month with full names. @static */
  monthFormatter: new Intl.DateTimeFormat(SysLang, { month: 'long' }),
  /** @property {DateTimeFormat} - Date formatter for month with short names. @static */
  shortMonthFormatter: new Intl.DateTimeFormat(SysLang, { month: 'short' }),
  /** @property {DateTimeFormat} - Date formatter for 2-digit month and day. @static */
  monthDayFormatter: new Intl.DateTimeFormat(SysLang, { month: '2-digit', day: '2-digit' }),
  /** @property {DateTimeFormat} - Time formatter for 24-hour format with 2-digit hours, minutes and seconds. @static */
  timeFormatter: new Intl.DateTimeFormat(SysLang, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  /** @property {DateTimeFormat} - Time formatter for 24-hour format with 2-digit hours, minutes, seconds and
   * 3-digit milliseconds. @static */
  timeFormatterMilli: new Intl.DateTimeFormat(SysLang, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, fractionalSecondDigits: 3
  }),
  /** @property {DateTimeFormat} - Time formatter for 24-hour format with 2-digit hours and minutes. @static */
  timeFormatterHM: new Intl.DateTimeFormat(SysLang, { hour: '2-digit', minute: '2-digit', hour12: false }),
  /** @property {DateTimeFormat} - Time formatter for 12-hour format with 2-digit hours, minutes and seconds. @static */
  timeFormatter12: new Intl.DateTimeFormat(SysLang, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  }),
  /** @property {DateTimeFormat} - Time formatter for 12-hour format with 2-digit hours and minutes.  @static */
  timeFormatter12HM: new Intl.DateTimeFormat(SysLang, { hour: '2-digit', minute: '2-digit', hour12: true }),
  /** @property {DateTimeFormat} - Time formatter for 12-hour format with 2-digit hours, minutes, seconds and
   * 3-digit milliseconds. @static */
  timeFormatter12Milli: new Intl.DateTimeFormat(SysLang, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, fractionalSecondDigits: 3
  }),
  /**
   * Creates a new date from the specified object.  @static
   * @param {Object} date The object to create the date from, Which must have a `getTime` method.
   * @return {Date} The created date or original input.
   */
  from(date) {
    if (date)
      return new Date(date.getTime());
    else
      return date;
  },
  /**
   * Gets the current time with milliseconds removed. @static
   * @return {Date} Current date time value.
   */
  current() {
    let date = new Date();
    date.setMilliseconds(0);
    return date;
  }
});
Wb.apply(Date.prototype, {
  /**
   * Determines whether the current time is between the specified begin and end times (inclusive).
   * @param {Date} begin The start time.
   * @param {Date} end The end time.
   * @return {Boolean} `true` if match, `false` otherwise.
   */
  between(begin, end) {
    let t = this.getTime();
    return begin.getTime() <= t && end.getTime() >= t;
  },
  /**
   * Calculates the elapsed milliseconds between the current time and the specified date.
   * @param {Date} date The reference date to calculate elapsed time from.
   * @return {Number} Milliseconds or null if the input date is not provided.
   */
  elapse(date) {
    return date ? (this.getTime() - date.getTime()) : null;
  },
  /**
   * Converts a date to a string in the specified format.
   * Example:
   *
   *     (new Date()).format('y-MM-dd HH:mm:ss.S'); // returns like: "2025-09-29 14:26:29.012"
   *
   * @param {String} format The format string.
   * -yy: 2-digit year. When parsing years, 2-digit years are prefixed with "20" by default.
   * -y/yyyy: 4-digit year.
   * -M: Month.
   * -MM: 2-digit month, padded with a leading zero if necessary.
   * -d: Day of the month.
   * -dd: 2-digit day of the month, padded with a leading zero if necessary.
   * -H: Hour.
   * -HH: 2-digit hour, padded with a leading zero if necessary.
   * -m: Minute.
   * -mm: 2-digit minute, padded with a leading zero if necessary.
   * -s: Second.
   * -ss: 2-digit second, padded with a leading zero if necessary.
   * -S: Millisecond, with trailing zeros removed.
   * -SSS: 3-digit millisecond, padded with leading zeros if necessary.
   * @return {String} The formatted string.
   */
  format(format) {
    let me = this, str, i, j, c, val, sign, isSss;
    str = '';
    j = format.length;
    for (i = 0; i < j; i++) {
      c = format.charAt(i);
      switch (c) {
        case 'y':
          val = me.getFullYear().toString();
          // negative year
          if (val.startsWith('-')) {
            val = val.substr(1);
            sign = '-';
          } else
            sign = '';
          val = val.padStart(4, 0);
          if (format.substr(i, 4) === 'yyyy') {
            str += val.slice(-4);
            i += 3;
          } else if (format.substr(i, 2) === 'yy') {
            str += val.slice(-2);
            i++;
          } else {
            str += val.slice(-4);
          }
          str = sign + str;
          break;
        case 'M':
          val = (me.getMonth() + 1).toString();
          if (format.charAt(i + 1) === 'M') {
            str += val.padStart(2, '0'); //MM
            i++;
          } else
            str += val;
          break;
        case 'd':
          val = me.getDate().toString();
          if (format.charAt(i + 1) === 'd') {
            str += val.padStart(2, '0'); //dd
            i++;
          } else
            str += val;
          break;
        case 'H':
          val = me.getHours().toString();
          if (format.charAt(i + 1) === 'H') {
            str += val.padStart(2, '0'); //HH
            i++;
          } else
            str += val;
          break;
        case 'm':
          val = me.getMinutes().toString();
          if (format.charAt(i + 1) === 'm') {
            str += val.padStart(2, '0'); //mm
            i++;
          } else
            str += val;
          break;
        case 's':
          val = me.getSeconds().toString();
          if (format.charAt(i + 1) === 's') {
            str += val.padStart(2, '0'); //ss
            i++;
          } else
            str += val;
          break;
        case 'S':
          val = me.getMilliseconds();
          isSss = format.substr(i, 3) === 'SSS';
          if (isSss || val || !str) {
            val = val.toString().padStart(3, '0');
            if (isSss) {
              str += val;
              i += 2;
            } else {
              // remove trailing ms 0
              for (let ii = 0; ii < 2; ii++) {
                if (val.endsWith('0'))
                  val = val.slice(0, -1);
              }
              str += val;
            }
          } else {
            // remove "." before ms
            if (str.endsWith('.'))
              str = str.slice(0, -1);
          }
          break;
        case '"':
          continue;
        default:
          str += c;
      }
    }
    return str;
  },
  /**
   * Convert to JSON method.
   * @return {String} {#textValue} property.
   */
  toJSON() {
    return this.textValue;
  },
  /**
   * Converts date to string.
   * @return {String} Date string in "y-MM-dd HH:mm:ss.SSS" format.
   */
  toString() {
    return this.textValue;
  },
  /**
   * Adds specified milliseconds to date.
   * Example:
   *
   *     (new Date()).addMilliSec(3); // Adds 3 ms to the current date
   *
   * @param {Number} milliSecs Milliseconds to add.
   * @return {Date} New Date after addition.
   */
  addMilliSec(milliSecs) {
    let date = new Date(this);

    date.setMilliseconds(date.getMilliseconds() + milliSecs);
    return date;
  },
  /**
   * Adds specified seconds to date.
   * Example:
   *
   *     (new Date()).addSecond(3); // Adds 3 seconds to current date
   *
   * @param {Number} seconds Seconds to add.
   * @return {Date} New Date after addition.
   */
  addSecond(seconds) {
    let date = new Date(this);

    date.setSeconds(date.getSeconds() + seconds);
    return date;
  },
  /**
   * Adds specified minutes to date.
   * Example:
   *
   *     (new Date()).addMinute(3); // Adds 3 minutes to current date
   *
   * @param {Number} minutes Minutes to add.
   * @return {Date} New Date after addition.
   */
  addMinute(minutes) {
    let date = new Date(this);

    date.setMinutes(date.getMinutes() + minutes);
    return date;
  },
  /**
   * Adds specified hours to date.
   * Example:
   *
   *     (new Date()).addHour(3); // Adds 3 hours to current date
   *
   * @param {Number} hours Hours to add.
   * @return {Date} New Date after addition.
   */
  addHour(hours) {
    let date = new Date(this);

    date.setHours(date.getHours() + hours);
    return date;
  },
  /**
   * Adds specified days to date.
   * Example:
   *
   *     (new Date()).addDay(3); // Adds 3 days to current date
   *     (new Date()).addDay(-3); // Minus 3 days to current date
   *
   * @param {Number} days Days to add.
   * @return {Date} New Date after addition.
   */
  addDay(days) {
    let date = new Date(this);

    date.setDate(date.getDate() + days);
    return date;
  },
  /**
   * Adds specified months to date.
   * Example:
   *
   *     (new Date()).addMonth(3); // Adds 3 months to current date
   *
   * @param {Number} months Months to add.
   * @return {Date} New Date after addition.
   */
  addMonth(months) {
    let date = new Date(this),
      day = date.getDate();

    if (day > 28) {
      day = Math.min(day, date.monthFirstDate.addMonth(months).monthLastDate.getDate());
    }
    date.setDate(day);
    date.setMonth(date.getMonth() + months);
    return date;
  },
  /**
   * Adds specified years to date.
   * Example:
   *
   *     (new Date()).addYear(3); // Adds 3 years to current date
   *
   * @param {Number} years Years to add.
   * @return {Date} New Date after addition.
   */
  addYear(years) {
    let date = new Date(this),
      day = date.getDate();
    if (day > 28) {
      day = Math.min(day, date.monthFirstDate.addYear(years).monthLastDate.getDate());
    }
    date.setDate(day);
    date.setFullYear(date.getFullYear() + years);
    return date;
  },
  /**
   * Determines whether current date equals the specified date.
   * @param {Date} date Date to compare.
   * @return {Boolean} `true` if equal, `false` otherwise.
   */
  equals(date) {
    return date ? this.getTime() === date.getTime() : false;
  },
  /**
   * Determines whether the date part of current date equals that of the specified date.
   * @param {Date} date Date to compare.
   * @return {Boolean} `true` if equal, `false` otherwise.
   */
  equalsDate(date) {
    if (date) {
      return this.getDate() === date.getDate() && this.getMonth() === date.getMonth()
        && this.getFullYear() === date.getFullYear();
    }
    return false;
  },
  /**
   * Determines whether the year and month parts of current date equals those of the specified date.
   * @param {Date} date Date to compare.
   * @return {Boolean} `true` if equal, `false` otherwise.
   */
  equalsMonth(date) {
    if (date) {
      return this.getMonth() === date.getMonth() && this.getFullYear() === date.getFullYear();
    }
    return false;
  }
});
Object.defineProperties(Date.prototype, {
  /**
   * @property {String} - Local date string (4-digit year, 2-digit month and day).
   * Example:
   *
   *     new Date().dateText; // eg: "10/05/2025"
   *
   * @getter
   */
  dateText: {
    get() {
      return Date.dateFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local time string in 24-hour format (2-digit hours, minutes, seconds)
   * Example:
   *
   *     new Date().timeText; // eg: "15:03:23"
   *
   * @getter
   */
  timeText: {
    get() {
      return Date.timeFormatter.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local time string in 24-hour format (2-digit hours and minutes).
   * Example:
   *
   *     new Date().timeTextHM; // eg: "15:03"
   *
   * @getter
   */
  timeTextHM: {
    get() {
      return Date.timeFormatterHM.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local time string in 12-hour format (2-digit hours, minutes, seconds).
   * Example:
   *
   *     new Date().timeText12; // eg: "02:15:29 PM"
   *
   * @getter
   */
  timeText12: {
    get() {
      return Date.timeFormatter12.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local time string in 12-hour format (2-digit hours and minutes).
   * Example:
   *
   *     new Date().timeText12HM; // eg: "02:15 PM"
   *
   * @getter
   */
  timeText12HM: {
    get() {
      return Date.timeFormatter12HM.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 24-hour format (4-digit year, 2-digit month, day, hours, minutes,
   * seconds), date and time separated by space.
   * Example:
   *
   *     new Date().dateTimeText; // eg: "10/05/2025 13:05:29"
   *
   * @getter
   */
  dateTimeText: {
    get() {
      return this.dateText + ' ' + this.timeText;
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 24-hour format (4-digit year, 2-digit month, day, hours, minutes),
   * date and time separated by space.
   * Example:
   *
   *     new Date().dateTimeTextHM; // eg: "10/05/2025 13:05"
   *
   * @getter
   */
  dateTimeTextHM: {
    get() {
      return this.dateText + ' ' + this.timeTextHM;
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 24-hour format (4-digit year, 2-digit month, day, hours, minutes,
   * seconds), date and time separated by space. Only shows date part if hours, minutes and seconds are all 0.
   * Example:
   *
   *     new Date().autoText; // eg: "10/05/2025 13:20:36"
   *
   * @getter
   */
  autoText: {
    get() {
      let me = this;

      if (me.getHours() == 0 && me.getMinutes() == 0 && me.getSeconds() == 0)
        return me.dateText;
      return me.dateText + ' ' + me.timeText;
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 12-hour format (4-digit year, 2-digit month, day, hours, minutes,
   * seconds), date and time separated by space.

   * Example:
   *
   *     new Date().dateTimeText12; // eg: "10/05/2025 01:19:47 PM"
   *
   * @getter
   */
  dateTimeText12: {
    get() {
      return this.dateText + ' ' + this.timeText12;
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 12-hour format (4-digit year, 2-digit month, day, hours),
   * date and time separated by space.
   * Example:
   *
   *     new Date().dateTimeText12HM; // eg: "10/05/2025 01:19 PM"
   *
   * @getter
   */
  dateTimeText12HM: {
    get() {
      return this.dateText + ' ' + this.timeText12HM;
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 24-hour format (4-digit year, 2-digit month, day, hours, minutes,
   * seconds and 3-digit milliseconds). Date and time separated by space.
   * Example:
   *
   *     new Date().dateTimeMilliText; // eg: "10/05/2025 13:25:07.030"
   *
   * @getter
   */
  dateTimeMilliText: {
    get() {
      return this.dateText + ' ' + Date.timeFormatterMilli.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Local date-time string in 12-hour format (4-digit year, 2-digit month, day, hours, minutes,
   * seconds and 3-digit milliseconds). Date and time separated by space.
   * Example:
   *
   *     new Date().dateTimeMilliText12; // eg: "10/05/2025 13:25:07.030"
   *
   * @getter
   */
  dateTimeMilliText12: {
    get() {
      return this.dateText + ' ' + Date.timeFormatter12Milli.format(this);
    },
    configurable: true
  },
  /**
   * @property {String} - Optimal local date-time string in 24-hour format based on current time. Omits date part for today,
   * and omits year for the current year.
   * @getter
   */
  prettyText: {
    get() {
      let now = new Date(), date = this, nowDate = now.datePart;

      if (date >= nowDate && date < nowDate.addDay(1))
        return date.timeTextHM;
      else if (date.getFullYear() == now.getFullYear())
        return Date.monthDayFormatter.format(date) + ' ' + date.timeTextHM;
      else
        return date.dateTimeTextHM;
    },
    configurable: true
  },
  /**
   * @property {String} - Optimal local date-time string in 12-hour format based on current time. Omits date part for today,
   * and omits year for the current year.
   * @getter
   */
  prettyText12: {
    get() {
      let now = new Date(), date = this, nowDate = now.datePart;

      if (date >= nowDate && date < nowDate.addDay(1))
        return date.timeText12HM;
      else if (date.getFullYear() == now.getFullYear())
        return Date.monthDayFormatter.format(date) + ' ' + date.timeText12HM;
      else
        return date.dateTimeText12HM;
    },
    configurable: true
  },
  /**
   * @property {String} - Date value represented as text. See {#String.dateValue} for reverse conversion.
   * Example:
   *
   *     new Date().textValue; // returns: "2025-10-05 13:57:00.880"
   *
   * @getter
   */
  textValue: {
    get() {
      let date, year;

      if (Wb.isServer) {
        date = this;
      } else {
        let offset = Wb.configs.tzOffset;
        date = offset ? this.addHour(offset) : this;
      }
      year = date.getFullYear();
      // test valid
      if (isNaN(year))
        return 'Invalid Date';
      if (year < 0)
        year = '-' + year.toString().substr(1).padStart(4, '0');
      else
        year = year.toString().padStart(4, '0');
      let result, h = date.getHours(), m = date.getMinutes(),
        s = date.getSeconds(), ms = date.getMilliseconds();
      result = year.toString() + '-' + Wb.padStart(date.getMonth() + 1, 2, '0') + '-' +
        Wb.padStart(date.getDate(), 2, '0');
      if (h || m || s || ms)
        result += ' ' + Wb.padStart(h, 2, '0') + ':' + Wb.padStart(m, 2, '0') + ':'
          + Wb.padStart(s, 2, '0');
      if (ms)
        result += '.' + Wb.padStart(ms, 3, '0')
      return result;
    },
    configurable: true
  },
  /** @property {Boolean} - Determines whether the current year is a leap year. */
  isLeapYear: {
    get() {
      let year = this.getFullYear();
      return (year % 4 == 0) && (year % 100 != 0) || (year % 400 == 0);
    },
    configurable: true
  },
  /** @property {Date} - A constrained date whose year is limited to the range -9999 to 9999. For out-of-range years,
   * the value is adjusted using year%10000. @getter */
  constrainValue: {
    get() {
      let date = new Date(this), year = date.getFullYear();
      if (year > 9999 || year < -9999)
        date.setFullYear(year % 10000);
      return date;
    },
    configurable: true
  },
  /** @property {Date} - First day of the current month. @getter */
  monthFirstDate: {
    get() {
      return new Date(this.getFullYear(), this.getMonth(), 1);
    },
    configurable: true
  },
  /** @property {Date} - Last day of the current month. @getter */
  monthLastDate: {
    get() {
      return new Date(this.getFullYear(), this.getMonth() + 1, 0);
    },
    configurable: true
  },
  /** @property {Number} - Number of days in the current month. @getter */
  monthDays: {
    get() {
      return this.monthLastDate.getDate();
    },
    configurable: true
  },
  /**
   * @property {Date} - Monday of the current week (Monday as first day).
   * @getter
   */
  mondayDate: {
    get() {
      let date = new Date(this);

      date.setDate(date.getDate() - (date.getDay() || 7) + 1);
      return date;
    },
    configurable: true
  },
  /**
   * @property {Date} - Sunday of the current week (Sunday as first day).
   * @getter
   */
  sundayDate: {
    get() {
      let date = new Date(this);

      date.setDate(date.getDate() - date.getDay());
      return date;
    },
    configurable: true
  },
  /** @property {Date} - Date part of the current date. @getter */
  datePart: {
    get() {
      return new Date(this.getFullYear(), this.getMonth(), this.getDate());
    },
    configurable: true
  },
  /** @property {Date} - Time part of the current date. @getter */
  timePart: {
    get() {
      return new Date(1970, 0, 1, this.getHours(), this.getMinutes(), this.getSeconds());
    },
    configurable: true
  }
});
/**
 * WebBuilder Base Class, the root class for all WebBuilder classes. This class defines some of the most basic
 * properties, methods and events.
 */
Cls['Wb.Base'] = class base {
  /** @property {Object} - An object set to the class prototype; all members of this object will be copied to the
   * prototype. This property is invalid if the class is a mixin. */
  static protos = {
    /** @property {Boolean} instanced Whether the component is instanced. */
    /** @property {String[]} suspendedEvents Suspended events name list. @priv */
    /** @property {Number} - Suspended count. @priv */
    suspendedCount: 0
  };
  /** @property {Function} - The parent class of the current class. */
  static get parentClass() {
    return Object.getPrototypeOf(this);
  }
  /**
   * Merges the specified static property value of the current class with that of the parent classes. The merged
   * property name will be `"all" + name.capital`.
   * Example:
   *
   *     this.mergeMembers('firstNames', (parent, self) => parent.unique(self, true));
   *
   * @param {String} name Property name.
   * @param {Function} mergeFn The merging method. This method must return the merged value.
   * @param {Function} mergeFn.parentValue The parent class value.
   * @param {Function} mergeFn.selfValue The current class value.
   * @param {Function} [rootCls] The root class for merging, default is {#Wb.Base}.
   * @return {Object} The merged value.
   */
  static mergeMembers(name, mergeFn, rootCls) {
    let me = this, allName = 'all' + name.capital, allName$ = allName + '$';

    if (!rootCls)
      rootCls = Wb.Base;
    if (me === rootCls) {
      return me[allName$] = me[name];
    } else {
      let parentValues = me.parentClass[allName];
      return me[allName$] = Wb.hasProperty(me, name) ? mergeFn(parentValues, me[name]) : parentValues;
    }
  }
  /** @property {Object} - The merged setter property names of the current class prototype with those of the
   * parent classes. @priv */
  static get setterNames() {
    let me = this;
    if (!Wb.hasProperty(me, 'setterNames$')) {
      let map = Object.getOwnPropertyDescriptors(me.prototype), setters = {};
      Wb.each(map, (k, v) => {
        if (v.set)
          setters[k] = true;
      });
      me.setterNames$ = Wb.apply(setters, me.parentClass.setterNames);
    }
    return me.setterNames$;
  }
  /** @property {Object} - The merged member names (both static and prototype) of the current class with those of
   * the parent classes. Keys are member names, values indicate whether the member is a method. @priv */
  static get allMembers() {
    let me = this;
    if (!Wb.hasProperty(me, 'allMembers$')) {
      let map, names = {};
      map = Object.getOwnPropertyDescriptors(me.prototype)
      Wb.each(map, (k, v) => {
        names[k] = Wb.isFunction(v.value);
      });
      map = Object.getOwnPropertyDescriptors(me);
      Wb.each(map, (k, v) => {
        names[k] = Wb.isFunction(v.value);
      });
      me.allMembers$ = Wb.apply(names, me.parentClass.allMembers);
    }
    return me.allMembers$;
  }
  /**
   * Method to convert the current object to JSON.
   * @return {String} A JSON string representing the current object.
   * @function toJSON
   */
  /**
   * Method to convert the current object to a string.
   * @return {String} A string representing the current object.
   * @function toString
   */
  /** @property {String} cname The short name of the class. @code */
  /**
   * Fire the event with the specified name, all methods associated with the event will be executed. Events can be set
   * via {#on} method or {#events} property. If any event returns `false`, the further propagation of the event will be
   * interrupted immediately.
   * Example:
   *
   *     let continue  = container.fireEvent('remove', component);
   *
   * @param {String} eventName The event name.
   * @param {...Object} [args] The event parameters.
   * @return {Boolean} `false` if any event returns `false`, `true` otherwise.
   */
  fireEvent(eventName, ...args) {
    let me = this, event = me.events$?.[eventName];
    if (!event || me.suspendedCount > 0 || me.suspendedEvents?.includes(eventName))
      return true;
    let item, options, i, j = event.length - 1;
    for (i = j; i >= 0; i--) {
      item = event[i];
      options = item.options;
      if (options?.once)
        event.splice(i, 1);
      if (item.fn.call(item.scope ?? me, ...args, options) === false)
        return false;
    }
    return true;
  }
  /**
   * Suspends events firing for the current object. Events firing can be resumed via {#resumeEvent}.
   * @param {String} [eventName] Event name. A null or empty value indicates all events.
   */
  suspendEvent(eventName) {
    if (eventName) {
      this.suspendedEvents ??= [];
      this.suspendedEvents.push(eventName);
    } else {
      this.suspendedCount++;
    }
  }
  /**
   * Resumes events firing for the current object. Events firing can be suspended via {#suspendEvent}.
   * @param {String} [eventName] Event name. A null or empty value indicates all events.
   */
  resumeEvent(eventName) {
    if (eventName) {
      this.suspendedEvents?.remove(eventName);
    } else {
      if (this.suspendedCount > 0)
        this.suspendedCount--;
    }
  }
  /**
   * Registers one or more events. Functions associated with these events can be executed via {#fireEvent}. When the object
   * is destroyed, these events will be automatically unregistered. Duplicate events registrations with the same function
   * are ignored. See {#un} for unregistering events.
   * Example:
   *
   *     view.on('load', handlerFn, scope, {once: true});
   *     view.on({scope: container, load: handlerFn, remove: {fn: onRemoveFn, scope: otherScope, once: true}});
   *
   * @param {Object/String} configs The event configuration object or name.
   * @param {Function/Object} .* The key is event name, the value is event method or configs object.
   * @param {Function} ..fn The event method.
   * @param {...Object} [...args] The event parameters.
   * @param {Object} [...options] The event configs object itself.
   * @param {Object} [..scope] The scope (this reference) defaults to the object itself.
   * @param {Boolean} [..once] Whether the event is fired only once. If set to `true`, the event will be automatically
   * unregistered after firing.
   * @param {Object} [..*] Arbitrary user-defined parameters passed in options.
   * @param {Object} [.scope] Default scope for all events.
   * @param {Function} [fn] The event method. Valid only if `configs` is an event name.
   * @param {Object} [scope] The event scope. Valid only if `configs` is an event name.
   * @param {Object} [options] The event options. Valid only if `configs` is an event name.
   */
  on(configs, fn, scope, options) {
    let me = this, event;

    if (Wb.isObject(configs) && !fn) {
      scope = configs.scope;
      Wb.each(configs, (k, v) => {
        if (k == 'scope')
          return;
        // k is name, v is config object
        if (Wb.isObject(v)) {
          me.events$ ??= {};
          me.addProxyEvent?.(k);
          event = me.events$[k] ??= [];
          if (event.some(item => item.fn == v.fn))
            return;
          if (!v.fn)
            Wb.raise(`Null event "${k}"`);
          event.push({
            fn: v.fn,
            scope: v.scope ?? scope,
            options: v
          });
        }
        //v is method
        else if (Wb.isFunction(v)) {
          me.events$ ??= {};
          me.addProxyEvent?.(k);
          event = me.events$[k] ??= [];
          if (event.some(item => item.fn == v))
            return;
          event.push({ fn: v, scope });
        } else {
          if (v == null)
            Wb.raise(`Null event "${k}"`);
          else
            Wb.raise(`Invalid event "${k}"`);
        }
      });
    } else {
      me.events$ ??= {};
      me.addProxyEvent?.(configs);
      event = me.events$[configs] ??= [];
      if (event.some(item => item.fn == fn))
        return;
      if (!fn)
        Wb.raise(`Null event "${configs}"`);
      event.push({ fn, scope, options });
    }
  }
  /**
   * Unregisters one or more events. See {#on} for registering events.
   * Example:
   *
   *     view.un('load', handlerFn);
   *     view.un({ load: handlerFn, remove: onRemoveFn });
   *     view.un({ load: handlerFn, remove: { fn: onRemoveFn } });
   *
   * @param {Object/String} configs The event configuration object or name.
   * @param {Function/Object} .* The key is event name, the value is event method or configs object.
   * @param {Function} ..fn The event method.
   * @param {Function} [fn] See `fn` above. Valid only if `configs` is an event name.
   */
  un(configs, fn) {
    let me = this;
    if (Wb.isObject(configs)) {
      Wb.each(configs, (k, v) => {
        if (k == 'scope')
          return;
        if (Wb.isObject(v)) {
          fn = v.fn;
          me.events$?.[k]?.removeFirst(item => item.fn === fn);
          me.removeProxyEvent?.(k);
        } else if (Wb.isFunction(v)) {
          me.events$?.[k]?.removeFirst(item => item.fn === v);
          me.removeProxyEvent?.(k);
        }
      });
    } else {
      me.events$?.[configs]?.removeFirst(item => item.fn === fn);
      me.removeProxyEvent?.(configs);
    }
  }
  /**
   * Registers or unregisters events.
   * @param {Boolean} status `true` for registration, `false` for unregistration.
   * @param {...Object} args Parameters passed to the {#on}/{#un} method.
   */
  setEvents(status, ...args) {
    if (status)
      this.on(...args);
    else
      this.un(...args);
  }
  /** @property {Object} - The event configuration object. See {#on} for details. @code */
  set events(value) {
    this.on(value);
  }
  /***/
  get events() {
    return this.events$;
  }
  /**
   * Clears all {#events} of the current object.
   */
  clearEvents() {
    this.events$ = undefined;
  }
  /**
   * Sets the specified property value for the current object.
   * Example:
   *
   *     if (foo.bar.button) foo.bar.button.width = 100; // Access the setter
   *     foo.bar.button?.setter('width', 100); // Simplify the above code using the setter method
   *
   * @param {String} name The property name.
   * @param {Object} value The property value.
   * @return {Wb.Base} The current object itself.
   */
  setter(name, value) {
    this[name] = value;
    return this;
  }
  /**
   * Forces re-setting of the setter property value.
   * Example:
   *
   *     tree.resetter('plainTable', 'auto');
   *
   * @param {String} name The property name.
   * @return {Wb.Base} The current object itself.
   */
  resetter(name) {
    let me = this, name$ = name + '$', oldValue;

    oldValue = me[name$];
    me[name$] = undefined;
    me[name] = oldValue;
    return me;
  }
}
/**
 * Configurable object class. The constructor of this class is configured by passing a configs object parameter. The
 * instantiation of this class is as follows:
 * 1. Merge the class's static configs and the constructor's parameter configs into a new configs object.
 * 2. Execute the {#init} method and fire the {#*init} event.
 * 3. Set the members of configs to the instance in the order of non-setter members, members specified by {#!firstNames},
 * and setter members.
 * 4. Execute the {#ready} method and fire the {#*ready} event.
 */
Cls['Wb.Configurable'] = class configurable extends Wb.Base {
  /**
   * @property {String[]} - The names of members to be processed first. During class instantiation, members of the
   * config object specified by firstNames will be set first in sequence. Non-setter properties do not need to be set in
   * firstNames, the system will automatically process them first.
   * Example:
   *
   *     $text:{name1: value, setter1: value, setter2: value, setter3: value, name2: value}
   *     If firstNames is not specified, the default order is:
   *     name1 -> name2 -> setter1 -> setter2 -> setter3
   *     If firstNames is set to ['setter3', 'setter2'], the order is:
   *     name1 -> name2 -> setter3 -> setter2 -> setter1
   *
   * @priv
   */
  static firstNames = ['app']; // "app" must be set first to facilitate inheritance by descendant components.
  /** @property {Array} - The merged value of the current class's {#!firstNames} with that of the parent classes. @priv */
  static get allFirstNames() {
    let me = this;
    if (!Wb.hasProperty(me, 'allFirstNames$')) {
      let setterNames = me.setterNames;
      me.allFirstNames$ = me.mergeMembers('firstNames',
        (parent, self) => parent ? parent.unique(self, true) : self, Wb.Configurable);
      // Determines whether non-setter properties are set to firstNames
      me.allFirstNames$.forEach(name => {
        if (!setterNames[name])
          Wb.raise(`Name "${name}" set to firstNames must be a setter`);
      });
    }
    return me.allFirstNames$;
  }
  /** @property {Object} - The value of the {#setterNames} property name in the current class after removing
   * {#allFirstNames}. @priv */
  static get setterLastNames() {
    let me = this;
    if (!Wb.hasProperty(me, 'setterLastNames$')) {
      let setterNames = me.setterNames, firstNames = me.allFirstNames, name, lastNames = {};

      for (name in setterNames) {
        if (!firstNames.includes(name))
          lastNames[name] = true;
      }
      me.setterLastNames$ = lastNames;
    }
    return me.setterLastNames$;
  }
  /** @property {Object} - The merged value of the current class's {#!configs} with that of the parent classes. @priv */
  static get allConfigs() {
    let me = this;
    if (!Wb.hasProperty(me, 'allConfigs$'))
      me.allConfigs$ = me.mergeMembers('configs', (parent, self) => Wb.apply({}, parent, self), Wb.Configurable);
    return me.allConfigs$;
  }
  /**
   * Creates an object instance via a config object. If the object has already been instantiated, it will be returned
   * directly. The "cname" property of the config object specifies the class's short name. If cname is not specified,
   * defaults to "container" if it has an "items" property, "component" otherwise.
   * Example:
   *
   *     let button = Wb.Create({ cname: 'button' }); // Create a Button
   *
   * @param {Object} configs The config object used to create the object.
   * @return {Wb.Base} The object instance.
   */
  static create(configs) {
    if (configs?.instanced)
      return configs;
    let cname, cls;

    cname = configs.cname || (configs.items ? 'container' : 'component');
    cls = Wb.classes[cname];
    if (!cls)
      Wb.raise(`Invalid cname "${cname}"`);
    return new cls(configs);
  }
  static protos = {
    /**
     * Class initialization method, executed after setting non-setter properties and before setting setter
     * properties. Non-setter properties can be directly set to the this object, while setter properties can be set to
     * the configs parameter. This method can be overridden to perform initialization-related operations.
     * Note: Access setter properties via `configs` (e.g., configs.xxx) and other properties via `this` (e.g., this.xxx).
     * Example:
     *
     *     super.init(configs);
     *     doSomething();
     *
     * @param {Object} configs All parameters to be set. This object is a copy and can be modified.
     * @priv
     */
    init: Wb.emptyFn,
    /**
     * Class ready method, executed before constructor completion. May be overridden to perform post-initialization
     * operations.
     * Example:
     *
     *     super.ready(configs);
     *     doSomething();
     *
     * @param {Object} configs All parameters to be set. This object is a copy and can be modified.
     * @priv
     */
    ready: Wb.emptyFn
  };
  /** @property {Boolean} capture Whether events are set first (`false` for last, `true` for first). This property can control
   * whether events are triggered during initialization. For example, a text control does not trigger the "change" event
   * when the "value" property is set by default during instantiation. When setting the "value" property needs to trigger
   * the "change" event during initialization, this property can be set to true. For flexible control of multiple events,
   * use the {#on} method. Default is false. @key
   */
  /** @property {Boolean} isProperty Whether the configs object as it's parent property. Its {#cid} property is the
   * property name. */
  /**
   * Class constructor that initializes an instance with configuration object.
   * @param {Object} [configs] The config object. All non-undefined member values in the object will be set to the
   * instance. The processing order of members in the object is specified by the {#!firstNames} property.
   */
  constructor(configs) {
    let allConfigs = {}, me;

    super(configs);
    me = this;
    // Merge configs
    Wb.apply(allConfigs, me.constructor.allConfigs, configs);
    // Set non-setter properties
    me.initConfigs(allConfigs)
    // Execute init method and event
    me.init(allConfigs);
    allConfigs.events?.init?.call(me, allConfigs);
    // Set properties to the instance
    me.applyConfigs(allConfigs);
    // Execute ready method and event
    me.ready(allConfigs);
    me.fireEvent('ready', allConfigs);
    me.instanced = true;
  }
  /**
   * @event init Fires after object is inited. Setter property values can access the `configs` parameter,
   * non-setter property values can access `this`.
   * @param {Object} configs All parameters to be set. This object is a copy and can be modified.
   */
  /**
   * @event ready Fires after object is ready.
   * @param {Object} configs All parameters to be set. This object is a copy and can be modified.
   */
  /**
   * Sets all non-setter member values of the specified config object to the current instance. @priv
   * @param {Object} configs The config object.
   */
  initConfigs(configs) {
    let me = this, name, value, setterNames = me.constructor.setterNames;

    for (name in configs) {
      if (!setterNames[name]) {
        value = configs[name];
        if (value !== undefined)
          me[name] = value;
      }
    }
  }
  /**
   * Sets all setter member values of the specified config object to the current instance in a specific order. @priv
   * @param {Object} configs The config object.
   */
  applyConfigs(configs) {
    let i, j, name, value, me = this, ct = me.constructor, capture = configs.capture,
      events = configs.events, setterNames = ct.setterLastNames, firstNames = ct.allFirstNames;

    if (events) {
      configs.events = undefined;
      if (capture)
        me.events = events;
    }
    // Set properties configured in firstNames first
    j = firstNames.length;
    for (i = 0; i < j; i++) {
      name = firstNames[i];
      value = configs[name];
      if (value !== undefined)
        me[name] = value;
    }
    // Set other setter properties last
    for (name in configs) {
      if (setterNames[name]) {
        value = configs[name];
        if (value !== undefined)
          me[name] = value;
      }
    }
    if (events && !capture)
      me.events = events;
  }
  /** @property {String} - Instance identifier. The instance can be accessed via {#app}[cid]. @key */
  set cid(cid) {
    let me = this, oldCid = me.cid$;
    if (oldCid !== cid) {
      let app = me.app$;
      me.cid$ = cid;
      if (app) {
        if (app[oldCid] == me)
          delete app[oldCid];
        app[cid] = me;
      }
    }
  }
  /***/
  get cid() {
    return this.cid$;
  }
  /** @property {Object} - Stores the current instance reference to this object. The instance can be accessed
   * via {#app}[cid]. @code */
  set app(value) {
    let me = this, oldObject = me.app$;
    if (oldObject !== value) {
      let cid = me.cid$;
      me.app$ = value;
      if (cid) {
        if (oldObject?.[cid] == me)
          delete oldObject[cid];
        value[cid] = me;
      }
    }
  }
  /***/
  get app() {
    return this.app$;
  }
  /**
   * Destroys the current instance.
   */
  destroy() {
    let me = this;
    if (me.app$?.[me.cid$] == me)
      delete me.app$[me.cid$];
  }
}
/**
 * The builder class is used to generate data for specific patterns.
 */
Cls['Wb.Builder'] = class builder extends Wb.Base {
  /**
   * Generates a nested tree from flat items, each item represents a node with its full path.
   * Example:
   *
   *     let tree = Wb.Builder.getTree(['abc/def/ghi', 'abc/def/jkl']);
   *
   * @param {Array} items Array of strings to convert into tree nodes.
   * @param {String} [separator] Delimiter for splitting item paths. Defaults to "/".
   * @param {String} [icon] Default icon for tree nodes. Defaults to "folder1".
   * @return {Object[]} Nested tree array with nodes containing: icon, text, path, items[].
   */
  static getTree(items, separator, icon) {
    let result = [], target, object, secs, path;

    separator ??= '/';
    icon ??= 'folder1';
    items = items.unique().sort();
    items.forEach(item => {
      target = result;
      path = '';
      secs = item.split(separator);
      secs.forEach((text, i) => {
        if (i > 0) {
          target = object.items;
          path += separator;
        }
        path += text;
        object = target.find(item => item.text == text);
        if (!object) {
          object = { icon, text, path, items: [] };
          target.push(object);
        }
      });
    });
    return result;
  }
  /**
   * Generates a nested tree from flat items, each item represents a node with its parent-child relationship.
   * Example:
   *
   *     let tree = Wb.Builder.getLevelTree([
   *           { sid: '1', parent_id: '0', text: 'root' },
   *           { sid: '2', parent_id: '1', text: 'node1' },
   *           { sid: '3', parent_id: '1', text: 'node2' },
   *           { sid: '4', parent_id: '2', text: 'node1-1' }
   *     ]);
   *
   * @param {Object[]} items Array of records to convert into tree nodes.
   * @param {String} [keyName] Property name for unique node ID. Defaults to "sid".
   * @param {String} [parentKeyName] Property name for parent node ID. Defaults to "parent_id".
   * @param {String/Object} [rootId] ID of the root node. Defaults to "0".
   * @param {String} [itemsName] Property name for storing child nodes in each node. Defaults to "items".
   * @return {Object} Root object containing nested tree, with child nodes stored under the "itemsName" property.
   */
  static getLevelTree(items, keyName, parentKeyName, rootId, itemsName) {
    let result = {}, records = {}, nodes, parentValue, createNodes, subItems;

    keyName ??= 'sid';
    parentKeyName ??= 'parent_id';
    itemsName ??= 'items';
    rootId ??= '0';
    createNodes = (items, parentId) => {
      subItems = items[itemsName] = records[parentId] || [];
      subItems.forEach(item => createNodes(item, item[keyName]));
    }
    items.forEach(record => {
      parentValue = record[parentKeyName];
      nodes = records[parentValue];
      if (nodes) {
        nodes.push(record);
      } else {
        nodes = [record];
        records[parentValue] = nodes;
      }
    });
    createNodes(result, rootId);
    return result;
  }
  /**
   * Retrieves all descendant node IDs from flat records based on parent-child relationships.
   * Example:
   *
   *     let result = Wb.Builder.getTreeItems([
   *       { sid: '1', parent_id: '0' },
   *       { sid: '2', parent_id: '1' },
   *       { sid: '3', parent_id: '2' },
   *       { sid: '4', parent_id: '1' }
   *     ], '2');
   *     // result is: ["2", "3"]
   *
   * @param {Object[]} items Array of records containing node data.
   * @param {Object/Array} parentId Target parent node ID(s) to start searching from.
   * @param {String} [keyName] Property name for unique node ID. Defaults to "sid".
   * @param {String} [parentKeyName] Property name for parent node ID. Defaults to "parent_id".
   * @param {Boolean} [excludeSelf] Whether to exclude the input parent ID(s) from result.
   * @return {Array} Unique array of descendant node IDs.
   */
  static getTreeItems(items, parentId, keyName, parentKeyName, excludeSelf) {
    let result = [], findId, id;

    findId = pid => {
      items.forEach(rec => {
        if (rec[parentKeyName] == pid) {
          id = rec[keyName];
          result.push(id);
          findId(id);
        }
      });
    }
    keyName ??= 'sid';
    parentKeyName ??= 'parent_id';
    parentId = parentId ? Wb.toArray(parentId) : [];
    if (!excludeSelf)
      result.pushAll(parentId);
    parentId.forEach(item => findId(item));
    return result.unique();
  }
}