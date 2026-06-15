Generate using the knowledge base below
#About WebBuilder & XWL
WebBuilder is RAD platform, XWL is WebBuilder module (YAML tree)
Example:
cls: Wb.Module
title: Demo
properties:
  cid: module
events:
  initialize: "fn();"
items:
- cls: Wb.Viewport
  properties:
    cid: viewport1
#Description rules
Format:FullClassName|ShortName@ExtendsClass(description):props{},methods{},events{}
FullClassName=Full class name
ShortName=Short class name also called cname, used in API, eg:add({cname:ShortName})
ExtendsClass=Extends class cname
name:(desc)=property description
name(param)=function parameter only
name(param:(param desc)):(function desc)=function description with parameter
[param]=optional parameter
client side=Browser JS
server side=Java GraalVM JS
#Client side classes
Wb.Module|module:props{links:(JS|CSS url array stringify;MUST use relative path starting with "./"),serverScript:(Java GraalVM JS,NEVER in events)},events{initialize:(Module-globals script at page top, runs first),finalize:(Module-globals script at page bottom, runs last)}
Wb.Array|array(For array props)
Wb.Column|column:props{cid:(must end with Col suffix,e.g. xxxCol),align,text,rowNum:(true=show row number),expander:(true=show expander in tree only),fieldName,width:(default 10em,-1=flex),minWidth,render(value,data,column,el):(return text; if set HTML or add DOM to el, NO return)}
Wb.Component|component:props{cid,cls:(CSS class),autoScroll,alignSelf:(CSS align-self),justifySelf:(CSS justify-self),style,html,flex,frame,visible,disabled,padding,margin,gridColumn:(CSS grid-column),gridRow:(CSS grid-row),isProperty:(true as property not a child component)},methods:{addHeader(comps,[el]):(add inner component to start),addFooter(comps,[el]),destroy,down(cid|fn(comp)),cascade(fn(comp)),up(cid|fn(comp)),bubble(fn(comp)),find(cid|fn(comp)),filter(fn(comp)),on(eventName,fn):(add event to component),un(eventName,fn):(remove event from component),mon(eventName,fn(e)):(add DOM listener to current component element),mon(el,eventName,fn(e)):(add DOM listener to el),mun(eventName,fn):(remove listener from component element),mun(el,eventName,fn):(remove listener from el)},events{init(configs),ready(configs),click(e),destroy}
Wb.ShadowDom|shadowDom:props{html:complete HTML with JS|CSS links}
Wb.Container|container@component:props{layout:(fit|row|column|grid(auto horizontal tile)|grid1-grid20(1-20 cols)),align:(CSS align-items),justify:(CSS justify-content),gap},methods:{add(comp|comps),insert(index,comp|comps),insertAfter(comp|comps,refComp),insertBefore(comp|comps,refComp),destroyAll},events{buttonclick(button,e):(direct child buttons click)}
Wb.Panel|panel@container(has title & border):props{title,icon,tbar,bbar}
Wb.Viewport|viewport@panel(viewport fullscreen)
Wb.Window|window@panel:props{modal,dialog:(modal window with ok|cancel buttons),resetDialog:(auto reset values after hide),clearDialog:(auto clear values after hide),closeAction:(hide|destroy,default hide),visible:(default false)},methods{show,hide},events{ok:(click OK if any dialog mode),beforeok}
Wb.Toolbar|toolbar@container(default layout:row)
Wb.ViewItem|viewItem@container(children of Wb.View):props{data,selected},methods{get(fieldName),set(fieldName,value),update(data),select([keepExisting],[suppressEvent],[preventFocus],[preventScroll]),deselect([suppressEvent])}
Wb.View|view@panel:props{autoLoad:(default true),url,data:array,selectColor:(active|hover|select|none),pagingBar:(true|false|top|pageNums),selection:(Wb.ViewItem),selectionData,selections:([Wb.ViewItem]),selectionsData,itemTpl:(html tpl {field}),itemTplFn(data,el):(function tpl)},methods{addData(data),insertData(index,data),insertDataBefore(data,[viewItem]),insertDataAfter(data,[viewItem]),load(configs):(See Wb.ajax configs),reload(configs):(See Wb.ajax configs),delRecords([noFocus]):(only remove frontend selected rows,NO AJAX,NOT delete server data)},events{beforeload(configs,params),success(parent,items,response,xhr,e),itemdblclick(item,e),beforeselect(item),select(item),deselect(item),selectionchange()}
Wb.Grid|grid@view:props{editable,columns:([Wb.Column]),layout:(must exclude),pagingBar:(default true)},methods{startEdit(row,col,callback,doCancel),verify(noFocus)},events{beforeedit(row,column,configs),edit(value,row,column),editing(row,column)}
Wb.Tree|tree@grid:props{textField:(node text property)},methods{loadSelect([field],[success]):(reload and select last node)},events{beforecheckchange(node,checked),checkchange(node,checked)}
Wb.ListView|listView@view:props{viewType:(smallList|list|smallIcon|mediumIcon|bigIcon)}
Wb.CheckView|checkView@view:props{value}
Wb.Menu|menu@container
Wb.Button|button@component(default CSS class:w-btn):props{text,icon,tip,menu:Wb.Menu},events{click(e)}
Wb.SplitButton|splitButton@button:props{menu:Wb.Menu}
Wb.Item|item@button(menu|tool item, only allowed within menu and toolbar)
Wb.Control|control@component:props{text:(text label),required,value},methods{clear,reset}
Wb.Text|text@control:props{isValid,maxLength,minLength,password,placeholder,readonly,regex:(validate,JS regex literal),regexText:(prompt message for regex),valueType:(alpha|alphaNum|identifier|identifierDot|mark|email|filename|url|uri|express)},methods{focus([preventScroll],[selectText],[delay])}
Wb.Number|number@text(input number only):props{maxValue,minValue,decimalCount,intCount}
Wb.TextArea|textArea@text:props{autoResize,noWrap,tabAsInput}
Wb.Trigger|trigger@text:props{editable,triggerIcon,triggers:([Wb.Item])},events{triggerclick(e)}
Wb.Picker|picker@trigger:props{expanded,picker,pickerConfig},events{collapse,expand,beforecollapse,beforeexpand}
Wb.Select|select@picker:props{autoLoad,bindField:(field for Wb.getValue|setValue,single value mapping),data,forceSelect:(Force select item or empty),keyName,multiSelect,textField,valueField,url,useTag:(select item tag button),valueMap:(field mapping for Wb.getValue|setValue,sets useTag=true),treePicker,itemTpl:(html tpl {field})},events{beforeload(configs,params),beforequery(value),beforeselect(data,item,e),select(data,item,e)}
Wb.Date|date@picker:props{minValue,maxValue},events{select(date)}
Wb.Time|time@date
Wb.Datetime|datetime@date
Wb.YearMonth|yearMonth@date
Wb.FileInput|fileInput@trigger:props{accept:(such as '.xls,.xlsx'),browseMode:(true for preview image),directory,multiple},events{change(files,oldFiles)}
Wb.Check|check@control:props{label:(suffix label),returnType:(int|string|bool(default))},events{change(value,oldValue)}
Wb.Radio|radio@check:props{group}
Wb.ControlCt|controlCt@control(like Wb.Container):props{container:(Wb.Container part),layout}
Wb.CheckGroup|checkGroup@controlCt:events{change}
Wb.RadioGroup|radioGroup@controlCt:events{change}
Wb.Slider|slider@control:props{maxValue,minValue,prefix,suffix,step,vertical},events{change(value,oldValue),startdrag(value),enddrag(value)}
Wb.Toggle|toggle@slider
Wb.Splitter|splitter@component(splits sibling components):props{enterShowTarget}
Wb.CardCt|cardCt@panel(cards container):props{activeCard,activeIndex},events{cardchange(newCard,oldCard)}
Wb.Card|card@container(tab card,NOT support tbar|bbar):props{cardVisible,closable,icon,title,tabTip},methods:{show}
Wb.Tab|tab@cardCt(Wb.Card container):props{activeCard,activeIndex},events{cardchange(newCard,oldCard)}
Wb.Fieldset|fieldSet@container:props{collapsed,collapsible,title}
Wb.Line|line@component:props{dashed,title,dimTitle,icon}
Wb.Title|title@component(title with left marker bar and dividing line by default):props{line,marker,title,icon}
Wb.Divider|divider@component(add divider line)
Wb.Space|space@component(add transparent space)
Wb.Fill|fill@component(fill remaining space,flex=1)
Wb.Gap|gap@component(add space with background color)
Wb.Label|label@component:props{href,target,textAlign,titleType:(title1-title5, 1.9em to 0.8em)}
Wb.Breadcrumb|breadcrumb@component:props{items:(['text',{text}])},events{itemclick(item,index,e)}
Wb.Socket|socket(Web Socket):props{name:(Used by Wb.send),xwl:(executed when server receives messages)(data,event:(message|close|open|error),session,httpSession)},methods{send(data)},events{message(e),open(e),close(e),error(e),failure(e)}
Wb.Xwl|xwl(Embedded XWL):props{container:(Wb.Container for XWL),params:(parentParams for embedded XWL),path,ready(scope:(XWL app),container)}
Wb.DisplayField|displayField@control:props{icon}
Wb.ScrolledCt|scrolledCt@container(scrollable container for overflow):props{vertical}
Wb.Color|color@picker
Wb.ColorSelect|colorSelect@select
Wb.Carousel|carousel@container:props{interval:(in ms)}
Wb.ProgressBar|progressBar@component:props{progressText,showPercent,value:(0-100)}
Wb.DualBox|dualBox@panel:props{autoLoad:(default true),sourceData,destData,textField,subtextField,sourceUrl,destUrl,searchBar:(visible),searchName:(Defaults to search),sourceGridConfigs:(Wb.Grid),destGridConfigs:(Wb.Grid),gridHeader,value:(dest grid data),columns:([Wb.Column])},methods{acceptMove},events{beforemove(items,include)}
Wb.CodeEditor|codeEditor@control(Monaco editor wrapper):props{cursor,editorConfigs,editor:(Monaco editor instance),language,lineNumbers,minimap,readonly,validator(value)},events{change(text)}
Wb.HtmlEditor|htmlEditor@control(Quill editor wrapper):props{editorConfigs,editor:(Quill editor instance),readonly,textValue,toolbar:(visible)},events{change(delta,oldDelta,source)}
Wb.Iframe|iframe@component(iframe wrapper):props{name,src,el:(iframe DOM)}
Wb.Image|image@component(show scales image):props{src:(CSS background-image),clickPreview,position:(CSS background-position),repeat:(CSS background-repeat),size:(CSS background-size)}
Wb.Picture|picture@component(image wrapper):props{src,clickPreview,el:(image DOM)}
Wb.Video|video@component(video wrapper):props{src,autoplay,loop,muted,el:(video DOM)}
Wb.Icon|icon@component:props{icon,iconColor,iconSize,spin}
Wb.Chart|chart@component(echarts wrapper):props{option:(echart options),url:(remote options),instance:(echart instance)}
Wb.Graph|graph@component(X6 wrapper):props{data,graphConfigs,instance:(X6 instance)}
Wb.Dialog|dialog@window(Animated full-screen dialog with back button)
Wb.Drawer|drawer@window:props{dockPosition:(top|right|bottom|left)}
Wb.SlotView|slotView@view(Slot item):props{topTitle,textField,valueField}
Wb.Slot|slot@panel(Wb.SlotView container):props{data:([{text,value}]),value:(slotviews selected value array)}
Wb.Option|option@component:props{icon,flagIcon,description,options,optionsTitle,labelWidth,text,value,valueText,editor:(inner Wb.Control)},events{click(e),change(value, oldValue)}
#Server side classes
Wb.File|file(java file wrapper):props{file:(java File),text:(text data),object:(Object|Array data),base64:(base64 data),bytes:(byte[] data),exists,isFile,name,path,lastModified,length,stream:(InputStream)},methods:{lock,unlock,each,cascade,clearBuffer:(clear XWL|JS|MJS buffer),createFile([silent]),createFolder([createParents],[silent]),remove([silent])}
Wb.Connection|connection(java.sql.Connection wrapper):props{connection:(jdbc connection),name:(data source name)}
#Client|Server side usage
App may consist of JS,MJS,CSS,XWL and other files
Wb.encode=JSON.stringify
Wb.decode=JSON.parse
Wb.apply=Object.assign
JSDoc @param format: {type} name description,NO HYPHEN; use @return {Type} desc; Capitalized types only,no lowercase
Common code:Extract to .js files. Define global class via Cls['FullClassName']=class shortName extends Wb.Base{} for global reference
Server var:Wb.set('k',Wb.encode(v));Client get:x=_$k$_;
JS use ES14+ syntax
JS/CSS code MUST be multi-line formatted with 2-space indentation and single spaces inside curly braces
MUST add detailed JSDoc comments for all generated code and key logic
#Client side usage
Define module-globals in initialize event:Wb.apply(app,{prop,method(){}})
Ajax request:Wb.ajax({url,mask:(default true),params,method,data:(payload type,use either params or data,NOT both),comps:(submit component instance or array),success(resp,xhr,e),failure(resp,xhr,e),callback(resp,xhr,e):(xhr.ok success)})
Promise of Wb.Ajax:Wb.fetch({url}).then(result=>{if(result.ok){v=result.response}})
Run XWL:Wb.run({url,params,success(scope):(scope is app),failure(scope)}); Wb.run({url:'m?xwl=f',success(scope){app.ct.add(scope.vp)}})
Open XWL in home page tab,same as Wb.run:Wb.open({url});
All JS statements MUST end with a semicolon
Add comps to panel:panel.add({cname:'container',items:{cname:'text',events:{change(){}}}});
Add comps as inner comp to panel header:panel.addHeader({cname:'text'});
Top center slide toast:Wb.tip|tipSucc|tipWarn|tipError(msg,isHtml,callback)
Center fade in toast:Wb.toast|toastSucc|toastWarn|toastError(msg,isHtml,callback)
Info dialog:Wb.info|succ|warn|error(msg,callback,isHtml)
Confirm dialog:Wb.confirm(msg,onOkFn,onCancelFn,isHtml);
Choice dialog:Wb.choose(msg,cb(button:(yes|no|cancel)),isHtml)
Reset value to origin:Wb.reset(comp|comps);
Clear value:Wb.clear(comp|comps)
If UI components lack,use Wb.View:itemTpl for simple,itemTplFn for complex logic
Simple Wb.View (direct {field}):{url,layout:'column',itemTpl:'<div class="icon-{name}">{text}</div>'}
Complex Wb.View (logic & el):{itemTplFn:'return "<div>"+Wb.toHTML(el.containsCls("cls")?data.field1:data.field2)+"</div>"'}
Complex native HTML/CSS: use component html property
Complex full HTML: use shadowDom html property, example: React UI library; shadow JS: expose.value=data; parentApp.xxx(); expose|parentApp is passed PREDEFINED var; main JS: shadowComp.shadowRoot.querySelector('#id'); shadowComp.expose.value;
Add Wb.Splitter between components in column|row layout containers
DO not set padding|gap on Wb.Viewport
If cid is duplicated,reference component via parent container:app.container1.down('cid')
Open file dialog to select files:Wb.selectFile|selectFiles(file=>Wb.tip(file.name),'image/*')
Prompt dialog:win=Wb.prompt('Dialog',[{text:'Name',cid:'name'}],(values,win)=>win.close())
Add DOM listeners in ready event
Wb.Window dialog|resetDialog|clearDialog (choose one) mode auto verify values, DO NOT verify in OK event
Use visible property only,NEVER use hidden property
Set appropriate gap|padding to column|row layout 
Component default values:textField=text,valueField=value,subTextField=subtext
Set value:Wb.setValue(comp|comps,values,[clearIfUndefined]);Wb.setValue(comp,{cid:value})
Get value object {sid:value}:Wb.getValue(comp|comps,[noEmptyValue])
Set module links property for import js|css url
Access component props|methods:comp.propName;comp.method();NEVER use .properties to access
DO NOT assign component values in initialize; only function definitions allowed. Place value assignments in finalize or viewport ready event
NO extra redundant container|panel wrapper
Separate toolbar items group with Wb.Divider
Toolbar|tbar|bbar:MUST use Wb.Item (NOT Wb.Button) as child, otherwise use Wb.Button
add inner tbar|bbar to Wb.Viewport:add Wb.Toolbar{isProperty:true,cid:tbar|bbar}
Fire event:comp.fireEvent(eventName,...args)
Live search:In Wb.Text change event,call grid.delayLoad({comps:app.search})
Grid columns: set width:-1 for auto adaptive,with optional minWidth
Wb.View|Wb.Grid when paging will auto send _from(0 based),_to,_size params
Edit|Delete record:must pass non-visible component values (PK),not user input
CRUD use unified edit logic for Wb.View itemdblclick event
Access components as app[cid]:app.comp1.value=xxx
CSS: use em unit,external file,no inline style,NO w- prefix,NO global CSS(*, body, html)
If beforeLoad event is set,set autoLoad=false and call comp.load() in finalize or viewport ready event
TextArea|Container prefer fill remaining space
Clear in component destroy event:clearInterval(app.xxxId);clearTimeout(app.xxxId)
Layout grid|grid1-grid20 has built-in padding:1.5em and gap:1.5em
Set window width 40em for layout grid1,60em for layout grid2
Use view.delRecords() for best UX,NO reload view after delete
Check|Radio:use label(suffix) prior to text(prefix)
Wb.getValue|setValue|clear|reset:use container,not multiple fields
Available icons:cut,copy,paste,property,add,edit,delete,search,alarm,begin,end,left,right,up,down,bolt,cart,chart-bar,comment2,data,download,upload,detail,play,stop,file,zoomin,zoomout,wrench,gear,user2,undo,redo,refresh,thumb,thumb1,security,server,ok,cancel,cube,model,order,form
Only use icons in the above list, DO NOT set any icons not included
#Server side usage
serverScript:function main(){}main()
Send content to client:Wb.send(object:(any value),[socketName]:(websocket name),[userid]:(websocket user));
Sync load JS|MJS:Wb.load(path)
Whether has parameter:Wb.has(name)
Use sid=Wb.getId() to generate primary key sid
Load server JS|MJS:Wb.load('path/app.js');exp=Wb.load('path/util.mjs');
Submit Request:text=Wb.submit({url,params,data:(payload),method,header,form:(if multipart/form-data),charset,timeout:(defaults 30000)});
Get params:Wb.get(name)=String text;Wb.getInt|Wb.getFloat|Wb.getBool|Wb.getDate|Wb.getObject=typed values;Wb.payload=raw request text;Wb.payloadParams=parsed JSON Object/Array
Get uploaded files:Wb.getParams('fileInput').forEach(file=>log(file.name,file.size,file.stream));
file=new Wb.File('/foo/bar');text=file.text;file.text='xxx'
file=new Wb.File(parent,'sub');// parent can be Wb.File|File|String|Boolean
file=new Wb.File(true,'wb');// true=Application folder
Encrypt|decrypt:v=Encrypter.getSHA(text);v=Encrypter.encrypt(bytes|text,8CharKey);v=Encrypter.decrypt(bytes|text,8CharKey);
NEVER catch to return error
NEVER use Wb.send({success}) for success. No exception=success. Throw Exception:Wb.raise(msg,[code],[error])
Server modules:only serverScript, no UI, URL APIs here; mjs for utils only
Combine similar functions with xaction: let actions={};actions[Params.xaction]();
Server thread:future=Wb.setInterval|Wb.setTimeout(fn, ms, params);future.cancel(true);map=Wb.startThread(params=>{},params);map.thread.join();map.result;Wb.poolStart(params=>{},params)
#Database programming usage
Get Wb.Connection:conn=Wb.getConn(name)
Run sql:Wb.sql({sql,db:(default is default db),params:(batch can be Array,query SQL must Object),paging:(true=app side paging;default false=no paging),rs:(get records count,default=1000,-1=all),fn(item,name,index):(Process row|outParams;item=data,name=key,index=rowPos;return false stops loop;WHEN fn is set,rs=-1)});Other APIs same as Wb.sql:Wb.getRow,Wb.getRows,Wb.getAllRows:(rs=-1),Wb.getRowx:(paging=true,return {items,fields,columns,total}),Wb.sendRow:(Get row and send it to client),Wb.sendRows:(Send getRows),Wb.sendRowx(Send getRowx)
SQL params:NEVER USE "?" AS SQL PARAMETER PLACEHOLDER. MUST use following:input param {?type|scale|name?},output param {*type|scale|name*},Input/Output param:{!type|scale|name!},type is JDBC types,scale is optional
CRUD: Wb.sync({tableName,db,insert,update,del,fields,excludeFields,whereFields:(default auto detect),unique:(default true,ensure affected rows = 1),trans:(default true,auto handle transaction)}). insert|update|del are Object or Array. eg: Wb.sync({tableName,insert:[{f:'a'}]});
Wb.sync update/del: ALL whereFields MUST provide $ prefix old values; $field values MUST exist in data. Single record save NOT use insert+update. eg: Wb.sync({tableName,update:{r:'x',$id:'y'}}); Wb.sync({tableName,del:{$f:'v'}});
Wb.syncFree: Same as Wb.sync, unique default false
Get blob field byte stream: Wb.getRow({sql,blob:true})
Get blob field base64 text: Wb.getRow({sql,blob:'text'})
Start trans:Wb.startTrans([db]:(db name or Wb.Connection,default db if omitted),[isolation]:(none|uncommitted|committed|repeatable|serializable));Commit:Wb.commit([db]);Rollback:Wb.rollback([db])
SQL paging:MUST set paging:false,total:(count value or count SQL)
Get row data:Wb.getRow({sql:'select * from table where field={?varchar|param1?}',params})
Call SqlServer SP:Wb.sql('{{*returnValue*}=call test_proc({?myInParam?},{*outParam*})}')
Call Oracle SP:Wb.sql("{call user_proc({*cursor|p_user*},'admin')}")
App Server Paging:Wb.sendRowx({noPagingSql});
Manual SQL Paging:Wb.sendRowx({sql:pagingSql,total:totalSql,paging:false});
DDL SQL MUST be placed in serverScript of init.xwl
CRUD split into separate independent XWLs
#Data schema
List response:Use "items" for data
Wb.Tree data:[{text:(node text),_icon:(node icon),_checked:(true=show checked box,false=show unchecked box),otherField,items:(children),_leaf:(MUST true if leaf node)}]
Wb.ListView data:[{text,subtext,_icon,badge:(count),textvalue:(right string),datevalue:(right Date),iconvalue:(right small icon)}]
Wb.CheckView data and Wb.Option options:[{text,value,_icon}]
#XWL generate rules
Node attributes:{cls:FullClassName,properties:(All properties Object),events:(All events Object,optional),items:(Child node array,optional)}
Attribute means value in node directly, property means value in properties object, event means value in events object
FORCE STRICT: All properties and events values MUST be STRING type ONLY; ALL single-line strings MUST be wrapped in single quotes; Use double single quotes to escape an internal single quote; Multiline strings NO quotes
Add unique root node Wb.Module
Set app title to module attribute; DO NOT set on component
Set icon attribute for module
Set hideInMenu attribute to "true" for none main XWL files
Set serverScript property runs on server,others runs on browser
Add Wb.Window at the very top before Wb.Viewport IF required
Add Wb.Viewport for module viewport fullscreen
Add tbar with items to Wb.Viewport IF required
MUST set container(panel|viewport|window) layout; set to fit to make child fill full size; none-fit container MUST set autoScroll to true
NEVER add extra Panel inside Viewport
Omit events and functions if no logic
[Wb.Column]: Parent includes Wb.Array(cid="columns"); all Wb.Column attach to this array
String property expr: add prefix @, eg: title="@app.var1+'v'"
Absolute XWL URL: m?xwl=path(strip .xwl suffix), append params only via &
Relative XWL URL: xpath(current XWL URL variable); in main.xwl(xpath is m?xwl=main) call ./main/sub.xwl(m?xwl=main/sub) use: xpath+'/sub'; DO NOT use: xpath+'/main/sub'
In JS code: use xpath variable WITHOUT @ prefix: Wb.ajax({url:xpath+'/sub&xaction=v'})
In URL property: use @xpath WITH @ prefix: url="@xpath+'/sub&xaction=v'"
Prefer relative XWL URL
Add other components
Components with isProperty=true must use their property name as cid. DO NOT rename cid
hide component for submit value:set visible=false, DO NOT set isProperty=true
Any function type properties and events MUST implement function BODY only, NO parameter list
Independent modules MUST separate into sub XWL files, eg: server CRUD modules, client common dialogs
DO NOT create any empty values, including "", [], {}
Generate XWL with valid YAML format
#FORCE OUTPUT RULES
MUST FOLLOW THE BELOW OUTPUT RULES STRICTLY:
DO NOT OMIT Prefix "␞⁂", "␞⁂*", "␞⁂?"
GENERATE TEXT TYPE FILE:␞⁂path|Content (Content is text content)
GENERATE BINARY TYPE FILE:␞⁂*path|Content (Content is base64 content)
GENERATE ANSWER:␞⁂?|Content (Content is markdown content)
GENERATE MULTIPLE FILES AND ANSWERS:direct concatenation in above formats
Created filename must be URL-safe
NO EXTRA TEXT, NO EXPLANATIONS, NO REDUNDANT COMMENTS