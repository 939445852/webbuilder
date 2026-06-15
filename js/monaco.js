/*
 * monaco.js monaco editor
 * Copyright (c) Geejing
 * https://www.geejing.com
 */
/**
 * A component for displaying code, used to highlight code according to the specified code language.
 */
Cls['Wb.Code'] = class code extends Wb.Component {
  static cls = 'w-code';
  static tagName = 'code';
  static firstNames = ['lang'];
  static configs = {
    lang: 'text/javascript'
  };
  /**
   * Syntax coloring the script code in the specified element according to the specified language.
   * @param {Element} el Element used for coloring.
   * @param {String} [mimeType] The used language, which is specified by default by the data-lang attribute of the element.
   */
  static colorize(el, mimeType) {
    if (window.monaco && mimeType != 'txt') {
      let options = { theme: 'WbTheme' };

      if (mimeType)
        options.mimeType = mimeType;
      Wb.CodeEditor.initTheme();
      monaco.editor.colorizeElement(el, options);
      el.cls = 'WbTheme';//monaco bug, adding this can avoid duplicate WbTheme.
    }
  }
  /** @property {String} - The language MimeType, for example: js is text/javascript, css is text/css. */
  set lang(lang) {
    if (this.lang$ !== lang) {
      this.lang$ = lang;
      if (lang)
        this.el.setAttribute('data-lang', lang);
      else
        this.el.removeAttribute('data-lang');
    }
  }
  /***/
  get lang() {
    return this.lang$;
  }
  /** @property {TextString} - The code to be displayed. @key */
  set value(value) {
    value ??= '';
    if (this.text !== value) {
      this.text = value;
      if (value)
        Wb.Code.colorize(this.el);
    }
  }
  /***/
  get value() {
    return this.text;
  }
}
/**
 * A control for editing code in the specified code language.
 * Examples: {#%code-editor.xwl|ide?openModule=example/comps/code-editor.xwl}
 * @icon edit
 * @lib wb/js/monaco.js
 * @mimic textArea
 */
Cls['Wb.CodeEditor'] = class codeEditor extends Wb.Control {
  /** @property {Enum} language The type of code language, defaults to "JavaScript".
   * -'javascript': javaScript
   * -'css': CSS
   * -'json': JSON
   * -'yaml': YAML
   * -'html': HTML
   * -'sql': SQL
   * -'txt': Text
   * -'xml: XML
   * -'java': Java
   * -'python': Python
   * -'php': PHP
   * -'ruby': Ruby
   * -'r': R
   * -'csharp': C#
   * -'c': C
   * -'cpp': C++
   * @key
   */
  /** @property {Number} tabSize How many spaces the tab key occupies, the default is 2. */
  /** @property {Object} editorConfigs Editor configs object. */
  /**
   * Init Monaco.
   */
  static initMonaco() {
    let me = this;
    if (me.monacoInited)
      return;
    me.monacoInited = true;
    let cssFormatProvider, menuItems;

    cssFormatProvider = {
      provideDocumentFormattingEdits: function (model) {
        return [{
          text: me.formatCss(model.getValue()),
          range: model.getFullModelRange()
        }];
      }
    };
    monaco.languages.registerDocumentFormattingEditProvider('css', cssFormatProvider);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      Wb.apply({}, monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
        { noLib: true, noUnusedParameters: true, alwaysStrict: true })
    );
    menuItems = [];
    menuItems.pushIf(
      { icon: 'external-link', text: Str.gotoDefinition, keysText: 'Ctrl+F12', actionName: 'revealDefinition' },
      { icon: 'component', text: Str.gotoReferences, keysText: 'Shift+F12', actionName: 'goToReferences' },
      Wb.ide?.XwlEditor ? { icon: 'link', text: Str.gotoLink, keysText: 'Ctrl+F11', actionName: 'extraGotoLink' } : null,
      { text: Str.peekDefinition, keysText: 'Alt+F12', actionName: 'peekDefinition' },
      { text: Str.gotoSymbol, keysText: 'Ctrl+Shift+O', ellipsis: true, actionName: 'quickOutline' },
      { text: Str.peekReferences, actionName: 'referenceSearch.trigger' },
      '-',
      { icon: 'edit', text: Str.renameSymbol, keysText: 'F2', actionName: 'rename' },
      { text: Str.changeAllOccur, keysText: 'Ctrl+F2', actionName: 'changeAll' },
      { text: Str.formatDocument, keysText: 'Shift+Alt+F', actionName: 'formatDocument' },
      '-',
      { icon: 'cut', text: Str.cut, cid: 'cut', keysText: 'Ctrl+X', actionName: 'cut' },
      { icon: 'copy', text: Str.copy, cid: 'copy', keysText: 'Ctrl+C', actionName: 'copy' },
      { icon: 'paste', text: Str.paste, cid: 'paste', keysText: 'Ctrl+V', actionName: 'paste' },
      '-',
      { text: Str.commandPalette, icon: 'help2', keysText: 'Ctrl+Alt+H', actionName: 'quickCommand' }
    );
    me.contextMenu = new Wb.Menu({
      autoDestroy: false,
      events: {
        show() {
          let menu = this, text = menu.contextTarget?.getClosestComp(Wb.CodeEditor)?.selectedText;

          menu.disabled = me.disabled;
          menu.down('cut').disabled = menu.down('copy').disabled = !text;
        },
        menuclick(item) {
          let editor = this.contextTarget?.getClosestComp(Wb.CodeEditor);
          if (editor) {
            let action = item.actionName;
            switch (action) {
              case 'cut':
                editor.cut();
                break;
              case 'copy':
                editor.copy();
                break;
              case 'paste':
                editor.paste();
                break;
              default:
                editor.editor.getAction('editor.action.' + action).run();
            }
          }
        }
      },
      items: menuItems
    });
    me.initTheme();
  }
  /** @property {Array} - SQL key word list. @priv */
  static sqlKeyWords = [
    "add", "all", "alter", "and", "as", "asc", "avg", "between", "by", "case", "coalesce", "collate", "column", "commit",
    "compute", "constraint", "contains", "convert", "count", "create", "database", "declare", "default", "delete", "limit",
    "desc", "distinct", "double", "drop", "dump", "else", "escape", "except", "exec", "execute", "exists", "percentile_cont",
    "from", "full", "function", "grant", "group", "having", "identity", "if", "in", "index", "inner", "insert", "offset",
    "intersect", "into", "is", "isolation", "join", "key", "kill", "left", "like", "lock", "match", "min", "max", "not",
    "null", "nullif", "of", "off", "offsets", "on", "open", "or", "order", "outer", "over", "pivot", "plan", "string_agg",
    "precision", "primary", "print", "proc", "procedure", "public", "real", "restore", "restrict", "return", "any",
    "revert", "revoke", "right", "rollback", "schema", "select", "set", "sum", "shutdown", "table", "textsize", "some",
    "then", "to", "top", "tran", "transaction", "trigger", "truncate", "union", "unique", "update", "stddev", "stddev_pop",
    "use", "user", "values", "view", "when", "where", "while", "bit", "binary", "varbinary", "char", "stddev_samp",
    "varchar", "nchar", "nvarchar", "text", "ntext", "clob", "blob", "image", "tinyint", "smallint", "var_samp", "fetch",
    "mediumint", "int", "bigint", "decimal", "numeric", "float", "money", "smallmoney", "uniqueidentifier", "percentile_disc",
    "date", "time", "datetime", "timestamp", "boolean", "tinyblob", "tinytext", "mediumblob", "mediumtext", "end", "first",
    "longblob", "longtext", "enum", "json", "jsonb", "serial", "bigserial", "uuid", "array", "group_concat", "isnull",
    "rows", "only", "row_number", "rank", "dense_rank", "partition", "check", "before", "after", "begin", "for", "share",
    "concat", "substring", "substr", "dateadd", "datediff", "extract", "cast", "nvl", "foreign", "describe", "last"
  ];
  /**
   * Init theme.
   * @param {Boolean} [reinit] Whether repeated initialization is allowed.
   */
  static initTheme(reinit) {
    if (this.themeInited && !reinit)
      return;
    this.themeInited = true;
    let theme, bgColor, configs;

    theme = Wb.configs.editorTheme;
    bgColor = Wb.configs.editorBgColor;
    configs = window.MonacoThemeData ?? {
      base: theme,
      inherit: true,
      rules: [{ background: bgColor }],
      colors: {
        'editor.background': bgColor
      }
    };
    //000001 means customized color
    if (window.MonacoThemeData && bgColor != '#000001') {
      configs.rules[0].background = bgColor;
      configs.colors['editor.background'] = bgColor;
    }
    monaco.editor.defineTheme('WbTheme', configs);
    monaco.editor.setTheme('WbTheme');
  }
  /** @property {Object} - All editors object, k is path, v is the editor. @priv */
  static editors = {};
  static cls = 'w-codeeditor';
  /**
   * Finds the editor for the specified path.
   * @param {String} path The path to find.
   * @return {Wb.CodeEditor} The found editor or null if none was found.
   */
  static findEditor(path) {
    return this.editors[path] ?? null;
  }
  static protos = {
    /** @property {Boolean} - Whether allowed to fire {#*change} event. Defaults to `true`. */
    allowChange: true,
    allowFocus: true
  };
  /** @property {String} sqlDb The name of the database associated with the SQL editor when the {#language} is set to
   * "sql". Specifying this value enables SQL auto-completion. An empty string indicates the default database.
   */
  /***/
  init(configs) {
    let me = this, ct = me.constructor;
    ct.initMonaco();
    super.init(configs);
    me.originValue = configs.value ?? '';
    me.createEditor(configs);
    if (me.sqlDb != null)
      me.registerSqlProvider();
    ct.editors[me.path] = me;
    me.on('destroy', f => {
      delete ct.editors[me.path];
      me.editor.dispose();
    });
  }
  /**
   * Register SQL provider.
   */
  registerSqlProvider() {
    let me = this, ct = me.constructor;

    if (ct.sqlRegisterd)
      return;
    else
      ct.sqlRegisterd = true;
    monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: async function (model, position) {
        let editor = Wb.CodeEditor.findEditor(model.uri.path), db = editor.sqlDb;
        if (db == null)
          return;
        const Kind = monaco.languages.CompletionItemKind;
        let text, suggestions, result;

        text = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
        text = text.substr(Math.max(text.lastIndexOf(' '), 0)).trim();
        result = await Wb.fetch({
          url: 'm?xwl=sys/service/db/sql-provider', json: true, timeout: 5000, mask: false, showError: false,
          params: { data: Wb.encodeBase64(editor.value), key: text, db }
        });
        result = result.response ?? [];
        if (!Wb.isArray(result))
          result = [];
        suggestions = result.map(item => {
          return {
            label: item.text,
            kind: Kind[item.cate],
            insertText: item.text
          };
        }) ?? [];
        if (!text.trim().includes('.')) {
          ct.sqlKeyWords.forEach(item => {
            suggestions.push({
              label: item,
              kind: Kind.Keyword,
              insertText: item
            });
          });
        }
        return {
          suggestions
        };
      }
    });
  }
  /** @property {Boolean} autoComplete Whether to enable automatic code completion feature. Applicable
  * only in IDE. @code */
  /** @property {Boolean} serverScript Whether it is a server-side code editor. Applicable only in IDE. @code */
  /** @property {Wb.Tree} xwlTree Module tree for automatic code completion. Applicable only in IDE. @code */
  /** @property {Boolean} minimap Whether to display the code map. @key */
  /** @property {Boolean} lineNumbers Whether to display the line number. @key */
  /**
   * Execute automatic formatting on scripts.
   * @return {Promise} The promise object.
   */
  autoFormat() {
    return this.editor.getAction('editor.action.formatDocument').run();
  }
  /** @property {Boolean} popupMenu Whether to display the context menu. true displays native context menus,
   * false does not display context menus. Default null displays a custom context menu. @key
   */
  /**
   * @event cursorchange Triggered when the cursor position changes.
   * @param {Object} cursor Cursor position object. {{lineNumber}} is row number, {{column}} is column number.
   */
  /**
   * @event change Fires when the text in the editor changes.
   * @param {String} text Changed text.
   */
  /**
   * @event focus Fires when the editor receives focus.
   */
  /** @property {Object} editor Monaco editor instance. */
  /**
   * Create the code editor. @priv
   * @param {Object} configs Configs object.
   */
  createEditor(configs) {
    let editor, editorConfig, popupMenu = configs.popupMenu, me = this, language, mapLang,
      suggestName = 'editor.action.triggerSuggest', helpName = 'editor.action.quickCommand';
    const langMap = { py: 'python', js: 'javascript', mjs: 'javascript', rb: 'ruby', cs: 'csharp', xwl: 'yaml' };

    language = configs.language;
    mapLang = langMap[language];
    if (mapLang)
      language = mapLang;
    language ??= 'javascript';
    editorConfig = {
      scrollBeyondLastLine: false,
      detectIndentation: false,
      fixedOverflowWidgets: true,
      contextmenu: popupMenu === true,
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 0,
      unicodeHighlight: { ambiguousCharacters: false },
      wordWrap: 'wordWrapColumn',
      wordWrapColumn: 10000,
      language,
      fontSize: Wb.configs.fontSize,
      tabSize: configs.tabSize ?? 2
    };
    if (!(configs.lineNumbers ?? true))
      editorConfig.lineNumbers = 'off';
    if (!(configs.minimap ?? true))
      editorConfig.minimap = { enabled: false };
    if (popupMenu == null)
      me.contextMenu = me.constructor.contextMenu;
    //editor.updateOptions
    Wb.apply(editorConfig, configs.editorConfigs);
    me.wrapEl = me.addEl('w-input-wrap');
    editor = me.editor = monaco.editor.create(me.wrapEl, editorConfig);
    editor.suggestAction = editor.getAction(suggestName);
    //add trigger
    editor.addAction({
      id: suggestName,
      keybindings: [
        512 | 85
      ],
      label: Str.triggerSuggest,
      run(editor) {
        editor.suggestAction.run();
      }
    });
    editor.helpAction = editor.getAction(helpName);
    //redefine help trigger
    editor.addAction({
      id: helpName,
      keybindings: [
        2048 | 1024 | 38
      ],
      label: Str.help,
      run(editor) {
        editor.helpAction.run();
      }
    });
    //add goto last feature
    editor.addAction({
      id: 'extraGotoLastEdit',
      keybindings: [
        monaco.KeyMod.CtrlCmd | (monaco.KeyCode.Comma || monaco.KeyCode.US_COMMA)
      ],
      label: Str.lastEditLocation,
      run() {
        me.toLastCursor();
      }
    });
    //add goto link feature
    editor.addAction({
      id: 'editor.action.extraGotoLink',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.F11
      ],
      label: Str.gotoLink,
      run() {
        me.gotoLink();
      }
    });
    editor.onDidChangeModelContent(data => {
      me.lastCursor = me.cursor;
      if (me.allowChange)
        me.fireEvent('change', data);
      me.verify();
    });
    editor.onDidChangeCursorPosition(e => {
      me.fireEvent('cursorchange', e.position);
    });
    editor.onDidFocusEditorText(f => {
      me.fireEvent('focus');
    });
    me.mon({
      resize: f => {
        editor.layout();
      }, keydown: me.onKeyDown
    });
  }
  /** @property {String} - Editor URI. */
  get uri() {
    return this.editor.getModel().uri;
  }
  /** @property {String} - Editor path id, which uniquely identifies the editor. */
  get path() {
    return this.uri.path;
  }
  /**
   * Open the linked file and goto the definition based on the url link context at the current cursor.
   * Only available in IDE.
   */
  gotoLink() {
    let xwl = Wb.ide?.XwlEditor;
    if (!xwl)
      return;
    let me = this, editor = me.editor, cursor = me.cursor, row = cursor.lineNumber, col = cursor.column, i, j, c,
      beforeExp, afterExp, exp, pos, len;

    beforeExp = editor.getModel().getValueInRange({
      startLineNumber: row, startColumn: col - 500,
      endLineNumber: row, endColumn: col
    }).trim();
    afterExp = editor.getModel().getValueInRange({
      startLineNumber: row, startColumn: col,
      endLineNumber: row, endColumn: col + 500
    }).trim();
    pos = beforeExp.length;
    exp = beforeExp + afterExp;
    len = exp.length;
    for (i = pos; i >= 0; i--) {
      c = exp[i];
      if (c == '(' || c == '{' || c == '[' || c == ':' || c == ',' || c == '\n' || (c == '=' && (exp[i - 1] == ' ' || exp[i + 1] == ' ')))
        break;
    }
    for (j = pos + 1; j < len; j++) {
      c = exp[j];
      if (c == ')' || c == '}' || c == ']' || c == ',' || c == ';' || c == '\n')
        break;
    }
    exp = exp.substring(i + 1, j).trim();
    if (!exp.startsWith('"') && !exp.startsWith("'") && !exp.startsWith('xpath'))
      exp = exp.substr(exp.indexOf('=') + 1);
    Wb.ide.IDE.gotoLink(exp, me.up(p => p instanceof xwl)?.parent.path || me.parent?.path || null);
  }
  /**
   * @property {Function} validator A validation function to be called during control validation.
   * @param {Object} value The current editor value.
   * @return {Boolean/String} The returned string indicates that the value is illegal, the string is an error message,
   * and other values indicate that the value is valid.
   */
  /***/
  verify() {
    let me = this;

    if (me.required || me.validator) {
      let msg = null, value = me.value;

      if (me.required && value === '')
        msg = Str.requiredHint;
      if (!msg && me.validator) {
        value = me.validator.call(me, value);
        if (Wb.isString(value))
          msg = value;
      }
      me.setCls(msg, 'w-invalid');
      me.errorTip = msg;
      return !msg;
    }
    return true;
  }
  /***/
  clearError() {
    this.removeCls('w-invalid');
    this.errorTip = null;
  }
  /**
   * Complete the editing operation. Usually, after executing this method, the pop-up widgets will be hidden.
   */
  completeEdit() {
    this.editor.trigger('editor', 'hideSuggestWidget');
  }
  /**
   * Clears the value of the current control. To reset the value, please use the {#reset} method.
   */
  clear() {
    this.value = '';
    this.clearError();
  }
  /**
   * Resets the value to the initialized value. If initialized value is null, this method is equivalent to
   * the {#clear} method. To clear the value, please use the {#clear} method.
   */
  reset() {
    this.value = this.originValue;
    this.clearError();
  }
  /**
   * Fires when a key is pressed in the editor. @priv
   * @param {Event} e Event object.
   */
  onKeyDown(e) {
    if (e.ctrlMeta) {
      let ignore;
      switch (e.code) {
        case Keys.Digit1:
          this.insertBlock(['/*' + '*',
            ' * function comments.',
            ' * Example:',
            ' *',
            ' *     let foo = bar();',
            ' *',
            ' * @param {type} name1 required',
            ' * @param {type} [name2] optional',
            ' * @return {type} comments',
            ' */']);
          break;
        case Keys.Digit2:
          this.insertBlock('/*' + '* @property {type} - comments */');
          break;
        case Keys.Digit3:
          this.insertBlock([
            '/*' + '*',
            ' * @event eventname comments',
            ' * @param {type} name comments',
            ' */'
          ]);
          break;
        case Keys.Digit4:
          this.insertBlock("Wb.ajax({\n  url: '',\n  params: {},\n  success(resp) {\n  }\n});");
          break;
        case Keys.Digit5:
          this.insertBlock("let actions = {\n};\nactions[Params.xaction]();");
          break;
        case Keys.Digit6:
          this.insertBlock([
            '/*' + '*',
            ' * comments',
            ' */',
            "Cls['fullname'] = class shortname extends Wb.Base {",
            '}',
          ]);
          break;
        case Keys.Digit7:
          this.insertBlock([
            '/*' + '*',
            ' * Xwl comments.',
            ' * @class $path',
            ' */'
          ]);
          break;
        case Keys.Digit8:
          this.insertBlock([
            'Wb.apply(app, {',
            '',
            '});'
          ]);
          break;
        default:
          ignore = true;
      }
      if (!ignore)
        e.stopEvent();
    }
  }
  /** @property {Object} - Cursor position. @code
   * @param {Number} .lineNumber The Line number.
   * @param {Number} .column The column number.
   */
  set cursor(cursor) {
    let editor = this.editor;
    editor.setPosition(cursor);
    editor.revealPositionInCenter(cursor);
    editor.focus();
  }
  /***/
  get cursor() {
    return this.editor.getPosition();
  }
  /** @property {Object} - A copy of the cursor position. */
  get cursorCopy() {
    return Wb.copy(this.cursor);
  }
  /***/
  focus(preventScroll) {
    if (!preventScroll)
      this.el.intoView();
    this.editor.focus();
  }
  /**
   * Gets the offset of the specified position relative to the first character.
   * @param {Object} position The position.
   * @return {Number} Offset at position.
   */
  getOffset(position) {
    return this.editor.getModel().getOffsetAt(position);
  }
  /** @property {TextString} - The code text @key */
  set value(value) {
    let editor = this.editor;

    value ??= '';
    editor.setValue(value);
    //Set "\n" to a newline character
    editor.getModel().setEOL(0);
  }
  /***/
  get value() {
    let editor = this.editor;
    //Set "\n" to a newline character
    editor.getModel().setEOL(0);
    return editor.getValue()
  }
  /** @property {TextString} - Raw code text. The difference with the {#value} property is that setting this property
   * does not trigger the {#*change} event. */
  set rawValue(value) {
    this.allowChange = false;
    this.value = value;
    this.allowChange = true;
  }
  /***/
  get rawValue() {
    return this.value;
  }
  /***/
  set disabled(value) {
    let me = this;

    super.disabled = value;
    me.editor.updateOptions({ readOnly: value ? true : me.readonly$ });
  }
  /***/
  get disabled() {
    return super.disabled;
  }
  /** @property {Boolean} - true to mark the control as readOnly. @key */
  set readonly(value) {
    if (this.readonly$ !== value) {
      this.readonly$ = value;
      this.editor.updateOptions({ readOnly: value })
    }
  }
  /***/
  get readonly() {
    return this.readonly$;
  }
  /**
   * Turn the cursor to the last edit.
   */
  toLastCursor() {
    let lastCursor = this.lastCursor;
    if (lastCursor)
      this.cursor = lastCursor;
  }
  /**
   * Inserts text at the specified cursor.
   * @param {String} text The inserted text.
   * @param {Object} [cursor] Cursor. The default is the current cursor.
   * @param {Number} cursor.lineNumber Line number.
   * @param {Number} cursor.column Column number.
   */
  insertText(text, cursor) {
    cursor ??= this.cursor;
    this.editor.executeEdits(null, [{
      range: {
        startLineNumber: cursor.lineNumber, startColumn: cursor.column,
        endLineNumber: cursor.lineNumber, endColumn: cursor.column
      },
      text, forceMoveMarkers: true
    }]);
    this.editor.focus();
  }
  /** @property {String} - The selected text. @code */
  set selectedText(text) {
    let editor = this.editor;

    editor.executeEdits(null, [{
      range: editor.getSelection(), text, forceMoveMarkers: true
    }]);
    editor.focus();
  }
  /***/
  get selectedText() {
    let editor = this.editor;
    return editor.getModel().getValueInRange(editor.getSelection());
  }
  /**
   * Perform a cut operation.
   */
  cut() {
    this.copy();
    this.selectedText = '';
  }
  /**
   * Perform a copy operation.
   */
  copy() {
    navigator.clipboard?.writeText(this.selectedText).catch(f => Wb.tipError(Str.accessCbFailed));
  }
  /**
   * Perform a paste operation.
   */
  paste() {
    navigator.clipboard?.readText().then(
      text => this.selectedText = text,
      f => Wb.tipError(Str.accessCbFailed));
  }
  /**
   * Inserts paragraph text at the specified cursor. The difference between this method and {#insertText} is
   * that text starting from the second line automatically adds spaces at the beginning of each line to
   * align with the first line of text.
   * @param {String} lines Inserted lines text.
   * @param {Object} [cursor] Cursor. The default is the current cursor.
   * @param {Number} cursor.lineNumber Line number.
   * @param {Number} cursor.column Column number.
   */
  insertBlock(lines, cursor) {
    let i, j, line, colIndex;

    cursor ??= this.cursor;
    if (!Wb.isArray(lines))
      lines = lines.split('\n');
    colIndex = cursor.column - 1;
    j = lines.length;
    for (i = 1; i < j; i++) {
      line = lines[i]
      lines[i] = line.padStart(colIndex + line.length);
    }
    this.insertText(lines.join('\n'), cursor);
  }
  /**
   * Get the text at the cursor.
   * @param {Number} [offset] Offset of cusor column.
   * @return {String} The text from column 0 to the cursor.
   */
  getCursorText(offset) {
    let me = this, cursor = me.cursor;

    return me.editor.getModel().getLineContent(cursor.lineNumber).substring(0, cursor.column + (offset || 0));
  }
  /**
   * Automatically format CSS scripts.
   * @param {String} script The script string to be formatted.
   * @return {String} The formatted string.
   */
  static formatCss(script) {
    let indentSize = 2;
    let indentCharacter = ' ';
    let selectorSeparatorNewline = true;
    let endWithNewline = false;
    let newlineBetweenRules = true;
    let ch, pos = -1, whiteRe = /^\s+$/, parenLevel = 0;
    let nestedRules = {
      "@page": true,
      "@font-face": true,
      "@keyframes": true,
      "@media": true,
      "@supports": true,
      "@document": true
    };
    let groupRules = {
      "@media": true,
      "@supports": true,
      "@document": true
    };
    function next() {
      ch = script.charAt(++pos);
      return ch || '';
    }

    function peek(skipWhitespace) {
      let result, prevPos = pos;
      if (skipWhitespace) {
        eatWhitespace();
      }
      result = script.charAt(pos + 1) || '';
      pos = prevPos - 1;
      next();
      return result;
    }

    function eatString(endChars) {
      let start = pos;
      while (next()) {
        if (ch === "\\") {
          next();
        } else if (endChars.indexOf(ch) !== -1) {
          break;
        } else if (ch === "\n") {
          break;
        }
      }
      return script.substring(start, pos + 1);
    }

    function peekString(endChar) {
      let prevPos = pos;
      let str = eatString(endChar);
      pos = prevPos - 1;
      next();
      return str;
    }

    function eatWhitespace() {
      let result = '';
      while (whiteRe.test(peek())) {
        next();
        result += ch;
      }
      return result;
    }

    function skipWhitespace() {
      let result = '';
      if (ch && whiteRe.test(ch)) {
        result = ch;
      }
      while (whiteRe.test(next())) {
        result += ch;
      }
      return result;
    }

    function eatComment(singleLine) {
      let start = pos;
      singleLine = peek() === "/";
      next();
      while (next()) {
        if (!singleLine && ch === "*" && peek() === "/") {
          next();
          break;
        } else if (singleLine && ch === "\n") {
          return script.substring(start, pos);
        }
      }
      return script.substring(start, pos) + ch;
    }

    function lookBack(str) {
      return script.substring(pos - str.length, pos).toLowerCase() ===
        str;
    }
    function foundNestedPseudoClass() {
      for (let i = pos + 1; i < script.length; i++) {
        let ch = script.charAt(i);
        if (ch === "{") {
          return true;
        } else if (ch === ";" || ch === "}" || ch === ")") {
          return false;
        }
      }
      return false;
    }
    let basebaseIndentString = script.match(/^[\t ]*/)[0];
    let singleIndent = new Array(indentSize + 1).join(indentCharacter);
    let indentLevel = 0;
    let nestedLevel = 0;

    function indent() {
      indentLevel++;
      basebaseIndentString += singleIndent;
    }

    function outdent() {
      indentLevel--;
      basebaseIndentString = basebaseIndentString.slice(0, -indentSize);
    }

    let print = {};
    print["{"] = function (ch) {
      print.singleSpace();
      output.push(ch);
      print.newLine();
    };
    print["}"] = function (ch) {
      print.newLine();
      output.push(ch);
      print.newLine();
    };

    print.xlastCharWhitespace = function () {
      return whiteRe.test(output[output.length - 1]);
    };

    print.newLine = function (keepWhitespace) {
      if (!keepWhitespace) {
        print.trim();
      }

      if (output.length) {
        output.push('\n');
      }
      if (basebaseIndentString) {
        output.push(basebaseIndentString);
      }
    };
    print.singleSpace = function () {
      if (output.length && !print.xlastCharWhitespace()) {
        output.push(' ');
      }
    };

    print.trim = function () {
      while (print.xlastCharWhitespace()) {
        output.pop();
      }
    };
    let output = [];
    if (basebaseIndentString) {
      output.push(basebaseIndentString);
    }
    let insideRule = false;
    let enteringConditionalGroup = false;
    let topCh = '';
    let lastTopCh = '';

    while (true) {
      let whitespace = skipWhitespace();
      let isAfterSpace = whitespace !== '';
      let isAfterNewline = whitespace.indexOf('\n') !== -1;
      lastTopCh = topCh;
      topCh = ch;

      if (!ch) {
        break;
      } else if (ch === '/' && peek() === '*') {
        print.newLine();
        output.push(eatComment());
        print.newLine();
      } else if (ch === '/' && peek() === '/') {
        if (!isAfterNewline && lastTopCh !== '{') {
          print.trim();
        }
        print.singleSpace();
        output.push(eatComment());
        print.newLine();
      } else if (ch === '@') {
        if (isAfterSpace) {
          print.singleSpace();
        }
        output.push(ch);
        let letiableOrRule = peekString(": ,;{}()[]/='\"").replace(/\s$/, '');
        if (letiableOrRule in nestedRules) {
          nestedLevel += 1;
          if (letiableOrRule in groupRules) {
            enteringConditionalGroup = true;
          }
        } else if (': '.indexOf(letiableOrRule[letiableOrRule.length - 1]) >= 0) {
          next();
          letiableOrRule = eatString(": ").replace(/\s$/, '');
          output.push(letiableOrRule);
          print.singleSpace();
        }
      } else if (ch === '{') {
        if (peek(true) === '}') {
          eatWhitespace();
          next();
          print.singleSpace();
          output.push("{}");
          print.newLine();
          if (newlineBetweenRules && indentLevel === 0) {
            print.newLine(true);
          }
        } else {
          indent();
          print["{"](ch);
          if (enteringConditionalGroup) {
            enteringConditionalGroup = false;
            insideRule = (indentLevel > nestedLevel);
          } else {
            insideRule = (indentLevel >= nestedLevel);
          }
        }
      } else if (ch === '}') {
        outdent();
        print["}"](ch);
        insideRule = false;
        if (nestedLevel) {
          nestedLevel--;
        }
        if (newlineBetweenRules && indentLevel === 0) {
          print.newLine(true);
        }
      } else if (ch === ":") {
        eatWhitespace();
        if ((insideRule || enteringConditionalGroup) &&
          !(lookBack("&") || foundNestedPseudoClass())) {
          output.push(':');
          print.singleSpace();
        } else {
          if (peek() === ":") {
            // Pseudo el
            next();
            output.push("::");
          } else {
            // Pseudo classes
            output.push(':');
          }
        }
      } else if (ch === '"' || ch === "'") {
        if (isAfterSpace) {
          print.singleSpace();
        }
        output.push(eatString(ch));
      } else if (ch === ';') {
        output.push(ch);
        print.newLine();
      } else if (ch === '(') {
        if (lookBack("url")) {
          output.push(ch);
          eatWhitespace();
          if (next()) {
            if (ch !== ')' && ch !== '"' && ch !== "'") {
              output.push(eatString(')'));
            } else {
              pos--;
            }
          }
        } else {
          parenLevel++;
          if (isAfterSpace) {
            print.singleSpace();
          }
          output.push(ch);
          eatWhitespace();
        }
      } else if (ch === ')') {
        output.push(ch);
        parenLevel--;
      } else if (ch === ',') {
        output.push(ch);
        eatWhitespace();
        if (!insideRule && selectorSeparatorNewline && parenLevel < 1) {
          print.newLine();
        } else {
          print.singleSpace();
        }
      } else if (ch === ']') {
        output.push(ch);
      } else if (ch === '[') {
        if (isAfterSpace) {
          print.singleSpace();
        }
        output.push(ch);
      } else if (ch === '=') {
        eatWhitespace()
        ch = '=';
        output.push(ch);
      } else {
        if (isAfterSpace) {
          print.singleSpace();
        }
        output.push(ch);
      }
    }
    let sweetCode = output.join('').replace(/[\r\n\t ]+$/, '');
    if (endWithNewline) {
      sweetCode += "\n";
    }
    return sweetCode;
  }
}
Wb.startLoad();
Wb.load('wb/libs/monaco/min/vs/loader.js', f => {
  require.config({
    paths: { 'vs': 'wb/libs/monaco/min/vs' },
    'vs/nls': {
      availableLanguages: {
        '*': Wb.findLang(['de', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-tw'])
      }
    }
  });
  require(['vs/editor/editor.main'], f => {
    Wb.endLoad();
  });
}, false);