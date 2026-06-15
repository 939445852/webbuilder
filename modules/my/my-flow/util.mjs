/**
 * My flow util.
 */
class Util {
  /**
   * Get the form file from workflow. @priv
   * @param {Object} flow Workflow instance.
   * @param {String} type Form type.
   * @return {String} Form file.
   */
  static getForm(flow, type) {
    let startForm = flow.getProperty('startForm'),
      handleForm = flow.getProperty('handleForm'),
      viewForm = flow.getProperty('viewForm');
    switch (type) {
      case 'start':
        return startForm || handleForm || viewForm;
      case 'handle':
        // back to start
        if (flow.activeNode.data.nodeType == 'start')
          return startForm || handleForm || viewForm;
        else
          return handleForm || viewForm || startForm;
      case 'view':
        return viewForm || handleForm || startForm;
    }
  }
  /**
   * Do the specified action on the workflow. @priv
   * @param {String} action Action name.
   */
  static doAction(action) {
    let flow, result, before, after, newUser, title = Params.flowTitle, actionModule;

    Wb.startTrans();
    if (action == 'start') {
      let file = Params.flowTplFile;
      flow = new Wb.Workflow({ file, title: title || file.slice(0, -4) });
    } else
      flow = new Wb.Workflow({ flowId: Params.flowId, title });
    Wb.run(this.getForm(flow, action == 'start' ? 'start' : 'handle'));
    app.action = action;
    app.flow = flow;
    before = app.beforeAction?.(action, flow);
    actionModule = flow.getProperty('beforeAction');
    if (actionModule)
      before ??= Wb.run(actionModule);
    newUser = Params._newUser;
    switch (action) {
      case 'start':
        result = flow.start();
        break;
      case 'pass':
        result = flow.pass();
        break;
      case 'reject':
        result = flow.reject();
        break;
      case 'back':
        result = flow.back(Params._backNode);
        break;
      case 'transfer':
        result = flow.transfer(newUser);
        break;
      case 'signBefore':
        result = flow.signBefore(newUser);
        break;
      case 'signAfter':
        result = flow.signAfter(newUser);
        break;
    }
    after = app.afterAction?.(action, flow);
    actionModule = flow.getProperty('afterAction');
    if (actionModule)
      after ??= Wb.run(actionModule);
    Wb.send({ result, before, after });
  }
}
export default Util;