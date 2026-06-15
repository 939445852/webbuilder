/**
 * WebBuilder utilities.
 * @class $path
 */
class Utils {
  /** @property {Function} - `java.net.URI` class. */
  static URI = Java.type('java.net.URI');
  /** @property {Function} - `java.net.Proxy` class. */
  static Proxy = Java.type('java.net.Proxy');
  /** @property {Function} - `java.net.InetSocketAddress` class. */
  static InetSocketAddress = Java.type('java.net.InetSocketAddress');
  /** @property {Function} - `java.net.InetAddress` class. */
  static InetAddress = Java.type('java.net.InetAddress');
  /**
   * Initiates an HTTP request to the specified URL. See also {#fetch}.
   * Example:
   *
   *     let html = Wb.submit('https://developer.mozilla.org'); // Fetches the page content
   *     let object = Wb.submit({ url: 'http://localhost/wb/m?xwl=test', params: { foo: 'bar' }, all: true });
   *     let result = Wb.submit({ url: 'http://localhost:8095/m?xwl=test404', all: true, silent: true });
   *
   * @param {Object/String} configs The request configuration object or URL.
   * @param {String} .url The URL for the request.
   * @param {Object} [.params] The request parameters object. If the `data` property is specified or the request uses
   * the `GET` method, the parameters will be encoded into the URL.
   * @param {String/Object/Array/InputStream/byte[]} [.data] The payload data to be submitted in the request body. If data
   * is an Object or Array, the contentType will default to "application/json".
   * @param {String} [.method] The HTTP method to use for the request, such as "POST" or "GET". Defaults to "POST" if
   * params or data is specified, otherwise "GET".
   * @param {Object} [.header] The request header configuration object.
   * @param {Boolean} [.form] Whether to submit parameters using "multipart/form-data" encoding. Defaults to `true` if
   * `params` contains InputStream/byte[]. When this parameter is specified, the `data` parameter becomes invalid.
   * @param {HttpServletRequest} [.request] Adds header from the request object to this request's headers.
   * @param {String} [.charset] The character encoding for sending text. Defaults to "utf-8".
   * @param {String} [.resultCS] The character encoding used when decoding the response result as text. Defaults to
   * automatic detection.
   * @param {Boolean} [.text]  Whether to return the result as text. `true` returns text, `false` returns a byte array,
   * null automatically determines. Defaults to null.
   * @param {Boolean} [.all] Whether to return an object containing multiple values, including:
   * -"result": The response body
   * -"header": The header object
   * -"cookie": The cookie value
   * -"code": The response status code
   * @param {String} [.cookie] The cookie value to set.
   * @param {Boolean} [.ajax] Whether to add the XMLHttpRequest request marker in the header.
   * @param {Boolean} [.silent] Whether to suppress exceptions when the returned status code is not 200.
   * @param {Boolean} [.gzip] Whether to automatically decompress gzip-compressed content. Defaults to true.
   * @param {Number} [.length] The length of the content to send in bytes.
   * @param {Number} [.timeout] The timeout for connection and reading in ms. 0 means never timeout. Defaults to 30000.
   * @param {Function} [.callback] A callback function for reading stream data, typically used for reading potentially
   * large streams. When specified, the returned data will be null.
   * @param {InputStream} [..inputStream] The input stream.
   * @param {Number} [..code] The response status code.
   * @param {String} [.host] The proxy server address.
   * @param {Number} [.port] The proxy server port number. Defaults to 8080.
   * @param {String} [.proxyType] The proxy server type. Defaults to "HTTP".
   * @param {String/Object/Array/InputStream/byte[]} [object] Request parameters or payload data.  Object type is
   * treated as `params`, others as `data`.
   * @return {String/byte[]/Object} The request result, which depends on the settings of the `text` and `all`
   * parameters. Returns null if there is no content.
   */
  static submit(configs, object) {
    let me = this, url, method, params, data, charset, resultCS, timeout, charsetPos, boundary, isBytes, isStream, text, all,
      length, header, resp, conn, bos, is, code, contentType, gzip, callback, request, hasError;

    configs = Wb.isString(configs) ? { url: configs } : Wb.copy(configs);
    if (object) {
      if (Wb.isObject(object))
        configs.params = object;
      else
        configs.data = object;
    }
    url = configs.url;
    charset = configs.charset || 'utf-8';
    resultCS = configs.resultCS;
    timeout = configs.timeout ?? 30000;
    gzip = configs.gzip ?? true;
    text = configs.text;
    all = configs.all;
    length = configs.length;
    data = configs.data;
    params = configs.params;
    boundary = params && (configs.form ?? Wb.some(params,
      (k, v) => v instanceof ByteArray || v instanceof InputStream || v instanceof Wb.File || v instanceof File));
    if (boundary)
      boundary = '#!^' + Wb.getId();
    callback = configs.callback;
    request = configs.request;
    method = configs.method || ((data || params) ? 'POST' : 'GET');
    header = {};
    if (request) {
      let name, names = request.getHeaderNames();

      while (names.hasMoreElements()) {
        name = names.nextElement();
        header[name] = request.getHeader(name);
      }
    }
    if (configs.ajax) {
      header['X-Requested-With'] = 'XMLHttpRequest';
      header['W-Requested-With'] = 'XMLHttpRequest';
    }
    if (configs.cookie)
      header.Cookie = configs.cookie;
    if (!boundary) {
      if (data) {
        if (!Java.isJavaObject(data) && (Wb.isObject(data) || Wb.isArray(data))) {
          header['Content-Type'] ??= 'application/json;charset=' + charset;
          data = Wb.encode(data);
        }
        if (params)
          url += (url.includes('?') ? '&' : '?') + Wb.encodeURL(params);
      } else {
        data = params ? Wb.encodeURL(params) : undefined;
        if (data && method == 'GET') {
          url += (url.includes('?') ? '&' : '?') + data;
          data = undefined;
        }
        header['Content-Type'] ??= 'application/x-www-form-urlencoded;charset=' + charset;
      }
    }
    if (boundary) {
      header['Content-Type'] ??= 'multipart/form-data; boundary=' + boundary;
    } else {
      isBytes = data instanceof ByteArray;
      isStream = data instanceof InputStream;
      header['Content-Type'] ??= (isBytes || isStream) ? 'application/octet-stream' : 'text/plain';
    }
    Wb.apply(header, configs.header);
    if (configs.host) {
      conn = new me.URI(url).toURL().openConnection(
        new me.Proxy(me.Proxy.Type.valueOf(configs.proxyType ?? 'HTTP'),
          new me.InetSocketAddress(configs.host, configs.port ?? 8080))
      );
    } else {
      conn = new me.URI(url).toURL().openConnection();
    }
    try {
      conn.setConnectTimeout(timeout);
      conn.setReadTimeout(timeout);
      conn.setUseCaches(false);
      conn.setRequestMethod(method);
      Wb.each(header, (k, v) => conn.setRequestProperty(k, String(v)));
      if (data || boundary) {
        let os;
        conn.setDoOutput(true);
        if (isBytes)
          length ??= data.length;
        if (length != null)
          conn.setRequestProperty('Content-Length', length.toString());
        os = conn.getOutputStream();
        try {
          if (boundary)
            writeForm(os, params, boundary);
          else if (isBytes)
            os.write(data);
          else if (isStream)
            IOUtils.copy(data, os);
          else
            os.write(String(data).getBytes(charset));
          os.flush();
        } finally {
          os.close();
        }
      }
      contentType = conn.getHeaderField('Content-Type');
      charsetPos = contentType?.indexOf('charset=');
      if (text == null) {
        // check data type
        if (contentType) {
          const mime = ['application/javascript', 'application/x-javascript', 'application/json', 'application/xml'];
          if (charsetPos != -1 || contentType?.includes('text/') || mime.some(item => contentType.includes(item)))
            text = true;
        }
        text ??= false;
      }
      if (!resultCS) {
        // check charset
        let pos, type = contentType;
        if (type) {
          pos = charsetPos;
          if (pos != -1) {
            type = type.substr(pos + 8);
            pos = type.indexOf(';');
            if (pos != -1)
              type = type.substr(0, pos);
            pos = type.indexOf(']');
            if (pos != -1)
              type = type.substr(0, pos);
            resultCS = type.trim();
          }
        }
        resultCS ||= 'utf-8';
      }
      code = conn.getResponseCode();
      hasError = code < 200 || code >= 300;
      resp = null;
      is = hasError ? conn.getErrorStream() : conn.getInputStream();
      if (is) {
        try {
          if (gzip && 'gzip' == conn.getHeaderField('Content-Encoding'))
            is = new Classes.GZIPInputStream(is);
          if (callback) {
            callback(is, code);
          } else {
            bos = new ByteArrayOutputStream();
            IOUtils.copy(is, bos);
            resp = bos.toByteArray();
            if (text)
              resp = new JavaString(resp, resultCS);
          }
        } finally {
          is.close();
        }
      }
      if (hasError && !configs.silent) {
        throw resp ? resp : ('HTTP ' + code);
      }
      if (all) {
        resp = {
          result: resp,
          cookie: conn.getHeaderField('Set-Cookie'),
          code,
          header: conn.getHeaderFields()
        }
      }
    } finally {
      conn.disconnect();
    }
    return resp;

    // write form data with params
    function writeForm(os, params, boundary) {
      const UrlConn = Java.type('java.net.HttpURLConnection');
      let isBt, isIs, isFile, writeString, is;

      writeString = s => os.write(s.getBytes(charset));
      Wb.each(params, (k, v) => {
        isBt = v instanceof ByteArray;
        isIs = v instanceof InputStream;
        if (v instanceof File)
          v = new Wb.File(v);
        isFile = v instanceof Wb.File;
        if (isBt || isIs || isFile) {
          writeString('--' + boundary + '\r\nContent-Disposition: form-data; name="' +
            k.beforeItem('|') + '"; filename="' + k.lastItem('|') + '"\r\nContent-Type: ' +
            UrlConn.guessContentTypeFromName(k) + '\r\nContent-Transfer-Encoding: binary\r\n\r\n');
        } else {
          writeString('--' + boundary + '\r\nContent-Disposition: form-data; name="' + k +
            '"\r\nContent-Type: text/plain; charset=' + charset + '\r\n\r\n');
        }
        if (isBt)
          os.write(v);
        else if (isIs)
          IOUtils.copy(v, os);
        else if (isFile) {
          is = v.stream;
          try {
            IOUtils.copy(is, os);
          } finally {
            SysUtil.close(is);
          }
        }
        else {
          if (Wb.isObject(v) || Wb.isArray(v))
            v = Wb.encode(v);
          else
            v = String(v);
          writeString(v);
        }
        writeString('\r\n');
      });
      writeString('--' + boundary + '--\r\n');
    }
  }
  /**
   * Initiates an HTTP request to the specified URL. The difference between this method and the {#submit} method is that the
   * default values of the `all` and `silent` parameters are both true.
   * @return {String/byte[]/Object} The request result.
   */
  static fetch(configs, object) {
    if (Wb.isString(configs))
      configs = { url: configs };
    return this.submit(Wb.apply({ all: true, silent: true }, configs), object);
  }
}
export default Utils;