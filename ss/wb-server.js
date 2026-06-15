/*
 * wb-server.js server javascript library
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * Object for storing global variables.
 * @class Globals
 * @singleton
 */
/** @property {Context} context Current execution context. @readonly */
Wb.apply(Globals, {
  /**
   * Initialization before module execution.
   * @param {String} path Current context path.
   * @param {HttpServletRequest} request Current request object.
   * @param {HttpServletResponse} response Current response object.
   * @param {Array} paramNames List of parameter names.
   * @param {Array} paramValues List of parameter values.
   */
  init(path, request, response, paramNames, paramValues) {
    globalThis.request = request;
    globalThis.response = response;
    globalThis.app = {};
    globalThis.Context = { path, closable: new Set(), rsClosable: new Set(), stClosable: new Set() };
    if (paramNames) {
      globalThis.paramNames = paramNames;
      paramNames.forEach((item, index) => globalThis[item] = paramValues[index]);
    }
  },
  /**
   * Cleanup after module execution.
   * @param {Boolean} hasExcept Whether an exception occurred.
   */
  clear(hasExcept) {
    [Context.rsClosable, Context.stClosable, Context.closable].forEach(closable => {
      closable.forEach(item => {
        try {
          item.close(hasExcept);
        } catch (e) {
          Wb.recordError('close error: ' + e?.toString());
        }
      });
    });
    if (globalThis.paramNames) {
      paramNames.forEach(item => globalThis[item] = undefined);
      globalThis.paramNames = undefined;
    }
    globalThis.request = undefined;
    globalThis.response = undefined;
    globalThis.app = undefined;
    globalThis.Context = undefined;
  }
});
/**
 * Object for storing global variables of the execution context. This object will be released after the execution
 * context finishes.
 * @class Context
 * @singleton
 */
/** @property {Number} maxRows Maximum number of records allowed to returns from database ResultSet. */
/** @property {String} path Current context path. @readonly */
/** @property {Set} rsClosable All closable ResultSet instances. @priv */
/** @property {Set} stClosable All closable Statement instances. @priv */
/** @property {Set} closable All other closable instances excluding ResultSet and Statement.  @priv */
/** @property {Object} payloadParams `application/json` request payload params. Invalid for other request. @priv */
/** @property {String} payload Request payload text. @priv */
/**
 * Extended class of the globalThis object.
 * @class globalThis
 * @singleton
 */
/** @property {Object} app Object for storing shared variables in current context. */
/** @property {Boolean} inWSSession Whether executing xwl module within a WebSocket session. @readonly */
/** @property {HttpServletRequest} request Current request object. @readonly */
/** @property {HttpServletResponse} response Current response object. @readonly */
/** @property {Proxy} Str A proxy object for getting text of the specified name based on the client's region from the
 * request. Uses the default region when there is no client request context. */
globalThis.Str ??= new Proxy({}, {
  get(_, prop) {
    return Wb.str(prop) ?? null;
  }
});
/** @property {Proxy} Params A proxy object for context parameters.
 * Example:
 *
 *     let param = Params.myParam; // Get param value
 *     Params.myParams = 'value'; // Set param value
 */
globalThis.Params ??= new Proxy({}, {
  get(a, prop) {
    return Wb.get(prop);
  },
  set(target, prop, value) {
    Wb.set(prop, value);
    return true;
  },
  has(target, prop) {
    return Wb.get(prop) != null;
  },
});
Wb.apply(globalThis, {
  /**
   * The setTimeout method, which is empty by default. Use {#Wb.setTimeout} to execute in another thread.
   */
  setTimeout: Wb.emptyFn,
  /**
   * The setInterval method, which is empty by default. Use {#Wb.setInterval} to execute in another thread.
   */
  setInterval: Wb.emptyFn,
  /**
   * The clearTimeout method, which is empty by default. Use `future.cancel` to clear {#Wb.setTimeout}.
   */
  clearTimeout: Wb.emptyFn,
  /**
   * The clearInterval method, which is empty by default. Use `future.cancel` to clear {#Wb.setInterval}.
   */
  clearInterval: Wb.emptyFn,
  /** @property {Object} - Alias of {#globalThis}. */
  self: globalThis,
  /** @property {ConcurrentHashMap} - A map for storing global Java variables across all execution contexts. Do not store
   * JS variables (excluding String, Number, Boolean); otherwise, concurrent access exceptions may occur. @readonly */
  BaseMap: Java.type('com.wb.common.Base').map,
  /** @property {Function} - `byte[]` type. */
  ByteArray: Java.type('byte[]'),
  /** @property {Function} - `java.io.File` class. */
  File: Java.type('java.io.File'),
  /** @property {Function} - `java.lang.String` class. */
  JavaString: Java.type('java.lang.String'),
  /** @property {Function} - `java.lang.Runtime` class. */
  Runtime: Java.type('java.lang.Runtime'),
  /** @property {Function} - `java.util.Date` class. */
  JavaDate: Java.type('java.util.Date'),
  /** @property {Function} - `java.lang.System` class. */
  System: Java.type('java.lang.System'),
  /** @property {Function} - `org.apache.commons.io.FileUtils` class. */
  FileUtils: Java.type('org.apache.commons.io.FileUtils'),
  /** @property {Function} - `org.apache.commons.io.IOUtils` class. */
  IOUtils: Java.type('org.apache.commons.io.IOUtils'),
  /** @property {Function} - `org.apache.commons.io.FilenameUtils` class. */
  FilenameUtils: Java.type('org.apache.commons.io.FilenameUtils'),
  /** @property {Function} - `org.apache.commons.io.IOCase` class. */
  IOCase: Java.type('org.apache.commons.io.IOCase'),
  /** @property {Function} - `org.graalvm.polyglot.Source` class. */
  Source: Java.type('org.graalvm.polyglot.Source'),
  /** @property {Function} - `org.json.JSONObject` class. */
  JSONObject: Java.type('org.json.JSONObject'),
  /** @property {Function} - `org.json.JSONArray` class. */
  JSONArray: Java.type('org.json.JSONArray'),
  /** @property {Function} - `com.wb.common.Base` class. */
  Base: Java.type('com.wb.common.Base'),
  /** @property {Function} - `com.wb.common.Sessions` class. */
  Sessions: Java.type('com.wb.common.Sessions'),
  /** @property {Function} - `com.wb.common.Xwl` class. */
  Xwl: Java.type('com.wb.common.Xwl'),
  /** @property {Function} - `com.wb.common.Perm` class. */
  Perm: Java.type('com.wb.common.Perm'),
  /** @property {Function} - `com.wb.common.Config` class. */
  Config: Java.type('com.wb.common.Config'),
  /** @property {Function} - `com.wb.common.ModuleData` class. */
  ModuleData: Java.type('com.wb.common.ModuleData'),
  /** @property {Function} - `com.wb.common.Str` class. */
  StrCls: Java.type('com.wb.common.Str'),
  /** @property {Function} - `com.wb.common.UrlBuffer` class. */
  UrlBuffer: Java.type('com.wb.common.UrlBuffer'),
  /** @property {Function} - `com.wb.util.WebUtil` class. */
  WebUtil: Java.type('com.wb.util.WebUtil'),
  /** @property {Function} - `com.wb.util.ZipUtil` class. */
  ZipUtil: Java.type('com.wb.util.ZipUtil'),
  /** @property {Function} - `com.wb.util.WSUtil` class. */
  WSUtil: Java.type('com.wb.util.WSUtil'),
  /** @property {Function} - `com.wb.util.SysUtil` class. */
  SysUtil: Java.type('com.wb.util.SysUtil'),
  /** @property {Function} - `com.wb.util.DateUtil` class. */
  DateUtil: Java.type('com.wb.util.DateUtil'),
  /** @property {Function} - `com.wb.util.LogUtil` class. */
  LogUtil: Java.type('com.wb.util.LogUtil'),
  /** @property {Function} - `com.wb.util.LogxUtil` class. */
  LogxUtil: Java.type('com.wb.util.LogxUtil'),
  /** @property {Function} - `com.wb.util.DbUtil` class. */
  DbUtil: Java.type('com.wb.util.DbUtil'),
  /** @property {Function} - `com.wb.util.JsonUtil` class. */
  JsonUtil: Java.type('com.wb.util.JsonUtil'),
  /** @property {Function} - `com.wb.util.ExcelUtil` class. */
  ExcelUtil: Java.type('com.wb.util.ExcelUtil'),
  /** @property {Function} - `com.wb.util.FileUtil` class. */
  FileUtil: Java.type('com.wb.util.FileUtil'),
  /** @property {Function} - `com.wb.util.JobUtil` class. */
  JobUtil: Java.type('com.wb.util.JobUtil'),
  /** @property {Function} - `com.wb.util.StringUtil` class. */
  StringUtil: Java.type('com.wb.util.StringUtil'),
  /** @property {Function} - `com.wb.graal.SourceBuffer` class. */
  SourceBuffer: Java.type('com.wb.graal.SourceBuffer'),
  /** @property {Function} - `com.wb.common.KVBuffer` class. */
  KVBuffer: Java.type('com.wb.common.KVBuffer'),
  /** @property {Function} - `com.wb.graal.DebugFiles` class. */
  DebugFiles: Java.type('com.wb.graal.DebugFiles'),
  /** @property {Function} - `com.wb.tool.Encrypter` class. */
  Encrypter: Java.type('com.wb.tool.Encrypter'),
  /** @property {Function} - `com.wb.common.Dict` class. */
  DictCls: Java.type('com.wb.common.Dict'),
  /** @property {Function} - `java.sql.ResultSet` class. */
  ResultSet: Java.type('java.sql.ResultSet'),
  /** @property {Function} - `java.sql.Types` class. */
  Types: Java.type('java.sql.Types'),
  /** @property {Function} - `java.io.InputStream` class. */
  InputStream: Java.type('java.io.InputStream'),
  /** @property {Function} - `java.io.ByteArrayInputStream` class. */
  ByteArrayInputStream: Java.type('java.io.ByteArrayInputStream'),
  /** @property {Function} - `java.io.ByteArrayOutputStream` class. */
  ByteArrayOutputStream: Java.type('java.io.ByteArrayOutputStream'),
  /** @property {Function} - `java.io.BufferedInputStream` class. */
  BufferedInputStream: Java.type('java.io.BufferedInputStream'),
  /** @property {Function} - `java.io.FileInputStream` class. */
  FileInputStream: Java.type('java.io.FileInputStream'),
  /** @property {Function} - `java.io.ArrayList` class. */
  ArrayList: Java.type('java.util.ArrayList'),
  /** @property {Function} - `com.wb.tool.DataSource` class. */
  DataSource: Java.type('com.wb.tool.DataSource'),
  /** @property {Function} - `java.util.HashMap` class. */
  HashMap: Java.type('java.util.HashMap'),
  /** @property {Function} - `java.util.concurrent.ConcurrentHashMap` class. */
  ConcurrentHashMap: Java.type('java.util.concurrent.ConcurrentHashMap'),
  /** @property {Function} - `java.lang.Byte` class. */
  Byte: Java.type('java.lang.Byte'),
  /** @property {Function} - `java.lang.Short` class. */
  Short: Java.type('java.lang.Short'),
  /** @property {Function} - `java.lang.Integer` class. */
  Integer: Java.type('java.lang.Integer'),
  /** @property {Function} - `java.lang.Long` class. */
  Long: Java.type('java.lang.Long'),
  /** @property {Function} - `java.lang.Float` class. */
  Float: Java.type('java.lang.Float'),
  /** @property {Function} - `java.lang.Double` class. */
  Double: Java.type('java.lang.Double'),
  /** @property {Function} - `Packages.jakarta` package name. */
  jakarta: Packages.jakarta,
  /**
   * Common classes are stored in this object.
   * @class Classes
   * @singleton
   */
  Classes: {
    /** @property {Function} - `java.util.UUID` class. */
    UUID: Java.type('java.util.UUID'),
    /** @property {Function} - `java.util.zip.GZIPInputStream` class. */
    GZIPInputStream: Java.type('java.util.zip.GZIPInputStream'),
    /** @property {Function} - `java.util.zip.GZIPOutputStream` class. */
    GZIPOutputStream: Java.type('java.util.zip.GZIPOutputStream'),
    /** @property {Function} - `java.util.List` class. */
    List: Java.type('java.util.List'),
    /** @property {Function} - `com.wb.tool.VirtualRequest` class. */
    VirtualRequest: Java.type('com.wb.tool.VirtualRequest'),
    /** @property {Function} - `com.wb.tool.VirtualResponse` class. */
    VirtualResponse: Java.type('com.wb.tool.VirtualResponse'),
    /** @property {Function} - `java.lang.NullPointerException` class. */
    NullPointerException: Java.type('java.lang.NullPointerException'),
    /** @property {Function} - `java.lang.String[]` class. */
    StringArray: Java.type("java.lang.String[]"),
    /** @property {Function} - `java.sql.Timestamp` class. */
    Timestamp: Java.type('java.sql.Timestamp'),
    /** @property {Function} - `java.sql.Date` class. */
    Date: Java.type('java.sql.Date'),
    /** @property {Function} - `java.sql.Time` class. */
    Time: Java.type('java.sql.Time'),
    /** @property {Function} - `java.io.StringReader` class. */
    StringReader: Java.type('java.io.StringReader'),
    /** @property {Function} - `com.wb.graal.Executor` class. */
    Executor: Java.type('com.wb.graal.Executor'),
    /** @property {Function} - `com.wb.graal.ContextPool` class. */
    ContextPool: Java.type('com.wb.graal.ContextPool'),
    /** @property {Function} - `java.io.Reader` class. */
    Reader: Java.type('java.io.Reader'),
    /** @property {Function} - `java.sql.Clob` class. */
    Clob: Java.type('java.sql.Clob'),
    /** @property {Function} - `java.sql.Blob` class. */
    Blob: Java.type('java.sql.Blob'),
    /** @property {Function} - `com.wb.common.SessionListener` class. */
    SessionListener: Java.type('com.wb.common.SessionListener'),
    /** @property {Function} - `com.wb.tool.Cms` class. */
    Cms: Java.type('com.wb.tool.Cms'),
    /** @property {Function} - `java.lang.Throwable` class. */
    Throwable: Java.type('java.lang.Throwable'),
    /** @property {Function} - `java.util.Properties` class. */
    Properties: Java.type('java.util.Properties')
  }
});
/**
 * WebBuilder server side javascript library.
 * @class Wb-Server
 * @singleton
 */
Wb.apply(Wb, {
  /**
   * Gets a unique, incrementing 13-digit string composed of 26 uppercase letters and 10 digits.
   * Example:
   *
   *     let id = Wb.getId();
   *
   * @return {String} The generated 13-digit unique incrementing string.
   */
  getId: SysUtil.getId,
  /** @property {Charset} - UTF-8 encoding charset. */
  utf8: Java.type('java.nio.charset.StandardCharsets').UTF_8,
  /**
   * Encodes a string to a Base64 string.
   * @param {String} text The string to be converted.
   * @return {String} The converted string.
   */
  encodeBase64: StringUtil.encodeBase64,
  /**
   * Decodes a Base64 string to a string.
   * @param {String} text The string to be converted.
   * @return {String} The converted string.
   */
  decodeBase64: StringUtil.decodeBase64Text,
  /**
   * Pauses the thread execution for the specified number of milliseconds.
   * @param {Number} milliSec Number of milliseconds.
   */
  sleep: Java.type('java.lang.Thread').sleep,
  /**
   * Gets a random 32-character UUID string.
   * @return {String} A 32-character UUID string with hyphens removed.
   */
  getUUID() {
    return Classes.UUID.randomUUID().toString().replaceAll('-', '');
  },
  /**
   * Returns the JSON object or array represented by the script. The difference between this method and {#Wb.decode}
   * is that it allows the JSON format to be a JS expression.
   * Example:
   *
   *     Wb.parse('{foo: 123, bar: "abc"}');
   *
   * @param {String} script The script to parse.
   * @return {Object/Array} The object or array represented by the script. Returns null if the script is null.
   */
  parse(script) {
    if (script == null)
      return script;
    if (script.trimLeft().startsWith('['))
      script = new JSONArray(script).toString();
    else
      script = new JSONObject(script).toString();
    return Wb.decode(script);
  },
  /**
   * Whether the current user is allowed to access the specified module.
   * Example:
   *
   *     result = Wb.permit('admin/dbe.xwl');
   *     result = Wb.permit('dbe');
   *
   * @param {String} path The relative path or shortcut of the module.
   * @param {Boolean} checkLogin Whether to check if the module requires login.
   * @return {Boolean} `true` if access is allowed, `false` otherwise.
   */
  permit(path, checkLogin) {
    path = FileUtil.getXwlPath(path);
    if (path && checkLogin) {
      let module = Xwl.get(path);
      if (module && !module.loginRequired)
        return true;
    }
    return Perm.permit(path, Wb.roles ?? '');
  },
  /**
   * Whether the current user is allowed to access the specified module. It will throw an exception if access
   * is not allowed.
   * @param {String} path The relative path or shortcut of the module.
   * @param {Boolean} checkLogin Whether to check if the module requires login.
   * @return {Boolean} `true` if access is allowed, `false` otherwise.
   */
  permitx(path, checkLogin) {
    if (!Wb.permit(path, checkLogin ?? true))
      Wb.raise(Str.notHavePerm.format(Wb.getModulePath(path).slice(0, -4)));
    return true;
  },
  /**
   * Converts a JS Object/Array to a Java JSONObject/JSONArray. If the parameter is not an Object/Array,
   * it will be returned directly. See {#toJs} for reverse method.
   * @param {Object/Array} object The value to be converted.
   * @return {JSONObject/JSONArray} The converted value or the the object parameter itself.
   */
  toJava(object) {
    if (Wb.isArray(object)) {
      let ja = new JSONArray();
      object.forEach(v => {
        if (v == null || Wb.isFunction(v))
          v = JSONObject.NULL;
        else if (Wb.isObject(v) || Wb.isArray(v))
          v = Wb.toJava(v);
        else if (Wb.isDate(v))
          v = new JavaDate(v.getTime());
        ja.put(v);
      });
      return ja;
    } else if (Wb.isObject(object)) {
      let jo = new JSONObject();
      Wb.each(object, (k, v) => {
        if (v === undefined)
          return;
        if (v == null || Wb.isFunction(v))
          v = JSONObject.NULL;
        else if (Wb.isObject(v) || Wb.isArray(v))
          v = Wb.toJava(v);
        else if (Wb.isDate(v))
          v = new JavaDate(v.getTime());
        jo.put(k, v);
      });
      return jo;
    } else return object;
  },
  /**
   * Converts a Java JSONObject/JSONArray to a JS Object/Array. If the parameter is not an JSONObject/JSONArray,
   * it will be returned directly. See {#toJava} for reverse method.
   * @param {JSONObject/JSONArray} object The value to be converted.
   * @return {Object/Array} The converted value or the the object parameter itself.
   */
  toJs(object) {
    if (object instanceof JSONArray) {
      let ja = [], v, i, j = object.length();
      for (i = 0; i < j; i++) {
        v = JsonUtil.opt(object, i);
        if (v instanceof JSONObject || v instanceof JSONArray)
          v = Wb.toJs(v);
        else if (v instanceof JavaDate)
          v = new Date(v.getTime());
        ja.push(v);
      }
      return ja;
    } else if (object instanceof JSONObject) {
      let jo = {}, v, names = object.keySet();
      names.forEach(name => {
        v = JsonUtil.opt(object, name);
        if (v instanceof JSONObject || v instanceof JSONArray)
          v = Wb.toJs(v);
        else if (v instanceof JavaDate)
          v = new Date(v.getTime());
        jo[name] = v;
      });
      return jo;
    } else return object;
  },
  /**
   * Gets the Proxy of a JSONObject/JSONArray object, which is used to access the JSONObject/JSONArray object like
   * JavaScript object/array.
   * Example:
   *
   *     let json = new JSONObject("{a: 123}");
   *     let proxy = Wb.getProxy(json);
   *     let value = proxy.a;
   *
   * @param {JSONObject/JSONArray} object The object to access.
   * @return {Proxy} The proxy object.
   */
  getProxy(object) {
    if (object == null)
      return object;
    if (object instanceof JSONArray) {
      return new Proxy(object, {
        get(target, prop, receiver) {
          switch (prop) {
            case 'length':
              return target.length();
            case 'each':
              return Wb.PT.arrayEach;
            case 'forEach':
              return fn => {
                let i, j = target.length();
                for (i = 0; i < j; i++)
                  fn(target.opt(i), i);
              };
            case 'xLikeArray':
              return true;
            case 'remove':
              return index => target.remove(index);
            case 'push':
              return item => target.put(item);
            case 'toJSON':
              return fn => {
                let i, j = target.length(), r = [];
                for (i = 0; i < j; i++)
                  r.push(receiver[i]);
                return r;
              };
            case Symbol.toStringTag:
              return f => '[object Array]';
          }
          let value = target.opt(parseInt(prop));
          if (value instanceof JSONArray || value instanceof JSONObject)
            return Wb.getProxy(value);
          else
            return value;
        },
        set(target, prop, value) {
          target.put(parseInt(prop), value);
          return true;
        },
        deleteProperty(target, prop) {
          target.remove(parseInt(prop));
          return true;
        },
        has: function (target, prop) {
          return prop >= 0 && prop < target.length();
        },
        ownKeys: function (target) {
          let a = [], i, j = target.length();

          for (i = 0; i < j; i++)
            a.push(i.toString());
          return a;
        },
        getOwnPropertyDescriptor: function (target, prop) {
          return { value: target.opt(parseInt(prop)), writable: true, enumerable: true, configurable: true };
        }
      });
    } else {
      return new Proxy(object, {
        get(target, prop) {
          if (prop == Symbol.toStringTag)
            return f => '[object Object]';
          let value = target.opt(prop);
          if (value instanceof JSONArray || value instanceof JSONObject)
            return Wb.getProxy(value);
          else
            return value;
        },
        set(target, prop, value) {
          target.put(prop, value);
          return true;
        },
        deleteProperty(target, prop) {
          target.remove(prop);
          return true;
        },
        has: function (target, prop) {
          return target.has(prop);
        },
        ownKeys: function (target) {
          return Java.from(JSONObject.getNames(target));
        },
        getOwnPropertyDescriptor: function (target, prop) {
          return { value: target.opt(prop), writable: true, enumerable: true, configurable: true };
        }
      });
    }
  },
  /**
   * Determines whether the current user has certain roles.
   * @param {String/String[]} roles The role ID or a list of roles.
   * @return {Boolean} `true` if the user has the role(s), `false` otherwise.
   */
  hasRole(roles) {
    if (!roles)
      return false;
    roles = Wb.toArray(roles);
    return Wb.roles?.some(role => roles.includes(role)) ?? false;
  },
  /**
   * Determines whether the current user has certain roles or the "admin" role.
   * @param {String/String[]} roles The role ID or a list of roles.
   * @return {Boolean} `true` if the user has the role(s), `false` otherwise.
   */
  hasRolex(roles) {
    if (Wb.isAdmin)
      return true;
    return Wb.hasRole(roles);
  },
  /**
   * Throws an access denial exception if the current user has certain roles. Note that "admin" users are exempt from
   * this restriction.
   * @param {String/String[]} roles The role ID or a list of roles.
   * @param {String} [msg] The exception message.
   */
  forbidRole(roles, msg) {
    if (!roles)
      return;
    let userRoles = Wb.roles;
    if (userRoles) {
      if (Wb.isAdmin)
        return;
      roles = Wb.toArray(roles);
      if (userRoles.some(role => roles.includes(role)))
        Wb.accessDenied(msg);
    }
  },
  /**
   * Determines whether the current user does not have certain roles. If the user lacks all of these roles, an access denial
   * exception will be thrown. Note that "admin" users are exempt from this restriction.
   * @param {String/String[]} roles The role ID or a list of roles.
   * @param {String} [msg] The exception message.
   */
  permitRole(roles, msg) {
    let userRoles = Wb.roles;
    if (userRoles) {
      if (Wb.isAdmin)
        return;
      if (!roles)
        Wb.accessDenied(msg);
      roles = Wb.toArray(roles);
      if (!userRoles.some(role => roles.includes(role)))
        Wb.accessDenied(msg);
    } else {
      Wb.accessDenied(msg);
    }
  },
  /**
   * Throws an access denial exception if the current version is the demo version.
   */
  checkDemo() {
    if (Config.isDemo)
      Wb.raise(Str.accessDeniedDownload);
  },
  /***/
  isObject(value) {
    return !Java.isJavaObject(value) && toString.call(value) === '[object Object]';
  },
  /**
   * Throws a NullPointerException with the specified message if the object is null/undefined.
   * @param {Object} object The object to check.
   * @param {String} [message] The exception message.
   */
  checkNull(object, message) {
    if (object == null) {
      if (message == null)
        Wb.raise(new Classes.NullPointerException());
      else
        Wb.raise(new Classes.NullPointerException(message));
    }
  },
  /**
   * Throws exception with the specified message if the string is not a {#identifier|Wb.isIdentifier}.
   * @param {String} string The string to check.
   * @param {Boolean} allowDot Whether dots are allowed in the identifier.
   * @param {String} [message] The exception message. Defaults to `Str.invalidValue`.
   */
  checkId(string, allowDot, message) {
    if (!Wb.isIdentifier(string, allowDot))
      Wb.raise(message ? message : Str.invalidValue.format(String(string)));
  },
  /**
   * Gets the database connection for the specified name from the current execution context buffer. Returns a new
   * database connection from the connection pool if it does not exist.
   * @param {String} [name] The database source name. Defaults to the default database.
   * @return {Wb.Connection} The database connection.
   */
  getConn(name) {
    return (!name || Wb.isString(name)) ? Wb.Connection.get(name) : name;
  },
  /**
   * Starts a database transaction for the specified database connection. Changes the transaction mode of the connection
   * from automatic commit to manual commit, so that subsequent database operations under this connection will be grouped
   * into a single transaction and only take effect after explicit commit.
   * @param {String/Wb.Connection} [name] The database connection or source name. Defaults to the default database.
   * @param {String} [isolation] The transaction isolation level. See {#Wb.Connection.isolation} for details.
   */
  startTrans(name, isolation) {
    Wb.getConn(name).startTrans(isolation);
  },
  /**
   * Commits the database transaction for the specified database connection and sets {#Wb.Connection.autoCommit} to `true`.
   * @param {String/Wb.Connection} [name] The database connection or source name. Defaults to the default database.
   */
  commit(name) {
    Wb.getConn(name).commit();
  },
  /**
   * Rolls back the transaction for the specified database connection and sets {#Wb.Connection.autoCommit} to `true`.
   * @param {String/Wb.Connection} [name] The database connection or source name. Defaults to the default database.
   */
  rollback(name) {
    Wb.getConn(name).rollback();
  },
  /**
   * Alias of {#Wb.Query.sync}.
   */
  sync(...args) {
    Wb.Query.sync(...args);
  },
  /**
   * Alias of {#Wb.Query.syncFree}.
   */
  syncFree(...args) {
    Wb.Query.syncFree(...args);
  },
  /**
   * Sends a message to the specified users and displays it on their homepage.
   * @param {String/Object} msg The message to send. If it's an object, it represents the configuration object for opening
   * via the {#Wb.open|Wb-Client.open} method, where `msg` is the message content and `newWin` set to `true` means opening
   * via the {#Wb.openWin|Wb-Client.openWin} method.
   * @param {String/HttpServletRequest/HttpSession/Boolean} [userid] The target recipients. A String represents the user ID;
   * an HttpServletRequest object represents the user associated with the request; an HttpSession object represents the user
   * associated with the session; `true` represents all users. If omitted, the message is sent to the current user.
   * @param {String} [type] The message type, defaulting to "info".
   * -'info': Information
   * -'warn': Warning
   * -'error': Error
   */
  homeInfo(msg, userid, type = 'info') {
    Wb.send({ type, msg }, 'sys.home', userid);
  },
  /**
   * Sends a warning message to the specified users and displays it on their homepage. See {#Wb.homeInfo} for details.
   */
  homeWarn(msg, userid) {
    Wb.homeInfo(msg, userid, 'warn');
  },
  /**
   * Sends an error message to the specified users and displays it on their homepage. See {#Wb.homeInfo} for details.
   */
  homeError(msg, userid) {
    Wb.homeInfo(msg, userid, 'error');
  },
  /**
   * Sets short user-related value into the database table. See {#getValue} for getting value.
   * @param {String} name The value name.
   * @param {String/Number/Boolean/Date} [value] The value. Maximum length is 200 characters. The value will be deleted
   * if omitted or null.
   * @param {String} [userid] User ID. Defaults to the current user.
   * @param {Number} [type] Value type, defaults to the value parameter type:
   * -0: String
   * -1: Number
   * -2: Date
   * -3: Boolean
   */
  setValue(name, value, userid, type) {
    userid ??= Wb.userid;
    if (name.length + userid.length >= 99)
      Wb.raise('Name exceeds the maximum length.');
    if (value?.length >= 200)
      Wb.raise('Value exceeds the maximum length.')
    let hasValue = value != null;

    if (hasValue)
      Wb.startTrans();
    name = userid + '@' + name;
    Wb.set('name', name);
    Wb.sql('delete from wb_value where sid={?name?}');
    if (hasValue) {
      if (Wb.isDate(value)) {
        value = value.textValue;
        type ??= 2;
      } else {
        if (type == null) {
          if (Wb.isNumber(value))
            type = 1;
          else if (Wb.isBoolean(value))
            type = 3;
          else
            type = 0;
        }
        value = String(value);
      }
      Wb.set({ type, value });
      Wb.sql('insert into wb_value values({?name?},{?type?},{?value?})');
    }
  },
  /**
   * Gets short user-related value(s) from the database table. See {#setValue} for setting value.
   * @param {String/String[]} names The value name or list of names.
   * @param {String/String[]} [userids] User ID or list of user IDs. Defaults to the current user.
   * @return {Object/Object[]} The value or list of values. Returns null if not found.
   */
  getValue(names, userids) {
    let clause = [], values = {}, result = [], curUserid, paramName, recs, value,
      namesIsArray, useridsIsArray, id, idList = [];

    curUserid = Wb.userid;
    userids ??= curUserid;
    namesIsArray = Wb.isArray(names);
    useridsIsArray = Wb.isArray(userids);
    if (!namesIsArray)
      names = [names];
    names.forEach((name, i) => {
      paramName = 'name' + i;
      id = (useridsIsArray ? (userids[i] ?? curUserid) : userids) + '@' + name;
      idList.push(id);
      Wb.set(paramName, id);
      clause.push('sid={?' + paramName + '?}');
    });
    recs = Wb.getAllRecords('select sid,stype,svalue from wb_value where ' + clause.join(' or '));
    recs.forEach(rec => {
      value = rec[2];
      switch (rec[1]) {
        case 1:
          value = value ? parseFloat(value) : null;
          break;
        case 2:
          value = value ? value.dateValue : null;
          break;
        case 3:
          value = value ? value == 'true' : null;
          break;
      }
      values[rec[0]] = value;
    });
    idList.forEach(id => {
      result.push(values[id] ?? null);
    });
    return namesIsArray ? result : result[0];
  },
  /**
   * Sets large user-related value into the database table. See {#getResource} for getting large value.
   * @param {String} name The value name.
   * @param {String/Object/Array/byte[]/InputStream} [value] The value. The value will be deleted if omitted or null.
   * @param {String} [userid] User ID. Defaults to the current user.
   * @param {Number} [type] Value type, defaults to the value parameter type:
   * -0: String
   * -1: Object or Array
   * -2: byte[]
   * -3: InputStream
   */
  setResource(name, value, userid, type) {
    userid ??= Wb.userid;
    if (name.length + userid.length >= 99)
      Wb.raise('Name exceeds the maximum length.');
    let hasValue = value != null;

    if (hasValue)
      Wb.startTrans();
    name = userid + '@' + name;
    Wb.set('name', name);
    Wb.sql('delete from wb_resource where sid={?name?}');
    if (hasValue) {
      if (value instanceof ByteArray)
        type ??= 2;
      else if (value instanceof InputStream)
        type ??= 3;
      else {
        if (Wb.isObject(value) || Wb.isArray(value)) {
          value = Wb.encode(value)
          type ??= 1;
        } else {
          type ??= 0;
          value = String(value);
        }
        value = value.getByteStream();
      }
      Wb.set({ type, value });
      Wb.sql('insert into wb_resource values({?name?},{?type?},{?blob|value?})');
    }
  },
  /**
   * Gets large user-related value(s) from the database table. See {#setResource} for setting value.
   * @param {String/String[]} names The value name or list of names.
   * @param {String/String[]} [userids] User ID or list of user IDs. Defaults to the current user.
   * @return {Object/Object[]} The value or list of values. Returns null if not found.
   */
  getResource(names, userids) {
    let clause = [], values = {}, result = [], curUserid, paramName, recs, value, type,
      namesIsArray, useridsIsArray, id, idList = [];

    curUserid = Wb.userid;
    userids ??= curUserid;
    namesIsArray = Wb.isArray(names);
    useridsIsArray = Wb.isArray(userids);
    if (!namesIsArray)
      names = [names];
    names.forEach((name, i) => {
      paramName = 'name' + i;
      id = (useridsIsArray ? (userids[i] ?? curUserid) : userids) + '@' + name;
      idList.push(id);
      Wb.set(paramName, id);
      clause.push('sid={?' + paramName + '?}');
    });
    recs = Wb.getAllRecords({ sql: 'select sid,stype,svalue from wb_resource where ' + clause.join(' or '), blob: true });
    recs.forEach(rec => {
      type = rec[1];
      value = rec[2];
      switch (type) {
        case 0:
        case 1:
          value = value ? new JavaString(value.readAllBytes(), Wb.utf8) : null;
          if (type == 1 && value)
            value = Wb.decode(value);
          break;
        case 2:
          value = value ? value.readAllBytes() : null;
          break;
      }
      values[rec[0]] = value;
    });
    idList.forEach(id => {
      result.push(values[id] ?? null);
    });
    return namesIsArray ? result : result[0];
  },
  /**
   * Throws access denied exception.
   * @param {String} [msg] Additional message.
   */
  accessDenied(msg) {
    if (msg)
      msg = Str.accessDenied + ': ' + msg;
    else
      msg = Str.accessDenied;
    Wb.raise(msg);
  },
  /**
   * Alias of {#Wb.Query.getOrderSql}.
   */
  getOrderSql(...args) {
    return Wb.Query.getOrderSql(...args);
  },
  /**
   * Executes SQL and gets the specified number of rows from the first ResultSet. See {#Wb.Query.run} for details.
   */
  getRows(configs, dbOrFn, fn, array, rs) {
    if (Wb.isString(configs))
      configs = { sql: configs, columns: false, array, rs };
    else
      configs = Wb.apply({ columns: false, array, rs }, configs);
    let value = Wb.Query.run(configs, dbOrFn, fn);
    switch (Wb.Query.result) {
      case 'value':
        return Wb.isArray(value) ? value : undefined;
      case 'array':
        return value.find(item => Wb.isArray(item));
      case 'object':
        return value.$return.find(item => Wb.isArray(item)) ??
          value[Wb.find(value, (k, v) => k != '$return' && Wb.isArray(v))];
    }
  },
  /**
   * See {#getRows} for details. The difference from {#getRows} is that it defaults to getting all rows.
   */
  getAllRows(configs, dbOrFn, fn) {
    return Wb.getRows(configs, dbOrFn, fn, false, -1);
  },
  /**
   * See {#getRows} for details. The difference from {#getRows} is that the result is sent to the client.
   */
  sendRows(configs, dbOrFn, fn) {
    Wb.send(Wb.getRows(configs, dbOrFn, fn));
  },
  /**
   * Executes SQL and gets the first row from the first ResultSet. See {#Wb.Query.run} for details.
   * @return {Object} The first row or null if empty.
   */
  getRow(configs, dbOrFn, fn) {
    return Wb.getRows(configs, dbOrFn, fn, false, 1)?.[0] ?? null;
  },
  /**
   * See {#getRow} for details. The difference from {#getRow} is that the result is sent to the client.
   */
  sendRow(...args) {
    Wb.send(Wb.getRow(...args));
  },
  /**
   * Executes SQL and gets columns, fields and the specified number of rows from the first ResultSet. The
   * `configs.paging` parameter defaults to `true` (pagination is enabled). See {#Wb.Query.run} for details.
   */
  getRowx(configs, dbOrFn, fn, array, rs) {
    if (Wb.isString(configs))
      configs = { sql: configs, array, paging: true, rs };
    else
      configs = Wb.apply({ array, paging: true, rs }, configs);
    let value = Wb.Query.run(configs, dbOrFn, fn);
    switch (Wb.Query.result) {
      case 'value':
        return Wb.isArray(value?.items) ? value : undefined;
      case 'array':
        return value.find(item => Wb.isArray(item?.items));
      case 'object':
        return value.$return.find(item => Wb.isArray(item?.items)) ??
          value[Wb.find(value, (k, v) => k != '$return' && Wb.isArray(v?.items))];
    }
  },
  /**
   * See {#getRowx} for details. The difference from {#getRowx} is that the result is sent to the client.
   */
  sendRowx(configs, dbOrFn, fn) {
    Wb.send(Wb.getRowx(configs, dbOrFn, fn));
  },
  /**
   * See {#getRowx} for details. The difference from {#getRowx} is that each row is an array.
   */
  getRecordx(configs, dbOrFn, fn) {
    return Wb.getRowx(configs, dbOrFn, fn, true);
  },
  /**
   * See {#sendRowx} for details. The difference from {#sendRowx} is that each row is an array.
   */
  sendRecordx(configs, dbOrFn, fn) {
    Wb.send(Wb.getRowx(configs, dbOrFn, fn, true));
  },
  /**
   * See {#getRows} for details. The difference from {#getRows} is that each row is an array.
   */
  getRecords(configs, dbOrFn, fn) {
    return Wb.getRows(configs, dbOrFn, fn, true);
  },
  /**
   * See {#getAllRows} for details. The difference from {#getAllRows} is that each row is an array.
   */
  getAllRecords(configs, dbOrFn, fn) {
    return Wb.getRows(configs, dbOrFn, fn, true, -1);
  },
  /**
   * See {#sendRows} for details. The difference from {#sendRows} is that each row is an array.
   */
  sendRecords(configs, dbOrFn, fn) {
    Wb.send(Wb.getRows(configs, dbOrFn, fn, true));
  },
  /**
   * See {#getRow} for details. The difference from {#getRow} is that the row is an array.
   */
  getRecord(configs, dbOrFn, fn) {
    return Wb.getRows(configs, dbOrFn, fn, true, 1)?.[0] ?? null;
  },
  /**
   * See {#sendRow} for details. The difference from {#sendRow} is that the row is an array.
   */
  sendRecord(...args) {
    Wb.send(Wb.getRecord(...args));
  },
  /**
   * See {#getRowx} for details. The difference from {#getRowx} is that the `configs.dict` parameter defaults to
   * `true` (dictionary is enabled).
   */
  getDict(configs, dbOrFnOrDict, dictGroups, fn, array, rs) {
    let isArray = Wb.isArray(dbOrFnOrDict);
    if (isArray || Wb.isString(dbOrFnOrDict) && dbOrFnOrDict.includes(',')) {
      if (!isArray) {
        dbOrFnOrDict = dbOrFnOrDict.splitTrim();
        if (!dbOrFnOrDict.lastItem.trim())
          dbOrFnOrDict.pop();
      }
      dictGroups ??= dbOrFnOrDict;
      dbOrFnOrDict = null;
    }
    if (Wb.isString(configs))
      configs = { sql: configs, dict: dictGroups ?? true };
    else
      configs = Wb.apply({ dict: dictGroups ?? true }, configs);
    return this.getRowx(configs, dbOrFnOrDict, fn, array, rs);
  },
  /**
   * See {#getDict} for details. The difference from {#getDict} is that the result is sent to the client.
   */
  sendDict(...args) {
    Wb.send(Wb.getDict(...args));
  },
  /**
   * See {#getDict} for details. The difference from {#getDict} is that each row is an array.
   */
  getDictRecords(configs, dbOrFnOrDict, dictGroups, fn) {
    return Wb.getDict(configs, dbOrFnOrDict, dictGroups, fn, true);
  },
  /**
   * See {#getDictRecords} for details. The difference from {#getDictRecords} is that the result is sent to the client.
   */
  sendDictRecords(...args) {
    Wb.send(Wb.getDictRecords(...args));
  },
  /**
   * Alias of {#Wb.Query.run}.
   */
  sql(...args) {
    return Wb.Query.run(...args);
  },
  /**
   * Run sql and send the results to the client. See {#Wb.Query.run} for details.
   */
  sendSql(...args) {
    Wb.send(Wb.Query.run(...args));
  },
  /**
   * Run SQL and retrieve results. The difference between this method and the {#Wb.sql} is that it retrieves all
   * BLOB fields by default.
   */
  sqlAll(configs, dbOrFn, fn) {
    if (Wb.isString(configs))
      configs = { sql: configs, blob: true };
    else
      configs = Wb.apply({ blob: true }, configs);
    return Wb.Query.run(configs, dbOrFn, fn);
  },
  /**
   * Run SQL and retrieve results. The difference between this method and the {#Wb.sql} is that it returns the
   * ResultSet by default.
   */
  sqlRS(configs, dbOrFn, fn) {
    if (Wb.isString(configs))
      configs = { sql: configs, rs: true };
    else
      configs = Wb.apply({ rs: true }, configs);
    return Wb.Query.run(configs, dbOrFn, fn);
  },
  /**
   * Alias of {#Wb.ExcelUtil.getExcelHtml}.
   */
  getExcelHtml(...args) {
    return Wb.ExcelUtil.getExcelHtml(...args);
  },
  /**
   * Alias of {#Wb.ExcelUtil.getExcelFile}.
   */
  getExcelFile(...args) {
    Wb.ExcelUtil.getExcelFile(...args);
  },
  /**
   * Outputs the information message to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. See `userid` parameter of {#Wb.send} for details.
   */
  info(object, userid) {
    Wb.log(object, userid, 0);
  },
  /**
   * Outputs the warning message to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. See `userid` parameter of {#Wb.send} for details.
   */
  warn(object, userid) {
    Wb.log(object, userid, 1);
  },
  /**
   * Outputs the error message to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. See `userid` parameter of {#Wb.send} for details.
   */
  error(object, userid) {
    Wb.log(object, userid, 2);
  },
  /**
   * Outputs the information message as a table to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. See `userid` parameter of {#Wb.send} for details.
   */
  table(object, userid) {
    Wb.log(object, userid, 4);
  },
  /**
   * Outputs the debug message to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. For unlogged-in users, the user ID is specified by
   * the configuration item `sys.ss.anonymousDebugUser`. See `userid` parameter of {#Wb.send} for details.
   */
  debug(object, userid) {
    Wb.log(object, userid, 5);
  },
  /**
   * Outputs the log message to the IDE console.
   * @param {Object} object The object to output.
   * @param {String/Boolean} [userid] The ID of the user to send to. See `userid` parameter of {#Wb.send} for details.
   * @param {Number} [type] Log type:
   * -0: Infomation
   * -1: Warning
   * -2: Error
   * -3: Log, default value.
   * -4: Table
   * -5: Debug
   */
  log(object, userid, type = 3) {
    if (Config.consolePrint) {
      let value;
      try {
        if (object == null)
          value = String(object);
        else if (Java.isJavaObject(object))
          value = Wb.encode(object.toString());
        else
          value = object;
        let info;
        try {
          info = Wb.encode({ type: 'log', style: type, data: value });
        } catch (ex) {
          info = Wb.encode({ type: 'log', style: type, data: String(value) });
        }
        if (userid == null && !Wb.userid && type == 5)
          userid = Config.anonymousUser;
        Wb.send(info, '$ide', userid);
      } catch (e) {
        System.err.println('Wb.log error: ' + e?.toString());
      }
    }
  },
  /**
   * Logs object as debug and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordDebug(object) {
    Wb.recordLog(object, 3);
  },
  /**
   * Logs object as information and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordInfo(object) {
    Wb.recordLog(object, 0);
  },
  /**
   * Db-Logs object as information and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   * @param {String} [type] Log content type.
   */
  recordInfox(object, type) {
    Wb.recordLogx(object, type, 0);
  },
  /**
   * Logs object as warning and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordWarn(object) {
    Wb.recordLog(object, 1);
  },
  /**
   * Db-Logs object as warning and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   * @param {String} [type] Log content type.
   */
  recordWarnx(object, type) {
    Wb.recordLogx(object, type, 1);
  },
  /**
   * Logs object as error and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordError(object) {
    Wb.recordLog(object, 2);
  },
  /**
   * Db-Logs object as error and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   * @param {String} [type] Log content type.
   */
  recordErrorx(object, type) {
    Wb.recordLogx(object, type, 2);
  },
  /**
   * Logs throwable object and outputs it to the current IDE console.
   * @param {Throwable} throwable Exception object.
   */
  recordExcept(throwable) {
    if (Config.logEnabled && LogUtil.logger.isErrorEnabled() || Config.consolePrint)
      Wb.recordLog(throwable == null ? String(throwable) : SysUtil.getStackMessage(throwable), 2);
  },
  /**
   * Db-Logs throwable object and outputs it to the current IDE console.
   * @param {Throwable} throwable Exception object.
   * @param {String} [type] Log content type.
   */
  recordExceptx(throwable, type) {
    if (Config.logEnabled || Config.consolePrint)
      Wb.recordLogx(throwable == null ? String(throwable) : SysUtil.getStackMessage(throwable), type, 2);
  },
  /**
   * Logs object as fatal and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordFatal(object) {
    Wb.recordLog(object, 4);
  },
  /**
   * Logs object as trace and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   */
  recordTrace(object) {
    Wb.recordLog(object, 5);
  },
  /**
   * Logs object as the specified type and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   * @param {Number} [type] Log type:
   * -0: Infomation, default value.
   * -1: Warning
   * -2: Error
   * -3: Debug
   * -4: Fatal
   * -5: Trace
   */
  recordLog(object, type = 0) {
    if (Config.logEnabled) {
      let logger = LogUtil.logger;
      switch (type) {
        case 0:
          logger.info(object);
          break;
        case 1:
          logger.warn(object);
          break;
        case 2:
          logger.error(object);
          break;
        case 3:
          logger.debug(object);
          break;
        case 4:
          logger.fatal(object);
          type = 2;
          break;
        case 5:
          logger.trace(object);
          type = 0;
          break;
      }
    }
    Wb.log(object, null, type);
  },
  /**
   * Db-Logs object as the specified type and outputs it to the current IDE console.
   * @param {Object} object Object to log.
   * @param {String} [type] Log content type.
   * @param {String} [level] Log level:
   * -0: Infomation, default value.
   * -1: Warning
   * -2: Error
   */
  recordLogx(object, type, level = 0) {
    if (Config.logEnabled)
      LogxUtil.log(object, level, type, request, false);
    Wb.log(object, null, level);
  },
  /**
   * Convert an object to a string. Unlike `String(object)`, this method uses the {#Wb.encode} method to encode
   * non-Java object and array.
   * @param {Object} object The object to convert.
   * @return {String/Object} The converted text.
   */
  toText(object) {
    if (object == null)
      return String(object);
    else if (!Java.isJavaObject(object) && (Wb.isObject(object) || Wb.isArray(object)))
      return Wb.encode(object);
    else
      return object.toString();
  },
  /**
   * Set the "content-type" information in the Response header.
   * @param {String} [filename] The exported file name. Defaults to "data".
   * @param {String/Boolean} [contentType]  The content type, e.g., "image/png" for PNG images. `true` means forcing
   * download with "application/force-download". Defaults to "application/octet-stream".
   * @param {Number} [size] The "content-length" in the Response header.
   */
  setContentType(filename, contentType, size) {
    filename ??= 'data';
    if (contentType === true)
      contentType = 'application/force-download';
    response.setHeader('content-type', contentType || 'application/octet-stream');
    response.setHeader('content-disposition', 'attachment;filename=' + encodeURIComponent(filename));
    if (size != null) {
      response.setHeader('content-length', String(size));
      response.setContentLength(size);
    }
  },
  /**
   * Export data to the client.
   * @param {InputStream/Wb.File/File/String/byte[]} [data] The data to export. If it's a string, it represents a file
   * path. Defaults to null, indicating empty data.
   * @param {String} [filename] The name of the exported file. Defaults to "data".
   * @param {Number} [size] The size of the data in bytes.
   * @param {String/Boolean} [contentType] The content type, e.g., "image/png" for PNG images. `true` means forcing
   * download with "application/force-download". Defaults to "application/octet-stream".
   */
  exportData(data, filename, size, contentType) {
    let os, isByteArray;

    try {
      isByteArray = data instanceof ByteArray;
      if (Wb.isString(data) || data instanceof File)
        data = new Wb.File(data);
      if (data instanceof Wb.File) {
        size ??= data.length
        filename ??= data.name;
        data = data.stream;
      }
      if (data instanceof ByteArrayInputStream || data instanceof FileInputStream)
        size ??= data.available();
      else if (isByteArray)
        size ??= data.length;
      Wb.setContentType(filename, contentType, size);
      os = response.getOutputStream();
      if (isByteArray)
        os.write(data);
      else
        IOUtils.copy(data, os);
    } finally {
      if (data instanceof InputStream) {
        SysUtil.close(data);
      }
    }
    response.flushBuffer();
  },
  /***/
  raise(msg, code, error) {
    if (error !== undefined) {
      let i;
      if (error instanceof Classes.Throwable)
        error = SysUtil.getStackMessage(error);
      else
        error = error.stack || String(error);
      i = error.timesIndexOf('\n', 30);
      if (i > 0 && i < error.length)
        error = error.substr(0, i + 1) + '...';
      Wb.recordError(error);
    }
    if (code)
      throw '##' + code + ':' + msg;
    else
      throw msg;
  },
  /**
   * Load the specified js or mjs script file. If the file has already been loaded, it will not be loaded again. If the
   * file does not exist, an exception will be thrown.
   * Example:
   *
   *     Wb.load('wb/ss/my.js'); // Load the file under the application root folder
   *     Wb.load('./foo/bar.mjs'); // Load the foo/bar.mjs file in the current folder
   *     let module = Wb.load('../foo/my.mjs'); // Load the foo/my.mjs module file in the parent folder
   *     module.exportObject.method(); // Call the method of the exported exportObject in the module
   *
   * @param {String} path File path. A path starting with "./" or "../" is relative to the current file; otherwise, it is
   * relative to the application root folder.
   * @return {Object} When loading an mjs file, returns the exported module object or default object (when exported using
   * `export default`); returns null for all other files.
   */
  load(path) {
    let result;

    if (path.includes('./')) {
      if (path.startsWith('./') || path.startsWith('../'))
        path = Context.path + path;
      path = Wb.normalizePath(path);
    }
    if (path in Globals) {
      result = Globals[path];
    } else {
      let source, oldPath;

      source = SourceBuffer.get(path);
      oldPath = Context.path;
      Context.path = Wb.getDirectory(path);
      try {
        Globals[path] = undefined; // loaded mark
        result = Globals.context.eval(source);
      } catch (e) {
        Globals[path] = { __except$__: true, e };
        Wb.raise(e);
      } finally {
        Context.path = oldPath;
      }
      if (path.endsWith('.mjs')) {
        if (result && 'default' in result)
          result = result.default;
      } else {
        result = null;
      }
      Globals[path] = result;
    }
    if (result?.__except$__)
      Wb.raise(result.e);
    else
      return result;
  },
  /**
   * Run the XWL module server-side script without permission verification. See also {#Wb.invoke}.
   * Example:
   *
   *     Wb.run('dbe'); //  Run the module via module shortcut "dbe"
   *     Wb.run('my/file.xwl'); // Run the my/file.xwl file under the module root folder
   *     Wb.run('./my/file.xwl'); // Run the my/file.xwl file in the current folder
   *     Wb.run('../my/file'); // Run the my/file file in the parent folder(the .xwl extension can be omitted)
   *     Wb.run('m?xwl=my/file', {param1: 'abc'}); // Run the module via module URI with params
   *
   * @param {String} path Module path. It can be a file relative path, URI, or module shortcut. A path starting with
   * "./" or "../" is relative to the current file; otherwise, it is relative to the module root folder.
   * @param {Object} [params] Parameters object.
   * @return {Object} The return value of the script.
   */
  run(path, params) {
    let result, fn, oldPath, module;

    if (params)
      Wb.set(params);
    path = Wb.getModulePath(path);
    module = Xwl.get(path);
    if (!module)
      Wb.raise('Module "' + path + '" not found.');
    fn = Globals[path];
    if (!fn) {
      if (module.serverSource)
        result = Globals.context.eval(module.serverSource);
      else
        result = Wb.emptyFn;
      fn = Globals[path] = result;
    }
    oldPath = Context.path;
    Context.path = 'wb/modules/' + Wb.getDirectory(path);
    try {
      result = fn();
    } finally {
      Context.path = oldPath;
    }
    if (module.serverMethod)
      SysUtil.executeMethod(module.serverMethod, request, response, null, null);
    return result;
  },
  /**
   * Run the XWL module server-side script and output client-side content to the client without permission
   * verification. See also {#Wb.run}.
   * Example:
   *
   *     let text = Wb.invoke('module', params, true); // Get module client-side content to text variable
   *
   * @param {String} path Module path. It can be a file relative path, URI, or module shortcut. A path starting with
   * "./" or "../" is relative to the current file; otherwise, it is relative to the module root folder.
   * @param {Object} [params] Parameters object.
   * @param {String/Boolean} [returnType] The type of return value:
   * -null: Return value of the server-side script. Client-side content is directly output to response. Default.
   * -'text'/true: All client-side UTF-8 string content. Setting this value will capture the client-side output into a variable.
   * -'bytes': Similar to 'text'/true mode. Replaces strings with bytes.
   * -'resultText': Array of server-side script's return value and client-side string([returnValue, text]).
   * -'resultBytes': Array of server-side script's return value and client-side bytes([returnValue, bytes]).
   * @param {Boolean} [isClosure] Whether to return closure scripts. `true` returns only the closure part; `false` returns the
   * complete HTML; null automatically determines based on the request header. Defaults to null.
   * @return {Object/Array} Result based on the type specified by "returnType".
   */
  invoke(path, params, returnType, isClosure) {
    let resp, result, module;

    try {
      if (returnType) {
        resp = response;
        response = new Classes.VirtualResponse(null);
      }
      path = Wb.getModulePath(path);
      module = Xwl.get(path);
      if (!module)
        Wb.raise('Module "' + path + '" not found.');
      result = this.run(path, params);
      if (module.hasXwl)
        module.loadXwl(request, response, null, null);
      if (module.hasStateData)
        module.loadStateData(request);
      if (module.hasModuleBind)
        module.loadModuleBind(request);
      if (!response.isCommitted() && module.hasClientScript) {
        if (isClosure == null) {
          let cs = request.getHeader("Closurescript");
          isClosure = cs ? Wb.parseBool(cs) : WebUtil.fromAjax(request);
        }
        if (isClosure) {
          if (module.hasParam)
            WebUtil.send(response, WebUtil.replaceParams(module.getClosureScript(), request));
          else {
            if (Config.xwlEtag) {
              let fileEtag = module.lastModified;
              if (fileEtag.equals(request.getHeader("If-None-Match"))) {
                response.setStatus(304);
                return;
              } else {
                response.setHeader('Etag', fileEtag);
              }
            }
            WebUtil.send(response, module.getClosureScript());
          }
        } else {
          let html = Xwl.getHTML(module, request);
          if (module.hasParam)
            WebUtil.send(response, WebUtil.replaceParams(html, request));
          else
            WebUtil.send(response, html);
        }
      }
      // Get result
      switch (returnType) {
        case 'text':
        case true:
          result = response.getText();
          break;
        case 'bytes':
          result = response.getBytes();
          break;
        case 'resultText':
          result = [result, response.getText()];
          break;
        case 'resultBytes':
          result = [result, response.getBytes()];
          break;
      }
    } finally {
      if (returnType)
        response = resp;
    }
    return result;
  },
  /**
   * Run the XWL module server-side script and return client-side closure script without permission verification. See
   * also {#Wb.run} and {#Wb.invoke}.
   * Example:
   *
   *     let clientScript = Wb.execute('admin/dbe');
   *
   * @param {String} path Module path. It can be a file relative path, URI, or module shortcut. A path starting with
   * "./" or "../" is relative to the current file; otherwise, it is relative to the module root folder.
   * @param {Object} [params] Parameters object.
   * @return {String} The client-side closure script.
   */
  execute(path, params) {
    return Wb.invoke(path, params, true, true);
  },
  /**
   * Create a new thread and run the function immediately. See also {#Wb.poolStart}.
   * Example:
   *
   *     let map = Wb.startThread(params => {
   *       Wb.log(params.date);
   *       return { result: 'ok' };
   *     }, { foo: 'bar', abc: 123, date: new Date() });
   *     map.thread.join(); // Wait for thread
   *     Wb.log(map.result); // show result: {result: 'ok'}
   *
   * @param {Function} fn The function to run. Since fn runs in an independent thread and execution context, it cannot
   * reference external variables. Only parameters in `params` object can be used.
   * @param {Object} .params The parameters object.
   * @param {Object} [params] The parameters object passed to fn.
   * @param {Boolean} [noContext] Whether not to pass the HttpSession to the new thread.
   * @return {Map} The returned map, consisting of the following members:
   * -"thread": Thread object.
   * -"result": The string result of the execution. Accessible only after the thread has finished running.
   * -"e": Exception object, if an exception occur.
   */
  startThread(fn, params, noContext) {
    return SysUtil.startThread('params=Wb.toJs(params);' + fn.toScript(), Wb.toJava(params),
      noContext ? null : request.getSession(false));
  },
  /**
   * Schedule the function to run in the thread pool. If not all threads in the thread pool are running, it will be executed
   * immediately in another thread; otherwise, it will be queued for execution. See also {#startThread}.
   * Example:
   *
   *     Wb.poolStart(params => {
   *       Wb.log(params.date);
   *     }, { foo: 'bar', abc: 123, date: new Date() });
   *
   * @param {Function} fn The function to run. Since fn runs in an independent thread and execution context, it cannot
   * reference external variables. Only parameters in `params` object can be used.
   * @param {Object} .params The parameters object.
   * @param {Object} [params] The parameters object passed to fn.
   * @param {Boolean} [noContext] Whether not to pass the HttpSession to the new thread.
   * @return {ScheduledFuture} Java ScheduledFuture object. Use `future.cancel(false)` to cancel execution.
   */
  poolStart(fn, params, noContext) {
    return Wb.setTimeout(fn, 0, params, noContext);
  },
  /**
   * Execute the function periodically. Leaked interval tasks can be cleared via [Run] -> [Reload System] in
   * the IDE.
   * Example:
   *
   *     let future = Wb.setInterval(params => {
   *       Wb.log(params.date);
   *       return { result: 'ok' };
   *     }, 1000, { foo: 'bar', abc: 123, date: new Date() });
   *     Wb.sleep(3000);
   *     future.cancel(false); // cancel setInterval
   *
   * @param {Function} fn The function to run. Since fn runs in an independent thread and execution context, it cannot
   * reference external variables. Only parameters in `params` object can be used.
   * @param {Object} .params The parameters object.
   * @param {Number} [interval] The interval in milliseconds. Defaults to 10.
   * @param {Object} [params] The parameters object passed to fn.
   * @param {Boolean} [noContext] Whether not to pass the HttpSession to the new thread.
   * @return {ScheduledFuture} Java ScheduledFuture object. Use `future.cancel(false)` to cancel execution.
   */
  setInterval(fn, interval, params, noContext) {
    return SysUtil.setInterval('params=Wb.toJs(params);' + fn.toScript(), interval ?? 10, Wb.toJava(params),
      noContext ? null : request.getSession(false));
  },
  /**
   * Execute the function after a specified delay. Leaked interval tasks can be cleared via [Run] -> [Reload System] in
   * the IDE.
   * Example:
   *
   *     let future = Wb.setTimeout(params => {
   *       Wb.log(params.date);
   *       return { result: 'ok' };
   *     }, 1000, { foo: 'bar', abc: 123, date: new Date() });
   *     // future.cancel(false); // cancel setTimeout
   *
   * @param {Function} fn The function to run. Since fn runs in an independent thread and execution context, it cannot
   * reference external variables. Only parameters in `params` object can be used.
   * @param {Object} .params The parameters object.
   * @param {Number} [delay] The delay in milliseconds. Defaults to 0.
   * @param {Object} [params] The parameters object passed to fn.
   * @param {Boolean} [noContext] Whether not to pass the HttpSession to the new thread.
   * @return {ScheduledFuture} Java ScheduledFuture object. Use `future.cancel(false)` to cancel execution.
   */
  setTimeout(fn, delay, params, noContext) {
    return SysUtil.setTimeout('params=Wb.toJs(params);' + fn.toScript(), delay ?? 0, Wb.toJava(params),
      noContext ? null : request.getSession(false));
  },
  /**
   * Get the relative path of the module file.
   * Example:
   *
   *     Wb.getModulePath('m?xwl=admin/user'); // returns: "admin/user.xwl"
   *     Wb.getModulePath('user'); // returns: "admin/user.xwl"
   *     Wb.getModulePath('admin/user.xwl'); // returns: "admin/user.xwl"
   *
   * @param {String} path Module file path, url or shortcut.
   * @return {String} Module path.
   */
  getModulePath(path) {
    return FileUtil.getXwlPath(path, Context.path);
  },
  /**
   * Convert an InputStream to ByteArrayInputStream.
   * @param {InputStream} inputStream InputStream object.
   * @return {ByteArrayInputStream} ByteArrayInputStream object.
   */
  toByteStream(inputStream) {
    if (inputStream) {
      if (inputStream instanceof ByteArrayInputStream)
        return inputStream;
      let bytes;
      try {
        bytes = IOUtils.toByteArray(inputStream);
      } finally {
        inputStream.close();
      }
      return new ByteArrayInputStream(bytes);
    }
    return null;
  },
  /**
   * Get the attribute/parameter value from the HttpSession attribute, HttpServletRequest attribute, or
   * HttpServletRequest parameter in order of priority from highest to lowest.
   * For multi-valued parameters, returns an ArrayList of them. For a file parameter, returns a
   * {stream, name, size} HashMap; for multiple files parameter, returns an ArrayList of such HashMaps.
   * For getting multi-valued parameters, see {#Wb.getParams} for details.
   * Example:
   *
   *     let param = Wb.get('param');
   *     let username = Wb.get('sys.username');
   *     let object = Wb.get(); // Returns an object composed of all attributes/parameters
   *
   * @param {String} [name] The name of the attribute or parameter. Omitted to return an object of all values.
   * @return {Object} Attribute or parameter value, null if not found.
   */
  get(name) {
    if (name == null) {
      // get all
      let jo = WebUtil.get(request), result = {};
      jo.keySet().forEach(k => result[k] = jo.opt(k));
      Wb.apply(result, Wb.payloadParams);
      return result;
    } else {
      // get single
      return WebUtil.get(request, name) ?? Wb.payloadParams?.[name] ?? null;
    }
  },
  /**
   * Get the attribute or parameter value. The difference from the {#Wb.get} method is that this method first gets
   * the parameter value specified by `name`, and if it is null, then gets the parameter value specified by `$name`.
   * @param {String} [name] The name of the attribute or parameter. Omitted to return an object of all values.
   * @return {Object} Attribute or parameter value, null if not found.
   */
  getx(name) {
    return Wb.get(name) ?? Wb.get('$' + name);
  },
  /**
   * Set the specified parameter's value to a "%" wrapped wildcard; if enclosed in "[]", use the value without "[]".
   * This feature is useful, such as in SQL LIKE wildcard queries.
   * Example:
   *
   *     Params.param1 = 'abc';
   *     Wb.setLike('param1'); // param1 is: "%abc%"
   *     Params.param1 = '[def]';
   *     Wb.setLike('param1'); // param1 is: "def"
   *
   * @param {String} name Parameter name.
   */
  setLike(name) {
    let value = Wb.get(name);

    if (value) {
      value = String(value);
      if (value.startsWith('[') && value.endsWith(']'))
        Wb.set(name, value.slice(1, -1));
      else
        Wb.set(name, '%' + value + '%');
    }
  },
  /**
   * Load a module and call the method of the module.
   * @param {String} modulePath Module path. See `path` parameter of {#Wb.load} for details.
   * @param {String} [functionName] The name of the method to call. Defaults to "default" method returned by the module.
   * @param {...Object} [args] The method parameters.
   * @return {Object} The value returned by the method.
   */
  loadCall(modulePath, functionName, ...args) {
    let module = Wb.load(modulePath);
    if (functionName)
      return module[functionName](...args);
    else
      return module(...args);
  },
  /**
   * Get the value of the specified configuration item.
   * Example:
   *
   *     title = Wb.getConfig('sys.app.title');
   *
   * @param {String} name The full name of the configuration item.
   * @return {Object} The value of the configuration item.
   */
  getConfig(name) {
    let value = Config.get(name);
    if (Wb.isDate(value))
      return Date.from(value);
    else if (value instanceof JSONArray || value instanceof JSONObject)
      return Wb.decode(value.toString());
    else
      return value;
  },
  /**
   * Set the value of the specified configuration item.
   *
   * @param {String} name The full name of the configuration item.
   * @param {Object} value The value of the configuration item.
   */
  setConfig(name, value) {
    Wb.checkDemo();
    if (Wb.isDate(value))
      value = new JavaDate(value.getTime());
    else if (Wb.isArray(value))
      value = new JSONArray(Wb.encode(value));
    else if (Wb.isObject(value))
      value = new JSONObject(Wb.encode(value));
    Config.set(name, value);
  },
  /**
   * Get string parameter value. See {#Wb.get} for details.
   * @param {String} name The name of the attribute or parameter.
   * @return {String} The String value, null if not found.
   */
  getString(name) {
    let val = Wb.get(name);
    return val == null ? val : String(val);
  },
  /**
   * Get boolean parameter value. See {#Wb.get} for details.
   * @param {String} name The name of the attribute or parameter.
   * @return {Boolean} The Boolean value, null if not found.
   */
  getBool(name) {
    let val = Wb.get(name);
    return (val === '' || val == null) ? val : Wb.parseBool(val);
  },
  /**
   * Get integer parameter value. See {#Wb.get} for details.
   * @param {String} name The name of the attribute or parameter.
   * @return {Number} The Integer value, null if not found.
   */
  getInt(name) {
    let val = Wb.get(name);
    return (val === '' || val == null) ? val : parseInt(val, 10);
  },
  /**
   * Get float parameter value. See {#Wb.get} for details.
   * @param {String} name The name of the attribute or parameter.
   * @return {Number} The Float value, null if not found.
   */
  getFloat(name) {
    let val = Wb.get(name);
    return (val === '' || val == null) ? val : parseFloat(val);
  },
  /**
   * Get date parameter value. See {#Wb.get} for details.
   * @param {String} name The name of the attribute or parameter.
   * @return {Date} The Date value, null if not found or the parameter value is an empty string.
   */
  getDate(name) {
    let val = Wb.get(name);
    if (Wb.isDate(val))
      return val;
    else
      return (val === '' || val == null) ? val : String(val).dateValue;
  },
  /**
   * Get object/array parameter value. See {#Wb.get} for details.
   * Example:
   *
   *     let object = Wb.getObject('jsonObject');
   *     let array = Wb.getObject('jsonArray');
   *
   * @param {String} name The name of the attribute or parameter.
   * @return {Object/Array} The Object/Array value, null if not found or the parameter value is an empty string.
   */
  getObject(name) {
    let val = Wb.get(name);
    if (Wb.isObject(val) || Wb.isArray(val))
      return val;
    else
      return (val === '' || val == null) ? val : Wb.decode(String(val));
  },
  /**
   * Get parameter value(s) and convert it to List/Array. See {#Wb.get} for details.
   * Example:
   *
   *     let files = Wb.getParams('fileInput');
   *     files.forEach(file => Wb.log(file.name));
   *
   * @param {String} name The name of the attribute or parameter.
   * @return {List/Array} The List/Array value, empty array if not found.
   */
  getParams(name) {
    let value = Wb.get(name);
    if (value instanceof Classes.List || Wb.isArray(value))
      return value;
    else
      return value ? [value] : [];
  },
  /**
   * Determines whether the specified parameter or attribute exists.
   * @param {String} name The name of the parameter or attribute.
   * @return {Boolean} `true` if it exists, otherwise returns `false`.
   */
  has(name) {
    return request.getParameter(name) != null || request.getAttribute(name) != null ||
      request.getSession(false)?.getAttribute(name) != null;
  },
  /**
   * Gets the first header value with the specified name from the current HttpServletRequest. Use {#getHeaders} to
   * get multiple header values.
   * @param {String} name The name of the header.
   * @return {String} The header value. Returns null if not found.
   */
  getHeader(name) {
    return request.getHeader(name);
  },
  /**
   * Gets the header values with the specified name from thecurrent HttpServletRequest. Use {#getHeader} to get
   * simple header value.
   * @param {String} name The name of the header.
   * @return {String[]} The header values. Returns an empty array if not found.
   */
  getHeaders(name) {
    let v = request.getHeaders(name), result = [];
    if (!v)
      return result;
    while (v.hasMoreElements())
      result.push(v.nextElement());
    return result;
  },
  /**
   * Sets values to the request's attributes.
   * Example:
   *
   *     Wb.set('name', value);
   *     Wb.set({name1: value1, name2: value2});
   *
   * @param {Object/String} object An object containing attribute names and values, or a string representing a single
   * attribute name.
   * @param {Object} [value] The value to set for the attribute if `object` is a string.
   */
  set(object, value) {
    if (Wb.isString(object)) {
      request.setAttribute(object, value);
    } else {
      Wb.each(object, (k, v) => request.setAttribute(k, v));
    }
  },
  /**
   * Checks whether the current user is logged into the system. If not logged in, sends "$$login" for AJAX requests,
   * otherwise forwards to the login page.
   * @return {Boolean} `true` if successfully logged in, `false` otherwise.
   */
  checkLogin() {
    if (WebUtil.isLogined(request)) {
      return true;
    } else {
      response.setStatus(401);
      if (WebUtil.fromAjax(request))
        WebUtil.send(response, '$$login');
      else
        Wb.invoke(Wb.getConfig('sys.session.loginPage'));
      return false;
    }
  },
  /**
   * Sends the specified object to client(s). This method is used for both HTTP responses and WebSocket messages. For
   * HTTP responses, the buffer is flushed immediately after sending. If {#globalThis.inWSSession} is true, the object
   * is sent to the current WebSocket session.
   * Example:
   *
   *     Wb.send('text'); // Sends text
   *     Wb.send(123); // Sends a number as a string
   *     Wb.send(new Date()); // Sends a date as a string
   *     Wb.send({foo: 'bar'}); // Sends an object as an encoded string
   *     Wb.send([1, 2, 3]); // Sends an array as an encoded string
   *     Wb.send(inputStream); // Sends an input stream. For WebSocket, only the first client can receive the data (unidirectional)
   *     Wb.send(bytes); // Sends a byte array (byte[])
   *     Wb.send('text', 'mySocket'); // Sends content to the current user's WebSockets with the name 'mySocket'
   *     Wb.send('text', 'mySocket', 'admin'); // Sends content to all WebSockets of "admin" users with the name 'mySocket'
   *     Wb.send({ type: 'log', style: 3, data: 'msg' }, '$ide', true); // Sends content to the IDE's WebSockets
   *
   * @param {Object} object The object to be sent. The object can be of any data type.
   * @param {String} [socketName] WebSocket client name for WebSocket messages.
   * @param {String/HttpServletRequest/HttpSession/Boolean} [userid] Specifies the target recipients for the WebSocket
   * message. A String represents a user ID; an HttpServletRequest object represents the user associated with the request;
   * an HttpSession object represents the user associated with the session; `true` represents all logged-in users;
   * `false` represents all non-logged-in users; "*" represents all users (both logged-in and non-logged-in).
   * The default value is null, indicating the message is sent to the current user.
   */
  send(object, socketName, userid) {
    let isJson;

    if (!(object instanceof InputStream) && !(object instanceof ByteArray)) {
      if (object == null)
        object = String(object);
      else if (!Java.isJavaObject(object) && (Wb.isObject(object) || Wb.isArray(object))) {
        object = Wb.encode(object);
        isJson = true;
      } else
        object = object.toString();
    }
    if (socketName) {
      if (userid === true || userid === false || userid == '*')
        WSUtil.broadcast(socketName, object, userid == '*' ? null : userid);
      else
        WSUtil.send(userid ?? request, socketName, object);
    } else {
      if (globalThis.inWSSession)
        WSUtil.send(session, object); // pass session param from WebSocket service context
      else {
        if (isJson)
          response.setContentType('application/json;charset=utf-8');
        WebUtil.send(response, object);
      }
    }
  },
  /**
   * Initiates an HTTP request to the specified URL. See also {#fetch}.
   * Example:
   *
   *     let html = Wb.submit('https://developer.mozilla.org'); // Fetches the page content
   *     let object = Wb.submit({ url: 'http://localhost/wb/m?xwl=test', params: { foo: 'bar','k|file.png':stream }});
   *     let result = Wb.submit({ url: 'http://localhost:8095/m?xwl=test404', all: true, silent: true });
   *
   * @param {Object/String} configs The request configuration object or URL.
   * @param {String} .url The URL for the request.
   * @param {Object} [.params] The request parameters object. If the `data` property is specified or the request uses
   * the `GET` method, the parameters will be encoded into the URL. The `params` value support
   * String/Number/Date/File/Wb.File/byte[]/InputStream and other types. For specify file name set key to name|filename.
   * @param {String/Object/Array/InputStream/byte[]} [.data] The payload data to be submitted in the request body. If data
   * is an Object or Array, the contentType will default to "application/json".
   * @param {String} [.method] The HTTP method to use for the request, such as "POST" or "GET". Defaults to "POST" if
   * params or data is specified, otherwise "GET".
   * @param {Object} [.header] The request header configuration object.
   * @param {Boolean} [.form] Whether to submit parameters using "multipart/form-data" encoding. Force to `true` if
   * `params` contains InputStream/byte[]. When this parameter is specified, the `data` parameter becomes invalid.
   * @param {HttpServletRequest} [.request] Adds header from the request object to this request's headers.
   * @param {String} [.charset] The character encoding for sending text. Defaults to "utf-8".
   * @param {Enum} [.resultType] Result type. If specified InputStream type, set `callback` parameter.
   * -false: No result.
   * -true: Auto detect text or byte[]. Default value.
   * -'text': Text string. String charset see `resultCS`.
   * -'bytes': Bytes array.
   * @param {String} [.resultCS] The character encoding used when decoding the response result as text. Defaults to
   * auto detection.
   * @param {Boolean} [.all] Whether to return an object containing multiple values, including:
   * -"result": The response result
   * -"header": The header object
   * -"cookie": The cookie value
   * -"code": The response status code
   * @param {String} [.cookie] The cookie value to set.
   * @param {Boolean} [.ajax] Whether to add the XMLHttpRequest request marker in the header.
   * @param {Boolean} [.silent] Whether to suppress exceptions when the returned status code is not [200-299].
   * @param {Number} [.timeout] The timeout for connection and reading in ms. 0 means never timeout. Defaults to 30000.
   * @param {Function} [.callback] A callback function for reading stream data, typically used for reading potentially
   * large streams. When specified, the returned value will be `undefined`.
   * @param {Object} [..resp] All response values object. See `all` parameter.
   * @param {String} [.host] The proxy server address.
   * @param {Number} [.port] The proxy server port number. Defaults to 8080.
   * @param {String} [.proxyType] The proxy server type. Defaults to "HTTP".
   * @param {String/Object/Array/InputStream/byte[]} [object] Request parameters or payload data. Object type is
   * treated as `params`, others as `data`.
   * @return {String/byte[]/Object} The response result, which depends on the `resultType` parameters.
   */
  submit(configs, object) {
    let result, responseResult, params, copyParams, data, url, resultType, configRsType, request, resultCS, getCharset,
      header, callback, charset, streams = [];

    getCharset = contentType => {
      if (!contentType) return;
      let str;
      if (Wb.isArray(contentType)) {
        str = contentType.map(item => String(item ?? '')).join('; ');
      } else if (Wb.isString(contentType)) {
        str = contentType;
      } else {
        return;
      }
      if (!str) return;
      str = str.toLowerCase().trim();
      let pos = str.indexOf('charset=');
      if (pos !== -1) {
        let charset = str.slice(pos + 8), semiPos = charset.indexOf(';');
        if (semiPos !== -1) charset = charset.slice(0, semiPos);
        charset = charset.trim();
        if ((charset.startsWith('"') && charset.endsWith('"')) || (charset.startsWith("'") && charset.endsWith("'"))) {
          charset = charset.slice(1, -1);
        }
        if (charset) return charset;
      }
      const textMimes = ['text/', 'application/javascript', 'application/x-javascript', 'application/json', 'application/xml'];
      if (textMimes.some(item => str.includes(item))) return 'utf-8';
      return;
    }
    if (object) {
      if (Wb.isObject(object))
        params = object;
      else
        data = object;
    }
    if (Wb.isString(configs)) {
      url = configs;
      configs = {};
    } else {
      url = configs.url;
      params ??= configs.params;
      data ??= configs.data;
    }
    try {
      if (data instanceof InputStream)
        streams.push(data);
      if (params) {
        copyParams = {};
        Wb.each(params, (k, v) => {
          if (v instanceof Wb.File)
            v = v.file;
          if (v instanceof File) {
            if (!k.includes('|'))
              k = k + '|' + v.getName();
            v = new FileInputStream(v); // auto close in WebUtil.submit
            streams.push(v);
          } else if (Wb.isArray(v)) {
            let names = [];
            v.each((item, i) => {
              if (item instanceof Wb.File)
                item = item.file;
              if (item instanceof File) {
                names.push(item.getName());
                item = new FileInputStream(item); // auto close in WebUtil.submit
                streams.push(item);
              } else {
                names.push('');
              }
              v[i] = item;
            });
            if (!k.includes('|'))
              k = k + '|' + names.join('|');
          } else if (v instanceof InputStream) {
            streams.push(v);
          }
          copyParams[k] = v;
        });
      }
      resultCS = configs.resultCS;
      configRsType = configs.resultType ?? true;
      callback = configs.callback;
      if (callback)
        resultType = 2;
      else if (configRsType === false)
        resultType = 0;
      else
        resultType = 1;
      header = Wb.copy(configs.header);
      request = configs.request;
      if (request) {
        const restrictHeaders = ["connection", "content-length", "expect", "host", "upgrade"];
        let name, names = request.getHeaderNames();

        while (names.hasMoreElements()) {
          name = names.nextElement();
          if (!restrictHeaders.includes(name))
            header[name] = request.getHeader(name);
        }
      }
      if (configs.ajax) {
        header['X-Requested-With'] = 'XMLHttpRequest';
        header['W-Requested-With'] = 'XMLHttpRequest';
      }
      if (configs.cookie)
        header.Cookie = configs.cookie;
      charset = configs.charset;
      if ((Wb.isObject(data) || Wb.isArray(data)) && !Wb.findValue(header, 'content-type'))
        header['content-type'] = 'application/json;charset=' + (charset ?? 'utf-8');
    } catch (e) {
      streams.each(item => SysUtil.close(item));
      Wb.raise(e);
    }
    result = WebUtil.submit(url, configs.method, copyParams ? Wb.toJava(copyParams) : null, data ? Wb.toJava(data) : null,
      header ? Wb.toJava(header) : null, configs.timeout ?? 30000, configs.form ?? false, resultType, charset,
      configs.host, configs.port ?? 8080, configs.proxyType);
    result = Wb.toJs(result);
    result.header = Wb.toJs(result.header);
    responseResult = result.result;
    if (!resultCS && (configRsType === true || configRsType == 'text')) {
      resultCS = getCharset(Wb.findValue(result.header, 'content-type'));
      try {
        resultCS &&= Java.type('java.nio.charset.Charset').forName(resultCS);
      } catch (e) {
      }
      if (configRsType !== true)
        resultCS ??= Wb.utf8;
    }
    if (resultCS && responseResult != null && resultType != 2) {
      result.result = responseResult = new JavaString(responseResult, resultCS);
    }
    if (!configs.silent && (result.code < 200 || result.code >= 300)) {
      let errorText;

      if (Wb.isString(responseResult))
        errorText = responseResult;
      else if (responseResult instanceof ByteArray)
        errorText = new JavaString(responseResult, Wb.utf8);
      else
        errorText = 'HTTP ' + result.code + ' error.';
      Wb.raise(errorText);
    }
    if (callback) {
      try {
        callback(result);
      } finally {
        responseResult.close();
      }
    } else
      return configs.all ? result : responseResult;
  },
  /**
   * Initiates an HTTP request to the specified URL. The difference between this method and the {#submit} method is that the
   * default values of the `all` and `silent` parameters are both true.
   * @return {String/byte[]/Object} The request result.
   */
  fetch(configs, object) {
    if (Wb.isString(configs))
      configs = { url: configs };
    return Wb.submit(Wb.apply({ all: true, silent: true }, configs), object);
  },
  /**
   * Method called after the system is ready.
   */
  onReady() {
    if (!SysUtil.isReady || SysUtil.libLoaded) {
      SysUtil.isReady = true;
      Wb.Query.init();
    }
  },
  /**
   * Flushes the underlying response buffer to send pending data immediately.
   */
  flush() {
    response.flushBuffer();
  },
  /**
   * Gets the text corresponding to the specified keyword, based on the current client language. Uses the default language
   * if the client language is unrecognized.
   * Example:
   *
   *     let text = Wb.str('minLength', 6);
   *
   * @param {String} key Predefined string keyword.
   * @param {...Object} [params] The parameters to populate into the keyword.
   * @return {String} Corresponding text value, or an empty string if the keyword is not found.
   */
  str(key, ...params) {
    if (request.isVirtual)
      return StrCls.format(key, ...params);
    else {
      let lang = request.getSession(false)?.getAttribute('sys.lang');
      if (lang)
        lang = StrCls.optLanguage(lang);
      else
        lang = StrCls.getLanguage(request);
      return StrCls.langFormat(lang, key, ...params);
    }
  },
  /**
   * Gets the closest language supported by the system based on the client's language. Uses the default language
   * if the client language is unrecognized.
   * @return {String} The closest language matching the client.
   */
  getLanguage() {
    return StrCls.getLanguage(request);
  }
});
Object.defineProperties(Wb, {
  /** @property {Object/Array} - Payload parameters for requests with application/json content-type. Returns `undefined` for
   * non-application/json content-type.  @getter */
  payloadParams: {
    get() {
      return Context.payloadParams ??= request.getHeader('content-type')?.includes('application/json') ?
        (request.getHeader('content-serialize') ? Wb.deserialize(Wb.payload || null, true) :
          Wb.decode(Wb.payload || null)) : undefined;
    },
    configurable: true
  },
  /** @property {String} - Raw payload text submitted via the request body. @getter */
  payload: {
    get() {
      let payload;

      payload = Context.payload;
      if (payload !== undefined)
        return payload;
      let stream = request.getInputStream();
      if (stream)
        payload = IOUtils.toString(stream, Wb.utf8);
      else
        payload = null;
      Context.payload = payload;
      return payload;
    },
    configurable: true
  },
  /** @property {Number} - Maximum number of records allowed to returns from database ResultSet. Specified by
   * {#Context.maxRows}, defaults to the config item `sys.db.maxRows`. @getter */
  maxRows: {
    get() {
      return Context.maxRows ?? Config.maxRows;
    },
    configurable: true
  },
  /** @property {String} - Username of the current user. Returns null if not found. @getter */
  username: {
    get() {
      return Wb.get('sys.username');
    },
    configurable: true
  },
  /** @property {String} - Display name of the current user. Returns null if not found. @getter */
  dispname: {
    get() {
      return Wb.get('sys.dispname');
    },
    configurable: true
  },
  /** @property {String} - User ID of the current user. Returns null if not found. @getter */
  userid: {
    get() {
      return Wb.get('sys.userid');
    },
    configurable: true
  },
  /** @property {String} - Department ID of the current user. Returns null if not found. @getter */
  deptid: {
    get() {
      return Wb.get('sys.deptid');
    },
    configurable: true
  },
  /** @property {Array} - Role IDs of the current user. Returns null if not found. @getter */
  roles: {
    get() {
      return Wb.get('sys.roles');
    },
    configurable: true
  },
  /** @property {Boolean} -  Whether the current user has the "admin" role. @getter */
  isAdmin: {
    get() {
      return Wb.roles?.includes('admin');
    },
    configurable: true
  }
});
/**
 * Extended class of Array. See{#%Array} for details.
 * @class Array
 */
Object.defineProperties(Array.prototype, {
  /** @property {String[]} - Returns an explicit Java String array. @getter */
  stringArray: {
    get() {
      return Java.to(this, Classes.StringArray);
    },
    configurable: true
  }
});
/**
 * Extended class of String. See {#%String} for details.
 * @class String
 */
Wb.apply(String.prototype, {
  /**
   * Gets the byte array of the current string in the specified charset. Server-side only.
   * @param {String} [charset] Charset encoding. Defaults to "utf-8".
   * @return {byte[]} The byte array value.
   */
  getBytes(charset) {
    return StringUtil.getBytes(this, charset ?? 'utf-8');
  },
  /**
   * Gets the ByteArrayInputStream of the current string in the specified charset. Server-side only.
   * @param {String} [charset] Charset encoding. Defaults to "utf-8".
   * @return {ByteArrayInputStream} The ByteArrayInputStream value.
   */
  getByteStream(charset) {
    return new ByteArrayInputStream(this.getBytes(charset));
  },
  /**
   * Determines whether the current string matches the specified wildcard.
   * @param {String} wildcard The wildcard pattern.
   * @param {Boolean} [caseSensitivity] Case sensitivity option:
   * -false: Case-insensitive (default)
   * -true: Case-sensitive
   * -null: Auto-detect based on the OS's filename case sensitivity
   * @return {Boolean} `true` if matched, `false` otherwise.
   */
  wildcardMatch(wildcard, caseSensitivity) {
    let me = this;

    caseSensitivity ??= false;
    if (caseSensitivity == null)
      return FilenameUtils.wildcardMatchOnSystem(me, wildcard);
    else if (caseSensitivity)
      return FilenameUtils.wildcardMatch(me, wildcard);
    else
      return FilenameUtils.wildcardMatch(me, wildcard, IOCase.INSENSITIVE);
  }
});
/**
 * A class that automatically executes the close method. After the current execution context ends, the system will
 * automatically call the {#close} method. This method will be executed regardless of exceptions or forced interruptions.
 */
Cls['Wb.Closable'] = class closable extends Wb.Base {
  /***/
  constructor() {
    super();
    Context.closable.add(this);
  }
  /**
   * Method automatically executed after the current execution context ends. Inherit this class and override this method
   * to ensure resource close and release. If this method has already been called, it will not execute again.
   * @param {Boolean} hasExcept Whether an exception occurred during the session execution.
   */
  close() {
    Context.closable.delete(this);
  }
}
/**
 * Server side file and folder access.
 */
Cls['Wb.File'] = class file extends Wb.Base {
  /** @property {Wb.File} - The application's root folder. */
  static get appFolder() {
    return this.appFolder$ = new Wb.File(Base.path);
  }
  /** @property {Wb.File} - The `wb` folder in the `{#app|appFolder}` folder. */
  static get wbFolder() {
    return this.wbFolder$ = new Wb.File(Base.path, 'wb');
  }
  /** @property {Wb.File} - The `module` folder in the `{#wb|wbFolder}` folder. */
  static get moduleFolder() {
    return this.moduleFolder$ = new Wb.File(Base.modulePath);
  }
  /**
   * Checks whether the specified parent folder contains the given child folder or file.
   * @param {Wb.File/File/String} parent Parent folder. Folder starting with '|' is relative to the application root.
   * @param {Wb.File/File/String} child Child folder or file. Folder starting with '|' is relative to the application root.
   */
  static checkContains(parent, sub) {
    if (Wb.isString(parent)) {
      if (parent.startsWith('|'))
        parent = new File(Base.path, parent.slice(1));
      else
        parent = new File(parent);
    } else if (parent instanceof Wb.File)
      parent = parent.file;
    if (Wb.isString(sub)) {
      if (sub.startsWith('|'))
        sub = new File(Base.path, sub.slice(1));
      else
        sub = new File(sub);
    } else if (sub instanceof Wb.File)
      sub = sub.file;
    if (!FileUtil.isAncestor(parent, sub))
      Wb.accessDenied(sub);
  }
  /**
   * Gets the list of system root files/folders. Returns null if there are none.
   * @param {String} [sortType] Sort type. Defaults to no sorting.
   * -'name': File name
   * -'size': File size
   * -'type': File type
   * -'date': Modification date
   * @param {Boolean} [desc] Whether to sort in descending order.
   * @return {Wb.File[]} List of system root files/folders.
   */
  static listRoots(sortType, desc) {
    let files = File.listRoots();

    if (files) {
      if (sortType)
        FileUtil.sort(files, sortType, !!desc);
      return files.map(file => new Wb.File(file));
    } else
      return null;
  }
  /**
   * Convert yaml to JSON object.
   * @param {String} text yaml text.
   * @return {Object} JSON object.
   */
  static yamlToObject(text) {
    return Wb.toJs(JsonUtil.yamlToJson(text));
  }
  /** @property {java.io.File} file The associated Java file object. */
  /**
   * Creates a file/folder object.
   * Example:
   *
   *     file = new Wb.File('foo/bar');
   *     file = new Wb.File(parent, 'sub'); // parent can be Wb.File/File/String
   *     file = new Wb.File(sysFile); // sysFile is Java file
   *     file = new Wb.File(wbFile); // wbFile is {#Wb.File} oject
   *
   * @param {Wb.File/File/String/Boolean} path1 Full path to a file/folder, parent folder, or `true`(represents {#appFolder}).
   * @param {String} [path2] Child file/folder path.
   */
  constructor(path1, path2) {
    super();
    if (path1 === true)
      path1 = Base.path;
    else if (path1 instanceof Wb.File)
      path1 = path1.file;
    if (path2)
      this.file = new File(path1, path2);
    else
      this.file = path1 instanceof File ? path1 : new File(path1);
    if (Config.isDemo && !FileUtil.isAncestor(Base.path, this.file))
      Wb.checkDemo();
  }
  /** @property {Wb.Lock} fileLock The file lock. @priv */
  /**
   * Locks the current file. Subsequent lock attempts on files with the same path will be blocked until the
   * {#unlock} method is called.
   */
  lock() {
    this.fileLock = new Wb.Lock(this.lockName);
  }
  /**
   * Unlocks the current file.
   */
  unlock() {
    this.fileLock.unlock();
  }
  /** @property {String} - File lock name. */
  get lockName() {
    return 'f:' + this.path;
  }
  /**
   * Determines whether the current file name matches the specified wildcard.
   * @param {String} wildcard Wildcard pattern.
   * @param {Boolean} [caseSensitivity] Case sensitivity option:
   * -false: Case-insensitive (default)
   * -true: Case-sensitive
   * -null: Auto-detect based on the OS's filename case sensitivity
   * @return {Boolean} `true` if matched, `false` otherwise.
   */
  match(wildcard, caseSensitivity) {
    return this.name.wildcardMatch(wildcard, caseSensitivity);
  }
  /** @property {Wb.File} - A uniquely named file in the current folder. */
  get uniqueFile() {
    let name = this.name, newName = name, extension, normalName, i = 1, parent;

    parent = this.parent.file;
    if (!parent)
      return this;
    while (new File(parent, newName).exists()) {
      normalName ??= this.normalName.replace(/\d+$/, '');
      if (extension == null) {
        extension = this.extension;
        if (extension)
          extension = '.' + extension;
      }
      newName = normalName + i++ + extension;
    }
    if (name == newName)
      return this;
    else
      return new Wb.File(parent, newName);
  }
  /** @property {Wb.File} - The minimized file associated with the current file. Returns null if not found. */
  get minFile() {
    let me = this;
    let file, name = me.name, pos = name.lastIndexOf('.');
    if (pos == -1) {
      file = null;
    } else {
      file = new Wb.File(me.parent, name.substr(0, pos) + '.min.' + name.substr(pos + 1));
      if (!file.exists)
        file = null;
    }
    return file;
  }
  /** @property {Boolean} - Whether the file is a minimized file, ending with `.min.*`. */
  get isMinFile() {
    let name = this.name, pos = name.lastIndexOf('.');
    if (pos != -1) {
      name = name.substr(0, pos);
      if (name.endsWith('.min'))
        return true;
    }
    return false;
  }
  /** @property {java.io.File} - Actual file/folder if the system has a configured sync folder (null if not in it). */
  get realFile() {
    return FileUtil.getRealFile(this.file);
  }
  /** @property {String} - Get the path of {#realFile} ("/" as separator). */
  get realFilePath() {
    return this.realFile ? FileUtil.getPath(this.realFile) : null;
  }
  /**
   * Remove current file from index.json.
   */
  removeIndex() {
    let me = this, indexFile, indexData;

    indexFile = new Wb.File(me.parent, 'index.json');
    if (indexFile.exists) {
      indexFile.lock();
      try {
        indexData = indexFile.object;
        indexData.items.remove(me.name);
        indexFile.prettyObject = indexData;
      } finally {
        indexFile.unlock();
      }
    }
  }
  /**
   * Add current file to index.json.
   */
  addIndex() {
    let me = this, indexFile, indexData, name, refName, items, pos = -1;

    if (!Wb.File.moduleFolder.contains(me.parent))
      return;
    indexFile = new Wb.File(me.parent, 'index.json');
    name = me.name;
    indexFile.lock();
    try {
      indexData = indexFile.exists ? indexFile.object : { title: '', icon: '', img: '', hideInMenu: '', items: [] };
      items = indexData.items;
      if (!items.includes(name)) {
        if (name.endsWith('.xwl')) {
          refName = name.slice(0, -4);
          pos = items.indexOf(refName);
        } else {
          refName = name + '.xwl';
          pos = items.indexOf(refName);
          if (pos != -1)
            pos++;
        }
        if (pos == -1)
          items.push(name);
        else
          items.insert(pos, name);
        indexFile.prettyObject = indexData;
      }
    } finally {
      indexFile.unlock();
    }
  }
  /**
   * Creates a new file.
   * @param {Boolean} [silent] Whether to suppress exceptions if creation fails.
   * @return {Boolean} `true` if the file does not exist and is successfully created; `false` otherwise.
   */
  createFile(silent) {
    Wb.checkDemo();
    let file = this.file, succ;

    if (!silent && file.exists()) {
      Wb.raise(Str.alreadyExists.format(this.path));
    }
    succ = file.createNewFile();
    if (succ) {
      let realFile = this.realFile;
      if (realFile) {
        if (!silent && realFile.exists())
          Wb.raise(Str.alreadyExists.format(this.realFilePath));
        succ = realFile.createNewFile();
        if (!silent && !succ)
          Wb.raise(Str.createFailed.format(this.realFilePath));
        realFile.setLastModified(file.lastModified());
      }
    } else if (!silent) {
      Wb.raise(Str.createFailed.format(this.path));
    }
    return succ;
  }
  /**
   * Creates a new folder.
   * @param {Boolean} [createParents] Whether to create the parent folder(s) if they do not exist.
   * @param {Boolean} [silent] Whether to suppress exceptions if creation fails.
   * @return {Boolean} `true` if the folder does not exist and is successfully created; `false` otherwise.
   */
  createFolder(createParents, silent) {
    Wb.checkDemo();
    let file = this.file, succ;

    if (!silent && file.exists()) {
      Wb.raise(Str.alreadyExists.format(this.path));
    }
    succ = createParents ? this.file.mkdirs() : this.file.mkdir();
    if (succ) {
      let realFile = this.realFile;
      if (realFile) {
        if (!silent && realFile.exists())
          Wb.raise(Str.alreadyExists.format(this.realFilePath));
        succ = createParents ? realFile.mkdirs() : realFile.mkdir();
        if (!silent && !succ)
          Wb.raise(Str.createFailed.format(this.realFilePath));
        realFile.setLastModified(file.lastModified());
      }
    } else if (!silent) {
      Wb.raise(Str.createFailed.format(this.path));
    }
    return succ;
  }
  /**
   * Deletes the current file/folder.
   * @param {Boolean} [silent] Whether to suppress exceptions when deletion fails.
   * @return {Boolean} `true` if succeeds, `false` otherwise.
   */
  remove(silent) {
    Wb.checkDemo();
    let succ = FileUtils.deleteQuietly(this.file);
    if (succ) {
      let realFile = this.realFile;
      if (realFile) {
        succ = FileUtils.deleteQuietly(realFile);
        if (!silent && !succ)
          Wb.raise(Str.deleteFailed.format(this.realFilePath));
      }
    } else if (!silent) {
      Wb.raise(Str.deleteFailed.format(this.path));
    }
    return succ;
  }
  /**
   * Determines whether the current folder contains the specified file/folder.
   * @param {Wb.File/String} file The file/folder to check.
   * @param {Boolean} [excludeSelf] Whether to exclude the current folder itself.
   * @return {Boolean} `true` if contains, `false` otherwise.
   */
  contains(file, excludeSelf) {
    if (Wb.isString(file))
      file = new Wb.File(file);
    return FileUtil.isAncestor(this.file, file.file, !excludeSelf);
  }
  /** @property {Boolean} - Whether the current file/folder is located within the root application folder (inclusive). */
  get inAppFolder() {
    return (this.path + '/').startsWith(Base.pathText);
  }
  /** @property {Boolean} - Whether the current file/folder is located within the module folder (inclusive). */
  get inModuleFolder() {
    return (this.path + '/').startsWith(Base.modulePathText);
  }
  /** @property {String} - Filename extension. */
  set extension(value) {
    Wb.checkDemo();
    let name = this.name, lastDotPos = name.lastIndexOf('.');

    if (lastDotPos != -1)
      name = name.substr(0, lastDotPos);
    this.name = name + '.' + value;
  }
  /***/
  get extension() {
    return FileUtil.getFileExt(this.name);
  }
  /** @property {String} - Filename without path. */
  set name(value) {
    Wb.checkDemo();
    if (this.name != value) {
      let parentFile = this.parent.file, realFile = this.realFile, dstFile = new File(parentFile, value),
        succ = (!dstFile.exists() || System.getProperty('os.name').toLowerCase().includes('win')) &&
          this.file.renameTo(dstFile);
      if (succ) {
        this.file = dstFile;
        if (realFile) {
          succ = realFile.renameTo(new File(realFile.getParentFile(), value));
          if (!succ)
            Wb.raise(Str.renameFailed.format(this.realFilePath));
        }
      } else {
        Wb.raise(Str.renameFailed.format(this.path));
      }
    }
  }
  /***/
  get name() {
    return this.file.getName();
  }
  /** @property {String} - Filename without path and extension. */
  get normalName() {
    let name = this.name, i = name.lastIndexOf('.');
    if (i != -1)
      name = name.substr(0, i);
    return name;
  }
  /** @property {String} - Full absolute path ("/" as separator). */
  get path() {
    return FileUtil.getPath(this.file);
  }
  /** @property {String} - Relative path ("/" as separator) within the root application folder (null if outside). */
  get relPath() {
    if (this.inAppFolder)
      return this.path.substr(Base.pathLen);
    else
      return null;
  }
  /** @property {String} - Relative path ("/" as separator) within the module folder (null if outside). */
  get modulePath() {
    if (this.inModuleFolder)
      return this.path.substr(Base.modulePathLen);
    else
      return null;
  }
  /** @property {String} - File type name. */
  get type() {
    return this.extension;
  }
  /** @property {Boolean} - Whether the current file exists. */
  get exists() {
    return this.file.exists();
  }
  /** @property {String} - File content as UTF-8 encoded string. Note: Accessing this property re-reads/writes the file. */
  set text(value) {
    Wb.checkDemo();
    if (Wb.isObject(value) || Wb.isArray(value))
      value = Wb.encode(value);
    value = String(value);
    this.writeString(String(value));
  }
  /***/
  get text() {
    return this.readString();
  }
  /** @property {Object/Array} - File content as JSON object or array. Note: Accessing this property re-reads/writes
   * the file. */
  set object(value) {
    Wb.checkDemo();
    let me = this, text;
    if (me.isModuleFile) {
      text = JsonUtil.jsonToYaml(Wb.toJava(value));
    } else {
      text = Wb.encode(value);
    }
    FileUtil.writeString(me.file, text, Wb.utf8);
    me.syncFile();
  }
  /***/
  get object() {
    let text = this.readString();
    if (!text)
      return {};
    if (this.isModuleFile && !text.trimLeft().startsWith('{')) {
      // yaml format
      return Wb.File.yamlToObject(text);
    } else {
      return text ? Wb.decode(text.trim()) : {};
    }
  }
  /** @property {Object/Array} - File content as pretty JSON object or array. Note: Accessing this property
    * re-reads/writes the file. */
  set prettyObject(value) {
    Wb.checkDemo();
    let text;
    if (this.isModuleFile) {
      text = JsonUtil.jsonToYaml(Wb.toJava(value));
    } else {
      text = Wb.encodePretty(value);
    }
    this.writeString(text);
  }
  /***/
  get prettyObject() {
    return this.object;
  }
  /**
   * Copies the file to the sync folder if the sync folder exists. @priv
   */
  syncFile() {
    Wb.checkDemo();
    let realFile = this.realFile;
    if (realFile) {
      FileUtils.copyFile(this.file, realFile);
    }
  }
  /** @property {byte[]} - File content as byte array. Note: Accessing this property re-reads/writes the file. */
  set bytes(value) {
    Wb.checkDemo();
    FileUtils.writeByteArrayToFile(this.file, value);
    this.syncFile();
  }
  /***/
  get bytes() {
    this.checkExists();
    return FileUtils.readFileToByteArray(this.file);
  }
  /** @property {ByteArrayInputStream} - In-memory byte array input stream of whole file content. No need to close
   * after access. */
  get byteStream() {
    return new ByteArrayInputStream(this.bytes);
  }
  /**
   * Writes the file to the specified OutputStream.
   * @param {OutputStream} os Output stream.
   */
  writeTo(os) {
    FileUtils.copyFile(this.file, os);
  }
  /**
   * Writes the specified InputStream to the file. Closes the stream after writing.
   * @param {InputStream} is Input stream.
   */
  readFrom(is) {
    try {
      Wb.checkDemo();
      FileUtils.copyInputStreamToFile(is, this.file);
      this.syncFile();
    } finally {
      SysUtil.close(is);
    }
  }
  /** @property {InputStream} - Sets InputStream to write to file. Auto-closes stream after writing. */
  set stream(value) {
    Wb.checkDemo();
    this.readFrom(value);
  }
  /** @property {InputStream} - Buffered input stream of the file. Must call `stream.close()` manually after use. */
  get stream() {
    this.checkExists();
    return new BufferedInputStream(new FileInputStream(this.file));
  }
  /** @property {String} - File content as Base64 text. Note: Accessing this property re-reads/writes the file. */
  set base64(value) {
    Wb.checkDemo();
    this.bytes = StringUtil.decodeBase64(value);
  }
  /***/
  get base64() {
    return StringUtil.encodeBase64(this.bytes);
  }
  /**
   * Gets the file content as text.
   * @param {String} [charset] Content charset (defaults to "utf-8").
   * @return {String} File text content.
   */
  readString(charset) {
    this.checkExists();
    return FileUtil.readString(this.file, charset ?? Wb.utf8);
  }
  /**
   * Writes text content to the file.
   * @param {String} content Text content to write.
   * @param {String} [charset] Content charset (defaults to "utf-8").
   */
  writeString(content, charset) {
    Wb.checkDemo();
    let me = this;

    if (me.isModuleFile)
      content = JsonUtil.jsonToYaml(content);
    FileUtil.writeString(me.file, content, charset ?? Wb.utf8);
    me.syncFile();
  }
  /**
   * Checks whether the file exists; throws an exception if not.
   */
  checkExists() {
    let me = this;
    if (!me.exists)
      Wb.raise(Str.notExists.format(me.path));
  }
  /** @property {Number} - File last modified time (milliseconds since epoch). */
  set lastModified(value) {
    Wb.checkDemo();
    let realFile = this.realFile;
    this.file.setLastModified(value);
    if (realFile)
      realFile.setLastModified(value);
  }
  /***/
  get lastModified() {
    return this.file.lastModified();
  }
  /** @property {Date} - File last modified date. */
  set lastModifiedDate(value) {
    this.lastModified = value.getTime();
  }
  /***/
  get lastModifiedDate() {
    return new Date(this.lastModified);
  }
  /**
   * Clears the file from buffer if buffered.
   */
  clearBuffer() {
    Wb.checkDemo();
    SysUtil.clearBuffer(this.file);
  }
  /**
   * Gets the current folder's file list. Returns null if it is a file.
   * @param {String} [sortType] Sort type. Defaults to no sorting.
   * -'name': File name
   * -'size': File size
   * -'type': File type
   * -'date': Modification date
   * @param {Boolean} [desc] Whether to sort in descending order.
   * @return {Wb.File[]} List of sub files/folders.
   */
  listFiles(sortType, desc) {
    let files = this.file.listFiles();

    if (files) {
      if (sortType)
        FileUtil.sort(files, sortType, !!desc);
      return files.map(file => new Wb.File(file));
    } else
      return null;
  }
  /** @property {Wb.File[]} - Gets sub files/folders. Returns null if not a folder. */
  get items() {
    return this.file.listFiles()?.map(file => new Wb.File(file)) ?? null;
  }
  /** @property {Wb.File[]} - Gets sorted sub files/folders by name. Returns null if not a folder.  */
  get orderItems() {
    return this.listFiles('name');
  }
  /**
   * Checks whether the current file path matches another file's (OS-dependent).
   * @param {Wb.File} file File to compare.
   * @return {Boolean} `true` if paths match, `false` otherwise.
   */
  equals(file) {
    return this.file.equals(file.file);
  }
  /** @property {Boolean} - Whether the current object is a file. */
  get isFile() {
    return this.file.isFile();
  }
  /** @property {Boolean} - Whether the current object is a folder. */
  get isFolder() {
    return this.file.isDirectory();
  }
  /** @property {Boolean} - Whether the current object is a module file.  */
  get isModuleFile() {
    return this.isFile && this.name.endsWith('.xwl');
  }
  /** @property {Number} - File size in bytes. */
  get length() {
    return this.file.length();
  }
  /** @property {Boolean} - Whether the object has sub files or folders. */
  get hasItems() {
    return this.file.list()?.length > 0;
  }
  /** @property {Wb.File} - Parent file; returns null if none. */
  get parent() {
    let parent = this.file.getParentFile();
    return parent ? new Wb.File(parent) : null;
  }
  /**
   * Traverses the current folder, executing the function for each direct sub file/folder.
   * Example:
   *
   *     folder.each(file => console.log(file));
   *
   * @param {Function} fn Function to execute. Stops traversal if returns `false`.
   * @param {Wb.File} fn.file Current file/folder.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in fn (defaults to the current folder).
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  each(fn, scope) {
    return this.items?.each(fn, scope ?? this) ?? true;
  }
  /**
   * Determines whether at least one file/folder in the current folder matches.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Wb.File} fn.file Current file/folder.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in fn (defaults to the current folder).
   * @return {Boolean} `true` if at least one file/folder matches, `false` otherwise.
   */
  some(fn, scope) {
    return this.items?.some(fn, scope ?? this) ?? false;
  }
  /**
   * Determines whether all files/folders in the current folder match.
   * @param {Function} fn The test function returns `true` to indicate a match, `false` otherwise.
   * @param {Wb.File} fn.file Current file/folder.
   * @param {Number} fn.index Current index.
   * @param {Object} [scope] `this` in fn (defaults to the current folder).
   * @return {Boolean} `true` if all files/folders match, `false` otherwise.
   */
  every(fn, scope) {
    return this.items?.every(fn, scope ?? this) ?? true;
  }
  /**
   * Recursively traverses the current folder, executing the function for each descendant file/folder.
   * Example:
   *
   *     folder.cascade(file => console.log(file));
   *
   * @param {Function} fn Function to execute. Stops traversal if returns `false`; skips subitems if returns null.
   * @param {Wb.File} fn.file Current file/folder.
   * @param {Wb.File} fn.parent Parent folder.
   * @param {Object} [scope] `this` in fn (defaults to the current folder).
   * @param {Boolean} [includeSelf] Whether to include the folder itself.
   * @param {Boolean} [ordered] Whether to sort by filename.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  cascade(fn, scope, includeSelf, ordered) {
    return Wb.cascade(this, fn, ordered ? 'orderItems' : 'items', scope, null, includeSelf, this);
  }
  /**
   * Recursively determines whether at least one descendant file/folder matches the condition. See {#some} for details.
   * @return {Boolean} `true` if at least one file/folder matches, `false` otherwise.
   */
  cascadeSome(...args) {
    return Wb.PT.cascadeSome.apply(this, args);
  }
  /**
   * Recursively determines whether all descendant files/folders match the condition. See {#every} for details.
   * @return {Boolean} `true` if all files/folders match, `false` otherwise.
   */
  cascadeEvery(...args) {
    return Wb.PT.cascadeEvery.apply(this, args);
  }
  /**
   * Recursively traverses the current folder (includes itself). See {#cascade} for details.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  cascadeSelf(fn, scope) {
    return this.cascade(fn, scope, true);
  }
  /**
   * Traverses upward from the current file/folder, executing the function for each parent folder.
   * @param {Function} fn Function to execute. Stops traversal if returns `false`.
   * @param {Wb.File} fn.parent Parent folder.
   * @param {Object} [scope] `this` in fn (defaults to the current file/folder).
   * @param {Boolean} [excludeSelf] Whether to exclude the current file/folder itself.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  bubble(fn, scope, excludeSelf) {
    return Wb.bubble(this, fn, 'parent', scope, excludeSelf);
  }
  /**
   * Traverses upward to check whether at least one parent folder matches the condition. See {#some} for details.
   * @return {Boolean} `true` if at least one folder matches, `false` otherwise.
   */
  bubbleSome(...args) {
    return Wb.PT.bubbleSome.apply(this, args);
  }
  /**
   * Traverses upward to check whether all parent folders match the condition. See {#every} for details.
   * @return {Boolean} `true` if all folders match, `false` otherwise.
   */
  bubbleEvery(...args) {
    return Wb.PT.bubbleEvery.apply(this, args);
  }
  /**
   * Traverses upward through parent folders (excludes current item by default). See {#bubble} for details.
   * @return {Boolean} `true` if traversal completed, `false` if interrupted.
   */
  bubbleParent(fn, scope) {
    return this.bubble(fn, scope, true);
  }
  /***/
  toString() {
    return this.path;
  }
  /***/
  toJSON() {
    return this.path;
  }
}
/**
 * Wrapper around a Java java.sql.Connection. Automatically closes when its execution
 * context ends, ensuring safe resource and transaction cleanup without explicit disposal.
 */
Cls['Wb.Connection'] = class connection extends Wb.Closable {
  /** @property {Object} - Cached connections by name. @priv */
  static connections = {};
  /** @property {Object} - Maps isolation level names to JDBC constants. */
  static isolationMap = { none: 0, uncommitted: 1, committed: 2, repeatable: 4, serializable: 8 };
  /**
   * Returns the connection for the given name in the current execution context; creates a new one if not exists.
   * @param {String} [name] Database source name. Defaults to the default source.
   * @return {Wb.Connection} The database connection.
   */
  static get(name) {
    name ||= Config.defaultSource;
    return this.connections[name] ??= new Wb.Connection(name);
  }
  /** @property {java.sql.Connection} connection Underlying Java database connection. */
  /** @property {String} name Database source name, if constructed by name. */
  /**
   * Constructor for creating a database connection instance.
   * @param {String/java.sql.Connection} [name] The database source name or an existing Java Connection object.
   * -If a `String` is provided: Creates a new connection using DataSource.getConnection(name).
   * -If a `java.sql.Connection` object is provided: Uses this object directly as the connection.
   * -If a `null` is provided: Uses `Config.defaultSource` as the connection.
   */
  constructor(name) {
    super();
    name ||= Config.defaultSource;
    if (Wb.isString(name)) {
      this.name = name;
      this.connection = DataSource.getConnection(name);
    } else {
      this.connection = name;
    }
  }
  /**
   * Creates a SQL statement wrapper.
   * @param {String} sql The SQL string.
   * @param {Boolean} [isCall] Whether to create a CallableStatement.
   * @param {Boolean} [returnKeys] Whether to return generated keys.
   * @return {Wb.Statement} The statement wrapper.
   */
  createStatement(sql, isCall, returnKeys) {
    let st;

    if (isCall && !returnKeys)
      st = this.connection.prepareCall(sql);
    else {
      if (returnKeys)
        st = this.connection.prepareStatement(sql, 1);
      else
        st = this.connection.prepareStatement(sql);
    }
    return new Wb.Statement(st, this);
  }
  /**
   * Starts a transaction. See {#Wb.startTrans} for details.
   */
  startTrans(isolation) {
    let conn = this.connection;
    if (conn.getAutoCommit()) {
      conn.setAutoCommit(false);
      if (isolation)
        this.isolation = isolation;
    }
  }
  /** @property {Boolean} - Whether SQL statements auto-commit after execution. */
  set autoCommit(value) {
    this.connection.setAutoCommit(value);
  }
  /***/
  get autoCommit() {
    return this.connection.getAutoCommit();
  }
  /** @property {String} - Transaction isolation level. Valid values:
   * -'none': Transactions not supported.
   * -'uncommitted': Dirty reads, non-repeatable reads, and phantoms possible.
   * -'committed': Prevents dirty reads; non-repeatable reads and phantoms possible.
   * -'repeatable': Prevents dirty and non-repeatable reads; phantoms possible.
   * -'serializable': Prevents dirty reads, non-repeatable reads, and phantoms.
   */
  set isolation(value) {
    let level = this.constructor.isolationMap[value?.toLowerCase()];
    if (level === undefined)
      Wb.raise('Invalid transaction isolation "' + value + '".')
    this.connection.setTransactionIsolation(level);
  }
  /***/
  get isolation() {
    return Wb.findKey(this.constructor.isolationMap, this.connection.getTransactionIsolation());
  }
  /**
   * Rolls back the current transaction and sets {#Wb.Connection.autoCommit} to `true`.
   */
  rollback() {
    let conn = this.connection;
    if (!conn.getAutoCommit()) {
      conn.rollback();
      conn.setAutoCommit(true);
    }
  }
  /**
   * Commits the current transaction and sets {#Wb.Connection.autoCommit} to `true`.
   */
  commit() {
    let conn = this.connection;
    if (!conn.getAutoCommit()) {
      conn.commit();
      conn.setAutoCommit(true);
    }
  }
  /** @property {java.sql.DatabaseMetaData} - Metadata of the underlying database. */
  get metaData() {
    return this.connection.getMetaData();
  }
  /***/
  close(hasExcept) {
    let ex, me = this, conn = me.connection;
    super.close();
    if (!conn)
      return;
    if (me.name != null)
      Wb.Connection.connections[me.name] = undefined;
    try {
      if (!me.autoCommit) {
        if (hasExcept)
          me.rollback();
        else
          me.commit();
      }
    } catch (e) {
      ex = e;
    }
    conn.close();
    if (ex)
      Wb.raise(ex);
  }
  /** @property {String} - Database product name with version. */
  get dbName() {
    let me = this;

    if (!me.dbName$) {
      let meta = this.metaData;
      me.dbName$ = meta.getDatabaseProductName() + ' ' + meta.getDatabaseProductVersion();
    }
    return me.dbName$;
  }
  /**
   * Determines whether the database product name contains all the given string (case-insensitive).
   * @param {String} key Keyword(s) to match; multiple keywords separated by commas.
   * @return {Boolean} `true` if matches, `false` otherwise.
   */
  match(key) {
    let dbName = this.dbName.toLowerCase();
    return (key || '').splitTrim().every(item => dbName.includes(item.toLowerCase()));
  }
  /** @property {String} - Default schema of the database. */
  get schema() {
    let me = this, schema = me.connection.getSchema();
    if (schema)
      return schema;
    let dbName = me.dbName.toLowerCase();
    if (dbName.includes('sql server')) {
      return Wb.getRecord({ sql: 'select schema_name()', db: me })?.[0] || null;
    } else {
      return null;
    }
  }
}
/**
 * Wrapper around a Java java.sql.Statement. Automatically closes when its execution
 * context ends, ensuring safe resource cleanup without explicit disposal.
 */
Cls['Wb.Statement'] = class statement extends Wb.Base {
  /** @property {java.sql.Statement} statement Underlying Java Statement object. */
  /**
   * Constructor for creating Statement instance.
   * @param {java.sql.Statement} st Java Statement object.
   */
  constructor(st) {
    super();
    Context.stClosable.add(this);
    this.statement = st;
  }
  /**
   * Close the resource. If this method is not called, the resource will be closed after the execution context ends. Please
   * call this method in a timely manner to release resources.
   */
  close() {
    this.statement.close();
    Context.stClosable.delete(this);
  }
  /** @property {java.sql.Connection} - Associated database connection object. */
  get connection() {
    return this.statement.getConnection();
  }
  /**
   * Get the result set.
   * @return {Wb.ResultSet} Result set.
   */
  getResultSet() {
    return new Wb.ResultSet(this.statement.getResultSet());
  }
  /**
   * Execute a query and return the result set.
   * @return {Wb.ResultSet} Result set.
   */
  executeQuery() {
    return new Wb.ResultSet(this.statement.executeQuery());
  }
}
/**
 * Wrapper around a Java java.sql.ResultSet. Automatically closes when its execution
 * context ends, ensuring safe resource cleanup without explicit disposal.
 */
Cls['Wb.ResultSet'] = class resultSet extends Wb.Base {
  /** @property {java.sql.ResultSet} resultSet Underlying database result set. */
  /**
   * Constructor for creating ResultSet instance.
   * @param {java.sql.ResultSet} rs Result set object.
   */
  constructor(rs) {
    super();
    Context.rsClosable.add(this);
    this.resultSet = rs;
  }
  /**
   * Close the resource. If this method is not called, the resource will be closed after the execution context ends. Please
   * call this method in a timely manner to release resources.
   */
  close() {
    this.resultSet.close();
    Context.rsClosable.delete(this);
  }
  /** @property {java.sql.Statement} - Associated statement object. */
  get statement() {
    return this.resultSet.getStatement();
  }
  /** @property {java.sql.Connection} - Associated database connection object. */
  get connection() {
    return this.statement.getConnection();
  }
  /** @property {java.sql,ResultSetMetaData} - Result set metadata. */
  get metaData() {
    return this.resultSet.getMetaData();
  }
  /** @property {Object[]} - Array of fields in {name: string, type: number} format, where type is a SQL type code. */
  get fieldTypes() {
    let meta = this.metaData, i, j = meta.getColumnCount(), types = [];

    for (i = 1; i <= j; i++)
      types.push({ name: DbUtil.getFieldName(meta, i), type: meta.getColumnType(i) });
    return types;
  }
  /**
   * Iterate through the entire result set.
   * @param {Function} fn Callback function.
   * @param {Object} .row Row data object.
   * @param {Number} .index Row index.
   */
  forEach(fn) {
    let me = this, rs = me.resultSet, val, index = 0, fieldType, i, j,
      fieldTypes = me.fieldTypes, row, Query = Wb.Query;

    j = fieldTypes.length;
    while (rs.next()) {
      row = {};
      for (i = 0; i < j; i++) {
        fieldType = fieldTypes[i];
        val = Query.getObject(rs, i + 1, fieldType.type, true, true);
        if (val != null)
          row[fieldType.name] = val;
      }
      fn.call(me, row, index++);
    }
  }
  /** @property {Number} - Virtual result set length. Used for the {#forEach} method. */
  get length() {
    return 1;
  }
  /** @property {Number} - Flag indicating if the object can be treated as an array. */
  get xLikeArray() {
    return true;
  }
  /**
   * Copy current result set data to the specified database table.
   * @param {String} tableName Target table name.
   * @param {String/Wb.Connection} [db] Database name. Uses the default database if not specified.
   * @param {Boolean} [truncate] Whether to clear the target table before copying.
   * @param {Boolean} [startTrans] Whether to start transaction. Defaults to `true`.
   */
  copyTo(tableName, db, truncate, startTrans) {
    db = Wb.getConn(db);
    if (startTrans ?? true)
      db.startTrans();
    if (truncate)
      Wb.sql('delete from ' + tableName, db);
    Wb.sync({ tableName, db, trans: false, insert: this });
  }
}
/**
 * Database Query Class. Encapsulates core SQL operation utilities.
 */
Cls['Wb.Query'] = class query extends Wb.Base {
  /** @property {RegExp} - Regex for matching stored procedure call syntax. */
  static matchCallReg = /^\{\s*(\?\s*=\s*)?call\b/i;
  /**
   * Remove single-line and multi-line comments from SQL statements.
   * @param {String} sql Original SQL statement.
   * @return {String} SQL statement without comments.
   */
  static removeComments(sql) {
    if (!sql) return '';
    let len = sql.length, result = new Array(len), inLineComment = false, inBlockComment = false, resultIndex = 0,
      quoteType = 0, i, j, c, next, backslashCount;

    for (i = 0; i < len; i++) {
      c = sql[i];
      next = sql[i + 1];
      if (!quoteType) {
        if (inLineComment) {
          if (c === '\n' || c === '\r') {
            inLineComment = false;
            result[resultIndex++] = c;
          }
          continue;
        }
        if (inBlockComment) {
          if (c === '*' && next === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }
        if (c === '-' && next === '-') {
          inLineComment = true;
          i++;
          continue;
        }
        if (c === '/' && next === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (c === "'") quoteType = 1;
        else if (c === '"') quoteType = 2;
        else if (c === '`') quoteType = 4;
      } else {
        if (c === "'" && quoteType === 1 || c === '"' && quoteType === 2 || c === '`' && quoteType === 4) {
          j = i - 1;
          backslashCount = 0;
          while (j >= 0 && sql[j] === '\\') {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            quoteType = 0;
          }
        }
      }
      if (!inLineComment && !inBlockComment) {
        result[resultIndex++] = c;
      }
    }
    return result.slice(0, resultIndex).join('');
  }
  /**
   * Get an expression composed of non-null parameters from the "name=param" formatted parameter list.
   * @param {Array} [paramList] Parameter list.
   * @param {Boolean} [noWhere] Whether to exclude the "where" keyword.
   * @param {Boolean} [useOr] Whether to join parameters with "or". `false` = join with "and", `true` = join with "or".
   * @param {Object} [params] Parameter object. Defaults to {#Params|globalThis.Params}.
   * @return {String} Expression with non-null parameters joined by " and " (or " or " if useOr is `true`).
   */
  static getParamsIf(paramList, noWhere, useOr, params) {
    let result = [];

    params ??= Params;
    paramList?.forEach(item => {
      if (!Wb.isEmpty(params[item.firstItem('=')])) {
        result.push(item);
      }
    });
    if (result.length)
      return (noWhere ? '' : ' where ') + result.join(useOr ? ' or ' : ' and ');
    else
      return '';
  }
  /** @property {String} result Return value type of the {#!run} method.
   * -null: No result returned (caused by returns=false in the {#!run} method).
   * -"value": Single affected row count, result set, or undefined (SQL returns no value).
   * -"array": Multiple affected row counts or result sets returned.
   * -"batch": Array of affected row counts from batch execution results.
   * -"object": Object containing affected row count, result set, and output parameter values. Format:
   *
   *      $text:{$return: [affected row counts and resultSets in order...], param1: value1, param2: value2, ...}
   *
   * @static
   */
  /** @property {Array} keys All key values returned after executing the statement (e.g., auto-increment field
   * values when inserting records).  @static */
  /**
   * Executes arbitrary SQL statements and retrieves results. After execution, all closable resources excluding
   * database connection are closed immediately by default. Database connection is automatically closed when the
   * execution context ends. To close the connection (that is not explicitly specified) immediately, use {#Wb.getConn}
   * to get the connection and call its `close` method.
   * Example:
   *
   *     Wb.sql('delete from table1 where 1 = 0', 'my-oracle'); // Returns 0; Wb.sql is an alias for Wb.Query.run
   *     Wb.sql({sql: 'select * from table1 where field={?param?}', db: 'my-oracle', fn(row){ process(row); }});
   *     Wb.sql('{call sp({?timestamp|inParam?}, {*cursor|p1*}, {!double|3|p2!})}'); // Access stored procedure
   *
   * @param {Object/String} configs Config object or SQL statement to execute.
   * @param {String/Wb.Connection} [.sql] SQL statement. Supports input/output parameters:
   * -Input: {?type|scale|name?}
   * -Output: {*type|scale|name*}
   * -Input/Output: {!type|scale|name!}
   * `type` is optional; omitted type uses object type. `scale` is optional, but the placeholder "|" must be retained
   * if specified.
   * @param {String/Wb.Connection} [.db] Database source name or connection. A string specifies the target database's source
   * name for the shared connection in the current context; defaults to the default database.
   * @param {Object/Array} [.params] Input parameters for the SQL. Use array or forEach-supported object for batch processing.
   * @param {Boolean} [.contextParams] Whether to look up parameters from context such as session attributes, request
   * attributes, and request parameters. Lookup priority: `configs.params` > session attributes > request attributes >
   * request parameters. Defaults to `true`.
   * @param {Boolean/String} [.trans] Transaction isolation level for the current database connection.
   * -Set to `true` to enable a transaction with the default isolation level.
   * -Set to a string to specify an explicit isolation level (see {#Wb.Connection.isolation}).
   * If a transaction is already active on the given connection, this setting has no effect. When `configs.params` is an array,
   * this defaults to `true`. For manual transaction control, use {#Wb.startTrans}, {#Wb.commit} and {#Wb.rollback}.
   * @param {Boolean} [.commit] Whether to automatically commit the transaction upon successful completion. Only applies if the
   * transaction is active.
   * @param {Function} [.fn] Callback function to process result rows and output parameters. The system passes each row or
   * output parameter to this function sequentially. When processing a result set, each row is passed as an argument;
   * returning `false` stops iteration of the current result set.
   * @param {Object/Number} [..item] The current row data, affected row count, or output parameter value.
   * @param {String/Number} [..name] Name of an output parameter or index of a result set. When multiple result sets are
   * returned, parameters with the same name or index belong to the same result set.
   * @param {Number} [..index] Current row index while processing a result set. This parameter is unused for non-result-set data.
   * @param {Boolean} [.unique] When performing insert/update/delete operations, enforces that exactly one row is affected;
   * otherwise, throws an exception. Automatically starts a transaction if enabled.
   * @param {Boolean} [.batch] Whether to use batch execution when `params` is an array. Defaults to true.
   * @param {Boolean/Number/Array} [.rs] Controls whether and how result set records are fetched:
   * -false: Skip reading records entirely (useful for performance when results are irrelevant).
   * -true: Return a {#Wb.ResultSet} object instead of an array of rows. Note: Non-output-parameter result sets are closed\
   * when advancing to the next result set, so only the first result set is accessible. Output-parameter result sets remain\
   * available. The associated `ResultSet` and `Statement` will not be auto-closed; they are closed when the execution context\
   * ends. Explicitly closing is recommended.
   * -number: Maximum number of rows to read. Use `configs.fn` for large result sets to avoid memory overflow. -1 means read\
   * all rows.
   * -number[]: Array specifying max rows per result set, e.g., [0, 100, null, -1] means: skip first result set, read 100 rows\
   * from second, read {#Wb.maxRows} rows from third, read all from fourth.
   * -null: Reads all records if `configs.fn` is given; otherwise, read {#Wb.maxRows} rows. (default)
   * @param {Boolean/String} [.blob] Whether to load BLOB field content into memory as a byte stream. If `'text'`, the content
   * is returned as a Base64-encoded string.
   * @param {Boolean/Number} [.clob] Whether to load CLOB field content as a string. If a number, it specifies the maximum number
   * of characters to read. Defaults to `true`.
   * @param {Boolean} [.array] Whether generated record data uses an array; `true` uses array, `false` uses object.
   * @param {Number/Boolean} [.from] Starting row index (0-based) for each result set. Defaults to the context parameter
   * `_from`. If unset, starts from the first row. Effective range is limited by `configs.rs`. Set to `false` to disable the
   * start limit explicitly.
   * @param {Number/Boolean} [.to] Ending row index (0-based) for each result set. Defaults to the context parameter `_to`. If
   * unset, ends at the last row. Effective range is limited by `configs.rs`. Set to `false` to disable the end
   * limit explicitly.
   * @param {Boolean/String} [.paging] Whether to enable automatic pagination based on `configs.from` and `configs.to`. Set to
   * `true` to enable application-side pagination, or to "db" to enable simple sql database-side pagination.
   * @param {Boolean} [.long] Whether to use long integer for row counts that may exceed java `Integer.MAX_VALUE`. Throws an
   * error if the underlying database does not support it.
   * @param {Number} [.fetchSize] Number of rows to fetch from the database in each batch. Default (`null` or 0) means auto.
   * @param {Number} [.timeout] SQL execution timeout in seconds. Default (`null` or 0) means no timeout.
   * @param {Boolean} [.returns] Whether to return execution results (affected counts, result sets, output parameters). Defaults
   * to `false` if `configs.fn` is provided; otherwise `true`.
   * @param {Boolean} [.returnObject] Whether to always return results as an object. See {#result} for details.
   * @param {Boolean/String} [.columns] Whether to include column metadata in the result:  `true` includes standard column
   * info; 'tree' includes the tree-control-specific column structure (row numbers are disabled). The default row number
   * column's {#dictionary|System.Development.Dictionary Config} is defined by "_rowNum". Defaults to `true`.
   * @param {Boolean} [.nullValue] Whether to include `null` values in the result. Defaults to `true`;
   * @param {String/Array/Boolean} [.dict] A list or array of {#dictionary|System.Development.Dictionary Config} group
   * names used sequentially when fetching data; separate multiple names with commas if specified as a string. Set to true
   * to use all dictionaries without a specified group name, and when multiple group names are specified, appending "false"
   * means excluding all dictionaries without a specified group name, otherwise fields not found will be searched in all
   * dictionaries that have no specified group name.
   * @param {Object/String} [.kv] Mapping from field names to {#key names|System.Development.Key Value Editor}; a string
   * means field names equal key names, as a comma-separated list.
   * @param {Number/Boolean/String/Object} [.total] Total record count (valid only when `configs.columns` is specified);
   * set to `false` to exclude it, `true` to return the result set's total count. A string is used to generate the total-record
   * count SQL; an object is the config object for the {#Wb.getRecord} method to retrieve the total record count. Defaults
   * to true.
   * @param {Boolean} [.dateFormat] Whether to format datetime values using `Str.dateTimeFormat`.
   * @param {Boolean/String} [.returnKeys] Whether to return automatically created key values, such as auto-increment field
   * values when adding records; the returned key values can be accessed via the {#keys} property. The value 'all' means
   * returning an array composed of the entire {#keys} result set.
   * @param {Boolean} [.readonly] Whether to run in read-only mode. Enables special handling (e.g., creates read-only text
   * editors for VARCHAR fields >255 chars, disables BLOB editing, etc.).
   * @param {String/Wb.Connection/Function} [dbOrFn] Database name/connection or callback function. See `configs.db` or
   * `configs.fn` for details; this parameter overrides them.
   * @param {Function} [fn] Callback function. See `configs.fn` for details; this parameter overrides it.
   * @return {Object/Array} All return values after SQL execution, including the number of affected records, result sets,
   * output parameters, and arrays or objects composed of these values. The returned data has some possible types,
   * determinable via the {#result} property. Values are returned only when the `configs.returns` parameter is true;
   * otherwise undefined is returned.
   */
  static run(configs, dbOrFn, fn) {
    let me = this, conn, st, rawSt, rs, isRs, sql, returns, retValue, value, meta, rsValue, data, long, dbPaging,
      params, batch, contextParams, unique, index, trans, ct, likeArray, returnKeys, commit;

    me.result = null;
    me.keys = null;
    configs = Wb.isString(configs) ? { sql: configs } : Wb.copy(configs);
    if (dbOrFn) {
      if (Wb.isFunction(dbOrFn))
        configs.fn = dbOrFn;
      else
        configs.db = dbOrFn;
    }
    if (fn)
      configs.fn = fn;
    fn = configs.fn;
    sql = configs.sql;
    returns = configs.returns ?? !fn;
    rsValue = configs.rs;
    params = configs.params;
    trans = configs.trans;
    long = configs.long;
    commit = configs.commit;
    returnKeys = configs.returnKeys;
    contextParams = configs.contextParams ?? true;
    unique = configs.unique;
    batch = configs.batch ?? true;
    conn = Wb.getConn(configs.db);
    likeArray = Wb.likeArray(params);
    if (likeArray || unique)
      trans ??= true;
    if (conn.autoCommit && trans) {
      conn.autoCommit = false;
      if (Wb.isString(trans))
        conn.isolation = trans;
    }
    dbPaging = configs.paging == 'db';
    if (dbPaging) {
      sql = me.removeComments(sql);
      let result = me.getPagingSql(sql, configs.from ?? Wb.getInt('_from'), configs.to ?? Wb.getInt('_to'), conn.dbName);
      if (result) {
        configs.paging = false; // disable app-server side paging
        sql = result.sql;
        configs.total ??= result.total;
      } else {
        configs.paging = true;
      }
    }
    meta = me.compile(conn, sql, returnKeys, dbPaging);
    try {
      st = meta[0];
      rawSt = st.statement;
      if (value = configs.fetchSize)
        rawSt.setFetchSize(value);
      sql = meta[1];
      meta = meta[2];
      if (value = configs.timeout)
        rawSt.setQueryTimeout(value);
      if (likeArray) {
        // batch processing
        if (!batch)
          retValue = [];
        params.forEach(param => {
          me.setParams(rawSt, meta, param, contextParams, sql);
          if (batch) {
            rawSt.addBatch();
          } else {
            value = rawSt.executeUpdate();
            if (unique && value != 1 && value != -2)
              me.notUnique();
            retValue.push(value);
            if (returnKeys)
              me.loadKeys(rawSt, returnKeys);
          }
        });
        if (batch) {
          retValue = long ? rawSt.executeLargeBatch() : rawSt.executeBatch();
          if (unique && retValue.some(item => item != 1 && item != -2))
            me.notUnique();
          if (returnKeys)
            me.loadKeys(rawSt, returnKeys);
        }
        fn?.(retValue, 0);
        if (commit)
          conn.commit();
        if (returns) {
          me.result = 'batch';
          return retValue;
        }
        return;
      }
      if (returns) {
        retValue = [];
        data = {};
      }
      me.setParams(rawSt, meta, params, contextParams, sql);
      isRs = rawSt.execute();
      if (returnKeys)
        me.loadKeys(rawSt, returnKeys);
      index = 0;
      // get results
      while (true) {
        if (isRs) {
          if (fn || returns) {
            ct = rsValue?.shift?.();
            if (rsValue !== false && ct != 0) {
              rs = st.getResultSet();
              if (returns && rsValue === true) {
                retValue.push(rs);
                // No more result sets will be retrieved; otherwise, the previous result set will be closed.
                break;
              } else {
                value = me.getData(rs.resultSet, configs, index, ct);
                rs.close();
              }
            } else {
              value = null;
            }
          }
        } else {
          value = long ? rawSt.getLargeUpdateCount() : rawSt.getUpdateCount();
          if (value == -1)
            break;
          else {
            if (unique && value != 1 && value != -2)
              me.notUnique();
          }
          fn?.(value, index);
        }
        if (returns)
          retValue.push(value);
        isRs = rawSt.getMoreResults();
        index++;
      }
      if (returns) {
        // gets output parameters
        me.getParams(rawSt, meta, data, configs);
        data.$return = retValue;
        if (!configs.returnObject && Object.keys(data).length == 1) {
          if (retValue.length < 2) {
            me.result = 'value';
            data = retValue[0];
          } else {
            me.result = 'array';
            data = retValue;
          }
        } else {
          me.result = 'object';
        }
      }
      if (commit)
        conn.commit();
    } finally {
      if (rsValue !== true) {
        rs?.close();
        st?.close();
      }
    }
    if (returns)
      return data;
  }
  /**
   * Generates paginated SQL for database side pagination.
   * @param {String} originalSql The original SQL without comments.
   * @param {Number} begin The zero-based starting row index.
   * @param {Number} end The zero-based ending row index.
   * @param {String} dbName The database product name.
   * @return {Object} Paging SQL and total SQL in the format `{ sql, total }` or null if not created.
   */
  static getPagingSql(originalSql, begin, end, dbName) {
    let offset, limit, cleanSql, trimSql, dbLower, hasOrderBy, tempSql, pagedSql = '';

    begin ??= 0;
    end ??= 0;
    if (!Wb.isNumber(begin) || !Wb.isNumber(end))
      Wb.raise('Invalid begin or end value.');
    offset = begin;
    limit = end - begin + 1;
    // trim and remove trailing ";"
    cleanSql = trimSql = originalSql.trim().replace(/;+$/, '');
    dbLower = dbName.toLowerCase();
    hasOrderBy = /\bORDER\s+BY\b/i.test(cleanSql);
    switch (true) {
      // mysql like
      case dbLower.includes('mysql'):
      case dbLower.includes('mariadb'):
      case dbLower.includes('tidb'):
      case dbLower.includes('h2'):
      case dbLower.includes('sqlite'):
      case dbLower.includes('clickhouse'):
      case dbLower.includes('hsql'):
      case dbLower.includes('hana'):
      case dbLower.includes('db2'):
      case dbLower.includes('oceanbase') && !dbLower.includes('oracle'): // OceanBase(MySQL mode)
        pagedSql = `${cleanSql} limit ${limit} offset ${offset}`;
        break;
      // postgresql like
      case dbLower.includes('postgresql'):
      case dbLower.includes('enterprisedb'):
      case dbLower.includes('kingbase'):
      case dbLower.includes('highgo'):
      case dbLower.includes('opengauss'):
      case dbLower.includes('gaussdb') && !dbLower.includes('oracle'): // GaussDB(PG mode)
        pagedSql = `${cleanSql} limit ${limit} offset ${offset}`;
        break;
      // sql server like
      case dbLower.includes('sql server'):
        if (!hasOrderBy) {
          cleanSql += ' order by (select null)';
        }
        pagedSql = `${cleanSql} offset ${offset} rows fetch next ${limit} rows only`;
        break;
      // oracle like
      case dbLower.includes('oracle'):
      case dbLower.includes('dameng'):
      case dbLower.includes('derby'):
      case dbLower.includes('shentong'):
      case dbLower.includes('oscar'):
        if (!hasOrderBy && !dbLower.includes('derby')) {
          cleanSql += ' order by rownum';
        }
        pagedSql = `${cleanSql} offset ${offset} rows fetch next ${limit} rows only`;
        break;
      // teradata like
      case dbLower.includes('teradata'):
        if (hasOrderBy) {
          tempSql = cleanSql.match(/ORDER\s+BY\s+[\w\s,]+/i)?.[0] ?? 'order by 1';
        } else {
          cleanSql += ' order by 1';
          tempSql = 'order by 1';
        }
        pagedSql = `${cleanSql} qualify row_number() over (${tempSql}) between ${begin + 1} and ${end + 1}`;
        break;
      default:
        return null;
    }
    tempSql = trimSql.replace(/\s+ORDER\s+BY\s+[\w\s,]+$/i, '');
    tempSql = tempSql.replace(/\s+(LIMIT|OFFSET|FETCH|ROWS?|NEXT|ONLY)\s+\d+/gi, '');
    tempSql = tempSql.replace(/SELECT\s+TOP\s+\d+/gi, 'SELECT');
    return {
      sql: pagedSql,
      total: `select count(*) as total from (${tempSql}) total_table`
    };
  }
  /**
   * Loads key-value pairs, such as auto-incremented primary key values when inserting records.
   * @param {java.sql.Statement} st The statement object.
   * @param {String} [type] If 'all', returns an array of all field values; otherwise, returns an array containing only the
   * first field value.
   */
  static loadKeys(st, type) {
    let me = this, result;
    try {
      if (type == 'all')
        result = me.getAllRows(st.getGeneratedKeys());
      else
        result = me.getAllRecords(st.getGeneratedKeys())?.pluck(0);
      if (me.keys)
        me.keys.pushAll(result);
      else
        me.keys = result;
    } catch (e) {
      me.keys = null;
    }
  }
  /**
   * Generates an SQL `in` clause expression and its corresponding parameter list from the given array.
   * Example:
   *
   *      let sqlMap = Wb.Query.getArraySql(['role1', 'role2', 'role3'], 'varchar');
   *      let recs = Wb.getRecords({
   *        sql: 'select role_name from wb_role where sid in (' + sqlMap.sql + ')',
   *        params: sqlMap.params
   *      });
   *
   * @param {Array} values The array of parameter values.
   * @param {String} [type] The optional parameter type (e.g., 'varchar').
   * @return {Object} An object containing:
   * -sql: the generated SQL fragment for the IN clause
   * -params: the parameter value map
   */
  static getArraySql(values, type) {
    let name, sql = '', params = {};
    values.forEach((value, i) => {
      if (i > 0)
        sql += ',';
      name = 'xP' + i;
      params[name] = value;
      sql += '{?' + (type ? (type + '|') : '') + name + '?}';
    });
    return { sql, params };
  }
  /**
   * Gets data from a result set. @priv
   * @param {ResultSet} resultSet The result set to read from.
   * @param {Object} [configs] The Configuration object. See `configs` parameter of {#run} method for details.
   * @param {String/Number} [rsName] The name or index of the result set used in callback function.
   * @param {Number} [rs] Maximum number of records to read. See `rs` parameter of {#run} method for details.
   * @return {Object} An object containing metadata and record data, or undefined if unavailable:
   * -columns: column metadata.
   * -fields: field metadata.
   * -items: array of record data.
   * -total: Total record count.
   */
  static getData(resultSet, configs, rsName, rs) {
    let fn, useArray, dateFormat, readBlob, readClob, fromIndex, toIndex, hasFrom, hasTo, dict, kv, returns, dbType,
      rsMeta, val, record, items, index, i, j, fieldName, fieldNames, column, columns, fields, nullValue, readonly,
      total, kvValue, nullRsName = rsName == null, keyName, needCount = false, types = [], Dict = Wb.ServerDict;

    configs ??= {};
    fn = configs.fn;
    if (rs === undefined)
      rs = configs.rs;
    if (rs == null)
      rs = fn ? -1 : Wb.maxRows;
    dict = configs.dict;
    if (Wb.isString(dict))
      dict = dict.splitTrim();
    if (configs.columns ?? true) {
      columns = [];
      if (configs.columns != 'tree') {
        let dictItem, value;
        column = { rowNum: true };
        if (dict) {
          dictItem = Wb.ServerDict.findItem(dict, '_rowNum');
          if (dictItem) {
            if (dictItem.displayHidden)
              column.visible = false;
            if (value = dictItem.text)
              column.text = Wb.optText(value);
            if (value = dictItem.displayWidth) {
              if (StringUtil.isFloat(value)) {
                value = parseFloat(value);
                if (value >= 0)
                  value = value + 'em';
              }
              column.width = value;
            }
            if (value = dictItem.columnTags)
              column.tagProperties = value;
          }
        }
        if (!dictItem?.editHidden)
          columns.push(column);
      }
    }
    kv = configs.kv;
    if (Wb.isString(kv)) {
      kv = Wb.toObject(kv.splitTrim());
      Wb.each(kv, k => {
        kv[k] = k;
      });
    }
    readonly = configs.readonly;
    useArray = configs.array;
    nullValue = configs.nullValue ?? true;
    dateFormat = configs.dateFormat;
    readBlob = configs.blob;
    readClob = configs.clob ?? true;
    if (configs.paging) {
      fromIndex = configs.from ?? Wb.getInt('_from');
      toIndex = configs.to ?? Wb.getInt('_to');
      hasFrom = fromIndex != null && fromIndex !== false;
      hasTo = toIndex != null && toIndex !== false;
    } else {
      hasFrom = false;
      hasTo = false;
    }
    if (columns) {
      total = configs.total;
      if (Wb.isString(total))
        total = Wb.getRecord({ sql: total, params: configs.params, contextParams: configs.contextParams, db: configs.db })?.[0];
      else if (Wb.isObject(total))
        total = Wb.getRecord(total, total.db || configs.db)?.[0];
      else if (!Wb.isNumber(total)) {
        if (total ?? true)
          needCount = true;
        else
          total = undefined;
      }
    }
    returns = !!(configs.returns ?? !fn);
    if (returns)
      items = [];
    rsMeta = resultSet.getMetaData();
    j = rsMeta.getColumnCount();
    fieldNames = [];
    for (i = 1; i <= j; i++) {
      fieldName = DbUtil.getFieldName(rsMeta, i);
      fieldNames.push(fieldName);
      dbType = rsMeta.getColumnType(i);
      types.push(dbType);
      if (columns) {
        column = this.createMeta(fieldName, dbType, rsMeta, i, useArray, dateFormat, readBlob, readonly, dict);
        if (column.dataType) {
          fields ??= {};
          fields[column.fieldName] = { type: column.dataType };
          column.dataType = undefined;
        }
        columns.push(column);
      }
    }
    index = -1;
    while (resultSet.next()) {
      index++;
      if (index === rs) {
        index--;
        break;
      }
      if (hasFrom && index < fromIndex)
        continue;
      if (hasTo && index > toIndex) {
        if (needCount)
          continue;
        else
          break;
      }
      record = useArray ? [] : {};
      for (i = 0; i < j; i++) {
        val = this.getObject(resultSet, i + 1, types[i], readClob, readBlob);
        fieldName = fieldNames[i];
        if (val != null && ((keyName = kv?.[fieldName]) || dict) &&
          (kvValue = (keyName ? Wb.optText(KVBuffer.getValue(keyName, val)) : Dict.getKV(dict, fieldName, val))) != null) {
          if (!useArray)
            record[fieldName + '$'] = kvValue;
        }
        if (useArray) {
          record.push(val);
        } else if (val != null || nullValue) {
          record[fieldName] = val;
        }
      }
      if (nullRsName) {
        if (fn?.(record, index) === false)
          return;
      } else {
        if (fn?.(record, rsName, index) === false)
          return;
      }
      if (returns)
        items.push(record);
    }
    if (returns) {
      if (columns) {
        if (needCount)
          total = index + 1;
        return { items, columns, fields, total };
      } else
        return items;
    }
  }
  /**
   * Get records from the result set, where each record is composed of an object. The result set will be closed after
   * reading. See also {#getRecords}.
   * @param {ResultSet} resultSet Result set.
   * @param {Object} [configs] The Configuration object. See `configs` parameter of {#run} method for details.
   * @param {Number} [rs] Maximum number of records to read. See `rs` parameter of {#run} method for details.
   * @return {Array} Array composed of record data object.
   */
  static getRows(resultSet, configs, rs) {
    let rows;
    try {
      configs = Wb.apply({ columns: false, rs }, configs);
      rows = this.getData(resultSet, configs);
    } finally {
      resultSet.close();
    }
    return rows;
  }
  /**
   * Get all records from the result set, where each record is composed of an object. See {#getRows} for details.
   */
  static getAllRows(resultSet, configs) {
    return this.getRows(resultSet, configs, -1);
  }
  /**
   * Get records from the result set, where each record is composed of an array. The result set will be closed after
   * reading. See also {#getRows}.
   * @param {ResultSet} resultSet Result set.
   * @param {Object} [configs] The Configuration object. See `configs` parameter of {#run} method for details.
   * @param {Number} [rs] Maximum number of records to read. See `rs` parameter of {#run} method for details.
   * @return {Array} Array composed of record data array.
   */
  static getRecords(resultSet, configs, rs) {
    let recs;
    try {
      configs = Wb.apply({ columns: false, array: true, rs }, configs);
      recs = this.getData(resultSet, configs);
    } finally {
      resultSet.close();
    }
    return recs;
  }
  /**
   * Get all records from the result set, where each record is composed of an array. See {#getRecords} for details.
   */
  static getAllRecords(resultSet, configs) {
    return this.getRecords(resultSet, configs, -1)
  }
  /**
   * Creates metadata for the specified column of the result set.
   * @param {String} fieldName Field name.
   * @param {String} dbType Field type.
   * @param {Object} meta Result set metadata.
   * @param {Number} index Column index.
   * @param {Boolean} useArray Whether the result uses array format.
   * @param {Boolean} dateFormat Whether datetime-type data uses the local full format.
   * @param {Boolean/String} readBlob Whether to read BLOB fields. Use "text" for base64 representation.
   * @param {Boolean} roMode Whether in read-only mode.
   * @param {Array/Boolean} dict Dictionary group name list.
   * @return {Object} Column metadata object.
   */
  static createMeta(fieldName, dbType, meta, index, useArray, dateFormat, readBlob, roMode, dict) {
    let cname, width, align, precision, scale, render, dataType, editor, isClob, isBool, isBlob, likeClob,
      colMeta, format, text, readonly, required, decimalCount, maxLength, dictItem, value, dictText;

    // editor: Editor, render: Render function, type: Column type mapped to editor type, len: Display length
    // align: Alignment, precision: Field length, intCount: Integer digit count, decimalCount: Decimal digit
    // count, key: Whether it is a key field
    precision = maxLength = meta.getPrecision(index);
    scale = meta.getScale(index);
    readonly = meta.isReadOnly(index);
    required = !meta.isNullable(index);
    text = fieldName;
    if (dict && (dictItem = Wb.ServerDict.findItem(dict, fieldName))) {
      if (dictItem.maxLength != null)
        precision = maxLength = dictItem.maxLength;
      if (dictItem.decimalCount != null)
        scale = dictItem.decimalCount;
      if (dictItem.readonly != null)
        readonly = dictItem.readonly;
      if (dictItem.required != null)
        required = dictItem.required;
      if (dictText = dictItem.text)
        text = Wb.optText(dictText);
    }
    if (!required)
      required = undefined;
    if (!readonly)
      readonly = undefined;
    colMeta = {
      text, fieldName: useArray ? index - 1 : fieldName, precision, required,
      typeName: meta.getColumnTypeName(index), fieldType: meta.getColumnType(index)
    };
    if (useArray)
      colMeta.rawName = fieldName;
    if (scale > 0)
      colMeta.scale = scale;
    switch (dbType) {
      case Types.TIMESTAMP:
        dataType = 'date';
        cname = 'datetime';
        if (dateFormat)
          format = Str.dateTimeFormat;
        width = 14.5;
        maxLength = undefined;
        break;
      case Types.DATE:
        dataType = 'date';
        cname = 'date';
        if (dateFormat)
          format = Str.dateFormat;
        width = 8;
        maxLength = undefined;
        break;
      case Types.TIME:
        dataType = 'date';
        cname = 'time';
        if (dateFormat)
          format = Str.timeFormat;
        width = 7;
        maxLength = undefined;
        break;
      case Types.BIGINT:
      case Types.INTEGER:
      case Types.SMALLINT:
      case Types.TINYINT:
        cname = 'number';
        decimalCount = 0;
        align = 'right';
        break;
      case Types.DOUBLE:
      case Types.FLOAT:
      case Types.REAL:
        cname = 'number';
        align = 'right';
        break;
      case Types.DECIMAL:
      case Types.NUMERIC:
        cname = 'number';
        decimalCount = scale;
        align = 'right';
        break;
      case Types.LONGVARCHAR:
      case Types.LONGNVARCHAR:
      case Types.CLOB:
      case Types.NCLOB:
        cname = 'textArea';
        isClob = true;
        width = 18;
        break;
      case Types.BINARY:
      case Types.VARBINARY:
      case Types.LONGVARBINARY:
      case Types.BLOB:
        cname = 'fileInput';
        colMeta.isBlob = isBlob = true;
        maxLength = undefined;
        width = roMode ? 8 : 15;
        break;
      case Types.BOOLEAN:
      case Types.BIT:
        cname = 'number';
        isBool = true;
        decimalCount = 0;
        maxLength = undefined;
        width = 4;
        align = 'right';
        break;
      default:
        cname = 'text';
    }
    // Force text fields longer than 255 characters to be converted to CLOB
    if (cname == 'textArea') {
      likeClob = true;
    } else {
      likeClob = cname == 'text' && precision > 500;
      if (likeClob)
        cname = 'textArea';
    }
    if (dictItem) {
      if (dictItem.cname) {
        cname = dictItem.cname;
        likeClob = cname == 'textArea';
      }
      if (dictItem.keyName) {
        cname = 'select';
        align = decimalCount = maxLength = isBool = format = undefined;
      }
    }
    if (maxLength <= 0)
      maxLength = undefined;
    editor = { cname, maxLength, readonly, required, decimalCount };
    if (isBool) {
      editor.minValue = 0;
      editor.maxValue = 1;
    }
    if (decimalCount && maxLength) {
      editor.maxLength = undefined;
      editor.intCount = maxLength - decimalCount;
    }
    if (format)
      editor.format = colMeta.format = format;
    if (dictItem) {
      if (value = dictItem.displayFormat)
        colMeta.format = value;
      if (value = dictItem.displayType)
        colMeta.type = value;
      if (dictItem.displayHidden)
        colMeta.visible = false;
      if (value = dictItem.autoWrap)
        colMeta.autoWrap = value;
      if (value = dictItem.checkBox) {
        colMeta.checkBox = value;
        align = undefined;
        if (!dictText)
          colMeta.text = undefined;
      }
    }
    if (isClob || isBlob)
      colMeta.sortable = false;
    if (roMode) {
      if (likeClob)
        editor.readonly = true;
      else
        editor = false;
    }
    if (cname == 'fileInput') {
      if (roMode) {
        if (readBlob)
          render = 'Wb.Column.base64DownloadRender';
      } else {
        render = 'Wb.Column.blobRender';
        editor.download = true;
      }
    }
    width = Math.max(Math.round(text.length / 1.3) + 2, width ?? maxLength ?? 0).constrain(2, 18) + 'em';
    if (dictItem) {
      if (value = dictItem.displayWidth) {
        if (StringUtil.isFloat(value)) {
          value = parseFloat(value);
          if (value >= 0)
            value = value + 'em';
        }
        width = value;
      } else if (colMeta.checkBox && !dictText) {
        width = undefined;
      }
      if (value = dictItem.editTags)
        editor.tagProperties = value;
      if (value = dictItem.groupTitle)
        editor.groupTitle = value;
      if (dictItem.editHidden)
        editor.visible = false;
      if (value = dictItem.height)
        editor.height = StringUtil.isFloat(value) ? value + 'em' : value;
      if (value = dictItem.editType)
        editor.valueType = value;
      if (value = dictItem.hint)
        editor.hint = Wb.optText(value);
      if (value = dictItem.colspan)
        editor.colspan = value;
      if (dictItem.editFill)
        editor.editFill = true;
      if (value = dictItem.keyName) {
        editor.keyName = value;
        colMeta.keyValue = true;
      }
      if (value = dictItem.validateScript)
        editor.validateScript = value;
      if (value = dictItem.renderScript) {
        let trimValue = value.trim();
        render = trimValue.startsWith('$') ? trimValue.substr(1) :
          ('function(value, data, column, el){' + value + '\n}');
      }
    }
    if (editor.cname == 'toggle' || editor.cname == 'check') {
      delete editor.decimalCount;
      delete editor.maxLength;
      delete editor.minLength;
    }
    Wb.applyValue(colMeta, { editor, render, width, align, dataType });
    if (value = dictItem?.columnTags)
      colMeta.tagProperties = value;
    return colMeta;
  }
  /**
   * Throws an update non-unique exception. @priv
   */
  static notUnique() {
    Wb.raise(Str.updateNotUnique);
  }
  /**
   * Sets input and output parameters for the statement. @priv
   * @param {Statement} st Statement object.
   * @param {Array} meta Parameter metadata.
   * @param {Object} params Parameter object.
   * @param {Boolean} contextParams Whether to automatically reference parameters from the context.
   * @param {String} sql SQL text.
   */
  static setParams(st, meta, params, contextParams, sql) {
    let type, ioType, name, value, scale, logSql = '', oldPos = 0, newPos, canLogSql = Config.logSql;

    meta.forEach((param, index) => {
      type = param.type;
      name = param.name;
      index++;
      scale = param.scale;
      ioType = param.ioType;
      if (ioType != 1) {
        // in param
        if (params && (name in params))
          value = params[name];
        else if (contextParams)
          value = Wb.get(name);
        else
          value = null;
        if (canLogSql) {
          newPos = param.pos;
          logSql += sql.substring(oldPos, newPos);
          if (value == null || value === '')
            logSql += 'null';
          else if ((type == null || DbUtil.isNumericType(type)) && (Wb.isNumeric(value) || Wb.isBoolean(value)))
            logSql += value;
          else
            logSql += "'" + value.toString().ellipsis().replaceAll("'", "''") + "'";
          oldPos = newPos + 1;
        }
        this.setObject(st, index, value, type, scale);
      }
      if (ioType > 0) {
        // out param
        type ??= Types.VARCHAR;
        if (scale != null && scale >= 0)
          st.registerOutParameter(index, type, scale);
        else
          st.registerOutParameter(index, type);
      }
    });
    if (canLogSql) {
      logSql += sql.substr(oldPos);
      Wb.recordLog(logSql);
    }
  }
  /**
   * Gets output parameter values of the statement. @priv
   * @param {Statement} st Statement object.
   * @param {Array} meta Parameter metadata.
   * @param {Object} result Output parameters are added to this object. The key is the parameter name and the value
   * is the parameter value.
   * @param {Object} configs The Configuration object. See `configs` parameter of {#run} method for details.
   */
  static getParams(st, meta, result, configs) {
    let name, value, rs, rsValue, fn, ct, isRs;

    rsValue = configs.rs;
    fn = configs.fn;
    meta.forEach((param, index) => {
      if (param.ioType > 0) {
        name = param.name;
        value = this.getObject(st, index + 1, param.type, true, true);
        isRs = value instanceof ResultSet;
        if (isRs) {
          ct = rsValue?.shift?.();
          if (rsValue !== false && ct != 0) {
            rs = new Wb.ResultSet(value);
            if (rsValue === true) {
              value = rs;
            } else {
              value = this.getData(value, configs, name, ct);
              rs.close();
            }
          } else {
            value.close();
            value = null;
          }
        } else {
          fn?.(value, name);
        }
        if (result)
          result[name] = value;
      }
    });
  }
  /**
   * Sets the parameter value for the statement object.
   * @param {Statement} st Statement object.
   * @param {Number} index Index number(1-based).
   * @param {Object} value Value to set.
   * @param {Number} [type] Type of the value to set; defaults to auto.
   * @param {Number} [scale] The number of digits after the decimal point.
   */
  static setObject(st, index, value, type, scale) {
    if (value == null || value === '') {
      st.setNull(index, type ?? Types.VARCHAR);
    } else {
      let isObject = false;

      if (scale == null) {
        switch (type) {
          case Types.CHAR:
          case Types.VARCHAR:
            st.setString(index, value.toString());
            break;
          case Types.NCHAR:
          case Types.NVARCHAR:
            st.setNString(index, value.toString());
            break;
          case Types.INTEGER:
            st.setInt(index, this.toNumber(value, 'int'));
            break;
          case Types.TINYINT:
            st.setByte(index, this.toNumber(value, 'byte'));
            break;
          case Types.SMALLINT:
            st.setShort(index, this.toNumber(value, 'short'));
            break;
          case Types.BIGINT:
            st.setLong(index, this.toNumber(value, 'long'));
            break;
          case Types.REAL:
            try {
              st.setDouble(index, this.toNumber(value, 'double'));
            } catch (ex) {
              st.setFloat(index, this.toNumber(value, 'float'));
            }
            break;
          case Types.FLOAT:
            st.setFloat(index, this.toNumber(value, 'float'));
            break;
          case Types.DOUBLE:
          case Types.DECIMAL:
          case Types.NUMERIC:
            st.setDouble(index, this.toNumber(value, 'double'));
            break;
          case Types.TIMESTAMP:
          case Types.DATE:
          case Types.TIME:
            if (Wb.isString(value))
              value = Wb.tryParseDate(value).getTime();
            else if (value.getTime)
              value = value.getTime();
            if (type == Types.TIMESTAMP)
              st.setTimestamp(index, new Classes.Timestamp(value));
            else if (type == Types.DATE)
              st.setDate(index, new Classes.Date(value));
            else
              st.setTime(index, new Classes.Time(value));
            break;
          case Types.BOOLEAN:
          case Types.BIT:
            st.setBoolean(index, Wb.parseBool(value));
            break;
          case Types.LONGVARCHAR:
            value = value.toString();
            st.setCharacterStream(index, new Classes.StringReader(value), value.length);
            break;
          case Types.LONGNVARCHAR:
            value = value.toString();
            st.setNCharacterStream(index, new Classes.StringReader(value), value.length);
            break;
          case Types.CLOB:
            value = value.toString();
            st.setClob(index, new Classes.StringReader(value), value.length);
            break;
          case Types.NCLOB:
            value = value.toString();
            st.setNClob(index, new Classes.StringReader(value), value.length);
            break;
          case Types.BLOB:
          case Types.BINARY:
          case Types.VARBINARY:
          case Types.LONGVARBINARY:
            if (Wb.isString(value))
              value = new ByteArrayInputStream(StringUtil.decodeBase64(value));
            else if (value instanceof ByteArray)
              value = new ByteArrayInputStream(value);
            else if (value instanceof HashMap)
              value = value.stream;
            st.setBinaryStream(index, value);
            break;
          default:
            isObject = true;
        }
      } else {
        isObject = true;
      }
      if (isObject) {
        if (value instanceof Date || value instanceof JavaDate)
          value = new Classes.Timestamp(value.getTime());
        if (type == null) {
          st.setObject(index, value);
        } else {
          if (scale != null && scale >= 0)
            st.setObject(index, value, type, scale);
          else
            st.setObject(index, value, type);
        }
      }
    }
  }
  /**
   * Converts a value to the specified numeric type. @priv
   * @param {Object} value The value to convert.
   * @param {String} type Target numeric type.
   * @return {Object} Numeric value of the specified type.
   */
  static toNumber(value, type) {
    if (Wb.isNumber(value)) {
      switch (type) {
        case 'byte':
          return SysUtil.toByte(value);
        case 'short':
          return SysUtil.toShort(value);
        case 'int':
          return SysUtil.toInt(value);
        case 'long':
          return SysUtil.toLong(value);
        case 'float':
          return SysUtil.toFloat(value);
        default:
          // double
          return value;
      }
    } else {
      value = value.toString();
      if (value == 'true')
        value = '1';
      else if (value == 'false')
        value = '0';
      switch (type) {
        case 'byte':
          return Byte.parseByte(value);
        case 'short':
          return Short.parseShort(value);
        case 'int':
          return Integer.parseInt(value);
        case 'long':
          return Long.parseLong(value);
        case 'float':
          return Float.parseFloat(value);
        default:
          return Double.parseDouble(value);
      }
    }
  }
  /**
   * Retrieves the value of the specified name or index from ResultSet/CallableStatement.
   * @param {ResultSet/Statement} st Result set or statement object.
   * @param {String/Number} index Field/parameter name or index number.
   * @param {Number} [type] Value type; defaults to auto.
   * @param {Boolean/Number} [readClob] Whether to read CLOB content. Returns "(clob)" if content exists but is
   * not read. Numeric value indicates maximum character count. Defaults to true.
   * @param {Boolean/String} [readBlob] Whether to read BLOB content. Returns "(blob)" if content exists but is
   * not read. Use "text" for base64 representation.
   * @return {Object} Retrieved field/parameter value.
   */
  static getObject(st, index, type, readClob, readBlob) {
    let value;

    readClob ??= true;
    switch (type) {
      case Types.CHAR:
      case Types.VARCHAR:
        value = st.getString(index);
        break;
      case Types.NCHAR:
      case Types.NVARCHAR:
        value = st.getNString(index);
        break;
      case Types.INTEGER:
        value = st.getInt(index);
        break;
      case Types.TINYINT:
        value = st.getByte(index);
        break;
      case Types.SMALLINT:
        value = st.getShort(index);
        break;
      case Types.BIGINT:
        // parseInt enable Wb.encode(bigIntValue)
        value = parseInt(st.getLong(index));
        break;
      case Types.REAL:
      case Types.FLOAT:
        value = st.getFloat(index);
        break;
      case Types.DOUBLE:
      case Types.DECIMAL:
      case Types.NUMERIC:
        value = st.getDouble(index);
        break;
      case Types.TIMESTAMP:
        try {
          // Some databases throw errors when using this method; values can only be retrieved via getString()
          value = st.getTimestamp(index);
          value = value ? Date.from(value) : null;
        } catch (e) {
          value = st.getString(index);
          return value ? Wb.parseDate(value) : null;
        }
        break;
      case Types.DATE:
        value = st.getDate(index);
        value = value ? Date.from(value) : null;
        break;
      case Types.TIME:
        value = st.getTime(index);
        value = value ? Date.from(value) : null;
        break;
      case Types.BOOLEAN:
      case Types.BIT:
        value = st.getBoolean(index) ? 1 : 0;
        break;
      case Types.LONGVARCHAR:
        value = this.readText(st.getCharacterStream(index), readClob);
        break;
      case Types.LONGNVARCHAR:
        value = this.readText(st.getNCharacterStream(index), readClob);
        break;
      case Types.CLOB:
        value = this.readClob(st.getClob(index), readClob);
        break;
      case Types.NCLOB:
        value = this.readClob(st.getNClob(index), readClob);
        break;
      case Types.BLOB:
        value = this.readBlob(st.getBlob(index), readBlob);
        break;
      case Types.BINARY:
      case Types.VARBINARY:
      case Types.LONGVARBINARY:
        if (st instanceof ResultSet)
          value = this.readStream(st.getBinaryStream(index), readBlob);
        else
          value = this.readBlob(st.getBlob(index), readBlob);
        break;
      default:
        value = st.getObject(index);
        if (value instanceof Classes.Reader) {
          value = this.readText(value, readClob);
        } else if (value instanceof Classes.Clob) {
          value = this.readClob(value, readClob);
        } else if (value instanceof Classes.Blob) {
          value = this.readBlob(value, readBlob);
        } else if (value instanceof InputStream) {
          value = this.readStream(value, readBlob);
        }
    }
    // wasNull() is only valid after calling a get method.
    return st.wasNull() ? null : value;
  }
  /**
   * Reads content from the Blob and closes the Blob. @priv
   * @param {Blob} blob Blob object.
   * @param {Boolean/String} [read] Whether to read the content. Use "text" for base64 representation.
   * @return {ByteArrayInputStream/String} ByteArrayInputStream, base64 text, or null.
   */
  static readBlob(blob, read) {
    if (blob) {
      if (read) {
        return this.readStream(blob.getBinaryStream(), read);
      } else {
        blob.free();
        return '(blob)';
      }
    }
    return null;
  }
  /**
   * Reads content from the input stream and converts it to ByteArrayInputStream or base64 text. @priv
   * @param {InputStream} is Input stream.
   * @param {Boolean/String} [read] Whether to read the content. Use "text" for base64 representation.
   * @return {ByteArrayInputStream/String} ByteArrayInputStream, base64 text, or null.
   */
  static readStream(is, read) {
    if (is) {
      if (read) {
        if (read === 'text')
          return StringUtil.encodeBase64(is);
        else
          return Wb.toByteStream(is);
      } else {
        is.close();
        return '(blob)';
      }
    }
    return null;
  }
  /**
   * Reads the string from the Clob and closes the Clob. @priv
   * @param {Clob} clob Clob object.
   * @param {Boolean} [read] Whether to read the content.
   * @return {String} The string or null.
   */
  static readClob(clob, read) {
    if (clob) {
      if (read) {
        return this.readText(clob.getCharacterStream(), read);
      } else {
        clob.free();
        return '(clob)';
      }
    }
    return null;
  }
  /**
   * Reads the string from the Reader and closes the Reader. @priv
   * @param {Reader} reader String reader.
   * @param {Boolean/Number} [read] Whether to read the content. Numeric value indicates the maximum number of characters to read.
   * @return {String} The string or null.
   */
  static readText(reader, read) {
    if (reader) {
      if (read) {
        let value;
        try {
          value = IOUtils.toString(reader);
        } finally {
          reader.close();
        }
        if (read !== true)
          value = value.substr(0, read);
        return value;
      } else {
        reader.close();
        return '(clob)';
      }
    }
    return null;
  }
  /**
   * Compiles the SQL statement, processes its input and output parameters, and returns the statement object and parameter
   * list. Input parameters are represented by {?name?}, output parameters by {name}, and input-output parameters by
   * {!type|scale|name!}. @priv
   * @param {Wb.Connection} conn Connection object.
   * @param {String} sql SQL statement.
   * @param {Boolean} [returnkeys] Whether to return key values.
   * @param {Boolean} [commentsRemoved] Whether the comments are removed.
   * @return {Array} Array consisting of the statement object, SQL, and parameter list.
   */
  static compile(conn, sql, returnkeys, commentsRemoved) {
    const ioTypes = ['?', '*', '!'];
    let key, secs, secsLen, endPos, st, isCall, startPos = 0, lastPos = 0, ioType,
      newSql = '', params = [], scanPos = 0, inSingleQuote, inDoubleQuote, i;

    // When there are parameters, need to delete the parameters in the comment
    if (!commentsRemoved && sql.includes('{'))
      sql = this.removeComments(sql);
    while ((startPos = sql.indexOf('{', startPos)) > -1) {
      for (i = scanPos; i < startPos; i++) {
        if (sql[i] === "'" && !inDoubleQuote) {
          if (sql[i + 1] === "'") {
            i++;
          } else {
            inSingleQuote = !inSingleQuote;
          }
        } else if (sql[i] === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
        }
      }
      scanPos = startPos;
      if (inSingleQuote || inDoubleQuote) {
        startPos++;
        continue;
      }
      key = sql[startPos + 1];
      ioType = ioTypes.indexOf(key);
      if (ioType == -1) {
        startPos++;
        continue;
      } else {
        endPos = sql.indexOf(key + '}', startPos + 2);
        if (endPos == -1)
          break;
      }
      newSql += sql.substring(lastPos, startPos);
      secs = sql.substring(startPos + 2, endPos).split('|');
      secsLen = secs.length;
      params.push({
        ioType, name: secs.lastItem.trim(), type: secsLen > 1 ?
          DbUtil.getFieldType(secs[0].trim()) : null,
        scale: secsLen > 2 ? (parseInt(secs[1]) || -1) : null,
        pos: newSql.length
      });
      newSql += '?'
      startPos = lastPos = endPos + 2;
    }
    newSql += sql.substring(lastPos);
    isCall = sql.includes('{*') || sql.includes('{!') || this.matchCallReg.test(sql);
    if (Config.logSql) {
      try {
        st = conn.createStatement(newSql, isCall, returnkeys);
      } catch (e) {
        Wb.recordError(sql);
        Wb.raise(e);
      }
    } else {
      st = conn.createStatement(newSql, isCall, returnkeys);
    }
    return [st, newSql, params];
  }
  /**
   * Creates select, insert, update, and delete SQL for the specified table.
   * Example:
   *
   *     result = Wb.Query.createSQL({tableName: 'dbo.MyTable', db: 'myDb'});
   *
   * @param {Object/String} configs Configuration object or table name.
   * @param {String} .tableName Table name. If the table name contains ".", the part before "." represents the schema name.
   * @param {String/Wb.Connection} [.db] Database name or connection.
   * @param {String/String[]} [.fields] Field list before the WHERE clause. If a string is provided, it represents a
   * comma-separated list of fields. All fields are used by default.
   * @param {String/String[]} [.excludeFields] Fields to exclude from the list before the WHERE clause. If a string is
   * provided, it represents a comma-separated list of fields.
   * @param {String/String[]} [.whereFields] Field list after the WHERE clause. If a string is provided, it represents
   * a comma-separated list of fields.
   * @param {Boolean} [.silent] Whether to throw an exception when no available fields exist. Can be set to `true` when only
   * needing to generate an insert SQL.
   * @return {Object} Object containing {select, insert, update, del, updateFields, updateBegin, updateEnd} SQLs:
   * -select: select SQL.
   * -insert: insert SQL.
   * -update: update SQL.
   * -del: delete SQL.
   * -updateFields: update fields.
   * -updateBegin: update begin segment sql.
   * -updateEnd: update end segment sql.
   */
  static createSQL(configs) {
    let tableName, db, fields, excludeFields, whereFields, conn, st, rs, meta, i, j, fieldName, type, param, typeName,
      precision, selectComma, updateComma, readonly, result = {}, selectFields = '', hasWhere, silent, nullable,
      insertFields = '', insertParams = '', updateParams = '', condition = '', updateFields = {};

    if (Wb.isString(configs)) {
      tableName = configs;
    } else {
      tableName = configs.tableName;
      db = configs.db;
      fields = configs.fields;
      if (Wb.isString(fields))
        fields = fields.splitTrim();
      excludeFields = configs.excludeFields;
      if (Wb.isString(excludeFields))
        excludeFields = excludeFields.splitTrim();
      whereFields = configs.whereFields;
      if (Wb.isString(whereFields))
        whereFields = whereFields.splitTrim();
      silent = configs.silent;
    }
    conn = Wb.getConn(db);
    whereFields ??= this.getUniqueFields(conn, tableName.toUpperCase()) ||
      this.getUniqueFields(conn, tableName.toLowerCase());
    hasWhere = whereFields?.length;
    try {
      st = conn.createStatement('select * from ' + tableName + ' where 1=0');
      rs = st.executeQuery();
      meta = rs.metaData;
      j = meta.getColumnCount() + 1;
      for (i = 1; i < j; i++) {
        fieldName = DbUtil.getFieldName(meta, i);
        type = meta.getColumnType(i);
        typeName = DbUtil.getTypeName(type);
        precision = meta.getPrecision(i);
        readonly = meta.isReadOnly(i);
        nullable = meta.isNullable(i);
        if ((!fields || fields.includes(fieldName)) && (!excludeFields || !excludeFields.includes(fieldName))) {
          if (selectComma)
            selectFields += ',';
          else
            selectComma = true;
          selectFields += fieldName;
          if (!readonly) {
            if (updateComma) {
              insertFields += ',';
              insertParams += ',';
              updateParams += ',';
            }
            else
              updateComma = true;
            param = '{?' + typeName + '|' + fieldName + '?}';
            insertFields += fieldName;
            insertParams += param;
            param = fieldName + '=' + param;
            updateParams += param;
            updateFields[fieldName] = param;
          }
        }
        if (hasWhere && whereFields.includes(fieldName) || !hasWhere && DbUtil.fitWhereField(type, precision)) {
          if (condition)
            condition += ' and ';
          if (nullable) {
            condition += '(' + fieldName + '={?' + typeName + '|$' + fieldName + '?} or ' + fieldName + ' is null and {?' +
              typeName + '|$' + fieldName + '?} is null)';
          } else {
            condition += fieldName + '={?' + typeName + '|$' + fieldName + '?}';
          }
        }
      }
      if (!silent && !condition)
        Wb.raise('Table "' + tableName + '" must have at least one non-clob/blob field of SQL where fields.');
      result.select = 'select ' + selectFields.toString() + ' from ' + tableName + ' where ' + condition;
      result.insert = 'insert into ' + tableName + ' (' + insertFields + ') values (' + insertParams + ')';
      result.update = 'update ' + tableName + ' set ' + updateParams + ' where ' + condition;
      result.del = 'delete from ' + tableName + ' where ' + condition;
      result.updateFields = updateFields;
      result.updateBegin = 'update ' + tableName + ' set ';
      result.updateEnd = ' where ' + condition;
    } finally {
      rs?.close();
      st?.close();
    }
    return result;
  }
  /**
   * Retrieves the list of unique field names for the specified table.
   * @param {Wb.Connection} conn  Database connection.
   * @param {String} tableName Table name.
   * @return {Array} List of unique field names. Returns null if none are found.
   */
  static getUniqueFields(conn, tableName) {
    if (!tableName)
      Wb.raise('The table name is not specified.');
    let schem, rs, meta, indexName, fieldName, pos = tableName.indexOf('.'), fields = [], fieldMap = {};

    if (pos == -1) {
      schem = conn.schema;
    } else {
      schem = tableName.substr(0, pos) || null;
      tableName = tableName.substr(pos + 1);
    }
    meta = conn.metaData;
    // try to find pk fields
    rs = meta.getPrimaryKeys(null, schem, tableName);
    try {
      Wb.Query.getRows(rs, {
        fn(row) {
          fieldName = DbUtil.lowercase(row.column_name);
          if (fieldName) {
            fields.push(fieldName);
          }
        }
      });
    } finally {
      rs.close();
    }
    if (fields.length)
      return fields;
    // try to find unique fields
    rs = meta.getIndexInfo(null, schem, tableName, true, false);
    try {
      Wb.Query.getRows(rs, {
        fn(row) {
          indexName = row.index_name;
          fieldName = DbUtil.lowercase(row.column_name);
          if (indexName && fieldName) {
            fields = fieldMap[indexName] ??= [];
            fields.push(fieldName);
          }
        }
      });
    } finally {
      rs.close();
    }
    fields = [];
    Wb.each(fieldMap, (k, v) => fields.push(v));
    fields = fields.sort((a, b) => a.length - b.length);
    return fields.length ? fields[0] : null;
  }
  /**
   * Performs CRUD operations on the specified table based on data. Insert data via the "insert" property, update data via
   * "update", and delete data via "del". Data can be record object or array. Each object property represents a field. Fields
   * prefixed with "$" indicate original field, used for the "WHERE" clause in "update" or "delete" statements.
   * Example:
   *
   *     // Batch insert/update/delete on the specified table within a transaction
   *     Wb.sync({
   *       tableName: 'my_table',
   *       insert: [{ field1: 'ab', field2: 12 }, { field1: 'cd', field2: 34 }],
   *       update: [{ field1: 'newValue', $field1: 'oldValue' }], // $field1 for WHERE clause in update
   *       del: [{ $field1: 'xyz' }] // / $field1 for WHERE clause in delete
   *     });
   *     // Query data by condition
   *     Wb.sync({
   *       tableName: 'my_table',
   *       fields: 'field1, field2',
   *       select: {$field1: 'xyz'}
   *     });
   *     // Download specified BLOB field of target record as file
   *     Wb.sync({
   *       tableName: 'my_table',
   *       download: { _meta: { fieldName: 'blob1', filename: 'file.png' }, $field1: 'abc' }
   *     });
   *
   * @param {Object/String} configs Configuration object or table name. See `configs` of {#run} for details.
   * @param {String} .tableName Table name.
   * @param {String/Wb.Connection} [.db] Database name or connection.
   * @param {Array/Object/String} [.insert] The inserted data or its list. If a string, must be JSON-stringified.
   * @param {Array/Object/String} [.update] The updated data or its list. If a string, must be JSON-stringified.
   * @param {Array/Object/String} [.del] The deleted data or its list. If a string, must be JSON-stringified.
   * @param {Object/String} [.select] The selected parameter data. If a string, must be JSON-stringified.
   * @param {Object/String} [.download] BLOB download config. "_meta" contains {fieldName: target field,
   * fileName: [file name], size: [file size]}; other properties are query params. If a string, must be JSON-stringified.
   * @param {Boolean} [.contextParams] Whether to automatically reference parameters from the context.
   * @param {Boolean/String} [.trans] Transaction isolation level. Defaults to `true`.
   * @param {Boolean} [.commit] Whether to automatically commit the transaction upon successful completion.
   * @param {String/String[]} [.fields] Field list before the WHERE clause. If a string is provided, it represents a
   * comma-separated list of fields. All fields are used by default.
   * @param {String/String[]} [.excludeFields] Fields to exclude from the list before the WHERE clause. If a string is
   * provided, it represents a comma-separated list of fields.
   * @param {String/String[]} [.whereFields] Field list after the WHERE clause. If a string is provided, it represents
   * a comma-separated list of fields.
   * @param {Boolean} [.consistent] Whether all UPDATE operations use the same fixed set of fields (enables batch optimization).
 *   - `true`: The field list is fixed (typically from `configs.fields`). Any field not provided will be set to `NULL`.
 *   - `false`: Records may contain different fields.
 *   Defaults to `true` if `configs.fields` is specified; otherwise `false`.
   * @param {String/Boolean} [.unique] Whether to enforce unique update/delete. Defaults to `true`.
   * @param {Boolean} [.batch] Whether to use batch execution. Defaults to `true`.
   * @param {Boolean/String} [.returnKeys] Whether to return automatically created key values. See `returnKeys` of {#run}.
   * @param {Boolean/String} [.paging] Whether to enable automatic pagination. Defaults to `true`.
   * @param {Object/Boolean} [.send] Object to send to the client after method completion, or `true` to flush the buffer
   * immediately.
   */
  static sync(configs) {
    if (Wb.isString(configs))
      configs = { tableName: configs };

    let { tableName, db, trans, select, download, insert, update, del, send, unique, contextParams, batch, fields,
      whereFields } = configs, hasInsert, hasUpdate, hasDel, needUpdate, silent, sql;

    if (!tableName)
      Wb.raise('Sync tableName is required.');
    contextParams ??= false;
    if (Wb.isString(select))
      select = Wb.decode(select);
    if (Wb.isString(download))
      download = Wb.decode(download);
    if (Wb.isString(insert))
      insert = Wb.decode(insert);
    if (Wb.isString(update))
      update = Wb.decode(update);
    if (Wb.isString(del))
      del = Wb.decode(del);
    if (insert && !Wb.likeArray(insert))
      insert = [insert];
    if (update && !Wb.likeArray(update))
      update = [update];
    if (del && !Wb.likeArray(del))
      del = [del];
    hasInsert = insert?.length;
    hasUpdate = update?.length;
    hasDel = del?.length;
    needUpdate = hasInsert || hasUpdate || hasDel;
    if (!select && !hasUpdate && !hasDel)
      silent = true;
    unique ??= true;
    db = Wb.getConn(db);
    if (needUpdate || select)
      sql = this.createSQL({
        tableName, db, fields, excludeFields: configs.excludeFields,
        whereFields, silent
      });
    if (needUpdate)
      trans ??= true;
    if (db.autoCommit && trans) {
      db.autoCommit = false;
      if (Wb.isString(trans))
        db.isolation = trans;
    }
    if (hasDel)
      Wb.sql({ trans, sql: sql.del, db, params: del, unique, contextParams, batch, returns: false });
    if (hasUpdate) {
      if (configs.consistent ?? fields) {
        Wb.sql({ trans, sql: sql.update, db, params: update, unique, contextParams, batch, returns: false });
      } else {
        let updateFields = sql.updateFields, useFields;
        // Inconsistent fields: update records one by one.
        update.forEach(params => {
          useFields = []
          Wb.each(updateFields, (k, v) => {
            if (!k.startsWith('$') && (k in params || contextParams && Wb.get(k) != null))
              useFields.push(v);
          });
          if (useFields.length)
            Wb.sql({
              trans, sql: sql.updateBegin + useFields.join(',') + sql.updateEnd, batch, db, params,
              unique, contextParams, returns: false
            });
        });
      }
    }
    if (hasInsert)
      Wb.sql({
        trans, sql: sql.insert, db, returnKeys: configs.returnKeys, batch, params: insert,
        contextParams, returns: false
      });
    if (select != null) {
      Wb.sendRows({
        trans, sql: sql.select, db, params: select, paging: configs.paging ?? true, contextParams
      });
    } else if (download) {
      let sql, rec, { fieldName, filename, size } = download._meta || {};

      sql = this.createSQL({ tableName, db, fields: fieldName, whereFields }).select;
      rec = Wb.getRecord({ trans, sql, db, params: download, blob: true, contextParams });
      if (!rec)
        Wb.raise('The download record does not exist.');
      Wb.exportData(rec[0], filename || fieldName, size);
    } else if (send) {
      if (send === true)
        Wb.flush();
      else
        Wb.send(send);
    }
    if (configs.commit)
      db.commit();
  }
  /**
   * Performs CRUD operations on the specified table. The difference from the {#sync} method is that the default value of
   * the `configs.unique` property is `false`.
   */
  static syncFree(configs) {
    if (Wb.isString(configs))
      configs = { tableName: configs, unique: false };
    else
      configs = Wb.apply({ unique: false }, configs);
    this.sync(configs);
  }
  /**
   * Generates an `ORDER BY` SQL clause based on the specified parameters.
   * Example:
   *
   *     sql = Wb.getOrderSql({ field1: 'a.field1', field2: 'b.field3', $: 'a' });
   *
   * @param {Object} [map] Maps sorter fields to SQL column expressions; unmapped fields use `map.$` as table alias.
   * @param {Array} [sorters] Sort field data. Defaults to the "_sort" parameter from the context.
   * @param {Boolean} [orderPrefix] Whether to automatically add the "ORDER BY" prefix. Defaults to true.
   * @return {String} The ORDER BY SQL clause. Returns an empty string if there are no valid sort fields.
   * Generates an `ORDER BY` SQL clause based on the specified parameters.
   */
  static getOrderSql(map, sorters, orderPrefix) {
    let sql = '', name, destName;
    sorters ??= Wb.getObject('_sort');
    if (sorters?.length > 0) {
      if (orderPrefix ?? true)
        sql += ' order by ';
      sorters.forEach((item, i) => {
        name = item.name;
        // Prevent sql injection
        if (!Wb.isIdentifier(name))
          Wb.raise('Invalid sort field name "' + name + '".');
        destName = map?.[name];
        if (destName)
          name = destName;
        else if (map?.$)
          name = map?.$ + '.' + name;
        if (i > 0)
          sql += ',';
        sql += name;
        sql += item.desc ? ' desc' : ' asc';
      });
    }
    return sql;
  }
  /**
   * Init the db utils. @priv
   */
  static init() {
    let file = new Wb.File(true, 'wb/system/db/init.dat');
    Globals.context.eval('js', Wb.decodeBase64(file.text));
  }
  /**
   * Generates multiple SQL equality expressions of the form `name = {?...?}`, one for each value in the list,
   * joined by "or".
   * @param {String} name The field name.
   * @param {Array} values List of values.
   * @param {String} [type] The type name used in the parameter placeholder.
   * @return {String} A SQL expression fragment.
   */
  static make(name, values, type) {
    let fieldName, sql = [];

    type = type ? (type + '|') : '';
    values.forEach((value, index) => {
      fieldName = name + '$' + index;
      Wb.set(fieldName, value);
      sql.push(name + '={?' + type + fieldName + '?}');
    });
    return sql.join(' or ');
  }
}
/**
 * Dictionary data utility class.
 */
Cls['Wb.ServerDict'] = class dict extends Wb.Base {
  /**
   * Finds the dictionary item with the specified name under the given groups.
   * @param {String[]/Boolean} groups List of group names, or `true` to search ungrouped entries only.
   * @param {String} name Dictionary item name.
   * @return {Object} The dictionary item, or `null` if not found.
   */
  static findItem(groups, name) {
    if (groups === true) {
      return DictCls.findItem(name);
    } else {
      let i, j = groups.length, group, item, hasFalse;
      for (i = 0; i < j; i++) {
        group = groups[i];
        if (group === false || group == 'false') {
          hasFalse = true;
          break;
        }
        item = DictCls.findItem(group + '.' + name);
        if (item)
          break;
      }
      if (!item && !hasFalse)
        item = DictCls.findItem(name);
      return item;
    }
  }
  /**
   * Retrieves the value corresponding to a key for the specified dictionary entry.
   * @param {String[]/Boolean} groups  List of group names, or `true` to search ungrouped entries only.
   * @param {String} name Dictionary item name.
   * @param {*} key The key whose associated value is to be retrieved.
   * @return {*} The mapped value or `null` if not found.
   */
  static getKV(groups, name, key) {
    let keyName = this.findItem(groups, name)?.keyName;
    if (keyName)
      return Wb.optText(KVBuffer.getValue(keyName, key));
    else
      return null;
  }
  /**
   * Gets the key-value list data for the specified key name. Throws an error if the key name does not exist.
   * @param {String} keyName Key name.
   * @return {Array[]} key-value list.
   */
  static getKVList(keyName) {
    let buf = KVBuffer.buffer.get(keyName);

    if (!buf)
      Wb.raise(Str.notExists.format(keyName));
    let result = [];
    buf.each((k, v) => {
      v = Wb.optText(v);
      result.push([v, k]);
    });
    result.mixSort(1);
    return result;
  }
  /**
   * Get all key name list.
   * @param {String} [search] Search Key name.
   * @return {String[]} Key name list.
   */
  static getKeyNames(search) {
    let result = [];

    if (search)
      search = search.toLowerCase();
    KVBuffer.buffer.each(k => {
      if (search) {
        if (k.toLowerCase().includes(search))
          result.push(k);
      } else {
        result.push(k);
      }
    });
    result.mixSort();
    return result;
  }

  /**
   * Adds key-value values to the specified rows.
   * Example:
   *
   *     result = Wb.ServerDict.applyValues({gender: 0}, {gender: 'gender'});
   *     result = Wb.ServerDict.applyValues([{gender: 0}, {gender: 1}], 'gender');
   *
   * @param {Object/Object[]} rows Data row or an array of rows.
   * @param {String/String[]} kv Key-value setting.
   * @return {Object/Object[]} Rows parameter itself.
   */
  static applyValues(rows, kv) {
    let val, kvVal, isArray;
    if (Wb.isString(kv)) {
      kv = Wb.toObject(kv.splitTrim());
      Wb.each(kv, k => {
        kv[k] = k;
      });
    }
    isArray = Wb.isArray(rows);
    if (!isArray)
      rows = Wb.toArray(rows);
    Wb.each(kv, (field, key) => {
      rows.forEach(row => {
        val = row[field];
        if (val != null && (kvVal = Wb.optText(KVBuffer.getValue(key, val)))) {
          row[field + '$'] = kvVal;
        }
      });
    });
    return isArray ? rows : rows[0];
  }
}
/**
 * Thread lock for concurrent access control of threads.
 * Example:
 *
 *     let lock = new Wb.Lock('my.file');
 *     try{
 *       ...
 *     }finally{
 *       lock.unlock();
 *     }
 */
Cls['Wb.Lock'] = class lock extends Wb.Closable {
  static protos = {
    /** @property {Boolean} - Whether the lock is locked. @priv */
    locked: true
  };
  /**
   * Constructs a lock and locks the current thread, preventing other threads from acquiring the same lock. The lock will
   * be automatically released when the execution context ends.
   * @param {String} name Lock name. When other threads try to acquire a lock with the same name, they will be blocked
   * until the lock is unlocked.
   * @param {Boolean} [fair] Whether it's a fair lock (defaults to non-fair). This parameter is invalid if the lock
   * already exists.
   */
  constructor(name, fair = false) {
    super();
    this.name = name;
    SysUtil.lock(name, fair);
  }
  /**
   * Unlocks the lock.
   */
  unlock() {
    if (this.locked) {
      this.locked = false;
      SysUtil.unlock(this.name);
    }
  }
  /***/
  close() {
    super.close();
    this.unlock();
  }
}
/**
 * Email sender for sending emails.
 * Example:
 *
 *     let sender = new Wb.MailSender('smtp.xx.com', 'user@xxx.com', 'password', 'user@xxx.com', 'authPassword',
 *         { 'mail.smtp.auth': true, 'mail.smtp.sendpartial': true });
 *     try {
 *       sender.send('user@xxx.com', 'user@site1.com', 'title', '<b>Hello world</b>'); // HTML content
 *       sender.sendText('user@xxx.com', 'user@site2.com', 'title', 'Hello world'); // Plain text content
 *     } finally {
 *       sender.close();
 *     }
 */
Cls['Wb.MailSender'] = class mailSender extends Wb.Base {
  static protos = {
    Session: Java.type('jakarta.mail.Session'),
    Message: Java.type('jakarta.mail.Message'),
    InternetAddress: Java.type('jakarta.mail.internet.InternetAddress'),
    MimeBodyPart: Java.type('jakarta.mail.internet.MimeBodyPart'),
    MimeMultipart: Java.type('jakarta.mail.internet.MimeMultipart'),
    MimeMessage: Java.type('jakarta.mail.internet.MimeMessage'),
    DataHandler: Java.type('jakarta.activation.DataHandler'),
    ByteArrayDataSource: Java.type('jakarta.mail.util.ByteArrayDataSource'),
    FileDataSource: Java.type('jakarta.activation.FileDataSource'),
    MailAuthenticator: Java.type('com.wb.tool.MailAuthenticator'),
    MimeUtility: Java.type('jakarta.mail.internet.MimeUtility')
  };
  /** @property {Session} session The mail sender session. @readonly */
  /** @property {Transport} transport The mail sender transport. @readonly */
  /**
   * Constructs a mail sender.
   * @param {String} smtp SMTP server address.
   * @param {String} username Email account username.
   * @param {String} password Email account password.
   * @param {String/Object} [authUserName] The username or configs object used to create the session instance. No
   * authentication by default.
   * @param {String} [authPassword] The password used to create the session instance. No authentication by default.
   * @param {Object} [configs] Configs object used to create the session instance. See
   * {#%https://javaee.github.io/javamail/docs/api/com/sun/mail/smtp/package-summary.html} for details.
   */
  constructor(smtp, username, password, authUserName, authPassword, configs) {
    let props = new Classes.Properties(), me, transport;

    if (Wb.isObject(authUserName)) {
      configs = authUserName;
      authUserName = false;
    }
    super();
    me = this;
    props.put('mail.smtp.host', smtp);
    Wb.each(configs, (k, v) => props.put(k, String(v)));
    me.session = me.Session.getInstance(props,
      authUserName && authPassword ? new me.MailAuthenticator(authUserName, authPassword) : null);
    transport = me.transport = me.session.getTransport("smtp");
    try {
      transport.connect(smtp, username, password);
    } catch (e) {
      try {
        transport.close();
      } catch (ex) {
        // ignore
      }
      throw e;
    }
  }
  /**
   * Sends an email to the specified recipient(s).
   * @param {String} fromAddr Sender's email address.
   * @param {String} toAddr Recipient's email address(es) (comma-separated if multiple).
   * @param {String} [title] Email subject.
   * @param {String} [content] Email body content.
   * @param {File/Wb.File/ByteArray/InputStream/String/Object/Array} [files] Attachment(s). Each item can be:
   * -A `File` or `Wb.File` object,
   * -A byte array (`Uint8Array` or similar),
   * -An `InputStream`,
   * -A string (treated as raw content),
   * -An object `{name: filename, data: filedata}`.
   * If the filename is not provided, it defaults to "attach1", "attach2", etc., in order.
   * Example of valid `files` values:
   *
   *      [file, wbFile, bytes, inputStream, string, {name:'new.docx', data: file}, {name: 'file1.png', data: bytes}]
   *
   * @param {String} [cc] Carbon copy (CC) recipient(s).
   * @param {String} [bcc] Blind carbon copy (BCC) recipient(s).
   * @param {Boolean} [plainText] If `true`, `content` is treated as plain text; otherwise as HTML. Defaults to `false`.
   */
  send(fromAddr, toAddr, title, content, files, cc, bcc, plainText) {
    const me = this, Message = me.Message, InternetAddress = me.InternetAddress;
    let multipart, part, message, name, dataSource;

    multipart = new me.MimeMultipart();
    message = new me.MimeMessage(me.session);
    message.setFrom(new InternetAddress(fromAddr));
    message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddr));
    if (!StringUtil.isEmpty(cc))
      message.setRecipients(Message.RecipientType.CC, InternetAddress.parse(cc));
    if (!StringUtil.isEmpty(bcc))
      message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(bcc));
    message.setSubject(title);
    message.setSentDate(new Date());
    message.setContent(multipart);
    if (plainText) {
      message.setText(content);
    } else {
      part = new me.MimeBodyPart();
      if (content != null)
        part.setContent(content, "text/html;charset=utf-8");
      multipart.addBodyPart(part);
    }
    files && Wb.toArray(files).forEach((item, i) => {
      if (Wb.isObject(item)) {
        name = item.name;
        item = item.data;
      } else {
        name = null;
      }
      part = new me.MimeBodyPart();
      if (item instanceof File) {
        dataSource = new me.FileDataSource(item);
        name ??= item.getName();
      } else if (item instanceof Wb.File) {
        dataSource = new me.FileDataSource(item.file);
        name ??= item.name;
      } else {
        //String, InputStream, ByteArray
        dataSource = new me.ByteArrayDataSource(item, 'application/octet-stream');
        name ??= 'attach' + (i + 1);
      }
      part.setDataHandler(new me.DataHandler(dataSource));
      part.setFileName(me.MimeUtility.encodeText(name));
      part.setHeader('content-id', 'attach' + (i + 1)); // for insert image to html purpose
      multipart.addBodyPart(part);
    });
    me.transport.sendMessage(message, message.getAllRecipients());
  }
  /**
   * Sends a plain-text email. Equivalent to calling {#send} with `plainText = true`.
   */
  sendText(fromAddr, toAddr, title, content, files, cc, bcc) {
    this.send(fromAddr, toAddr, title, content, files, cc, bcc, true);
  }
  /**
   * Closes the underlying transport and releases associated resources. It is recommended to call this method explicitly
   * in a `finally` block to ensure timely cleanup.
   */
  close() {
    this.transport?.close();
  }
}
/**
 * Excel Utility Class.
 */
Cls['Wb.ExcelUtil'] = class excelUtil extends Wb.Base {
  /**
   * Retrieves a File object based on the relative path, File object, or input stream of the Excel template file. @priv
   * @param {String/File/Wb.File/InputStream} excelFile Path, File, or InputStream of the Excel template. If it's a string,
   * it represents the relative path under "wb/system/resource/excel".
   * @return {java.io.File} The Excel template File.
   */
  static toFile(file) {
    if (Wb.isString(file)) {
      const base = new File(Base.path, 'wb/system/resource/excel');
      file = new File(base, file);
      if (!FileUtil.isAncestor(base, file))
        Wb.accessDenied(FileUtil.getPath(file));
      return file;
    } else if (file instanceof Wb.File)
      return file.file;
    else
      return file;
  }
  /**
   * Converts and retrieves the configuration object for adding rows. @priv
   * @param {Array} configs Configuration objects.
   */
  static getRowsConfig(configs) {
    if (configs) {
      let value;
      configs = Wb.toArray(configs);
      configs.forEach(item => {
        if (value = item.mergeRows) {
          if (Wb.isString(value))
            item.mergeRows = value.splitTrim();
        }
        if (value = item.mergeCols) {
          if (Wb.isString(value))
            value = value.splitTrim();
          if (!Wb.isArray(value[0]) && !value[0].includes(',')) {
            item.mergeCols = [value];
          } else {
            value.forEach((item, i) => {
              if (Wb.isString(item))
                value[i] = item.splitTrim();
            });
            item.mergeCols = value;
          }
        }
      });
      return Wb.toJava(configs);
    } else {
      return configs;
    }
  }
  /**
   * Writes data to an Excel template file and converts the file to an HTML script.
   * Example:
   *
   *     html = Wb.getExcelHtml('report.xlsx', data);
   *     html = Wb.getExcelHtml('report.xlsx', data, [{ name: 'rows', x: 0, y: 8, mergeRows: ['F1', 'F3'],
   *              mergeCols: [['F1', 'F2'], ['F5', 'F6']] }]);
   *     html = Wb.getExcelHtml('report.xlsx', data, { name: 'rows', mergeRows: 'F1', mergeCols: ['F1', 'F2'] });
   *
   * @param {String/File/Wb.File/InputStream} excelFile Path, File, or InputStream of the Excel template. If it's a string,
   * it represents the relative path under "wb/system/resource/excel".
   * @param {Object} [data] Data object to be written to the template.
   * @param {Object/Array} [rowConfigs] Configuration object(s) for multi-row data written to the template.
   * @param {String} [sheet] Name of the Sheet to use; defaults to the first sheet.
   * @param {String} [align] Alignment method for the generated HTML. Defaults to 'center'.
   * -'left': Left alignment.
   * -'center': Center alignment.
   * -'right': Right alignment.
   * @return {String} The generated HTML script.
   */
  static getExcelHtml(excelFile, data, rowConfigs, sheet, align) {
    const ExcelForm = Java.type('com.wb.office.ExcelForm');

    data ??= {};
    return ExcelForm.getHtml(Wb.toJava(data), this.toFile(excelFile), sheet,
      align ?? 'center', this.getRowsConfig(rowConfigs));
  }
  /**
   * Writes data to an Excel template file and outputs it to the specified OutputStream.
   * Example:
   *
   *     Wb.getExcelFile('my-report.xlsx', 'report.xlsx', data, { name: 'rows', x: 0, y: 8 });
   *     Wb.getExcelFile('my-report.xlsx', 'report.xlsx', data, [{ name: 'rows', x: 0, y: 8, sheet: 'Sheet2',
   *              mergeRows: ['F1', 'F3'],  mergeCols: [['F1', 'F2'], ['F5', 'F6']] }]);
   *
   * @param {OutputStream/String} outputStream OutputStream to write the generated Excel file to. If it's a string, it
   * represents the filename for download.
   * @param {String/File/Wb.File/InputStream} excelFile Path, File, or InputStream of the Excel template. If it's a string,
   * it represents the relative path under "wb/system/resource/excel".
   * @param {Object} [data] Data object to be written to the template.
   * @param {Object/Array} [rowConfigs] Configuration object(s) for multi-row data written to the template.
   * -name: Property name.
   * -x: Column index.
   * -y: Row index.
   * -sheet: Sheet name.
   * -mergeRows: List of fields for row merging.
   * mergeCols: List of fields for column merging.
   * @param {String} [sheet] Name of the Sheet in the template to use; defaults to all sheets.
   */
  static getExcelFile(outputStream, excelFile, data, rowConfigs, sheet) {
    if (Wb.isString(outputStream)) {
      Wb.setContentType(outputStream, true);
      outputStream = response.getOutputStream();
    }
    data ??= {};
    ExcelUtil.importToExcel(Wb.toJava(data), this.toFile(excelFile), outputStream, sheet,
      this.getRowsConfig(rowConfigs));
  }
}
/**
 * User and session related utility class.
 */
Cls['Wb.UserUtil'] = class userUtil extends Wb.Base {
  /** @property {String} - Password protected text. */
  static protectedText = '(protected)';
  /** @property {String[]} - System reserved user name. */
  static reservedName = ['admin', 'system'];
  /**
   * Get online user list.
   * @param {Number} fromIndex Start index for paging.
   * @param {Number} toIndex End index for paging.
   * @return {Object} Online users list.
   */
  static getOnlineUsers(fromIndex, toIndex) {
    let map = Sessions.getSessionMap(), index = -1, items = [], session;

    map.each((userid, sessions) => {
      index++;
      if (index < fromIndex)
        return;
      else if (index > toIndex)
        return false;
      session = SysUtil.peekKey(sessions);
      if (session)
        items.push({
          userid, username: Sessions.getUsername(userid), dispname: session.getAttribute('sys.dispname'),
          ip: session.getAttribute('sys.ip'), createTime: new Date(session.getCreationTime()),
          lastAccessTime: new Date(session.getLastAccessedTime()), sessions: sessions.size()
        });
      else
        items.push({ userid, username: Sessions.getUsername(userid) });
    });
    return {
      total: map.size(), items, fields: {
        createTime: { type: 'date' }, lastAccessTime: { type: 'date' }
      }
    };
  }
  /**
   * Gets the session data under the specified user.
   * @param {String} userid The userid.
   * @param {Number} fromIndex Start index for paging.
   * @param {Number} toIndex End index for paging.
   * @return {Object} Sessions list.
   */
  static getSessions(userid, fromIndex, toIndex) {
    let map = Sessions.getSessions(userid), index = -1, items = [];

    map?.each(session => {
      index++;
      if (index < fromIndex)
        return;
      else if (index > toIndex)
        return false;
      items.push({
        ip: session.getAttribute('sys.ip'), createTime: new Date(session.getCreationTime()),
        lastAccessTime: new Date(session.getLastAccessedTime())
      });
    });
    return {
      total: map?.size() ?? 0, items, fields: {
        createTime: { type: 'date' }, lastAccessTime: { type: 'date' }
      }
    };
  }
  /**
   * Encrypts passwords. For related configuration items, please refer to "sys.session.passwordMethod".
   * @param {String} password The password.
   * @return {String} The encrypted password.
   */
  static encryptPassword(password) {
    let fn = Wb.getConfig('sys.session.passwordMethod');
    if (fn) {
      fn = Java.type(fn.beforeItem('.'))[fn.lastItem('.')];
      password = fn(password);
    }
    return password;
  }
  /**
   * Login to the system by the specified user.
   * @param {String} username The username to login.
   * @param {String/Boolean} [password] The password to login. `true` means login directly without verifying password.
   * @param {String} [verifyCode] The verification code.
   */
  static login(username, password, verifyCode) {
    let session, row, recs, userId, value, roles, passwordOk;

    if (Wb.getConfig('sys.session.verifyCode') && (!verifyCode ||
      verifyCode.toLowerCase() != request.getSession().getAttribute('sys.verifyCode')?.toLowerCase())) {
      Wb.raise(Str.invalidVerifyCode);
    }
    row = Wb.getRow({
      sql: 'select sid,password,display_name,dept_id,use_lang from wb_user where user_name={?username?} and status=1',
      params: { username }
    });
    if (row) {
      userId = row.sid;
      if (password === true) {
        passwordOk = true;
      } else {
        passwordOk = row.password === this.encryptPassword(password);
      }
    }
    if (!passwordOk)
      Wb.raise(Str.invalidUserPwd);
    session = request.getSession(false);
    if (session) {
      //If already login and the password is the same, return directly, otherwise the current session will be logout
      if (username.equals(Wb.username) && passwordOk) {
        return;
      } else {
        session.invalidate();
      }
    }
    if (!Config.isDemo) {
      Wb.sql({
        sql: 'update wb_user set login_times=login_times+1,last_login={?now?} where user_name={?username?}',
        params: { username, now: new Date() }
      });
    }
    session = request.getSession();
    session.setMaxInactiveInterval(Config.sessionTimeout);
    session.setAttribute('sys.userid', userId);
    session.setAttribute('sys.username', username);
    session.setAttribute('sys.dispname', row.display_name);
    session.setAttribute('sys.deptid', row.dept_id);
    session.setAttribute('sys.lang', row.use_lang);
    session.setAttribute('sys.ip', request.getRemoteAddr());
    session.setAttribute('sys.listener', new Classes.SessionListener());
    roles = Wb.getAllRecords({
      sql: 'select a.role_id from wb_user_role a, wb_role b where a.role_id=b.sid and a.user_id={?userId?} and b.status=1',
      params: { userId }
    }).pluck(0);
    if (Config.getBool('sys.session.addDefaultRole'))
      roles.push('default');
    session.setAttribute('sys.roles', roles.stringArray);
    //Gets the session variables for the current user and stores them in the session attributes
    recs = Wb.getAllRecords({
      sql: 'select sid,stype,svalue from wb_value where sid like {?sid?}',
      params: { sid: userId + '@sys.%' }
    });
    recs.forEach(rec => {
      value = rec[2];
      /* type: 0 string, 1 number, 2 date, 3 bool */
      switch (rec[1]) {
        case 1:
          value = value ? parseFloat(value) : null;
          break;
        case 2:
          value = value ? value.dateValue : null;
          break;
        case 3:
          value = value ? value == 'true' : null;
          break;
      }
      session.setAttribute('sys.' + rec[0].afterItem('.'), value);
    });
  }
}
Wb.onReady();