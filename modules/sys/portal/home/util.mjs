/**
 * Home util.
 */
class Util {
  /**
   * Check whether the current user has logged in, it will send a login page if not. It will
   * automatically log in as user "admin" for "demo" mode.
   * @return {Boolean} {{true}} The user is logged in, {{false}} otherwise.
   */
  static checkLogin() {
    if (WebUtil.isLogined(request)) {
      return true;
    } else {
      if (Config.isDemo) {
        Wb.execute('verify', { username: 'admin', password: 'admin' });
        return true;
      } else {
        return Wb.checkLogin();
      }
    }
  }
  /**
   * Get available theme list.
   * @return {String[]} Theme list.
   */
  static getThemeList() {
    let files = new Wb.File(true, 'wb/css').items, name, themes = [];
    files.forEach(file => {
      name = file.name;
      if (name.endsWith('-wb.css')) {
        themes.push(name.slice(0, -7))
      }
    });
    themes.sort();
    return themes;
  }
  /**
   * Get theme menu items.
   * @param {String} currentTheme Current used theme.
   * @return {Array} Theme menu items.
   */
  static getThemeItems(currentTheme) {
    let themeItems = [], themeList = this.getThemeList();

    themeList.forEach(item => {
      themeItems.push({ text: Str[item + 'Theme'] || item, theme: item, checked: item == currentTheme, checkGroup: 'theme' })
    });
    if (themeItems.length)
      themeItems.push('-');
    themeItems.push({ text: Str.moreTheme, theme: '?' });
    return themeItems;
  }

  /**
   * Whether to show password dialog.
   * @return {Boolean} {{true}} to show, {{false}} otherwise.
   */
  static isShowPwdDialog() {
    if (Config.isDemo || Wb.userid != 'admin')
      return false;
    let row = Wb.getRow("select * from wb_user where sid='admin' and login_times=1");
    return !!row;
  }
  /**
   * Get desktop data.
   * @return {Object} Desktop data or undefined if not found.
   */
  static getDesktopData() {
    let data = Wb.getResource(['desktop', 'desktop'], [null, 'system']), hasVisible, items, strTitle;

    data = data[0] ?? data[1];
    if (data) {
      items = data.items;
      items.forEach((item, index) => {
        hasVisible ||= item.visible;
        Wb.apply(item, { prepend: true, closable: true, allowRefresh: true });
        strTitle = item.strTitle;
        if (strTitle)
          item.title = Str[strTitle];
      });
      if (items.length && !hasVisible)
        items[0].visible = true;
    }
    return {
      moduleItems: items ? Wb.encode(items).slice(1, -1) : null,
      treeVisible: data?.treeVisible ?? true,
      showNavBar: data?.showNavBar ?? false,
      treeWidth: Wb.encode(data?.treeWidth ?? '20em'),
      moduleTree: Wb.encode(this.getModules(data?.expandNodes)),
    };
  }
  /**
   * Get licensee text.
   * @return {String} Licensee text or null if not found.
   */
  static getLicensee() {
    const key = 'Licensee:';
    let file = new Wb.File(true, 'wb/system/license.txt');

    if (file.exists) {
      let s = file.text, p = s.indexOf(key);
      if (p > 0)
        return s.substring(p + key.length, s.indexOf('\n', p)).trim();
    }
    return null;
  }
  /**
   * Gets the list of displayed modules.
   * @param {Array} expandNodes Nodes to expand.
   */
  static getModules(expandNodes) {
    const touchDevice = ['mobile', 'android', 'iphone', 'ipad'];
    let fs = Wb.load('wb/modules/sys/file/fs.mjs'), path = Params.path, modulePath, items, isRoot, agent, moduleDir,
      moduleFolder = Wb.File.moduleFolder, isDemo = Config.isDemo;

    modulePath = moduleFolder.path;
    moduleDir = modulePath + '/';
    if (path) {
      path = moduleDir + path;
      if (!moduleFolder.contains(new Wb.File(path)))
        Wb.accessDenied(path);
    } else {
      isRoot = true;
      path = modulePath;
    }
    agent = request.getHeader('User-Agent')?.toLowerCase() || '';
    items = fs.listFiles(path, 'home', null, null, true, touchDevice.some(name => agent.includes(name)));
    if (expandNodes && !isDemo) {
      items.forEach(item => {
        if (!item._leaf && expandNodes.includes(item.strTitle || item.text)) {
          item._expanded = true;
          item.items = fs.listFiles(moduleDir + item.path, 'home', null, null, true);
        }
      });
    } else {
      if (isDemo || isRoot && items.length <= Wb.getConfig('sys.app.homeExpandNodes')) {
        items.forEach(item => {
          if (!item._leaf && (!isDemo || item.strTitle == 'example')) {
            item._expanded = true;
            item.items = fs.listFiles(moduleDir + item.path, 'home', null, null, true);
            if (isDemo) {
              let node = item.items[0];
              node._expanded = true;
              node.items = fs.listFiles(moduleDir + node.path, 'home', null, null, true);
            }
          }
        });
      }
    }
    return items;
  }
}
export default Util;