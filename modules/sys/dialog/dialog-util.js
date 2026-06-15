// Dialog client util
Cls['Wb.module.dialog.Util'] = class {
  /**
   * Show role select window.
   * @param {Object} app The module scope.
   * @param {String} path The module path.
   * @param {Function} fn Callback function.
   * @param {Array} .ids The new selected ids list.
   * @param {Wb.Window} .win The edit window.
   * @param {String/Array} [ids] The old ids list.
   * @param {String} [subTitle] Window sub title.
   * @param {Boolean} [multiSelect] Whether is multiple select.
   * @param {Boolean} [required] Whether is required.
   */
  static getValue(app, path, fn, ids, subTitle, multiSelect, required) {
    let win = app.window1, selectComp = app.select1, doGet;

    doGet = f => {
      win.okHandler = f => {
        let value = selectComp.value;
        fn?.(value, win);
      }
      win.show();
      win.center();
    }
    if (ids) {
      ids = Wb.toArray(ids);
    }
    win.subTitle = subTitle;
    win.width = multiSelect ? '80em' : '40em';
    selectComp.required = !!required;
    selectComp.multiSelect = multiSelect;
    if (multiSelect)
      selectComp.tagWidth = 'calc(100% - 18em)';
    win.layout = multiSelect ? 'fit' : 'grid1';
    if (ids?.length) {
      if (!multiSelect)
        ids = [ids[0]];
      Wb.ajax({
        url: path + '/get-data',
        params: { ids },
        json: true,
        success(resp) {
          selectComp.value = multiSelect ? resp : resp[0];
          doGet();
        }
      });
    } else {
      selectComp.value = null;
      doGet();
    }
  }
}