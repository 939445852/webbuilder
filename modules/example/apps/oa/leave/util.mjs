/**
 * Leave app util.
 */
class Util {
  /**
   * Check whether the workflow has been processed, if process then throw exception.
   */
  static checkProcess() {
    if (Wb.getRecord('select count(*) from wb_flow_user where flow_id={?flowId?} and status>1')?.[0] > 1)
      Wb.raise('The application has been processed and cannot be modified.');
  }
}
export default Util;