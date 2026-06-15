/**
 * Dictionary util.
 */
class Util {
  /**
   * Checks whether the specified group name and dictionary name exist. If exist an exception thrown. @priv
   * @param {String} name Dict name.
   * @param {String} [groupName] Group name.
   * @param {String} [id] Primary key when in edit mode.
   */
  static checkDuplicate(name, groupName, id) {
    let condi = [], row;

    if (id) {
      Wb.set('_sid', id);
      condi.push('sid<>{?_sid?}');
    }
    Wb.set('_name', name);
    condi.push('name={?_name?}');
    if (groupName) {
      Wb.set('_groupName', groupName);
      condi.push('group_name={?_groupName?}');
    } else {
      condi.push("(group_name is null or group_name='')");
    }
    row = Wb.getRow('select 1 from wb_dict where ' + condi.join(' and '));
    if (row)
      Wb.raise(Str.alreadyExists.format(groupName ? (groupName + '.' + name) : name));
  }
  /**
   * Clear the specified dict buffer data @priv
   * @param {Array} rows Clear rows
   */
  static clearBuffer(rows) {
    let buffer = DictCls.buffer, groupName, name;
    rows.forEach(row => {
      name = row.name;
      groupName = row.group_name;
      if (groupName)
        name = groupName + '.' + name;
      buffer.remove(name);
      row.alias?.splitTrim().forEach(item => {
        if (item) {
          name = item;
          if (groupName)
            name = groupName + '.' + name;
          buffer.remove(name);
        }
      });
    });
  }
  /**
   * Update dict db data to the buffer. @priv
   * @param {Boolean} [isEdit] whether is edit mode.
   */
  static updateBuffer(isEdit) {
    let rs = Wb.sqlRS('select * from wb_dict where sid={?' + (isEdit ? '$' : '') + 'sid?}').resultSet;

    rs.next();
    DictCls.updateData(rs, null);
  }
}
export default Util;