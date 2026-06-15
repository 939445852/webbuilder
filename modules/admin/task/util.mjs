/**
 * Task util.
 */
class Util {
  /**
   * Get fire time of the specified job. @priv
   * @param {String} id The job id.
   * @return {Object} Fire time data.
   */
  static getFireTime(id) {
    let trigger = JobUtil.findTrigger(id);

    return {
      previous_time: Date.from(trigger?.getPreviousFireTime()) ?? null,
      next_time: Date.from(trigger?.getNextFireTime()) ?? null
    };
  }
}
export default Util;