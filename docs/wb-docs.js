/*
 * wb-docs.js WebBuilder Document
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * WebBuilder Docs data.
 * @class WbDocsData
 */
/**
 * WebBuilder Docs.
 */
Cls['Wb.docs.App'] = class docsApp extends Wb.App {
  /** @property {Object} - External resource links. */
  static resourceLinks = {
    Number: 'obj:Number',
    Object: 'obj:Object',
    Array: 'obj:Array',
    String: 'obj:String',
    Set: 'obj:Set',
    Map: 'obj:Map',
    Date: 'obj:Date',
    Boolean: 'obj:Boolean',
    Promise: 'obj:Promise',
    Error: 'obj:Error',
    RegExp: 'obj:RegExp',
    Function: 'obj:Function',
    Node: 'api:Node',
    Element: 'api:Element',
    DateTimeFormat: 'obj:Intl/DateTimeFormat',
    NumberFormat: 'obj:Intl/NumberFormat',
    HTMLIFrameElement: 'api:HTMLIFrameElement',
    HTMLInputElement: 'api:HTMLInputElement',
    HTMLElement: 'api:HTMLElement',
    HTMLFormElement: 'api:HTMLFormElement',
    Document: 'api:Document',
    Animation: 'api:Animation',
    File: 'api:File',
    Blob: 'api:Blob',
    FileList: 'api:FileList',
    HTMLCollection: 'api:HTMLCollection',
    NamedNodeMap: 'api:NamedNodeMap',
    XMLHttpRequest: 'api:XMLHttpRequest',
    Event: 'api:Event',
    PopStateEvent: 'api:PopStateEvent'
  };
  /**
   * Init docs app.
   * @param {Object} app App scope.
   */
  static initDocs(app) {
    let ct = app.parentContainer;
    let obj = new Wb.docs.App(ct);
    if (ct)
      app.app = obj;
    else
      globalThis.app = obj;
    app.afterInit?.();
    app.afterInit = null;
    app.docInited = true;
  }
  static useLang = Str.lang == 'zh-cn' ? 'zh-CN' : 'en-US';
  /** @property {Object} - External resource link prefix. */
  static prefixLinks = {
    docs: 'https://developer.mozilla.org/' + this.useLang + '/docs',
    obj: 'https://developer.mozilla.org/' + this.useLang + '/docs/Web/JavaScript/Reference/Global_Objects',
    api: 'https://developer.mozilla.org/' + this.useLang + '/docs/Web/API',
    css: 'https://developer.mozilla.org/' + this.useLang + '/docs/Web/CSS'
  };
  /**
   * The application main function.
   */
  main() {
    let me = this, entry;

    me.id = Wb.getId() + '..';
    entry = new Wb.Viewport({
      app: me,
      layout: 'row',
      tbar: {
        layout: 'row', padding: '.2em', gap: true, items: [
          {
            cname: 'tool', icon: 'tree-view', plainIcon: true, minWidth: '2em', cid: 'treeItem', handler() {
              me.tree.visible = !me.tree.visible;
            }
          }, {
            cname: 'select',
            placeholder: Str.search,
            queryDelay: 200,
            flex: 1,
            selectMode: 'includesIC',
            icon: 'search',
            itemTpl: '<div class="w-row w-align-center w-gap"><div class="w-icon icon-{icon}"></div>' +
              '<div class="w-name">{text}</div>{if data.cls}<div class="w-sub-color">{cls}</div>{/if}' +
              '{if data.content}<div class="w-sub-text">{**content}</div>{/if}</div>',
            events: {
              beforequery(value) {
                let select = this;
                if (value === undefined && select.value && select.picker.firstItem) {
                  select.expand();
                } else if (value === '') {
                  select.collapse();
                } else {
                  select.data = me.search(value);
                  select.localQuery();
                }
                return false;
              },
              beforeselect(data) {
                me.openDoc(data.hash, this.value);
                this.collapse();
                return false;
              }
            }
          }]
      },
      listeners: {
        resize() {
          me.treeItem.visible = BodyEl.clientWidth < 800;
        }
      },
      items: [{
        cname: 'tree',
        width: '20em',
        keyWalking: true,
        pathSeparator: '.',
        autoScroll: 'auto',
        cid: 'tree',
        events: {
          beforeload(configs) {
            let node = configs.node;
            if (node) {
              node.addData(me.getDocsFolder(node.path));
              node.loaded = true;
              node.expand();
            } else {
              this.addData(me.getDocsFolder(null));
            }
            return false;
          },
          itemclick(item) {
            if (item.leaf) {
              me.openDoc(item.data.docCls);
              if (me.treeItem.visible)
                me.tree.hide();
            }
          }
        }
      }, { cname: 'splitter', cid: 'splitter' }, {
        cname: 'tab',
        cid: 'tab',
        tabMenu: true,
        flex: 1,
        area: 'center',
        useHash: true,
        hashName: 'docCls',
        gotoHash(id) {
          me.stopHash = true;
          me.openDoc(id);
          me.stopHash = false;
        }
      }]
    });
    return entry;
  }
  /***/
  ready() {
    let hash = location.hash;
    if (hash) {
      let pos;
      hash = decodeURIComponent(hash).slice(1);
      pos = hash.lastIndexOf('=');
      if (pos != -1)
        hash = hash.substr(pos + 1);
      this.openDoc(hash);
    }
  }
  /**
   * Obtain the link address of the resource.
   * @param {String} name Resource name.
   * @return {String} Resource link. Return null if not found.
   */
  getResourceLink(name) {
    let url = Wb.docs.App.resourceLinks[name];

    if (url) {
      let pos = url.indexOf(':');
      if (pos != -1) {
        let resourceUrl = Wb.docs.App.prefixLinks[url.substr(0, pos)];
        if (resourceUrl)
          return resourceUrl + '/' + url.substr(pos + 1);
      }
    }
    return null;
  }
  /**
   * Perform a global search to find documents with specified keywords. @priv
   * @param {String} value Search keywords.
   * @return {Array} Search results.
   */
  search(value) {
    let i, k, v, sk, prop, name, singleton, lowerClsKey, lowerPropKey, lowerName, mayCls, mayMember, searchKey,
      matchProp, icon, hasDot, found, pos, content, valueLen, hlValue, match, result = [], pname, exactResult = [],
      foundProp, propResult = [], items = ['property', 'sproperty', 'function', 'sfunction', 'event'],
      prefix = ['', '!', '', '!', '*'], icons = ['property', 'property', 'cube', 'cube', 'bolt'];
    const maxItems = 200;

    match = object => {
      foundProp = false;
      object.params?.each(item => {
        pname = item.name?.lastItem('.').toLowerCase();
        content = ' ' + pname + ': ' + item.title.toLowerCase();
        pos = content.indexOf(value);
        if (pos != -1) {
          matchProp = pname == value;
          foundProp = true;
          return false;
        }
      });
      if (!foundProp) {
        content = object.title;
        pos = content?.toLowerCase().indexOf(value);
        if (!(pos > -1)) {
          content = object.setter?.title;
          pos = content?.toLowerCase().indexOf(value);
          if (!(pos > -1)) {
            content = object.getter?.title;
            pos = content?.toLowerCase().indexOf(value);
            if (!(pos > -1)) {
              content = object.return?.title;
              pos = content?.toLowerCase().indexOf(value);
            }
          }
        }
      }
      if (pos > -1) {
        return content.substring(pos - 30, pos).toHTML() + hlValue.format(content.substr(pos, valueLen).toHTML()) +
          content.substring(pos + valueLen, pos + valueLen + 50).toHTML();
      } else
        return null;
    }
    value ??= '';
    valueLen = value.length;
    hlValue = '<span class="w-main-color">{0}</span>';
    value = value.toLowerCase();
    hasDot = value.includes('.');
    if (hasDot) {
      mayCls = value.beforeItem('.');
      mayMember = value.lastItem('.');
    }
    for (k in WbDocsData) {
      v = WbDocsData[k];
      singleton = v.singleton;
      lowerClsKey = k.toLowerCase();
      found = false;
      icon = v.index ? 'book1' : 'gear';
      if (!hasDot) {
        name = v.cname;
        if (name) {
          lowerName = name.toLowerCase();
          if (lowerName.includes(value)) {
            (lowerName == value ? exactResult : result).push({ text: name, hash: k, cls: k, icon, order: 1 });
            found = true;
          }
        }
      }
      if (!found && lowerClsKey.includes(value)) {
        (lowerClsKey == value ? exactResult : result).push({ text: k, hash: k, cls: '', icon, order: 2 });
        found = true;
      }
      if (!found && (pos = v.title.toLowerCase().indexOf(value)) != -1) {
        result.push({
          text: k, hash: k, cls: '', icon,
          content: v.title.substring(pos - 30, pos).toHTML() + hlValue.format(v.title.substr(pos, valueLen).toHTML()) +
            v.title.substring(pos + valueLen, pos + valueLen + 50).toHTML()
        });
      }
      //Search members
      searchKey = hasDot ? mayMember : value;
      for (i = 0; i < 5; i++) {
        icon = icons[i];
        prop = v[items[i]];
        if (prop) {
          for (sk in prop) {
            lowerPropKey = sk.toLowerCase();
            matchProp = false;
            if (lowerPropKey.includes(searchKey) &&
              (!hasDot || mayCls == (lowerClsKey.startsWith('wb-') ? 'wb' : lowerClsKey)) ||
              (content = match(prop[sk]))) {
              if (sk.startsWith('$$'))
                sk = sk.substr(2);
              (lowerPropKey == searchKey ? exactResult : (matchProp ? propResult : result)).push({
                text: sk,
                hash: k + '.' + (singleton ? '' : prefix[i]) + sk,
                cls: k,
                content,
                icon,
                order: 3
              });
            }
          }
        }
      };
    }
    exactResult.normalSort('order');
    propResult.mixSort('text');
    result.mixSort('text');
    return exactResult.concat(propResult).concat(result).slice(0, maxItems);
  }
  /**
   * Open source code and locate to the specified line.
   * @param {String} path Source file path.
   * @param {Number} [line] Source code line.
   */
  openSource(path, line) {
    let sourceCard, tab = this.tab;

    tab.each(card => {
      if (card.xPath == path) {
        card.show();
        sourceCard = card;
        return false;
      }
    });
    if (sourceCard) {
      if (line != null)
        sourceCard.firstItem.cursor = { lineNumber: line, column: 0 };
    } else {
      Wb.ajax({
        url: 'm?xwl=sys/file/open',
        params: { path: '|' + path, charset: 'UTF-8' },
        success(resp) {
          let card = tab.add({
            xPath: path, layout: 'fit', title: Wb.getFilename(path), tabTip: path, icon: 'file-js', docCls: path,
            items: { cname: 'codeEditor', value: resp.afterItem('|'), readonly: true, wrapBorder: 0 }
          });
          card.show();
          if (line != null)
            card.firstItem.cursor = { lineNumber: line, column: 0 };
        }
      });
    }
  }
  /**
   * Open the document containing the specified class or class method name.
   * @param {String} name Class or class method name.
   * @param {String} [key] Highlight key.
   */
  openDoc(name, key) {
    if (!name) return;
    if (name.endsWith('.js') || name.endsWith('.mjs')) {
      this.openSource(name);
      return;
    }
    let me = this, dotPos, el, data, cls, card, member, isMember, tab = me.tab;
    //docs
    data = WbDocsData[name];
    if (data) {
      //class
      cls = name;
    } else {
      //member
      dotPos = name.lastIndexOf('.');
      cls = name.substr(0, dotPos);
      if (cls == 'Wb') {
        member = name.substr(dotPos + 1);
        cls = me.optWbCls(member);
        name = cls + '.' + member;
      }
      data = WbDocsData[cls];
      if (!data) {
        name = me.getResourceLink(name);
        if (name)
          window.open(name);
        return;
      }
      isMember = true;
    }
    card = tab.downBy(card => card.docCls == cls);
    if (!card) {
      card = tab.add({
        cname: 'docsDetail',
        data,
        docId: me.id,
        module: me,
        inherited: true,
        title: data.caption || cls.lastItem('.'),
        tabTip: cls,
        icon: data.index ? 'book1' : 'gear',
        docCls: cls
      });
    }
    tab.useHash = false;
    card.show();
    tab.useHash = true;
    if (!me.stopHash)
      history.pushState(null, '', Wb.CardCt.getHashId(card).beforeItem('=') + '=' + name);
    if (isMember) {
      el = Wb.el(me.id + name);
      if (el) {
        card.setExpanded(el, true);
        card.lastScrollTop = card.clientEl.scrollTop;
        el.scrollIntoView();
        el.highlight();
      } else {
        //reset the search key words
        let tb = card.toolbar, searchText = tb.down('searchText'), ownedButton = tb.down('ownedButton'),
          keyButton = tb.down('keyButton'), publicButton = tb.down('publicButton'), names, bf, ef, found;
        if (searchText.value || ownedButton.active || keyButton.active || publicButton.active) {
          card.stopLoadDetail = true;
          if (searchText.value)
            searchText.value = '';
          if (ownedButton.active)
            ownedButton.active = false;
          if (keyButton.active)
            keyButton.active = false;
          if (publicButton.active)
            publicButton.active = false;
          card.stopLoadDetail = false;
          card.reloadDetail();
        }
        bf = name.beforeItem('.');
        ef = name.lastItem('.')
        names = [name];
        if (ef.startsWith('!')) {
          ef = ef.substr(1);
          names.push(bf + '.' + ef, bf + '.*' + ef);
        } else if (ef.startsWith('*')) {
          ef = ef.substr(1);
          names.push(bf + '.' + ef, bf + '.!' + ef);
        } else {
          names.push(bf + '.!' + ef, bf + '.*' + ef);
        }
        found = names.some(name => {
          el = Wb.el(me.id + name);
          if (el) {
            card.setExpanded(el, true);
            card.lastScrollTop = card.clientEl.scrollTop;
            el.scrollIntoView();
            el.highlight();
            return true;
          }
        });
        if (!found) {
          Wb.warn(Str.notFound.format(name));
          return;
        }
      }
    } else {
      if (card.lastScrollTop != null)
        card.clientEl.scrollTop = card.lastScrollTop;
    }
    if (key && data.index) {
      card.el.highlightText(key);
      card.el.query('.wx-hl')?.intoViewCenter();
    }
  }
  /**
   * Automatically select the correct class from the wb, wb client and wb server classes based on the member name.
   * @param {String} member member name.
   * @return {String} Class name.
   * @priv
   */
  optWbCls(member) {
    const clsList = ['Wb', 'Wb-Client', 'Wb-Server'];
    let data;
    return clsList.find(cls => {
      data = WbDocsData[cls];
      return data.function?.[member] || data.property?.[member] ||
        data.sfunction?.[member] || data.sproperty?.[member] ||
        data.event?.[member];
    });
  }
  /**
   * Get the directory structure of the document. All unordered documents are added to the API document node.
   * @param {String} folderName The directory name of the parent, null represents the root directory.
   * @return {Array} Folder data.
   * @priv
   */
  getDocsFolder(folderName) {
    const apiDoc = "API Docs";
    let pos, index, isFolder, name, uniqueName, inApi,
      isRoot = folderName == null,
      data = [],
      folders = {};

    if (isRoot) {
      pos = 0;
    } else {
      folderName += '.';
      if (folderName.startsWith(apiDoc)) {
        inApi = true;
        folderName = folderName.substr(apiDoc.length + 1);
      }
      pos = folderName.length;
    }
    Wb.each(WbDocsData, (k, v) => {
      if (isRoot && !v.index || inApi && v.index) {
        //api docs
        return;
      }
      if (isRoot || k.startsWith(folderName)) {
        index = k.indexOf('.', pos);
        isFolder = index != -1;
        if (isFolder) {
          name = k.substring(pos, index);
          uniqueName = name + '1';
        } else {
          name = k.substring(pos);
          uniqueName = name + '0';
        }
        if (!folders[uniqueName]) {
          folders[uniqueName] = true;
          data.push({
            text: name,
            docCls: k,
            index: v.index,
            _icon: isFolder ? null : (v.index ? 'book1' : 'gear'),
            _leaf: !isFolder
          });
        }
      }
    });
    if (inApi) {
      data.sort(function (l, r) {
        return ((l._leaf ? '1' : '0') + l.text.toLowerCase()).localeCompare((r._leaf ? '1' : '0') +
          r.text.toLowerCase());
      });
    } else {
      data.sort(function (l, r) {
        return l.index - r.index;
      });
    }
    if (isRoot) {
      data = [...data, {
        text: apiDoc
      }];
    }
    return data;
  }
}
/**
 * Docs detail page.
 */
Cls['Wb.docs.Detail'] = class docsDetail extends Wb.Card {
  static firstNames = ['data', 'expanded'];
  static configs = {
    cls: 'w-column wd-doc',
    expanded: false,
    listeners: {
      click(e) {
        let target = e.target, me = this;
        if (target.containsCls('w-link')) {
          //link
          let url = target.getAttribute('href');
          if (url?.startsWith('#')) {
            e.preventDefault();
            url = url.substr(1);
            me.module.openDoc(url);
          } else if (target.containsCls('wd-key')) {
            let path;

            if (target.xWb == 1)
              path = 'wb/js/wb-client.js';
            else if (target.xWb == 2)
              path = 'wb/ss/wb-server.js';
            else
              path = WbDocsData[target.xCls].path;
            me.module.openSource(path, target.xLine);
          }
        } else if (target.containsCls('wd-key-flag') || target.containsCls('wd-hint-desc')) {
          me.setExpanded(target.parentNode.parentNode);
        }
      }
    }
  };
  static protos = {
    expanded$: true,
    /** @property {RegExp} - Continuation regular. @priv */
    continueLineRegexp: /\\\s*\n\s*/g
  };
  /**
   * Set whether the specified item node is expanded.
   * @param {Element} node Item node.
   * @param {Boolean} [expanded] Whether to expand. Null indicates the toggle expanded status.
   */
  setExpanded(node, expanded) {
    let headerEl = node.firstChild,
      iconEl = headerEl.firstChild,
      clsEl = headerEl.lastChild,
      bodyEl = headerEl.nextSibling,
      currentExpanded = bodyEl.visible;
    if (expanded == null)
      expanded = !currentExpanded;
    if (currentExpanded != expanded) {
      if (expanded) {
        iconEl.removeCls('icon-right');
        iconEl.addCls('icon-down');
        bodyEl.show();
        clsEl.hintDescEl.remove();
        delete clsEl.hintDescEl;
      } else {
        iconEl.removeCls('icon-down');
        iconEl.addCls('icon-right');
        bodyEl.hide();
        clsEl.hintDescEl = headerEl.insertElBefore('wd-hint-desc w-sub-color', 'div', clsEl);
        clsEl.hintDescEl.textContent = bodyEl.textContent;
      }
    }
  }
  /** @property {Boolean} - Whether the item is expanded. */
  set expanded(expanded) {
    if (this.expanded$ !== expanded) {
      this.expanded$ = expanded;
      this.el.filter('wd-item').forEach(item => this.setExpanded(item, expanded));
    }
  }
  /***/
  get expanded() {
    return this.expanded$;
  }
  /** @property {Object} - Docs data. */
  set data(data) {
    let me = this, reverseClassList = [], mixinList = [], cls, parentCls, parentData,
      el, subTitle, titleEl, pathEl, isManual = !!data.index, toolbar, menuTip;

    me.data$ = data;
    me.singleton = data.singleton;
    parentCls = cls = me.docCls = data.cls;
    do {
      reverseClassList.push(parentCls);
      parentData = WbDocsData[parentCls];
      if (parentData.mixin) {
        mixinList.push(...parentData.mixin);
        reverseClassList.push(...parentData.mixin);
      }
    } while (parentCls = parentData.extend);
    me.classList = reverseClassList.copy().reverse();
    me.reverseClassList = reverseClassList;
    if (isManual)
      me.cls = 'wd-manual';
    //Start show page
    titleEl = me.addEl('w-row wd-title');
    me.docItems = [{
      name: 'sproperty',
      title: Str.staticProperty,
      cate: 'property',
      logo: 'S',
      data: me.getMembers('sproperty')
    }, {
      name: 'property',
      title: Str.property,
      cate: 'property',
      logo: 'P',
      data: me.getMembers('property')
    }, {
      name: 'sfunction',
      title: Str.staticMethod,
      cate: 'function',
      logo: 'M',
      data: me.getMembers('sfunction')
    }, {
      name: 'function',
      title: Str.method,
      cate: 'function',
      logo: 'F',
      data: me.getMembers('function')
    }, {
      name: 'event',
      title: Str.event,
      cate: 'event',
      logo: 'E',
      data: me.getMembers('event')
    }];
    menuTip = Wb.docs.Detail.menuTip ??= me.createMenuTip();
    titleEl.addEl('w-title2').textContent = isManual ? cls.lastItem('.') : cls;
    if (!isManual) {
      subTitle = [];
      if (data.cname)
        subTitle.push(data.cname);
      if (data.singleton)
        subTitle.push('singleton');
      if (data.mixin)
        subTitle.push(data.mixin.join(', '));
      subTitle.push(data.path);
      titleEl.addEl('wd-sub-title w-sub-color').textContent = subTitle.join(', ');
      if (me.classList.length > 1) {
        pathEl = me.addEl('wd-padding');
        me.classList.forEach((item, i) => {
          if (i > 0) {
            pathEl.addTag('span').textContent = ' > ';
          }
          el = pathEl.addEl('w-link', 'a');
          el.href = '#' + item;
          el.textContent = item;
        });
      }
      toolbar = this.toolbar = new Wb.Container({
        cls: 'w-row', plainIcon: true, fontSize: '.8em', owner: me, margin: '.5em 0', el: me.addEl('wd-padding'),
        gap: '.2em', defaults: { cname: 'button' }
      });
      toolbar.add([{
        cname: 'text', cid: 'searchText', placeholder: Str.search, icon: 'search', flex: 1, events: {
          change(value) {
            me.searchText = value.toLowerCase();
            if (!me.stopLoadDetail)
              me.reloadDetail.delay(me, 300);
          }
        }
      }, {
        cid: 'ownedButton', icon: 'owned', tip: Str.showOwnMembers, enableToggle: true, events: {
          toggle(active) {
            me.inherited = !me.inherited;
            me.reloadDetail();
          }
        }
      }, {
        cid: 'keyButton', icon: 'key', tip: Str.showKeyMembers, enableToggle: true, events: {
          toggle(active) {
            me.keyOnly = !me.keyOnly;
            me.reloadDetail();
          }
        }
      }, {
        cid: 'publicButton', icon: 'share3', tip: Str.showPublicMembers, enableToggle: true, events: {
          toggle(active) {
            me.showPublic = !me.showPublic;
            me.reloadDetail();
          }
        }
      }, {
        icon: 'expand', tip: Str.toggleExpand, enableToggle: true, events: {
          toggle(active) {
            me.expanded = !me.expanded;
          }
        }
      }, '-',
      { icon: 'property', cid: 'property', tip: menuTip, handler() { me.el.query('[cate=property]')?.intoViewCenter() } },
      {
        icon: 'cube', cid: 'function', strCid: 'method', tip: menuTip,
        handler() { me.el.query('[cate=function]')?.intoViewCenter() }
      },
      { icon: 'bolt', cid: 'event', tip: menuTip, handler() { me.el.query('[cate=event]')?.intoViewCenter() } }
      ]);
    }
    me.clientEl = me.addEl('wd-list');
    me.reloadDetail();
  }
  /**
   * Create property/event item menu tip. @priv
   * @return {Wb.Tip} Tip Component.
   */
  createMenuTip(comp) {
    return new Wb.Tip({
      enterRetain: true, cls: 'w-scroll-y', events: {
        click() {
          this.hide();
        },
        beforetip(comp) {
          let docEl = comp.el.parentNode.parentNode, el = this.el, text, id, a, hasItem, cid = comp.cid,
            tabId = comp.up(p => p instanceof Wb.Tab);

          el.clearChildren();
          docEl.queryAll('[cate=' + cid + ']').forEach(itemEl => {
            while (itemEl = itemEl.nextSibling) {
              a = el.addEl('w-link', 'a');
              id = itemEl.id;
              text = id.lastItem('.');
              if (text.startsWith('*'))
                text = text.substr(1);
              a.textContent = text;
              a.href = '#wb$' + tabId + '=' + id.afterItem('..');
              hasItem ??= true;
            }
          });
          el.setCls(hasItem, 'w-grid5');
          el.setCls(hasItem, 'w-grid-compact');
          if (!hasItem)
            el.textContent = Str[comp.strCid] ?? Str[cid];
        }
      }
    });
  }
  /**
   * Reload docs detail page.
   */
  reloadDetail() {
    if (this.stopLoadDetail)
      return;
    let clientEl = this.clientEl, data = this.data;
    clientEl.clearChildren();
    clientEl.addEl('wd-main-desc').innerHTML = this.docToHtml(data.title);
    this.docItems.forEach(item => {
      if (!Wb.isEmpty(item.data))
        this.appendMembers(item.data, item.name, item.title, item.logo, item.cate, data.path?.endsWith('.xwl'));
    });
    //Colorize script
    this.el.queryAll('pre[data-lang]').forEach(pre => {
      Wb.Code.colorize(pre);
    });
    if (!this.expanded$) {
      this.expanded$ = true;
      this.expanded = false;
    }
  }
  /** @property {Object} - Docs data. */
  get data() {
    return this.data$;
  }
  /**
   * Traverse the parent class to obtain all attribute members.
   * @param {String} type Member type.
   * @priv
   */
  getMembers(type) {
    let data, member, items, clsList, members = {};

    clsList = this.classList;
    clsList.forEach(cls => {
      data = WbDocsData[cls];
      items = data[type];
      if (items) {
        Wb.each(items, (k, v) => {
          member = members[k];
          if (member) {
            if (type != 'event')
              member.override = true;
          } else {
            member = members[k] = {};
          }
          Wb.applyMerge(member, Wb.clone(v));
          member.cls = cls;
          if (v.getter)
            member.getter.cls = cls;
          if (v.setter)
            member.setter.cls = cls;
        });
      }
    });
    return members;
  }
  /**
   * Merge the attributes in the accessor.
   * @return {String} Merged values.
   * @priv
   */
  mergeAccessor(value, keyName) {
    let getterVal = value.getter ? value.getter[keyName] : null,
      setterVal = value.setter ? value.setter[keyName] : null;

    //The getter and setter type are inconsistent
    if (getterVal && setterVal && getterVal != setterVal) {
      if (keyName == 'title')
        return [setterVal, getterVal];
      else
        return setterVal + ' | ' + getterVal;
    } else {
      return getterVal || setterVal;
    }
  }
  /**
   * Add a document that displays members as a list to the current document.
   * @param {Array} members List data.
   * @param {String} typeName Type name.
   * @param {String} title Title.
   * @param {String} logo Logo name.
   * @param {String} cate Category.
   * @param {Number} line Source line.
   * @return {String} HTML Script.
   * @priv
   */
  appendMembers(members, typeName, title, logo, cate, isXwl) {
    let itemEl, bodyEl, segEl, titleEl, headerEl, getter, typePrefix, setter, index = 1,
      descEl, value, type, cls, desc, div, colon, paramNames, flagCss, searchText = this.searchText,
      flags = ['key', 'config', 'readonly', 'writeonly', 'priv', 'desktop', 'touch', 'override'],
      typeColorMap = {
        S: 'w-info-bgcolor', P: 'w-warn-bgcolor', M: 'w-succ-bgcolor',
        F: 'w-active-bgcolor', E: 'w-error-bgcolor'
      },
      flagColorMap = {
        key: 'w-error-bgcolor'
      },
      currentCls = this.docCls, notInherited = !this.inherited, keyOnly = this.keyOnly,
      keys, showPublic = this.showPublic, titleTextEl, docId = this.docId;

    keys = Object.keys(members).sort((a, b) => {
      if (a.startsWith('$$'))
        a = a.substr(2);
      if (b.startsWith('$$'))
        b = b.substr(2);
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    segEl = Wb.createEl('wd-segment');
    titleEl = segEl.addEl('w-row wd-seg-title');
    titleEl.setAttribute('cate', cate);
    titleEl.addEl('wd-logo w-inverse-color ' + typeColorMap[logo]).textContent = logo;
    titleTextEl = titleEl.addEl('wd-type-text');
    if (typeName == 'event')
      typePrefix = '*';
    else if (!this.singleton && (typeName == 'sfunction' || typeName == 'sproperty'))
      typePrefix = '!';
    else
      typePrefix = '';
    keys.forEach(key => {
      value = members[key];
      if (notInherited && currentCls != value.cls || keyOnly && !value.key || showPublic && value.priv ||
        searchText && !key.toLowerCase().includes(searchText)) {
        return;
      }
      if (key.startsWith('$$'))
        key = key.substr(2);
      itemEl = segEl.addEl('wd-item w-bottom-line');
      itemEl.id = docId + currentCls + '.' + typePrefix + key;
      headerEl = itemEl.addEl('wd-header w-row w-align-center');
      headerEl.addEl('w-icon icon-down wd-key-flag w-main-color');
      if (isXwl) {
        div = headerEl.addEl('wd-key');
      } else {
        div = headerEl.addEl('wd-key w-link');
        div.xLine = value.line;
        div.xWb = value.wb;
        div.xCls = value.cls;
      }
      div.textContent = index++ + ': ' + key;
      paramNames = colon = type = null;
      getter = value.getter;
      setter = value.setter;
      if (getter || setter) {
        colon = true;
        if (getter && !setter) {
          value.readonly = true;
        } else if (!getter && setter) {
          value.writeonly = true;
        }
        type = this.mergeAccessor(value, 'type');
        cls = this.mergeAccessor(value, 'cls');
        desc = this.mergeAccessor(value, 'title');
      } else {
        cls = value.cls;
        desc = value.title;
        switch (typeName) {
          case 'property':
          case 'sproperty':
            type = value.type;
            value.config = true;
            colon = true;
            break;
          case 'function':
          case 'sfunction':
          case 'event':
            if (value.return) {
              colon = true;
              type = value.return.type;
            }
            if (value.params) {
              paramNames = [];
              value.params.forEach(param => {
                //Non sub parameters
                if (!param.name.includes('.')) {
                  if (param.optional)
                    paramNames.push('[' + param.name + ']');
                  else
                    paramNames.push(param.name);
                }
              });
              paramNames = '(' + paramNames.join(', ') + ')';
            } else {
              paramNames = '()';
            }
            break;
        }
      }
      if (key.startsWith('get$') || key.startsWith('set$'))
        value.config = undefined;
      if (paramNames)
        headerEl.addEl('wd-param-name').textContent = paramNames;
      if (colon)
        headerEl.addEl('wd-sp').textContent = ':';
      if (type)
        headerEl.addEl('wd-type').innerHTML = this.typesToHtml(type);
      flags.forEach(flag => {
        if (!value[flag])
          return;
        flagCss = flagColorMap[flag];
        if (flagCss) {
          flagCss = ' ' + flagCss + ' w-inverse-color';
        } else
          flagCss = '';
        headerEl.addEl('w-flag wd-flag' + flagCss).textContent =
          flag == 'priv' ? 'private' : flag;
      });
      headerEl.addEl('wd-cls w-link').innerHTML = this.typesToHtml(cls);
      bodyEl = itemEl.addEl('wd-body');
      descEl = bodyEl.addEl('wd-desc');
      if (desc) {
        if (Wb.isString(desc))
          descEl.innerHTML = this.docToHtml(desc);
        else {
          descEl.addEl('wd-setter').innerHTML = '<span class="wd-accessor-desc">Setter:</span>' + this.docToHtml(desc[0]);
          descEl.addEl('wd-getter').innerHTML = '<span class="wd-accessor-desc">Getter:</span>' + this.docToHtml(desc[1]);
        }
      }
      this.createParamsDoc(Str.parameters, bodyEl, value.params);
      if (value.setter)
        this.createParamsDoc('Setter ' + Str.parameters, bodyEl, value.setter.params);
      if (value.getter)
        this.createParamsDoc('Getter ' + Str.parameters, bodyEl, value.getter.params);
      this.createParamsDoc(Str.returns, bodyEl, value.return);
    });
    titleTextEl.textContent = title + ' (' + (index - 1) + ')';
    if (itemEl)
      this.clientEl.append(segEl);
  }
  /**
   * Create params docs.
   * @param {String} title Title.
   * @param {Element} el Bind element.
   * @param {Object} params Parameters object.
   * @priv
   */
  createParamsDoc(title, el, params) {
    if (!params)
      return;
    let div, descEl, paramName, depth;
    params = Wb.toArray(params);
    el.addEl('wd-params-key').textContent = title;
    params.forEach(param => {
      div = el.addEl('w-row wd-param');
      paramName = param.name || '';
      depth = paramName.occur('.') * 2 + 2;
      paramName = paramName.lastItem('.');
      div.setStyle('margin-left', depth + 'em');
      div.addEl('w-icon wd-dot');
      if (paramName) {
        if (param.optional)
          paramName = '[' + paramName + ']';
        div.addEl('wd-param-name').textContent = paramName;
        div.addEl('wd-sp').textContent = ':';
      }
      div.addEl('wd-type').innerHTML = this.typesToHtml(param.type);
      descEl = el.addEl('wd-desc');
      descEl.setStyle('margin-left', (depth + 1.7) + 'em');
      descEl.innerHTML = this.docToHtml(param.title);
    });
  }
  /**
   * Replace link tags.
   * @param {String} text Docs text.
   * @return {String} Replaced html.
   * @priv
   */
  replaceLink(text) {
    let begin, pos, name, url, resourceUrl, end = -2, lastEnd = -1, cls = this.docCls, result = '';

    while (true) {
      begin = text.indexOf("{#", end + 2);
      end = text.indexOf("}", begin + 3);
      if (begin > -1 && end > begin) {
        result += text.substring(lastEnd + 1, begin);
        name = text.substring(begin + 2, end);
        if (name.startsWith('%')) {
          //{#%} external links
          name = name.substr(1);
          resourceUrl = Wb.docs.App.resourceLinks[name];
          if (resourceUrl) {
            url = resourceUrl;
          } else {
            pos = name.indexOf('|');
            if (pos == -1) {
              url = name;
            } else {
              url = name.substr(pos + 1);
              name = name.substr(0, pos);
            }
          }
          pos = url.indexOf(':');
          if (pos != -1) {
            resourceUrl = Wb.docs.App.prefixLinks[url.substr(0, pos)];
            if (resourceUrl)
              url = resourceUrl + '/' + url.substr(pos + 1);
          }
          result += '<a class="w-link" href="' + url + '" target="_blank">' + name + '</a>';
        } else {
          pos = name.indexOf('|');
          if (pos == -1) {
            url = name;
          } else {
            url = name.substr(pos + 1);
            name = name.substr(0, pos);
          }
          if (name.includes('*')) {
            //{#*} events
            name = name.replace('*', '');
          } else if (name.includes('!')) {
            //{#!} static property
            name = name.replace('!', '');
          }
          //If the class does not exist, represented as a member
          if (!WbDocsData[url] && !url.includes('.')) {
            url = cls + '.' + url;
          }
          result += '<a class="w-link" href="#' + url + '">' + name + '</a>';
        }
        lastEnd = end;
      } else {
        result += text.substr(lastEnd + 1);
        break;
      }
    }
    return result;
  }
  /**
   * Replace image tags.
   * @param {String} text Docs text.
   * @return {String} Replaced html.
   * @priv
   */
  replaceImage(text) {
    let begin, name, url, hasImage, end = -2, lastEnd = -1, result = '';

    while (true) {
      begin = text.indexOf("{@", end + 2);
      end = text.indexOf("}", begin + 3);
      if (begin > -1 && end > begin) {
        result += text.substring(lastEnd + 1, begin);
        name = text.substring(begin + 2, end);
        if (name.includes(':'))
          url = name;
        else if (name.includes('.'))
          url = name;
        else
          url = name + '.png';
        hasImage = true;
        result += '<img src="wb/docs/images/' + url + '">';
        lastEnd = end;
      } else {
        result += text.substr(lastEnd + 1);
        break;
      }
    }
    if (hasImage)
      result += '<br>';
    return result;
  }
  /**
   * Convert types to HTML script.
   * @param {String} types Types text.
   * @return {String} HTML script.
   * @priv
   */
  typesToHtml(typesText) {
    let typesArray, type, itemArray, sectionArray = [];
    //setter/getter divider is "|"
    typesArray = typesText.split('|');
    typesArray.forEach(types => {
      itemArray = [];
      types.split('/').forEach(text => {
        type = text.trim();
        if (type.startsWith('...'))
          type = type.substr(3);
        if (type.endsWith('[]'))
          type = type.slice(0, -2);
        itemArray.push('<a class="w-link" href="#' + type.trim() + '">' + text + '</a>');
      });
      sectionArray.push(itemArray.join('/'));
    });
    return sectionArray.join(' | ');
  }
  /**
   * Convert rows separated by '|' to table rows.
   * @param {String} line Line text.
   * @return {String} Converted HTML.
   * @priv
   */
  lineToRow(line) {
    //"||" represents "|"
    line = line.replaceAll('||', '\n');
    line = line.split('|');
    line.shift();
    line.pop();
    line = '<tr><td>' + line.join('</td><td>') + '</td></tr>';
    return line.replaceAll('\n', '|');
  }
  /**
   * Convert docs text to HTML.
   * @param {String} text Docs text.
   * @return {String} Converted HTML.
   * @priv
   */
  docToHtml(text) {
    const endChars = ['.', '。', '?', '？', '!', '！', ':', '：'];
    let startScript, inTable, inUL, script, pos, nextLine, endIndex, format, lines, lastLine, lastCh, result = '';

    //Replace line continuation with an empty string
    text = text.toHTML().replace(this.continueLineRegexp, ' ');
    lines = text.split('\n');
    endIndex = lines.length - 1;
    lines.forEach((line, index) => {
      result += ' ';
      if (startScript)
        line = line.substr(5);
      else {
        line = line.trim();
        line = line.replaceAll('{{', '<code>');
        line = line.replaceAll('}}', '</code>');
        line = line.replaceAll('[[', '<strong>');
        line = line.replaceAll(']]', '</strong>');
        line = line.replaceAll('{[', '<span class="w-icon icon-');
        line = line.replaceAll(']}', '"></span>');
        line = this.replaceLink(line);
        line = this.replaceImage(line);
      }
      if (!startScript && line.startsWith('|')) {
        if (inTable) {
          result += this.lineToRow(line);
        } else {
          inTable = true;
          result += '<table class="w-table1"><thead>' + this.lineToRow(line) + '</thead><tbody>';
        }
      } else if (!startScript && line.startsWith('-')) {
        if (!inUL) {
          inUL = true;
          result += '<ul>';
        }
        result += '<li>' + line.substr(1).trim() + '</li>';
      } else {
        if (inUL) {
          result += '</ul>';
          inUL = false;
        } else if (inTable) {
          result += '</tbody></table>';
          inTable = false;
        }
        if (startScript) {
          if (line == '' || index == endIndex) {
            //End segment
            if (line)
              script.push(line);
            result += '<pre class="w-code wd-pre" data-lang="' + format + '">' +
              script.join('\n') + '</pre>';
            startScript = false;
          } else {
            script.push(line.trimRight());
          }
        } else if (line == '') {
          nextLine = lines[index + 1];
          if (nextLine?.startsWith('     ')) {
            format = 'javascript';
            if (nextLine) {
              nextLine = nextLine.trim();
              if (nextLine.startsWith('$')) {
                pos = nextLine.indexOf(':');
                format = nextLine.substring(1, pos);
                nextLine = '     ' + nextLine.substr(pos + 1).trimLeft()
                lines[index + 1] = nextLine;
              }
            }
            script = [];
            startScript = true;
          } else {
            result += '<br>';
          }
        } else {
          if (index > 0) {
            //"-","|" are special characters,"," no wrap at the end
            if (lastLine && !lastLine.startsWith('|') && !lastLine.startsWith('-') &&
              endChars.some(c => lastLine.endsWith(c)))
              result += '<br>';
            else if ((lastCh = result.charCodeAt(result.length - 1)) &&
              (lastCh != 62 && (lastCh < 256 || line.charCodeAt(0) < 256)))
              // ">"(62) means html keyword, < 256 means ascii
              result += ' ';
          }
          if (line.startsWith('#'))
            line = '<div class="wd-sec-title">' + line.substr(1).trim() + '</div>';
          result += line;
        }
      }
      lastLine = line;
    });
    return result;
  }
}