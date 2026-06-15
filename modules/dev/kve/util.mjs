/**
 * KVE util.
 */
class Util {
  /**
   * Reloads the key-value data for the specified name. @priv
   * @param {String} keyName Key name
   */
  static loadKey(keyName) {
    let k, buffer;

    buffer = new HashMap();
    Wb.getRows({
      sql: 'select a.map_k,a.map_v,b.key_type from wb_key a, wb_key_type b where a.rid=b.sid and b.key_name={?keyName?}',
      params: { keyName },
      fn(row) {
        k = row.map_k;
        buffer.put(row.key_type ? parseInt(k) || 0 : k, row.map_v);
      }
    });
    if (buffer.isEmpty())
      KVBuffer.buffer.remove(keyName);
    else
      KVBuffer.buffer.put(keyName, buffer);
  }
}
export default Util;