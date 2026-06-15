/*
 * WebBuilder file system.
 * @class $path.FileSystem
 */
class FileSystem {
  /** @property {Wb.File} - URL shortcut file. */
  static urlFile = new Wb.File(true, 'wb/system/url.json');
  /** @property {Object} - URL shortcut buffer. */
  static urlBuffer = UrlBuffer.getBuffer();
  /**
   * Gets a list of files in a specified directory that are used for a specific scenario.
   * @param {String} path Folder path, null means to get the displayed root directory list, and an empty string means
   * to get the operating system root directory list.
   * @param {String} type Scenario type:
   * -'ide': IDE file tree.
   * -'home': home page tree.
   * -'perm': perm module tree.
   * -'tree': file tree.
   * -'list': file and folder list, such as list imported files.
   * -'file': file list.
   * -null: for common usage.
   * @param {String} sortType The sorting type, defaults to 'name'.
   * -'name': file name
   * -'size': file size
   * -'type': file type
   * -'date': file last modified date
   * @param {String} sortDesc Whether to sort desc.
   * @param {Boolean} moduleSort Whether the files in the module directory are sorted in the set order,
   * false sorts by alphabetical, true sorts by set order.
   * @param {Boolean} [isTouch] Whether the client is a touch device.
   * @return {Array} The file/directory list that can be displayed.
   */
  static listFiles(path, type, sortType, sortDesc, moduleSort, isTouch) {
    const indexProps = ['icon', 'img', 'tags', 'title'];
    let items = [], userid = Wb.userid, inModuleFolder, inAppFolder, isWbPath, scUrl, title, hasItems, isFile, isRoot, file,
      files, filename, item, appFolderName, modulePath, isAppParentPath, moduleObject, hideInMenu, moduleType, tags, fileObject,
      strTitle, ideMode = type == 'ide', homeMode = type == 'home', fileMode = type == 'file', listMode = type == 'list',
      loginRequired, permMode = type == 'perm', treeMode = type == 'tree', modulePathLen = Base.modulePathLen,
      moduleProps, roles = Wb.roles, isDemo = Config.isDemo;

    sortType ??= 'name';
    if (path) {
      file = new Wb.File(path);
      appFolderName = Wb.File.appFolder.name;
      isAppParentPath = !isDemo && file.equals(Wb.File.appFolder.parent);
      isWbPath = file.equals(Wb.File.wbFolder);
      inModuleFolder = file.inModuleFolder;
      inAppFolder = file.inAppFolder;
      if (inModuleFolder && moduleSort)
        files = this.listModules(file);
      else
        files = file.listFiles(sortType, sortDesc);
    } else {
      if (ideMode && path == null) {
        if (isDemo) {
          Wb.send({
            items: [
              {
                text: Str.module, icon: 'menu1', _expanded: true, path: Base.modulePathText,
                items: this.listFiles(Wb.File.moduleFolder, type, sortType, sortDesc, moduleSort)
              },
              { text: Str.app, icon: 'cubes', path: Base.pathText }
            ]
          });
        } else {
          Wb.send({
            items: [
              {
                text: Str.module, icon: 'menu1', _expanded: true, path: Base.modulePathText,
                items: this.listFiles(Wb.File.moduleFolder, type, sortType, sortDesc, moduleSort)
              },
              { text: Str.app, icon: 'cubes', path: Base.pathText },
              { text: Str.system, icon: 'disk', path: '' }
            ]
          });
        }
        return;
      } else {
        files = Wb.File.listRoots();
        isRoot = true;
      }
    }
    //start traveling
    files?.forEach(file => {
      filename = file.name;
      isFile = file.isFile;
      if (treeMode && file.isFile)
        return;
      if (ideMode || homeMode || permMode) {
        //index.json not displayed
        if (inModuleFolder && isFile && filename == 'index.json')
          return;
      }
      if (ideMode) {
        //The module and app folder are displayed separately
        if ((isAppParentPath && filename == appFolderName || isWbPath && filename == 'modules'))
          return;
      }
      //min file not displayed
      if ((ideMode || homeMode || permMode) && inAppFolder && file.isMinFile)
        return;
      path = file.path;
      item = { text: filename || path, lastModified: file.lastModifiedDate };
      if (isRoot)
        item.isRoot = isRoot;
      if (file.isFile) {
        item._leaf = true;
        item.size = file.length;
        if ((ideMode || homeMode || permMode) && inModuleFolder && filename.endsWith('.xwl')) {
          modulePath = file.modulePath;
          try {
            moduleObject = file.object;
          } catch (e) {
            moduleObject = { icon: 'error', properties: {} };
          }
          moduleProps = moduleObject.properties;
          hideInMenu = Wb.parseBool(moduleObject.hideInMenu);
          loginRequired = moduleObject.loginRequired != 'false';
          if (ideMode && loginRequired && !Perm.permit(modulePath, roles))
            return;
          if (homeMode && isTouch != null) {
            moduleType = moduleProps.moduleType;
            if (moduleType == 'touch' && !isTouch || moduleType == 'desktop' && isTouch)
              return;
          }
          if (homeMode || permMode) {
            if (homeMode && (hideInMenu || loginRequired && !Perm.permit(modulePath, roles)) ||
              permMode && !loginRequired)
              return;
            title = moduleObject.title;
            if (homeMode) {
              if (title?.startsWith('@')) {
                strTitle = title.substr(1);
                title = Str[strTitle];
                item.strTitle = strTitle;
              }
              item.filename = file.name;
            } else {
              title = Wb.optText(title);
              item._checked = false;
              item.remark = moduleProps.remark || undefined;
            }
            item.text = title || file.normalName;
            item._icon = moduleObject.icon || undefined;
            item._img = moduleObject.img || undefined;
            if (!item._icon && !item._img)
              item._icon = 'module';
            tags = moduleObject.tags;
            if (tags)
              item.tags = tags;
          } else {
            Wb.applyValueWith(item, moduleObject, indexProps);
            //set debug status
            if (modulePath && DebugFiles.inDebug(userid, modulePath))
              item.debug = true;
            scUrl = this.findUrl(modulePath);
            if (scUrl)
              item.url = scUrl.substr(1);
            item.hideInMenu = hideInMenu;
          }
        } else if (homeMode || permMode) {
          //not displayed
          return;
        }
      } else {
        hasItems = file.hasItems;
        if (permMode && file.isFolder && !hasItems)
          return;
        if ((ideMode || homeMode || permMode) && inModuleFolder) {
          if (!this.hasVisibleFiles(file, type, roles)) {
            if (ideMode)
              item.items = [];
            else
              return; //not displayed
          }
          fileObject = new Wb.File(file, 'index.json');
          if (fileObject.exists) {
            fileObject = fileObject.object;
            hideInMenu = Wb.parseBool(fileObject.hideInMenu);
            if (homeMode || permMode) {
              if (homeMode && hideInMenu)
                return;
              title = fileObject.title;
              if (homeMode) {
                if (title?.startsWith('@')) {
                  strTitle = title.substr(1);
                  title = Str[strTitle];
                  item.strTitle = strTitle;
                }
                item.filename = file.name;
              } else {
                title = Wb.optText(title);
                item._checked = false;
                item.path = path;
              }
              item.text = title || file.normalName;
              item._icon = fileObject.icon || undefined;
              item._img = fileObject.img || undefined;
            } else {
              Wb.applyValueWith(item, fileObject, indexProps);
              item.hideInMenu = hideInMenu;
            }
          }
        } else {
          if (!fileMode && (!hasItems || (treeMode || listMode) && file.every(item => item.isFile)))
            item.items = [];
        }
        if (!path.endsWith('/'))
          path += '/';
      }
      if (homeMode) {
        item.path = file.isFile ? modulePath.slice(0, -4) : path.slice(modulePathLen, -1);
      } else {
        item.path = path;
      }
      items.push(item);
    });
    return items;
  }
  /**
   * Find the short cut url of the specific path.
   * @param {String} [path] module relative path.
   * @return {String} Short cut url, undefined if not found.
   */
  static findUrl(path) {
    return this.urlBuffer.find((k, v) => v == path)?.[0];
  }
  /**
   * Determines whether there are subfiles or directories in the specified directory that can be displayed. @priv
   * @param {Wb.File} folder Folder file.
   * @param {String} type Scenario type.
   * @param {String[]} roles Role list.
   * @return {Boolean} Returns true if there is at least one visible file.
   */
  static hasVisibleFiles(folder, type, roles) {
    let result = false, moduleObject, modulePath, index;
    switch (type) {
      case 'home':
        folder.cascade(file => {
          if (file.isFolder) {
            index = new Wb.File(file, 'index.json');
            //Hidden directories no longer traverse
            if (index.exists && Wb.parseBool(index.object.hideInMenu))
              return null;
          } else if (file.isModuleFile && !file.isMinFile) {
            modulePath = file.modulePath;
            try {
              moduleObject = file.object;
            } catch (e) {
              result = true;
              return false;
            }
            if (!Wb.parseBool(moduleObject.hideInMenu) &&
              (moduleObject.properties.loginRequired == 'false' || Perm.permit(modulePath, roles))) {
              result = true;
              return false;
            }
          }
        });
        return result;
      case 'perm':
        folder.cascade(file => {
          if (file.isModuleFile && !file.isMinFile) {
            moduleObject = file.object;
            if (moduleObject.properties.loginRequired != 'false') {
              result = true;
              return false;
            }
          }
        });
        return result;
      case 'ide':
        return folder.listFiles().some(file => {
          if (file.isFolder) {
            return true;
          } else {
            if (file.inAppFolder) {
              if (file.isMinFile)
                return false;
              if (file.inModuleFolder) {
                if (file.isModuleFile) {
                  modulePath = file.modulePath;
                  try {
                    moduleObject = file.object;
                  } catch (e) {
                    return true;
                  }
                  return moduleObject.properties.loginRequired == 'false' || Perm.permit(modulePath, roles);
                } else {
                  return file.name != 'index.json';
                }
              } else {
                return true;
              }
            } else {
              return true;
            }
          }
        });
    }
  }
  /**
   * Get a list of all child files/directories in the order defined by the module configuration settings. Returns
   * null if the current file is not a directory. @priv
   * @return {Wb.File[]} Files/directories list.
   */
  static listModules(file) {
    let files = file.file.listFiles();

    if (files) {
      let indexFile = new Wb.File(file, 'index.json');
      FileUtil.sort(files, 'name', false);
      files = files.map(file => new Wb.File(file));
      if (indexFile.exists) {
        let index, sortFiles = [];
        indexFile.object.items.forEach(filename => {
          index = files.findIndex(f => f.name == filename);
          if (index != -1) {
            sortFiles.push(files[index]);
            files.erase(index);
          }
        });
        files = sortFiles.concat(files);
      }
      return files;
    } else
      return null;
  }
  /**
   * Gets the data of the specified file. File data consists of [File Modified date| File Contents].
   * @param {String} path File path.
   * @param {String} [charset] File character. The default is OS based.
   * @param {Boolean} [yamlToJson] Convert yaml to json.
   * @return {String} File data.
   */
  static getFileData(path, charset, yamlToJson) {
    let file;

    if (path.startsWith('|'))
      file = new Wb.File(true, path.substr(1));
    else
      file = new Wb.File(path);
    if (Wb.isImageFile(path))
      return file.base64;
    else {
      let text = file.readString(charset || Base.osCharset);
      if (yamlToJson && file.isModuleFile && !text.trimLeft().startsWith('{'))
        text = JsonUtil.yamlToJsonString(text);
      return file.lastModified + '|' + text;
    }
  }
  /**
   * Save the URL buffer data to the file. @priv
   */
  static saveUrlFile() {
    Wb.checkDemo();
    let object = {}, buffer = this.urlBuffer;
    buffer.forEach((k, v) => k != "/" && (object[k] = v));
    this.urlFile.prettyObject = object;
  }
  /**
   * Adds a file or directory under the specified directory.
   * @param {String} path Parent path.
   * @param {String} filename file/directory name.
   * @param {Boolean} isFolder whether to add folder.
   * @param {String} [url] URL short cut of module file.
   * @param {String} [relName] Before adding to "relName", default or empty means adding to the last.
   * @param {Object} [metaData] Metadata when added to a module folder:
   * -title: file title
   * -icon: file icon
   * -img: file image icon
   * -tags: custom tags
   * -hideInMenu: whether hide in the menu
   * @return {Wb.File} The new file or folder.
   */
  static addFile(path, filename, isFolder, url, relName, metaData) {
    let file, urlFilePath;

    Wb.checkDemo();
    if (url && (urlFilePath = this.urlBuffer['/' + url]) != null)
      Wb.raise(Str.urlSCExists.format(url, urlFilePath));
    file = new Wb.File(path, filename);
    if (isFolder)
      file.createFolder();
    else
      file.createFile();
    if (file.inModuleFolder) {
      file.lock();
      try {
        let indexFile, indexData, index, items;
        //Create files/folder in the module directory and add config data
        if (isFolder) {
          let configFile = new Wb.File(file, 'index.json');
          metaData.items = [];
          configFile.prettyObject = metaData;
        } else {
          if (filename.endsWith('.xwl')) {
            Wb.apply(metaData, {
              text: 'module', cls: 'Wb.Module', properties: { cid: 'module' }
            });
            file.prettyObject = metaData;
            if (Wb.getConfig('sys.app.defaultPermission')) {
              this.addPerm(file.modulePath.slice(0, -4));
            }
          }
        }
        //Adjust the sorting in the parent directory
        indexFile = new Wb.File(file.parent, 'index.json');
        if (!indexFile.exists)
          indexFile.createFile();
        indexFile.lock();
        try {
          indexData = indexFile.object;
          indexData.items ??= [];
          items = indexData.items;
          index = items.indexOf(relName);
          if (index == -1)
            index = items.length;
          items.remove(filename);
          items.insert(index, filename);
          indexFile.prettyObject = indexData;
        } finally {
          indexFile.unlock();
        }
        if (url) {
          this.urlBuffer.put('/' + url, file.modulePath);
          this.saveUrlFile();
        }
      } finally {
        file.unlock();
      }
    }
    return file;
  }
  /**
   * Add current user permission to the specified module.
   * @param {String} path Module path.
   */
  static addPerm(path) {
    if (!Wb.isAdmin) {
      Wb.checkDemo();
      let insert = [], roles = Wb.roles;
      roles = roles.copy();
      roles.remove('default');
      roles.forEach(role => insert.push({ sid: Wb.getId(), module_path: path, role_id: role }));
      Wb.sync({ tableName: 'wb_perm', insert });
      roles.forEach(role => Perm.put(path, role));
    }
  }
  /**
   * Paste the file/directory into the specified directory.
   * @param {String/String[]} source Source files/folders path list.
   * @param {String} dest Dest folder path.
   * @param {String} relName Before adding to "relName", default or empty means adding to the last.
   * @param {Boolean} isCut Whether is cutting mode.
   * @param {String} mode List file scenario.
   * @return {Array} Added root files.
   */
  static pasteFiles(source, dest, relName, isCut, mode) {
    Wb.checkDemo();
    let pasteFile, realFolder, method, indexFile, indexData, items, index, sameFolder, sourceFiles = [],
      destFile = new Wb.File(dest), newFilenames = [], destInModule = destFile.inModuleFolder,
      newFiles = [], moduleList = [], modulePath, firstSource;

    Wb.toArray(source).forEach(file => {
      file = new Wb.File(file);
      firstSource ??= file;
      sourceFiles.push(file);
      if (isCut && !file.parent.equals(destFile) && new Wb.File(destFile, file.name).exists) {
        Wb.raise(Str.alreadyExistsOne.format(file.name));
      }
      if (isCut && file.inModuleFolder && (file.isFolder || file.isModuleFile) && !file.parent.equals(destFile)) {
        modulePath = file.modulePath;
        if (file.isFolder)
          modulePath += '/';
        else
          modulePath = modulePath.slice(0, -4);
        moduleList.push(modulePath);
      }
    });
    sourceFiles.forEach(file => {
      sameFolder = file.parent.equals(destFile);
      if (isCut && sameFolder) {
        pasteFile = file;
      } else {
        pasteFile = new Wb.File(destFile, file.name).uniqueFile;
        method = file.isFile ? 'copyFile' : 'copyDirectory';
        FileUtils[method](file.file, pasteFile.file);
        realFolder = pasteFile.realFile;
        if (realFolder) {
          FileUtils[method](file.file, realFolder);
        }
      }
      newFiles.push(pasteFile);
      newFilenames.push(pasteFile.name);
      if (isCut && file.inModuleFolder) {
        //remove index
        indexFile = new Wb.File(file.parent, 'index.json');
        if (indexFile.exists) {
          indexFile.lock();
          try {
            indexData = indexFile.object;
            if (indexData.items.remove(file.name))
              indexFile.prettyObject = indexData;
          } finally {
            indexFile.unlock();
          }
        }
      }
      if (isCut && !sameFolder) {
        file.clearBuffer();
        file.minFile?.remove();
        file.remove();
      }
    });
    if (destInModule) {
      //add new index
      indexFile = new Wb.File(destFile, 'index.json');
      if (!indexFile.exists)
        indexFile.createFile();
      indexFile.lock();
      try {
        indexData = indexFile.object;
        items = indexData.items ??= [];
        newFilenames.forEach(name => {
          items.remove(name);
        });
        index = items.indexOf(relName);
        if (index == -1)
          index = items.length;
        items.insert(index, ...newFilenames);
        indexFile.prettyObject = indexData;
      } finally {
        indexFile.unlock();
      }
    }
    //update url
    if (isCut) {
      let urlBuffer = this.urlBuffer, newFile, changed, sp, isFile, oldPath;
      sourceFiles.each((file, i) => {
        newFile = newFiles[i];
        if (file.equals(newFile) || !file.inModuleFolder)
          return;
        oldPath = file.modulePath + '/';
        isFile = newFile.isFile;
        sp = isFile ? '' : '/';
        urlBuffer.each((k, v) => {
          if ((v + '/').startsWith(oldPath)) {
            urlBuffer.remove(k);
            if (destInModule)
              urlBuffer.put(k, newFile.modulePath + sp + v.substr(oldPath.length));
            changed = true;
            if (isFile)
              return false;
          }
        });
      });
      if (changed)
        this.saveUrlFile();
      this.permMove(moduleList, destInModule ? destFile.modulePath : null);
    }
    return {
      files: this.listFiles(dest, Params.mode, null, null, true).filter(item => {
        return newFilenames.includes(item.text);
      }), hasFolder: isCut ? firstSource?.parent?.some(f => f.isFolder) : undefined
    };
  }
  /**
   * Remove the specified file or directory.
   * @param {String/String[]} files File/folder list to remove.
   */
  static removeFiles(files) {
    Wb.checkDemo();
    let indexData, indexFile, url, urlChanged, inModuleFolder, modulePath, moduleFiles = [], urlBuffer = this.urlBuffer;

    files = Wb.toArray(files);
    files.forEach(file => {
      file = new Wb.File(file);
      if (!file.exists)
        return;
      inModuleFolder = file.inModuleFolder;
      if (inModuleFolder && (file.isFolder || file.isModuleFile)) {
        modulePath = file.modulePath;
        if (file.isFolder)
          modulePath += '/';
        else
          modulePath = modulePath.slice(0, -4);
        moduleFiles.push(modulePath);
      }
      //Clear buffer
      if (file.inAppFolder) {
        file.cascadeSelf(file => {
          if (file.isFile) {
            file.clearBuffer();
          }
        });
      }
      if (inModuleFolder) {
        //Remove url shortcut
        file.cascadeSelf(file => {
          if (file.isModuleFile) {
            url = this.findUrl(file.modulePath);
            if (url) {
              urlBuffer.remove(url);
              urlChanged ??= true;
            }
          }
        });
        if (urlChanged)
          this.saveUrlFile();
      }
      file.minFile?.remove();
      file.remove();
      if (inModuleFolder) {
        let parentPath = file.parent;
        //Clear invalid index items
        indexFile = new Wb.File(parentPath, 'index.json');
        if (indexFile.exists) {
          let indexItems;
          indexFile.lock();
          try {
            indexData = indexFile.object;
            indexItems = indexData.items;
            indexItems.each(item => {
              if (!new Wb.File(parentPath, item).exists)
                indexItems.remove(item);
            }, true, true);
            indexFile.prettyObject = indexData;
          } finally {
            indexFile.unlock();
          }
        }
      }
    });
    this.permMove(moduleFiles);
  }
  /**
   * Saves file text. Saved text in the following format:
   * fileName|charset|lastModified|length|content...
   * @param {String} data File text.
   * @param {Boolean} [confirm] Whether to throw confirm exception if the file does not exist or has been modified.
   * @return {Array} An array of the last modified date of the saved files.
   */
  static saveFile(data, confirm) {
    Wb.checkDemo();
    if (!data)
      return [];
    let file, path, charset, lastModified, length, content, divPos, result,
      pos = 0, totalLength = data.length, saveFiles = [], modifiedFiles = [];

    while (pos < totalLength) {
      divPos = data.indexOf('|', pos);
      path = data.substring(pos, divPos);
      pos = divPos + 1;
      divPos = data.indexOf('|', pos);
      charset = data.substring(pos, divPos);
      pos = divPos + 1;
      divPos = data.indexOf('|', pos);
      lastModified = parseInt(data.substring(pos, divPos));
      pos = divPos + 1;
      divPos = data.indexOf('|', pos);
      length = parseInt(data.substring(pos, divPos));
      divPos++;
      content = data.substr(divPos, length);
      pos = divPos + length;
      file = new Wb.File(path);
      if (confirm && file.lastModified !== lastModified)
        modifiedFiles.push(file.name);
      saveFiles.push({ file, content, charset });
    }
    if (modifiedFiles.length)
      Wb.raise(Wb.encode(modifiedFiles), 'modified');
    result = [];
    saveFiles.forEach(item => {
      file = item.file;
      if (file.inModuleFolder && file.isModuleFile && file.exists) {
        file.prettyObject = Wb.File.yamlToObject(item.content);
      }
      else {
        file.writeString(item.content, item.charset);
      }
      file.clearBuffer();
      result.push(file.lastModified);
    });
    return result;
  }
  /**
   * Gets the properties of the specified file.
   * @param {String} path File/directory path.
   * @return {Object} File attributes object.
   */
  static getFileProperty(path) {
    let sizeBt = 0, folderCt = 0, fileCt = 0, moduleCt = 0, data, fileObject,
      file = new Wb.File(path), filename = file.name;

    if (file.inAppFolder) {
      //total file
      file.cascadeSelf(f => {
        if (f.isFile) {
          sizeBt += f.length;
          fileCt++;
          if (f.name.endsWith('.xwl'))
            moduleCt++;
        } else {
          folderCt++;
        }
      });
    } else {
      sizeBt = file.length;
    }
    data = { filename, modifiedTime: file.lastModifiedDate, sizeBt, folderCt, fileCt, moduleCt };
    if (file.inModuleFolder) {
      if (file.isFile) {
        if (filename.endsWith('.xwl')) {
          path = file.modulePath;
          fileObject = file.object;
          data.fullUrl = Wb.getModuleUrl(path);
          let url = this.findUrl(path);
          if (url)
            data.url = url.substr(1);
        }
      } else {
        fileObject = new Wb.File(file, 'index.json');
        fileObject = fileObject.exists ? fileObject.object : null;
      }
      if (fileObject) {
        Wb.applyValueWith(data, fileObject, ['icon', 'img', 'tags', 'title']);
        data.hideInMenu = Wb.parseBool(fileObject.hideInMenu);
      }
    }
    return data;
  }
  /**
   * Sets the properties of the specified file.
   * @param {String} path File/directory path.
   * @param {String} filename File name
   * @param {String} title File title. Valid within the module directory. false means to change only the file name.
   * @param {String} icon File icon. Valid within the module directory.
   * @param {String} img File image icon. Valid within the module directory.
   * @param {String} tags custom tags. Valid within the module directory.
   * @param {String} url URL short cut. Valid within the module directory.
   * @param {String} hideInMenu Hide in the menu. Valid within the module directory.
   * @return {Wb.File} The changed new file.
   */
  static setFileProperty(path, filename, title, icon, img, tags, url, hideInMenu) {
    Wb.checkDemo();
    let file = new Wb.File(path), isFolder = file.isFolder, urlChanged, indexObject, indexFile, urlFilePath,
      modulePath = file.modulePath, urlBuffer = this.urlBuffer, inModuleFolder = file.inModuleFolder, renamed, isXwl;

    //check url
    if (url && (urlFilePath = urlBuffer['/' + url]) != null && urlFilePath != modulePath)
      Wb.raise(Str.urlSCExists.format(url, urlFilePath));
    isXwl = path.endsWith('.xwl');
    if (title !== false && inModuleFolder) {
      //update icon and index
      if (isFolder) {
        indexFile = new Wb.File(file, 'index.json');
      } else if (isXwl)
        indexFile = file;
      if (indexFile) {
        indexFile.lock();
        try {
          if (!indexFile.exists)
            indexFile.createFile();
          indexObject = indexFile.object;
          indexObject.items ??= [];
          Wb.applyValue(indexObject, { title, icon, img, tags, hideInMenu });
          indexFile.prettyObject = indexObject;
        } finally {
          indexFile.unlock();
        }
      }
      if (!isFolder && isXwl) {
        //clear buffer and update url of XWL
        file.clearBuffer();
        let oldUrl = this.findUrl(modulePath) || '';

        url ||= '';
        if (url)
          url = '/' + url;
        if (oldUrl != url) {
          if (oldUrl)
            urlBuffer.remove(oldUrl);
          if (url)
            urlBuffer.put(url, modulePath);
          urlChanged = true;
        }
      }
    }
    renamed = file.name != filename;
    if (renamed) {
      //The current file and all child files need to be cleared of the buffer
      let oldFilename, indexItems, indexPos, oldPath, oldPathLen, modulePathSlash;

      oldFilename = file.name;
      if (inModuleFolder) {
        oldPath = modulePath + '/';
        oldPathLen = oldPath.length;
      }
      if (file.inAppFolder) {
        file.cascadeSelf(file => {
          if (file.isFile) {
            file.clearBuffer();
          }
        });
      }
      //rename
      file.minFile?.remove();
      file.name = filename;
      if (inModuleFolder) {
        //update index in parent file
        indexFile = new Wb.File(file.parent, 'index.json');
        indexFile.lock();
        try {
          indexObject = indexFile.object;
          indexItems = indexObject.items;
          indexPos = indexItems.indexOf(oldFilename);
          if (indexPos != -1)
            indexItems[indexPos] = filename;
          indexFile.prettyObject = indexObject;
        } finally {
          indexFile.unlock();
        }
        //create renamed file and clear buffer
        file = new Wb.File(file.parent, filename);
        //update URL
        modulePathSlash = file.modulePath;
        if (isFolder)
          modulePathSlash += '/';
        urlBuffer.forEach((k, v) => {
          if ((v + '/').startsWith(oldPath)) {
            urlBuffer.put(k, modulePathSlash + v.substr(oldPathLen));
            urlChanged = true;
          }
        });
      }
    }
    if (urlChanged)
      this.saveUrlFile();
    if (renamed && file.inModuleFolder && (file.isFolder || isXwl)) {
      let newPath = file.parent.modulePath;
      if (newPath)
        newPath += '/';
      newPath += filename;
      this.permRename(modulePath, newPath, file.isFolder);
    }
    return file;
  }
  /**
   * Recursively scans the module files in the specified directory and obtains the module list data. @priv
   * @param {Wb.File} path Folder path.
   * @return {Array} Module list.
   */
  static scanPermFolder(path) {
    let files, fileName, isFile, items, item, xwl, me = this, len = Base.modulePathLen,
      roles = Wb.roles, isAdmin = Wb.isAdmin;

    items = [];
    files = me.listModules(path);
    files.forEach(file => {
      isFile = file.isFile;
      fileName = file.name;
      if (!isFile || fileName.endsWith('.xwl') && !fileName.endsWith('.min.xwl')) {
        if (isFile) {
          xwl = file.object;
          if (xwl.properties.loginRequired == 'false' || !isAdmin && !Perm.permit(file.modulePath, roles))
            return;
          item = {};
          item.path = file.path.slice(len, -4);
          item.remark = xwl.properties.remark;
          item._leaf = true;
        } else {
          item = {};
          item.items = me.scanPermFolder(file);
          if (!item.items.length)
            return;
          file = new Wb.File(file, 'index.json');
          xwl = file.exists ? file.object : {};
        }
        item._icon = xwl.icon || undefined;
        item._img = xwl.img || undefined;
        item.text = Wb.optText(xwl.title) || fileName;
        if (xwl.title)
          item.remark = item.remark ? (fileName + ' ' + item.remark) : fileName;
        items.push(item);
      }
    });
    return items;
  }
  /**
   * Gets the list of modules used for the permission setting module.
   * @return {Array} Module list data.
   */
  static listPermModules() {
    return this.scanPermFolder(Wb.File.moduleFolder);
  }
  /**
   * Update the module file path in the permissions table and buffer when move a file or directory. @priv
   * @param {String[]} oldPaths Old path list
   * @param {String} [newPath] New path, default means to remove.
   */
  static permMove(oldPaths, newPath) {
    Wb.checkDemo();
    let recs, update = [], del = [], modulePath, new_path, isFolder, len, isUpdate = newPath != null;

    if (newPath)
      newPath += '/';
    recs = Wb.getAllRecords('select module_path from wb_perm');
    recs.forEach(rec => {
      modulePath = rec[0];
      oldPaths.each(path => {
        isFolder = path.endsWith('/');
        if (isFolder && modulePath.startsWith(path) || path == modulePath) {
          if (isUpdate) {
            if (isFolder)
              path = path.slice(0, -1);
            if (path.includes('/'))
              len = path.beforeItem('/').length;
            else
              len = -1;
            new_path = newPath + modulePath.substr(len + 1);
            update.push({ new_path, module_path: modulePath });
          } else
            del.push({ module_path: modulePath });
          return false;
        }
      });
    });
    Wb.startTrans();
    if (isUpdate) {
      Wb.sql({ sql: 'update wb_perm set module_path={?new_path?} where module_path={?module_path?}', params: update });
      this.permBufMove(update);
    } else {
      Wb.sql({ sql: 'delete from wb_perm where module_path={?module_path?}', params: del });
      this.permBufMove(del, true);
    }
  }
  /**
   * Update the module file path in the permissions table and cache when you rename a file or directory. @priv
   * @param {String} oldPath Old path.
   * @param {String} newPath New path.
   * @param {Boolean} isFolder Whether is folder.
   */
  static permRename(oldPath, newPath, isFolder) {
    Wb.checkDemo();
    let rows;
    Wb.startTrans();
    if (isFolder) {
      oldPath += '/';
      newPath += '/';
    } else {
      oldPath = oldPath.slice(0, -4);
      if (!newPath.endsWith('.xwl')) {
        //no xwl file
        Wb.set({ oldPath });
        Wb.sql('delete from wb_perm where module_path={?oldPath?}');
        this.permBufRename(oldPath + '|');
        return;
      } else {
        newPath = newPath.slice(0, -4);
      }
    }
    Wb.set({ path: isFolder ? (oldPath + '%') : oldPath });
    rows = Wb.getAllRows('select module_path from wb_perm where module_path ' + (isFolder ? 'like' : '=') + ' {?path?}');
    rows.forEach(row => {
      row.new_path = row.module_path.replace(oldPath, newPath);
    });
    Wb.sql({ sql: 'update wb_perm set module_path={?new_path?} where module_path={?module_path?}', params: rows });
    if (!isFolder) {
      oldPath += '|';
      newPath += '|';
    }
    this.permBufRename(oldPath, newPath);
  }
  /**
   * Updates the permission cache for the specified path when moving. @priv
   * @param {Array} paths A list of old and new path objects.
   * @param {Boolean} [isRemove] Whether to delete only.
   */
  static permBufMove(paths, isRemove) {
    Wb.checkDemo();
    let buffer = Perm.buffer, newKey, keys = [], modulePath;

    buffer.forEach(k => keys.push(k));
    keys.forEach(k => {
      paths.each(path => {
        modulePath = path.module_path;
        if (k.startsWith(modulePath + '|')) {
          buffer.remove(k);
          if (!isRemove) {
            newKey = k.replace(modulePath, path.new_path);
            buffer.put(newKey, true);
          }
        }
      });
    });
  }
  /**
   * Updates the permission buffer information for the specified path when renaming. @priv
   * @param {String} oldPath The old path.
   * @param {String} newPath The new path. By default, only the buffer is deleted.
   */
  static permBufRename(oldPath, newPath) {
    Wb.checkDemo();
    let buffer = Perm.buffer, newKey, keys = [];

    buffer.forEach(k => {
      if (k.startsWith(oldPath))
        keys.push(k);
    });
    keys.forEach(key => {
      buffer.remove(key);
      if (newPath) {
        newKey = key.replace(oldPath, newPath);
        buffer.put(newKey, true);
      }
    });
  }
};
export default FileSystem;