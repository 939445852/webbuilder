/**
 * Role util.
 */
class Util {
  /**
   * Determines whether the specified role is a reserved role.
   * @return {Boolean} true means reserved role, false means non-reserved role.
   */
  static isReservedRole(role) {
    const roles = ['admin', 'default'];
    return roles.includes(role);
  }
}
export default Util;