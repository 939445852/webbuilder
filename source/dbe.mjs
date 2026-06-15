/**
 * Database explorer utilities.
 * @class $path
 */
class DBE {
  /** @property {Array} - No length data type. */
  static noSizeTypes = [
    Types.TIMESTAMP, Types.DATE, Types.TIME, Types.CLOB, Types.NCLOB, Types.BLOB,
    Types.LONGVARBINARY, Types.LONGVARCHAR, Types.LONGNVARCHAR];
  /**
   * Get a list of all accessible database names.
   * @param {Boolean} [leaf] whether the database name is a leaf node.
   * @return {Array} dt list.
   */
  static getDbNames(leaf) {
    const type = 'db';
    let rows = [], defaultItem, defaultSource = Config.defaultSource, source;

    source = new Wb.File(true, 'wb/system/db/source.json').object;
    Wb.each(source, k => {
      rows.push({ text: k, db: k, type, _icon: 'database', _leaf: leaf });
    });
    rows.mixSort('text');
    //Move default database to the top
    defaultItem = rows.find(item => item.text == defaultSource);
    defaultItem._icon = 'favorite';
    rows.remove(defaultItem);
    rows.insert(0, defaultItem);
    return rows;
  }
  /**
   * Get schem list.
   * @return {Array} schem list.
   */
  static getSchemas(db) {
    let schem, rows = [], rs = Wb.getConn(db).metaData.getSchemas();

    if (rs) {
      try {
        while (rs.next()) {
          schem = rs.getString(1);
          rows.push({ text: schem, schem, _icon: 'list-view', type: 'schem' })
        }
      } finally {
        rs.close();
      }
    }
    if (rows?.length)
      return rows.lowerSort('text');
    else
      return this.getCategory(db);
  }
  /**
   * Get category list.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {Number} mode 1: hide func. 2: show table only. default show all.
   * @return {Array} category
   */
  static getCategory(db, schem, mode) {
    let me = this, cateNode = true, result;
    result = [
      {
        text: Str.table, type: 'tableCate', cateNode, _icon: 'table',
        items: me.getTables(db, schem, false, true) ? undefined : []
      }];
    if (mode != 2) {
      result.push({
        text: Str.dbView, type: 'viewCate', cateNode, _icon: 'viewport',
        items: me.getTables(db, schem, true, true) ? undefined : []
      }, {
        text: Str.proc, type: 'procCate', cateNode, _icon: 'data-provider',
        items: me.getProcs(db, schem, true) ? undefined : []
      });
      if (mode != 1)
        result.push({
          text: Str.func, type: 'funcCate', cateNode, _icon: 'function',
          items: me.getFuncs(db, schem, true) ? undefined : []
        });
    }
    return result;
  }
  /**
   * Gets the name part of the string. @priv
   * @param {String} str string.
   * @return {String} name.
   */
  static extractName(str) {
    let pos = str.indexOf(';');
    return pos == -1 ? str : str.substr(0, pos);
  }
  /**
   * Get Table List.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {Boolean} [isView] whether to get view.
   * @param {Boolean} [checkExists] checking presence only.
   * @return {Array/Boolean} tables or whether table exist.
   */
  static getTables(db, schem, isView, checkExists) {
    let rows = [], _icon, type, tableName,
      rs = Wb.getConn(db).metaData.getTables(null, schem, null, [isView ? 'VIEW' : 'TABLE']);

    try {
      if (isView) {
        _icon = 'viewport';
        type = 'view';
      } else {
        _icon = 'table';
        type = 'table';
      }
      while (rs.next()) {
        if (checkExists)
          return true;
        tableName = rs.getString(3);
        rows.push({ text: tableName, _icon, tableName, type, subText: rs.getString(5) });
      }
    } finally {
      rs.close();
    }
    return checkExists ? false : rows.lowerSort('text');
  }
  /**
   * Get a list of fields.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {String} tableName table name.
   * @param {Boolean} fetchIndex whether to get index.
   * @return {Array} columns list.
   */
  static getColumns(db, schem, tableName, fetchIndex) {
    let rows = [], index = 1, decimal, subText, size, remarks, colName, pkColNames = [], pkIndexName, rs, _icon, metaData;

    metaData = Wb.getConn(db).metaData;
    if (fetchIndex) {
      //Get PK name
      rs = metaData.getPrimaryKeys(null, schem, tableName);
      try {
        while (rs.next()) {
          pkColNames.push(DbUtil.lowercase(rs.getString(4)));
          pkIndexName ??= rs.getString(6);
        }
      } finally {
        rs.close();
      }
    }
    rs = metaData.getColumns(null, schem, tableName, null);
    try {
      while (rs.next()) {
        subText = rs.getString(6);
        //If field length is not included and the type is not specified
        if (!this.noSizeTypes.includes(rs.getInt(5)) && !subText.includes('(')) {
          size = rs.getInt(7);
          if (size > 0) {
            subText += '(' + size;
            decimal = rs.getInt(9);
            if (decimal > 0)
              subText += ', ' + decimal;
            subText += ')';
          }
        }
        //Display comments need to be configured in the connection properties: remarks=true
        remarks = rs.getString(12);
        if (remarks)
          subText += ' ' + remarks;
        colName = DbUtil.lowercase(rs.getString(4));
        if (pkColNames.includes(colName))
          _icon = 'key';
        else
          _icon = rs.getInt(11) ? 'item' : 'ok';//required
        rows.push({
          text: colName,
          colName,
          subText,
          fieldIndex: index++,
          _icon,
          type: 'field',
          _leaf: true
        })
      }
    } finally {
      rs.close();
    }
    if (fetchIndex) {
      let items = this.getIndex(db, schem, tableName, pkIndexName);
      if (items.length)
        rows.push(...items);
    }
    return rows;
  }
  /**
   * Get a list of indexes.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {String} tableName table name.
   * @param {String} pkIndexName PK index name.
   * @return {Array} Index list.
   */
  static getIndex(db, schem, tableName, pkIndexName) {
    let indexItems = [], indexFields = [], rs, indexName, columnName, noneUnique, desc;

    rs = Wb.getConn(db).metaData.getIndexInfo(null, schem, tableName, false, false);
    try {
      while (rs.next()) {
        columnName = DbUtil.lowercase(rs.getString(9));
        if (!columnName)
          continue;
        indexName = rs.getString(6);
        if (indexName == pkIndexName)
          continue;
        noneUnique = Wb.parseBool(rs.getString(4));
        desc = rs.getString(10) == 'D';
        indexFields = indexItems.find(f => f.indexName == indexName)?.items;
        if (!indexFields) {
          indexFields = [];
          indexItems.push({
            text: indexName, indexName, _icon: noneUnique ? 'check1' : 'check10',
            type: 'indexName', items: indexFields
          });
        }
        indexFields.push({
          text: columnName, columnName, _icon: desc ? 'sort2' : 'sort1',
          type: 'indexField', _leaf: true,
        });
      }
    } finally {
      rs.close();
    }
    return indexItems;
  }
  /**
   * Get a list of procs.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {Boolean} [checkExists] checking presence only.
   * @return {Array/Boolean} procs or whether proc exist.
   */
  static getProcs(db, schem, checkExists) {
    let rows = [], procName, rs = Wb.getConn(db).metaData.getProcedures(null, schem, null);

    try {
      while (rs.next()) {
        if (checkExists)
          return true;
        procName = this.extractName(rs.getString(3));
        rows.push({
          text: procName, _icon: 'data-provider', procName, type: 'proc', subText: rs.getString(7),
          items: this.getProcColumns(db, schem, procName, true) ? undefined : []
        });
      }
    } finally {
      rs.close();
    }
    return checkExists ? false : rows.lowerSort('text');
  }
  /**
   * Get a list of process columns.
   * @param {String} db database name.
   * @param {String} schem schem name.
   * @param {String} procName procedure name.
   * @param {Boolean} [checkExists] checking presence only.
   * @return {Array/Boolean} proc columns or whether proc exist.
   */
  static getProcColumns(db, schem, procName, checkExists) {
    let rows = [], colName, colType, _icon, subText, size, decimal, remarks, text,
      rs = Wb.getConn(db).metaData.getProcedureColumns(null, schem, procName, null);

    try {
      while (rs.next()) {
        if (checkExists)
          return true;
        subText = rs.getString(7);
        //If field length is not included and the type is not specified
        if (!this.noSizeTypes.includes(rs.getInt(6)) && !subText.includes('(')) {
          size = rs.getInt(8);
          if (size > 0) {
            subText += '(' + size;
            decimal = rs.getInt(10);
            if (decimal > 0)
              subText += ', ' + decimal;
            subText += ')';
          }
        }
        remarks = rs.getString(13);
        if (remarks)
          subText += ' ' + remarks;
        colName = rs.getString(4);
        colType = rs.getInt(5);
        text = colName;
        switch (colType) {
          //unknows
          case 0:
            _icon = 'help2';
            break;
          // IN parameter
          case 1:
            _icon = 'import';
            break;
          // INOUT parameter
          case 2:
            _icon = 'item';
            break;
          //result column in ResultSet
          case 3:
            _icon = 'data';
            if (!text)
              text = '(result)';
            break;
          //OUT parameter
          case 4:
            _icon = 'export';
            break;
          //return value
          case 5:
            _icon = 'external-link';
            if (!text)
              text = '(return)';
            break;
        }
        rows.push({
          text, _icon, _leaf: true, colName, colType, type: 'procCol', subText
        });
      }
    } finally {
      rs.close();
    }
    return checkExists ? false : rows;
  }
  /**
   * Get a list of functions.
   * @param {String} db Database name.
   * @param {String} schem schem name.
   * @param {Boolean} [checkExists] checking presence only.
   * @return {Array/Boolean} funcs or whether function exist.
   */
  static getFuncs(db, schem, checkExists) {
    let rows = [], funcName, meta, remarksColIndex,
      rs = Wb.getConn(db).metaData.getFunctions(null, schem, null);

    try {
      meta = rs.getMetaData();
      //use field index better than name, sql server: 7
      remarksColIndex = meta.getColumnLabel(4).toUpperCase() == 'REMARKS' ? 4 : 7;
      remarksColIndex
      while (rs.next()) {
        if (checkExists)
          return true;
        funcName = this.extractName(rs.getString(3));
        rows.push({
          text: funcName, _icon: 'function', funcName, type: 'func', subText: rs.getString(remarksColIndex),
          items: this.getProcColumns(db, schem, funcName, true) ? undefined : []
        });
      }
    } finally {
      rs.close();
    }
    return checkExists ? false : rows.lowerSort('text');
  }
}
export default DBE;