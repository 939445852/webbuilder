/**
 * Workflow utility, used for creating, querying, and interacting with workflows.
 */
Cls['Wb.Workflow'] = class workflow extends Wb.Base {
  /** @property {Wb.File} - Workflow base folder. @priv */
  static baseFolder = new Wb.File(true, 'wb/system/resource/flow');
  /** @property {Object} flow Workflow template JSON data. @readonly */
  /** @property {String} flowId Workflow instance id. @readonly */
  /** @property {Object} data Workflow root node data. @readonly */
  /** @property {String} userid The user id of initiates the workflow. @readonly */
  /** @property {Boolean} isNew Whether the workflow instance is a new instance. @readonly */
  /** @property {String} title Workflow title. @readonly */
  /** @property {Date} startTime The date of initiates the workflow. @readonly */
  /** @property {Date} handleTime The date of handle the workflow. @readonly */
  /** @property {Array} users All users of current workflow. Only available in existing workflow. @readonly */
  /** @property {String} handleUser Handle user id. @readonly */
  /** @property {Object} activeNode The current active node. */
  /** @property {Object} beforeNode The active node before performing any actions. */
  /** @property {Number} status The status of current workflow. @readonly */
  /** @property {Number} userStatus The status of current user. @readonly */
  /** @property {Number} userType The type of current user. @readonly */
  /** @property {String} userNodeName The node name of current user. @readonly */
  /** @property {Object} extraParams Workflow extra params values. @priv */
  /** @property {Array} cells Workflow cells. @priv */
  static protos = {
    /** @property {Object} - User status values. */
    statusType: { unread: 0, read: 1, pass: 2, reject: 3, back: 4, transfer: 5, signBefore: 6, signAfter: 7, backed: 8 }
  };
  /**
   * Create a new workflow instance.
   * @param {Object} configs Configs object.
   * @param {String} [.file] Workflow template file. When initiate a new workflow, it is required.
   * @param {String} [.userid] Handle user id. Defaults to current user id.
   * @param {String} [.dispname] Handle user display name. Only available in initiate a new
   * workflow. Defaults to current user display name.
   * @param {String} [.title] Workflow title.
   * @param {String} [.flowId] Workflow id. When open an exists workflow, it is required.
   * @param {Object} [.params] Workflow extra params.
   */
  constructor(configs) {
    let me, flowId, handleUser;

    super(configs);
    me = this;
    flowId = configs.flowId;
    me.extraParams = configs.params;
    handleUser = me.handleUser = configs.userid ?? Wb.userid;
    if (flowId) {
      // open exists
      let row;

      me.isNew = false;
      me.flowId = flowId;
      row = Wb.getRow({
        sql: 'select start_time,user_id,title,status,node_name,tpl_file from wb_flow where sid={?flowId?}',
        params: { flowId }
      });
      if (!row)
        Wb.raise('Workflow instance "' + flowId + '" does not exist.');
      me.file = row.tpl_file;
      me.openFlow();
      me.activeNode = me.beforeNode = me.findNodeByName(row.node_name);
      if (!me.activeNode)
        Wb.raise('The current node has been deleted.');
      me.loadUsers();
      me.startTime = row.start_time;
      me.handleTime = new Date();
      me.userid = row.user_id;
      me.status = row.status;
      me.title = configs.title || row.title;
    } else {
      // Create new one
      let startNode, cells;

      me.isNew = true;
      me.startTime = new Date();
      // let handle time later than start time for select order processing
      me.handleTime = me.startTime.addSecond(1);
      me.file = configs.file;
      me.openFlow();
      me.flowId = Wb.getId();
      me.status = 1;
      me.title = configs.title;
      me.userid = handleUser;
      me.dispname = configs.dispname ?? Wb.dispname;
      cells = me.cells;
      if (!cells || cells.filter(cell => cell.data.nodeType == 'start' && (startNode = cell)).length != 1)
        Wb.raise('Workflow "' + me.file + '" must have and only have one start node.');
      me.activeNode = me.beforeNode = startNode;
    }
  }
  /**
   * Open workflow template file. @priv
   */
  openFlow() {
    let me = this, baseFolder = me.constructor.baseFolder, file, flow;

    file = new Wb.File(baseFolder, me.file);
    if (!baseFolder.contains(file))
      Wb.accessDenied(filename);
    flow = me.flow = file.object;
    me.data = flow.data;
    me.cells = flow.cells;
  }
  /** @property {String} afterUser User to be handle after current user. @priv */
  /** @property {Boolean} isHandleUser Whether current handle user is a valid user of the current node. @priv */
  /** @property {Number} handleUserCt All handle users count of the current node. @priv */
  /** @property {Number} doneUserCt All done users count of the current node. @priv */
  /**
   * Load users data of the current workflow. @priv
   */
  loadUsers() {
    let me = this, userid = me.handleUser, rec,
      params = { flowId: me.flowId, userid, nodeName: me.activeNode.data.name };

    rec = Wb.getRecord({
      sql: 'select 1 from wb_flow_user where flow_id={?flowId?} and user_id={?userid?}',
      params
    });
    if (!rec)
      Wb.raise('"' + userid + '" is not a user of the workflow instance.');
    rec = Wb.getAllRecords({
      sql: 'select user_id,status,after_user from wb_flow_user where flow_id={?flowId?} and node_name={?nodeName?}' +
        ' and user_type<2 and status<3',
      params
    });
    me.isHandleUser = false;
    me.handleUserCt = 0;
    me.doneUserCt = 0;
    rec.forEach(item => {
      me.handleUserCt++;
      if (item[1] < 2) {
        if (item[0] == userid) {
          me.afterUser = item[2];
          me.isHandleUser = true;
        }
      } else {
        me.doneUserCt++;
      }
    });
  }
  /**
   * Create a new user record. @priv
   */
  createUser() {
    let me = this, node = me.activeNode;
    return {
      sid: Wb.getId(), flow_id: me.flowId, accept_time: me.handleTime, process_time: null,
      status: 0, user_type: 1, after_user: null, node_name: node.data.name, node_text: me.getNodeLabel(node)
    };
  }
  /**
   * Throw exception if current user is not avalid handle user. @priv
   * @param {Boolean} [isPass] Whether is pass action.
   */
  checkHandleUser(isPass) {
    let me = this, handleUser = me.handleUser;
    if (!me.isHandleUser)
      Wb.raise('"' + handleUser + '" is not a handle user of the workflow instance.');
    if (!isPass && me.starting && me.userid == handleUser)
      Wb.raise('At the start node, Initiate user can only execute pass action.');
  }
  /**
   * Get the initiate user data.
   * @return {Object} Consists of userid, username, displayName and text.
   */
  getInitUser() {
    let rec, userid = this.userid;

    rec = Wb.getRecord({ sql: 'select user_name,display_name from wb_user where sid={?userid?}', params: { userid } });
    return { userid, username: rec[0], displayName: rec[1], text: rec[0] + ' (' + rec[1] + ')' };
  }
  /**
   * Start a new workflow.
   * @return {Object} The updated flow data.
   */
  start() {
    let me = this, user_id = me.userid, startTime = me.startTime, activeNode, node_name, node_text;

    activeNode = me.activeNode;
    me.addNewUser({
      user_id, accept_time: startTime, process_time: startTime, status: 2, user_type: 0,
      node_name: activeNode.data.name, node_text: me.getNodeLabel(activeNode)
    });
    me.pass(true);
    activeNode = me.activeNode;
    if (me.completed)
      Wb.raise('The start node does not allow direct to the end node.');
    node_name = activeNode.data.name;
    node_text = me.getNodeLabel(activeNode);
    Wb.sync({
      tableName: 'wb_flow', insert: {
        sid: me.flowId, start_time: startTime, user_id, title: me.title, status: 1, node_name, node_text,
        tpl_file: me.file
      }
    });
    return me.stateData;
  }
  /**
   * Pass to the next first node.
   * @param {Boolean} [isStart] Whether is start a workflow.
   * @return {Object} The updated flow data.
   */
  pass(isStart) {
    let me = this, activeNode = me.activeNode, node, rec;

    if (!isStart)
      me.checkHandleUser(true);
    node = me.findTargetNode(activeNode);
    if (!node)
      Wb.raise('Node "' + me.getNodeLabel(activeNode) + '" cannot flow to the next node.');
    Wb.startTrans();
    me.updateUser(me.statusType.pass);
    if (me.afterUser) {
      rec = me.createUser();
      rec.user_id = me.afterUser;
      me.addNewUser(rec);
    } else if (me.canPass()) {
      me.activeNode = node;
      if (node.data.nodeType == 'end')
        me.status = 2;
      me.addNodeUsers();
      if (!isStart)
        me.updateFlow();
    }
    if (!isStart)
      return me.stateData;
  }
  /**
   * Get all params data for pass to the next node. @priv
   * @return {Object} Params object.
   */
  get params() {
    let me = this;

    if (me.params$)
      return me.params$;
    let script, activeNode = me.activeNode, params, baseParams;
    baseParams = {
      'flow.id': me.flowId, 'flow.userid': me.userid, 'flow.handleUser': me.handleUser, 'flow.startTime': me.startTime,
      'flow.nodeName': activeNode.data.name, 'flow.nodeText': me.getNodeLabel(activeNode)
    };
    Wb.apply(baseParams, me.extraParams);
    script = activeNode?.data.onGetParams || me.data.onGetParams;
    if (script) {
      params = new Function('params', 'flow', 'node', script).call(me, baseParams, me, activeNode);
    }
    me.params$ = Wb.apply(baseParams, params);
    return me.params$;
  }
  /** @property {Object} - Current handle user state data. */
  get stateData() {
    let me = this, result, node = me.activeNode;

    result = {
      status: me.status, node_name: node.data.name, node_text: me.getNodeLabel(node), user_status: me.userStatus,
      user_type: me.userType, user_node_name: me.userNodeName, title: me.title
    };
    if (me.dispname) {
      //new flow
      Wb.apply(result, {
        sid: me.flowId, user_id: me.handleUser, display_name: me.dispname, start_time: me.startTime,
        tpl_file: me.file, initiate: 1
      });
    }
    return result;
  }
  /**
   * Add current node users to the database. @priv
   */
  addNodeUsers() {
    let me = this, allUsers, userid = me.handleUser, handleUsers, ccUsers, now = me.handleTime,
      node = me.activeNode;

    handleUsers = me.getApprovers();
    if (!handleUsers.length && node.data.nodeType != 'end')
      Wb.raise('Node "' + me.getNodeLabel(node) + '" does not have process users.');
    allUsers = [];
    handleUsers.forEach(user_id => {
      allUsers.push({ user_id, user_type: 1 });
    })
    ccUsers = me.getApprovers(true);
    if (ccUsers.length) {
      //exclude handle users
      ccUsers = ccUsers.diff(handleUsers);
      ccUsers.forEach(user_id => {
        allUsers.push({ user_id, user_type: 2 });
      });
    }
    if (allUsers.length) {
      let insert = [], flow_id = me.flowId, node_name, node_text, rec;

      node_name = node.data.name;
      node_text = me.getNodeLabel(node);
      allUsers.forEach(user => {
        insert.push(Wb.apply({
          sid: Wb.getId(), flow_id, status: 0, accept_time: now, process_time: null, node_name, node_text
        }, user));
      });
      Wb.sync({ tableName: 'wb_flow_user', insert });
      rec = insert.find(user => user.user_id == userid);
      if (rec) {
        me.userStatus = rec.status;
        me.userType = rec.user_type;
        me.userNodeName = rec.node_name;
      }
    }
  }
  /**
   * Add new handle user to the database. @priv
   * @param {Object} data User data.
   */
  addNewUser(data) {
    let me = this, insert;

    insert = Wb.apply({
      sid: Wb.getId(), accept_time: me.handleTime, process_time: null, status: 0, flow_id: me.flowId
    }, data);
    if (insert.user_id == me.handleUser) {
      me.userStatus = data.status;
      me.userType = data.user_type;
      me.userNodeName = data.node_name;
    }
    Wb.sync({ tableName: 'wb_flow_user', insert });
  }
  /**
   * Update the status of current handle user. @priv
   * @param {Number} status User status.
   */
  updateUser(status) {
    let me = this, sid, userid = me.handleUser;

    me.userStatus = status;
    sid = Wb.getRecord({
      sql: 'select sid from wb_flow_user where flow_id={?flow_id?} and user_id={?user_id?} and node_name={?node_name?}' +
        ' order by accept_time desc',
      params: { flow_id: me.flowId, user_id: userid, node_name: me.activeNode.data.name }
    })?.[0];
    if (!sid)
      Wb.raise('User "' + userid + '" not found.');
    Wb.sync({ tableName: 'wb_flow_user', update: { $sid: sid, process_time: me.handleTime, status } });
    if (userid != me.userid)
      Wb.homeInfo({ module: 'my-flow' }, me.userid);
  }
  /**
   * Update the data of current workflow. @priv
   */
  updateFlow() {
    let me = this, node = me.activeNode;

    Wb.sync({
      tableName: 'wb_flow', update: {
        $sid: me.flowId, status: me.status, title: me.title, node_name: node.data.name, node_text: me.getNodeLabel(node)
      }
    })
  }
  /**
   * Get whether current node can pass to the next node.
   * @return {Boolean} Returns true means it can pass to the next node, else not.
   */
  canPass() {
    let me = this, value = me.activeNode.data.passUserCount, doneCt = me.doneUserCt;

    if (!value)
      return true;
    doneCt++;
    if (value.endsWith('%')) {
      return doneCt / me.handleUserCt >= (parseFloat(value.slice(0, -1)) / 100);
    } else {
      return doneCt >= parseInt(value);
    }
  }
  /**
   * Get node display label.
   * @param {Object} Node The workflow node.
   * @return {String} Node display label.
   */
  getNodeLabel(node) {
    return node.data.text || node.data.name;
  }
  /** @property {Boolean} - Whether the workfow has been completed. */
  get completed() {
    return this.activeNode.data.nodeType == 'end';
  }
  /** @property {Boolean} - Whether the workflow is starting. */
  get starting() {
    return this.beforeNode.data.nodeType == 'start';
  }
  /** @property {Boolean} - Whether the workflow is restarting. */
  get restarting() {
    return this.starting && !this.isNew;
  }
  /**
   * Find the target node associated with the source node. @priv
   * @param {Object} source The source node.
   * @return {Object} The Target node. Returns null if not found.
   */
  findTargetNode(source) {
    let me = this, targetId, sourceId = source.id, result, defaultNode, onPass, baseOnPass = me.data.onPass;

    me.cells.each(cell => {
      if (cell?.source?.cell == sourceId) {
        onPass = cell.data.onPass || baseOnPass;
        if (onPass) {
          result = new Function('params', 'flow', 'node', onPass).call(me, me.params, me, me.activeNode);
          if (result) {
            targetId = cell.target.cell;
            return false;
          }
        } else {
          defaultNode ??= cell.target.cell;
        }
      }
    });
    targetId ??= defaultNode;
    return targetId ? me.findNode(targetId) : null;
  }
  /**
   * Find the node by it's id.
   * @param {String} id Node id.
   * @return {Object} Found node. Returns null if not found.
   */
  findNode(id) {
    return this.cells.find(cell => cell.id == id) ?? null;
  }
  /**
   * Find the node by it's name.
   * @param {String} name Node name.
   * @return {Object} Found node. Returns null if not found.
   */
  findNodeByName(name) {
    return this.cells.find(cell => cell.data.name == name) ?? null;
  }
  /**
   * Get the specified property value.
   * @param {String} name Property name.
   * @return {String} Property value.
   */
  getProperty(name) {
    return this.activeNode.data[name] || this.data[name];
  }
  /**
   * Get all approval user ids of the current node. @priv
   * @param {Boolean} [isCC] Whether is cc users.
   * @param {Object} [node] The node. Default to current node.
   * @return {Array} All approval user ids.
   */
  getApprovers(isCC) {
    let me = this, users = [], data, value, object, recs, cc, roleUsers, deptUsers, node = me.activeNode;

    data = node.data;
    cc = isCC ? 'CC' : '';
    // get users
    value = data['user' + cc];
    if (value) {
      users.pushAll(value.splitTrim());
    }
    // get users from roles
    value = data['role' + cc];
    if (value) {
      object = Wb.Query.getArraySql(value.splitTrim(), 'varchar');
      recs = Wb.getAllRecords({
        sql: 'select user_id from wb_user_role where role_id in (' + object.sql + ')',
        params: object.params
      });
      roleUsers = recs.pluck(0);
    }
    // get users from depts
    value = data['dept' + cc];
    if (value) {
      object = Wb.Query.getArraySql(value.splitTrim(), 'varchar');
      recs = Wb.getAllRecords({
        sql: 'select sid from wb_user where dept_id in (' + object.sql + ')',
        params: object.params
      });
      deptUsers = recs.pluck(0);
    }
    if (Wb.parseBool(data.intersectDeptRole ?? true) && roleUsers && deptUsers) {
      users.pushAll(roleUsers.intersect(deptUsers));
    } else {
      if (roleUsers)
        users.pushAll(roleUsers);
      if (deptUsers)
        users.pushAll(deptUsers);
    }
    // dept manager
    value = data['deptManager' + cc];
    if (value) {
      recs = Wb.getRecord({ sql: 'select dept_id from wb_user where sid={?userid?}', params: { userid: me.userid } });
      if (recs?.[0]) {
        recs = Wb.getRecord({ sql: 'select manager_id from wb_dept where sid={?deptId?}', params: { deptId: recs[0] } });
        if (recs?.[0])
          users.push(recs[0]);
      }
    }
    // onGetUsers
    value = data['onGetUsers' + cc];
    if (value) {
      recs = new Function('params', 'flow', 'node', value).call(me, me.params, me, node);
      if (!Wb.isEmpty(recs)) {
        if (Wb.isArray(recs))
          users.pushAll(recs);
        else
          users.push(recs);
      }
    }
    return users.unique();
  }
  /**
   * Refuse to pass and terminate the process.
   * @return {Object} The updated flow data.
   */
  reject() {
    let me = this;

    if (me.getProperty('reject') != 'true')
      Wb.raise('Reject action is disabled.');
    me.checkHandleUser();
    Wb.startTrans();
    me.updateUser(me.statusType.reject);
    me.status = 3;
    me.updateFlow();
    return me.stateData;
  }
  /**
   * Transfer current user to another user.
   * @param {String} userid Transferred to user id.
   * @return {Object} The updated flow data.
   */
  transfer(userid) {
    let me = this, rec;

    if (me.getProperty('transfer') == 'false')
      Wb.raise('Transfer action is disabled.');
    me.checkHandleUser();
    rec = Wb.getRow({
      sql: 'select 1 from wb_flow_user where flow_id={?flowId?} and user_id={?userid?} and node_name={?nodeName?} ' +
        ' and user_type=1 and status<2',
      params: { flowId: me.flowId, userid, nodeName: me.activeNode.data.name }
    });
    if (rec)
      Wb.raise(Str.alreadyHandlePerson);
    Wb.startTrans();
    me.updateUser(me.statusType.transfer);
    rec = me.createUser();
    rec.user_id = userid;
    me.addNewUser(rec);
    me.updateFlow();
    return me.stateData;
  }
  /**
   * Add new handle user to current user. @priv
   * @param {String} userid New user id.
   * @param {Boolean} [after] Whether add user after current user. Default false means add user before current user.
   * @return {Object} The updated flow data.
   */
  addSign(userid, after) {
    let me = this, rec;

    me.checkHandleUser();
    Wb.startTrans();
    me.updateUser(me.statusType[after ? 'signAfter' : 'signBefore']);
    rec = me.createUser();
    if (after) {
      rec.user_id = me.handleUser;
      rec.after_user = userid;
    } else {
      rec.user_id = userid;
      rec.after_user = me.handleUser;
    }
    me.addNewUser(rec);
    me.updateFlow();
    return me.stateData;
  }
  /**
   * Add a new user before the current user. @priv
   * @param {String} userid New user id.
   * @return {Object} The updated flow data.
   */
  signBefore(userid) {
    if (this.getProperty('signBefore') == 'false')
      Wb.raise('Sign before action is disabled.');
    return this.addSign(userid);
  }
  /**
   * Add a new user after the current user. @priv
   * @param {String} userid New user id.
   * @return {Object} The updated flow data.
   */
  signAfter(userid) {
    if (this.getProperty('signAfter') == 'false')
      Wb.raise('Sign after action is disabled.');
    return this.addSign(userid, true);
  }
  /**
   * Back to the specified node.
   * @param {String} nodeName Node name.
   * @return {Object} The updated flow data.
   */
  back(nodeName) {
    let me = this, node;

    if (me.getProperty('back') == 'false')
      Wb.raise('Back action is disabled.');
    me.checkHandleUser();
    node = me.findNodeByName(nodeName);
    if (!node)
      Wb.raise('Node "' + nodeName + '" not found.');
    Wb.startTrans();
    me.setBacked(node);
    me.updateUser(me.statusType.back);
    me.activeNode = node;
    if (node.data.nodeType == 'start') {
      me.addNewUser(Wb.apply(me.createUser(), { user_id: me.userid, user_type: 0 }));
    } else {
      me.addNodeUsers();
    }
    me.updateFlow();
    return me.stateData;
  }
  /**
   * Set the handle user status of the specified node and all subsequent to backed. @priv
   * @param {Object} node Node object.
   */
  setBacked(node) {
    let me = this, params = { flowId: me.flowId, nodeName: node.data.name };

    params.acceptTime = Wb.getRecord({
      sql: 'select accept_time from wb_flow_user where flow_id={?flowId?} and node_name={?nodeName?}',
      params
    })?.[0];
    Wb.sql({
      sql: 'update wb_flow_user set status=8 where flow_id={?flowId?} and accept_time>={?acceptTime?}',
      params
    });
  }
}