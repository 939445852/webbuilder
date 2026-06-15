/*
 * ide.js WebBuilder IDE
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * Visual UI Designer, designed and edited interfaces through drag and drop.
 */
Cls['Wb.ide.Designer'] = class ideDesigner extends Wb.Container {
  static cls = 'w-designer';
  static configs = {
    layout: 'fit',
    tabIndex: 0
  };
  /** @property {Wb.ide.XwlEditor} xwl Xwl module file Editor. */
  /***/
  init(configs) {
    let me = this;
    super.init(configs);
    me.mon('focusin', me.onDesignFocusIn);
    me.on('designselchange', me.onDesignSelChange);
  }
  /** @property {Wb.Tree} - Property tree of the designer. */
  get propTree() {
    return this.xwl.propTree;
  }
  /** @property {Wb.Tree} - Component tree of the designer. */
  get compTree() {
    return this.xwl.compTree;
  }
  /**
   * Handler for property changes. @priv
   * @param {Wb.TreeItem/Wb.TreeItem[]} nodes Component nodes or their list.
   * @param {String} name Attribute name, default updates all attributes.
   */
  notifyChangeProperty(nodes, name) {
    let data, value, comp, me = this, isProp = name == 'isProperty';
    Wb.toArray(nodes).forEach(node => {
      comp = node.bindComp;
      data = node.data;
      if (comp) {
        if (isProp) {
          if (data.properties.isProperty == 'true') {
            comp.destroy();
          }
        } else {
          value = this.getPropValue(data.cls, name, data.properties[name]);
          if (value !== undefined)
            comp[name] = value;
        }
      } else {
        if (isProp && node.parent == me.bindNode && data.properties.isProperty != 'true') {
          comp = me.createComp(node);
          while (node = node.nextSibling) {
            if (node.bindComp)
              break;
          }
          me.designCt.insertBefore(comp, node?.bindComp);
        }
      }
    });
  }
  /**
   * Handler for nodes destroy. @priv
   * @param {Wb.TreeItem/Wb.TreeItem[]} nodes Destroyed nodes.
   */
  notifyDestroy(nodes) {
    Wb.toArray(nodes).forEach(node => node.cascadeSelf(child =>
      child.bindComp?.destroy()
    ));
  }
  /**
   * Handler for properties reset. @priv
   * @param {Wb.TreeItem} node Reset node.
   * @param {Object} props Original properties.
   */
  notifyReset(node, props) {
    let comp = node.bindComp;

    if (comp) {
      Wb.each(props, (k, v) => {
        if (k != 'cid')
          comp[k] = null;
      });
    }
  }
  /**
   * Handler for node drop. @priv
   * @param {Object} data Drag and drop data.
   */
  notifyDrop(data) {
    let me = this, mode = data.mode, dropComps = [], isAppend = mode == 'append', dest = data.dest,
      parent = isAppend ? dest : dest.parent, ct = me.designCt, dropItems = data.dropItems;

    if (parent != me.bindNode) {
      dropItems.forEach(node => {
        node.bindComp?.destroy();
      });
      return;
    }
    dropItems.forEach(node => {
      if (node.data.properties.isProperty != 'true')
        dropComps.push(node.bindComp ?? me.createComp(node));
    });
    if (isAppend) {
      ct.add(dropComps);
    } else {
      let destComp, skipped;

      // Some nodes are attribute nodes and need to skip
      do {
        if (!dropItems.includes(dest) && (destComp = dest.bindComp))
          break;
        else
          skipped = true;
      } while (dest = dest.nextSibling);
      if (skipped)
        mode = 'before';
      if (mode == 'before')
        ct.insertBefore(dropComps, destComp);
      else
        ct.insertAfter(dropComps, destComp);
    }
  }
  /**
   * Fires when the designer receives focus. @priv
   * @param {Event} e Event object.
   */
  onDesignFocusIn(e) {
    let xwl = this.xwl;

    xwl.designerActive = true;
    xwl.lastFocusComp = this;
    this.syncSelection();
  }
  /**
   * Fires after a selection change has occurred. @priv
   */
  onDesignSelChange() {
    this.syncSelection();
  }
  /**
   * Synchronize the selection of the current component to it's node. @priv
   */
  syncSelection() {
    let me = this;
    if (me.designCt) {
      let nodes = me.selNodes;
      if (!nodes.length)
        nodes.push(me.bindNode);
      me.compTree.doSelect(nodes, true, false, false, true);
    }
  }
  /**
   * @event designselchange Fires when designed component selection changes.
   */
  /** @property {Wb.Container} designCt The component to design. */
  /** @property {Wb.TreeItem} bindNode The component nodes associated with the designer. */
  /** @property {Boolean} allowHandleSelect Whether to handle selection. @priv */
  /**
   * The method to execute after clicking on the design panel. @priv
   * @param {Event} e Event object.
   */
  onDesignClick(e) {
    let me = this;
    if (me.allowClick && me.allowHandleSelect)
      me.handleSelect(e);
    e.stopEvent();
  }
  /**
    * The method to execute after pressing mouse down on the design panel. @priv
    * @param {Event} e Event object.
    */
  onDesignMouseDown(e) {
    let me = this, ct = me.designCt, bodyEl = ct.bodyEl, target = e.target, comp = ct.findChildByEl(target);

    me.allowClick = true;
    me.focus();
    if (comp?.designSelected) {
      me.allowHandleSelect = true;
    } else {
      me.handleSelect(e);
      me.allowHandleSelect = false;
    }
    if (!Wb.isResizing) {
      me.isDragRect = !comp || comp?.owner || target == bodyEl;
      me.startX = e.x - bodyEl.offsetLeft + bodyEl.scrollLeft;
      me.startY = e.y - bodyEl.offsetTop + bodyEl.scrollTop;
      me.mon({
        el: DocEl,
        [Event.tapMoveName]: me.onDesignMouseMove,
        [Event.tapUpName]: me.onDesignMouseUp,
        wheel: me.onDesignMouseMove
      });
    }
  }
  /**
   * Handle components selections. @priv
   * @param {Event} e Event object.
   */
  handleSelect(e) {
    let me = this, ct = me.designCt, items = ct.items, bodyEl = ct.bodyEl, target = e.target,
      comp = ct.findChildByEl(target);

    if (e.ctrlMeta) {
      if (comp?.designSelected)
        me.deselectComp(comp);
      else
        me.selectComp(comp);
    } else if (e.shiftKey) {
      let i, j, k, lastComp = me.lastSelComp;

      if (lastComp?.parent && comp && lastComp != comp) {
        let sels = me.selComps;
        me.suspendEvent();
        try {
          j = comp.itemIndex;
          k = lastComp.itemIndex;
          if (j > k) {
            for (i = k; i <= j; i++) {
              me.selectComp(items[i]);
            }
          } else {
            for (i = j; i <= k; i++) {
              me.selectComp(items[i]);
            }
          }
        } finally {
          me.resumeEvent();
        }
        if (!sels.equals(me.selComps))
          me.fireEvent('designselchange');
      } else {
        me.selectComp(comp);
      }
    } else {
      // bodyEl.offsetWidth - bodyEl.clientWidth
      let x = e.x - bodyEl.offsetLeft + bodyEl.scrollLeft, y = e.y - bodyEl.offsetTop + bodyEl.scrollTop;
      // click on the scrollbar
      if (x < bodyEl.scrollWidth && y < bodyEl.scrollHeight) {
        if (comp)
          me.deselectAll(comp);
        else
          me.deselectAll();
      }
    }
  }
  /**
   * Fires after pressing key down of the design panel. @priv
   * @param {Event} e Event object.
   */
  onDesignKeyDown(e) {
    let me = this, lastSelComp = me.lastSelComp, comp;

    switch (e.code) {
      case Keys.Left:
      case Keys.Up:
        comp = lastSelComp?.previousSibling;
        break;
      case Keys.Right:
      case Keys.Down:
        comp = lastSelComp?.nextSibling;
        break;
      case Keys.KeyA:
        if (e.ctrlMeta) {
          me.selectAll();
          e.stopEvent();
          return;
        }
        break;
    }
    if (comp) {
      me.deselectAll(comp);
      comp.intoView();
      e.stopEvent();
    }
  }
  /** @property {Wb.TreeItem[]} - The associated nodes of selection componentsm. */
  get selNodes() {
    let selComps = this.selComps;

    if (selComps.length)
      return selComps.pluck('bindNode');
    else
      return [this.bindNode];
  }
  /** @property {Wb.Component[]} - The selection components. Returns empty array if no selection. */
  get selComps() {
    return this.designCt.filter(comp => comp.designSelected);
  }
  /** @property {Wb.Component} - The first selection component. Returns null if no selection. */
  get selComp() {
    return this.selComps[0] ?? null;
  }
  /** @property {Boolean} allowClick Whether to allowed to fire click event. @priv */
  /** @property {Wb.Component[]} startSelComps The list of selected components when begin selection. @priv */
  /**
   * Fires when moving the mouse on DocEl in the designer. @priv
   * @param {Event} e The event object.
   */
  onDesignMouseMove(e) {
    let me = this, rectEl = me.rectEl, dragField = me.dragField, x, y, ct = me.designCt, bodyEl = ct.bodyEl,
      scrollWidth = bodyEl.scrollWidth, scrollHeight = bodyEl.scrollHeight, rawX = e.x, rawY = e.y;

    x = rawX - bodyEl.offsetLeft + bodyEl.scrollLeft;
    y = rawY - bodyEl.offsetTop + bodyEl.scrollTop;
    if (!rectEl && !dragField && (Math.abs(me.startX - x) > 10 || Math.abs(me.startY - y) > 10)) {
      DocEl.addCls('w-dragging');
      me.allowClick = false;
      if (me.isDragRect) {
        rectEl = me.rectEl = bodyEl.addEl('w-d-rect');
        me.startSelComps = me.selComps;
      } else {
        let selComps = me.selComps, len = selComps.length;
        dragField = me.dragField = new Wb.DisplayField({
          value: len > 1 ? Str.selectedItems.format(len) : selComps[0].cid, cls: 'w-drag-df',
          renderEl: bodyEl, icon: 'add2'
        });
      }
    }
    if (rectEl) {
      let minX = Math.min(me.startX, x), minY = Math.min(me.startY, y), drawRect, ox, oy, el;
      rectEl.setRect({
        x: minX, y: minY,
        width: Math.min(Math.abs(me.startX - x), scrollWidth - minX - 1),
        height: Math.min(Math.abs(me.startY - y), scrollHeight - minY - 1)
      });
      ox = rectEl.offsetLeft;
      oy = rectEl.offsetTop;
      drawRect = { x: ox, y: oy, right: ox + rectEl.offsetWidth, bottom: oy + rectEl.offsetHeight };
      ct.each(comp => {
        el = comp.el;
        ox = el.offsetLeft;
        oy = el.offsetTop;
        me.suspendEvent();
        try {
          if (Wb.Math.intersect(drawRect, {
            x: ox, y: oy, right: ox + el.offsetWidth, bottom: oy + el.offsetHeight
          }))
            me.selectComp(comp);
          else
            me.deselectComp(comp);
        } finally {
          me.resumeEvent();
        }
      });
    } else if (dragField) {
      let el, nx, ny;
      el = dragField.el;
      nx = x + 10;
      ny = y + 20;
      if (nx < 0)
        nx = 0
      if (ny < 0)
        ny = 0;
      nx = Math.min(nx, scrollWidth - el.offsetWidth - 2);
      ny = Math.min(ny, scrollHeight - el.offsetHeight - 2);
      dragField.xy = [nx, ny];
      el = Wb.findEl(rawX, rawY);
      me.insertRefComp = false;
      if (bodyEl.contains(el)) {
        let sels = me.selComps, comp, lastEl = ct.lastItem.el, lastTop = lastEl.offsetTop,
          lastX = lastEl.offsetLeft + lastEl.offsetWidth, lastY = lastTop + lastEl.offsetHeight;

        comp = ct.findChildByEl(el);
        if (!comp && (!lastEl || y > lastY || y > lastTop && x > lastX) || comp && !sels.includes(comp)) {
          if (comp) {
            me.insertRefComp = comp;
            me.insertCompBefore = x < (comp.el.offsetLeft + comp.el.offsetWidth / 2);
            dragField.icon = me.insertCompBefore ? 'column-before' : 'column-after';
          } else {
            dragField.icon = 'add2';
            me.insertRefComp = null;
          }
        } else {
          dragField.icon = 'delete4';
        }
      } else {
        dragField.icon = 'delete4';
      }
    }
  }
  /**
   * Fires when mouse up on DocEl in the designer. @priv
   * @param {Event} e The event object.
   */
  onDesignMouseUp(e) {
    let me = this;

    if (me.rectEl) {
      DocEl.removeCls('w-dragging');
      me.rectEl.remove();
      me.rectEl = null;
      if (!me.startSelComps.equals(me.selComps)) {
        me.fireEvent('designselchange');
      }
      me.startSelComps = null;
    } else if (me.dragField) {
      if (me.insertRefComp !== false) {
        let ct = me.designCt, method;

        method = me.insertCompBefore ? 'insertBefore' : 'insertAfter';
        ct[method](me.selComps, me.insertRefComp);
        me.bindNode[method](me.selComps.pluck('bindNode'), me.insertRefComp?.bindNode);
        me.selComp.intoView();
        me.xwl.fireEvent('change');
      }
      DocEl.removeCls('w-dragging');
      me.dragField.destroy();
      me.dragField = null;
    }
    me.mun({
      el: DocEl,
      [Event.tapMoveName]: me.onDesignMouseMove,
      [Event.tapUpName]: me.onDesignMouseUp,
      wheel: me.onDesignMouseMove
    });
  }
  /**
   * Load compnent node and it's children nodes, and start to visual design.
   * @param {Wb.TreeItem} node The component node to design.
   */
  load(node) {
    let me = this;
    if (me.bindNode != node) {
      me.title = Str.uiDesigner + ' - ' + node.text;
      me.bindNode = node;
      me.rebuild();
    }
  }
  /**
   * Select a component.
   * @param {Wb.Component} comp Selected component.
   */
  selectComp(comp) {
    if (comp) {
      if (!comp.designSelected) {
        comp.designSelected = true;
        comp.addCls('w-d-comp-sel');
        this.fireEvent('designselchange');
      }
      this.lastSelComp = comp;
    }
  }
  /**
   * Deselect a component.
   * @param {Wb.Component} comp Deselected component.
   */
  deselectComp(comp) {
    if (comp?.designSelected) {
      comp.designSelected = false;
      comp.removeCls('w-d-comp-sel');
      if (this.lastSelComp == comp)
        this.lastSelComp = null;
      this.fireEvent('designselchange');
    }
  }
  /**
   * Select all components in the designer.
   */
  selectAll() {
    let me = this, sels = me.selComps;

    me.suspendEvent();
    try {
      me.designCt.each(comp => me.selectComp(comp));
    } finally {
      me.resumeEvent();
    }
    if (!sels.equals(me.selComps))
      me.fireEvent('designselchange');
  }
  /**
   * Deselect all components in the designer.
   * @param {Wb.Component/Wb.Component[]} [selComp] The exceptional component to be selected.
   */
  deselectAll(selComp) {
    let me = this, sels = me.selComps;

    me.suspendEvent();
    try {
      selComp = Wb.toArray(selComp);
      me.designCt.each(comp => {
        if (selComp.includes(comp))
          me.selectComp(comp);
        else
          me.deselectComp(comp);
      });
    } finally {
      me.resumeEvent();
    }
    if (!sels.equals(me.selComps))
      me.fireEvent('designselchange');
  }
  /**
   * Rebuild the designed components and their child components.
   */
  rebuild() {
    let me = this, node = this.bindNode, ct;

    if (!node)
      return;
    me.stopEvent = true;
    me.destroyAll();
    me.stopEvent = false;
    me.designCt = null;
    ct = me.designCt = me.add(me.createComp(node, true));
    if (node.hasChild) {
      node.each(sub => {
        if (sub.data.properties.isProperty != 'true')
          ct.add(me.createComp(sub));
      });
    }
    Wb.apply(ct, { isIdeDesigner: true, bodyCls: 'w-d-body', droppable: 'wb.ide' });
    ct.mon({
      scope: me,
      click: { fn: this.onDesignClick, capture: true },
      [Event.tapDownName]: me.onDesignMouseDown
    });
    ct.mon({
      el: me.el,
      scope: me,
      keydown: me.onDesignKeyDown
    });
    ct.on('destroy', f => {
      if (!me.stopEvent) {
        me.previousSibling?.hide();
        me.hide();
        me.designCt = null;
        me.bindNode = null;
      }
    });
  }
  /**
   * Convert the specified design time value to runtime value.
   * @param {String} cls The component class name.
   * @param {String} name The property name.
   * @param {String} value Design time value.
   * @return {Object} Convered runtime value, returns undefined means invalid.
   */
  getPropValue(cls, name, value) {
    let meta = Wb.ide.IDE.findControlMeta(cls, name), type, startWithAt;
    type = meta.type;
    if (!meta.design || !type)
      return undefined;
    if (!value)
      return null;
    type = type.firstItem('/');
    startWithAt = value.startsWith('@');
    if (value.startsWith('@Str.')) {
      value = Str[value.substr(5)];
    } else if (startWithAt || !type.endsWith('String') && !Wb.ide.XwlEditor.isString(type, value)) {
      if (startWithAt)
        value = value.substr(1);
      try {
        value = Wb.parse(value);
      } catch (e) {
        value = undefined;
      }
    }
    return value;
  }
  /**
   * Create a new design time component from it's node. @priv
   * @param {Wb.TreeItem} node The component node.
   * @param {Boolean} [isCt] true if it is a container.
   * @return {Wb.Component} The component instance.
   */
  createComp(node, isCt) {
    let me = this, data = node.data, cls = data.cls, cname, comp, clsObj;

    clsObj = WbDocsData[cls];
    cname = clsObj.cname;
    if (clsObj.mimic)
      cname = clsObj.mimic;
    else if (clsObj.noDesign)
      cname = 'component';
    else if (cname == 'card') {
      if (!me.designCt || !(me.designCt instanceof Wb.Tab))
        cname = 'panel';
    }
    comp = { cname, tabIndex: null, events: { destroy: me.onCompDestroy } };
    if (!isCt) {
      Wb.apply(comp, {
        resizable: {
          allowXY: false, handleBorder: false, snapX: 8, snapY: 8, events: {
            resize() {
              let el = comp.el;
              me.xwl.setValue(comp.bindNode, 'width', el.offsetWidth);
              me.xwl.setValue(comp.bindNode, 'height', el.offsetHeight);
            },
            endresize() {
              me.allowClick = false;
            }
          }
        }, cls: 'w-d-comp'
      });
    }
    Wb.each(data.properties, (k, v) => {
      if (v && (v = me.getPropValue(cls, k, v)) !== undefined) {
        comp[k] = v;
      }
    });
    comp = Wb.create(comp);
    node.bindComp = comp;
    comp.bindNode = node;
    return comp;
  }
  /**
   * Fires after the component is destroyed. @priv
   */
  onCompDestroy() {
    this.bindNode.bindComp = null;
  }
}
/**
 * Vector icon selector, used to input vector icons.
 */
Cls['Wb.ide.IconSelect'] = class iconSelect extends Wb.Select {
  static protos = {
    autoPadding: false,
    matchMode: 'includesIC'
  };
  static configs = {
    colorfulIcon: true,
    icon: 'null'
  };
  /** @property {Array} - Icon list data. */
  static get iconsData() {
    if (this.iconsData$)
      return this.iconsData$;
    let configs = Wb.ide.IDE.configs, iconsData = [];
    configs.icons.forEach(icon => iconsData.push({ text: icon, _tip: icon }));
    delete configs.icons;
    return this.iconsData$ = iconsData;
  }
  /***/
  init(configs) {
    super.init(configs);
    Wb.apply(configs.picker, { smartNavigate: 'vertical', layout: 'row wrap' });
    configs.itemTpl = '<div class="w-icon icon-{text}"></div>';
    configs.data = this.constructor.iconsData;
    this.on('change', this.onChange);
  }
  /**
   * Fires when the value of the input is changed. @priv
   * @param {String} value New value.
   */
  onChange(value) {
    this.icon = this.inList(value) ? value : 'null';
  }
}
/**
 * Imae icon selector, used to input image icons.
 */
Cls['Wb.ide.ImgSelect'] = class imgSelect extends Wb.Select {
  static protos = {
    autoPadding: false,
    matchMode: 'includesIC'
  };
  static configs = {
    colorfulIcon: true,
    smallImg: true,
    icon: 'null'
  };
  /** @property {Array} - Image list data. */
  static get imgsData() {
    if (this.imgsData$)
      return this.imgsData$;
    let configs = Wb.ide.IDE.configs, imgsData = [];
    configs.imgs.forEach(img => imgsData.push({ text: img, _tip: img }));
    delete configs.imgs;
    return this.imgsData$ = imgsData;
  }
  /***/
  init(configs) {
    super.init(configs);
    Wb.apply(configs.picker, { smartNavigate: 'vertical', layout: 'row wrap' });
    configs.itemTpl = '<div class="w-img" style="background-image: url(\'wb/images/{text}.png\')"></div>';
    configs.data = this.constructor.imgsData;
    this.on('change', this.onChange);
  }
  /**
   * Fires when the value of the input is changed. @priv
   * @param {String} value New value.
   */
  onChange(value) {
    this.img = this.inList(value) ? value : 'null';
  }
}
/**
 * Xwl file editor.
 */
Cls['Wb.ide.XwlEditor'] = class xwlEditor extends Wb.Tab {
  static configs = {
    borderLeft: 0,
    tabMenu: true,
    dblclickFull: true
  };
  static protos = {
    belongTo: 'xwl'
  };
  /**
   * Determines whether the specified editing type is a script editor type. @priv
   * @param {String/Wb.TreeItem} editType Edit type or edit property item.
   * @return {Boolean} true is script type, false otherwise.
   */
  static isScriptType(editType) {
    if (!Wb.isString(editType))
      editType = this.getEditType(editType);
    return !!this.typeScriptMap[editType] || editType.startsWith('Wb.');
  }
  /**
   * Determines whether the specified value type is string type.
   * @param {String} type The value type.
   * @param {String} v The value.
   * @return {Boolean} true String type, false otherwise.
   */
  static isString(type, v) {
    let trimedValue;

    return (type == 'Enum' || type == 'Boolean' || type == 'Number' || type == 'Mix'
      || type.startsWith('Date') || type.startsWith('Time') || type.startsWith('DateTime')
      || type.startsWith('YearMonth')) && v != 'true' && v != 'false' && v != 'null' && v != 'undefined'
      && (!v.startsWith('_$') || !v.endsWith('$_'))
      && !(trimedValue = v.trimLeft()).startsWith('{')
      && !trimedValue.startsWith('[') && !trimedValue.startsWith('(')
      && !trimedValue.startsWith('"') && !trimedValue.startsWith("'") && !Wb.isNumeric(v);
  }
  /** @property {Object} - Edit type and icon map. @priv */
  static typeIconMap = {
    Object: 'object', TextString: 'file-txt', Function: 'file-js', Array: 'array', HtmlString: 'file-html'
  };
  /** @property {Object} - Edit type and script type map. @priv */
  static typeScriptMap = {
    Object: 'javascript', TextString: 'txt', Function: 'javascript', Array: 'javascript', HtmlString: 'html'
  };
  /**
   * Gets the icon by edit type. @priv
   * @param {String} editType Edit type.
   * @return {String} The icon.
   */
  static getIcon(editType) {
    if (editType.startsWith('Wb.'))
      return 'component';
    return this.typeIconMap[editType];
  }
  /**
   * Gets the script type by edit type. @priv
   * @param {String} editType Edit type.
   * @return {String} The script type.
   */
  static getScriptType(editType) {
    if (editType.startsWith('Wb.'))
      return 'javascript';
    return this.typeScriptMap[editType] ?? 'txt';
  }
  /**
   * Gets the edit type by property node. @priv
   * @param {Wb.TreeItem} propNode The property node.
   * @return {String} The edit type.
   */
  static getEditType(propNode) {
    if (propNode.data.type == 'events')
      return 'Function';
    else {
      let type = propNode.data.meta.type;

      if (type.startsWith('Wb.'))
        return type;
      type = type.firstItem('/');
      if (type.endsWith('[]'))
        type = 'Array';
      return type;
    }
  }
  /**
   * Gets the editor by property node. @priv
   * @param {Wb.TreeItem} propNode Property node.
   * @return {Wb.Text} The editor, or String editor if not found.
   */
  static getEditor(propNode) {
    let me = this;
    if (propNode.text == 'cid')
      return me.nameEditors.cid;
    else {
      let editor, type = me.getEditType(propNode), typeEditors = me.typeEditors;
      if (type.startsWith('Wb.')) {
        editor = me.jsEditor;
        editor.types = type;
      } else {
        editor = typeEditors[type] ?? typeEditors.String;
        if (editor == me.jsEditor)
          editor.types = null;
      }
      return editor;
    }
  }
  /**
   * Static init.
   * @param {Object} configs IDE configs object.
   */
  static staticInit(configs) {
    let me = this;
    me.nameEditors = {
      cid: new Wb.Text({
        required: true, events: {
          change(value) {
            let editor = this, compNode = editor.compNodes[0];
            editor.removeError(editor.lastExistsTip);
            if (compNode.parent.some(item => item != compNode && item.text == value))
              editor.addError(editor.lastExistsTip = Str.alreadyExists.format(value));
          }
        }
      })
    };
    me.jsEditor = me.createScriptEditor('javascript');
    me.txtEditor = me.createScriptEditor('txt');
    me.htmlEditor = me.createScriptEditor('html');
    me.selectEditor = new Wb.Select({ needData: true, matchMode: 'includesIC' });
    me.colorEditor = new Wb.Color({
      triggers: {
        icon: "container", tip: Str.toggle, handler() {
          let parent = this.parent;
          parent.value = parent.value == 'true' ? 'false' : 'true';
        }
      }
    });
    me.typeEditors = {
      Boolean: me.selectEditor,
      Date: new Wb.Date({ forceDate: false, format: 'y-MM-dd' }),
      Time: new Wb.Time({ forceDate: false, format: 'HH:mm:ss.S' }),
      DateTime: new Wb.Datetime({ forceDate: false, format: 'y-MM-dd HH:mm:ss.S' }),
      YearMonth: new Wb.YearMonth({ forceDate: false, format: 'y-MM' }),
      String: new Wb.Text({
        events: {
          change(v) {
            let editor = this, propName = editor.propNode.data.text.toLowerCase();
            if ((propName.endsWith('url') || propName.endsWith('path')) && v) {
              editor.urlGotoBtn ??= editor.addFooter({
                cname: 'iconButton', icon: 'right', tip: Str.goto, rippleOnClick: false, handler() {
                  let value = this.parent.value, modulePath = editor.xwl.parent.path;

                  if (value.startsWith('@'))
                    Wb.ide.IDE.gotoLink(value.substr(1), modulePath);
                  else
                    Wb.ide.IDE.gotoLink(Wb.encode(value), modulePath);
                }
              }, editor.wrapEl);
            } else if (editor.urlGotoBtn) {
              editor.urlGotoBtn.remove();
              editor.urlGotoBtn = null;
            }
          }
        }
      }),
      Enum: me.selectEditor,
      Object: me.jsEditor,
      Array: me.jsEditor,
      Function: me.jsEditor,
      TextString: me.txtEditor,
      ColorString: me.colorEditor,
      HtmlString: me.htmlEditor,
      ImgString: new Wb.ide.ImgSelect(),
      IconString: new Wb.ide.IconSelect(),
    };
  }
  /**
   * Create script editor of the specified script language. @priv
   * @param {String} language Script language.
   * @return {Wb.ide.CodeSelect} The new script editor.
   */
  static createScriptEditor(language) {
    return new Wb.ide.CodeSelect({ language });
  }
  /**
   * Gets property title. @priv
   * @param {Wb.TreeItem} compNode The component node.
   * @param {String} propName Property or event node.
   * @return {String} The title.
   */
  static getPropTitle(compNode, propName) {
    if (propName)
      return compNode.depth == 0 ? propName : (compNode.text + '.' + propName);
    else
      return compNode.text;
  }
  /**
   * Gets the full path from the specified node property. @priv
   * @param {Wb.TreeItem} compNode The component node.
   * @param {String} propType Property type.
   * @param {String} propName Property name.
   * @return {String} Full path.
   */
  static getPropPath(compNode, propType, propName) {
    let path;

    path = compNode.depth == 0 ? '' : compNode.getPath('text', '.').afterItem('.');
    return path + (propType == 'events' ? '@' : '.') + propName;
  }
  /**
   * Whether the name is a hint property.
   * @param {String} name Property name.
   * @return {Boolean} The result.
   */
  static isHintProp(name) {
    return name == 'cid' || name == 'isProperty' || name == 'label' || name == 'title' ||
      name == 'text' || name == 'html' || name == 'url' || name == 'serverScript';
  }
  /**
   * Set the value for the property row.
   * @param {Wb.TreeItem} row Property row.
   * @param {Object} value The value to set.
   */
  static setValue(row, value) {
    let propTree = row.view, compData, rowData = row.data, propType = rowData.type, xwl,
      propName = rowData.text, isCid = propName == 'cid', isProperty = propName == 'isProperty',
      text = String(value), nodes, hintProp = this.isHintProp(propName) || propType == 'events';

    xwl = propTree.upBy(p => p instanceof Wb.ide.XwlEditor);
    nodes = propTree.compNodes;
    nodes.forEach(node => {
      compData = node.data[propType];
      compData[propName] = text;
      if (isCid)
        node.data.text = text;
      if (hintProp)
        node.refresh();
      xwl.each(card => {
        if (card.compNode == node) {
          if (isCid)
            card.title = Wb.ide.XwlEditor.getPropTitle(node, card.propName);
          if (propName == card.propName && propType == card.propType && card.mainEditor)
            card.mainEditor.value = text;
        }
      });
    });
    row.set('value', value == null ? '' : text.ellipsisLine());
    if (isCid || isProperty)
      xwl.checkDupCid();
    xwl.fireEvent('change');
    if (propType == 'properties')
      xwl.designer.notifyChangeProperty(nodes, propName);
  }
  /** @property {Wb.ide.IDE} ide Integrated development environment instance. */
  /**
   * @event change Fires after xwl properties is changed.
   */
  /**
   * @event cursorchange Fires when code editor cursor is changed.
   * @param {Object} cursor The editor cursor.
   */
  /**
   * @event focuseditor Fires when any editor in XWL receives focus.
   * @param {Wb.CodeEditor} editor Code editor.
   */
  /** @property {Boolean} designerActive Whether the designer is active at last. */
  /** @property {Wb.Component} lastFocusComp The last focused component. @priv */
  /***/
  init(configs) {
    let me = this;

    super.init(configs);
    this.backComps = [];
    this.forwardComps = [];
    configs.items = [{
      title: Str.design,
      cid: 'designCard',
      icon: 'model',
      layout: 'row',
      sortable: false,
      closable: null,
      completeEdit() {
        me.propTree.completeEdit();
      },
      items: [me.getPropTree(), '||', {
        layout: 'column', flex: 1, items: [{
          cname: 'tree', cid: 'compTree', multiSelect: true, draggable: { autoDrop: false }, droppable: 'wb.ide',
          keyWalking: true, flex: 1,
          columns: [{
            expander: true, fieldName: 'text', width: -1, render(v, data, c, el) {
              let subText, div, prop = data.properties;
              el.cls = 'w-row w-gap';
              if (prop?.isProperty == 'true')
                el.addCls('w-active-color');
              if (this.hasDupCid)
                el.addCls('w-key-color');
              el.addEl().textContent = v;
              subText = prop && (prop.url || prop.text || prop.html || prop.title || prop.label);
              if (subText) {
                if (subText.startsWith('@Str.'))
                  subText = Str[subText.substr(5)];
                if (subText) {
                  div = el.addEl('w-sub-color w-link');
                  div.textContent = subText.ellipsis(30);
                  if (prop.url)
                    div.xLinkType = 'url'
                  else if (prop.text)
                    div.xLinkType = 'text'
                  else if (prop.html)
                    div.xLinkType = 'html'
                  else if (prop.title)
                    div.xLinkType = 'title'
                  else if (prop.label)
                    div.xLinkType = 'label'
                }
              }
              if (prop?.serverScript) {
                div = el.addEl('w-link');
                div.textContent = 'serverScript';
                div.xLinkType = 'serverScript';
              }
              Wb.each(data.events, (k, v) => {
                if (v) {
                  div = el.addEl('w-link');
                  div.textContent = k;
                  div.xLinkType = 'event';
                }
              });
            }
          }],
          events: {
            itemclick(item, e) {
              let target = e.target, linkType = target.xLinkType;

              if (linkType == 'event') {
                me.editProp(item, target.textContent, 'events');
              } else if (linkType) {
                me.editProp(item, linkType, 'properties');
              }
            },
            itemdblclick(item, e) {
              if (e.ctrlMeta) {
                me.designNode(item, true);
                e.stopEvent();
              }
            },
            selectionchange() {
              let sels = this.selections, propTree = me.propTree, node, firstItem;

              propTree.completeEdit();
              if (!sels.length) {
                firstItem = this.firstItem;
                if (!firstItem)
                  return;
                sels = [firstItem];
              }
              node = sels[0];
              propTree.compNodes = sels;
              me.reloadProperties();
              me.ide.setActions();
              me.backComps.push(node);
              if (app.linkControlItem.active)
                app.linkToControl();
            },
            itemdrag(data) {
              let dest = data.dest;
              if (!this.contains(data.dest)) {
                // only self drag
                data.allowDrop = false;
                return false;
              }
              if (dest?.isView)
                data.dest = dest.firstItem;
              // set mode to "append" in the root node
              if (dest?.depth == 0)
                data.mode = 'append';
              // return false when includes root node
              if (data.source.includes(this.firstItem))
                data.allowDrop = false;
            },
            itemdrop(data) {
              let parentNode, acceptDrop = true, dropItems = data.source, existsText = {};

              parentNode = data.mode == 'append' ? data.dest : data.dest.parent;
              parentNode.each(node => {
                if (!dropItems.includes(node))
                  existsText[node.text] = true;
              });
              dropItems.each(node => {
                if (existsText[node.text]) {
                  Wb.tipWarn(Str.alreadyExists.format(node.text));
                  acceptDrop = false;
                  return false;
                }
              });
              if (acceptDrop) {
                data.acceptDrop();
                me.designer.notifyDrop(data);
                me.checkDupCid();
                me.fireEvent('change');
              }
            }
          }, listeners: {
            focusin() {
              me.designerActive = false;
              me.lastFocusComp = this;
            }
          }
        }, { cname: 'splitter', visible: false, cid: 'designSplitter' },
        {
          cname: 'ideDesigner', cid: 'designer', height: '50%', xwl: me, visible: false
        }
        ]
      }]
    }, {
      title: Str.source,
      cid: 'sourceCard',
      icon: 'script',
      sortable: false,
      layout: 'fit',
      closable: null,
      items: {
        cname: 'codeEditor',
        cid: 'sourceEditor',
        wrapBorder: 0,
        readonly: true,
        isModified: true,
        events: {
          ready() {
            this.editor.onMouseDown(e => {
              let pos = e.target.position;
              if (!pos || e.event.buttons != 1)
                return;
              let line = pos.lineNumber, col = pos.column - 1, key;

              key = me.sourceKeys.find(item => item.line == line && col >= item.pos &&
                col <= item.pos + item.name.length);
              if (key) {
                if (key.isComp) {
                  me.designCard.show();
                  key.node.findBy(n => n.text == key.name)?.select();
                } else {
                  me.editProp(key.node, key.name, key.type);
                }
              }
            });
          },
          cursorchange(cursor) {
            me.fireEvent('cursorchange', cursor);
          },
          focus() {
            me.fireEvent('focuseditor', this);
          }
        }
      }
    }
    ];
    me.on('change', f => {
      me.sourceEditor.isModified = true;
    });
  }
  /** @property {Boolean} - Indicates that the home card of XWL editor is currently active. */
  get homeActivate() {
    return this.activeCard == this.designCard;
  }
  /** @property {Wb.Tree} - The active property editor or null if not found. */
  get activePropTree() {
    let tree = this.activeCard?.propTree ?? this.propTree;
    return tree.activated ? tree : null;
  }
  /** @property {Wb.Tree} - The active designer or null if not found. */
  get activeDesigner() {
    return Wb.getActiveComp(Wb.ide.Designer);
  }
  /**
   * Design the selection node.
   */
  designSelNode() {
    this.designNode(this.compTree.selection);
  }
  /**
   * Design the specified node.
   * @param {Wb.TreeItem} node The node to design.
   * @param {Boolean} [silent] Whether not show hints.
   */
  designNode(node, silent) {
    if (!node) {
      if (!silent)
        Wb.tipSelect();
    } else if (Wb.ide.IDE.canDesign(node.data.cls)) {
      let splitter = this.designSplitter, designer = this.designer;
      if (designer.bindNode == node) {
        designer.destroyAll();
      } else {
        splitter.show();
        designer.show();
        designer.load(node);
      }
    } else if (!silent) {
      Wb.tipWarn(Str.cannotDesign.format(node.text));
    }
  }
  /**
   * Set the specified value into the component node.
   * @param {Wb.TreeItem} node The component node.
   * @param {String} name The property name.
   * @param {Object} value The value to set.
   * @param {Boolean} [isEvent] Whether is event.
   */
  setValue(node, name, value, isEvent) {
    let me = this, data = node.data, propTree = me.propTree, type, isCid, isProperty,
      text = String(value), isHintProp = Wb.ide.XwlEditor.isHintProp;

    if (isEvent) {
      data.events ??= {};
      data.events[name] = text;
      type = 'events';
    } else {
      data.properties[name] = text;
      type = 'properties';
    }
    isCid = name == 'cid';
    isProperty = name == 'isProperty';
    if (isCid)
      node.data.text = text;
    if (isHintProp(name))
      node.refresh();
    me.each(card => {
      if (card.compNode == node) {
        if (isCid)
          card.title = Wb.ide.XwlEditor.getPropTitle(node, card.propName);
        if (name == card.propName && type == card.propType && card.mainEditor)
          card.mainEditor.value = text;
      }
    });
    if (propTree.compNodes.includes(node)) {
      propTree.downBy(item => item.text == name && item.data.type == type)?.set('value',
        value == null ? '' : text.ellipsisLine());
    }
    if (isCid || isProperty)
      me.checkDupCid();
    me.fireEvent('change');
    if (!isEvent)
      me.designer.notifyChangeProperty(node, name);
  }
  /**
   * Fires after source code page is shown. @priv
   */
  onSourceShow() {
    let me = this, editor = me.sourceEditor;

    if (!editor.isModified)
      return;
    editor.isModified = false;
    me.completeEdit();
    let script = '', findMeta = Wb.ide.IDE.findControlMeta, keys = [], line = 1, newScript, fn;

    fn = node => {
      let data, items, props, meta, isFirst, type, indent, indent0, indent1, indent2, params,
        isString = Wb.ide.XwlEditor.isString;

      data = node.data;
      script += '{';
      indent = '  '.repeat(node.depth + 1);
      indent0 = indent.substr(2);
      indent1 = indent + '  ';
      indent2 = indent1 + '  ';
      props = data.properties;
      script += '\n' + indent + 'cname: "' + (props.cname || WbDocsData[data.cls].cname) + '"';
      if (props.cname)
        keys.push({ line: line + 1, pos: indent.length, node, name: 'cname', type: 'properties' });
      line++;
      Wb.each(props, (k, v) => {
        if (k == 'cname' || !v) return;
        newScript = ',';
        meta = findMeta(data.cls, k);
        type = meta.type ?? '';
        type = type.firstItem('/');
        keys.push({ line: line + 1, pos: indent.length, node, name: k, type: 'properties' });
        if (type == 'Function') {
          newScript += '\n' + indent + k + '(' + (meta.params?.pluck('name').join(', ') || '') + '){\n';
          newScript += v.addPrefix(indent1);
          newScript += '\n' + indent + '}';
        } else {
          newScript += '\n' + indent + k + ': ';
          v = String(v);
          if (type.endsWith('String') || isString(type, v)) {
            v = Wb.encode(v);
          } else {
            v = v.addPrefix(indent).substr(indent.length);
          }
          newScript += v;
        }
        script += newScript;
        line += newScript.occur('\n');
      });
      items = node.items;
      // Properties
      items?.forEach(subNode => {
        props = subNode.data.properties;
        if (props.isProperty == 'true') {
          line++;
          keys.push({ line, pos: indent.length, node, name: props.cid, type: 'properties', isComp: true });
          script += ',\n' + indent + props.cid + ': ';
          fn(subNode);
        }
      });
      // Events
      if (Wb.find(data.events, (k, v) => v)) {
        script += ',\n' + indent + 'events: {\n' + indent1;
        line += 2;
        isFirst = true;
        Wb.each(data.events, (k, v) => {
          if (!v)
            return;
          if (isFirst)
            isFirst = false;
          else {
            script += ',\n' + indent1;
            line++;
          }
          newScript = '';
          keys.push({ line, pos: indent1.length, node, name: k, type: 'events' });
          meta = findMeta(data.cls, k, true);
          params = [];
          meta?.forEach(item => {
            if (!item.name.startsWith('.'))
              params.push(item.name);
          });
          params.push('options');
          newScript += k + '(' + params.join(', ') + '){\n';
          newScript += v.addPrefix(indent2);
          newScript += '\n' + indent1 + '}';
          script += newScript;
          line += newScript.occur('\n');
        });
        script += '\n' + indent + '}';
        line++;
      }
      // child nodes
      if (items.some(subNode => subNode.data.properties.isProperty != 'true')) {
        script += ',\n' + indent + 'items : [';
        line++;
        isFirst = true;
        items.forEach(subNode => {
          if (subNode.data.properties.isProperty != 'true') {
            if (isFirst)
              isFirst = false;
            else {
              script += ',\n' + indent;
              line++;
            }
            fn(subNode);
          }
        });
        script += '\n' + indent + ']';
        line++;
      }
      script += '\n' + indent0 + '}';
      line++;
    };
    fn(me.compTree.firstItem);
    editor.rawValue = '(' + script + ')';
    me.sourceKeys = keys;
    let decorations = [], decOptions = { inlineClassName: 'w-link1' };

    keys.forEach(key => {
      decorations.push({
        range: new monaco.Range(key.line, key.pos + 1, key.line, key.pos + 1 + key.name.length, 24),
        options: decOptions
      });
    });
    me.decorations = editor.editor.deltaDecorations(me.decorations ?? [], decorations);
  }
  /***/
  focus() {
    if (this.activeIndex == 0)
      this.propTree.focus();
    else
      this.activeCard.validChild?.focus();
  }
  /**
   * Determines whether there are components with the same CID in the component tree. @priv
   */
  checkDupCid() {
    const cls = 'w-key-color';
    let map = {}, text, data, el;

    this.compTree.cascade(node => {
      data = node.data$;
      if (data.properties.isProperty != 'true') {
        text = data.text;
        map[text] = (map[text] ?? 0) + 1;
      }
    });
    this.compTree.cascade(node => {
      data = node.data$;
      el = node.textEl;
      if (data.properties.isProperty == 'true') {
        node.hasDupCid = 0;
        el.removeCls(cls);
      } else {
        text = data.text;
        if (map[text] > 1) {
          if (!node.hasDupCid) {
            node.hasDupCid = 1;
            el.addCls(cls);
          }
        } else {
          if (node.hasDupCid) {
            node.hasDupCid = 0;
            el.removeCls(cls);
          }
        }
      }
    });
  }
  /** @property {Wb.CodeEditor} - The main code editor in the current tab card. */
  get mainEditor() {
    return this.activeCard$?.mainEditor;
  }
  /**
   * Remove selection components in the tree.
   * @param {Boolean} [noFocus] Whether to not set focus.
   */
  removeSelComps(noFocus) {
    let me = this, tree = me.compTree, root = tree.firstItem;

    if (root.selected) {
      me.removeBindings(root);
      root.destroyAll();
      root.data.text = 'module';
      root.data.properties = { cid: 'module' };
      root.data.events = {};
      root.refresh();
      me.reloadProperties();
    } else {
      me.removeBindings(tree.topSelections);
      tree.delRecords(noFocus);
    }
    me.checkDupCid();
  }
  /**
   * Remove the components bound to the node and all its child nodes. These components include
   * script editor opened in a separate card. @priv
   * @param {Wb.TreeItem/Wb.TreeItem[]} nodes The nodes to remove.
   * @param {Boolean} [keepDesign] Whether to keep components in the designer.
   */
  removeBindings(nodes, keepDesign) {
    let me = this, compNode;

    nodes = Wb.toArray(nodes);
    if (!keepDesign)
      me.designer.notifyDestroy(nodes);
    me.each(card => {
      compNode = card.compNode;
      if (compNode && nodes.some(node => node.contains(compNode))) {
        card.destroy();
      }
    }, true, true);
    me.fireEvent('change');
  }
  /**
   * Gets the specified node by property name and type. @priv
   * @param {String} propName The property name.
   * @param {String} propType The property type.
   * @return {Wb.TreeItem} The property node.
   */
  getPropNode(propName, propType) {
    return this.propTree.downBy(item => item.data.text == propName && item.data.type == propType);
  }
  /**
   * Edit the properties of the specified component. @priv
   * @param {String/Wb.TreeItem} compNode The edited component or its path, if it is a path separated by "/".
   * @param {String} propName The property name.
   * @param {String} propType The property type.
   * @param {Boolean} [inPropEditor] Whether open in the embedded property editor.
   * @return {Wb.Text/Wb.CodeEditor} The matching editor or null.
   */
  editProp(compNode, propName, propType, inPropEditor) {
    let me = this, propNode, editType, XWL = Wb.ide.XwlEditor;

    if (Wb.isString(compNode)) {
      compNode = me.compTree.findPath(compNode, null, '.');
      if (!compNode)
        return null;
    }
    if (!compNode.selected || !(propNode = me.getPropNode(propName, propType))) {
      // need singe select
      compNode.select();
      propNode = me.getPropNode(propName, propType);
      if (!propNode)
        return;
    }
    propNode.select();
    editType = XWL.getEditType(propNode);
    if (!inPropEditor && XWL.isScriptType(editType)) {
      let card = me.editScript(compNode, propNode, propName, propType,
        XWL.getScriptType(editType), propType == 'events' ? 'bolt' : XWL.getIcon(editType));
      compNode.forceView();
      return card.mainEditor;
    } else {
      me.designCard.show();
      me.propTree.startEdit(propNode, 1);
      compNode.forceView();
      return Wb.Editor.activeEditor;
    }
  }
  /**
   * Edit the script property. @priv
   * @param {Wb.TreeItem} compNode The component node.
   * @param {Wb.TreeItem} propNode The property node.
   * @param {String} propName Property name.
   * @param {String} propType Property type.
   * @param {String} language Script language.
   * @param {String} icon Card icon.
   * @return {Wb.Card} The opened card of the script editor.
   */
  editScript(compNode, propNode, propName, propType, language, icon) {
    let card, me = this, XWL = Wb.ide.XwlEditor, paramsDesc, meta, isEvents;

    card = me.findBy(card => card.compNode == compNode && card.propName == propName &&
      card.propType == propType);
    if (card) {
      card.show();
      card.mainEditor.focus();
    } else {
      meta = propNode.data.meta;
      isEvents = propType == 'events';
      if (isEvents || meta.type?.startsWith('Function')) {
        let params = [];
        meta.params?.forEach(item => {
          if (!item.name.startsWith('.'))
            params.push(item.name);
        });
        if (isEvents)
          params.push('options');
        paramsDesc = params.length ? ('(' + params.join(', ') + ')') : null;
      }
      card = me.add({
        title: XWL.getPropTitle(compNode, propName),
        tabTip() {
          return XWL.getPropPath(compNode, propType, propName);
        },
        layout: paramsDesc ? 'column' : 'fit',
        compNode,
        cid: Wb.getId(),
        propName,
        propType,
        icon,
        completeEdit() {
          let editor = this.mainEditor;
          editor.completeEdit();
          if (editor.isModified) {
            let value = editor.value;
            compNode.data[propType][propName] = value;
            if (propType == 'properties')
              me.designer.notifyChangeProperty(compNode, propName);
            editor.isModified = false;
            compNode.refresh();
            if (me.propTree.compNodes.includes(compNode)) {
              // update values in property editor
              let propNode = me.getPropNode(propName, propType);
              if (propNode)
                propNode.proxy.value = value.ellipsisLine();
            }
          }
        },
        footers: paramsDesc ? {
          layout: 'row', height: '1.5em', items: ['->',
            { cname: 'label', noWrap: true, textSelectable: true, cls: 'w-sub-color w-margin-r', text: paramsDesc }]
        } : undefined,
        items: {
          cname: 'codeEditor',
          cid: 'mainEditor',
          wrapBorder: 0,
          canValidate: true,
          autoComplete: true,
          serverScript: propName == 'serverScript',
          xwlTree: me.compTree,
          language,
          cls: paramsDesc ? 'w-flex-body' : undefined,
          rawValue: compNode.data[propType][propName],
          events: {
            change() {
              this.isModified = true;
              me.fireEvent('change');
            },
            cursorchange(cursor) {
              me.fireEvent('cursorchange', cursor);
            },
            focus() {
              me.fireEvent('focuseditor', this);
            },
            destroy() {
              let ide = me.ide;
              ide.removeMarkers(this);
              ide.refreshFileFlag(me.parent?.path);
            }
          }
        }
      });
      card.mainEditor = card.down('mainEditor');
      card.show();
    }
    return card;
  }
  /***/
  ready(configs) {
    super.ready(configs);
    this.compTree.firstItem?.select();
  }
  /**
   * Fires when a new tab card is activated. @priv
   * @param {Wb.Component} newCard The newly activated card.
   * @param {Wb.Component} oldCard The previously active card.
   */
  onCardChange(newCard, oldCard) {
    super.onCardChange(newCard, oldCard);
    if (oldCard) {
      oldCard.completeEdit?.();
    }
    if (newCard) {
      if (newCard == this.sourceCard)
        this.onSourceShow();
      if (newCard == this.designCard)
        this.lastFocusComp?.focus();
      else
        newCard.mainEditor?.focus?.();
    }
  }
  /**
   * Completes the edit if there is an active edit in progress.
   */
  completeEdit() {
    this.activeCard?.completeEdit?.();
  }
  /** @property {Wb.TreeItem[]} backComps Back component nodes list. @priv */
  /** @property {Wb.TreeItem[]} forwardComps Forward component nodes list. @priv */
  /**
   * Back to the last selected component node.
   */
  compBack() {
    let node, backComps = this.backComps, forwardComps = this.forwardComps;

    if (backComps.length > 1) {
      forwardComps.push(backComps.pop());
      if (forwardComps.length > 50)
        forwardComps.shift();
      do {
        node = backComps.pop();
      } while (node?.destroyed);
      node?.select();
    }
  }
  /**
   * Forward to the backed component node.
   */
  compForward() {
    let node, forwardComps = this.forwardComps;

    if (forwardComps.length > 0) {
      do {
        node = forwardComps.pop();
      } while (node?.destroyed)
      node?.select();
    }
  }
  /**
   * Get property editor tree configs object. @priv
   * @return {Object} Configs object.
   */
  getPropTree() {
    let me = this;
    return {
      cname: 'tree', borderLeft: 0, showIcon: false, compact: true, cid: 'propTree', droppable: 'wb.ide',
      gridLine: true, width: '27em', leafIndent: false, leafExpander: false, editable: true,
      title: Str.objectInspector, columnsDraggable: false, autoDestroyEditors: false, header: false,
      tools: [{
        icon: 'left', tip: Str.back, keys: 'Alt+5', handler() { me.compBack(); }
      }, {
        icon: 'right', tip: Str.forward, keys: 'Alt+6', handler() { me.compForward(); }
      }, {
        icon: 'property', tip: Str.property, handler() {
          me.propTree.find(node => node.data.type == 'properties')?.contentEl.scrollIntoView();
        }
      }, {
        icon: 'bolt', tip: Str.event, handler() {
          me.propTree.find(node => node.data.type == 'events')?.contentEl.scrollIntoView();
        }
      }, {
        icon: 'header', tip: Str.showHeader, enableToggle: true, events: {
          toggle(active) {
            me.propTree.header = active;
          }
        }
      }, {
        icon: 'owned', cid: 'showOwnBtn', tip: Str.showOwnMembers, enableToggle: true, events: {
          toggle() {
            me.reloadProperties();
          }
        }
      }, {
        icon: 'key', cid: 'showKeyBtn', tip: Str.showKeyMembers, enableToggle: true, events: {
          toggle() {
            me.reloadProperties();
          }
        }
      }, {
        icon: 'done', cid: 'showValuedBtn', tip: Str.showValuedMembers, enableToggle: true, events: {
          toggle() {
            me.reloadProperties();
          }
        }
      }],
      columns: [{
        expander: true, fieldName: 'text', editor: false, text: Str.name, width: '11em', render(v, data, c, el) {
          el.parentNode.addCls('w-fixed-cell');
          if (data.multiValues)
            el.addCls('w-error-color');
          if (data.meta?.key)
            el.addCls('w-key-color');
          if (data.meta?.deprecated)
            el.addCls('w-line-through');
          return v;
        }
      }, {
        fieldName: 'value', text: Str.value, width: -1, resizable: false, render(v, data, c, el) {
          let iconEl, textEl, wrapEl;
          if (v) {
            switch (data.meta?.type) {
              case 'ImgString':
                el.cls = 'w-iconcell';
                wrapEl = el.addEl('w-iconcell-wrap');
                iconEl = wrapEl.addEl('w-iconcell-icon w-small-img');
                iconEl.setStyle('background-image', 'url(wb/images/' + v + '.png)');
                textEl = wrapEl.addEl('w-iconcell-text');
                textEl.textContent = v;
                break;
              case 'IconString':
                el.cls = 'w-iconcell';
                wrapEl = el.addEl('w-iconcell-wrap');
                iconEl = wrapEl.addEl('w-iconcell-icon w-icon icon-' + v);
                textEl = wrapEl.addEl('w-iconcell-text');
                textEl.textContent = v;
                break;
              case 'ColorString':
                el.cls = 'w-iconcell';
                wrapEl = el.addEl('w-iconcell-wrap');
                iconEl = wrapEl.addEl('w-iconcell-icon w-icon icon-null');
                iconEl.bgColor = v;
                textEl = wrapEl.addEl('w-iconcell-text');
                textEl.textContent = v;
                break;
            }
          }
          if (!iconEl)
            return v;
        }
      }], events: {
        beforeedit: { fn: me.onPropBeforeEdit, xwl: me },
        edit: me.onPropEdit,
        editing: { fn: me.onPropEditing, xwl: me },
        selectionchange: me.onPropSelectionChange,
        toggleexpand: me.onToggleExpand,
        beforenavigate: { fn: me.onBeforeNavigate, xwl: me },
        itemclick(item, e) {
          if (e.ctrlMeta) {
            let column = this.findColumnByEl(e.target);
            if (column?.leafIndex == 0) {
              let data = item.data, meta = data.meta, tip = Wb.Tooltip.retainTip;

              tip.text = data.text + ': ' + (data.type == 'properties' ? meta.type : '(' +
                (data.meta.params?.pluck('name').join(', ') ?? '') + ')') + '\n' + meta.title.replace(/\\?\n */g, ' ');
              Wb.tipAt(tip, e.x, e.y);
            }
          }
        }
      }, listeners: {
        focusin() {
          me.lastFocusComp = this;
        }
      }
    };
  }
  /**
   * Fires before editing is triggered in property editor. @priv
   * @param {Wb.TreeItem} row Tree row.
   * @param {Wb.Column} col Tree column.
   * @param {Object} configs Configs object.
   * @param {Object} options Event options.
   */
  onPropBeforeEdit(row, col, configs, options) {
    let editor, value, data = row.data, propTree = this, xwl = options.xwl,
      XWL = Wb.ide.XwlEditor, compNodes = propTree.compNodes;

    editor = XWL.getEditor(row);
    if (editor.needData)
      xwl.setSelectData(editor, row.data$.meta);
    editor.propNode = row;
    editor.compNodes = compNodes;
    editor.xwl = xwl;
    col.editor = editor;
    compNodes.each(node => {
      value = node.data[data.type][data.text];
      if (value) {
        // set the first not null value to the editor
        configs.value = value;
        return false;
      }
    });
  }
  /**
   * Set the select component data. @priv
   * @param {Wb.Select} select Select component.
   * @param {Object} meta Property meta data.
   */
  setSelectData(select, meta) {
    const quoteReg = /['"`]/g;
    let data;
    switch (meta.type.firstItem('/')) {
      case 'Boolean':
        data = ['true', 'false'];
        break;
      case 'Enum':
        let list = [];
        data = meta.title.split('\n');
        data?.forEach(item => {
          item = item.trimLeft();
          if (!item.startsWith('-') || !item.includes(':'))
            return;
          item = item.substr(1, item.indexOf(':') - 1);
          item = item.replaceAll(quoteReg, '');
          if (item.includes('!/'))
            list.push(item.replaceAll('!/', '/'));
          else if (item.includes('/') && !item.includes(' / '))
            list.push(...(item.split('/')));
          else
            list.push(item);
        });
        data = list;
        break;
    }
    select.data = data;
  }
  /**
   * Fires when the property editor is editing. @priv
   */
  onPropEditing(row, column, options) {
    options.xwl.fireEvent('change');
  }
  /**
   * Fires after the property editor is edited. @priv
   * @param {Object} value Property value.
   * @param {Wb.TreeItem} row Tree row.
   * @param {Wb.Column} col Tree column.
   */
  onPropEdit(value, row, col) {
    let editor = col.editor;

    Wb.ide.XwlEditor.setValue(row, value);
    delete editor.compNodes;
    delete editor.propNode;
    delete editor.xwl;
    return false;
  }
  /**
   * Fires after expand or collapse on the property node. @priv
   * @param {Wb.TreeItem} node Toggle node.
   */
  onToggleExpand(node) {
    if (node.depth === 0) {
      this[node.data.type + 'NodeExpanded'] = node.expanded;
    }
  }
  /**
   * Fires after property selection changes. @priv
   */
  onPropSelectionChange() {
    let item = this.selection;
    if (item) {
      this.selPropType = item.data.type;
      this.selPropName = item.data.text;
    }
  }
  /**
   * Fires before navigate keys on the property editor. @priv
   * @param {Event} e Event object.
   */
  onBeforeNavigate(e, options) {
    let me = this;
    if (e.code == Keys.Enter) {
      if (e.ctrlMeta) {
        let xwl = options.xwl, node = me.selection;
        if (node) {
          xwl.editProp(me.compNodes[0], node.data.text, node.data.type);
        }
      } else {
        me.startEdit(me.selection, 1);
      }
      return false;
    }
    if (!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)) {
      let key = e.key.toLowerCase();

      // key nav
      if (key.length == 1 && (key >= 'a' && key <= 'z' || key == '_')) {
        let lastKey = me.lastKey ?? '', now = new Date(), item, query;
        query = me.lastKey = (now.elapse(me.lastTime) < 500) ? (lastKey + key) : key;
        item = me.downBy(item => item.data.text.toLowerCase().startsWith(query));
        if (item)
          item.select();
        else if (query.length == 2 && query[0] == query[1]) {
          // dbl click nav to events
          query = query[0];
          me.findItem('type', 'events')?.downBy(item => item.data.text.toLowerCase().startsWith(query))?.select();
        }
        me.lastTime = now;
        return false;
      }
    }
  }
  /***/
  set items(value) {
    super.items = value;
    this.applyRefer();
    this.sourceCard.mainEditor = this.sourceEditor;
  }
  /***/
  get items() {
    return super.items;
  }
  /**
   * Inspect nodes values to the property editor. @priv
   * @param {Wb.TreeItem[]} nodes Component nodes list.
   * @param {Boolean} selfOnly Show self owned property only.
   * @param {Boolean} valuedOnly Show not null value property.
   * @param {Boolean} keyOnly Show key value property.
   */
  inspectNodes(nodes, selfOnly, valuedOnly, keyOnly) {
    let node, propItems = [], nodesData = nodes.pluck('data'), title = Str.objectInspector,
      len = nodes.length, propTree = this.propTree;

    if (len > 1)
      title += ' (' + len + ')';
    propTree.completeEdit();
    propTree.title = title;
    propTree.compNodes = nodes;
    this.setPropData(nodesData, propItems, 'properties', Str.property, selfOnly, valuedOnly, keyOnly);
    this.setPropData(nodesData, propItems, 'events', Str.event, selfOnly, valuedOnly, keyOnly);
    propTree.data = propItems;
    // Remove property/event label cell
    propTree.cascade(node => {
      if (node.fixed) {
        node.contentEl.lastChild.remove();
      }
    });
    // Scroll to the last selection cell
    node = propTree.downBy(node => node.data.type == propTree.selPropType && node.text == propTree.selPropName);
    if (node) {
      node.selectNoFocus();
      node.el.intoViewCenter();
    }
  }
  /**
   * Reload selection nodes properties/events. @priv
   */
  reloadProperties() {
    let me = this;

    me.inspectNodes(me.propTree.compNodes, me.showOwnBtn.active, me.showValuedBtn.active,
      me.showKeyBtn.active);
  }
  /**
   * Get members from the sepcified class. @priv
   * @param {String} cls Class name.
   * @param {String} type Data type:
   * -properties: Property
   * -events: Event
   * @param {Boolean} selfOnly Show self owned property only.
   * @param {Boolean} keyOnly Show key value property.
   * @return {Object} The members list.
   */
  getMembers(cls, type, selfOnly, keyOnly) {
    let reverseCls = [], parentCls = cls, item, parentData, object = {}, allObject = {};

    if (selfOnly) {
      reverseCls.push(WbDocsData[cls]);
    } else {
      do {
        parentData = WbDocsData[parentCls];
        reverseCls.push(parentData);
        parentData.mixin?.forEach(item => {
          reverseCls.push(WbDocsData[item]);
        });
      } while (parentCls = parentData.extend);
    }
    reverseCls.each(data => {
      if (type == 'events') {
        Wb.each(data.event, (k, v) => {
          if ((!keyOnly || v.key)) {
            object[k] = v;
          }
        });
      } else {
        Wb.each(data.property, (k, v) => {
          item = allObject[k] ??= {};
          if (v.title != null)
            item.title = v.title;
          if (v.type != null)
            item.type = v.type;
          if (v.key)
            item.key = true;
          if (v.params)
            item.params = v.params;
          if (!Wb.isEmpty(v.setter))
            Wb.apply(item, v.setter);
          if (selfOnly && v.setter && Wb.isEmpty(v.setter))
            return;
          if ((v.setter || !v.getter) && !v.priv && !v.readonly && !v.code && (!keyOnly || v.key)) {
            object[k] = allObject[k];
          }
          if (v.priv && object[k])
            delete object[k];
        });
      }
    }, null, true);
    return object;
  }
  /**
   * Set property editor data. @priv
   * @param {Array} items Component array list.
   * @param {Array} result The result array.
   * @param {String} type Data type:
   * -properties: Property
   * -events: Event
   * @param {String} text Type label.
   * @param {Boolean} selfOnly Show self owned property only.
   * @param {Boolean} valuedOnly Show not null value property.
   * @param {Boolean} keyOnly Show key value property.
   * @return {Array} Property event list data.
   */
  setPropData(items, result, type, text, selfOnly, valuedOnly, keyOnly) {
    let isMul = items.length > 1, membersList = [], allProps = [], existItem, properties, configs, value;

    items.forEach(item => membersList.push(this.getMembers(item.cls, type, selfOnly, keyOnly)));
    membersList.forEach((members, i) => {
      properties = items[i][type] ?? Wb.emptyObject;
      if (!selfOnly && !keyOnly) {
        Wb.each(properties, (k, v) => {
          if (!members[k])
            members[k] = { title: Str.deprecated, type: 'String', deprecated: true };
        });
      }
      Wb.each(members, (k, v) => {
        // not allowed to edit multiple cid
        if (isMul && k == 'cid')
          return;
        if (membersList.every(v => v[k])) {
          existItem = allProps.find(t => t.text == k);
          value = properties[k];
          if (valuedOnly && Wb.isEmpty(value))
            return;
          if (value)
            value = String(value).ellipsisLine();
          if (existItem) {
            if (existItem.value !== value)
              existItem.multiValues = true;
            if (existItem.value === undefined)
              existItem.value = value;
          } else {
            configs = {
              text: k, value, type, meta: v, _leaf: true
            };
            allProps.push(configs);
          }
        }
      });
    });
    allProps.lowerSort('text');
    if (allProps.length) {
      result.push({
        text: text, type: type, _fixed: true,
        _expanded: this.propTree[type + 'NodeExpanded'] ?? true, items: allProps
      });
    }
  }
  /**
   * @event change Fires after XWL values is changed.
   */
  /**
   * @event cursorchange Fires after cursor is changed in code editors.
   * @param {Object} cursor Cursor object.
   */
  /** @property {Object} - Xwl module data object. */
  set value(value) {
    let control, compTree = this.compTree, props;

    value ??= { text: 'module', cls: 'Wb.Module', properties: { cid: 'module' } };
    Wb.cascade([value], item => {
      control = WbDocsData[item.cls];
      item._icon = control.icon;
      item.events ??= {};
      item.items ??= [];
    });
    compTree.data = value;
    props = value.properties;
    if (Wb.isEmpty(value.events) && !value.items.length && props.serverScript) {
      // direct show serverscript when only have serverScript.
      this.editProp(compTree.firstItem, 'serverScript', 'properties');
    }
    this.checkDupCid();
  }
  /***/
  get value() {
    let rootNode = this.compTree.firstItem, data, events;

    data = rootNode.getItemsData(null, true);
    // Clear empty value
    Wb.cascade([data], item => {
      events = item.events;
      [item.properties, events]?.forEach(object => {
        Wb.each(object, (k, v) => {
          if (!v)
            delete object[k];
        });
      });
      if (Wb.isEmpty(events))
        item.events = undefined;
    });
    return data;
  }
}
/**
 * Code select component, used to edit code in the select.
 */
Cls['Wb.ide.CodeSelect'] = class codeSelect extends Wb.Picker {
  static configs = {
    pickerHeight: '13em',
    readonly: true,
    matchWidth: true,
    autoHideTrigger: false
  }
  /** @property {String} language Edit language type. */
  /***/
  init(configs) {
    let me = this;
    super.init(configs);
    me.picker = {
      cname: 'panel', layout: 'fit', padding: '.2em', minWidth: '14em', items: {
        cname: 'codeEditor', wrapBorder: 0, language: me.language, autoComplete: true, editorConfigs: {
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false
        },
        events: {
          change: { fn: me.onChange, scope: me }
        }
      },
      listeners: {
        keydown(e) {
          if (e.code == Keys.Esc) {
            me.collapse();
            me.mayFocusInputEl();
            e.stopEvent();
          } else if (e.shiftKey && e.code == Keys.Enter) {
            Wb.Editor.completeEdit();
            e.stopEvent();
          }
        }
      }
    };
    me.editor = me.picker.firstItem;
    me.on({ expand: me.onExpand, collapse: me.onCollapse });
    me.mon(me.inputEl, 'dblclick', this.expandEdit);
    me.ellipsisTrigger = me.addTrigger({
      weight: 950, events: {
        click: me.expandEdit, scope: me
      }
    });
  }
  /***/
  onKeyDown(e) {
    if (e.ctrlMeta && e.code == Keys.Enter) {
      this.expandEdit();
      e.stopEvent();
      return;
    }
    super.onKeyDown(e);
  }
  /**
   * Open new card editor to edit the script. @priv
   */
  expandEdit() {
    let propNode = this.propNode;
    this.xwl.editProp(this.compNodes[0], propNode.data.text, propNode.data.type);
  }
  /**
   * Fires when the picker is expanded. @priv
   */
  onExpand() {
    let me = this, editor = me.editor;
    editor.serverScript = me.propNode.text == 'serverScript';
    editor.xwlTree = me.xwl.compTree;
    editor.focus();
  }
  /**
   * Fires when the picker is collapsed. @priv
   */
  onCollapse() {
    super.value = this.editor.value.ellipsisLine();
  }
  /**
   * Fires after value is changed. @priv
   */
  onChange(value) {
    this.fireEvent('change', value, this.lastValue);
    this.lastValue = value;
  }
  /** @property {String} - Edited script value. */
  set value(value) {
    value ??= '';
    this.editor.value = value;
    super.value = value.ellipsisLine();
  }
  /***/
  get value() {
    return this.editor.value;
  }
  /** @property {String} types Edited property types. Use "/" to separate multiple types. */
  /** @property {Wb.TreeItem[]} - Edited component nodes list. */
  set compNodes(value) {
    let me = this;

    me.compNodes$ = value;
    if (me.language != 'javascript')
      return;
    let propName = me.propNode.text, items = [], icon, underline;
    Wb.destroy(me.compTriggers);
    if (value[0].findBy(node => node.text == propName)) {
      items.push({ cname: 'tool', icon: 'share2', tip: Str.gotoProperty, handler: me.addPropComp, pe: me });
    } else {
      me.types?.split('/').forEach(item => {
        underline = false;
        if (item == 'Array')
          icon = 'array';
        else if (item.endsWith('[]')) {
          underline = true;
          icon = WbDocsData[item.slice(0, -2)]?.icon;
        } else
          icon = WbDocsData[item]?.icon;
        if (icon) {
          items.push({
            cname: 'tool', icon, compCls: item, tip: Str.add + ' ' + item
            , cls: underline ? 'w-icon-style1' : undefined, handler: me.addPropComp, pe: me
          });
        }
      });
    }
    me.compTriggers = items.length ? me.addTrigger(items) : undefined;
  }
  /***/
  get compNodes() {
    return this.compNodes$;
  }
  /**
   * Add property component. @priv
   */
  addPropComp() {
    let cls = this.compCls, me = this.pe, node = me.compNodes$[0], propName = me.propNode.text,
      comp, cid, subNode, configs, isArray, pureArray;

    subNode = node.findBy(item => item.text == propName);
    if (subNode) {
      node = subNode;
    } else {
      pureArray = cls == 'Array';
      if (cls.endsWith('[]') || pureArray) {
        node = node.addData({
          cls: 'Wb.Array', events: {}, properties: { cid: propName }, text: propName,
          _expanded: true, _icon: 'array', items: []
        });
        if (pureArray) {
          node.select();
          return;
        }
        cls = cls.slice(0, -2);
        isArray = true;
      }
      comp = WbDocsData[cls];
      cid = isArray ? (comp.cname + '1') : propName;
      configs = {
        cls, events: {}, properties: { cid: cid }, text: cid, _expanded: true, _icon: comp.icon, items: []
      };
      if (!isArray)
        configs.properties.isProperty = 'true';
      node = node.addData(configs);
      me.fireEvent('change');
    }
    node.select();
  }
}
/**
 * WebBuilder IDE client.
 */
Cls['Wb.ide.IDE'] = class ideApp extends Wb.App {
  /**
   * Goto the specified location in the code editor by the link express.
   * @param {String} url Link url express.
   * @param {String} basePath Current file path.
   */
  static gotoLink(url, basePath) {
    let path, xaction, pos, ext, useBase, mayShortcut, doLocate = path => {
      if (path.includes('(') || path.includes(')') || path.includes('"') || path.includes("'"))
        Wb.tipError(Str.e404);
      else
        app.locateLine({ path, compNode: true, propName: 'serverScript', propType: 'properties' }, editor => {
          if (xaction) {
            let edt = editor.editor, range = edt?.getModel().findMatches(' ' + xaction + '(')?.[0]?.range;
            if (range)
              editor.cursor = { lineNumber: range.startLineNumber, column: range.startColumn + 1 };
          }
        }, !xaction);
    };
    if (url.startsWith('xpath') && basePath?.endsWith('.xwl')) {
      path = this.parseUrl(url, basePath);
      if (!path) {
        Wb.tipError(Str.notFound.format(url));
        return;
      }
    } else {
      if (url.startsWith('app.')) {
        app.locateLine({ path: app.activeCard.path, compNode: true, propName: 'initialize', propType: 'events' });
        return;
      }
      path = (url.startsWith('"') || url.startsWith("'")) ? url.slice(1, -1) : url;
      useBase = true;
    }
    pos = Math.max(path.indexOf('?xaction='), path.indexOf('&xaction='));
    if (pos != -1)
      xaction = path.substr(pos + 9).firstItem('&');
    if (path.startsWith('m?xwl='))
      path = path.substr(6).firstItem('&') + '.xwl';
    else
      path = path.firstItem(path.includes('?') ? '?' : '&');
    ext = Wb.getFileExt(path);
    mayShortcut = !path.includes('/') && ext != 'xwl';
    if (!ext && !mayShortcut) {
      ext = 'xwl';
      path += '.xwl';
    }
    if (useBase && !mayShortcut) {
      if (basePath && path.includes('./')) {
        basePath = Wb.getDirectory(basePath);
      } else {
        if (ext == 'xwl')
          basePath = app.configs.modulePath;
        else
          basePath = app.configs.path;
      }
      path = basePath + path;
    }
    if (ext) {
      path = Wb.normalizePath(path);
      if (path)
        doLocate(path);
    } else {
      // short-cut or root module
      Wb.ajax({
        url: 'm?xwl=sys/file/find-shortcut',
        params: { path },
        success(resp) {
          if (resp)
            doLocate(resp);
          else
            Wb.tipError(Str.notFound.format(path));
        }
      });
    }
  }
  /**
   * Parse the specified URL express to real URL.
   * @param {String} url URL express.
   * @param {String} basePath Base path.
   * @param {Boolean} [returnParams] Whether to return params.
   * @return {String} Real url. Returns null if parse error.
   */
  static parseUrl(url, basePath, returnParams) {
    let path, pos, script;

    try {
      if (!returnParams) {
        pos = url.indexOf('&', url.indexOf('xaction='));
        if (pos != -1)
          url = url.substr(0, pos) + (url.includes('"') ? '"' : "'");
      }
      script = 'let xpath=' + Wb.encode(basePath.slice(0, -4)) + ';return ' + url;
      path = new Function(script)();
      path = path.trim();
    } catch (e) {
      return null;
    }
    return path;
  }
  /**
   * Set code auto complete feature.
   */
  static setAutoComplete() {
    monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: async (model, position, context, token) => {
        let editor = Wb.CodeEditor.findEditor(model.uri.path);
        if (!editor.autoComplete)
          return;
        const fieldKind = monaco.languages.CompletionItemKind.Field;
        const funcKind = monaco.languages.CompletionItemKind.Function;
        const clsKind = monaco.languages.CompletionItemKind.Class;
        const lastSpExp = /[^a-zA-Z0-9_\$\.](?!.*[^a-zA-Z0-9_\$\.])/;
        const predefinedCls = ['com', 'edu', 'java', 'javax', 'javafx', 'org', 'jakarta'];
        let line, column, content, beforeContent, data, name, value, ns, word, cls, kind, isSs, tree, pos, keyName,
          prefix, compTrees, parent, hasHint, namesMap = {}, suggestions = [], pushIf, existsMap = {};

        pushIf = (label, kind, ret, sort) => {
          if (kind == 1 && !label.endsWith(')'))
            label += '()';
          if (!existsMap[label]) {
            data = { label, kind, sortText: sort ?? label.includes('$') ? 'x' : '0' };
            if (label.includes('(')) {
              name = label.substr(0, label.indexOf('(') + 1);
              label.getPart('(', ')').splitTrim().forEach((item, index) => {
                if (index > 0)
                  name += ', ';
                name += '${' + (index + 1) + ':' + item + '}';
              });
              name += ')$0';
              data.insertText = name;
              data.insertTextRules = 4;
              if (ret)
                data.label += ': ' + ret;
            } else {
              data.insertText = label;
            }
            suggestions.push(data);
            existsMap[label] = true;
          }
        };
        line = position.lineNumber;
        column = position.column - 1;
        content = model.getLineContent(line);
        content = content.substr(0, column);
        pos = content.match(lastSpExp);
        if (pos)
          content = content.substring(pos.index + 1);
        beforeContent = content.beforeItem('.');
        isSs = editor.serverScript;
        tree = editor.xwlTree;
        if (isSs || tree) {
          if (isSs) {
            compTrees = [];
            app.fileTab.each(card => {
              if (!card.moduleUrl) {
                tree = card.firstItem?.compTree;
                if (tree)
                  compTrees.push(tree);
              }
            });
          } else {
            compTrees = [tree];
          }
          compTrees.forEach(tree => {
            tree.cascade(node => {
              if (node.depth == 0)
                return;
              data = node.data.properties;
              if (data.isProperty != 'true') {
                value = data.cid;
                if (namesMap[value])
                  return;
                namesMap[value] = true;
                pushIf(value, fieldKind);
              }
            });
          });
        }
        if (tree) {
          word = beforeContent.lastItem('.');
          cls = tree.downBy(node => node.text == word)?.data.cls;
          if (cls) {
            Wb.each(Wb.getNS(cls).allMembers, (k, v) => {
              if (namesMap[k])
                return;
              namesMap[k] = true;
              pushIf(k, v ? funcKind : fieldKind);
              hasHint ??= true;
            });
          }
        }
        if (!beforeContent.includes('.')) {
          let i, contextCode = '', types, startLine = Math.max(1, line - 500);
          for (i = startLine; i <= line; i++) {
            contextCode += model.getLineContent(i) + '\n';
          }
          types = this.extractTypes(contextCode, isSs ? predefinedCls : null);
          keyName = types[beforeContent];
        }
        if (!keyName) {
          keyName = beforeContent;
          prefix = keyName.firstItem('.');
          if (!(/^[A-Z]/.test(prefix)) && (!isSs || !predefinedCls.includes(prefix)))
            keyName = null;
          if (!keyName && isSs) {
            if (beforeContent == 'request')
              keyName = 'jakarta.servlet.http.HttpServletRequest';
            else if (beforeContent == 'response')
              keyName = 'jakarta.servlet.http.HttpServletResponse';
          }
        }
        if (isSs) {
          // load serverscript hint
          let configs = Wb.ide?.IDE?.configs, listItems;
          if (!content.includes('.')) {
            // Global vars
            configs?.globalsList.forEach(item => pushIf(item, fieldKind));
            pushIf('Packages', clsKind);
            pushIf('Java', clsKind);
            predefinedCls.forEach(cls => pushIf(cls, clsKind));
            hasHint ??= true;
          } else if (keyName) {
            listItems = await Wb.fetch({
              url: 'm?xwl=dev/ide/actions&xaction=jsProvider', json: true, timeout: 5000, mask: false, showError: false,
              params: { cls: keyName }
            });
            listItems.response?.forEach(item => pushIf(item.label, item.kind, item.ret));
            if (listItems.response?.length)
              hasHint ??= true;
          }
        } else {
          // Client hint
          if (keyName) {
            let obj = Wb.getNS(keyName);
            if (obj)
              hasHint = true;
            Wb.each(obj?.allMembers, (k, v) => {
              if (namesMap[k])
                return;
              namesMap[k] = true;
              pushIf(k, v ? funcKind : fieldKind);
            });
            while (obj) {
              [obj.prototype, obj].forEach((item, i) => {
                item && Wb.each(Object.getOwnPropertyDescriptors(item), (k, v) => {
                  pushIf(k, Wb.isFunction(v.value) ? funcKind : fieldKind, null, i > 0 ? 'w' : null);
                });
              });
              obj = Object.getPrototypeOf(obj);
            }
          }
          if (!content.includes('.')) {
            let k;
            hasHint ??= true;
            for (k in globalThis) {
              if (!k.startsWith('webkit')) {
                pushIf(k, Wb.isFunction(globalThis[k]) ? funcKind : fieldKind);
              }
            }
          }
        }
        if (tree && (content.startsWith('app.'))) {
          parent = editor.parent;
          hasHint ??= true;
          if (content.occur('.') < 2 && !(parent?.compNode?.depth == 0 &&
            (parent?.propName == 'initialize' || parent?.propName == 'serverScript'))) {
            let keys = tree.firstItem.data.events?.initialize?.match(/\n *[A-Za-z_\$]+(\(|:)/g), setter, i = 0;

            keys?.each(key => {
              key = key.slice(0, -1).trim();
              setter = key.startsWith('get$') || key.startsWith('set$');
              if (key.endsWith('(') && !setter) {
                kind = funcKind;
              } else {
                kind = fieldKind;
              }
              if (setter)
                key = key.substr(4);
              if (namesMap[key])
                return;
              namesMap[key] = true;
              pushIf(key, kind);
              i++;
              if (i > 1000)
                return false;
            });
          }
        } else {
          // runtime hint
          ns = Wb.getNS(beforeContent);
          if (ns) {
            for (name in ns) {
              if (name.endsWith('$') || namesMap[name] || name.startsWith('webkit'))
                continue;
              value = ns[name];
              if (Wb.isFunction(value)) {
                kind = value.prototype?.instanced ? clsKind : funcKind;
              } else {
                kind = fieldKind;
              }
              namesMap[name] = true;
              pushIf(name, kind);
            }
          }
        }
        if (!hasHint) {
          const capSpReg = /^[A-Z_]/;
          const types = [Object, Array, String, Number, Date, Boolean, Function, Map, Set, BigInt, Symbol];
          types.forEach(type => types.push(type.prototype));
          types.forEach(type => {
            Wb.each(Object.getOwnPropertyDescriptors(type), (k, v) => {
              pushIf(k, Wb.isFunction(v.value) ? funcKind : fieldKind, null, capSpReg.test(k) ? 'z' : null);
            });
          });
        }
        return { suggestions };
      }, triggerCharacters: ['.']
    });
  }
  /**
   * Extract type map from context code. @priv
   * @param {String} code Context code.
   * @param {String[]} [predefinedCls] Predefined class list.
   * @return {Object} Type map.
   */
  static extractTypes(code, predefinedCls) {
    const pattern = new RegExp(
      '((?:\\w+\\s*(?:=\\s*(?:' +
      '[a-zA-Z0-9_.]+|Java\\.type\\(["\'][a-zA-Z0-9_.]+\["\']\\)|' +
      'new\\s+[a-zA-Z0-9_.]+\\s*(?:\\([^)]*\\))?|' +
      'new\\s+\\([^)]*Java\\.type\\(["\'][a-zA-Z0-9_.]+\["\']\\)[^)]*\\)\\s*\\([^)]*\\)' +
      '))?)' +
      '(?:\\s*,\\s*\\w+\\s*(?:=\\s*(?:' +
      '[a-zA-Z0-9_.]+|Java\\.type\\(["\'][a-zA-Z0-9_.]+\["\']\\)|' +
      'new\\s+[a-zA-Z0-9_.]+\\s*(?:\\([^)]*\\))?|' +
      'new\\s+\\([^)]*Java\\.type\\(["\'][a-zA-Z0-9_.]+\["\']\\)[^)]*\\)\\s*\\([^)]*\\)' +
      '))?)*)' +
      '\\s*[;\\r\\n]',
      'g'
    );
    const typeMap = {}, capReg = /^[A-Z]/, declReg = /\s*,\s*/, splitReg = /\s*=\s*/,
      typeReg = /Java\.type\(["']([a-zA-Z0-9_.]+)["']\)/, valReg = /new\s+([a-zA-Z0-9_.]+)/;
    let match, className, declarations, prefix, varName, value, javaTypeMatch, constructorMatch;

    while ((match = pattern.exec(code)) !== null) {
      declarations = match[1].split(declReg);
      declarations.forEach(declaration => {
        [varName, value] = declaration.split(splitReg, 2);
        if (varName) {
          if (value) {
            javaTypeMatch = value.match(typeReg);
            if (javaTypeMatch) {
              className = javaTypeMatch[1];
              if (javaTypeMatch[0].startsWith('Java.type'))
                className = 'Packages.' + className;
            } else if (value.startsWith('new ')) {
              constructorMatch = value.match(valReg);
              if (constructorMatch) {
                className = constructorMatch[1];
                prefix = className.firstItem('.');
                if (!capReg.test(prefix) && (!predefinedCls || !predefinedCls.includes(prefix)))
                  className = null;
              }
            } else {
              className = value;
              prefix = className.firstItem('.');
              if (!capReg.test(prefix) && (!predefinedCls || !predefinedCls.includes(prefix)))
                className = null;
            }
          } else {
            className = null;
          }
          typeMap[varName] = className;
        }
      });
    }
    return typeMap;
  }
  /**
   * Find the specified control meta data by class name.
   * @param {String} cls Class name.
   * @param {String} name Property/event name.
   * @param {Boolean} [isEvent] Whether is event.
   * @return {Object} Returns "params" for event, returns {type, design, params} for otherwise.
   */
  static findControlMeta(cls, name, isEvent) {
    let data, allCls = [], parentCls = cls, item, type, design, params;

    do {
      data = WbDocsData[parentCls];
      if (!data)
        return null;
      allCls.push(data);
      data.mixin?.forEach(item => {
        allCls.push(WbDocsData[item]);
      });
    } while (parentCls = data.extend);
    allCls.each(cls => {
      item = isEvent ? cls.event?.[name] : cls.property?.[name];
      if (item) {
        if (isEvent) {
          if (item.params) {
            params = item.params;
            return false;
          }
        } else {
          type ??= item.setter?.type ?? item.type;
          if (design == null && item.design != null)
            design = item.design != 'false';
          params ??= item.setter?.params ?? item.params;
          if (type && design != null && params)
            return false;
        }
      }
    });
    return isEvent ? params : { type, design, params };
  }
  /**
   * Determines whether the specified class is designable.
   * @param {String} cls Class name.
   * @return {Boolean} Returns true means designable.
   */
  static canDesign(cls) {
    let data, parentCls = cls;

    if (cls == 'Wb.ControlCt')
      return true;
    do {
      data = WbDocsData[parentCls];
      if (data.noDesign)
        return false;
      if (data.cls == 'Wb.Container')
        return true;
    } while (parentCls = data.extend);
    return false;
  }
  /** @property {Boolean} inIDE Whether is in the IDE. */
  /** @property {Object} configs Configs object. */
  /** @property {Wb.Socket} socket Websocket component. @priv */
  /** @property {Array} forwardList Forward list for navigation. @priv */
  /** @property {Array} backList Back list for navigation. @priv */
  /***/
  main(container) {
    let me = this, path, actions, da, debugMenuItems, threadMenus, cfg, mainCt, ct;

    me.inIDE = true;
    me.forwardList = [];
    me.backList = [];
    cfg = me.configs;
    ct = this.constructor;
    ct.fileInput = new Wb.FileInput({ cid: 'files', multiple: true, visible: false, renderEl: BodyEl });
    ct.configs ??= cfg;
    ct.setAutoComplete();
    Wb.ide.XwlEditor.staticInit(cfg);
    path = cfg.path;
    cfg.pathLen = path.length;
    path = cfg.modulePath = path + 'wb/modules/';
    cfg.modulePathLen = path.length;
    monaco.editor.onDidChangeMarkers(uris => me.monChangeMarkers(uris));
    actions = me.createActions();
    da = me.createDebugActions();
    debugMenuItems = [
      { action: da.run },
      { action: da.resume },
      { action: da.terminate },
      { action: da.disable },
      { action: da.enable },
      { action: da.remove },
      '|',
      { action: da.openDebug },
      { action: da.copyUrl },
      '|',
      { action: da.refresh }
    ];
    threadMenus = [
      {
        icon: 'check', menuText: 'View Stack Trace', handler() {
          let data = app.threadGrid.selectionData, win, edit;
          if (!data) {
            Wb.tipSelect();
            return;
          }
          win = Wb.promptText({ icon: 'check', title: 'Stack Trace' }, (t, win) => win.close(), data.stack);
          edit = win.down('textEditor');
          edit.noWrap = true;
          edit.readonly = true;
          win.downWhole('ok').text = 'Close';
          win.downWhole('cancel').destroy();
        }
      },
      {
        menuText: Str.refresh, keysText: 'F5', icon: 'refresh', handler() {
          app.threadGrid.reload();
        }
      }
    ];
    mainCt = new Wb.Viewport({
      app: me,
      border: false,
      layout: 'row',
      tbar: {
        cname: 'toolbar',
        items: [{
          text: Str.file, cid: 'fileMenuItem', menu: {
            items: [
              { action: actions.addFile },
              { action: actions.addFolder },
              {
                text: Str.generator, icon: 'auto', menu: {
                  items: [
                    { action: actions.createQuery },
                    { action: actions.createCRUD }
                  ]
                }
              },
              { action: actions.openFile },
              '-',
              { action: actions.import },
              { action: actions.importUnzip },
              { action: actions.export },
              { action: actions.exportZip },
              '-',
              { action: actions.checkIn },
              { action: actions.checkOut },
              '-',
              { action: actions.save },
              { action: actions.saveAll },
              '-',
              { action: actions.rename },
              { action: actions.refresh },
              { action: actions.setProperty }
            ]
          }
        },
        {
          text: Str.edit, menu: {
            items: [
              { action: actions.doCut },
              { action: actions.doCopy },
              { action: actions.doPaste },
              '-',
              { action: actions.doDelete }
            ]
          }
        },
        {
          text: Str.navigate, menu: {
            items: [
              {
                text: Str.openFileMenu, icon: 'menu2', keys: 'Alt+M', handler(e) {
                  me.fileMenuItem.fireClick(e);
                }
              },
              {
                text: Str.focusFileExplorer, keys: 'Ctrl+Shift+1', handler() {
                  me.fileTree.focus();
                }
              },
              {
                text: Str.focusFileTab, keys: 'Ctrl+Shift+2', handler() {
                  me.fileTab.activeCard?.tabButton.focus();
                }
              },
              {
                text: Str.focusViewTab, keys: 'Ctrl+Shift+3', handler() {
                  me.viewTab.activeCard?.tabButton.focus();
                }
              },
              {
                text: Str.focusToolPanel, keys: 'Ctrl+Shift+4', handler() {
                  me.toolCard.activeCard?.focus();
                }
              },
              '-',
              { action: actions.back },
              { action: actions.forward },
              { text: Str.mainCardBack, cid: 'mainCardBack', keys: 'Alt+9', handler: me.cardNavigate, ide: me },
              {
                text: Str.mainCardForward, cid: 'mainCardForward', keys: 'Alt+0',
                handler: me.cardNavigate, ide: me
              },
              { text: Str.subCardBack, cid: 'subCardBack', keys: 'Alt+7', handler: me.cardNavigate, ide: me },
              { text: Str.subCardForward, cid: 'subCardForward', keys: 'Alt+8', handler: me.cardNavigate, ide: me },
              '-',
              {
                text: Str.regroupTab, icon: 'tab', keys: 'Ctrl+Shift+7', cid: 'regroupTabItem', handler() {
                  let fileTab = me.fileTab, cards = fileTab.items.copy(), activeCard = fileTab.activeCard;

                  cards.forEach(card => {
                    if (card.moduleUrl && card.path) {
                      let sourceCard = fileTab.findBy(c => c != card && c.path == card.path);
                      if (sourceCard && sourceCard?.nextSibling != card)
                        fileTab.insertAfter(card, sourceCard);
                    }
                  });
                  activeCard?.show();
                }
              },
              {
                text: Str.toggleSourcePage, keys: 'Ctrl+Shift+8', cid: 'toggleSourceItem',
                handler() {
                  let card = me.activeCard;
                  if (card.moduleUrl)
                    me.openFile(card.path);
                  else {
                    let path = card.path;
                    card = me.fileTab.findBy(card => card.moduleUrl && card.path == path);
                    if (card)
                      card.show();
                    else
                      me.run();
                  }
                }
              },
              { action: actions.toDesignPage }
            ]
          }
        },
        {
          text: Str.search, menu: {
            items: [
              {
                text: Str.searchText, ellipsis: true, icon: 'search-file', keys: 'Ctrl+H', handler() {
                  me.searchReplace(false, Str.searchText);
                }
              },
              {
                text: Str.replace, ellipsis: true, keys: 'Ctrl+Shift+H', handler() {
                  me.searchReplace(true, Str.replace);
                }
              },
              '-',
              {
                text: Str.searchFile, ellipsis: true, keys: 'Alt+H', handler: me.searchKey,
                type: 'searchFile', ide: me
              },
              {
                text: Str.searchTodo, ellipsis: true, ide: me, handler() {
                  me.searchReplace(false, Str.searchTodo, '// to' + 'do:');
                }
              },
              { text: Str.searchURL, ellipsis: true, handler: me.searchKey, type: 'searchUrl', ide: me },
              {
                text: Str.noneLoginModule, handler() {
                  me.searchGrid.load({
                    params: { xaction: 'noneLoginModule' },
                    success() {
                      me.viewTab.show();
                      me.searchTab.show();
                    }
                  });
                }
              }
            ]
          }
        },
        {
          text: Str.run, menu: {
            items: [
              { action: actions.run },
              { action: actions.runNew },
              { action: actions.toggleDebug },
              '-',
              { action: actions.reloadSystem }
            ]
          }
        },
        {
          text: Str.tool, menu: {
            items: [
              {
                icon: 'database', text: Str.dbe, handler() {
                  Wb.openNormal('m?xwl=admin/dbe');
                }
              },
              {
                icon: 'dict', text: Str.dictConfig, handler() {
                  Wb.openNormal('m?xwl=dev/dict');
                }
              },
              {
                icon: 'list-view', text: Str.kve, handler() {
                  Wb.openNormal('m?xwl=dev/kve');
                }
              },
              '-',
              { action: actions.createTheme, visible: cfg.createWbCss },
              { action: actions.createRelease, visible: cfg.createRelease },
              { action: actions.compressScript, visible: cfg.compressScript }
            ]
          }
        },
        {
          text: Str.help, menu: {
            items: [
              { action: actions.openDocs },
              { action: actions.createDocs, visible: cfg.createDocs },
              '-',
              { text: Str.about, icon: 'info', handler() { Wb.openNormal('m?xwl=admin/about'); } }
            ]
          }
        },
          '|',
        { action: actions.addFile },
        { action: actions.addFolder },
        { action: actions.setProperty },
        { action: actions.save },
        { action: actions.saveAll },
          '|',
        { action: actions.run },
        { action: actions.toggleDebug },
          '|',
        { action: actions.back },
        { action: actions.forward, cid: 'lastOffenTool' },
        { cname: 'divider', belongTo: 'xwl', visible: false },
        { action: actions.openDesign, belongTo: 'xwl', visible: false },
        { action: actions.rebuildDesign, belongTo: 'xwl', visible: false },
        { action: actions.addComps, belongTo: 'xwl', visible: false },
        { action: actions.addColumns, belongTo: 'xwl', visible: false },
        { action: actions.clearCompValues, belongTo: 'xwl', visible: false },
        { action: actions.toDesignPage, belongTo: 'xwl', visible: false },
        {
          icon: 'component', belongTo: 'xwl', cid: 'linkControlItem', visible: false,
          menuText: Str.nodeLinkToControl, activeBgColor: false,
          active: false, events: { toggle(active) { active && me.linkToControl() } }
        },
          '->',
        {
          icon: 'user', cid: 'usernameBtn', text: me.configs.username, handler() {
            Wb.ajax('logout');
          }
        }
        ]
      },
      bbar: {
        layout: 'row align-center',
        padding: '1px .5em',
        items: [
          {
            cname: 'label', cls: 'w-sub-color w-link', text: 'WebBuilder', listeners: {
              click: me.toOfficialSite
            }
          }, '|',
          {
            cid: 'hintLabel', cname: 'label', flex: 1, overflowTip: true, noWrap: true
          }, '|',
          { cid: 'cursorLabel', cname: 'label', minWidth: '6em' }, '|',
          {
            cid: 'charsetLabel', cname: 'tool', minWidth: '6em', text: Wb.nbsp,
            appeared: false, handler() { me.setCharset(); }
          }, '|',
          {
            cname: 'tool', icon: 'pin', cid: 'toggleModalBtn', tip: Str.toggleModal, tipAutoAlign: true,
            plainIcon: true, offenKeys: 'Ctrl+Shift+L', active: false, events: {
              toggle(active) {
                Globals.debugMode = active;
                BodyEl.setCls(active, 'w-disable-mask');
              }
            }
          }
        ]
      },
      contextMenu: {
        ignoreInputMenu: true,
        events: {
          beforeshow() {
            let el = this.contextTarget, type, hasVisible = false;

            this.each(item => {
              type = item.belongTo;
              if (type)
                item.visible = el.upBy(p => type.split(',').includes(p.citem?.cid));
              if (item.visible)
                hasVisible = true;
            });
            return hasVisible;
          }
        },
        items: [
          { action: actions.openDesign, belongTo: 'compTree' },
          { action: actions.addComps, belongTo: 'compTree' },
          { action: actions.addColumns, belongTo: 'compTree' },
          { action: actions.rebuildDesign, belongTo: 'designer' },
          { cname: 'divider', belongTo: 'compTree,designer' },
          { action: actions.addFile, belongTo: 'fileTree' },
          { action: actions.addFolder, belongTo: 'fileTree' },
          {
            text: Str.generator, icon: 'auto', menu: {
              items: [
                { action: actions.createQuery },
                { action: actions.createCRUD }
              ]
            }, belongTo: 'fileTree'
          },
          { action: actions.toggleDebug, belongTo: 'fileTree' },
          { cname: 'divider', belongTo: 'fileTree' },
          { action: actions.import, belongTo: 'fileTree' },
          { action: actions.importUnzip, belongTo: 'fileTree' },
          { action: actions.export, belongTo: 'fileTree' },
          { action: actions.exportZip, belongTo: 'fileTree' },
          { cname: 'divider', belongTo: 'fileTree' },
          { action: actions.checkIn, belongTo: 'fileTree' },
          { action: actions.checkOut, belongTo: 'fileTree' },
          { cname: 'divider', belongTo: 'fileTree' },
          { action: actions.doCut, belongTo: 'fileTree,compTree,designer' },
          { action: actions.doCopy, belongTo: 'fileTree,compTree,designer' },
          { action: actions.doPaste, belongTo: 'fileTree,compTree,designer' },
          { action: actions.doDelete, belongTo: 'fileTree,compTree,designer' },
          { cname: 'divider', belongTo: 'fileTree' },
          { action: actions.rename, belongTo: 'fileTree' },
          { action: actions.refresh, belongTo: 'fileTree' },
          { action: actions.setProperty, belongTo: 'fileTree' }
        ]
      },
      items: [{
        cname: 'tree',
        cid: 'fileTree',
        keyWalking: true,
        width: '20em',
        multiSelect: true,
        title: Str.fileExplorer,
        draggable: { autoDrop: false },
        droppable: 'wb.ide',
        headers: {
          cname: 'select', triggerIcon: 'search', cid: 'peekFileSelect', enterTriggerClick: true,
          visible: false, url: 'm?xwl=dev/ide/search&xaction=peekFile',
          onTriggerClick() {
            let value = this.value, configs = me.configs, path;
            this.collapse();
            if (value.startsWith('/') || value.includes(':'))
              path = value;
            else if (value.startsWith('m?xwl='))
              path = configs.modulePath + value.substr(6) + '.xwl';
            else if (value.endsWith('.xwl') && !value.startsWith('wb/modules/'))
              path = configs.modulePath + value;
            else
              path = configs.path + value;
            me.selectPath(path);
          },
          events: {
            beforequery(value) {
              if (value.includes('/')) {
                this.collapse();
                return false;
              }
            },
            beforeselect(data) {
              this.collapse();
              me.selectPath(me.configs[data.module ? 'modulePath' : 'path'] + data.text);
              return false;
            }
          }
        },
        tools: [
          {
            tip: Str.linkWithEditor, active: false, keys: 'Ctrl+Shift+E', icon: 'link', cid: 'linkWithEditor', events: {
              toggle(active) {
                if (active) {
                  let path = me.activeCard?.path;
                  if (path)
                    me.selectPath(path);
                }
              }
            },
          },
          {
            icon: 'search', tip: Str.search, keys: 'Ctrl+Shift+F', active: false, events: {
              toggle(checked) {
                let select = me.fileTree.downWhole('peekFileSelect');
                select.visible = checked;
                select.focus();
              }
            }
          },
          {
            icon: 'sort1', tip: Str.alphaSort, cid: 'moduleAlphaSortBtn',
            enableToggle: true, scope: me, events: {
              toggle(active) {
                me.moduleNode.loadSelect();
              }
            }
          },
          {
            icon: 'refresh', keysText: 'F5', tip: Str.refresh, handler() { me.fileTree.loadSelect(); }, scope: me
          }
        ],
        columns: me.getFileTreeCols(),
        url: 'm?xwl=sys/file/get&type=ide',
        events: {
          ready() {
            let el = this.el;
            el.ondragover = Event.pdHandler;
            el.ondrop = e => {
              e.stopEvent();
              if (me.fileTree.selection) {
                let fileInput = Wb.ide.IDE.fileInput;
                fileInput.clear();
                fileInput.addFile(e.dataTransfer.files);
                me.doImport(fileInput);
              } else {
                Wb.tipSelect();
              }
            };
          },
          selectionchange() {
            me.setActions();
          },
          beforeload(configs, params) {
            let node = configs.node;

            params.moduleSort = !me.moduleAlphaSortBtn.active;
            if (node) {
              params.path = node.data.path;
            }
          },
          success(parent) {
            if (parent.isTree) {
              let moduleNode = me.moduleNode, configs = me.configs, modulePath = configs.modulePath;
              moduleNode = me.moduleNode = parent.findItem('path', modulePath);
              me.appNode = parent.findItem('path', configs.path);
              me.systemNode = parent.findItem('path', '');
              if (configs.openExample) {
                let node = moduleNode.findItem('text', 'example');
                if (node) {
                  node.expand();
                  node.selected = true;
                  node.highlight();
                }
              } else if (configs.openModule) {
                me.selectPath(modulePath + configs.openModule, node => {
                  if (node.leaf)
                    me.openFile(node.data.path);
                });
              } else if (configs.aiGen) {
                me.aiTab.show();
                me.aiTextArea.focus();
                me.aiTextArea.highlight();
              } else {
                if (!me.fileTree.selection)
                  moduleNode.selected = true;
              }
            }
          },
          itemdblclick(node, e) {
            if (node.leaf) {
              let path = node.data.path, editor = me.mainEditor;
              if (e.ctrlMeta && editor) {
                let resourcePath = me.configs.path + 'wb/system/resource', qt;
                if (path.startsWith(resourcePath)) {
                  path = path.slice(resourcePath.length + 1);
                  path = path.slice(path.indexOf('/') + 1);
                } else {
                  let ct = editor.parent, inSub, isXwl = ct.parent instanceof Wb.ide.XwlEditor, parentPath;

                  if (isXwl) {
                    parentPath = ct.parent.parent.path;
                    if (path.startsWith(parentPath.slice(0, -4) + '/'))
                      inSub = true;
                  }
                  path = me.getUrlPath(path, false, ct?.propName == 'serverScript',
                    isXwl ? Wb.getDirectory(parentPath) : null, inSub, !e.shiftKey);
                }
                if (!path.startsWith('xpath + ')) {
                  qt = editor.getCursorText(-1).slice(-1);
                  if (qt != '"' && qt != "'" && qt != '`')
                    path = "'" + path + "'";
                }
                editor.selectedText = path;
              } else
                me.openFile(path);
            }
          },
          itemdrag(data) {
            let dest = data.dest, destView = dest?.view, inPropTree, source = data.source;

            inPropTree = data.inPropTree = destView?.cid == 'propTree' && dest.leaf;
            // Only allow file browser and propTree dragging
            if (source.some(item => !item.data.path || item.depth == 0 || item.data.isRoot)) {
              data.allowDrop = false;
              return;
            }
            if (inPropTree) {
              if (dest?.isViewItem && !dest.fixed) {
                data.allowDrop = true;
                data.mode = false;
                return;
              }
            } else {
              if (destView != this || !dest?.data?.path) {
                data.allowDrop = false;
                return;
              }
              if (dest.depth == 0) {
                data.mode = 'append';
                return;
              }
              if (data.mode != 'append' && !dest.parent?.data?.path) {
                data.mode = 'append';
                return;
              }
            }
            return;
          },
          itemdrop(data, e) {
            let source = data.source, dest = data.dest, inSub, parentPath;
            if (data.inPropTree) {
              let XWL = Wb.ide.XwlEditor, path, pathList = [], useRelPath = dest.data.meta.type == 'PathString',
                arrayType = XWL.getEditType(dest) == 'Array';
              source.forEach(item => {
                path = item.data.path;
                if (useRelPath) {
                  path = me.getRelativePath(path);
                } else {
                  parentPath = dest.up(p => p instanceof Wb.ide.XwlEditor)?.parent?.path;
                  if (path.startsWith(parentPath.slice(0, -4) + '/'))
                    inSub = true;
                  path = me.getUrlPath(path, null, null, Wb.getDirectory(parentPath), inSub, !e.shiftKey);
                  if (path.startsWith('xpath +'))
                    path = '@' + path;
                }
                pathList.push(path);
              });
              if (e.ctrlMeta && arrayType) {
                let oldValue = dest.data.value?.trim() || '', mergeItems;
                if (oldValue) {
                  mergeItems = oldValue.startsWith('[') ? Wb.parse(oldValue) : [oldValue];
                  pathList = mergeItems.unique(pathList);
                }
              }
              XWL.setValue(dest, arrayType ? Wb.encodePretty(pathList) : pathList.join(', '));
            } else {
              let sourceFiles = [], sourceNames = [], destFile, destNode, relName, filePath;
              // keep root nodes only
              source = data.source = Wb.Tree.getTopNodes(data.source);
              source.forEach(item => {
                sourceNames.push(item.text);
                sourceFiles.push(item.data.path);
              });
              if (data.mode == 'append') {
                destNode = dest;
              } else {
                destNode = dest.parent;
                relName = data.mode == 'before' ? dest.text : dest.nextSibling?.text;
              }
              destFile = destNode.data.path;
              Wb.ajax({
                url: 'm?xwl=sys/file/paste-files&mode=ide',
                json: true,
                params: { source: sourceFiles, isCut: true, dest: destFile, relName },
                success() {
                  data.acceptDrop();
                  me.changePath(sourceFiles, destFile);
                  // Remove"/"
                  destFile = destFile.slice(0, -1);
                  // Update path
                  if (destNode.loaded) {
                    data.dropItems.forEach(node => {
                      node.cascadeSelf(child => {
                        filePath = child.leaf ? '' : '/';
                        child.bubble(parent => {
                          if (parent == destNode)
                            return false;
                          filePath = '/' + parent.text + filePath;
                        });
                        child.data.path = destFile + filePath;
                        if (child.data.debug)
                          child.proxy.debug = false;
                      });
                    });
                  } else {
                    destNode.expand(f => {
                      me.fileTree.selection = destNode.filter(node => sourceNames.includes(node.text));
                    });
                  }
                }
              });
            }
          }
        }
      }, { cname: 'splitter', enterShowTarget: true }, {
        layout: 'column',
        flex: 1,
        items: [{
          layout: 'row',
          flex: 1,
          items: [{
            cname: 'tab',
            cid: 'fileTab',
            tabMenu: true,
            dblclickFull: true,
            mainTab: true,
            isWbIde: true,
            flex: 1,
            events: {
              ready() {
                this.tabBar.mon('dblclick', e => {
                  let card = e.target.getClosestComp(Wb.TabButton)?.card;

                  if (card?.moduleUrl && (card?.allowRefresh || e.ctrlMeta)) {
                    Wb.openWin(card.moduleUrl);
                    e.stopEvent();
                  } else if (card?.path?.endsWith('.xwl') && e.ctrlMeta) {
                    me.runNew();
                    e.stopEvent();
                  }
                }, true, { capture: true });
              },
              cardchange(card) {
                me.setActions();
                me.focusCard(card);
                me.charsetLabel.appeared = card && !me.isModule(card) && !card.moduleUrl;
                me.charsetLabel.text = card?.charset ?? Wb.nbsp;
                me.recordActivity();
                me.refreshTools(card?.firstItem?.belongTo);
                if (me.linkWithEditor.active && card?.path)
                  me.selectPath(card.path);
                me.refreshToolCard();
              },
              tabclick(card) {
                me.focusCard(card);
              }
            }
          }, { cname: 'splitter', cid: 'toolCardSp', cls: 'w-disp-none' }, {
            cname: 'cardCt',
            cid: 'toolCard',
            width: '13em',
            layout: 'fit',
            cls: 'w-disp-none',
            items: [{
              cname: 'tree', cid: 'controlTree', keyWalking: true, multiSelect: true,
              draggable: { copy: true }, events: {
                itemdblclick(item, e) {
                  let xwl = me.activeXwl, compTree = xwl?.compTree;
                  if (compTree && item.data.cls) {
                    let selItem = compTree.selection, data = Wb.copy(item.data), parent, dest, newNode, mode,
                      designer = xwl.designer;
                    delete data.sort;
                    if (selItem && selItem != compTree.firstItem) {
                      if (e.ctrlMeta) {
                        newNode = selItem.addData(me.createControl(item.data, selItem));
                        dest = selItem;
                        mode = 'append';
                      } else {
                        parent = selItem.parent;
                        newNode = parent.insertDataAfter(me.createControl(item.data, parent), selItem);
                        dest = selItem;
                        mode = 'after';
                      }
                    } else {
                      parent = compTree.firstItem;
                      newNode = parent.addData(me.createControl(item.data, parent));
                      dest = parent;
                      mode = 'append';
                    }
                    xwl.fireEvent('change');
                    designer.notifyDrop({ dest, mode, dropItems: [newNode] });
                    if (newNode.parent == designer.bindNode) {
                      newNode.forceView();
                      newNode.selectNoFocus();
                      designer.deselectAll(newNode.bindComp);
                      newNode.bindComp.intoView();
                      if (xwl.designerActive)
                        designer.focus();
                      else
                        newNode.focus();
                    } else {
                      newNode.select();
                    }
                    xwl.checkDupCid();
                  }
                },
                itemdrag(data, e) {
                  let dest = data.dest, toCompTree, designer = dest?.up('designer');

                  toCompTree = data.toCompTree = dest?.view?.cid == 'compTree';
                  if (!toCompTree && !designer || data.source.some(node => !node.data.cls)) {
                    data.allowDrop = false;
                    return;
                  }
                  data.autoDrop = toCompTree;
                  data.unselectItems = !toCompTree;
                  if (toCompTree) {
                    if (dest.isView)
                      data.dest = dest.firstItem;
                    // Drag to the root node and force the mode to append
                    if (dest.depth == 0)
                      data.mode = 'append';
                  } else {
                    if (!dest.owner && dest.parent?.isIdeDesigner) {
                      let ct = dest.parent, destEl = dest.el, bodyEl = ct.bodyEl,
                        x = e.x - bodyEl.offsetLeft + bodyEl.scrollLeft;
                      if (x < (destEl.offsetLeft + destEl.offsetWidth / 2))
                        data.mode = 'before';
                      else
                        data.mode = 'after';
                    } else {
                      data.mode = 'append';
                      data.dest = designer.designCt;
                    }
                  }
                },
                itemdrop(data) {
                  let xwl = me.activeXwl, notToTree;

                  notToTree = !data.toCompTree;
                  if (notToTree) {
                    data.dest = data.dest.bindNode;
                    data.acceptDrop();
                  }
                  data.dropItems.forEach(item => {
                    item.data = me.createControl(item.data, item.parent);
                  });
                  xwl.fireEvent('change');
                  xwl.designer.notifyDrop(data);
                  if (notToTree) {
                    xwl.designer.deselectAll(data.dropItems.pluck('bindComp'));
                    xwl.designer.focus();
                  } else {
                    xwl.reloadProperties();
                  }
                  xwl.checkDupCid();
                }
              }
            }]
          }]
        }, '||', {
          cname: 'tab',
          cid: 'viewTab',
          height: '13em',
          dblclickFull: true,
          defaults: { layout: 'fit', closable: null },
          events: {
            init() {
              this.toolsCard = this.tabBar.addFooter({ cname: 'cardCt', border: 0 });
            },
            cardchange(card) {
              let bar = card?.tbarx;
              this.toolsCard.visible = bar;
              if (bar) {
                let ts = this.toolsCard, toolCard, cid = card.cid + '-tool';

                toolCard = ts.find(cid);
                if (!toolCard) {
                  bar.cid = cid;
                  toolCard = ts.add(Wb.apply({ style: 'padding:1px' }, bar));
                }
                ts.activeCard = toolCard;
              }
            }
          },
          items: [{
            title: Str.markers, icon: 'data', cid: 'markerTab', items: {
              cid: 'markerGrid', cname: 'grid', showIcon: true, pagingBar: false, events: {
                itemdblclick(item) {
                  me.locateLine(item.data);
                }
              },
              columns: [{
                text: Str.desc, fieldName: 'desc', width: -1, render(value, data) {
                  let icon;
                  switch (data.type) {
                    case 'hint':
                      icon = 'lamp';
                      break;
                    case 'warn':
                      icon = 'warn';
                      break;
                    case 'error':
                      icon = 'error';
                      break;
                    default:
                      icon = 'info';
                  }
                  data._icon = icon;
                  return value;
                }
              }, {
                text: Str.path, fieldName: 'path', width: '30em', render(v, data) {
                  let path = me.getRelativePath(v);
                  if (data.compNode)
                    path += ' : ' + Wb.ide.XwlEditor.getPropPath(data.compNode, data.propType, data.propName);
                  return path;
                }
              },
              { text: Str.location, fieldName: 'lineNumber', width: '6em' },
              { text: Str.type, fieldName: 'type', width: '6em' }
              ]
            }
          }, {
            title: Str.debug, icon: 'bug', cid: 'debugTab',
            tbarx: {
              cname: 'toolbar',
              defaults: { scope: me },
              items: debugMenuItems
            }, items: {
              cid: 'debugGrid', header: false, cname: 'grid', pagingBar: false, multiSelect: true,
              url: 'm?xwl=dev/ide/select-debug',
              columns: [
                { text: Str.file, fieldName: 'file', width: -1 },
                {
                  text: Str.status, fieldName: 'status', width: '5em', render(v, data) {
                    let cls;
                    if (v == 0)
                      cls = 'w-sub-color-row';
                    else if (v == 2) {
                      cls = 'w-active-color-row';
                    } else cls = '';
                    data._cls = cls;
                    return [Str.disable, Str.enable, Str.debugging][v];
                  }
                }
              ],
              events: {
                itemdblclick() {
                  if (!me.debugActions.openDebug.disabled)
                    me.openDebug();
                },
                selectionchange() {
                  me.setDebugActions();
                }
              }
            }
          }, {
            title: Str.search, icon: 'search', cid: 'searchTab',
            tbarx: {
              cname: 'toolbar',
              defaults: { scope: me },
              items: [{
                icon: 'refresh', keysText: 'F5', tip: Str.refresh, handler() {
                  let grid = me.searchGrid;
                  if (grid.loaded)
                    grid.reload();
                },
              }, {
                icon: 'delete', tip: Str.clear, handler() {
                  me.searchGrid.destroyAll();
                }
              }]
            }, items: {
              cid: 'searchGrid', autoLoad: false, url: 'm?xwl=dev/ide/search', cname: 'grid', pagingBar: false,
              events: {
                itemdblclick(item) {
                  me.locateLine(item.data);
                }
              },
              columns: [{
                rowNum: true
              }, {
                text: Str.content, fieldName: 'content', width: -2, render(v, data, col, el) {
                  el.innerHTML = v;
                }
              }, {
                text: Str.path, fieldName: 'path', width: -1, render(v, data) {
                  let path = me.getRelativePath(v), compPath = data.compPath;
                  if (compPath) {
                    let pos = compPath.indexOf('.');
                    path += ' : ';
                    if (pos != -1)
                      path += compPath.substr(pos + 1);
                    path += (data.propType == 'events' ? '@' : '.') + data.propName;
                  }
                  return path;
                }
              }, {
                text: Str.location, width: '8em', align: 'right', render(v, data) {
                  return data.lineNumber + ' : ' + data.column;
                }
              }]
            }
          }, {
            title: Str.threads, icon: 'bolt', cid: 'threadsTab',
            tbarx: {
              cname: 'toolbar', defaults: { scope: me }, items: threadMenus
            }, items: {
              cid: 'threadGrid', cname: 'grid', pagingBar: false, autoLoad: false, columnsSortable: true,
              sorters: 'name', url: 'm?xwl=dev/ide/actions&xaction=getThreads'
            },
            events: {
              show() {
                let grid = app.threadGrid;
                if (!grid.loaded)
                  grid.load();
              }
            }
          }, {
            title: 'AI Gen', icon: 'wizard', cid: 'aiTab', layout: 'row',
            tbarx: {
              cname: 'toolbar', defaults: { scope: me }, items: [{
                icon: 'add', tip: Str.new, keys: 'Alt+O', handler() {
                  app.aiTextArea.clear();
                  app.aiGrid.deselectAll();
                  app.clearAiHis();
                  app.aiTextArea.focus();
                }
              }, {
                icon: 'delete', tip: Str.del, handler() {
                  let sels = app.aiGrid.selectionsData?.pluck('group_id');
                  app.aiGrid.removeRecords('m?xwl=dev/ide/actions&xaction=aiRemoveHis', null, null, f => {
                    sels.each(id => delete app.lastAiFiles?.[id]);
                  });
                }
              }, '|', {
                icon: 'play', keys: 'Alt+R', scope: undefined, tip: Str.run, handler() {
                  let selRec = app.aiGrid.selection, group_id = selRec?.data.group_id, textArea = app.aiTextArea,
                    bar = this.parent, aiClear = bar.down('aiClear').active,
                    overwrite = bar.down('aiOverwrite').active, uploadAnswers = bar.down('uploadAnswers').active,
                    aiTab = app.aiTab, fileVisible, toolbar, baseFolder, basePath, files, msg;

                  fileVisible = app.aiFileinput.visible;
                  msg = textArea.value;
                  if (!msg && !fileVisible) {
                    Wb.tipWarn(Str.requiredHint);
                    textArea.focus();
                    textArea.highlight();
                    return;
                  }
                  baseFolder = me.fileTree.selection;
                  if (!me.moduleNode.contains(baseFolder)) {
                    Wb.tip(Str.selectFolderInModule);
                    return;
                  }
                  if (baseFolder.leaf)
                    baseFolder = baseFolder.parent;
                  toolbar = me.viewTab.downWhole('aiTab-tool');
                  toolbar.disabled = true;
                  aiTab.spin = true;
                  basePath = baseFolder.data.path;
                  function fileToBase64(file) {
                    return new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve({ content: reader.result, name: file.name });
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                  }
                  function request(uploadFiles) {
                    Wb.ajax({
                      url: 'm?xwl=dev/ide/actions&xaction=aiCreate',
                      data: {
                        group_id, overwrite, aiClear, uploadAnswers, baseFolder: basePath, msg, uploadFiles,
                        oldFiles: aiClear ? app.lastAiFiles?.[group_id] : undefined
                      },
                      json: true,
                      mask: { target: aiTab, delay: 0 },
                      success(resp) {
                        group_id = resp.group_id;
                        app.lastAiFiles ??= {};
                        app.lastAiFiles[group_id] = resp.files;
                        if (selRec) {
                          me.addAiHis(resp.items);
                        } else {
                          app.aiGrid.addRecord({ group_id, msg: resp.msg }, false);
                        }
                        textArea.clear();
                        app.aiFileinput.clear();
                        if (resp.files)
                          baseFolder.loadSelect(null, f => baseFolder.expand());
                      },
                      callback() {
                        aiTab.spin = false;
                        toolbar.disabled = false;
                      }
                    });
                  }
                  if (fileVisible) {
                    files = app.aiFileinput.value;
                    Promise.all(files.map(file => fileToBase64(file))).then(
                      files => request(files)).catch(err => Wb.tipError(err));
                  } else {
                    request();
                  }
                }
              },
              { icon: 'update', cid: 'uploadAnswers', active: false, tip: 'Upload previous answers', activeBgColor: false },
              { icon: 'rotate', cid: 'aiOverwrite', active: true, tip: 'Overwrite existing files', activeBgColor: false },
              { icon: 'trash', cid: 'aiClear', active: false, tip: 'Clear previous generated files', activeBgColor: false }, '|',
              {
                icon: 'search-file', tip: 'Upload files', handler() {
                  Wb.selectFiles(files => {
                    let comp = app.aiFileinput;
                    comp.show();
                    comp.nextSibling.show();
                    comp.addFile(files);
                  }, app.aiFileinput.accept);
                }
              }, {
                icon: 'import', tip: 'Add selected file', handler() {
                  let files = me.getSelFiles();
                  if (!files.length) return Wb.tipSelect();
                  Wb.ajax({
                    url: 'm?xwl=dev/ide/actions&xaction=exportFiles',
                    params: { files },
                    json: true,
                    success(resp) {
                      let binary, u8, comp = app.aiFileinput;
                      resp.each(file => {
                        binary = atob(file.data);
                        u8 = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
                        comp.addFile(new File([u8], file.name));
                      });
                      comp.show();
                    }
                  });
                }
              }]
            }, items: [{
              layout: 'row', width: '70%', items: [{
                cid: 'aiGrid', cname: 'grid', multiSelect: true, width: '45%', plainTable: true, autoLoad: false,
                url: 'm?xwl=dev/ide/actions&xaction=aiDialog',
                tbar: {
                  items: {
                    cname: 'text', cid: 'search', flex: 1, placeholder: Str.search, clearButton: true, events: {
                      change(val) {
                        app.aiGrid.delayLoad({ comps: this });
                      }
                    }
                  }
                },
                columns: [
                  {
                    text: Str.content, fieldName: 'msg', width: -1, render(val, data, c, el) {
                      let p = el.addEl('w-row-center');
                      el.removeCls('w-text');
                      el.cls = 'w-hover-item';
                      p.addEl('w-text w-flex').textContent = val;
                      p.addEl('w-hover-show w-icon icon-delete w-margin-l w-pointer').setAttribute('xsid', data.group_id);
                    }
                  }
                ], events: {
                  selectionchange() {
                    let groupId = me.aiGrid.selectionData?.group_id;
                    me.clearAiHis();
                    if (groupId) {
                      Wb.ajax({
                        url: 'm?xwl=dev/ide/actions&xaction=aiDetails',
                        params: { groupId },
                        json: true,
                        success(resp) {
                          me.addAiHis(resp);
                        }
                      });
                    }
                  },
                  click(e) {
                    let target = e.target, groupId = target.getAttribute('xsid');
                    if (groupId) {
                      Wb.confirm(Str.delConfirm, f => {
                        Wb.ajax({
                          url: 'm?xwl=dev/ide/actions&xaction=aiRemoveHis',
                          params: { del: { $group_id: groupId } },
                          success() {
                            delete app.lastAiFiles?.[groupId];
                            target.getClosestComp(Wb.GridItem).destroy();
                          }
                        });
                      });
                    }
                  }
                }
              }, '||', {
                cid: 'aiDialogHis', cls: 'w-html', padding: 0, overflowTip: true, autoScroll: true, flex: 1, events: {
                  ready() {
                    this.onClickPreview();
                    if (!me.configs.aiEnabled) {
                      this.html = '<p>AI configuration steps:</p><ol><li>Open <a target="_blank" href="config">' +
                        'System Config</a> module.</li><li>Config "sys.ai.model" value.</li><li>Check ' +
                        '"sys.ai.inputPath" value.</li><li>Check "sys.ai.outputPath" value.</li>' +
                        '<li>Check other "sys.ai.*" values.</li><li>Enter a prompt and click Run button. See AI ' +
                        '<a href="ide?openModule=example/basic/ai-gen.xwl" target="_blank">Example</a>.</li></ol>' +
                        '<p><div>Config Model Example:</div><div>Apply for a Doubao model on ' +
                        '<a href="https://www.volcengine.com" target="_blank">VolcEngine</a>.' +
                        '</div><div>Configure the "sys.ai.model" as follows (replace keyId with your actual token):' +
                        '</div></p><div class="w-pre"><code>{\n' +
                        '  "url":"https://ark.cn-beijing.volces.com/api/v3/chat/completions",\n' +
                        '  "timeout":1200000,\n' +
                        '  "header":{\n' +
                        '    "Content-Type":"application/json",\n' +
                        '    "Authorization":"Bearer keyId"\n' +
                        '  },\n' +
                        '  "method":"POST",\n' +
                        '  "data":{\n' +
                        '    "model":"doubao-seed-2-0-pro-260215",\n' +
                        '    "temperature":0,\n' +
                        '    "top_p":0.35,\n' +
                        '    "stream":false,\n' +
                        '    "max_completion_tokens":128000\n' +
                        '  }\n' +
                        '}</code></div><p>For details search ' +
                        '"Before using AI" in <a target="_blank" href="docs">Documents</a>.</p>';
                    }
                  },
                  click(e) {
                    let target = e.target, xaction = target.closest('[xaction]')?.getAttribute('xaction'), el, val,
                      prefix = app.moduleNode.text + '/';

                    if (!xaction) return;
                    el = target.parentNode;
                    val = xaction.afterItem('|');
                    if (xaction.startsWith('del|')) {
                      Wb.confirm(Str.delConfirm, f => {
                        Wb.ajax({
                          url: 'm?xwl=dev/ide/actions&xaction=aiRemoveItem',
                          params: { sid: val },
                          success() {
                            el.fadeOut(f => {
                              el.remove();
                            }, 500);
                          }
                        });
                      });
                    } else if (xaction.startsWith('down|')) {
                      Wb.download('m?xwl=dev/ide/actions&xaction=aiDownload', { sid: val });
                    } else if (xaction.startsWith('link|')) {
                      app.fileTree.selectPath(prefix + val, node => !node && Wb.tipInfo(Str.notFound.format(val)));
                    } else if (xaction.startsWith('create|')) {
                      Wb.confirm(Str.doConfirm.format(Str.create), f => {
                        Wb.ajax({
                          url: 'm?xwl=dev/ide/actions&xaction=aiCreateFile',
                          params: { sid: val },
                          success(resp) {
                            app.fileTree.selectPath(prefix + resp,
                              (node, parent) => {
                                if (!node)
                                  parent.reload({ success() { app.fileTree.selectPath(prefix + resp) } });
                              });
                          }
                        });
                      });
                    } else if (val = target.xCopyspan) {
                      target.highlight();
                      navigator.clipboard.writeText(val.innerText);
                    }
                  }
                }
              }]
            }, '||', {
              layout: 'column', flex: 1, items: [
                {
                  cid: 'aiFileinput', cname: 'fileInput', browseMode: true, accept: '.png,.jpg,.jpeg,.xwl,.txt', visible: false,
                  multiple: true, height: '50%', events: {
                    change(files) {
                      if (!files?.length) {
                        let comp = app.aiFileinput;
                        comp.hide();
                        comp.nextSibling.hide();
                      }
                    }
                  }
                }, { cname: 'splitter', visible: false },
                {
                  cid: 'aiTextArea', flex: 1, cname: 'textArea', wrapBorder: 0, border: 1, placeholder: 'Prompt',
                  flex: 1, events: {
                    ready() {
                      let me = this, el = me.el, addFiles;

                      addFiles = files => {
                        let comp = app.aiFileinput;
                        comp.addFile(files);
                        comp.show();
                        comp.nextSibling.show();
                      }
                      el.ondragover = Event.pdHandler;
                      el.ondrop = e => {
                        e.stopEvent();
                        addFiles(e.dataTransfer.files);
                      };
                      me.mon(me.inputEl, 'paste', e => {
                        let files, file, data, item, ext, allowList = app.aiFileinput.accept;

                        data = e.clipboardData || window.clipboardData;
                        if (!data || !data.items) {
                          return;
                        }
                        allowList = allowList.replaceAll('.', '').splitTrim();
                        files = [];
                        for (item of data.items) {
                          if (item.kind == 'file') {
                            file = item.getAsFile();
                            if (file) {
                              ext = Wb.getFileExt(file.name).toLowerCase();
                              if (allowList.includes(ext)) {
                                files.push(file);
                              }
                            }
                          }
                        }
                        if (files.length) {
                          e.stopEvent();
                          addFiles(files);
                        }
                      });
                    }
                  }
                }]
            }],
            events: {
              show() {
                let grid = app.aiGrid;
                if (!grid.loaded) {
                  Wb.load('wb/libs/marked.js');
                  grid.load();
                }
              }
            }
          }]
        }]
      }]
    });
    me.createWebSocket(mainCt);
    Wb.onUnload(container, me.onUnload.bind(me));
    me.loadControls();
    me.setActions();
    me.setDebugActions();
    const httpHeartbeat = me.configs.httpHeartbeat;
    if (httpHeartbeat > 0)
      setInterval(f => Wb.ajax('refresh-session'), httpHeartbeat * 1000);
    return mainCt;
  }
  /**
   * Add AI dialog image. @priv
   * @param {String} sid Image record id.
   * @param {Element} el Parent element.
   * @return {Element} Image element.
   */
  addAiImg(sid, el) {
    let img = el.addTag('img');

    img.src = 'm?xwl=dev/ide/actions&xaction=aiDownload&sid=' + sid;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'cover';
    return img;
  }
  /**
   * Add AI dialog history. @priv
   * @param {Array} list Dialog message list in [{sid, msg_type, file_name, sdate, msg}].
   */
  addAiHis(list) {
    let me = this, dialogEl = me.aiDialogHis.el, childEl, el, msg_type, img, span, filename, time, lastTime;

    list.each(data => {
      time = data.sdate;
      if (time != lastTime) {
        lastTime = time;
        dialogEl.addEl('w-sub-color w-sized8 w-ta-center').textContent = time.dateValue.dateTimeText;
      }
      msg_type = data.msg_type;
      filename = data.file_name;
      childEl = dialogEl.addEl('w-hover-item w-padding w-msg3');
      if (msg_type < 6)
        childEl.style.background = 'unset';
      span = null
      if (Wb.isImageFile(filename)) {
        img = me.addAiImg(data.sid, childEl);
        img.style.position = 'relative';
      } else if (msg_type == 1 || msg_type == 7) {
        // file
        childEl.cls = 'w-row';
        el = childEl.addEl('w-btn w-margin-r');
        el.setAttribute('xaction', 'down|' + data.sid);
        el.addEl('w-icon icon-' + Wb.getFileIcon(filename));
        el.addEl('w-label').textContent = filename + ' (' + data.file_size.fileSize + ')';
        if (msg_type == 7) {
          el = childEl.addEl('w-btn w-btn-tool w-hover-show');
          el.setAttribute('xaction', 'link|' + filename);
          el.addEl('w-icon icon-right');
          el.setAttribute('xtip', 'Go to file tree node');
          el = childEl.addEl('w-btn w-btn-tool w-hover-show');
          el.setAttribute('xaction', 'create|' + data.sid);
          el.addEl('w-icon icon-file');
          el.setAttribute('xtip', 'Create and overwrite file');
        }
      } else {
        span = childEl.addTag('span');
        if (msg_type == 6) {
          let t, b, a;
          span.innerHTML = me.markdownToHtml(data.msg);
          span.queryAll('code').each(el => {
            t = el.textContent;
            b = t.startsWith('/m?xwl=');
            if (b || t.startsWith('m?xwl=')) {
              if (b)
                t = t.substr(1);
              el.textContent = '';
              a = el.addEl('w-link', 'a');
              a.textContent = a.href = t;
              a.target = '_blank';
            }
          });
        } else {
          span.cls = 'w-pre-wrap';
          span.textContent = data.msg;
        }
      }
      if (span) {
        el = childEl.addEl('w-hover-show w-icon icon-copy w-btn1', 'span');
        el.style.right = '1.6em';
        el.setAttribute('xaction', 'copy|');
        el.setAttribute('xtip', Str.copy);
        el.xCopyspan = span;
      }
      el = childEl.addEl('w-hover-show w-icon icon-delete w-btn1', 'span');
      el.setAttribute('xaction', 'del|' + data.sid);
      el.setAttribute('xtip', Str.del);
    });
    me.aiDialogHis.scrollToBottom();
  }
  /**
   * Markdown to html. @priv
   * @param {String} text Markdown text;
   * @return {String} HTML text.
   */
  markdownToHtml(text) {
    const configs = { headerIds: false, mangle: false };
    return marked.parse(text, configs);
  }
  /**
   * Clear AI dialog history. @priv
   */
  clearAiHis() {
    app.aiDialogHis.el.clearChildren();
  }
  /**
   * Get File tree columns. @priv
   * @return {Array} File tree columns array.
   */
  getFileTreeCols() {
    return [{
      fieldName: 'text',
      expander: true,
      width: -1,
      editor: { cname: 'text', required: true, valueType: 'filename' },
      render(value, data, col, el) {
        let icon, span, title = data.title, img = data.img;

        if (data.debug) {
          icon = 'bug-fill';
        } else if (!data._leaf) {
          icon = data.icon || (img ? '' : 'folder1');
        } else {
          icon = data.icon || (img ? '' : Wb.getFileIcon(value));
        }
        el.setCls(data.hideInMenu, 'w-active-color');
        data._icon = icon;
        data._img = img;
        if (title) {
          span = el.addTag('span');
          span.textContent = value;
          span = el.addEl('w-sub-color w-margin-l', 'span');
          if (title.startsWith('@')) {
            title = title.substr(1);
            if (!title.startsWith('@'))
              title = Str[title];
          }
          span.textContent = title;
        } else {
          return value;
        }
      }
    }]
  }
  /**
   * Check in selection files and folders to the lib.
   */
  checkIn() {
    let sels = app.fileTree.selections, len = sels.length, files = this.getSelFiles();

    if (files.some(file => !app.inApp(file))) {
      Wb.tipWarn(Str.fileMustInApp);
      return;
    }
    Wb.prompt({
      title: Str.checkIn + ' - ' + (len > 1 ? Str.nItems.format(len) : sels[0].data.text),
      layout: 'grid1', icon: 'login'
    }, [
      {
        cname: 'number', decimalCount: 2, intCount: 3, text: Str.version, cid: 'version', required: true,
        value: app.configs.version
      },
      { text: Str.remark, cid: 'remark' }
    ],
      (values, win) => {
        values.files = files;
        Wb.ajax({
          url: 'm?xwl=dev/ide/checkin',
          params: values,
          success() {
            win.close();
          }
        });
      }, 'wb.ide.checkIn');
  }
  /**
   * Open {{Version Manager}} module.
   */
  checkOut() {
    Wb.openNormal('m?xwl=dev/version');
  }
  /**
   * Import files to the selection folder.
   * @param {Boolean} [unzip] Whether to unzip files.
   */
  importFiles(unzip) {
    let me = this, node = me.fileTree.selection, items, win, params = me.configs;
    if (!node) {
      Wb.tipSelect();
      return;
    }
    if (node.leaf)
      node = node.parent;
    items = [
      { cid: 'files', text: Str.file, multiple: true, required: true, cname: 'fileInput', browseMode: true },
      {
        cid: 'charset', cname: 'select', text: Str.charset, value: params.sysFilenameCharset,
        data: ['UTF-8', params.charset, params.osCharset, params.fileCharset, params.filenameCharset].filter(a => a).unique()
      }];
    win = Wb.prompt({
      title: (unzip ? Str.importUnzip : Str.import) + ' - ' + node.text, autoGrid: 'up', layout: 'form1',
      icon: 'import'
    },
      items,
      (values, win) => {
        me.doImport(win, unzip, f => win.close(), values.charset);
      }, 'wb.ide.import');
    win.down('charset').visible = unzip;
  }
  /**
   * Export selection files.
   * @param {Boolean} [zip] Whether to zip files. Auto set to true if multiple files or directories are selected.
   */
  exportFiles(zip) {
    if (this.fileTree.selection)
      Wb.download('m?xwl=sys/file/export-files', { files: this.getSelFiles(), zip }, 'POST');
    else
      Wb.tipSelect();
  }
  /**
   * Do import operation. @priv
   * @param {Wb.Component/Wb.Component[]} comps Imported components.
   * @param {Boolean} [unzip] Whether to unzip files.
   * @param {Boolean} [callback] The function to execute once the import completes.
   * @param {String} [charset] The file name charset.
   */
  doImport(comps, unzip, callback, charset) {
    let fileTree = this.fileTree, node = fileTree.selection;

    if (node.leaf)
      node = node.parent;
    Wb.ajax({
      url: 'm?xwl=sys/file/import-files&mode=ide',
      comps,
      uploadProgress: true,
      json: true,
      params: { path: node.data.path, unzip, charset },
      success(resp) {
        let newNodes;
        if (node.loaded) {
          node.expand();
          newNodes = resp.filter(item => !node.some(sub => sub.text == item.text));
          node.addData(newNodes)
          fileTree.selection = node.filter(sub => resp.some(item => item.text == sub.text));
        } else {
          newNodes = resp.pluck('text');
          node.expand(f => {
            fileTree.selection = node.filter(node => newNodes.includes(node.text));
          });
        }
        callback?.();
      }
    });
  }
  /**
   * Create wizard. @priv
   * @param {String} [mode] Wizard mode.
   * -"crud": crud creation wizard
   * -"query": query creation wizard.
   * -"source": table, view, sp, module source.
   * @param {Function} [fn] Callback function.
   * @param {Object} [values] Default values.
   */
  createWizard(mode, fn, title, values) {
    let win, generalItems, dataItems, winItems, dbTree, winName, crudMode, sourceMode, icon, xaction,
      moduleTree, me = this;

    switch (mode) {
      case 'crud':
        title ??= Str.createCRUD;
        icon = 'table';
        crudMode = true;
        xaction = 'createCRUD';
        break;
      case 'query':
        title ??= Str.createQuery;
        icon = 'list';
        xaction = 'createQuery';
        break;
      case 'source':
        title ??= Str.dataSource;
        icon = 'data';
        xaction = 'createSource';
        sourceMode = true;
        break;
    }
    winName = mode + 'Win';
    win = me[winName];
    if (!win) {
      generalItems = me.getFilePromptItems(true).slice(0, 3);
      generalItems.push({ text: Str.dictConfig, cid: 'dict', cname: 'select', url: 'get-dict?xaction=getGroups' });
      if (mode == 'query') {
        generalItems.push({
          cname: 'checkGroup', showEmptyLabel: true, items: [
            { label: 'Use Wb.sql', cid: 'useWbSql' }
          ]
        });
      }
      dbTree = {
        cname: 'tree', url: 'm?xwl=admin/dbe/select-tree&cateMode=' + (crudMode ? 2 : 1), cid: 'dbTree',
        autoPostParams: true, keyWalking: true, contextMenu: {
          items: {
            text: Str.refresh, icon: 'refresh', handler() {
              this.contextTarget.getClosestComp(Wb.Tree).loadSelect();
            }
          }
        }, columns: [{
          fieldName: 'text', width: -1, expander: true, render(value, data, column, el) {
            let subText = data.subText, index;

            if (data.type == 'field')
              index = data.fieldIndex + '. ';
            else
              index = '';
            if (subText) {
              let span = el.addTag('span');
              span.textContent = index + value;
              span = el.addEl('w-sub-color w-margin-l', 'span');
              span.textContent = subText;
            } else
              return index + value;
          }
        }]
      };

      if (crudMode) {
        dataItems = dbTree;
      } else {
        dataItems = [{
          cname: 'radioGroup', text: Str.dataSource, cid: 'sourceRadio', required: true, items: [
            { label: Str.object, value: true }, { label: 'SQL' }],
          events: {
            change() {
              let radio = this;
              radio.parent.down('cardCt').activeIndex = radio.value;
            }
          }
        }, {
          cname: 'cardCt', flex: 1, cid: 'cardCt', layout: 'fit', items: [
            dbTree,
            {
              cname: 'container', layout: 'form1', items: [
                {
                  cname: 'select', text: Str.db, url: 'm?xwl=admin/dbe/select-tree', cid: 'db', forceSelect: true, events: {
                    change() {
                      let me = this;
                      if (me.isValid)
                        me.nextSibling.sqlDb = me.value;
                    }
                  }
                },
                { cname: 'codeEditor', language: 'sql', cid: 'sql', flex: 1, required: true, sqlDb: '' }]
            }
          ]
        }];
        if (sourceMode) {
          dataItems[0].items.push({ label: Str.module });
          dataItems[1].items.push({
            layout: 'form1', items: [
              { cname: 'text', text: Str.params, cid: 'params' },
              {
                cname: 'tree', flex: 1, columns: me.getFileTreeCols(), url: 'm?xwl=sys/file/get&type=ide&moduleSort=1',
                cid: 'moduleTree', events: {
                  beforeload(configs, params) {
                    if (!configs.node)
                      params.path = me.configs.modulePath;
                  },
                  success() {
                    if (this.xSelectPath)
                      this.selectPath(this.xSelectPath);
                  }
                }
              }]
          });
          dataItems.insert(1, { text: Str.dictConfig, cid: 'dict', cname: 'select', url: 'get-dict?xaction=getGroups' });
        }
      }
      if (sourceMode) {
        winItems = dataItems;
      } else {
        winItems = [{
          cname: 'fieldset', layout: 'form1', title: Str.general, cid: 'generalFieldSet',
          defaults: { cname: 'text' }, items: generalItems
        }, {
          cname: 'fieldset', title: Str.data, minHeight: '20em', layout: crudMode ? 'fit' : 'form1',
          flex: 1, items: dataItems
        }];
      }
      win = me[winName] = new Wb.Window({
        icon, layout: 'form1',
        dialog: true, width: '60em', height: '50em',
        items: winItems,
        events: {
          ok() {
            let me = this, children = me.children, params = {}, node = app.fileTree.selection ?? app.moduleNode,
              radioIndex = children.sourceRadio?.value, tempNode;

            if (node.leaf)
              node = node.parent;
            params.path = node.data.path;
            if (crudMode || radioIndex == 0) {
              let nodeParams;
              tempNode = children.dbTree.selection;
              nodeParams = Wb.applyWith({}, tempNode?.createParams(true), 'db,schem,tableName,viewName,procName');
              if (!nodeParams.tableName && !nodeParams.viewName && !nodeParams.procName) {
                Wb.tipSelect(Str.object);
                return;
              }
              Wb.apply(params, nodeParams);
            }
            if (sourceMode && radioIndex == 2) {
              tempNode = children.moduleTree.selection;
              if (!tempNode?.leaf) {
                Wb.tipSelect(Str.module);
                return;
              }
              params.modulePath = tempNode.data.path;
            }
            Wb.ajax({
              url: 'm?xwl=dev/ide/actions&xaction=' + xaction,
              comps: me,
              params,
              success(resp) {
                if (!sourceMode) {
                  node.loadSelect(null, f => node.expand(f => node.highlight()));
                }
                if (win.xCallbackFn?.(resp) !== false)
                  me.hide();
              }
            });
          }
        }
      });
    }
    Wb.reset(win.children.generalFieldSet);
    Wb.reset(win.children.params);
    win.xCallbackFn = fn;
    win.children.params?.reset();
    win.children.sql?.reset();
    win.title = title;
    win.show();
    moduleTree = win.down('moduleTree');
    if (moduleTree)
      moduleTree.xSelectPath = null;
    if (values) {
      let path;
      Wb.setValue(win, values);
      if (path = values.moduleTree) {
        moduleTree.xSelectPath = path;
        win.down('sourceRadio').value = 2;
        moduleTree.selectPath(path);
      }
    }
  }
  /**
   * Add component nodes to current node. @priv
   */
  addComps(editorOnly, title) {
    let me = this, xwl = me.activeXwl, tree = xwl.compTree, node = tree.selection || tree.firstItem,
      data, url, params, moduleTree, pairs;

    data = node.up(p => p.data?.cls == 'Wb.Grid' || p.data?.cls == 'Wb.Tree')?.data?.properties;
    if (data) {
      url = data.url;
      if (url) {
        if (url.startsWith('@'))
          url = url.substr(1);
        if (url.startsWith('xpath')) {
          url = 'm?xwl=' + me.constructor.parseUrl(url, me.getRelativePath(xwl.parent.path), true);
        }
        if (url.startsWith('m?')) {
          url = url.substr(url.indexOf('m?') + 2);
          params = {};
          pairs = url.split('&');
          pairs.forEach(pair => {
            pair = pair.split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
          });
          if (params.xwl)
            moduleTree = Wb.normalizePath(params.xwl) + '.xwl';
          delete params.xwl;
          if (Wb.isEmpty(params))
            params = undefined;
          else
            params = Wb.encode(params);
        }
      }
    }
    me.createWizard('source', resp => {
      try {
        resp = Wb.decode(resp);
      } catch (e) {
        Wb.tipError(Str.concat.format(Str.error, e.toString()));
        return false;
      }
      if (!resp?.columns && resp?.editors) {
        Wb.tipError(Str.invalidValue.format(Str.data));
        return false;
      }
      me.addCompNodes(node, Wb.isArray(resp) ? resp : resp?.columns, resp?.editors, xwl, editorOnly,
        data?.editable == 'true');
    }, title, { moduleTree, params });
  }
  /**
   * Add component nodes to the current select node. @priv
   * @param {Wb.TreeItem} node The node to be add comps.
   * @param {Array} nodes Component nodes list.
   * @param {Array} editors Prepared editors.
   * @param {Wb.XwlEditor} xwl Xwl editor.
   * @param {Boolean} [editorOnly] Whether to create editor only.
   * @param {Boolean} [editable] Whether columns is editable.
   */
  addCompNodes(node, nodes, editors, xwl, editorOnly, editable) {
    const excludeNames = ['editor', 'fieldType', 'dataType', 'scale', 'precision', 'required', 'typeName', 'isBlob'];

    let compNode, editor, cid, cls, configs, meta;

    node.expand();
    if (!editorOnly && node.data.cls != 'Wb.Array' && !node.find(item => item.data.properties.cid == 'columns')) {
      node = node.addData({
        cls: 'Wb.Array', events: {}, properties: { cid: 'columns' }, text: 'columns',
        _expanded: true, _icon: 'array', items: []
      });
    }
    nodes.forEach(item => {
      if (editorOnly) {
        compNode = node;
      } else {
        if (editors) {
          configs = item;
          configs.items = [];
        } else {
          if (item.rowNum)
            cid = 'rowNumCol';
          else
            cid = item.fieldName + 'Col';
          configs = {
            cls: 'Wb.Column', events: {}, text: cid, _expanded: true, _icon: 'column',
            items: [], properties: { cid }
          };
          Wb.each(item, (k, v) => {
            if (k == 'render') {
              if (v == 'Wb.Column.blobRender')
                v = "return Wb.Column.blobRender(value);";
              else
                v = v.slice(v.indexOf('{') + 1, -2);
            }
            if (!excludeNames.includes(k)) {
              configs.properties[k] = String(v);
            }
          });
        }
        if (!node.find(item => item.data.properties.cid == configs.properties.cid))
          compNode = node.addData(configs);
      }
      if (editorOnly || editable) {
        editor = editors ? editors.find(e => e.properties.cid == item.properties.fieldName) : item.editor;
        if (editor) {
          cls = editor?.cls;
          if (!editorOnly && cls == 'Wb.FileInput')
            return;
          if (editors) {
            configs = editor;
            configs.items = [];
            if (!editorOnly) {
              if (cls == 'Wb.Toggle' || cls == 'Wb.Check') {
                compNode.data.properties.checkBox = 'int';
                return;
              }
              configs.properties.isProperty = 'true';
              configs.properties.cid = configs.text = 'editor';
              delete configs.properties.text;
            }
          } else {
            meta = WbDocsData[Wb.find(WbDocsData, (k, v) => v.cname == editor.cname)];
            if (editorOnly)
              cid = item.fieldName;
            else
              cid = 'editor';
            configs = {
              cls: meta.cls, text: cid, _expanded: true,
              properties: { cid }, events: {}, _icon: meta.icon, items: []
            };
            if (!editorOnly)
              configs.properties.isProperty = 'true';
            Wb.each(editor, (k, v) => {
              if (k != 'cname')
                configs.properties[k] = String(v);
            });
            if (item.text != null)
              configs.properties.text = item.text;
          }
          if (!compNode.find(item => item.data.properties.cid == configs.properties.cid))
            compNode.addData(configs);
        }
      }
    });
    xwl.fireEvent('change');
  }
  /**
   * Refresh tool buttons on the context tool bar. @priv
   * @param {String} [belongTo] Which category does the tool buttons belong to.
   */
  refreshTools(belongTo) {
    let btn = this.lastOffenTool, type;

    while (btn = btn.nextSibling) {
      type = btn.belongTo;
      if (type) {
        btn.visible = belongTo?.split(',').includes(type) ?? false;
      }
    }
  }
  /**
   * Set the modified status to the specified tab card.
   * @param {Wb.Card} card Tab card.
   */
  setModified(card) {
    let me = this, a = me.actions;

    Wb.setModified(card);
    if (card == me.activeCard)
      a.save.disabled = false;
    a.saveAll.disabled = false;
  }
  /**
   * Set the unmodified status to the specified tab card.
   * @param {Wb.Card} card Tab card.
   */
  unModified(card) {
    let me = this, a = me.actions;

    Wb.unModified(card);
    if (card == me.activeCard)
      a.save.disabled = true;
    a.saveAll.disabled = !me.fileTab.some(t => t.isModified);
  }
  /**
   * Set actions status.
   */
  setActions() {
    let me = this, a = me.actions, node = me.fileTree.selection, data = node?.data,
      fileTab = me.fileTab, activeCard = me.activeCard, xwl = me.activeXwl,
      path = activeCard?.path;

    a.setProperty.disabled = a.addFolder.disabled = a.addFile.disabled = a.checkIn.disabled = !data?.path;
    a.close.disabled = a.closeAll.disabled = !activeCard;
    a.save.disabled = !activeCard?.isModified;
    a.saveAll.disabled = !fileTab.some(t => t.isModified);
    a.rename.disabled = !data?.path || node?.depth == 0 || data?.isRoot;
    a.run.disabled = a.runNew.disabled = !me.getUrlPath(activeCard?.path, true);
    if (!fileTab.hasChild) {
      a.back.disabled = true;
      a.forward.disabled = true;
    }
    a.toDesignPage.disabled = !xwl;
    a.rebuildDesign.disabled = a.openDesign.disabled = a.clearCompValues.disabled = me.linkControlItem.disabled =
      a.addComps.disabled = a.addColumns.disabled = xwl?.activeIndex != 0 || !xwl?.compTree.selection;
    a.toggleDebug.disabled = !me.selModules.length;
    me.toggleSourceItem.disabled = !(path && me.inApp(path) && me.isModule(path));
    me.regroupTabItem.disabled = !activeCard;
    me.mainCardBack.disabled = me.mainCardForward.disabled = !activeCard;
    me.subCardBack.disabled = me.subCardForward.disabled = !xwl;
  }
  /**
   * Fires before the module is closed.
   */
  onUnload() {
    let modifiedCard = this.fileTab.findBy(card => card.isModified), btn;
    if (modifiedCard) {
      btn = modifiedCard.tabButton;
      modifiedCard.show();
      btn.highlight();
      return false;
    }
  }
  /**
   * Create a unique control data object for CID based on the control data template. @priv
   * @param {Object} data Control data object.
   * @param {Wb.TreeItem} node Parent node.
   * @return {Object} Created control data.
   */
  createControl(tpl, parent) {
    let i = 1, data = Wb.copy(tpl), cid = data.text, ids = {};

    parent.each(item => ids[item.text] = true);
    while (ids[cid + i]) {
      i++;
    }
    cid += i;
    data.text = cid;
    data.properties = { cid };
    data.events = {};
    data.items = [];
    delete data.sort;
    return data;
  }
  /**
   * Create actions for menus and tool buttons. @priv
   * @return {Wb.Actions} The created actions.
   */
  createActions() {
    let me = this;
    me.actions = new Wb.Actions({
      // file
      addFile: { icon: 'file-fill', menuText: Str.addFile, ellipsis: true, keys: 'Ctrl+J', handler: me.addFile },
      addFolder: {
        icon: 'folder1', menuText: Str.addFolder, ellipsis: true,
        keys: 'Ctrl+Shift+J', handler: me.addFolder
      },
      openFile: {
        menuText: Str.open, handler: me.doOpenFile
      },
      createCRUD: {
        icon: 'table', menuText: Str.createCRUD, handler() { me.createWizard('crud') }
      },
      createQuery: {
        icon: 'list', menuText: Str.createQuery, handler() { me.createWizard('query') }
      },
      import: {
        icon: 'import', menuText: Str.import, ellipsis: true, handler() {
          me.importFiles();
        }
      },
      importUnzip: {
        menuText: Str.importUnzip, ellipsis: true, handler(e) {
          me.importFiles(true);
        }
      },
      export: {
        icon: 'export', menuText: Str.export, handler() {
          me.exportFiles();
        }
      },
      exportZip: {
        menuText: Str.exportZip, handler(e) {
          me.exportFiles(true);
        }
      },
      close: {
        menuText: Str.close, keys: 'Ctrl+L', handler() {
          me.fileTab.closeCards(false);
        }
      },
      closeAll: {
        menuText: Str.closeAll, handler() {
          me.fileTab.closeCards();
        }
      },
      checkIn: {
        icon: 'login', menuText: Str.checkIn, ellipsis: true, handler() {
          me.checkIn();
        }
      },
      checkOut: {
        icon: 'logout', menuText: Str.checkOut, ellipsis: true, handler() {
          me.checkOut();
        }
      },
      save: { icon: 'save', menuText: Str.save, keys: 'Ctrl+S', handler: me.save },
      saveAll: { icon: 'save-all', menuText: Str.saveAll, keys: 'Ctrl+Shift+S', handler: me.saveAll },
      rename: {
        icon: 'edit', menuText: Str.rename, keys: 'F2', ellipsis: true, stopEvent: false, handler: me.rename
      },
      refresh: { icon: 'refresh', menuText: Str.refresh, keys: 'F5', handler: me.refresh },
      setProperty: {
        icon: 'property', menuText: Str.property, keys: 'Ctrl+U',
        ellipsis: true, handler: me.setProperty
      },
      // edit
      doDelete: {
        icon: 'delete', menuText: Str.del, keys: 'Delete | Ctrl+Shift+X',
        stopEvent: false, handler: me.doDelete
      },
      doCut: { icon: 'cut', menuText: Str.cut, keys: 'Ctrl+X', stopEvent: false, handler: me.doCut },
      doCopy: { icon: 'copy', menuText: Str.copy, keys: 'Ctrl+C', stopEvent: false, handler: me.doCopy },
      doPaste: {
        icon: 'paste', menuText: Str.paste, keys: 'Ctrl+V | Ctrl+Shift+V', stopEvent: false,
        handler: me.doPaste
      },
      // navigate
      back: { icon: 'left4', menuText: Str.back, keys: 'Ctrl+9', handler: me.back },
      forward: { icon: 'right4', menuText: Str.forward, keys: 'Ctrl+0', handler: me.forward },
      toDesignPage: { icon: 'model', menuText: Str.toDesignPage, keys: 'Ctrl+Shift+9', handler: me.toDesignPage },
      // Run
      run: { icon: 'play', menuText: Str.run, keys: 'Ctrl+Q', handler: me.run },
      runNew: { menuText: Str.runNew, keys: 'Ctrl+Shift+Q', handler: me.runNew },
      toggleDebug: {
        icon: 'bug-fill', menuText: Str.toggleDebug, keys: 'Ctrl+D',
        handler: me.toggleDebug
      },
      reloadSystem: { menuText: Str.reloadSystem, handler: me.reloadSystem },
      // tool
      createTheme: { icon: 'file-css', menuText: Str.createTheme, keys: 'Ctrl+Shift+K', handler: me.createTheme },
      createRelease: {
        icon: 'compile', menuText: Str.createRelease, ellipsis: true, handler: me.createRelease
      },
      compressScript: { icon: 'compress', menuText: Str.compressScript, ellipsis: true, handler: me.compressScript },
      // help
      openDocs: { icon: 'book', menuText: Str.docs, keys: 'F1', handler: me.openDocs },
      createDocs: { icon: 'detail', menuText: Str.createDocs, keys: 'Ctrl+F1', handler: me.createDocs },
      // xwl
      openDesign: { icon: 'layout', menuText: Str.uiDesigner, keys: 'Ctrl+M', handler: me.openDesign },
      rebuildDesign: { icon: 'loading3', menuText: Str.rebuildDesign, handler: me.rebuildDesign },
      addComps: { icon: 'form', menuText: Str.addComps, handler() { me.addComps(true, Str.addComps) } },
      addColumns: { icon: 'column', menuText: Str.addColumn, handler() { me.addComps(false, Str.addColumn) } },
      clearCompValues: { icon: 'trash', menuText: Str.clearValues, handler: me.clearCompValues }
    }, me);
    return me.actions;
  }
  /**
   * Create actions for debug operation. @priv
   * @return {Wb.Actions} The created debug actions.
   */
  createDebugActions() {
    let me = this;
    me.debugActions = new Wb.Actions({
      run: {
        menuText: Str.run, icon: 'play', keys: 'Alt+R', handler() {
          this.debugGrid.selections.forEach(item => {
            if (item.data.status != 2)
              this.runModule(item.data.file.slice(0, -4));
          });
          me.setDebugActions();
        }
      },
      resume: {
        menuText: Str.resume, icon: 'resume', keys: 'Alt+U', handler() {
          this.setDebugStatus('resume');
        }
      },
      terminate: {
        menuText: Str.terminate, icon: 'stop', keys: 'Alt+T', handler() {
          this.setDebugStatus('terminate');
        }
      },
      disable: {
        menuText: Str.disable, icon: 'cancel', keys: 'Alt+C', handler() {
          this.setDebugStatus('disable');
        }
      },
      enable: {
        menuText: Str.enable, icon: 'ok', keys: 'Alt+O', handler() {
          this.setDebugStatus('enable');
        }
      },
      remove: { menuText: Str.del, keysText: 'Delete', icon: 'delete', handler: me.removeDebug },
      openDebug: {
        menuText: Str.openDebug, icon: 'devtool', keys: 'Alt+N', handler: me.openDebug
      },
      copyUrl: { menuText: Str.copyURL, keysText: 'Ctrl+C', icon: 'copy', handler() { me.copyDebugUrl() } },
      refresh: { menuText: Str.refresh, keysText: 'F5', icon: 'refresh', handler: me.refreshDebugGrid }
    });
    return me.debugActions;
  }
  /**
   * Open a new window and go to the official website.
   */
  toOfficialSite() {
    window.open('https://www.geejing.com');
  }
  /** @property {String} - The hint information of the bottom bar. */
  set hint(value) {
    this.hintLabel.text = value;
  }
  /***/
  get hint() {
    return this.hintLabel.text;
  }
  /**
   * Determines whether the specified path is located in the module folder(including itself).
   * @param {String} path The file path.
   * @return {Boolean} Returns true in the module folder, false otherwise.
   */
  inModule(path) {
    return path.startsWith(this.configs.modulePath);
  }
  /**
   * Determines whether the specified path is located in the app folder(including itself).
   * @param {String} path The file path.
   * @return {Boolean} Returns true in the app folder, false otherwise.
   */
  inApp(path) {
    return path.startsWith(this.configs.path);
  }
  /**
   * Record the position of the tab and edit cursor, which is used for location navigation. @priv
   */
  recordActivity() {
    let me = this, card = me.activeCard;
    if (me.stopRecNav || !card)
      return;
    let subCard, lastInfo, editor, info = { card: card.cid }, backList = me.backList;
    if (card.fileExt == 'xwl') {
      subCard = card.firstItem.activeCard;
      if (!subCard)
        return;
      editor = subCard.firstItem;
      info.subCard = subCard.cid;
    } else
      editor = card.firstItem;
    if (editor instanceof Wb.CodeEditor)
      info.cursor = editor.cursorCopy;
    else
      editor = null;
    lastInfo = backList.lastItem;
    if (!lastInfo || lastInfo.card != info.card || lastInfo.subCard != info.subCard ||
      (editor && ((Math.abs(info.cursor.column - lastInfo.cursor.column) > 100) ||
        (Math.abs(info.cursor.lineNumber - lastInfo.cursor.lineNumber) > 10)))) {
      if (backList.length > 49)
        backList.splice(0, 1);
      backList.push(info);
      me.actions.back.disabled = false;
    }
  }
  /**
   * Back to the previous tab card or cursor position in sequence. @priv
   */
  back() {
    let me = this, a = me.actions, len = me.backList.length;
    if (len < 3)
      a.back.disabled = true;
    let info = me.backList.pop();
    if (info) {
      if (me.forwardList.length > 49)
        me.forwardList.splice(0, 1);
      me.forwardList.push(info);
    } else return;
    me.stopRecNav = true;
    while (me.backList.length > 0 && !me.navigate(me.backList[me.backList.length - 1])) {
      me.backList.pop();
    }
    me.stopRecNav = false;
    a.forward.disabled = false;
  }
  /**
   * Forward to the last backed tab card or cursor position. @priv
   */
  forward() {
    let info, me = this, a = me.actions;
    if (me.forwardList.length < 2)
      a.forward.disabled = true;
    me.stopRecNav = true;
    while ((info = me.forwardList.pop())) {
      if (me.navigate(info))
        break;
    }
    me.stopRecNav = false;
    if (info) {
      if (me.backList.length > 49)
        me.backList.splice(0, 1);
      me.backList.push(info);
    }
    a.back.disabled = false;
  }
  /**
   * Navigate to the specified tab card or cursor position by the given information. @priv
   * @param {Object} info Tab card or cursor position.
   * @return {Boolean} Returns true on success, false otherwise.
   */
  navigate(info) {
    let card, subCard, me = this;
    card = me.fileTab.find(info.card);
    if (card)
      card.show();
    else return false;
    if (info.subCard) {
      subCard = card.firstItem.find(info.subCard);
      if (subCard) {
        subCard.show();
        if (info.cursor)
          subCard.firstItem.cursor = info.cursor;
      } else return false;
    } else if (info.cursor)
      card.firstItem.cursor = info.cursor;
    return true;
  }
  /**
   * Set the focus to the specified card.
   * @param {Wb.Card} [card] Focused card.
   */
  focusCard() {
    let editor = this.mainEditor;
    if (editor)
      editor.focus();
    else
      this.updateCursor();
  }
  /**
   * Set charset of currently opened file.
   */
  setCharset() {
    let me = this, card = me.activeCard, path = card.path, editor = me.mainEditor;

    Wb.prompt({ icon: 'earth', title: Str.setCharset + ' - ' + Wb.getFilename(path) }, [
      {
        cid: 'charset', cname: 'select', required: true, text: Str.charset, value: card.charset,
        data: ['UTF-8', me.configs.charset, me.configs.osCharset, me.configs.fileCharset].unique()
      }, { cname: 'displayField', showEmptyLabel: true, icon: 'warn', value: Str.overwriteTextHint }
    ], (values, win) => {
      Wb.ajax({
        url: 'm?xwl=sys/file/open',
        params: { path, charset: values.charset },
        success(resp) {
          let pos = resp.indexOf('|');
          card.lastModified = resp.substr(0, pos);
          editor.value = resp.substr(pos + 1);
          me.charsetLabel.text = card.charset = values.charset;
          win.close();
        }
      });
    });
  }
  /**
   * Determines whether the specified path is a module path.
   * @param {String/Wb.Card} path Path or tab card which contains path.
   * @return {Boolean} Returns true is module path, false otherwise.
   */
  isModule(path) {
    if (!path || path.moduleUrl)
      return false;
    if (!Wb.isString(path))
      path = path.path; //card
    if (path.endsWith('/'))
      return false;
    return path.endsWith('.xwl');
  }
  /** @property {String} - Active card or null if not found. */
  get activeCard() {
    return this.fileTab.activeCard;
  }
  /** @property {Object} - The currently opened module app scope or null if not found. */
  get activeModule() {
    return this.activeCard?.module ?? null;
  }
  /** @property {String} - The currently opened file path or null if not found. */
  get activeFile() {
    return this.activeCard?.path ?? null;
  }
  /** @property {Wb.CodeEditor} - The main editor of currently opened tab card or null if not found. */
  get mainEditor() {
    let card = this.activeCard;
    // moduleUrl means running module card
    if (card?.moduleUrl)
      return null;
    else if (this.isModule(card))
      return card.firstItem.mainEditor;
    else
      return card?.mainEditor;
  }
  /** @property {Wb.ide.XwlEditor} - The currently opened xwl editor or null if not found. */
  get activeXwl() {
    let card = this.activeCard;
    return this.isModule(card) ? card.firstItem : null;
  }
  /** @property {String} - The selected debugging URL. Returns null means no selection, returns empty string
   * means selection but not in debug progress. */
  get debugUrl() {
    let path = Wb.path;

    if (path)
      path = 'path=' + encodeURI(path.substr(1)) + '&';
    return 'wb/libs/devtools/app.html?' + path + 'xwl=' + encodeURI(this.debugGrid.selectionData.file.slice(0, -4));
  }
  /**
   * Do refresh action in the context.
   */
  refresh() {
    let me = this;

    if (me.debugGrid.activated)
      me.refreshDebugGrid();
    else if (me.searchGrid.activated)
      me.searchGrid.loaded && me.searchGrid.reload();
    else if (me.threadGrid.activated)
      me.threadGrid.reload();
    else
      me.fileTree.loadSelect();
  }
  /**
   * Refresh debugging grid.
   */
  refreshDebugGrid() {
    let me = this;
    me.debugGrid.reload({ success() { me.setDebugActions() } });
  }
  /**
   * Copy current debugging url to the clipboard. @priv
   */
  copyDebugUrl() {
    let cp = navigator.clipboard, url = location.protocol + '//' + location.host + Wb.path + '/' + this.debugUrl;
    if (cp)
      cp.writeText(url).then(null, f => Wb.tipError(Str.accessCbFailed));
    else
      Wb.info(url);
  }
  /**
   * Open debugging window. @priv
   */
  openDebug() {
    window.open(this.debugUrl);
  }
  /**
   * Set debug actions status. @priv
   */
  setDebugActions() {
    let me = this, actions = me.debugActions, data, canRun, canResume, canTerminate, canDisable,
      canEnable, canRemove, canCopy;

    me.debugGrid.selections.forEach(item => {
      data = item.data;
      canRemove = true;
      switch (data.status) {
        case 0:
          canEnable = true;
          break;
        case 1:
          canRun = true;
          canDisable = true;
          break;
        case 2:
          canResume = true;
          canDisable = true;
          canTerminate = true;
          canCopy = true;
          break;
      }
    });
    actions.run.disabled = !canRun;
    actions.resume.disabled = !canResume;
    actions.terminate.disabled = !canTerminate;
    actions.disable.disabled = !canDisable;
    actions.enable.disabled = !canEnable;
    actions.remove.disabled = !canRemove;
    actions.copyUrl.disabled = actions.openDebug.disabled = !canCopy;
  }
  /**
   * Do delete selection objects in the context. @priv
   */
  doDelete(e) {
    let xwl, compActivated;

    if (document.activeElement.isInput) {
      // ignore, use default
    } else if (this.fileTree.activated) {
      this.deleteFiles();
      e.stopEvent();
    } else if ((xwl = this.activeXwl)?.activated) {
      let tree = xwl.compTree;
      if (tree.activated || (compActivated = this.selCompActivated)) {
        if (tree.selection)
          xwl.removeSelComps(compActivated);
        e.stopEvent();
      }
    } else if (this.debugGrid.activated) {
      this.removeDebug();
      e.stopEvent();
    }
  }
  /**
   * Determines whether the selection component is activated. @priv
   * @return {Boolean} Returns true is activated, false otherwise.
   */
  get selCompActivated() {
    let designer = this.activeXwl?.designer;

    return designer?.activated && designer?.selComp;
  }
  /**
   * Do cut operation in the context.
   */
  doCut(e) {
    let tree, xwl, compActivated;

    if (document.activeElement.isInput) {
      // ignore, use default
    } else if (this.fileTree.activated) {
      this.copyFiles(true);
      e.stopEvent();
    } else if ((tree = (xwl = this.activeXwl)?.compTree)?.activated || (compActivated = this.selCompActivated)) {
      if (tree.selection) {
        this.clipboard = { type: 'compTree', data: tree.topSelections.pluck('itemsData') };
        xwl.removeSelComps(compActivated);
      }
      e.stopEvent();
    }
  }
  /**
   * Do copy operation in the context.
   */
  doCopy(e) {
    let tree, activeEl = document.activeElement;

    if (activeEl.isInput) {
      // ignore, use default
    } else if (activeEl.closest('.w-result') && window.getSelection().isCollapsed) {
      navigator.clipboard.writeText(activeEl.innerText);
    } else if (this.fileTree.activated) {
      this.copyFiles();
      e.stopEvent();
    } else if ((tree = this.activeXwl?.compTree)?.activated || this.selCompActivated) {
      if (tree.selection)
        this.clipboard = { type: 'compTree', data: Wb.clone(tree.topSelections.pluck('itemsData')) };
      e.stopEvent();
    } else if (this.debugGrid.activated) {
      this.copyDebugUrl();
      e.stopEvent();
    }
  }
  /**
   * Do paste operation in the context.
   * @param {Event} e Event object.
   */
  doPaste(e) {
    let me = this, xwl = me.activeXwl, tree, clipboard = me.clipboard, designerActivated;

    if (document.activeElement.isInput) {
      // ignore, use default
    } else if (me.fileTree.activated) {
      me.pasteFiles(e.shiftKey);
      e.stopEvent();
    } else if (((tree = xwl?.compTree)?.activated ||
      (designerActivated = xwl?.designer.activated)) &&
      clipboard?.type == 'compTree') {
      let designer = xwl.designer;
      let data = Wb.clone(clipboard.data);
      if (data[0].cls == 'Wb.Module') {
        xwl.removeBindings(tree.firstItem);
        tree.data = data;
        tree.firstItem.select();
      } else {
        let newNodes, tempCid, oldCid, cid, i, existCid = {},
          selNode = tree.selection ?? tree.firstItem;
        if (e.shiftKey || selNode.depth == 0 || designerActivated && !designer.selComp) {
          if (designerActivated)
            selNode = designer.bindNode;
          selNode.each(item => existCid[item.text] = true);
          newNodes = selNode.addData(data);
          selNode.expand();
          designer.notifyDrop({ mode: 'append', dest: selNode, dropItems: newNodes });
        } else {
          selNode.parent.each(item => existCid[item.text] = true);
          newNodes = selNode.parent.insertDataAfter(data, selNode);
          designer.notifyDrop({ mode: 'after', dest: selNode, dropItems: newNodes });
        }
        newNodes.forEach(node => {
          oldCid = cid = tempCid = node.text;
          // remove num suffix
          if (existCid[cid])
            tempCid = oldCid.replace(/\d+$/, '');
          i = 1;
          while (existCid[cid]) {
            cid = tempCid + (i++);
          }
          existCid[cid] = true;
          if (oldCid != cid) {
            node.proxy.text = cid;
            node.data.properties.cid = cid;
          }
        });
        xwl.checkDupCid();
        if (designerActivated) {
          designer.deselectAll(newNodes.pluck('bindComp'));
          designer.selComp?.intoView();
          designer.focus();
        } else {
          tree.selection = newNodes;
        }
      }
      xwl.fireEvent('change');
      e.stopEvent();
    }
  }
  /** @property {Object} fileClipboard File clipboard. @priv */
  /**
   * Copy files to the clipboard.
   * @param {Boolean} isCut True to cut files.
   */
  copyFiles(isCut) {
    let fileTree = this.fileTree, nodes = fileTree.selections, findNode;

    if (!nodes.length) {
      Wb.tipWarn(Str.selectFileFolder);
      return;
    }
    findNode = nodes.find(node => isCut && node.depth == 0 || !node.data.path || node.data.isRoot);
    if (findNode) {
      Wb.tipWarn((isCut ? Str.cannotCut : Str.cannotCopy).format(findNode.data.text));
      return;
    }
    this.fileClipboard = { isCut, files: this.getSelFiles() };
  }
  /**
   * Paste files from the clipboard.
   * @param {Boolean} append True to append files to the current node.
   */
  pasteFiles(append) {
    let me = this, cb = me.fileClipboard, fileTree = me.fileTree, node = fileTree.selection,
      folderNode, relName, path, isLeaf, appendMode;
    if (!cb)
      return;
    if (!node) {
      Wb.tipWarn(Str.selectFileFolder);
      return;
    }
    isLeaf = node.leaf;
    appendMode = !isLeaf && append || node.data.isRoot || node.depth == 0;
    if (appendMode) {
      folderNode = node;
    } else {
      folderNode = node.parent;
      relName = node.nextSibling?.text;
    }
    path = folderNode?.data.path;
    if (!path) {
      Wb.tipWarn(Str.selectFileFolder);
      return;
    }
    if (cb.files.some(item => path.startsWith(item))) {
      Wb.tipWarn(Str.cannotCopyFolderToChild);
      return;
    }
    Wb.ajax({
      url: 'm?xwl=sys/file/paste-files&mode=ide',
      json: true,
      params: { source: cb.files, isCut: cb.isCut, dest: path, relName },
      success(resp) {
        let newNodes;
        resp = resp.files;
        if (cb.isCut) {
          me.fileClipboard = null;
          Wb.destroy(fileTree.downAllBy(node => cb.files.includes(node.data.path)));
          me.changePath(cb.files, path);
        }
        if (folderNode.loaded) {
          folderNode.expand();
          if (appendMode) {
            newNodes = folderNode.addData(resp);
          } else {
            newNodes = folderNode.insertDataBefore(resp, node.nextSibling);
          }
          fileTree.selection = newNodes;
        } else {
          newNodes = resp.pluck('text');
          folderNode.expand(f => {
            fileTree.selection = folderNode.filter(node => newNodes.includes(node.text));
          });
        }
      }
    });
  }
  /**
   * Do open selection files. @priv
   */
  doOpenFile() {
    let files = this.fileTree.selections.filter(node => node.leaf);

    if (!files.length) {
      Wb.tipSelect();
      return;
    }
    files.forEach(file => this.openFile(file.data.path));
  }
  /**
   * Clear all selection components.
   */
  clearCompValues() {
    let xwl = app.activeXwl, oldProps;
    xwl?.compTree.selections.forEach(node => {
      oldProps = node.data.properties;
      xwl.removeBindings(node, true);
      node.data.properties = { cid: oldProps.cid };
      node.data.events = {};
      xwl.reloadProperties();
      node.refresh();
      xwl.designer.notifyReset(node, oldProps);
    });
  }
  /**
   * Link selected node to the tool box. @priv
   */
  linkToControl() {
    let cls = app.activeXwl?.compTree.selection?.data.cls, node = cls && app.controlTree.downItem('cls', cls);
    if (node)
      app.controlTree.selection = node;
  }
  /**
   * Turn to design page.
   */
  toDesignPage() {
    let xwl = this.activeXwl, card = xwl?.activeCard, compNode = card?.compNode, item;

    xwl.designCard.show();
    if (compNode) {
      compNode.select();
      item = xwl.getPropNode(card.propName, card.propType);
      if (item) {
        item.select();
        item.el.intoViewCenter();
      }
    } else {
      xwl.propTree.focus();
    }
  }
  /**
   * Rebuild design page.
   */
  rebuildDesign() {
    this.activeXwl?.designer.rebuild();
  }
  /**
   * Get filename from path.
   * @param {String} path File path.
   * @param {Boolean} [returnParent] True to return parent path if path endswith "/", otherwise return empty string.
   * @return {String} filename.
   */
  getFilename(path, returnParent) {
    if (!path)
      return '';
    let p = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

    if (p == -1)
      return path;
    else {
      let filename = path.substring(p + 1);
      if (returnParent && !filename) {
        p--;
        p = Math.max(path.lastIndexOf('/', p), path.lastIndexOf('\\', p));
        if (p == -1)
          return path;
        else
          return path.substring(p + 1);
      } else
        return filename;
    }
  }
  /**
   * Delete selection files.
   */
  deleteFiles() {
    let me = this, fileTree = me.fileTree, fileTab = me.fileTab,
      nodes = fileTree.selections, files, findNode;

    if (!nodes.length) {
      Wb.tipWarn(Str.selectFileFolder);
      return;
    }
    findNode = nodes.find(node => node.depth == 0 || node.data.isRoot);
    if (findNode) {
      Wb.tipWarn(Str.cannotDelete.format(findNode.data.text));
      return;
    }
    nodes.forEach(node => node.highlight());
    files = me.getSelFiles();
    Wb.confirm(Wb.getActionHint(nodes, 'text'), f => {
      Wb.ajax({
        url: 'm?xwl=sys/file/remove',
        params: { files },
        success() {
          fileTree.delRecords();
          fileTab.each(card => {
            if (files.some(file => (card.path + '/').startsWith(me.folderize(file))))
              card.destroy();
          }, true, true);
        }
      });
    });
  }
  /**
   * Get all selected files path list.
   * @return {Array} File path list.
   */
  getSelFiles() {
    return this.fileTree.topSelections.pluck('data').pluck('path');
  }
  /**
   * Append "/" to the path if it doesn't end with "/".
   * @param {String} path Path string.
   * @return {String} Folder path.
   */
  folderize(path) {
    return path.endsWith('/') ? path : (path + '/');
  }
  /**
   * Get file prompty dialog components. @priv
   * @param {Boolean} inModule Whether in the module.
   * @param {Boolean} isFolder Whether is folder.
   * @param {String} [path] File path, only in set property.
   * @param {Boolean} showTotal Whether to show total information.
   * @return {Array} Component items list.
   */
  getFilePromptItems(inModule, isFolder, path, showTotal) {
    let items, moduleRel, isAdd = !path, isModule = inModule && !isFolder && path?.endsWith('.xwl');

    items = [
      { text: Str.name, cid: 'filename', valueType: 'filename', required: true }
    ];
    if (inModule && isAdd && !isFolder) {
      items[0].events = {
        change(v) {
          let disabled = v.includes('.') && !v.endsWith('.xwl'),
            items = this.upBy(p => p instanceof Wb.Window).getRefer();
          items.title.disabled = disabled;
          items.icon.disabled = disabled;
          items.img?.setDisabled(disabled);
          items.tags?.setDisabled(disabled);
          items.url?.setDisabled(disabled);
          items.hideInMenu?.setDisabled(disabled);
        }
      };
    }
    moduleRel = inModule && (isAdd || isModule || isFolder) && this.configs.modulePath != path;
    if (moduleRel) {
      items.push(
        { text: Str.title, cid: 'title' },
        { text: Str.icon, cname: 'iconSelect', cid: 'icon' },
        { text: Str.img, cname: 'imgSelect', cid: 'img' }
      );
      if (!isFolder && isAdd || isModule) {
        items.push(
          { text: Str.urlShortcut, cid: 'url', valueType: 'path' },
          { text: Str.params, cid: 'tags' }
        );
      };
    }
    if (!isAdd) {
      if (isModule) {
        items.push({
          text: Str.url, cname: 'controlCt', layout: 'row', gap: '.5em',
          defaults: { readonly: true, cname: 'text', selectOnFocus: true }, items: [
            { cid: 'fullUrl', flex: 1 },
            { cid: 'fullWholeUrl', flex: 2 }
          ]
        });
      }
      items.push(
        { text: Str.path, cid: 'path', readonly: true },
        { text: Str.modifiedTime, cid: 'modifiedDate', readonly: true }
      );
      if (!isFolder || showTotal)
        items.push({ text: Str.size, cid: 'size', readonly: true });
    }
    if (showTotal && isFolder)
      items.push({ text: Str.total, cid: 'total', readonly: true });
    if (moduleRel) {
      items.push(
        {
          cname: 'controlCt', bodyCls: 'w-row w-wrap', showEmptyLabel: true,
          items: [
            {
              cname: 'check', cid: 'hideInMenu', label: Str.hideInMenu, margin: '0 2em 0 0',
              visible: isAdd || isModule || isFolder
            }
          ]
        }
      );
    }
    return items;
  }
  /**
   * Show dialog for setting file properties.
   */
  setProperty() {
    let me = this, node = me.fileTree.selection, data, win, path, inModule, isFolder;

    isFolder = !node.leaf;
    data = node.data;
    path = data.path;
    inModule = me.inModule(path);
    Wb.ajax({
      url: 'm?xwl=sys/file/get-property',
      params: { path },
      json: true,
      success(resp) {
        resp.path = path;
        win = Wb.prompt({ icon: 'property', title: Str.property + ' - ' + node.text },
          me.getFilePromptItems(inModule, isFolder, path, me.inApp(path)),
          (values, win) => {
            if (!me.checkValues(win, values))
              return;
            values.path = path;
            Wb.ajax({
              url: 'm?xwl=sys/file/set-property',
              params: values,
              json: true,
              success(resp) {
                let filename = values.filename, lastModified = resp.lastModified, moduleUrl;

                if (!isFolder) {
                  // sync card text, icon, img, tags
                  me.fileTab.each(card => {
                    moduleUrl = card.moduleUrl;
                    if (card.path == path) {
                      if (moduleUrl) {
                        card.title = filename.slice(0, -4);
                        card.moduleParams = Wb.parse(values.tags)?.params;
                      } else {
                        card.title = (card.isModified ? '*' : '') + filename;
                        card.lastModified = lastModified;
                      }
                      if (inModule && path.endsWith('.xwl')) {
                        card.tags = values.tags;
                        if (values.icon)
                          card.icon = values.icon;
                        else if (values.img)
                          card.img = values.img;
                        else card.icon = 'module';
                      }
                    }
                  });
                }
                if (data.text != filename)
                  me.renameNode(node, filename);
                Wb.applyValueWith(node.data, values, ['title', 'icon', 'img', 'tags', 'hideInMenu', 'url']);
                node.refresh();
                win.close();
              }
            });
          });
        if (resp.fullUrl)
          resp.fullWholeUrl = location.origin + location.pathname.beforeItem('/') + '/' + resp.fullUrl;
        Wb.setValue(win, resp);
        let refer = win.getRefer();
        refer.modifiedDate.value = resp.modifiedTime.dateValue.dateTimeText;
        if (refer.size)
          refer.size.value = resp.sizeBt.kb + ' (' + resp.sizeBt.intText + ' B)';
        if (refer.total)
          refer.total.value = Str.fileTotalInfo.format(resp.fileCt.intText,
            resp.folderCt.intText, resp.moduleCt.intText);
        refer.filename.select(0, resp.filename.lastIndexOf('.'));
        if (node == me.appNode || node == me.moduleNode || !refer.filename.value)
          refer.filename.readonly = true;
      }
    });
  }
  /**
   * Show dialog to add a new file to the current node.
   */
  addFile() {
    this.doAddFile();
  }
  /**
   * Show dialog to add a new folder to the current node.
   */
  addFolder() {
    this.doAddFile(true);
  }
  /**
   * Verify all values in the window. @priv
   * @param {Wb.Window} win The window.
   * @param {Object} values The values to verify.
   * @return {Boolean} Return true is valid, false otherwise
   */
  checkValues(win, values) {
    if (values.tags) {
      try {
        if (!Wb.isObject(Wb.parse(values.tags)))
          throw 'error';
      } catch (e) {
        Wb.tipError(Str.invalidValue.format(values.tags));
        win.down('tags').focus();
        return false;
      }
    }
    return true;
  }
  /**
   * Show dialog for creating a new file/folder in the current node. @priv
   * @param {Boolean} [isFolder] Whether to create a folder.
   */
  doAddFile(isFolder) {
    let title, icon, nodePath, relName, inModule, leaf, insertBefore, win,
      parentNode, me = this, node = me.fileTree.selection;

    leaf = node.leaf;
    parentNode = node.parent;
    nodePath = node.data.path;
    inModule = me.inModule(nodePath);
    if (isFolder) {
      title = Str.addFolder;
      icon = 'folder1';
    } else {
      title = Str.addFile;
      icon = 'file-fill';
    }
    title += ' - ' + (leaf ? parentNode : node).data.text;
    win = Wb.prompt({ icon, title }, me.getFilePromptItems(inModule, isFolder),
      (values, win) => {
        let path, filename = values.filename;
        if (!me.checkValues(win, values))
          return;
        if (!isFolder && inModule && !filename.includes('.') && !filename.endsWith('.xwl')) {
          filename += '.xwl';
          values.filename = filename;
        }
        values.isFolder = isFolder;
        insertBefore = values.insertBefore;
        if (insertBefore || leaf)
          path = parentNode.data.path;
        else
          path = nodePath;
        values.path = path;
        if (inModule) {
          if (insertBefore)
            relName = node.text;
          else if (leaf)
            relName = node.nextSibling?.text;
          values.relName = relName;
        }
        Wb.ajax({
          url: 'm?xwl=sys/file/add',
          params: values,
          success() {
            let newNode, fileOpened;

            path = path + filename;
            newNode = Wb.applyValueWith({ path, text: values.filename },
              values, ['title', 'icon', 'img', 'tags', 'hideInMenu']);
            if (isFolder) {
              newNode.path += '/';
              newNode.items = [];
            } else {
              newNode._leaf = true;
            }
            if (insertBefore) {
              parentNode.insertDataBefore(newNode, node).select();
            } else if (leaf) {
              parentNode.insertDataAfter(newNode, node).select();
            } else {
              if (!leaf)
                parentNode = node;
              if (parentNode.loaded) {
                parentNode.expand();
                parentNode.addData(newNode).select();
              } else {
                me.selectPath(parentNode.data.path + filename, f => !isFolder && me.openFile(path));
                fileOpened = true;
              }
            }
            win.close();
            if (!isFolder && !fileOpened)
              me.openFile(path);
          }
        });
      });
    if (win.down('hideInMenu')) {
      win.buttonsBar.insert(0, [{
        text: Str.insert, handler() {
          let values = Wb.getValue(win);
          values.insertBefore = true;
          win.handler?.call(win, values, win);
        }
      }, '->']);
    }
  }
  /**
   * Show log data to the console
   * @param {Object} data Log data.
   */
  logHandler(data) {
    let value = data.data;
    switch (data.style) {
      case 0:
        console.info(value);
        break;
      case 1:
        console.warn(value);
        break;
      case 2:
        if (Wb.isString(value))
          value = value.replaceAll('https://WebBuilder/', location.origin + Wb.path + '/view-source?file=');
        console.error(value);
        break;
      case 3:
        console.log(value);
        break;
      case 4:
        console.table(value);
        break;
      default:
        console.debug(value);
    }
  }
  /**
   * Add debug handler from debugging data. @priv
   * @param {Object} data Debugging data.
   */
  addDebugHandler(data) {
    let me = this, debugGrid = me.debugGrid, rec;

    if (!debugGrid.findItem('file', data.file))
      debugGrid.addData(data).select();
    rec = me.moduleNode.downItem('path', me.getFullPath(data.file));
    if (rec)
      rec.set('debug', true);
    me.debugTab.show();
    me.setDebugActions();
  }
  /**
   * Remove debug handler from debugging data. @priv
   * @param {Object} data Debugging data.
   */
  removeDebugHandler(data) {
    let rec, me = this, debugGrid = me.debugGrid;
    rec = debugGrid.findItem('file', data.file);
    if (rec) {
      if (rec.selected)
        debugGrid.candidateSelection?.select();
      rec.destroy();
    }
    rec = me.moduleNode.downItem('path', me.getFullPath(data.file));
    if (rec)
      rec.set('debug', false);
    me.setDebugActions();
  }
  /**
   * Set debug handler from debugging data. @priv
   * @param {Object} data Debugging data.
   */
  setDebugHandler(data) {
    let me = this, debugGrid = me.debugGrid, rec = debugGrid.findItem('file', data.file),
      toggleBtn = me.toggleModalBtn, status = data.status;
    if (rec) {
      rec.select();
      rec.update(data);
      if (status == 2)
        me.debugTab.show();
    }
    me.setDebugActions();
    if (status == 2) {
      if (!toggleBtn.active && BodyEl.maskComp)
        toggleBtn.active = true;
    } else if (status == 1) {
      if (toggleBtn.active)
        toggleBtn.active = false;
    }
  }
  /**
    * Set debug status handler from debugging data. @priv
    * @param {Object} data Debugging data.
    */
  setDebugStatusHandler(data) {
    let rec = this.debugGrid.findItem('file', data.file);
    if (rec) {
      rec.update(data);
    }
    this.setDebugActions();
  }
  /**
    * Update progress handler from debugging data. @priv
    * @param {Object} data Debugging data.
    */
  notifyProgressHandler(data) {
    if (data.client == Wb.clientId) {
      if (data.failed)
        this.taskFailed = true;
      if (data.text === true)
        Wb.unmask();
      else
        Wb.progress(data.text, { delay: 0 });
    }
  }
  /**
   * Search key word in the context.
   */
  searchKey() {
    let btn = this, me = btn.ide;

    Wb.prompt({ icon: 'search', title: btn.text },
      { text: Str.search, cname: 'select', cid: 'search', required: true },
      (values, win) => {
        me.searchGrid.load({
          params: { xaction: btn.type },
          comps: win,
          success() {
            win.down('search').saveInput();
            win.close();
            me.viewTab.show();
            me.searchTab.show();
          }
        });
      },
      'wb.ide.' + btn.text);
  }
  /**
   * Execute search and replace operation.
   * @param {Boolean} replace True to execute replace, false to execute search.
   * @param {String} [title] Window title.
   * @param {String} [searchValue] Default search value.
   */
  searchReplace(replace, title, searchValue) {
    let me = this, win;

    win = Wb.prompt({ icon: 'search-file', title, width: '55em' },
      [{ text: Str.search, cname: 'select', cid: 'search', required: true },
      { text: Str.replaceTo, cname: 'select', cid: 'replaceTo' },
      {
        text: Str.fileType, cname: 'select', cid: 'fileType', required: true, valueIndex: 1,
        data: ['*', '*.xwl, *.js, *.mjs, *.css, *.html, *.htm', '*.xwl', '*.js', '*.mjs', '*.css', '*.html, *.htm']
      },
      {
        text: Str.path, cname: 'radioGroup', cid: 'pathType', columns: 4, items: [
          { label: Str.app, value: true }, { label: Str.module }, { label: Str.selected }, { label: Str.current }]
      },
      {
        text: Str.options, cname: 'checkGroup', cid: 'options', columns: 3, items: [
          { label: Str.caseSensitive, cid: 'caseSensitive' },
          { label: Str.regularExpress, cid: 'regularExpress' },
          { label: Str.wholeWord, cid: 'wholeWord' },
          { label: Str.includeLibs, cid: 'includeLibs' }
        ]
      }],
      (values, win) => {
        let path, ajaxConfigs;

        switch (values.pathType) {
          case 0:
            path = me.configs.path;
            break;
          case 1:
            path = me.configs.modulePath;
            break;
          case 2:
            path = me.selFiles;
            if (!path.length) {
              Wb.tipWarn(Str.selectFileFolder);
              return;
            }
            break;
          case 3:
            path = me.activeCard?.path;
            if (!path) {
              Wb.tipWarn(Str.noOpenFile);
              return;
            }
            break;
        }
        path = Wb.toArray(path);
        ajaxConfigs = {
          params: { path },
          comps: win,
          success() {
            win.down('search').saveInput();
            win.down('fileType').saveInput();
            win.down('replaceTo')?.saveInput();
            win.close();
            if (replace)
              Wb.tipDone(Str.replace);
            else {
              me.viewTab.show();
              me.searchTab.show();
            }
          }
        };
        if (replace) {
          ajaxConfigs.url = 'm?xwl=dev/ide/replace';
          Wb.confirm(Str.replaceConfirm, f => Wb.ajax(ajaxConfigs));
        } else {
          ajaxConfigs.params.xaction = 'searchText';
          me.searchGrid.load(ajaxConfigs);
        }
      }, 'wb.ide.search');
    win.down('replaceTo').visible = replace;
    searchValue ??= me.mainEditor?.selectedText;
    if (searchValue) {
      let comp = win.down('search');
      comp.value = searchValue;
      comp.select();
    }
  }
  /**
   * Run the current file.
   */
  run() {
    this.doRun();
  }
  /**
   * Run the current file in new window.
   */
  runNew() {
    this.doRun(true);
  }
  /**
   * Do run file.
   * @param {Boolean} [newWin] Whether to run in new window.
   */
  doRun(newWin) {
    let card = this.activeCard;

    if (card) {
      let path = card.path;

      if (path) {
        let url = card.moduleUrl, params, tags;

        params = tags = card.tags;
        if (params && Wb.isString(params))
          params = Wb.parse(params);
        params ||= {};
        if (newWin != null)
          params.newWin = newWin;
        if (url)
          this.runFile(path, params, tags);
        else
          this.saveFile(false, f => this.runFile(path, params, tags));
      }
    }
  }
  /**
   * Run a module file.
   * @param {String} path Module relative path.
   * @param {Object} [params] Run params.
   */
  runModule(path, params) {
    this.runFile(this.configs.modulePath + path + '.xwl', params);
  }
  /**
   * Run a file.
   * @param {String} path File path
   * @param {Object} [params]  Run params.
   * @param {String} [tags] Extra options.
   */
  runFile(path, params, tags) {
    let url = this.getUrlPath(path, true);

    if (url) {
      if (params?.newWin || !this.isModule(path))
        Wb.openWin(Wb.apply({ url }, params));
      else {
        let card, config, me = this;
        card = this.findCard(path);
        config = {
          title: Wb.getNormalName(path),
          tip(btn) {
            return me.getRelativePath(btn.card.path);
          }
        };
        if (card) {
          Wb.apply(config, { icon: card.icon, img: card.img });
        }
        if (params)
          Wb.apply(config, params);
        config = Wb.apply({ url, tags: { path, tags }, tabMode: 'reload' }, config);
        if (config.frame)
          Wb.browse(config);
        else
          Wb.openNormal(config);
      }
    }
  }
  /** @property {Wb.TreeItem[]} - Get all selected module file nodes. */
  get selModules() {
    let path;
    return this.fileTree.selections.filter(file => {
      path = file.data.path;
      return this.inModule(path) && this.isModule(path);
    });
  }
  /** @property {String[]} - Get all selected file paths list. */
  get selFiles() {
    return this.fileTree.selectionsData?.pluck('path') ?? [];
  }
  /**
   * Toggle debug status of the selected modules.
   */
  toggleDebug() {
    let nodes = this.selModules, files, types;

    files = [];
    types = [];
    nodes.forEach(node => {
      files.push(this.getRelativePath(node.data.path));
      types.push(node.data.debug ? 'remove' : 'add');
    });
    Wb.ajax({
      url: 'm?xwl=dev/ide/set-debug',
      params: { files, types }
    });
  }
  /**
   * Set status of the selected debug files. @priv
   * @param {String} type Operation type:
   * -'remove': Remove
   * -'disable': Disable
   * -'enable': Enable
   */
  setDebugStatus(type) {
    let files = this.debugGrid.selectionsData?.pluck('file');
    Wb.ajax({
      url: 'm?xwl=dev/ide/set-debug',
      params: { files, type }
    });
  }
  /**
   * Remove debug status of the selected files. @priv
   */
  removeDebug() {
    this.setDebugStatus('remove');
  }
  /**
   * Reload server system.
   */
  reloadSystem() {
    Wb.ajax({
      url: 'm?xwl=dev/ide/reload-system',
      success() {
        Wb.tipDone(Str.reloadSystem);
      }
    });
  }
  /**
   * Get relative path from the specified file/folder.
   * @param {String} path Full path.
   * @return {String} Relative path.
   */
  getRelativePath(path) {
    let me = this;
    if (me.inModule(path))
      return path.substr(me.configs.modulePathLen);
    else if (me.inApp(path))
      return path.substr(me.configs.pathLen);
    else
      return path;
  }
  /**
   * Get url of the specified running file.
   * @param {String} path File full path.
   * @param {Boolean} [returnEmpty] true to returns empty string if outside app folder.
   * @param {Boolean} [xwlPath] false returns URL, true returns path.
   * @param {String} [currentPath] Current path of the edited file.
   * @param {Boolean} [inSub] Whether the file in same name sub folder.
   * @param {Boolean} [useRelative] Whether use ralative path.
   * @return {String} URL path or empty string.
   */
  getUrlPath(path, returnEmpty, xwlPath, currentPath, inSub, useRelative) {
    let me = this, url;

    if (!path)
      return path;
    if (useRelative && currentPath && path.startsWith(currentPath))
      url = (app.configs.modulePath == currentPath && path.endsWith('.xwl') ? '' : './') + path.slice(currentPath.length);
    if (me.inModule(path) && me.isModule(path)) {
      url ??= path.substr(me.configs.modulePathLen);
      if (xwlPath) {
        return url;
      } else {
        if (useRelative && url.startsWith('./')) {
          if (inSub)
            return "xpath + '" + url.slice(url.indexOf('/', 2), -4) + "'";
          else
            return "xpath + '/." + url.slice(0, -4) + "'";
        } else {
          return Wb.getModuleUrl(url);
        }
      }
    } else if (me.inApp(path))
      return url ?? path.substr(me.configs.pathLen);
    else
      return returnEmpty ? '' : (url ?? path);
  }
  /**
   * Get module full path from it's relative path.
   * @param {String} [relPath] Module file relative path.
   * @return {String} Full path.
   */
  getFullPath(relPath) {
    return this.configs.modulePath + relPath;
  }
  /**
   * Update editor cursor position to the label.
   * @param {Object} cursor Cursor position object.
   */
  updateCursor(cursor) {
    this.cursorLabel.text = cursor ? (cursor.lineNumber + ' : ' + cursor.column) : Wb.nbsp;
  }
  /**
   * Create a new XWL editor from the content.
   * @param {String} content Xwl content.
   * @return {Wb.ide.XwlEditor} New XWL editor.
   */
  getXwlEditor(content) {
    let me = this, editor;
    editor = new Wb.ide.XwlEditor({
      value: content,
      ide: me,
      events: {
        change() {
          if (this.parent) {
            me.setModified(this.parent);
          }
        },
        cursorchange(cursor) {
          me.updateCursor(cursor);
          if (this.el.isConnected)
            me.recordActivity();
        },
        focuseditor(editor) {
          me.updateCursor(editor.cursor);
        },
        cardchange() {
          if (!this.mainEditor)
            me.updateCursor();
          me.recordActivity();
          me.setActions();
          me.refreshToolCard();
        }
      }
    });
    return editor;
  }
  /**
   * Create a new code editor.
   * @param {String} content Edited script.
   * @param {String} language Code language.
   * @param {Boolean} ss Whether is server script.
   * @return {Wb.CodeEditor} New created code editor.
   */
  getCodeEditor(content, language, serverScript) {
    let me = this;
    return new Wb.CodeEditor({
      language,
      wrapBorder: 0,
      value: content,
      belongTo: 'edit',
      canValidate: true,
      serverScript,
      autoComplete: true,
      events: {
        change() {
          if (this.parent)
            me.setModified(this.parent);
        },
        cursorchange(cursor) {
          me.updateCursor(cursor);
          if (this.el.isConnected)
            me.recordActivity();
        },
        focus() {
          me.updateCursor(this.cursor);
        },
        destroy() {
          me.removeMarkers(this);
        }
      }
    });
  }
  /**
   * Find card by file path.
   * @param {String} path File path.
   * @return {Wb.Card} The found card or null if not found.
   */
  findCard(path) {
    return this.fileTab.findBy(card => !card.moduleUrl && card.path == path);
  }
  /**
   * Select file node by file path.
   * @param {String} path File path.
   * @param {Function} callback Callback function.
   */
  selectPath(path, callback) {
    let me = this, inModule;

    path = path.replaceAll('\\', '/');
    inModule = me.inModule(path);
    if (inModule || me.inApp(path)) {
      path = me[inModule ? 'moduleNode' : 'appNode'].text + '\n' +
        me.getRelativePath(path).replaceAll('/', '\n');
    } else {
      path = me.systemNode.text + '\n' + path.firstItem('/') + '/' + '\n' +
        path.afterItem('/').replaceAll('/', '\n');
    }
    me.fileTree.selectPath(path, callback, null, '\n');
  }
  /**
   * Open the specified file.
   * @param {String} path File full path.
   * @param {Function} [callback] The function to execute after success.
   * @param {Wb.Card} callback.card File card.
   * @param {String} [charset] File content string charset, defaults to UTF-8.
   */
  openFile(path, callback, charset) {
    let me = this, tab = me.fileTab, card;

    card = this.findCard(path);
    if (card) {
      card.show();
      me.focusCard(card);
      callback?.call(me, card);
    } else {
      if (!charset) {
        if (path.startsWith(me.configs.path))
          charset = 'UTF-8';
        else {
          charset = me.configs.fileCharset;
        }
      }
      Wb.ajax({
        url: 'm?xwl=sys/file/open', params: { path, charset, yaml: 1 }, success(resp) {
          if (Wb.isImageFile(path)) {
            Wb.open({
              url: 'image-viewer', title: Wb.getFilename(path), tip: me.getRelativePath(path),
              params: { path, notLoad: 1 }, success(scope) {
                scope.src = 'data:image/' + Wb.getFileExt(path) + ';base64,' + resp;
              }
            });
            app.fileTab.activeCard.path = path;
            return;
          }
          let editor, language, divPos, lastModified, content, icon, img, tags, fileExt, configs;

          divPos = resp.indexOf('|');
          lastModified = resp.substr(0, divPos);
          content = resp.substr(divPos + 1);
          fileExt = Wb.getFileExt(path);
          if (fileExt == 'xwl') {
            try {
              content = Wb.decode(content);
            } catch (e) {
              Wb.error(Str.invalidValue.format(Wb.getFilename(path)));
              return;
            }
            icon = content.icon;
            img = content.img;
            tags = content.tags;
            editor = me.getXwlEditor(content);
          } else {
            language = fileExt;
            editor = me.getCodeEditor(content, language, path.startsWith(me.configs.path + 'wb/ss') ||
              path.startsWith(me.configs.modulePath) && !path.includes('$'));
          }
          configs = {
            path,
            lastModified,
            charset,
            fileExt,
            tags,
            icon: Wb.getFileIcon(path),
            title: Wb.getFilename(path),
            tabTip() {
              return me.getRelativePath(card.path);
            },
            cid: Wb.getId(),
            isFileCard: true,
            layout: 'fit',
            items: editor,
            events: {
              beforeclose() {
                return this.confirmClose(me.saveCard, me);
              }
            }
          };
          if (me.inModule(path)) {
            if (icon)
              configs.icon = icon;
            else if (img) {
              delete configs.icon;
              configs.img = img;
            }
          }
          card = tab.add(configs);
          if (editor instanceof Wb.CodeEditor)
            card.mainEditor = editor;
          card.show();
          callback?.call(me, card);
        }
      });
    }
  }
  /**
   * Create docs from all XWL & js files in app folder.
   */
  createDocs() {
    Wb.ajax({
      url: 'm?xwl=dev/ide/create-docs',
      success() {
        Wb.tipDone(Str.createDocs);
      }
    });
  }
  /**
   * Open the docs page.
   */
  openDocs() {
    let xwl = this.activeXwl;
    if (xwl) {
      let propTree = xwl.activePropTree, compTree = xwl.compTree, designer = xwl.activeDesigner, hash;
      if (propTree) {
        let data = propTree.selection?.data;
        if (data)
          hash = propTree.compNodes[0].data.cls + '.' + (data.type == 'events' ? '*' : '') + data.text;
      } else if (designer) {
        hash = designer.selNodes?.[0].data.cls;
      } else if (compTree.activated) {
        hash = compTree.selection?.data.cls;
      }
      if (hash) {
        this.afterInit =
          Wb.openNormal({
            url: 'm?xwl=dev/docs', success(scope) {
              if (scope.docInited)
                scope.app.openDoc(hash, true);
              else
                scope.afterInit = f => scope.app.openDoc(hash, true);
            }
          });
        return;
      }
    }
    Wb.openNormal('m?xwl=dev/docs');
  }
  /**
   * Open UI designer. @priv
   */
  openDesign() {
    this.activeXwl?.designSelNode();
  }
  /**
   * Recreate wb css files.
   */
  createTheme() {
    Wb.ajax({
      url: 'm?xwl=dev/ide/create-wb-css',
      params: {},
      success() {
        Wb.tipDone(Str.createTheme);
      }
    });
  }
  /**
   * Create release version files.
   */
  createRelease() {
    let me = this;
    Wb.prompt({ title: Str.createRelease, icon: 'compile' },
      [
        // { label: Str.createTrialVersion, cid: 'createTrialVersion', cname: 'check', value: true },
        { label: Str.createNormalVersion, cid: 'createNormalVersion', cname: 'check', value: true },
        { label: Str.createDemoVersion, cid: 'createDemoVersion', cname: 'check', value: true },
        { label: Str.createOfficialVersion, cid: 'createOfficialVersion', cname: 'check', value: true },
        // { label: Str.allTrialVersion, cid: 'allTrialVersion', cname: 'check', value: true },
        { label: Str.allNormalVersion, cid: 'allNormalVersion', cname: 'check', value: true },
        // { label: Str.source, cid: 'source', cname: 'check' },
        { text: Str.path, cid: 'path', value: me.configs.releasePath, labelAlign: 'left', labelWidth: -1 }
      ],
      (values, win) => {
        me.configs.releasePath = values.path;
        win.close();
        values.client = Wb.clientId;
        me.taskFailed = false;
        Wb.mask({ width: '50vw', delay: 0 });
        Wb.ajax({
          url: 'm?xwl=dev/ide/create-release',
          params: values,
          mask: false,
          callback() {
            Wb.unmask();
          },
          success() {
            if (me.taskFailed)
              Wb.error(Str.createRelease + ': ' + Str.someFailed);
            else
              Wb.tipDone(Str.createRelease);
          }
        });
      });
  }
  /**
   * Compress JS/CSS script files in the app folder.
   */
  compressScript() {
    let me = this;
    Wb.prompt({ title: Str.compressScript, icon: 'compress', width: '25em' },
      [{ label: Str.forceCompress, cid: 'rebuild', cname: 'check' }],
      (values, win) => {
        win.close();
        values.client = Wb.clientId;
        me.taskFailed = false;
        Wb.mask({ width: '50vw', delay: 0 });
        Wb.ajax({
          url: 'm?xwl=dev/ide/compress',
          params: values,
          mask: false,
          callback() {
            Wb.unmask();
          },
          success() {
            if (me.taskFailed)
              Wb.error(Str.compressScript + ': ' + Str.someFailed);
            else
              Wb.tipDone(Str.compressScript);
          }
        });
      });
  }
  /**
   * Save current edited file.
   */
  save() {
    this.saveFile();
  }
  /**
   * Save all edited files.
   */
  saveAll() {
    this.saveFile(true);
  }
  /**
   * Change the specified file card path.
   * @param {String[]} files File path list.
   * @param {String} path Dest path.
   */
  changePath(files, path) {
    app.fileTab.each(card => {
      files.each(file => {
        if ((card.path + '/').startsWith(app.folderize(file))) {
          card.path = path + app.getFilename(file, true) + card.path.substr(file.length);
          if (card.moduleUrl)
            card.moduleUrl = app.getUrlPath(card.path, true);
          return false;
        }
      });
    });
  }
  /**
   * Rename file node.
   * @param {Wb.TreeItem} node File node.
   * @param {String} newFileName New file name
   * @param {String} [lastModified] Last modified date.
   */
  renameNode(node, newFileName, lastModified) {
    let path = node.data.path, len = path.length, folder, cardFolder,
      newPath = path.slice(0, -1).beforeItem('/') + '/' + newFileName;

    if (!node.leaf)
      newPath += '/';
    node.proxy.text = newFileName;
    node.cascadeSelf(sub => {
      sub.data.path = newPath + sub.data.path.substr(len);
    });
    // sync card path
    folder = path.endsWith('/') ? path : (path + '/');
    this.fileTab.each(card => {
      if (lastModified && card.path == path)
        card.lastModified = lastModified;
      cardFolder = card.path + '/';
      if (cardFolder.startsWith(folder)) {
        card.path = newPath + card.path.substr(len);
        if (card.moduleUrl)
          card.moduleUrl = app.getUrlPath(card.path, true);
        if (cardFolder == folder) {
          if (card.moduleUrl)
            card.title = Wb.getNormalName(card.path);
          else {
            card.title = (card.isModified ? '*' : '') + Wb.getFilename(card.path);
            if (node.icon)
              card.icon = node.icon;
            else if (node.img)
              card.img = node.img;
          }
        }
      }
    });
  }
  /**
   * Execute rename operation.
   * @param {Event} e Event object.
   */
  rename(e) {
    if (document.activeElement.isInput)
      return;
    app.renameFile();
    e.stopEvent();
  }
  /**
   * Rename current selected file.
   */
  renameFile() {
    let me = this, fileTree = me.fileTree, node = fileTree.selection, text = node.data.text;

    fileTree.startEdit(node, 'text', (value, row) => {
      if (node.text != value) {
        Wb.ajax({
          url: 'm?xwl=sys/file/set-property',
          json: true,
          params: { rename: true, path: node.data.path, filename: value },
          success(resp) {
            me.renameNode(node, value, resp.lastModified);
          }
        });
      }
      return false;
    });
    Wb.Editor.activeEditor.select(0, text.lastIndexOf('.'));
  }
  /**
   * Do card navigation.
   */
  cardNavigate() {
    let btn = this, me = btn.ide, card = me.fileTab.activeCard, subCard = card?.firstItem.activeCard, next;
    switch (btn.cid) {
      case 'mainCardForward':
        next = true;
        break;
      case 'subCardBack':
        card = subCard;
        break;
      case 'subCardForward':
        card = subCard;
        next = true;
        break;
    }
    card = card.travelSibling(next, true);
    if (card) {
      card.show();
      card.tabButton.focus();
    }
  }
  /**
   * Save file from it's opened card.
   * @param {Wb.Card} [card] The card to save, defaults to the current card.
   * @param {Function} [callback] The function to execute after success.
   */
  saveCard(card, callback) {
    this.saveFile(false, callback, null, card);
  }
  /**
   * Save file handler.
   * @param {Boolean} [isAll] True to save all files.
   * @param {Function} [callback] The callback function.
   * @param {Boolean} [noConfirm] Whether to show confirm dialog if the file is modified.
   * @param {Wb.Card} [card] File card to save, defaults to the current card.
   */
  saveFile(isAll, callback, noConfirm, card) {
    let data = '', cards = [], content, path, editor, me = this, activeCard = card ?? me.activeCard;
    // format: fileName|charset|lastModified|file size|file content
    me.fileTab.each(card => {
      if (card.isModified && (isAll || card == activeCard)) {
        card.firstItem.completeEdit?.();
        content = card.firstItem.value;
        if (Wb.isObject(content))
          content = Wb.encode(content);
        path = card.path;
        data += path + '|' + card.charset + '|' + card.lastModified + '|' + content.length + '|' + content;
        cards.push(card);
        if (me.isModule(path)) {
          card.firstItem.each(subCard => {
            editor = subCard.mainEditor;
            if (editor)
              me.getMarkers(editor);
          });
        } else {
          me.getMarkers(card.mainEditor);
        }
      }
    });
    if (data) {
      Wb.ajax({
        url: 'm?xwl=sys/file/save', data,
        params: {
          confirm: noConfirm ? 0 : 1
        },
        success(resp) {
          let lastModified = Wb.decode(resp);
          cards.forEach((card, i) => {
            card.lastModified = String(lastModified[i]);
            me.unModified(card);
          });
          callback?.call();
        },
        failure(resp) {
          if (resp.errorCode == 'modified')
            Wb.confirm(Str.modifiedConfirm.format(Wb.decode(resp.errorText).join(', ')),
              f => me.saveFile(isAll, callback, true));
        }
      });
    } else {
      callback?.call();
    }
  }
  /**
   * Monite marker changes of monaco editors. @priv
   */
  monChangeMarkers(uris) {
    let path;
    uris.forEach(uri => {
      path = uri.path;
      let editor = Wb.CodeEditor.findEditor(path);
      if (editor?.canValidate) {
        let card = editor.upBy(parent => parent.isFileCard);
        if (card) {
          if (this.isModule(card)) {
            if (!editor.isModified)
              this.getMarkers(editor);
          } else if (!card.isModified) {
            this.getMarkers(editor);
          }
        }
      }
    });
  }
  /**
   * Get all markers from the code editors. @priv
   * @param {Wb.CodeEditor} editor The code editors.
   */
  getMarkers(editor) {
    if (!editor.canValidate) return;
    const types = { 1: 'hint', 2: 'info', 4: 'warn', 8: 'error' };
    let markers, path, compNode, propName, propType, card, subCard,
      items = [], me = this, markerGrid = me.markerGrid;

    markers = monaco.editor.getModelMarkers({ resource: editor.uri });
    card = editor.upBy(parent => parent.isFileCard);
    path = card.path;
    if (me.isModule(path)) {
      subCard = editor.parent;
      compNode = subCard.compNode;
      propName = subCard.propName;
      propType = subCard.propType;
    }
    markers.each((marker, index) => {
      // limit to 100
      if (index == 100)
        return false;
      items.push({
        desc: marker.message,
        editor,
        path,
        compNode,
        propName,
        propType,
        lineNumber: marker.startLineNumber,
        column: marker.startColumn,
        type: types[marker.severity]
      });
    });
    me.removeMarkers(editor);
    if (items.length) {
      markerGrid.addData(items);
      me.markerTab.tabButton.highlight();
    }
    me.refreshFileFlag(path);
  }
  /**
   * Refresh file card flag. @priv
   * @param {String} path File path.
   */
  refreshFileFlag(path) {
    this.findCard(path)?.tabButton.textEl.setCls(
      this.markerGrid.some(item => item.data.path == path), 'w-error-color');
  }
  /**
   * Remove all marker records in the grid. @priv
   * @param {Wb.CodeEditor} editor The code editor.
   */
  removeMarkers(editor) {
    this.markerGrid.each(item => {
      if (item.data.editor == editor)
        item.destroy();
    }, true, true);
  }
  /**
   * Open file and locate to the specified position.
   * @param {Object} data Locate data object.
   * @param {String} .path File path.
   * @param {Wb.TreeItem/Boolean} [.compNode] The component node, true means the root node.
   * @param {String} [.compPath] The component path.
   * @param {String} [.propName] Property name.
   * @param {String} [.propType] Property type.
   * @param {Number} [.lineNumber] Line number, 1 based.
   * @param {Number} [.column] Column number, 1 based.
   * @param {Function} [callback] The callback function.
   * @param {Boolean} [noEmpty] Whether not allowed empty value.
   */
  locateLine(data, callback, noEmpty) {
    let me = this, path = data.path, editor, xwl;
    me.openFile(path, card => {
      xwl = card.firstItem;
      if (me.isModule(path)) {
        let compNode = data.compNode, compPath = data.compPath;

        if (compNode === true)
          compNode = xwl.compTree.firstItem;
        if (compNode && noEmpty && !compNode.data.properties[data.propName])
          editor = xwl;
        else if (compNode || compPath)
          editor = xwl.editProp(compNode ?? compPath, data.propName, data.propType);
      } else {
        editor = xwl;
      }
      if (editor) {
        if (data.column != null) {
          if (editor instanceof Wb.CodeEditor)
            editor.cursor = data;
          else if (editor instanceof Wb.Text)
            editor.select(data.column - 1);
        }
        editor.focus();
      }
      callback?.(editor);
    });
  }
  /**
   * Reload all controls in the control tree.
   */
  loadControls() {
    let me = this, controlTree = me.controlTree, data = Wb.clone(WbControlsGroup);

    Wb.cascade(data, (node, parent) => {
      if (node.text == 'Ungrouped')
        (parent?.items ?? data).remove(node);
      if (!node.items)
        node.items = [];
      if (node._leaf)
        node._leaf = undefined;
    }, null, true, true);
    controlTree.data = data;
  }
  /**
   * Clear debug status. @priv
   */
  clearDebugStatus() {
    this.debugGrid.each(rec => {
      if (rec.data.status == 2)
        rec.proxy.status = 1;
    });
    this.setDebugActions();
  }
  /**
   * Refresh tool card in the context.
   */
  refreshToolCard() {
    let me = this, card;

    if (me.activeXwl?.homeActivate) {
      card = me.controlTree;
    }
    // do not use visible property to prevent conflict
    me.toolCardSp.setCls(!card, 'w-disp-none');
    me.toolCard.setCls(!card, 'w-disp-none');
    me.toolCard.activeCard = card;
  }
  /**
   * Create a new websocket. @priv
   * @param {Wb.Container} mainCt The main container.
   */
  createWebSocket(mainCt) {
    let me = this;

    me.socket = new Wb.Socket({
      name: '$ide', loginRequired: true, heartbeatInterval: me.configs.heartbeat,
      xwl: "sys/session/service.xwl{xaction:'monWebsocket'}", events: {
        message(e) {
          let data = e.data;
          data = Wb.decode(data);
          me[data.type + 'Handler']?.(data);
        },
        failure() {
          if (!Wb.unloading) {
            me.clearDebugStatus();
            Wb.login(username => {
              me.usernameBtn.text = username;
              if (me.configs.username != username) {
                me.configs.username = username;
                location.reload();
              }
            });
          }
        }
      }
    });
    mainCt.on('destroy', f => me.socket.close());
  }
}