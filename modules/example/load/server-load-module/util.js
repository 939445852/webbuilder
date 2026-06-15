Cls['My.Util'] = class myUtil {
  /**
   * Perform add.
   * @param {Number} value1 Value 1
   * @param {Number} value2 Value 2
   * @return {Number} The result
   */
  static add(value1, value2) {
    return value1 + value2;
  }
}
Wb.log('util.js only load once.');