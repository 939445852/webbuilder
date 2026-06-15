/**
 * WebBuilder module generator.
 */
Cls['Wb.ide.Generator'] = class ideGenerator extends Wb.Base {
  /** @property {Object} - DBE util module. */
  static dbe = Wb.load('wb/ss/dbe.mjs');
  /** @property {Object} controlsLib Controls library. */
  static controlsLib = Wb.decode(new Wb.File(true, 'wb/docs/data.js').text.afterItem('=').slice(0, -1));
  /** @property {Wb.File} folder The Folder where the created module is located. */
  /** @property {String} subPath Module sub folder path. */
  /** @property {Wb.Connection} conn Database connection. */
  /** @property {String[]/Boolean} dict Dict array names or true means ungrouped dict. */
  /**
   * Create a module generator.
   * @param {Object} configs generator configs object.
   * @param {String} filename Module file name.
   * @param {String} path The path where the created module is located.
   * @param {String} db Database name.
   * @param {String} [schem] Database schem. For creating query module only.
   * @param {String} [tableName] Table name. For creating query module only.
   * @param {String} [viewName] View name. For creating query module only.
   * @param {String} [procName] Store procedure name. For creating query module only.
   * @param {String} [sql] Query sql. For creating query module only.
   * @param {String} [crudTable] CRUD Table name. For creating CRUD module only.
   * @param {String} [dict] Dict names. Separate multiple names with commas. "true" means ungrouped dict.
   * @param {String} [title] Module title.
   * @param {String} [icon] Module icon.
   * @param {String} [useWbSql] Whether to use wb.sql.
   */
  constructor(configs) {
    let me, filename, dict;

    super();
    me = this;
    filename = configs.filename;
    if (!filename?.endsWith('.xwl'))
      filename += '.xwl';
    me.filename = filename;
    me.db = configs.db;
    me.path = configs.path;
    me.folder = new Wb.File(me.path);
    if (new Wb.File(me.folder, filename).exists)
      Wb.raise(Str.alreadyExists.format(filename));
    me.subPath = filename.slice(0, -4);
    if (new Wb.File(me.folder, me.subPath).exists)
      Wb.raise(Str.alreadyExists.format(me.subPath));
    me.schem = configs.schem;
    me.tableName = configs.tableName;
    me.viewName = configs.viewName;
    me.procName = configs.procName;
    me.sql = configs.sql;
    dict = configs.dict;
    if (dict)
      me.dict = dict == 'true' ? true : dict.splitTrim();
    me.db = configs.db;
    me.conn = Wb.getConn(me.db);
    me.title = configs.title;
    me.icon = configs.icon;
    me.useWbSql = Wb.parseBool(configs.useWbSql);
  }
  /**
   * Build query module files.
   * @param {Boolean} [crud] Table crud mode.
   * @param {Boolean} [dataOnly] Return query result data only.
   * @return {Object} Returns result data if dataOnly is true, otherwise returns undefined.
   */
  buildQuery(crud, dataOnly) {
    const excludeNames = ['editor', 'fieldType', 'dataType', 'scale', 'precision', 'required', 'typeName', 'text', 'isBlob'];
    let me = this, file, data, items = [], schem = me.schem, conn = me.conn, xwl = [], useWbSql = me.useWbSql,
      comps = [], dict = me.dict, cols = [], col, editor, editors, makeEditor, fieldName, schemText, value, sql,
      fullTable, params, dictItem, colText, paramList, render, sortable, colEditor, makeFormEditor, formEditors;

    if (schem && conn.schema != schem)
      schemText = schem + '.';
    else
      schemText = '';
    if ((value = me.tableName) || (value = me.viewName)) {
      fullTable = schemText + value;
      sql = 'select * from ' + fullTable;
      editors = [];
      makeEditor = true;
      sortable = true;
      paramList = [];
      makeFormEditor = me.tableName;
    } else if (value = me.procName) {
      params = me.getProcParams();
      sql = 'call ' + schemText + value + '(' + params.params.join(', ') + ')';
      if (params.retParam)
        sql = params.retParam + ' = ' + sql;
      sql = '{' + sql + '}';
      editors = params.editors;
    } else {
      sql = me.sql;
      params = Wb.Query.compile(conn, sql)[2];
      editors = [];
      params.forEach(param => {
        if (param.ioType != 1 && !editors.find(e => e.properties.cid == param.name)) {
          editors.push(me.createEditor(param.name, param.type || 12));
        }
      });
    }
    if (dataOnly)
      makeFormEditor = true;
    if (makeFormEditor)
      formEditors = [];
    // Query first resultSet
    data = Wb.getDict({ sql, db: conn, dict });
    if (!useWbSql)
      useWbSql = !data;
    data?.columns?.forEach(column => {
      if (!crud && column.isBlob && !dataOnly)
        return;
      fieldName = column.fieldName;
      colEditor = column.editor;
      if (makeEditor && colEditor && colEditor.cname != 'textArea' && colEditor.cname != 'fileInput') {
        // none procedure input editor
        editor = me.createEditor(fieldName, column.fieldType, column.precision, column.scale, column.text);
        editors.push(editor);
        paramList?.push(fieldName + '=' + '{?' + DbUtil.getTypeName(column.fieldType) + '|' + fieldName + '?}');
      }
      if (makeFormEditor) {
        if (colEditor && !colEditor.readonly) {
          editor = me.createEditor(fieldName, column.fieldType, column.precision, column.scale, column.text, column);
          formEditors.push(editor);
        }
      }
      if (fieldName && dict && (dictItem = Wb.ServerDict.findItem(dict, fieldName)) && dictItem.text) {
        colText = me.toStrText(dictItem.text);
      } else {
        colText = column.text;
      }
      col = {
        cname: 'column',
        cid: column.rowNum ? 'rowNumCol' : (fieldName + 'Col'),
        text: colText
      };
      Wb.each(column, (k, v) => {
        if (!excludeNames.includes(k)) {
          col[k] = String(v);
        }
      });
      if (render = col.render) {
        if (col.render == 'Wb.Column.blobRender')
          col.render = "if (value)\n  Wb.Column.createDownload(el, column.fieldName);";
        else
          col.render = render.slice(render.indexOf('{') + 1, -2);
      }
      col = me.wrapComp(col);
      cols.push(col);
    });
    if (dataOnly)
      return { columns: cols, editors: formEditors };
    comps.pushAll(editors);
    comps.push({
      _icon: 'container',
      text: 'buttonContainer',
      cls: 'Wb.Container',
      properties: {
        cid: 'buttonContainer',
        layout: 'row',
        gridColumn: '-2 / -1',
        gap: '1em',
        justify: 'end',
        align: 'center',
        defaults: "({ minWidth: '8em' })"
      },
      _expanded: true,
      items: [{
        _icon: 'button',
        text: 'searchButton',
        cls: 'Wb.Button',
        properties: {
          cid: 'searchButton',
          icon: 'search',
          type: 'primary',
          text: '@Str.search'
        },
        events: {
          click: "app.load();"
        }
      }, {
        _icon: 'button',
        text: 'resetButton',
        cls: 'Wb.Button',
        properties: {
          cid: 'resetButton',
          icon: 'undo',
          text: '@Str.reset'
        },
        events: {
          click: "Wb.reset(app.searchPanel);\napp.load();",
        }
      }]
    });
    items.push({
      _icon: 'panel',
      text: 'searchPanel',
      cls: 'Wb.Panel',
      properties: {
        cid: 'searchPanel',
        layout: 'grid',
        visible: crud ? 'false' : undefined,
        maxHeight: '50%',
      },
      events: {
        keydown: "if (e.isGoKey)\n  app.load();"
      },
      _expanded: true,
      items: comps
    });
    items.push({
      _icon: 'splitter',
      text: 'splitter1',
      cls: 'Wb.Splitter',
      properties: {
        cid: 'splitter1'
      }
    });
    if (useWbSql) {
      items.push({
        _icon: 'container',
        text: 'resultContainer',
        cls: 'Wb.Container',
        properties: {
          cid: 'resultContainer',
          autoScroll: 'true',
          flex: '1'
        }
      });
    } else {
      items.push({
        _icon: 'grid',
        text: 'resultGrid',
        cls: 'Wb.Grid',
        properties: {
          cid: 'resultGrid',
          flex: '1',
          autoLoad: 'false',
          multiSelect: crud ? 'true' : undefined,
          textSelectable: crud ? undefined : 'true',
          downloadName: crud ? '__download' : undefined,
          columnsSortable: sortable ? 'true' : undefined,
          url: "@xpath + '/select'",
        },
        events: crud ? {
          itemdblclick: "app.editBtn.fireEvent('click');"
        } : undefined,
        _expanded: true,
        items: [
          {
            cls: 'Wb.Array',
            properties: {
              cid: 'columns'
            },
            text: 'columns',
            _expanded: true,
            _icon: 'array',
            items: cols
          }
        ]
      });
    }
    xwl = me.createModule(me.title, me.icon);
    xwl.events = {};
    if (useWbSql)
      xwl.events.initialize = "Wb.apply(app, {\n  /**\n   * Load all data based on the values in the search panel.\n   */" +
        "\n  load() {\n    let searchPanel = app.searchPanel;\n\n    if (!Wb.verify(searchPanel))\n      return;\n    " +
        "Wb.ajax({\n      url: xpath + '/select',\n      comps: searchPanel,\n      json: true,\n      success(resp) {\n" +
        "        app.resultContainer.text = Wb.encode(resp);\n      }\n    });\n  }\n});";
    else
      xwl.events.initialize = "Wb.apply(app, {\n  /**\n   * Load grid data based on the values in the search panel.\n   */" +
        "\n  load() {\n    let searchPanel = app.searchPanel;\n    if (!Wb.verify(searchPanel))\n      return;\n    " +
        "app.resultGrid.load({ comps: searchPanel });\n  }\n});";
    xwl.events.finalize = 'app.load();';
    xwl.items = [{
      _icon: 'viewport',
      text: 'viewport1',
      cls: 'Wb.Viewport',
      properties: {
        cid: 'viewport1',
        layout: 'column'
      },
      _expanded: true,
      items
    }];
    file = new Wb.File(me.folder, me.filename);
    if (crud)
      me.addCRUDItems(xwl, formEditors);
    me.saveXwl(file, xwl);
    if (crud) {
      me.createCRUDFiles(fullTable, paramList);
    } else {
      me.createQuerySelectFile(sql, useWbSql, paramList, sortable, me.sql);
    }
  }
  /**
   * Build crud module files. @priv
   */
  buildCRUD() {
    this.buildQuery(true);
  }
  /**
   * Return source data. @priv
   */
  getSourceData() {
    return this.buildQuery(false, true);
  }
  /**
   * Add crud items to main xwl module. @priv
   * @param {Object} Xwl Xwl module object.
   * @param {Array} items Form items.
   */
  addCRUDItems(xwl, items) {
    let subPath = "./" + this.subPath;

    xwl.items[0].items.insert(0, {
      "cls": "Wb.Toolbar",
      "properties": {
        "cid": "tbar",
        "isProperty": "true"
      },
      "text": "tbar",
      "_expanded": true,
      "_icon": "toolbar",
      "hasDupCid": 0,
      "items": [
        {
          "_icon": "item",
          "text": "addBtn",
          "cls": "Wb.Item",
          "_expanded": false,
          "properties": {
            "cid": "addBtn",
            "text": "@Str.add",
            "icon": "add",
            "keys": "Ctrl+E",
            "bindModule": subPath + "/add.xwl"
          },
          "events": {
            "click": "let win = app.editWin;\n\nwin.icon = 'add';\nwin.title = Str.add;\nwin.focusControl = null;\n" +
              "win.okHandler = (win, values) => {\n  Wb.ajax({\n    url: xpath + '/add',\n    params: values,\n    json: true," +
              "\n    success(resp) {\n      app.resultGrid.appendRecord(Wb.apply(values, resp));\n      win.hide();\n    }\n  " +
              "});\n};\nwin.show();\nwin.scrollEl.scrollTop = win.scrollEl.scrollLeft = 0;"
          }
        },
        {
          "_icon": "item",
          "text": "editBtn",
          "cls": "Wb.Item",
          "_expanded": true,
          "properties": {
            "cid": "editBtn",
            "text": "@Str.edit",
            "icon": "edit",
            "keys": "Ctrl+J",
            "bindModule": subPath + "/edit.xwl"
          },
          "events": {
            "click": "let win = app.editWin, rec = app.resultGrid.selection, data;\n\nif (!rec) {\n  Wb.tipSelect();\n  return;" +
              "\n}\ndata = rec.data;\nwin.icon = 'edit';\nwin.title = Str.edit;\nwin.focusControl = true;\n" +
              "Wb.setValue(win, data);\nwin.okHandler = (win, values) => {\n  Wb.ajax({\n    url: xpath + '/edit',\n    params:" +
              " rec.getDiffer(values),\n    json: true,\n    success(resp) {\n      rec.update(Wb.apply(values, resp));\n" +
              "      win.hide();\n    }\n  });\n};\nwin.show();"
          }
        },
        {
          "_icon": "item",
          "text": "delBtn",
          "cls": "Wb.Item",
          "_expanded": true,
          "properties": {
            "cid": "delBtn",
            "text": "@Str.del",
            "icon": "delete",
            "keys": "Ctrl+D",
            "bindModule": subPath + "/del.xwl"
          },
          "events": {
            "click": "let grid = app.resultGrid, recs = grid.selections;\nif (!recs.length) {\n  Wb.tipSelect();\n  return;\n}" +
              "\nWb.confirm(Wb.getActionHint(recs), f => {\n  Wb.ajax({\n    url: xpath + '/del',\n    params: " +
              "{ del: grid.originData },\n    success() {\n      grid.delRecords();\n    }\n  });\n});"
          }
        },
        {
          "_icon": "divider",
          "text": "divider1",
          "cls": "Wb.Divider",
          "properties": {
            "cid": "divider1"
          }
        },
        {
          "_icon": "item",
          "text": "searchBtn",
          "cls": "Wb.Item",
          "_expanded": true,
          "properties": {
            "cid": "searchBtn",
            "text": "@Str.search",
            "icon": "down3",
            "keys": "Ctrl+D"
          },
          "events": {
            "click": "let visible = app.searchPanel.visible = !app.searchPanel.visible;\napp.searchBtn.icon = " +
              "visible ? 'up3' : 'down3';"
          }
        }
      ]
    });
    xwl.items.insert(0, {
      "_icon": "window",
      "text": "editWin",
      "cls": "Wb.Window",
      "_expanded": true,
      "properties": {
        "cid": "editWin",
        "layout": "grid1",
        "width": "60em",
        "resetDialog": "true",
        "autoGrid": "true"
      },
      items
    });
  }
  /**
   * Get params from store procedure. @priv
   * @return {Object} Params data.
   * -retParam: Return params.
   * -params: In/out params.
   * -editors: Params input editors.
   */
  getProcParams() {
    let rs, me = this, params = [], editors = [], paramType, retParam, colName, dataType, dataTypeText,
      editor, ioParam, express;

    rs = me.conn.metaData.getProcedureColumns(null, me.schem || null, me.procName, null);
    try {
      while (rs.next()) {
        colName = rs.getString(4);
        if (colName.startsWith('@'))
          colName = colName.substr(1);
        paramType = rs.getInt(5);
        dataType = rs.getInt(6);
        dataTypeText = rs.getString(7);
        if (dataTypeText?.toLowerCase().includes('cursor'))
          dataTypeText = 'cursor';
        else
          dataTypeText = DbUtil.getTypeName(dataType);
        ioParam = paramType == 2;
        express = dataTypeText + '|' + colName;
        if (paramType == 1 || ioParam) {
          params.push((ioParam ? '{!' : '{?') + express + (ioParam ? '!}' : '?}'));
          editor = me.createEditor(colName, dataType, rs.getInt(8), rs.getInt(10), rs.getString(13));
          if (editor)
            editors.push(editor);
        } else if (paramType == 4) {
          params.push('{*' + express + '*}');
        } else if (paramType == 5) {
          retParam = '{*' + express + '*}';
        }
      }
    } finally {
      rs.close();
    }
    return { retParam, params, editors };
  }
  /**
   * create editor from the specified meta data. @priv
   * @param {String} fieldName Field name.
   * @param {Number} dataType Field data type.
   * @param {Number} size Field size.
   * @param {Number} scale Field scale.
   * @param {String} text Field text.
   * @param {Object} [column] Column object, only for CRUD.
   * @return {Object} Editor Wrapped editor node.
   */
  createEditor(fieldName, dataType, size, scale, text, column) {
    let decimalCount, dictItem, editor, cname, me = this, dict = me.dict;

    switch (dataType) {
      case Types.TIMESTAMP:
        cname = 'datetime';
        size = null;
        break;
      case Types.DATE:
        cname = 'date';
        size = null;
        break;
      case Types.TIME:
        cname = 'time';
        size = null;
        break;
      case Types.BIGINT:
      case Types.INTEGER:
      case Types.SMALLINT:
      case Types.TINYINT:
        cname = 'number';
        decimalCount = 0;
        break;
      case Types.DOUBLE:
      case Types.FLOAT:
      case Types.REAL:
        cname = 'number';
        break;
      case Types.DECIMAL:
      case Types.NUMERIC:
        cname = 'number';
        decimalCount = scale;
        break;
      case Types.LONGVARCHAR:
      case Types.LONGNVARCHAR:
      case Types.CLOB:
      case Types.NCLOB:
        cname = column ? 'textArea' : 'text';
        break;
      case Types.BINARY:
      case Types.VARBINARY:
      case Types.LONGVARBINARY:
      case Types.BLOB:
        cname = 'fileInput';
        size = null;
        break;
      case Types.BOOLEAN:
      case Types.BIT:
        cname = 'boolSelect';
        size = null;
        break;
      default:
        cname = 'text';
    }
    editor = { cid: fieldName, cname };
    if (column?.editor?.required)
      editor.required = 'true';
    if (size)
      editor.maxLength = String(size);
    if (decimalCount != null)
      editor.decimalCount = String(decimalCount);
    editor.text = text || fieldName;
    if (dict && (dictItem = Wb.ServerDict.findItem(dict, fieldName))) {
      if (dictItem.editHidden)
        return null;
      if (dictItem.keyName) {
        editor.cname = 'select';
        editor.keyName = dictItem.keyName;
        delete editor.maxLength;
        delete editor.decimalCount;
      };
      if (dictItem.text) {
        editor.text = me.toStrText(dictItem.text);
      }
      if (dictItem.cname)
        editor.cname = dictItem.cname;
      if (dictItem.maxLength != null)
        editor.maxLength = String(dictItem.maxLength);
      if (dictItem.decimalCount != null)
        editor.decimalCount = String(dictItem.decimalCount);
      if (dictItem.height)
        editor.height = String(dictItem.height);
      if (dictItem.hint)
        editor.hint = dictItem.hint;
      if (dictItem.validateScript)
        editor.validator = dictItem.validateScript;
      if (dictItem.editTags)
        editor.tagProperties = dictItem.editTags;
    }
    if (editor.cname == 'toggle') {
      editor.maxLength = undefined;
    }
    if (editor.cname == 'text' && size > 500)
      editor.cname = 'textArea';
    return me.wrapComp(editor);
  }
  /**
   * Convert to Str.xxx text.
   */
  toStrText(text) {
    if (text?.startsWith('@'))
      return '@Str.' + text.substr(1);
    else
      return text;
  }
  /**
   * Get component class name. @priv
   */
  getCompClass(cname) {
    return Wb.find(this.constructor.controlsLib, (k, v) => v.cname == cname);
  }
  /**
   * Create query select file. @priv
   * @param {String} [sql] Query sql script.
   * @param {Boolean} [useWbSql] Whether to use Wb.sql for querying.
   * @param {Array} [paramList] SQL params list.
   * @param {Boolean} [sortable] Columns sortable.
   * @param {Boolean} [sqlMode] Whether it is a custom SQL.
   */
  createQuerySelectFile(sql, useWbSql, paramList, sortable, sqlMode) {
    let file, xwl, ss, subFolder, dict, me = this, db = me.db;

    xwl = me.createModule();
    dict = me.dict;
    if (dict) {
      if (dict === true)
        dict = 'true';
      else
        dict = "'" + dict.join(', ') + "'";
    } else {
      dict = '';
    }
    ss = 'function main() {\n  let data, sql;\n\n  sql = ' + (sql.includes('`') ? Wb.encode(sql) : ('`' + sql + '`')) + ';';
    if (paramList?.length) {
      ss += "\n  sql += Wb.Query.getParamsIf(['" + paramList.join("', '") + "']);";
    }
    if (sortable) {
      ss += "\n  sql += Wb.getOrderSql();";
    }
    ss += '\n  data = Wb.' + (useWbSql ? 'sql' : 'getDict') + '({ sql' +
      (db && Config.defaultSource != db ? (", db: '" + db + "'") : '') + (dict ? (", dict: " + dict) : '') +
      ' });\n  Wb.send(data);\n}\nmain();';
    xwl.properties.serverScript = ss;
    subFolder = new Wb.File(me.folder, me.subPath);
    me.createIndex(subFolder, me.title);
    me.addToIndex(subFolder);
    file = new Wb.File(subFolder, 'select.xwl');
    me.saveXwl(file, xwl);
  }
  /**
     * Create crud files. @priv
     * @param {String} [fullTable] Full table name.
     * @param {Array} [paramList] SQL params list.
     */
  createCRUDFiles(fullTable, paramList) {
    let file, xwl, ss, subFolder, dict, me = this, db = me.db;

    xwl = me.createModule();
    dict = me.dict;
    if (dict) {
      if (dict === true)
        dict = ', dict: true';
      else
        dict = ", dict: '" + dict.join(', ') + "'";
    } else {
      dict = '';
    }
    if (db && Config.defaultSource != db)
      db = ", db: '" + db + "'";
    else
      db = '';
    ss = `function main() {
  let sql, data, download, fieldName;

  download = Wb.getObject('__download');
  if (download) {
    sql = Wb.Query.createSQL({ tableName: '${fullTable}'${db} }).select;
    data = Wb.getRow({ sql${db}, blob: true, params: download });
    fieldName = download._meta.fieldName;
    if (data)
      Wb.exportData(data[fieldName], fieldName + '.dat');
    else
      Wb.raise(Str.notFound.format(fieldName));
  } else {
    sql = 'select * from ${fullTable}';
    sql += Wb.Query.getParamsIf(['${paramList?.join("', '") || ''}']);
    sql += Wb.getOrderSql();
    data = Wb.getDict({ sql${db}${dict} });
    Wb.send(data);
  }
}
main();`;
    xwl.properties.serverScript = ss;
    subFolder = new Wb.File(me.folder, me.subPath);
    me.createIndex(subFolder, me.title);
    me.addToIndex(subFolder);
    file = new Wb.File(subFolder, 'select.xwl');
    me.saveXwl(file, xwl);
    ss = `let rec = { sid: Params.sid || Wb.getId() };

Wb.set(rec);
Wb.sync({ tableName: '${fullTable}'${db}, insert: Params });
Wb.send(rec);`;
    xwl = me.createModule();
    xwl.properties.serverScript = ss;
    file = new Wb.File(subFolder, 'add.xwl');
    me.saveXwl(file, xwl);
    ss = `Wb.sync({ tableName: '${fullTable}'${db}, update: Params });`;
    xwl = me.createModule();
    xwl.properties.serverScript = ss;
    file = new Wb.File(subFolder, 'edit.xwl');
    me.saveXwl(file, xwl);
    ss = `let del = Wb.getObject('del');

Wb.sync({ tableName: '${fullTable}'${db}, del });`;
    xwl = me.createModule();
    xwl.properties.serverScript = ss;
    file = new Wb.File(subFolder, 'del.xwl');
    me.saveXwl(file, xwl);
  }
  /**
   * Save xwl to file. @priv
   * @param {Wb.File} file Module file.
   * @param {Object} xwl Module object.
   */
  saveXwl(file, xwl) {
    file.prettyObject = xwl;
    file.clearBuffer();
    this.addToIndex(file);
  }
  /**
   * Create wrapped node from component. @priv
   * @return {Object} wrapped node.
   */
  wrapComp(comp) {
    let cls = this.getCompClass(comp.cname);

    delete comp.cname;
    return {
      cls,
      properties: Wb.applyWithout({}, comp, ['cname']),
      text: comp.cid,
      _expanded: true,
      _icon: this.constructor.controlsLib[cls].icon
    };
  }
  /**
   * Add file to index file. @priv
   * @param {Wb.File} file File to be added.
   */
  addToIndex(file) {
    let object, indexFile = new Wb.File(file.parent, 'index.json');

    indexFile.lock();
    try {
      if (indexFile.exists)
        object = indexFile.object;
      else
        object = {
          title: '',
          icon: '',
          img: '',
          hideInMenu: 'false',
          items: [
          ]
        };
      if (!object.items.includes(file.name)) {
        object.items.push(file.name);
        indexFile.prettyObject = object;
      }
    } finally {
      indexFile.unlock();
    }
  }
  /**
   * Create a new index file if it does not exist. @priv
   * @param {Wb.File} folder Folder for index file.
   * @param {String} [title] Folder title.
   */
  createIndex(folder, title) {
    let object, indexFile = new Wb.File(folder, 'index.json');

    indexFile.lock();
    try {
      if (indexFile.exists)
        object = indexFile.object;
      else
        object = {
          title: '',
          icon: '',
          img: '',
          hideInMenu: 'true',
          items: [
          ]
        };
      object.title = title;
      indexFile.prettyObject = object;
    } finally {
      indexFile.unlock();
    }
  }
  /**
   * Create module framework object. @priv
   * @param {String} [title] Module title.
   * @param {String} [icon] Module icon.
   * @return {Object} Module object.
   */
  createModule(title, icon) {
    return {
      title: title || '',
      icon: icon || '',
      img: '',
      tags: '',
      hideInMenu: 'false',
      text: 'module',
      cls: 'Wb.Module',
      _expanded: true,
      properties: {
        cid: 'module'
      },
      _icon: 'module'
    }
  }
}
/**
 * File content searcher
 */
Cls['Wb.ide.FileSearcher'] = class ideFileSearcher extends Wb.Base {
  /** @property {String[]} paths List of searched paths @priv */
  /** @property {String} searchText Search text content @priv */
  /** @property {String[]} fileTypes File types @priv */
  /** @property {Object} options Search options @priv */
  /** @property {Number} count Max count of search items @priv */
  /** @property {Array} rows Search result @priv */
  /**
   * The constructor
   * @param {String[]} paths List of searched paths
   * @param {String} searchText Search text content
   * @param {String} fileTypes File types
   * @param {Object} options Search options
   * @param {Number} [count] count Max count of search items. Default is 1000
   * @param {String} [replaceTo] Replace to it
   */
  constructor(paths, searchText, fileTypes, options, count, replaceTo) {
    let me;

    super();
    me = this;
    me.paths = paths;
    me.searchText = searchText;
    me.fileTypes = fileTypes.splitTrim();
    me.options = options;
    me.count = count ?? 1000;
    me.replaceTo = replaceTo;
  }
  /**
   * Performs a search-replace operation on all files at the specified path.
   * @return {Array} Search result
   */
  searchReplace() {
    let me = this, includeLibs = me.options.includeLibs, filePath,
      libPath = new Wb.File(true, 'wb/libs').path, dataPath = new Wb.File(true, 'wb/docs/data.js').path;

    me.rows = [];
    me.paths.each(path => {
      path = new Wb.File(path);
      if (path.isFile) {
        if (!me.doSearch(path))
          return false;
      } else {
        if (path.cascade(file => {
          if (file.isMinFile)
            return;
          filePath = file.path;
          if (!includeLibs && filePath == libPath)
            return null;
          if (file.isFolder || filePath == dataPath)
            return;
          if (!me.doSearch(file))
            return false;
        }) === false)
          return false;
      }
    });
    return me.rows;
  }
  /**
   * Performs a search operation on the specified file @priv
   * @param {Wb.File} file search file
   * @return {Boolean} true means done, false means search aborted
   */
  doSearch(file) {
    let me = this;

    if (!me.fileTypes.some(type => file.match(type)))
      return true;
    let options = me.options, regExp, text, replacedText, path = file.path, searchText = me.searchText,
      replaceTo = me.replaceTo, hasReplace = replaceTo != null;

    regExp = options.regularExpress ? searchText : searchText.regexpText;
    if (!options.regularExpress && options.wholeWord)
      regExp = '\\b' + regExp + '\\b';
    regExp = new RegExp(regExp, 'g' + (options.caseSensitive ? '' : 'i') + 'm');
    if (file.isModuleFile) {
      let properties, events, cid, subPath, result, object;
      try {
        object = file.object;
      } catch (e) {
        Wb.raise('Invalid file "' + file.path + '".');
      }
      result = Wb.cascade([object], (item, parent) => {
        properties = item.properties;
        events = item.events;
        cid = properties.cid;
        subPath = parent ? (parent.path + '.' + cid) : cid;
        item.path = subPath;
        if (Wb.each(properties, (k, v) => {
          v = String(v);
          if (hasReplace)
            properties[k] = v.replaceAll(regExp, replaceTo);
          else {
            if (me.addMatchs(k.matchAll(regExp), path, subPath, k, 'properties', v.substr(0, 30)) === false)
              return false;
            if (me.addMatchs(v.matchAll(regExp), path, subPath, k, 'properties') === false)
              return false;
          }
        }) === false)
          return false;
        if (Wb.each(events, (k, v) => {
          if (hasReplace)
            events[k] = v.replaceAll(regExp, replaceTo);
          else {
            if (me.addMatchs(k.matchAll(regExp), path, subPath, k, 'events', v.substr(0, 30)) === false)
              return false;
            if (me.addMatchs(v.matchAll(regExp), path, subPath, k, 'events') === false)
              return false;
          }
        }) === false)
          return false;
      });
      if (hasReplace) {
        Wb.cascade([object], item => delete item.path);
        replacedText = JsonUtil.jsonToYaml(Wb.toJava(object));
        if (file.text != replacedText) {
          file.text = replacedText;
          file.clearBuffer();
        }
        return true;
      } else {
        return result;
      }
    } else {
      text = file.text;
      if (hasReplace) {
        replacedText = text.replaceAll(regExp, replaceTo);
        if (text != replacedText) {
          file.text = replacedText;
          file.clearBuffer();
        }
        return true;
      } else {
        return me.addMatchs(text.matchAll(regExp), path);
      }
    }
  }
  /**
   * Adds the searched results to the result set @priv
   * @param {Object} matchs The match
   * @param {String} path File path
   * @param {String} [compPath] Node sub path
   * @param {String} [propName] Property name
   * @param {String} [propType] Property type
   * @param {String} [valueText] Value part text, means a property name.
   * @return {Boolean} true means done, false means search aborted
   */
  addMatchs(matchs, path, compPath, propName, propType, valueText) {
    let m, str, input, index, strLen, result, content, me = this, lastIndex = 0,
      count = me.count, rows = me.rows, lineNumber = 0;

    for (m of matchs) {
      index = m.index;
      str = m[0];
      strLen = str.length;
      input = m.input;
      content = '';
      if (index > 40)
        content += '...';
      content += input.substring(index - 40, index).htmlLine + '<span class="w-key-color">' +
        str.htmlLine + '</span>' + input.substr(index + strLen, 40).htmlLine;
      if (input.length > index + strLen + 40)
        content += '...';
      lineNumber += input.substring(lastIndex, index).occur('\n');
      result = {
        path, content: valueText ? (content + ': ' + valueText.htmlLine) : content, lineNumber: valueText ? 1 : (lineNumber + 1),
        column: valueText ? 1 : (index - input.lastIndexOf('\n', index))
      };
      if (compPath)
        Wb.apply(result, { compPath, propName, propType });
      rows.push(result);
      if (rows.length >= count)
        return false;
      lastIndex = index;
    }
    return true;
  }
}
/**
 * WebBuilder documents creator.
 */
Cls['Wb.ide.DocsCreator'] = class ideDocsCreator extends Wb.Base {
  /** @property {RegExp} - Regexp of class name without extensions @priv */
  static clsExp = /\bCls\b\[[\"|'](.*)[\"|']\]\s*=\s*\bclass\b\s+(.*)\s*{/;
  /** @property {RegExp} - Regexp of class name with extensions @priv */
  static clsExpExtends = /\bCls\b\[[\"|'](.*)[\"|']\]\s*=\s*\bclass\b\s+(.*)\s*\bextends\b\s*(.*)\s*{/;
  /** @property {RegExp} - Regexp of class name with mixin @priv */
  static clsMixin = /\bCls\b\[[\"|'](.*)[\"|']\]\s*=\s*.*\s*=>\s*\bclass\b\s+(.*)\s*\bextends\b\s*(.*)\s*{/;
  /** @property {Array} - Reserved key names @priv */
  static reservedNames = ['constructor', 'toString'];
  /** Constructor function */
  constructor() {
    super();
    this.docs = {};
    this.scripts = [];
  }
  /**
   * Add the script document to be compiled.
   * @param {String} script Compiled script
   * @param {String} path Path of script
   */
  addScript(script, path) {
    this.scripts.push([script, path]);
  }
  /**
   * Add WebBuilder documentation to be compiled.
   * @param {Object} doc Compiled docs
   */
  addDoc(doc) {
    this.docs[doc.cls] = doc;
  }
  /**
   * Gets the class name after the specified location
   * @param {String} script Scan Script
   * @param {Number} start Start pos
   * @return {String} Class name
   * @priv
   */
  findClass(script, start) {
    let pos, result, extendsCls, mixin;

    pos = script.indexOf('{', start);
    if (pos == -1)
      return null;
    script = script.substring(start, pos + 1);
    if (result = script.match(this.constructor.clsExpExtends)) {
      extendsCls = result[3].trim();
      extendsCls = extendsCls.split('(');
      if (extendsCls.length > 1) {
        mixin = extendsCls;
        extendsCls = mixin.pop();
        extendsCls = extendsCls.replaceAll(')', '');
      } else {
        mixin = null;
        extendsCls = extendsCls[0];
      }
      return {
        cls: result[1],
        cname: result[2].trim(),
        extend: extendsCls,
        mixin
      };
    } else if (result = (script.match(this.constructor.clsExp) || script.match(this.constructor.clsMixin))) {
      return {
        cls: result[1],
        cname: result[2].trim()
      };
    } else {
      return null;
    }
  }
  /**
   * Gets the function name after the specified location.
   * @param {String} script Scan script
   * @param {Number} start Start pos
   * @return {String} Function name
   * @priv
   */
  getFunctionName(script, start) {
    let i, j, k, s, l = Wb.maxInt,
      chars = '(:=;\n';

    j = chars.length;
    for (i = 0; i < j; i++) {
      k = script.indexOf(chars[i], start);
      if (k != -1)
        l = Math.min(l, k);
    }
    s = script.substring(start, l).trim();
    if (s.startsWith('function'))
      s = s.substring(8);
    return s.trim();
  }
  /**
   * Gets a fragment of a specific space split in a document.
   * @param {String} content Scan content
   * @param {Boolean} longSection true means consists of 3 sections and false means consists of 2 sections.
   * @return {Array} All sections
   * @priv
   */
  getSections(content, longSection) {
    let str, i, j = longSection ? 3 : 2,
      k = j - 1,
      begin = 0,
      end = 0,
      sections = [];

    content = content.trimLeft();
    for (i = 0; i < j; i++) {
      if (i == k) {
        str = content.substring(begin);
      } else {
        end = content.indexOf(' ', begin);
        if (end == -1)
          end = content.length;
        str = content.substring(begin, end);
        begin = end + 1;
      }
      sections.push(str.trim());
    }
    return sections;
  }
  /**
   * Gets the content inside the parentheses.
   * @param {String} content Scan content.
   * @return {String} Remove the contents of the preceding and following parentheses.
   * @priv
   */
  getKeyword(content) {
    return content.substring(1, content.length - 1);
  }
  /**
   * Compiles the specified script and generates the document.
   * @priv
   */
  compileScript() {
    let me, begin, end, str, enterPos, first, item, keyType, keyTitle, isGetter, isSetter, itemCls,
      doc, docs, pos, lines, section, sections, category, lastIsGetter, params, keyItem, segScript,
      existsDoc, absentName, isStatic, name, funcName, accessorName, cls, className, script, path;

    docs = this.docs;
    me = this;
    me.scripts.forEach(scriptItem => {
      doc = null;
      script = scriptItem[0];
      path = scriptItem[1];
      end = 0;
      while (true) {
        do {
          begin = script.indexOf('/**', end);
          if (begin == -1)
            break;
          // Determines whether the comments are blank before they start
          if (!script.substring(script.lastIndexOf('\n', begin), begin - 1).trim())
            break;
          end = begin + 3;
        } while (true);
        if (begin == -1)
          break;
        end = script.indexOf('*/', begin + 3);
        if (end == -1)
          break;
        pos = script.lastIndexOf('\n', begin);
        //Invalid comment is returned
        if (pos != -1 && script.substring(pos + 1, begin).trim())
          break;
        item = {};
        name = null;
        category = null;
        isStatic = false;
        segScript = script.substring(begin + 2, end - 1);
        //Remove the * sign at the beginning of each line
        lines = segScript.split('\n');
        str = '';
        first = true;
        lines.forEach(line => {
          if (first)
            first = false;
          else
            str += '\n';
          line = line.trim();
          if (line.startsWith('*'))
            line = line.substr(1);
          str += line;
        });
        //Resolve tags starting with each " @"
        lines = str.split(' @');
        //Title
        str = lines[0].trim();
        if (str != '')
          item.title = str;
        item.line = script.substr(0, begin).occur('\n') + 1;
        if (path.endsWith('/wb-client.js'))
          item.wb = 1;
        else if (path.endsWith('/wb-server.js'))
          item.wb = 2;
        lines.erase(0);
        lines.forEach(line => {
          line = line.trim();
          pos = line.indexOf(' ');
          enterPos = line.indexOf('\n');
          if (enterPos != -1 && enterPos < pos)
            pos = enterPos;
          if (pos == -1) {
            str = line;
            section = '';
          } else {
            str = line.substring(0, pos);
            section = line.substr(pos + 1);
          }
          switch (str) {
            case 'property':
              category = str;
              sections = me.getSections(section, true);
              keyType = me.getKeyword(sections[0]);
              name = sections[1];
              keyTitle = sections[2];
              funcName = me.getFunctionName(script, script.indexOf('\n', end) + 1);
              if (funcName.startsWith('static ')) {
                category = 'sproperty';
                funcName = funcName.substr(7).trimLeft();
              }
              accessorName = funcName.lastItem(' ');
              absentName = !name || name == '-';
              isGetter = segScript.includes('@getter');
              isSetter = segScript.includes('@setter')
              if (absentName || name == accessorName || isGetter || isSetter) {
                if (funcName.startsWith('get ') || isGetter) {
                  lastIsGetter = true;
                  keyItem = item.getter = {};
                } else if (funcName.startsWith('set ') || isSetter) {
                  lastIsGetter = false;
                  keyItem = item.setter = {};
                } else {
                  keyItem = item;
                }
                if (absentName)
                  name = accessorName;
              } else {
                keyItem = item;
              }
              if (keyType)
                keyItem.type = keyType;
              if (keyTitle)
                keyItem.title = keyTitle;
              break;
            case 'event':
              category = str;
              sections = me.getSections(section, false);
              name = sections[0];
              item.title = sections[1];
              break;
            case 'param':
              sections = me.getSections(section, true);
              let param = {};
              if (!item.params) {
                if (item.setter || item.getter) {
                  if (lastIsGetter) {
                    if (item.getter.params)
                      params = item.getter.params;
                    else
                      params = item.getter.params = [];
                  } else {
                    if (item.setter.params)
                      params = item.setter.params;
                    else
                      params = item.setter.params = [];
                  }
                } else {
                  if (item.params)
                    params = item.params;
                  else
                    params = item.params = [];
                }
              }
              params.push(param);
              param.type = me.getKeyword(sections[0]);
              param.optional = sections[1].indexOf('[') != -1;
              param.name = param.optional ? me.getKeyword(sections[1]) : sections[1];
              param.title = sections[2];
              break;
            case 'function':
              category = str;
              name = section;
              if (name == 'constructor')
                name = '$$' + name;
              break;
            case 'return':
              sections = me.getSections(section, false);
              item.return = {
                type: me.getKeyword(sections[0]),
                title: sections[1]
              };
              break;
            case 'static':
              isStatic = true;
              if (category == 'property')
                category = 'sproperty';
              if (category == 'function')
                category = 'sfunction';
              break;
            case 'private':
              item.priv = true;
              break;
            case 'readonly':
            case 'writeonly':
            case 'priv':
            case 'desktop':
            case 'touch':
            case 'override':
            case 'key':
            case 'singleton':
            case 'code':
            case 'container':
            case 'implicit':
            case 'noDesign':
              item[str] = true;
              break;
            case 'class':
              item.cls = section;
              break;
            case 'icon':
            case 'lib':
            case 'design':
            case 'mimic':
              item[str] = section;
              break;
            case 'getter':
            case 'setter':
              //ignore
              break;
            default:
              Wb.warn(`Invalid tag "${str}": ${line}`);
          }
        });
        itemCls = item.cls;
        //Define new cls
        if (itemCls) {
          if (docs[itemCls])
            doc = Wb.applyIf(docs[itemCls], item);
          else
            doc = docs[itemCls] = item;
          doc.path ??= path;
        } else {
          //continue append
          if (!category) {
            cls = me.findClass(script, end + 2);
            if (cls) {
              className = cls.cls;
              //find new class
              doc = {
                title: item.title,
                path
              };
              Wb.applyValue(doc, cls);
              if (item.icon)
                doc.icon = item.icon;
              if (item.lib)
                doc.lib = item.lib;
              if (item.mimic)
                doc.mimic = item.mimic;
              if (item.design)
                doc.design = item.design;
              if (item.implicit)
                doc.implicit = true;
              if (item.noDesign)
                doc.noDesign = true;
              if (item.container)
                doc.container = true;
              if (item.singleton)
                doc.singleton = true;
              if (docs[className])
                doc = docs[className];
              else
                docs[className] = doc;
            } else {
              name = me.getFunctionName(script, script.indexOf('\n', end) + 1) || 'anonymous';
              if (this.constructor.reservedNames.includes(name))
                name = '$$' + name;
              if (!isStatic) {
                isStatic = name.startsWith('static ');
                if (isStatic)
                  name = name.substr(7).trimLeft();
              }
              if (name.startsWith('get ')) {
                lastIsGetter = true;
                name = name.substr(4);
                category = isStatic ? 'sproperty' : 'property';
                item.getter = {};
              } else if (name.startsWith('set ')) {
                lastIsGetter = false;
                name = name.substr(4);
                category = isStatic ? 'sproperty' : 'property';
                item.setter = {};
              } else {
                category = isStatic ? 'sfunction' : 'function';
              }
            }
          }
          if (category) {
            if (!doc) {
              doc = {
                title: 'Untitled'
              };
            }
            if (doc.singleton) {
              if (category == 'property')
                category = 'sproperty';
              if (category == 'function')
                category = 'sfunction';
            }
            if (!doc[category])
              doc[category] = {};
            if (name.startsWith('*') || name.startsWith('/'))
              Wb.warn(`Invalid name "${name}": ` + script.substring(script.lastIndexOf('/*', end), script.lastIndexOf('*/', end)));
            existsDoc = doc[category][name];
            if (existsDoc) {
              delete item.line;
              Wb.apply(existsDoc, item);
            } else {
              doc[category][name] = item;
            }
          }
        }
      }
    });
  }
  /**
   * Create a control metadata file for server control resolution @priv
   * @return {Objet} Control metadata file. Key is the cls name, and Value is an object composed of all attributes.
   */
  createControlsMeta() {
    let doc = this.docs, object, result = {};
    //Only controls that have icons are extracted
    Wb.each(doc, (k, v) => {
      if (v.icon) {
        object = this.getAllMembers(k);
        object.cname = v.cname;
        result[k] = object;
      }
    });
    return result;
  }
  /**
   * Gets all the members of the specified class and their types.
   * @return {Object} Data object.
   */
  getAllMembers(cls) {
    let params, data, type, isCt = false, parentCls = cls, allCls = [], doc = this.docs,
      properties = {}, events = {}, result, lib, libs = [];

    do {
      allCls.push(parentCls);
      data = doc[parentCls];
      if (data.mixin) {
        allCls.push(...data.mixin);
      }
    } while (parentCls = data.extend);
    allCls.each(cls => {
      data = doc[cls];
      lib = data.lib;
      if (lib) {
        lib = lib.splitTrim();
        lib.forEach((item, i) => {
          if (item.endsWith('*')) {
            item = { url: item.slice(0, -1), async: true };
            lib[i] = item;
          }
        });
        libs.push(...lib);
      }
      if (data.container || cls == 'Wb.Container')
        isCt = true;
      //property
      Wb.each(data.property, (k, v) => {
        if ((v.setter || !v.getter) && !v.priv && !v.readonly && !v.code && k != 'events') {
          type = v.type?.firstItem('/');
          if (!type)
            type = v.setter?.type?.firstItem('/');
          if (type?.endsWith('[]'))
            type = 'Object';
          if (type || !properties[k]) {
            type ??= 'Object';
            properties[k] = type == 'Function' ? ('*' +
              ((v.setter?.params ?? v.params)?.pluck('name').join(', ') ?? '')) : type;
          }
        }
      });
      //event
      Wb.each(data.event, (k, v) => {
        if (v.params) {
          params = [];
          v.params.forEach(item => {
            if (!item.name.startsWith('.'))
              params.push(item.name);
          });
          params.push('options');
          params = params.join(', ');
        } else {
          params = 'options'
        }
        events[k] = params;
      });
    }, true, true);
    result = { properties, events, isCt, implicit: doc[cls].implicit };
    if (libs.length)
      result.libs = libs;
    return result;
  }
  /**
   * Compiles the specified script document and WebBuilder document.
   */
  build() {
    this.compileScript();
    new Wb.File(true, 'wb/docs/data.js').text = 'globalThis.WbDocsData=' + Wb.encode(this.docs) + ';';
    //create controls.json
    new Wb.File(true, 'wb/system/controls.json').object = this.createControlsMeta();
    ModuleData.load();
  }
}
/**
 * IDE util.
 */
Cls['Wb.ide.Util'] = class ideUtil extends Wb.Base {
  /**
   * Get image icon list
   * @return {String[]} Image icon list.
   */
  static getImgs() {
    let items = [];
    new Wb.File(true, 'wb/images').each(file => {
      if (file.isFile)
        items.push(file.normalName);
    });
    return items.lowerSort();
  }
  /**
   * Get icon list
   * @return {String[]} icon list.
   */
  static getIcons() {
    return new Wb.File(true, 'wb/css/iconfont.css').text.match(/(?<=\.icon-).*?(?=\:)/g).lowerSort();
  }
  /**
   * Get global variables list
   * @return {Array} Variables list.
   */
  static getGlobalsList() {
    let result = [];

    Wb.each(globalThis, (k, v) => {
      if (k != 'jakarta')
        result.push(k);
    });
    return result;
  }
}
/**
 * Class searcher.
 */
Cls['Wb.ide.ClassSearcher'] = class ideClassSearcher extends Wb.Base {
  static protos = {
    Class: Java.type('java.lang.Class'),
    Modifier: Java.type('java.lang.reflect.Modifier'),
    URLClassLoader: Java.type('java.net.URLClassLoader'),
    JarFile: Java.type('java.util.jar.JarFile'),
    Thread: Java.type('java.lang.Thread'),
    Files: Java.type('java.nio.file.Files'),
    Paths: Java.type('java.nio.file.Paths'),
    FileSystems: Java.type('java.nio.file.FileSystems')
  };
  /** @property {String} findCls Find class name. @priv */
  /** @property {String[]} result Found names result. @priv */
  constructor(findCls) {
    let me;
    super();
    me = this;
    me.findCls = findCls;
    me.findClsDot = findCls + '.';
    me.clsLength = findCls.length + 1;
  }
  /**
   * Get Java class public members.
   * @return {Array} Members list.
   */
  getJavaMembers() {
    let cls, fields, methods, name, members, me = this, className = me.findCls;

    try {
      cls = me.Class.forName(className);
    } catch (e) {
      try {
        cls = Java.type(className).class.getClassLoader().loadClass(className);
      } catch (ex) {
        return null;
      }
    }
    fields = cls.getFields();
    methods = cls.getMethods();
    members = [];
    fields.forEach(field => {
      if (me.Modifier.isPublic(field.getModifiers())) {
        name = field.getName();
        members.push({
          label: name,
          kind: 3
        });
      }
    });
    methods.forEach(method => {
      if (me.Modifier.isPublic(method.getModifiers())) {
        name = method.getName();
        members.push({
          label: name + '(' + me.getMethodParams(method).join(', ') + ')',
          kind: 1,
          ret: me.getReturnTypeSimpleName(method.getReturnType())
        });
      }
    });
    return members;
  }
  /**
   * Get params of the specified method. @priv
   * @param {Method} method Java method.
   * @return {Array} Param names.
   */
  getMethodParams(method) {
    let parameters = method.getParameters(), paramNames = [];

    parameters.forEach((param, index) => {
      if (param.isNamePresent()) {
        paramNames.push(param.getName());
      } else {
        paramNames.push(this.getSimpleTypeName(param.getType(), index + 1));
      }
    });
    return paramNames;
  }
  /**
   * Get simple type name of the specified cls. @priv
   * @param {Class} cls Java type.
   * @param {Number} index Param index.
   * @return {String} Class type name
   */
  getSimpleTypeName(cls, index) {
    if (cls.isArray())
      return this.getSimpleTypeName(cls.getComponentType(), index) + '[]';
    return cls.getSimpleName() + index;
  }
  /**
   * Get simple return type name. @priv
   * @param {Class} cls Java type.
   * @return {string} Method return type name.
   */
  getReturnTypeSimpleName(cls) {
    if (!cls) return 'void';
    if (cls.isArray())
      return this.getReturnTypeSimpleName(cls.getComponentType()) + '[]';
    return cls.getSimpleName();
  }
  /**
   * Get JS class public members.
   * @return {Array} Members list.
   */
  getJSMembers() {
    let members = [], names = {}, name, value, kind, object, isFn;

    object = Wb.getNS(this.findCls);
    if (!object)
      return members;
    Wb.each(object.allMembers, (k, v) => {
      if (!names[k]) {
        names[k] = 1;
        value = {
          label: v ? (k + '()') : k,
          kind: v ? 1 : 3
        };
        members.push(value);
      }
    });
    // runtime members
    for (name in object) {
      if (!names[name]) {
        value = object[name];
        if (Java.isJavaObject(value) || value?.prototype instanceof Wb.Base || value == Wb.Base)
          kind = 5;
        else if (Wb.isFunction(value))
          kind = 1;
        else
          kind = 3;
        names[name] = 1;
        members.push({
          label: kind == 1 ? (name + '()') : name,
          kind
        });
      }
    }
    while (object) {
      [object.prototype, object].forEach((item, i) => {
        item && Wb.each(Object.getOwnPropertyDescriptors(item), (k, v) => {
          if (!names[k]) {
            names[k] = 1;
            isFn = !Java.isJavaObject(v.value) && Wb.isFunction(v.value);
            value = {
              label: isFn ? (k + '()') : k,
              kind: isFn ? 1 : 3
            };
            members.push(value);
          }
        });
      });
      object = Object.getPrototypeOf(object);
    }
    return members;
  }
  /**
   * Get class package and class members.
   * @return {Array} Members list.
   */
  getClassMembers() {
    let me = this, file, paths, libPath;

    me.result = [];
    me.existsNames = {};
    paths = [
      new File(Base.path, 'WEB-INF/classes'),
      new File(Base.path, 'WEB-INF/lib')
    ];
    libPath = me.getServerLibPath();
    if (libPath) {
      file = new File(libPath);
      paths.push(file);
      file = file.getParentFile();
      paths.push(new File(file, 'graal'))
    }
    libPath = System.getProperty('java.home');
    paths.push(new File(libPath, 'lib'));
    paths.push(new File(libPath, 'jmods'));
    paths.forEach(path => {
      if (path.exists())
        me.scanDirectory(path);
    });
    return me.result;
  }
  /**
   * Get server lib path. @priv
   * @return {String} Server lib path.
   */
  getServerLibPath() {
    const URI = Java.type('java.net.URI');
    const Servlet = Java.type('jakarta.servlet.Servlet');
    let codeSource, servletApiPath, libDir;

    try {
      codeSource = Servlet.class.getProtectionDomain().getCodeSource();
      if (codeSource) {
        servletApiPath = new URI(codeSource.getLocation().toString()).getPath();
        libDir = new File(servletApiPath).getParent();
        if (libDir.endsWith('lib')) {
          return libDir;
        }
      }
    } catch (e) {
      return null;
    }
  }
  /**
   * Scan classes in directory. @priv
   * @param {File} dir directory.
   * @param {String} packagePrefix Package prefix.
   */
  scanDirectory(dir, packagePrefix) {
    let files = dir.listFiles();
    if (!files) return;

    let me = this, subPackage, fileName, className, findClsDot = me.findClsDot, clsLength = me.clsLength, prefixOnly;

    prefixOnly = findClsDot == '.';
    files.forEach(file => {
      fileName = file.getName();
      if (file.isDirectory()) {
        subPackage = packagePrefix ? `${packagePrefix}.${fileName}` : fileName;
        me.scanDirectory(file, subPackage);
      } else if (fileName.endsWith('.jar')) {
        me.scanJarFile(file);
      } else if (fileName.endsWith('.jmod')) {
        me.scanJmodFile(file);
      } else if (fileName.endsWith('.class')) {
        className = packagePrefix ? `${packagePrefix}.${fileName}` : fileName;
        if (!className.includes('$') && (prefixOnly || className.startsWith(findClsDot))) {
          if (prefixOnly)
            className = className.firstItem('.');
          else
            className = className.substr(clsLength).firstItem('.');
          if (!me.existsNames[className]) {
            me.existsNames[className] = 1;
            me.result.push({ label: className, kind: 5 });
          }
        }
      }
    });
  }
  /**
   * Scan classes in jar file. @priv
   * @param {File} file jar file.
   */
  scanJarFile(file) {
    let entries, entry, name, className, me = this, findClsDot = me.findClsDot, clsLength = me.clsLength, prefixOnly,
      jar = new me.JarFile(file);

    try {
      prefixOnly = findClsDot == '.';
      entries = jar.entries()
      while (entries.hasMoreElements()) {
        entry = entries.nextElement();
        name = entry.getName();
        if (name.endsWith('.class')) {
          className = name.replaceAll('/', '.');
          if (!className.includes('$') && (prefixOnly || className.startsWith(findClsDot))) {
            if (prefixOnly) {
              className = className.firstItem('.');
              if (className.includes('-'))
                return;
            } else {
              className = className.substr(clsLength).firstItem('.');
            }
            if (!me.existsNames[className]) {
              me.existsNames[className] = 1;
              me.result.push({ label: className, kind: 5 });
            }
          }
        }
      }
    } catch (e) {
    } finally {
      jar.close();
    }
  }
  /**
   * Scan classes in jmod file. @priv
   * @param {File} file Jmod file.
   */
  scanJmodFile(file) {
    let path, fs, classesPath, stream, iterator, entry, entryPath, className, me = this,
      findClsDot = me.findClsDot, clsLength = me.clsLength, prefixOnly;

    try {
      prefixOnly = findClsDot == '.';
      path = me.Paths.get(file.toURI());
      fs = me.FileSystems.newFileSystem(path);
      classesPath = fs.getPath('/classes');
      if (me.Files.exists(classesPath) && me.Files.isDirectory(classesPath)) {
        stream = me.Files.walk(classesPath);
        try {
          iterator = stream.iterator();
          while (iterator.hasNext()) {
            entry = iterator.next();
            entryPath = entry.toString();
            if (entryPath.endsWith('.class')) {
              className = classesPath.relativize(entry).toString().replaceAll('/', '.');
              if (!className.includes('$') && (prefixOnly || className.startsWith(findClsDot))) {
                if (prefixOnly) {
                  className = className.firstItem('.');
                  if (className.includes('-'))
                    return;
                } else {
                  className = className.substr(clsLength).firstItem('.');
                }
                if (!me.existsNames[className]) {
                  me.existsNames[className] = 1;
                  me.result.push({ label: className, kind: 5 });
                }
              }
            }
          }
        } finally {
          stream.close();
        }
      }
    } finally {
      fs.close();
    }
  }
}
/**
 * AI generator for auto creating files.
 */
Cls['Wb.ide.AIGenerator'] = class ideAiGenerator extends Wb.Base {
  /**
   * Auto generate and create files.
   * @param {String[]} hisList User prompt history list.
   * @param {String} msg Current upload message.
   * @param {String} [files] Current upload files. 
   * @param {Wb.File} baseFolder Base folder.
   * @param {Boolean} overwrite Whether to overwrite existing files.
   * @return {Object} Created result:{files, answer}.
   */
  static create(hisList, msg, files, baseFolder, overwrite) {
    const aiUserRole = Wb.getConfig('sys.ai.userRole');
    const aiAssistantRole = Wb.getConfig('sys.ai.assistantRole');
    const aiSystemRole = Wb.getConfig('sys.ai.systemRole');
    const openAiFormat = Wb.getConfig('sys.ai.imageFormat') == 'openai';
    const compressImage = Wb.getConfig('sys.ai.compressImage');
    let me = this, configs, value, result, file, promptData, filename, modulePath, dbName, role, currentList, isImage, conn;

    conn = Wb.getConn();
    dbName = conn.dbName;
    conn.close();
    value = Wb.getConfig('sys.ai.model');
    if (!value) {
      Wb.raise('Config item "sys.ai.model" is not specified.');
    }
    file = Wb.getConfig('sys.ai.knowledgeFile');
    if (file.startsWith(':'))
      file = new Wb.File(true, file.slice(1));
    else
      file = new Wb.File(file);
    configs = Wb.decode(value);
    configs.resultType = 'text';
    modulePath = baseFolder.modulePath;
    promptData = [{
      role: aiSystemRole, content: file.text +
        '\n#RUNTIME CONFIG\nDefault Language:' + Str.lang +
        '\nCurrent UI theme:' + (Wb.get('sys.theme') || Wb.getConfig('sys.theme')) +
        '\nCURRENT DATABASE TYPE:' + dbName + (dbName?.toLowerCase().includes('derby') ?
          '.Derby paging SQL:offset {?bigint|_from?} rows fetch first {?bigint|_size?} rows only' : '') +
        '\nMAIN XWL FILES UNDER:' + (modulePath ? modulePath : '[ROOT FOLDER]') +
        ',OTHER FILES UNDER:' + (modulePath ? (modulePath + '/') : '') + '[MAIN XWL FILENAME without .xwl]'
    }];
    hisList?.each(obj => {
      filename = obj.file_name;
      isImage = Wb.isImageFile(filename);
      if (isImage) {
        if (compressImage) {
          filename = Wb.getNormalName(filename) + '.jpg';
          obj.msg = SysUtil.compressToJpg(obj.msg);
        }
        obj.msg = me.addImageHeader(obj.msg, filename);
      } else if (obj.is_bin) {
        obj.msg = StringUtil.decodeBase64Text(me.getBase64(obj.msg));
      }
      role = obj.msg_type < 6 ? aiUserRole : aiAssistantRole;
      if (isImage && openAiFormat) {
        promptData.push({
          role,
          content: [
            { type: 'text', text: filename },
            {
              type: 'image_url',
              image_url: { url: obj.msg }
            }]
        });
      } else if (obj.msg != '(Parse image)') {
        promptData.push({ role, content: (filename ? ('[' + filename + ']: ') : '') + obj.msg });
      }
    });
    currentList = [];
    promptData.push({ role: aiUserRole, content: currentList });
    if (msg) {
      if (openAiFormat) {
        currentList.push({ type: 'text', text: msg });
      } else {
        currentList.push(msg);
      }
    }
    files?.each(file => {
      filename = file.name;
      isImage = Wb.isImageFile(filename);
      file = file.content;
      if (isImage) {
        if (compressImage) {
          filename = Wb.getNormalName(filename) + '.jpg';
          file = SysUtil.compressToJpg(file);
        }
        file = me.addImageHeader(file, filename);
      } else {
        file = StringUtil.decodeBase64Text(me.getBase64(file));
      }
      if (isImage && openAiFormat) {
        currentList.push(
          { type: 'text', text: filename },
          {
            type: 'image_url',
            image_url: { url: file }
          });
      } else {
        if (filename)
          filename = '[' + filename + ']: ';
        else
          filename = '';
        if (openAiFormat) {
          currentList.push({ type: 'text', text: filename + file });
        } else {
          currentList.push(filename + file);
        }
      }
    });
    value = Wb.getConfig('sys.ai.inputPath');
    if (!value) {
      Wb.raise('Config item "sys.ai.inputPath" is not specified.');
    }
    me.setValueByPath(configs, value, promptData);
    //  result = '␞⁂test/aa.xwl|{"title":"","icon":"","img":"","tags":"","hideInMenu":"false","text":"module","cls":"Wb.Module",' +
    //    '"properties":{"cid":"module"},"_icon":"module","_expanded":true}';
    result = Wb.fetch(configs);
    if (result.code < 200 || result.code >= 300) {
      Wb.raise('HTTP ' + result.code + ': ' + result.result);
    }
    result = Wb.decode(result.result);
    value = Wb.getConfig('sys.ai.outputPath');
    if (!value) {
      Wb.raise('Config item "sys.ai.outputPath" is not specified.');
    }
    result = me.getValueByPath(result, value);
    result = result.trim();
    return me.parseResult(result, baseFolder, overwrite);
  }
  /**
   * Create files from response text. @priv
   * @param {String} text Response text.
   * @param {Wb.File} baseFolder Base folder.
   * @param {Boolean} overwrite Whether to overwrite existing files.
   * @return {Object} Created result: {files, answer}.
   */
  static parseResult(text, baseFolder, overwrite) {
    let me = this, path, content, file, isBin, answer = '', files = [];

    if (!text.startsWith('␞⁂'))
      return { files, answer: text || '(No result)' };
    text.substr(2).split('␞⁂').each((item, index) => {
      item = item.trim();
      path = item.firstItem('|');
      if (path.startsWith('?')) {
        if (answer)
          answer += '\n';
        answer += item.afterItem('|');
        return;
      }
      isBin = path.startsWith('*');
      if (isBin)
        path = path.substr(1);
      file = new Wb.File(Wb.File.moduleFolder, path);
      if (!overwrite && file.exists) {
        Wb.raise(Str.alreadyExists.format(path));
      }
      content = item.afterItem('|');
      if (file.name.endsWith('.xwl')) {
        let val;
        try {
          val = Wb.toJs(JsonUtil.yamlToJson(content));
          me.fixXwl(val);
          content = JsonUtil.formatYaml(Wb.toJava(val).toMap());
        } catch (e) {
          LogUtil.error(e?.toString || 'Yaml format error');
        }
        file.text = content;
      } else {
        if (isBin)
          file.base64 = me.getBase64(content);
        else
          file.text = content;
      }
      file.clearBuffer();
      file.addIndex();
      if (baseFolder.contains(file.parent, true))
        file.parent.addIndex();
      files.push({ path, content, isBin });
    });
    return { files, answer };
  }
  /**
   * Fix XWL file. @priv
   * @param {Object} object Xwl object.
   */
  static fixXwl(object) {
    let me = this, props, cid;

    object.img ??= '';
    object.tags ??= '';
    object.hideInMenu ??= 'false';
    Wb.cascade([object], (item, parent) => {
      if (item.items)
        item._expanded = true;
      props = item.properties ??= {};
      Wb.each(props, (k, v) => {
        if (!Wb.isString(v))
          props[k] = String(v);
      });
      cid = props.cid;
      if (!cid) {
        if (parent)
          cid = me.getUniqueName(item.cls.lastItem('.'), parent.items?.map(item => item.properties?.cid));
        else
          cid = 'module';
        props.cid = cid;
      }
      item.text = cid;
    });
  }
  /**
   * Generates a unique name with auto-incremented suffix
   * @param {String} name Original name
   * @param {String[]} names Array of existing names
   * @return {String} Unique name with lowercase first letter and numeric suffix
   */
  static getUniqueName(name, names) {
    const base = name.charAt(0).toLowerCase() + name.slice(1);
    let uniqueName, index = 1;

    do {
      uniqueName = `${base}${index}`;
      index++;
    } while (names.includes(uniqueName));
    return uniqueName;
  }
  /**
   * Add image header. @priv
   * @param {String} data Base64 data.
   * @param {String} filename File name.
   * @return {String} Base64 data with image header.
   */
  static addImageHeader(data, filename) {
    if (data.startsWith('data:image/'))
      return data;
    return 'data:image/' + Wb.getFileExt(filename) + ';base64,' + data;
  }
  /**
   * Get base64 data.
   * @param {String} data Raw data.
   * @param {Boolean} decode Whether to decode.
   * @return {Object} Base64 part data.
   */
  static getBase64(data, decode) {
    if (data.startsWith('data:'))
      data = data.afterItem(',');
    if (decode)
      return StringUtil.decodeBase64(data);
    else
      return data;
  }
  /**
   * Get value by object path. @priv
   * @param {Object} obj Target object.
   * @param {String} path Path string.
   * @return {*} Target value.
   */
  static getValueByPath(obj, path) {
    this.pathRegexp ??= /\[(\w+)\]/g;
    return path.replace(this.pathRegexp, '.$1').split('.').filter(Boolean).reduce((target, key) => target?.[key], obj);
  }
  /**
   * Set value by object path. @priv
   * @param {Object} obj Target object.
   * @param {String} path Path string.
   * @param {*} value Value to set.
   */
  static setValueByPath(obj, path, value) {
    this.pathRegexp ??= /\[(\w+)\]/g;
    const keys = path.replace(this.pathRegexp, '.$1').split('.').filter(Boolean);
    let target = obj, i, key, nextKey, lastKey;

    for (i = 0; i < keys.length - 1; i++) {
      key = keys[i];
      if (!target[key]) {
        nextKey = keys[i + 1];
        target[key] = isNaN(nextKey) ? {} : [];
      }
      target = target[key];
    }
    lastKey = keys[keys.length - 1];
    target[lastKey] = value;
  }
}