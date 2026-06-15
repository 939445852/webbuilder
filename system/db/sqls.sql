/* Debugging files */
create table wb_debug_files
(
  sid _$varchar$_(13) not null, /* PK */
  user_id _$varchar$_(13) not null, /* user id */
  file_name _$nvarchar$_(250) not null, /* file name */
  status _$numeric$_(1) not null, /* status */
  constraint wb_debug_files_pk primary key(sid) /* PK constraint */
);
create unique index wb_debug_files_unq1 on wb_debug_files(user_id,file_name);

/* User account */
create table wb_user
(
  sid _$varchar$_(13) not null, /* PK */
  user_name _$varchar$_(50) not null, /* user name */
  password _$varchar$_(64) not null, /* password */
  display_name _$nvarchar$_(200) not null, /* display name */
  create_date _$datetime$_ not null, /* create date */
  login_times _$numeric$_(9) not null, /* login times */
  dept_id _$varchar$_(13), /* dept id */
  email _$varchar$_(200), /* email */
  mobile_phone _$varchar$_(20), /* mobile phone */
  use_lang _$varchar$_(20), /* use language */
  last_login _$datetime$_, /* last login */
  status _$numeric$_(1) not null, /* status */
  constraint wb_user_pk primary key(sid) /* PK constraint */
);
create unique index wb_user_user_name on wb_user(user_name);

/* A value store table that stores values less than or equal to 200. */
create table wb_value
(
  sid _$varchar$_(100) not null, /* PK */
  stype _$numeric$_(1) not null, /* type: 0 string, 1 number, 2 date, 3 bool */
  svalue _$nvarchar$_(200) not null, /* string value */
  constraint wb_value_pk primary key(sid) /* PK constraint */
);

/* Resource storage tables, store values of any size. */
create table wb_resource
(
  sid _$varchar$_(100) not null, /* PK */
  stype _$numeric$_(1) not null, /* type: 0 string, 1 object/array, 2 byte array, 3 input stream */
  svalue _$blob$_ not null, /* resource value */
  constraint wb_resource_pk primary key(sid) /* PK constraint */
);

/* Dictionary table. */
create table wb_dict
(
  sid _$varchar$_(13) not null, /* PK */
  name _$nvarchar$_(100) not null, /* item name */
  title _$nvarchar$_(200), /* title */
  alias _$clob$_, /* alias list */
  group_name _$nvarchar$_(100), /* group name */
  group_title _$nvarchar$_(200), /* group title */
  remark _$nvarchar$_(200), /* remark */
  edit_hidden _$numeric$_(1), /* hidden in edit */
  cname _$varchar$_(50), /* controls's cname */
  edit_length _$numeric$_(8), /* edit length */
  edit_scale _$numeric$_(1), /* edit scale */
  edit_height _$varchar$_(30), /* edit height */
  edit_type _$varchar$_(30), /* edit type */
  edit_hint _$nvarchar$_(200), /* edit hint */
  edit_required _$numeric$_(1), /* required */
  edit_readonly _$numeric$_(1), /* readonly */
  edit_colspan _$numeric$_(2), /* colspan */
  edit_fill _$numeric$_(1), /* fill */
  key_name _$nvarchar$_(100), /* key name */
  validate_script _$nclob$_, /* validate script */
  edit_tags _$nclob$_, /* edit tags */
  display_hidden _$numeric$_(1), /* hidden in display */
  display_width _$varchar$_(30), /* display width */
  display_format _$nvarchar$_(100), /* display format */
  display_type _$varchar$_(30), /* display type */
  auto_wrap _$varchar$_(30), /* auto wrap */
  check_box _$varchar$_(30), /* check box */
  render_script _$nclob$_, /* render script */
  column_tags _$nclob$_, /* column tags*/
  constraint wb_dict_pk primary key(sid) /* PK constraint */
);
create index wb_dict_name on wb_dict(name);

/* Key-value type */
create table wb_key_type
(
  sid _$varchar$_(13) not null, /* PK */
  key_name _$nvarchar$_(100) not null, /* key name */
  key_type _$numeric$_(1) not null, /* key type */
  constraint wb_key_type_pk primary key(sid) /* PK constraint */
);
create unique index wb_key_type_key_name on wb_key_type(key_name);

/* Key value list */
create table wb_key
(
  sid _$varchar$_(13) not null, /* PK */
  rid _$varchar$_(13) not null, /* associate to wb_key_type.sid */
  map_k _$nvarchar$_(200) not null, /* key */
  map_v _$nvarchar$_(200) not null, /* value */
  constraint wb_key_pk primary key(sid) /* PK constraint */
);
create unique index wb_key_unq1 on wb_key(rid,map_k);

/* Staff */
create table wb_staff
(
  sid _$varchar$_(13) not null, /* PK */
  code _$varchar$_(5) not null, /* code */
  full_name _$nvarchar$_(50) not null, /* full name */
  user_id _$varchar$_(13) not null, /* user id */
  dept_id _$varchar$_(13) not null, /* dept id */
  birth_date _$datetime$_, /* birth date */
  gender _$numeric$_(1), /* gender */
  height _$numeric$_(3), /* height */
  email _$varchar$_(50), /* email */
  salary _$numeric$_(8,2), /* salary */
  cv _$nclob$_, /* cv */
  photo _$blob$_, /* photo */
  constraint wb_staff_pk primary key(sid) /* PK constraint */
);
create unique index wb_staff_code on wb_staff(code);
create index wb_staff_full_name on wb_staff(full_name);
create index wb_staff_user_id on wb_staff(user_id);
create index wb_staff_dept_id on wb_staff(dept_id);

/* Department */
create table wb_dept
(
  sid _$varchar$_(13) not null, /* PK */
  dept_code _$varchar$_(20) not null, /* dept code */
  dept_name _$nvarchar$_(100) not null, /* dept name */
  parent_id _$varchar$_(13) not null, /* parent id */
  manager_id _$varchar$_(13), /* manager user id */
  status _$numeric$_(1) not null, /* status */
  constraint wb_dept_pk primary key(sid) /* PK constraint */
);
create unique index wb_dept_dept_code on wb_dept(dept_code);

/* Roles */
create table wb_role
(
  sid _$varchar$_(13) not null, /* PK */
  role_name _$nvarchar$_(100) not null, /* role name */
  remark _$nvarchar$_(200), /* remark */
  status _$numeric$_(1) not null, /* status */
  constraint wb_role_pk primary key(sid) /* PK constraint */
);
create unique index wb_role_role_name on wb_role(role_name);

/* User roles */
create table wb_user_role
(
  sid _$varchar$_(13) not null, /* PK */
  user_id _$varchar$_(13) not null, /* user id */
  role_id _$varchar$_(100) not null, /* role id */
  constraint wb_user_role_pk primary key(sid) /* PK constraint */
);
create unique index wb_user_role_unq1 on wb_user_role(user_id,role_id);

/* Permissions */
create table wb_perm
(
  sid _$varchar$_(13) not null, /* PK */
  module_path _$varchar$_(250) not null, /* module path */
  role_id _$varchar$_(100) not null, /* role id */
  constraint wb_perm_pk primary key(sid) /* PK constraint */
);
create index wb_perm_role_id on wb_perm(role_id);
create unique index wb_perm_unq1 on wb_perm(module_path,role_id);

/* Areas */
create table wb_area
(
  sid _$varchar$_(13) not null, /* PK */
  area_name _$nvarchar$_(100) not null, /* area name */
  parent_id _$varchar$_(13) not null, /* parent id */
  constraint wb_area_pk primary key(sid) /* PK constraint */
);
create index wb_area_area_name on wb_area(area_name);

/* Dual table with one record */
create table wb_dual
(
  val _$numeric$_(1) not null /* value */
);

/* chats */
create table wb_chats
(
  sid _$varchar$_(13) not null, /* PK */
  send_date _$datetime$_ not null, /* send date */
  from_user _$varchar$_(13) not null, /* from user id */
  to_user _$varchar$_(13) not null, /* to user id */
  bin_len _$numeric$_(10), /* blog length */
  text_content _$nclob$_, /* text content */
  bin_content _$blob$_, /* blob content */
  constraint wb_chats_pk primary key(sid) /* PK constraint */
);
create index wb_chats_send_date on wb_chats(send_date);
create index wb_chats_from_user on wb_chats(from_user);
create index wb_chats_to_user on wb_chats(to_user);

/* schedule jobs */
create table wb_job
(
  sid _$varchar$_(13) not null, /* PK */
  job_name _$nvarchar$_(250) not null, /* job name */
  interval_type _$numeric$_(1) not null, /* interval, 0:sec, 1:min: 2:hour, 3:day, 4:week, 5:month, 6:year, 7:cron */
  interval_value _$numeric$_(8), /* number of interval */
  trigger_time _$datetime$_, /* trigger time */
  trigger_weekday _$numeric$_(1), /* trigger weekday, 1-7 sun-sat */
  trigger_day _$numeric$_(2), /* trigger day, negative number means reverse. The first date is 1. */
  trigger_month _$numeric$_(2), /* trigger month, the first is 1. */
  cron_express _$varchar$_(250), /* cron express */
  concurrent _$numeric$_(1) not null, /* whether allow concurrent */
  auto_removed _$numeric$_(1) not null, /* auto removed this job when finished */
  begin_date _$datetime$_, /* begin date */
  end_date _$datetime$_, /* end date */
  status _$numeric$_(1) not null, /* job status */
  server_script _$nclob$_, /* serverscript */
  job_desc _$nclob$_, /* Job description */
  constraint wb_job_pk primary key(sid) /* PK constraint */
);
create unique index wb_job_job_name on wb_job(job_name);
/* Workflow instance data */
create table wb_flow
(
  sid _$varchar$_(13) not null, /* PK */
  start_time _$datetime$_ not null, /* start time */
  user_id _$varchar$_(13) not null, /* initiator user id */
  title _$nvarchar$_(250) not null, /* title */
  status _$numeric$_(1) not null, /* status, 0: canceled, 1: in progress, 2: done, 3: rejected */
  node_name _$nvarchar$_(200) not null, /* current node name */
  node_text _$nvarchar$_(200) not null, /* current node text */
  tpl_file _$nvarchar$_(200) not null, /* tpl file path */
  constraint wb_flow_pk primary key(sid) /* PK constraint */
);
create index wb_flow_start_time on wb_flow(start_time);
/* Users involved in the workflow */
create table wb_flow_user
(
  sid _$varchar$_(13) not null, /* PK */
  flow_id _$varchar$_(13) not null, /* workflow id */
  user_id _$varchar$_(13) not null, /* user id */
  accept_time _$datetime$_ not null, /* accept time */
  process_time _$datetime$_, /* process time */
  status _$numeric$_(2) not null, /* 0:unread,1:read,2:done,3:reject,4:back,5:tranfer,6:sign before,7:sign after,8:backed */
  user_type _$numeric$_(1) not null, /* user type, 0: initiator, 1: handle user, 2: cc user */
  after_user _$varchar$_(13), /* after sign user id */
  node_name _$nvarchar$_(200) not null, /* node name */
  node_text _$nvarchar$_(200) not null, /* node text */
  constraint wb_flow_user_pk primary key(sid) /* PK constraint */
);
create index wb_flow_user_flow_id on wb_flow_user(flow_id);
create index wb_flow_user_user_id on wb_flow_user(user_id);
create index wb_flow_user_accept_time on wb_flow_user(accept_time);
/* Reimbursement data */
create table wb_reimburse
(
  sid _$varchar$_(13) not null, /* PK */
  flow_id _$varchar$_(13) not null, /* flow id */
  user_id _$varchar$_(13) not null, /* Applicant user id */
  exp_date _$datetime$_ not null, /* expenditure date */
  item_name _$nvarchar$_(200) not null, /* item name */
  amount _$numeric$_(8,2) not null, /* reimbursement amount */
  constraint wb_reimburse_pk primary key(sid) /* PK constraint */
);
create index wb_reimburse_form_id on wb_reimburse(flow_id);
/* Reimbursement approve opinions */
create table wb_ra_opinions
(
  sid _$varchar$_(13) not null, /* PK */
  reimburse_id _$varchar$_(13) not null, /* reimburse id */
  process_time _$datetime$_ not null, /* process time */
  approver_user_id _$varchar$_(13) not null, /* approver user id */
  node_text _$nvarchar$_(200) not null, /* node text */
  opinions _$nclob$_, /* opinions */
  constraint wb_ra_opinions_pk primary key(sid) /* PK constraint */
);
create index wb_ra_opinions_idx1 on wb_ra_opinions(reimburse_id);
/* Leave application */
create table wb_leave
(
  sid _$varchar$_(13) not null, /* PK */
  begin_date _$datetime$_ not null, /* begin date */
  end_date _$datetime$_ not null, /* end date */
  flow_id _$varchar$_(13) not null, /* flow id */
  user_id  _$varchar$_(13) not null, /* user id */
  leave_days _$numeric$_(5) not null, /* leave days */
  leave_reason _$nvarchar$_(200) not null, /* leave reason */
  constraint wb_leave_pk primary key(sid) /* PK constraint */
);
create index wb_leave_flow_id on wb_leave(flow_id);
/* report demo1 */
create table wb_report_demo1
(
  row_num _$numeric$_(5) not null, /* PK */
  f1 _$nclob$_,
  f2 _$nvarchar$_(200),
  f3 _$numeric$_(8),
  f4 _$numeric$_(8,2),
  f5 _$datetime$_,
  f6 _$numeric$_(8,5),
  f7 _$numeric$_(8),
  f8 _$numeric$_(8),
  f9 _$numeric$_(8),
  f10 _$numeric$_(8),
  constraint wb_report_demo1_pk primary key(row_num) /* PK constraint */
);
/* file version table */
create table wb_version
(
  sid _$varchar$_(13) not null, /* PK */
  sdate _$datetime$_ not null, /* check in date */
  file_path _$nvarchar$_(250) not null, /* file path */
  file_version _$numeric$_(5,2) not null, /* file version */
  version_remark _$nvarchar$_(200), /* version remark */
  modify_date _$datetime$_, /* modify date */
  file_content _$blob$_, /* file content */
  constraint wb_version_pk primary key(sid) /* PK constraint */
);
create index wb_version_file_path on wb_version(file_path);
create index wb_version_file_version on wb_version(file_version);
create index wb_version_sdate on wb_version(sdate);
/* log data */
create table wb_log
(
  sid _$varchar$_(13) not null, /* PK */
  log_date _$datetime$_ not null, /* log date */
  user_id  _$varchar$_(13) not null, /* user id */
  ip _$varchar$_(39) not null, /* ip */
  log_level _$numeric$_(1) not null, /* log level */
  log_type _$nvarchar$_(100) not null, /* log type */
  msg _$nvarchar$_(250) not null, /* log message */
  constraint wb_log_pk primary key(sid) /* PK constraint */
);
create index wb_log_sdate on wb_log(log_date);
/* AI dialog */
create table wb_ai
(
  sid _$varchar$_(13) not null, /* PK */
  sdate _$datetime$_ not null, /* date */
  user_id  _$varchar$_(13) not null, /* user id */
  group_id _$varchar$_(13) not null, /* group id */
  msg_type _$numeric$_(1) not null,  /* msg type: 0:in-msg, 1:in-file, 6:out-msg, 7:out-file */
  is_bin _$numeric$_(1), /* 1 is binary file */
  file_name _$nvarchar$_(250), /* file name */
  file_size _$numeric$_(9), /* file size */
  order_index _$numeric$_(5) not null, /* order index, 99990:(Parse File) */
  msg _$nclob$_, /* message */
  constraint wb_ai_pk primary key(sid) /* PK constraint */
);
create index wb_ai_sdate on wb_ai(sdate);
create index wb_ai_user_id on wb_ai(user_id);
create index wb_ai_group_id on wb_ai(group_id);