// Dialog server util
class Util {
  /**
   * Select the specified full data from it's ids.
   * @param {Array} ids ids list.
   * @param {String} sql SQL clause.
   * @return {Array} Data list.
   */
  static getData(ids, sql) {
    let i, j = ids.length, isLess, sid, where = '', name, row, dataMap = {}, result = [];

    isLess = j < 100;
    for (i = 0; i < j; i++) {
      name = 'p' + i;
      sid = ids[i];
      if (isLess) {
        if (i > 0)
          where += ',';
        where += '{?' + name + '?}';
        Params[name] = sid;
      }
      dataMap[sid] = true;
    }
    if (isLess)
      sql += ' where sid in (' + where + ')';
    Wb.getRows(sql, row => {
      sid = row.sid;
      if (dataMap[sid])
        dataMap[sid] = row;
    });
    ids.forEach(id => {
      row = dataMap[id];
      if (row !== true)
        result.push(row);
    });
    return result;
  }
}
export default Util;