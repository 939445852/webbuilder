/*
 * wb-client.js client javascript library
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * WorkFlow designer.
 */
Cls['Wb.tool.FlowDesigner'] = class flowDesigner extends Wb.Container {
  static cls = 'w-row w-panel';
  /** @property {Object} - The graph ports. @priv */
  static ports = {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden'
            }
          }
        }
      }
    },
    items: [
      {
        group: 'top'
      },
      {
        group: 'right'
      },
      {
        group: 'bottom'
      },
      {
        group: 'left'
      }
    ]
  };
  static protos = {
    /** @property {String} - The hint text for valued property. */
    hintValue: '(value)',
    /** @property {Object} - Flow node properties define map. */
    propsMap: {
      flow: ['afterAction', 'beforeAction', 'description', 'comment', 'onPass', 'onGetParams', 'viewForm', 'handleForm',
        'startForm', 'transfer', 'back', 'reject', 'signBefore', 'signAfter'],
      start: ['name', 'text', 'onGetParams', 'description'],
      end: ['name', 'text', 'description'],
      node: ['afterAction', 'beforeAction', 'name', 'text', 'dept', 'deptCC', 'description', 'onGetParams', , 'viewForm',
        'handleForm', 'onGetUsers', 'onGetUsersCC', 'role', 'roleCC', 'user', 'userCC', 'deptManager', 'deptManagerCC',
        'intersectDeptRole', 'transfer', 'back', 'reject', , 'signBefore', 'signAfter', 'passUserCount'],
      line: ['name', 'text', 'description', 'onPass'],
    },
    /** @property {Objec} - Flow property types map. */
    propsType: {
      onPass: { type: 'jsText', params: ['params', 'flow', 'node'] },
      onGetParams: { type: 'jsText', params: ['params', 'flow', 'node'] },
      onGetUsers: { type: 'jsText', params: ['params', 'flow', 'node'] },
      onGetUsersCC: { type: 'jsText', params: ['params', 'flow', 'node'] },
      name: { type: 'name' },
      beforeAction: { type: 'module' },
      afterAction: { type: 'module' },
      startForm: { type: 'module' },
      viewForm: { type: 'module' },
      handleForm: { type: 'module' },
      comment: { type: 'Text' },
      role: { type: 'roleText' },
      roleCC: { type: 'roleText' },
      user: { type: 'userText' },
      userCC: { type: 'userText' },
      dept: { type: 'deptText' },
      deptCC: { type: 'deptText' },
      deptManager: { type: 'bool' },
      deptManagerCC: { type: 'bool' },
      transfer: { type: 'bool' },
      signBefore: { type: 'bool' },
      signAfter: { type: 'bool' },
      back: { type: 'bool' },
      reject: { type: 'bool' },
      intersectDeptRole: { type: 'bool' },
      passUserCount: { type: 'string' }
    }
  }
  /**
  * Register common graph nodes. @priv
  */
  static registerNodes() {
    let ports = this.ports;
    X6.Graph.registerNode(
      'crect',
      {
        inherit: 'rect',
        width: 100,
        height: 30,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: Wb.configs.fixedBgColor
          },
          text: {
            fill: Wb.configs.mainColor
          }
        },
        ports: { ...ports }
      }, true
    );
    X6.Graph.registerNode(
      'cpolygon',
      {
        inherit: 'polygon',
        width: 100,
        height: 30,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: Wb.configs.fixedBgColor
          },
          text: {
            fill: Wb.configs.mainColor
          },
        },
        ports: { ...ports }
      }, true
    );
  }
  /** @property {Boolean} viewMode Whether is in view mode. */
  /***/
  init(configs) {
    let me = this, ct = me.constructor, items = [], viewMode = me.viewMode;
    if (!ct.inited) {
      ct.inited = true;
      ct.registerNodes();
    }
    super.init(configs);
    me.createEditors();
    me.el.setStyle('font-size', '12px');
    me.mon(Event.tapDownName, e => me.setPorts(false));
    if (!viewMode) {
      items.pushAll([{
        cname: 'grid', width: '26em', cid: 'propGrid', pagingBar: false, editable: true, columns: [
          {
            text: Str.property, width: '10em', fieldName: 'name', editor: false, render(v, data, c, el) {
              el.addCls('w-fixed-cell');
              return v;
            }
          },
          {
            text: Str.value, width: -1, fieldName: 'value'
          }
        ], events: {
          beforeedit(row, col) {
            col.editor = me.editors[me.propsType[row.data.name]?.type || 'string'];
          },
          editing() {
            me.fireEvent('change');
          },
          edit(value, row, col) {
            me.syncValues(row.data.name, value);
          }
        }
      }, { cname: 'splitter' }]);
    }
    items.push({
      cname: 'container', flex: 1, autoScroll: true, cls: 'w-unselect' + (viewMode ? ' w-x6-view' : ''),
      items: { cname: 'component', cid: 'graphComp' }
    });
    if (!viewMode)
      items.push({ cname: 'component', cid: 'stencilComp', width: 120, height: '100%', cls: 'w-rel w-unselect' });
    me.add(items);
    me.graphEl = me.down('graphComp').el;
    me.graphEl.setStyle('caret-color', 'transparent');
    me.initGraph();
    me.graphEl.width = 10000;
    me.graphEl.height = 8000;
    if (!viewMode) {
      me.propGrid = me.down('propGrid');
      me.stencilEl = me.down('stencilComp').el;
      me.createStencil();
      me.initPorts();
      me.fixBox();
    }
  }
  /**
   * Sync the specified value to the property grid bind data. @priv
   * @param {String} name Property name.
   * @param {Object} value Property value.
   */
  syncValues(name, value) {
    let me = this, text;

    me.editData.forEach(data => {
      if (value == null || value === '')
        delete data[name];
      else
        data[name] = value;
    });
    if (name == 'text' || name == 'name') {
      me.editNodes?.forEach(node => {
        if (node.isEdge())
          text = node.data.text;
        else
          text = node.data.text || node.data.name;
        me.setLabel(node, text || '');
      });
    }
  }
  /**
   * Set the specified cell label text. @priv
   * @param {Object} cell Graph cell.
   * @param {String} text Label text.
   */
  setLabel(cell, text) {
    if (cell.isEdge()) {
      cell.prop('labels', [{
        attrs: {
          body: {
            fill: Wb.configs.mainBgColor
          },
          label: {
            fill: Wb.configs.mainColor,
            text
          }
        }
      }]);
    } else {
      cell.attr('label/text', text);
    }
  }
  /** @property {Object} editors Property grid editor map. @priv */
  /**
   * Create property grid editors. @priv
   */
  createEditors() {
    let me = this;
    me.editors = {
      string: new Wb.Text(),
      bool: new Wb.BoolSelect({ returnType: 'string' }),
      Text: new Wb.Trigger({
        editable: false, onTriggerClick() {
          let propGrid = me.propGrid, row = propGrid.editRow, name = row.data.name;
          propGrid.completeEdit();
          Wb.promptText(name, (value, win) => {
            row.set({ value: value ? me.hintValue : '', rawValue: value });
            me.syncValues(name, value);
            me.fireEvent('change');
            win.close();
          }, row.data.rawValue);
        }
      }),
      name: new Wb.Text({
        required: true,
        validator(value) {
          let nodes = me.graph.getCells().diff(me.editNodes);
          if (nodes.some(node => node.data.name == value))
            return Str.alreadyExists.format(value);
        }
      }),
      jsText: new Wb.Trigger({
        editable: false, onTriggerClick() {
          let propGrid = me.propGrid, row = propGrid.editRow, name = row.data.name, params = me.propsType[name]?.params, title = name;

          propGrid.completeEdit();
          if (params)
            title += ' - (' + params.join(', ') + ')';
          Wb.promptJs(title, (value, win) => {
            row.set({ value: value ? me.hintValue : '', rawValue: value });
            me.syncValues(name, value);
            me.fireEvent('change');
            win.close();
          }, row.data.rawValue);
        }
      }),
      deptText: me.createTrigger('dept-selector'),
      userText: me.createTrigger('user-selector'),
      roleText: me.createTrigger('role-selector'),
      module: me.createTrigger('module-selector', true)
    }
  }
  /**
   * Create the specified trigger editor. @priv
   * @param {String} url Editor url.
   * @param {String} [showValue] Whether to show the value.
   * @return {Wb.Trigger} The new trigger.
   */
  createTrigger(editorUrl, showValue) {
    let me = this, configs;

    configs = {
      editable: !!showValue, onTriggerClick() {
        let propGrid = me.propGrid, row = propGrid.editRow, data = row.data, name = data.name;

        propGrid.completeEdit();
        Wb.run({
          url: editorUrl,
          single: true,
          success(scope) {
            scope[editorUrl == 'module-selector' ? 'getValue' : 'getValues']((data, win) => {
              if (Wb.isArray(data))
                data = data.pluck('sid').join(',');
              else if (Wb.isObject(data))
                data = data.sid;
              if (showValue)
                row.set('value', data);
              else
                row.set({ value: data ? me.hintValue : '', rawValue: data });
              me.syncValues(name, data);
              me.fireEvent('change');
              win.close();
            }, showValue ? data.value : data.rawValue?.splitTrim(), name);
          }
        });
      }
    };
    return new Wb.Trigger(configs);
  }
  /**
   * Fix the stencil box. @priv
   */
  fixBox() {
    let me = this, el = me.stencilEl;

    el.query('.x6-widget-stencil-title')?.remove();
    el.query('.x6-widget-stencil-group-title')?.remove();
    el.query('.x6-widget-stencil.collapsable > .x6-widget-stencil-content').y = 0;
    el.setStyle('border-left', '1px solid ' + Wb.configs.borderColor);
  }
  /** @property {Object} - Workflow data. */
  set flowData(value) {
    let me = this, text;

    me.data = value.data ?? {};
    me.graph.fromJSON(value);
    // reset current theme color
    me.suspendChange = true;
    me.graph.getCells().forEach(cell => {
      if (cell.isEdge() && (text = cell.data.text)) {
        cell.prop('labels', [{
          attrs: {
            body: {
              fill: Wb.configs.mainBgColor
            },
            label: {
              fill: Wb.configs.mainColor,
              text
            }
          }
        }]);
      }
    });
    me.suspendChange = false;
    me.doSelect([]);
  }
  /***/
  get flowData() {
    let me = this, data = me.graph.toJSON();
    data.data = me.data;
    return data;
  }
  /**
   * Init workflow graph. @priv
   */
  initGraph() {
    let me = this, graph, viewMode = me.viewMode, configs;

    configs = {
      container: me.graphEl,
      grid: !viewMode,
      translating: { restrict: { x: 0, y: 0, width: 10000, height: 8000 } },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8
          }
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: {
          radius: 20
        },
        createEdge() {
          return new X6.Shape.Edge({
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8
                }
              }
            },
            data: { nodeType: 'line' },
            zIndex: 0
          })
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet;
        }
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#5F95FF',
              stroke: '#5F95FF'
            }
          }
        }
      }
    };
    if (viewMode)
      configs.interacting = f => false;
    graph = me.graph = new X6.Graph(configs);
    if (!viewMode) {
      graph.use(new X6Plugin.Transform({ resizing: true })).use(new X6Plugin.Snapline()).use(new X6Plugin.History())
        .use(new X6Plugin.Selection({
          rubberband: !viewMode, showNodeSelectionBox: true, showEdgeSelectionBox: true, pointerEvents: 'none',
        }));
      graph.on('selection:changed', ({ selected }) => {
        me.doSelect(selected);
      });
      graph.on('cell:changed', f => {
        if (!me.suspendChange)
          me.fireEvent('change');
      });
      graph.on('cell:removed', f => {
        me.fireEvent('change');
      });
      graph.on('cell:contextmenu', ({ cell }) => {
        if (!graph.isSelected(cell))
          graph.resetSelection(cell);
      });
    }
  }
  /**
   * Select the specified node. @priv
   * @param {Array} selected Selected node. Empty array means select the flow.
   */
  doSelect(selected) {
    let me = this, len = selected.length, flowSelected = !len, propGrid = me.propGrid;

    if (flowSelected && me.flowSelected || !propGrid)
      return;
    let data = {}, items = [], nodesData = [], nodeTypes = [], allNames, props,
      propsMap = me.propsMap, itemData, cfg, hintValue = me.hintValue;
    if (flowSelected) {
      nodesData.push(me.data);
      nodeTypes.push('flow');
      me.editNodes = null;
    } else {
      selected.forEach(item => {
        itemData = item.data;
        nodesData.push(itemData);
        nodeTypes.push(itemData.nodeType);
      });
      me.editNodes = selected;
    }
    me.flowSelected = flowSelected;
    nodeTypes.forEach(type => {
      props = propsMap[type];
      if (allNames)
        allNames = allNames.intersect(props);
      else
        allNames = props;
    });
    if (len > 1)
      allNames.remove('name');
    nodesData.forEach(nodeData => {
      Wb.applyValue(data, nodeData);
    });
    allNames.forEach(name => {
      if (!(name in data))
        data[name] = null;
    });
    Wb.each(data, (name, value) => {
      if (allNames.includes(name)) {
        cfg = { name };
        if (value) {
          cfg.value = me.propsType[name]?.type.endsWith('Text') ? hintValue : value;
          cfg.rawValue = value;
        }
        items.push(cfg);
      }
    });
    items.lowerSort('name');
    me.editData = nodesData;
    propGrid.data = items;
  }
  /**
   * Set graph ports visibility. @priv
   * @param {Boolean} show  Whether to show or hide the ports.
   */
  setPorts(show) {
    let ports, len;

    ports = this.graphEl.queryAll('.x6-port-body');
    len = ports.length;
    for (let i = 0; i < len; i += 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden';
    }
  }
  /**
   * Init graph ports. @priv
   */
  initPorts() {
    let me = this;
    me.graph.on('node:mouseenter', f => {
      me.setPorts(true);
    })
    me.graph.on('node:mouseleave', f => {
      me.setPorts(false);
    });
  }
  /**
   * Create stencil box. @priv
   */
  createStencil() {
    let me = this, graph = me.graph, stencil, nodeList = [];

    stencil = me.stencil = new X6Plugin.Stencil({
      title: Str.toolbox,
      target: graph,
      stencilGraphWidth: 100,
      stencilGraphHeight: 0,
      collapsable: true,
      validateNode(node, options) {
        let gel = me.graphEl, gr = gel.getRect(), box = node.getBBox(), x = gr.x + box.x + 20, y = gr.y + box.y;

        if (!Wb.Math.intersect({ x, y, right: x + box.width, bottom: y + box.height }, gel.parentNode.getRect())) {
          return false;
        }
      },
      groups: [
        {
          title: 'Basic Flow',
          name: 'group1'
        }
      ],
      layoutOptions: {
        columns: 1,
        columnWidth: 100,
        rowHeight: 50
      }
    })
    graph.on('cell:added', ({ cell }) => {
      let cells = graph.getCells(), i = 1, name, data = cell.data, rawName = data.name || data.nodeType;

      me.fireEvent('change');
      cells.remove(cell);
      name = rawName;
      while (cells.some(c => c.data.name == name)) {
        name = rawName + i;
        i++;
      }
      if (data.name !== name) {
        data.name = name;
        if (cell.isNode())
          me.setLabel(cell, name);
      }
      if (!cell.isEdge()) {
        graph.clearTransformWidgets();
        graph.resetSelection(cell);
      }
    });
    me.stencilEl.appendChild(stencil.container);
    nodeList.push(graph.createNode({
      shape: 'crect',
      label: 'start',
      attrs: {
        body: {
          rx: 20,
          ry: 26,
          fill: '#2a1',
        },
        text: {
          fill: '#fff',
        },
      },
      data: { nodeType: 'start' }
    }));
    nodeList.push(graph.createNode({
      shape: 'crect',
      label: 'node',
      data: { nodeType: 'node' }
    }));
    nodeList.push(graph.createNode({
      shape: 'crect',
      label: 'node',
      attrs: {
        body: {
          rx: 6,
          ry: 6
        }
      },
      data: { nodeType: 'node' }
    }));
    nodeList.push(graph.createNode({
      shape: 'cpolygon',
      label: 'node',
      attrs: {
        body: {
          refPoints: '0,10 10,0 20,10 10,20',
        },
      },
      data: { nodeType: 'node' }
    }));
    nodeList.push(graph.createNode({
      shape: 'cpolygon',
      label: 'node',
      attrs: {
        body: {
          refPoints: '10,0 40,0 30,20 0,20',
        },
      },
      data: { nodeType: 'node' }
    }));
    nodeList.push(graph.createNode({
      shape: 'crect',
      label: 'end',
      attrs: {
        body: {
          rx: 20,
          ry: 26,
          fill: '#c31',
        },
        text: {
          fill: '#fff',
        },
      },
      data: { nodeType: 'end' }
    }));
    stencil.load(nodeList, 'group1');
  }
  /**
   * Copy the specified cells.
   * @param {Array} cells The cells to be copied.
   * @return {Array} Copied cells.
   */
  copy(cells) {
    let me = this, cloned = me.graph.model.cloneSubGraph(cells), items = [];

    Wb.each(cloned, (k, v) => items.push(v));
    items.sort(item => item.isEdge() ? 2 : 1);
    return items;
  }
  /**
   * cut the specified cells.
   * @param {Array} cells The cells to be cut.
   * @return {Array} Cut cells.
   */
  cut(cells) {
    let me = this, copiedCells = me.copy(cells);

    me.graph.model.batchUpdate('cut', f => cells.forEach(cell => cell.remove()));
    return copiedCells;
  }
  /**
   * Paste clone cells to the current graph.
   * @param {Array} cells The cells to paste.
   * @return {Array} The paste cells.
   */
  paste(cells) {
    let dx = 32, dy = 32, me = this, graph = me.graph, model = graph.model;

    cells = me.copy(cells);
    cells.forEach((cell) => {
      cell.model = null;
      cell.removeProp('zIndex');
      if (dx || dy)
        cell.translate(dx, dy);
    });
    model.batchUpdate('paste', f => model.addCells(cells));
    return cells;
  }
  /**
   * Complete edit.
   */
  completeEdit() {
    this.propGrid.completeEdit();
  }
  /***/
  destroy() {
    this.graph.dispose();
    super.destroy();
  }
}