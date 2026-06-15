/**
 * DBE util.
 */
class Util {
  /**
   * Import table data to the specified table. @priv
   */
  static importWbTable() {
    // import rows step by step
    let reader = new java.io.BufferedReader(new java.io.InputStreamReader(new Classes.GZIPInputStream(Params.file.stream), 'utf-8'));

    try {
      this.doInsert(Wb.wrapArray(fn => {
        let line;
        while (line = reader.readLine()) {
          fn(Wb.decode(line));
        }
      }));
    } finally {
      reader.close();
    }
  }
  /**
   * Insert data to the specified table. @priv
   */
  static doInsert(insert) {
    Wb.sync({ db: Params.db, tableName: Params.tableName, insert });
  }
  /**
   * Import Excel data to the specified table. @priv
   */
  static importExcel() {
    let fields, ja = com.wb.office.ExcelSheet.readData(Params.file.stream);

    this.doInsert(Wb.wrapArray(fn => {
      let row, i, j = ja.length(), k, l, values, value, field;

      fields = this.getFields(Wb.getProxy(ja.opt(0)));
      for (i = 1; i < j; i++) {
        values = ja.opt(i);
        l = values.length();
        row = {};
        for (k = 0; k < l; k++) {
          field = fields[k];
          if (field) {
            value = JsonUtil.opt(values, k);
            if (value != null && (!field.isBlob || value != '(blob)'))
              row[field.name] = value;
          }
        }
        fn(row);
      }
    }));
  }
  /**
   * Import txt/csv data to the specified table. @priv
   * @param {String} [type] File format type, defaults to "txt".
   * -'csv': CSV file.
   * -'txt': Text file.
   */
  static importText(type) {
    // import rows step by step
    const tabChar = '\t';
    const readCsvLine = StringUtil.readCsvLine;
    let isCsv, fields, reader = new java.io.BufferedReader(new java.io.InputStreamReader(Params.file.stream));

    isCsv = type?.toLowerCase() == 'csv';
    try {
      this.doInsert(Wb.wrapArray(fn => {
        let line, lines, row, field;

        if (isCsv) {
          fields = Array.from(readCsvLine(reader));
        } else {
          fields = reader.readLine().split(tabChar);
        }
        fields = this.getFields(fields);
        while (line = (isCsv ? readCsvLine(reader) : reader.readLine())) {
          row = {};
          lines = isCsv ? Array.from(line) : lines = line.split(tabChar);
          lines.forEach((value, i) => {
            field = fields[i];
            if (field) {
              if (value && (!field.isBlob || value != '(blob)'))
                row[field.name] = value;
            }
          });
          fn(row);
        }
      }));
    } finally {
      reader.close();
    }
  }
  /** @property {Number} - The max rows that allow returned. */
  static get maxRows() {
    return Math.min(Wb.getInt('maxRows'), 100000);
  }
  /**
   * Get valid fields list.
   * @param {Array} fields The imported first row data.
   * @return {Array} The fields.
   */
  static getFields(fields) {
    let allFields = {}, result = [], fieldName, b1, e1, b2, e2,
      table = Wb.sql({ sql: 'select * from ' + Params.tableName + ' where 1=0', db: Params.db });

    table.columns.forEach(item => {
      fieldName = item.fieldName;
      if (fieldName)
        allFields[fieldName.toLowerCase()] = { name: fieldName, isBlob: item.isBlob ?? false };
    });
    fields.forEach(field => {
      b1 = field.lastIndexOf('(');
      e1 = field.lastIndexOf(')');
      b2 = field.lastIndexOf('（');
      e2 = field.lastIndexOf('）');
      if (b1 > -1 && b1 < e1 || b2 > -1 && b2 < e2) {
        field = b2 > b1 ? field.substring(b2 + 1, e2) : field.substring(b1 + 1, e1);
      }
      field = allFields[field.toLowerCase()];
      if (field)
        result.push(field);
      else
        result.push(false);
    });
    return result;
  }
}
export default Util;