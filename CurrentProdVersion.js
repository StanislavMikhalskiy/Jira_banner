<script type='text/javascript'>

    (function() {
    /*var s = document.createElement("script");
    s.async = false;
    s.defer = true;
    s.src = "https://<путь-к-скрипту>.js";
    document.head.appendChild(s);*/
    //window.alert("Все получилось");

    var script_version = '1.0'
    var dev_name = ""
    log_preffix = `${dev_name} Banner: `
    // глобальный конфиг разных процессов
    var gc = {}

    function Log(value){
    var dt = new Date();
    console.log(`${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}.${dt.getMilliseconds()} ${log_preffix}${value}`);
}
    Log(`Скрипт успешно подключен. Версия ${script_version}`);
    // фиксируем параметры URL
    urlParams();

    document.addEventListener("DOMContentLoaded", DOMContentLoaded());
    $(document).ajaxComplete(FajaxComplete);

    function DOMContentLoaded(){
}

    function urlParams(){
    //var paramsString = document.location.search;
    // var searchParams = new URLSearchParams(paramsString);
    gc['urlParams'] = new URLSearchParams(document.location.search);

}

    function FajaxComplete(){
    //Log(`FajaxComplete`);
    FillKanbanCard();
}



    function FillKanbanCard(){

    // проверяем, что мы на доске
    // https://jira.action-media.ru/secure/RapidBoard.jspa?rapidView=746&view=detail&selectedIssue=SS-11463
    if (!gc.urlParams.has("rapidView")) {
    return;
} else {
    // проверяем, что мы на нужной доске
    if ( gc.urlParams.get("rapidView") !== "136") return; // 746
}

    // ищем карты по доске
    var $cards = $(".js-detailview");
    //Log(`cards.length ${$cards.length} `);
    if ($cards.length > 0) {
    $cards.each(function(indx){
    // ищем элемент ghx-grabber
    var cardGrabberColor = $(this).children(".ghx-grabber").css('background-color');
    if ( cardGrabberColor !== 'rgb(238, 238, 238)' ) {
    $(this).css('background-color',cardGrabberColor)
};
})
}
}
})();


    (function ($) {
// Автор: Михальский Станислав, 2019-2020

    var script_version = '1.7'
    var devName = ""

    var log_level = 0;
    var logPrefix = devName+"ABanner: ";

// кнопки, которые добавлены через ScriptRunner и на которые вешаем обработчики
    var jiraButton = [{ "key":"addNewSystem", "value":"ss-new-system-js", "isEventAdded":false, "tryAddEventCount":0},
{ "key":"addSmartTasks", "value":"bcklg-tools-menu-sub-tasks_v3", "isEventAdded":false, "tryAddEventCount":0}]

// глобальные пемеренные
    var jiraURL = "https://jira.action-media.ru"
    var vGlobal = {
    "jira": {"viewIssue":jiraURL+"/browse/",
    "getIssue":jiraURL+"/rest/api/2/issue/",
    "postIssue":jiraURL+"/rest/api/2/issue/", // vGlobal.jira.postIssue
    "postIssueBulk":jiraURL+"/rest/api/2/issue/bulk/", // vGlobal.jira.postIssueBulk
    "postIssueLink":jiraURL+"/rest/api/2/issueLink/", // vGlobal.jira.postIssueLink
    "fields":{
    "epicLink":"customfield_10100", // vGlobal.jira.fields.epicLink
    "epicName":"customfield_10102", // vGlobal.jira.fields.epicName
    "businessCase":"customfield_11610", // vGlobal.jira.fields.businessCase
    "team":"customfield_11601", // vGlobal.jira.fields.team
    "components":{
    "SS":"10014", // vGlobal.jira.fields.components.SS
    "SEARCH":"10006",
    "WARM":"10010"
},
    "businessCases":{
    "bigPicture":"11851" // vGlobal.jira.fields.businessCases.bigPicture
},
    "teams":{
    "SS":"11830", // vGlobal.jira.fields.teams.SS
    "SEARCH":"11855",
    "WARM":"11856"
},
    "issueTypes":{
    "bcklg":{
    "iniciative":"10903", // vGlobal.jira.fields.issueTypes.bcklg.iniciative
    "backendSub":"11001", // vGlobal.jira.fields.issueTypes.bcklg.backendSub
    "frontendSub":"11002", // vGlobal.jira.fields.issueTypes.bcklg.frontendSub
    "testSub":"11005" // vGlobal.jira.fields.issueTypes.bcklg.testSub
},
    "dev":{
    "epic":"10000",
    "task":"10214" // vGlobal.jira.fields.issueTypes.dev.task
},
    "support":{
    "dev":"10902" // vGlobal.jira.fields.issueTypes.support.dev
}
},
    "issuePriorities":{
    "support":{
    "high":"2" // vGlobal.jira.fields.issuePriorities.support.high
}
}
}
},
    "process":{
    "iniciativeSubtask":{
    "backend_count":0,
    "frontend_count":0,
    "req_count":0,
    "test_count":0,
    "design_count":0
}
}
}
// deprecated
    var jiraTaskURL = "https://jira.action-media.ru/browse/"
    var jiraAPIGetIssue = jiraURL+"/rest/api/2/issue/"
    var jiraAPIPostIssue = jiraURL+"/rest/api/2/issue/"
    var jiraAPIPostIssueLink = jiraURL+"/rest/api/2/issueLink/"

    var backlogGridClass = "ghx-backlog-group";
    var activeSprintGridClass = "ghx-sprint-active";
    var activeSprintGridIssueClass = "js-issue";
    var activeSprintGridIssueAttribute = "data-issue-key";
    var stateCustomClass = "sfaulunsad";
    var extraFieldsParentClass = "ghx-plan-extra-fields";
    var extraFieldEstimateClass = "ghx-extra-field-estimate";
    var extraEpicPanelClass = "ghx-row-version-epic-subtasks";
    var epicTaskListElemSpanId = "epicTaskListElemSpanId";
    var epicTableNewRowHeaderId = "epicTableNewRowHeaderId";
    var epicTableNewRowBottomId = "epicTableNewRowBottomId";

    var refreshStopped = false;
    var canUseScriptForUpdateStates = false; // определяет разрешения для отображения статуса на доске бэклога
    var DEBUG = true; // определяет необходимость детального логирования
    var countUpdate = 0; // вычисляет кол-во обновлений статусов на доске бэклога
    const toolsTableButtonStartCalculationId = 'toolsTableButtonStartCalculation'+devName;

    var current_issue_data = {};
    current_issue_data['isSmartDlgFirst'] = true;

    document.addEventListener("DOMContentLoaded", DOMContentLoaded());
    Smart_log(`script_version = ${script_version}`);

    function Log(value){
    var prefix = "Test script: ";
    if (DEBUG) console.log(prefix+value);
}
    function Smart_log(value){
    var l = '';
    for(var i = 0; i<log_level; i++) l+="|-";
    var dt = new Date();
    console.log(`${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}.${dt.getMilliseconds()} ${logPrefix}${l}${value}`);
}
    function SetGlobalConfig(){
    // скрываем доп. информацию в строке задачи
    $("head").append($("<style type='text/css'>.ghx-issue-compact .ghx-plan-extra-fields.ghx-plan-extra-fields.ghx-row {display: none;} .ghx-extra-field {display: none;} </style>"));
    //$("head").append($("<style type='text/css'> ghx-extra-field {display: none;} </style>"));

    // в задачах без фикс и эпика добавляем div и и переносим узел с assigne и оценкой

}

// определяем параметры url
    function getUrlParams(){
    var params = window
    .location
    .search
    .replace('?','')
    .split('&')
    .reduce(
    function(p,e){
    var a = e.split('=');
    p[ decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
    return p;
},
{}
    );
    return params;
}

    function GetIssueByParams(issueKey,searchParams){
    log_level++;
    var ln = "GetIssueByParams: ";
    const start= new Date().getTime();

    var result = null;
    //Smart_log(ln+JIRA.Issue.getIssueKey());
    //Smart_log(ln+AJS.Meta.get("issue-key"));

    let url = new URL(jiraURL+"/rest/api/2/issue/"+issueKey);
    if (searchParams) {
    for (let x of searchParams) {
    url.searchParams.set(x.key, x.value);
}
}
    url.searchParams.set('CustomSource', 'AB_GetIssueByParams'); // CustomSource=AnnouncementBanner CustomSource=AB_GetIssueTimetracking CustomSource=AB_GetIssue CustomSource=AB_GetIssueByParams

    //Smart_log(ln+`url ${url}`);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    //xhr.setRequestHeader('SOAPAction', 'AnnouncementBanner');

    xhr.send();
    //document.getElementById("customfield_10800").value = obj.badges[1].id;
    //Smart_log(ln+xhr.status); // Равен кодам HTTP (200 - успешно, 404 не найдено, 301 - перенесено навсегда)
    //Smart_log(ln+xhr.statusText);
    //Smart_log(ln+xhr.responseText);

    // 4. Этот код сработает после того, как мы получим ответ сервера
    //xhr.onload = function() { // только для асинхронки
    if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
    //Smart_log(ln+`Ошибка ${xhr.status}: ${xhr.statusText}`);
} else { // если всё прошло гладко, выводим результат
    //Smart_log(ln+`Готово, получили ${xhr.response.length/1024} Kбайт`);
    result = xhr.responseText;
}
    //};

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
    return result;
}
    function GetGlobalPermissions(){
    var ln = "GetGlobalPermissions: ";
    log_level++;
    const start= new Date().getTime();
    let objGlobalPermissions = [];
    var urlParams = getUrlParams();
    // проверяем, находимся ли мы на какой-либо доске
    // "rapidView":"136","key":"ViewEstimationsOnPlaning"
    if ('rapidView' in urlParams) {
    Smart_log(`${ln} Мы на доске ${urlParams['rapidView']} `);
    Smart_log(`${ln} Получение разрешений, связанных с досками`);
    var issueKey_rapidView = 'PSQL-222'; // 'PSQL-223'
    var requestParams = [{key:'fields',value:'description'},{key:'Detail',value:'GetGlobalPermissions'}];
    var objPermissionsData = JSON.parse(GetIssueByParams(issueKey_rapidView, requestParams));
    if (objPermissionsData) {
    if ('fields' in objPermissionsData && objPermissionsData.fields != null) {
    if ('description' in objPermissionsData.fields && objPermissionsData.fields.description != null) {
    Smart_log(`${ln} Разрешения по задаче ${issueKey_rapidView} получены`);
    //Smart_log(`${ln} ${JSON.stringify(objPermissionsData)}`);
    // очистка данных
    var x = JSON.stringify(objPermissionsData.fields.description).replace(/{code:json}|{code}|\\r|\\n|\\/g, '');
    x = x.replace(/"\[{/g, '[{');
    x = x.replace(/}\]"/g, '}]');
    //Smart_log(`${ln} replace =  ${x}`);
    var objPermissions;
    try {
    objPermissions = JSON.parse(x);
    //for(var i=0; i<objPermissions.length; i++) { Smart_log(`${ln} Данные rapidView =  ${objPermissions[i].rapidView}`); }
    for (let objPermission of objPermissions) {
    //Smart_log(`${ln} Данные rapidView =  ${objPermission.rapidView}`);
    // нужно получить все данные по нашей доске, наборов может быть несколько
    // в каждом наборе по коду процесса получить необходимые данные
    if (objPermission.rapidView == urlParams['rapidView']) {
    objGlobalPermissions.push(objPermission);
    //Smart_log(`${ln} Для доски найдено разрешение  ${objPermission.key}`);
}
}
} catch (e) {
    //console.log(e instanceof SyntaxError); // true
    //console.log(e.message);                // "missing ; before statement" - перед инструкцией отсутствует символ ;
    //console.log(e.name);                   // "SyntaxError"
    //console.log(e.fileName);               // "Scratchpad/1"
    //console.log(e.lineNumber);             // 1
    //console.log(e.columnNumber);           // 4
    //console.log(e.stack);                  // "@Scratchpad/1:2:3\n"
    Smart_log(`${ln} ${e.name} ${e.message}`);
}
} else Smart_log(`${ln} Данные objPermissionsData.fields.description отсутствуют`);
} else Smart_log(`${ln} Данные objPermissionsData.fields отсутствуют`);
} else {
    Smart_log(`${ln} Разрешения по задаче ${issueKey_rapidView} не были получены`);
}
}

    // если разрешения были получены - запускаем обработчики правил
    if (objGlobalPermissions.length>0) {
    var tDelay = 200; setTimeout(ApplyRules, tDelay, objGlobalPermissions); Smart_log(ln+`Запуск setTimeout(ApplyRules, ${tDelay})`);
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
}
    function ApplyRules(objGlobalPermissions){
    var ln = "ApplyRule: ";
    log_level++;
    const start= new Date().getTime();

    for (let objPermission of objGlobalPermissions) {
    var tDelay = 200;
    if ( 'processes' in objPermission && objPermission.processes !== null && objPermission.processes.length > 0) {
    // обходим массив процессов
    for (let process of objPermission.processes) {
    //Smart_log(`${ln} process.key= ${process.key}`);
    switch(process.key) {
    case "ViewEstimationsOnPlaning": {
    setTimeout(ApplyRuleViewEstimationsOnPlaning, tDelay, objPermission);
    break; }
}
}
} else Smart_log(`${ln} Данные по доступным процессам не получены. Проверьте в конфиге секцию process`);
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
}
    function ApplyRuleViewEstimationsOnPlaning(objPermission){
    var ln = "ApplyRuleViewEstimationsOnPlaning: ";
    log_level++;
    const start= new Date().getTime();

    // добавляем на панель кнопку запуска расчета
    var toolsTable = document.getElementById("ghx-modes-tools");
    if (toolsTable !== null) {
    var toolsTableButtonStartCalculation = document.getElementById(toolsTableButtonStartCalculationId);
    if (toolsTableButtonStartCalculation === null) {
    toolsTableButtonStartCalculation = document.createElement('button');
    toolsTableButtonStartCalculation.id = toolsTableButtonStartCalculationId;
    toolsTableButtonStartCalculation.innerHTML = "Расчет"+devName;
    toolsTableButtonStartCalculation.onclick = function() { CalcWorkloadfutureSprint(objPermission); }
    toolsTableButtonStartCalculation.className="aui-button";
    //toolsTableButtonStartCalculation.style.display = "inline";
    //toolsTableButtonStartCalculation.style.border = "1px solid black";
    toolsTableButtonStartCalculation.style.marginLeft = "5px"
    //toolsTableButtonStartCalculation.style.padding = "5px"
    //toolsTableButtonStartCalculation.style.color = "black"
    // проверяем, что будущий спринт существует. Если его нет, то дизейблим кнопку
    //if (GetFutureSprintId() == -1 ) toolsTableButtonStartCalculation.disabled = true;
    toolsTable.appendChild(toolsTableButtonStartCalculation);
}
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
}
    function GetFutureSprintId(){
    var ln = "GetFutureSprintId: ";
    log_level++;
    const start= new Date().getTime();

    var result = -1;
    var elFutureSprint = GetFirstFutureSprintByHtmlAsElement();
    if (elFutureSprint !== null) {
    var futureSprintId = elFutureSprint.getAttribute("data-sprint-id");
    if (futureSprintId !== null) {
    result = futureSprintId
}
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;

    return result
}
    function CalcWorkloadfutureSprint(objPermission){
    var toolsTableButtonStartCalculation = document.getElementById(toolsTableButtonStartCalculationId);
    if (toolsTableButtonStartCalculation !== null) {
    toolsTableButtonStartCalculation.style.backgroundColor = "#FF7A83"
}
    var tDelay = 200; setTimeout(CalcWorkloadfutureSprintMain, tDelay, objPermission);
}
    function CalcWorkloadfutureSprintMain(objPermission){
    var ln = "CalcWorkloadfutureSprint: ";
    log_level++;
    const start= new Date().getTime();

    // получаем будущий спринт
    var futureSprintId = GetFutureSprintId(); //2737
    if (futureSprintId > -1) {

    var jqlQuery = `Sprint =${futureSprintId} and status != Closed `;
    var requestParams = [{key:'maxResults',value:'150'},{key:'jql',value:jqlQuery},{key:'fields',value:'assignee,customfield_11304'},{key:'Detail',value:'CalcWorkloadfutureSprint'}];
    // получаем результаты запроса - массив задач
    var objIssues = JSON.parse(GetIssuesByQuery(jqlQuery,requestParams));
    //Smart_log(`${ln} objIssues = ${JSON.stringify(objIssues)}`);

    if (objIssues) {
    if ('total' in objIssues && objIssues.total > 0) {
    var futureSprintTasks = [];
    // обходим полученные задачи
    for (let objIssue of objIssues.issues) {
    var assignee = "";
    if ( 'assignee' in objIssue.fields && objIssue.fields.assignee !== null && 'key' in objIssue.fields.assignee ) {
    assignee=objIssue.fields.assignee.key
} else {
    Smart_log(`${ln} У задачи ${objIssue.key} не указан assignee`);
};
    var sprintTaskInfo = {
    issueKey:objIssue.key,
    assignee:assignee,
    roles :[{key:"Developers", assignee:"", estimate:0},{key:"QA", assignee:"", estimate:0}]
}
    // обрабатывам роли из задачи
    if ( 'customfield_11304' in objIssue.fields && objIssue.fields.customfield_11304 !== null) {
    for (let roleCustomField of objIssue.fields.customfield_11304) {
    var roleLogin = ParseRoleLogin(roleCustomField);
    //Smart_log(`${ln} ParseRoleLogin = ${roleLogin}, roleCustomField = ${roleCustomField}`);
    var roleCode = ParseRoleCode(roleCustomField);
    //Smart_log(`${ln} ParseRoleCode = !${roleCode}!`);

    switch(roleCode) {
    case "10206": {
    for(let role of sprintTaskInfo.roles) {
    if (role.key == "Developers") { role.assignee = roleLogin }
}
    break;
}
    case "10404": {
    for(let role of sprintTaskInfo.roles) {
    if (role.key == "QA") { role.assignee = roleLogin }
}
    break;
}
}
}
}
    //Smart_log(`${ln} sprintTaskInfo.issueKey: ${sprintTaskInfo.issueKey} sprintTaskInfo.assignee: ${sprintTaskInfo.assignee} sprintTaskInfo.roles[0]: ${sprintTaskInfo.roles[0].key} ${sprintTaskInfo.roles[0].assignee} sprintTaskInfo.roles[1]: ${sprintTaskInfo.roles[1].key} ${sprintTaskInfo.roles[1].assignee}`);
    /*
    customfield_11304": [
              "Role: 10206 (cherkasov)",
              "Role: 10404 (kusakin)",
              "Role: 10900 (a.ivanov)"
            ]
    */
    // добавляем данные по задачам в массив
    futureSprintTasks.push(sprintTaskInfo);
    //Smart_log(`${ln} sprintTaskInfo.issueKey = ${sprintTaskInfo.issueKey}, sprintTaskInfo.key = ${sprintTaskInfo.assignee}`);
}

    if (futureSprintTasks.length>0) {
    // для каждой задачи получаем информацию по оценке
    for (let futureSprintTask of futureSprintTasks) {
    //Smart_log(`${ln} для каждой задачи получаем информацию по оценке futureSprintTask.issueKey = ${futureSprintTask.issueKey}`);
    var objIssueTimetracking = JSON.parse(GetIssueTimetracking(futureSprintTask.issueKey));
    if (objIssueTimetracking) {
    //Smart_log(`${ln} objIssueTimetracking = ${JSON.stringify(objIssueTimetracking)}`);
    if ('estimates' in objIssueTimetracking) {
    if (objIssueTimetracking.estimates.length > 0) {
    // обходим имеющиеся оценки
    for(var r=0; r<objIssueTimetracking.estimates.length; r++) {
    for(var ro=0; ro<futureSprintTask.roles.length; ro++) {
    //Smart_log(ln+` ${futureSprintTask.issueKey} ${objIssueTimetracking.estimates[r].role} ${futureSprintTask.roles[ro].key}`);
    if (objIssueTimetracking.estimates[r].role == futureSprintTask.roles[ro].key)
{
    if ("remainingEstimateSeconds" in objIssueTimetracking.estimates[r]) { // originalEstimateSeconds
    futureSprintTask.roles[ro].estimate = objIssueTimetracking.estimates[r].remainingEstimateSeconds;
}
}
}
}
} else Smart_log(ln+`отсутствуют данные objIssueTimetracking`);
} else Smart_log(ln+`отсутствуют данные estimates (issueKey=${objIssueTimetracking.key})`);
} else Smart_log(ln+`GetIssueTimetracking - данные не были получены (issueKey=${futureSprintTask.issueKey})`);
}
    // вывод данных в лог для отладки
    /*for (let futureSprintTask of futureSprintTasks) {
        Smart_log(ln+`issueKey: ${futureSprintTask.issueKey}, assignee: ${futureSprintTask.assignee}`);
        for (let role of futureSprintTask.roles) {
            Smart_log(ln+`role.key: ${role.key}, role.assignee: ${role.assignee}, role.estimate: ${role.estimate}`);
        }
    }*/
    // objPermission - данные по разработчикам
    // формируем массив с суммой оценок по каждому разработчику
    var developersEstimates = [];
    if ('team' in objPermission && objPermission.team != null && objPermission.team.length > 0) {
    for (let developer of objPermission.team) {
    var developerInfo = {
    key:developer.key,
    estimate:0,
    dataFilterId:developer.dataFilterId,
    role:developer.role,
    hasTaskWithoutEstimate:false
}
    //Smart_log(ln+`developerInfo.key = ${developerInfo.key}, developerInfo.dataFilterId = ${developerInfo.dataFilterId}, developerInfo.role = ${developerInfo.role}`);
    // получаем массив задач, назначенный на разработчика
    var assigneeTasks = futureSprintTasks.filter(issue => issue.assignee === developer.key)
    if (!!assigneeTasks && assigneeTasks.length>0) {
    // обходим массив отфильтрованных задач по assignee
    for (let task of assigneeTasks) {
    // roles :[{key:"Developers", assignee:"", estimate:0},{key:"QA", assignee:"", estimate:0}]
    // обходим массив ролей в задаче
    for (let taskRole of task.roles) {
    if (taskRole.key == developerInfo.role) {
    if (taskRole.estimate>0) {
    developerInfo.estimate += taskRole.estimate;
}
    else {
    developerInfo.hasTaskWithoutEstimate = true;
    Smart_log(ln+`task.key = ${task.issueKey}, task.remainingEstimate = ${taskRole.estimate}, task.assignee = ${task.assignee}`);
}
}
}
}
}
    developersEstimates.push(developerInfo);
}
    UpdateEstimateInfoByDeveloper(developersEstimates);

} else Smart_log(`${ln} Нет данных по разработчикам. Проверьте конфиг в задаче`);
    // формируем данные по ролям
    var rolesEstimates = [];
    if ('summaryByRoles' in objPermission && objPermission.summaryByRoles != null && objPermission.summaryByRoles.length > 0) {
    for (let role of objPermission.summaryByRoles) { // TO-DO: лишний цикл, кажись. Можно сразу по объекту идти в цикле ниже и там уже заполнять массив
    var roleInfo = {
    key:role.key,
    estimate:0,
    unnassigneeDev:0,
    dataFilterId:role.dataFilterId
}
    //Smart_log(ln+`roleInfo.key = ${roleInfo.key}, roleInfo.dataFilterId = ${roleInfo.dataFilterId}`);
    rolesEstimates.push(roleInfo);
}
    for (let futureSprintTask of futureSprintTasks) {
    for (let roleEstimates of rolesEstimates) {
    for (let taskRole of futureSprintTask.roles) {
    if (taskRole.key == roleEstimates.key) {
    if (taskRole.estimate>0) roleEstimates.estimate += taskRole.estimate;
    //Smart_log(ln+`futureSprintTask.issueKey = ${futureSprintTask.issueKey}, taskRole.key = ${taskRole.key}, taskRole.estimate = ${taskRole.estimate}, roleEstimates.key = ${roleEstimates.key}`);
    // обработка задач для роли Developers, у которых не назначен assignee
    // считаем сумму часов для этой роли
    if (taskRole.key == "Developers") {
    if (futureSprintTask.assignee == "") {
    roleEstimates.unnassigneeDev += taskRole.estimate;
}
}
}
}
}
}
    // выводим результат
    UpdateEstimateInfoByRole(rolesEstimates);
}
}
} else Smart_log(`${ln} Нет данных по задачам`);
} else Smart_log(`${ln} Объект objIssues не получен`);
    /**/
    //alert(`futureSprintId = ${obj}`);
    //Smart_log(`${ln} obj = ${obj}`);

    // удаляем индикатор
    var toolsTableButtonStartCalculation = document.getElementById(toolsTableButtonStartCalculationId);
    if (toolsTableButtonStartCalculation !== null) {
    toolsTableButtonStartCalculation.style.backgroundColor = "#ECEDF0"
}

} else Smart_log(`${ln} Не найден futureSprintId`);
    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
}
    function ParseRoleLogin(value){ // value: "Role: 10206 (cherkasov)"
    var ln = "ParseRoleLogin: ";
    var result='';

    var posBegin = value.indexOf("(");
    if ( posBegin > 0) {
    var posEnd = value.indexOf(")");
    if ( (posEnd-posBegin) > 1 ) {
    result = value.substring(posBegin+1,posEnd);
}
}

    return result;
}
    function ParseRoleCode(value){ // value: "Role: 10206 (cherkasov)"
    var ln = "ParseRoleLogin: ";
    var result='';

    var posBegin = value.indexOf(":");
    if ( posBegin > 0) {
    var posEnd = value.indexOf("(");
    result = (value.substring(posBegin+1,posEnd)).trim();
}

    return result;
}
    function GetIssuesByQuery(jqlQuery, searchParams){
    var ln = "GetIssuesByQuery: ";
    log_level++;
    const start= new Date().getTime();

    var result = null;
    let url = new URL(jiraURL+"/rest/api/2/search");
    if (searchParams) {
    for (let x of searchParams) {
    url.searchParams.set(x.key, x.value);
    //Smart_log(ln+`x.key: ${x.key} x.value: ${x.value}`);
}
}
    url.searchParams.set('CustomSource', 'AB_GetIssuesByQuery'); // CustomSource=AnnouncementBanner CustomSource=AB_GetIssueTimetracking CustomSource=AB_GetIssue CustomSource=AB_GetIssueByParams CustomSource=AB_GetIssuesByQuery
    //Smart_log(ln+`url: ${url}`);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();
    if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
    //Smart_log(ln+`Ошибка ${xhr.status}: ${xhr.statusText}`);
} else { // если всё прошло гладко, выводим результат
    //Smart_log(ln+`Готово, получили ${xhr.response.length/1024} Kбайт`);
    result = xhr.responseText;
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
    return result;
}
    function DOMContentLoaded(){
    var ln = "DOMContentLoaded: ";
    log_level++;
    const start= new Date().getTime();

    // получаем метаданные
    current_issue_data["key"] = AJS.Meta.get("issue-key");
    current_issue_data["projectKey"] = JIRA.API.Projects.getCurrentProjectKey();

    var tDelay = 200; setTimeout(GetGlobalPermissions, tDelay); Smart_log(ln+`Запуск setTimeout(GetGlobalPermissions, ${tDelay})`);

    var urlParams = getUrlParams();
    switch(urlParams['rapidView']) {
    case "136": {
    canUseScriptForUpdateStates = true;
    SetGlobalConfig();
    break; }
}

    // добавляем кнопку на эпик для получения оценки по задачам
    tDelay = 500; setTimeout(AddEpicTaskListButtonCalc, tDelay); Smart_log(ln+`Запуск setTimeout(AddEpicTaskListButtonCalc, ${tDelay})`);

    const end = new Date().getTime();
    Smart_log(ln+`Время работы: ${end - start} мс`);
    log_level--;
}
    function AddEventToButton(){
    var ln = "AddEventToButton: ";
    log_level++;
    // количество попыток навесить события на элементы при срабатывании ajaxComplete
    var tryCountMax = 50;

    for(let x of jiraButton) {
    // проверяем, была ли подписка
    if (!x.isEventAdded && x.tryAddEventCount < tryCountMax) {
    // ищем элемент
    var $jButton = $(`#${x.value}`)
    if ($jButton.length) {
    // нашли элемент
    switch (x.key){
    case "addSmartTasks": {
    AddBodyHTML();
    $jButton.click(function() {
    SmartDlgShow();
});
    break; }
    case "addNewSystem": {
    $jButton.click(function() {
    CreateNewSystemGetEpic();
});
    break; }
}
    x.isEventAdded = true;
    //Smart_log(ln+"Найдена кнопка $jButton = "+x.key);
} else {
    // не нашли элемент
    x.tryAddEventCount++;
    //Smart_log(ln+"Кнопка не найдена $jButton = "+x.key);
}
}
}

    log_level--;
}

    function json(response) {
    return response.json()
}
    function uRequestPost(value) {
    var ln = "uRequestPost: ";
    log_level++;

    return new Promise((resolve) => {
    fetch(value.request.url, {
    method: 'POST', // или 'PUT'
    body: JSON.stringify(value.request.data), // данные могут быть 'строкой' или {объектом}!
    headers: {
    'Content-Type': 'application/json'
}
})
    .then(resolve => {
    //Smart_log(ln+`response status ${resolve.status}`);
    //value.response.stateCode = resolve.status;
    value["response"] = {"stateCode":resolve.status}
    return resolve
})
    .then(json)
    .then(function(data) {
    value.response["data"] = data;
    //Smart_log(ln+`value ${JSON.stringify(value)}`);
})
    .then(resolve)
    .catch(() => resolve(null));
});
    log_level--;
}
    function CreateNewSystemGetEpic(){
    var ln = "CreateNewSystemGetEpic: ";
    log_level++;

    /*
    Цель процесса - автоматизированное заведение скопа задач в несколько команд для создания новой системы/издания в Справочных
    Процесс запускается из эпика бэклога при условии, что в компоненте указаны "Справочные системы"
    */

    Smart_log(ln+`Запускаем процесс создания задач для новой системы на основе эпика ${current_issue_data.key}`);
    var newIssueData = {
    "url": new URL(vGlobal.jira.getIssue+current_issue_data.key),
    "data":{"AProcess": 'ABanner', 'ABProcess':'CreateSys', 'ADetail':'GetEpic'},
    "isAsync":true,
    "data_result":{},
    "state_result":false
}
    newIssueData.url.searchParams.set('fields', 'summary, description,customfield_10102');

    var deferreds = [];
    deferreds.push($.ajax({
    url: newIssueData.url, // указываем URL
    type: "GET", // HTTP метод, по умолчанию GET
    data: newIssueData.data, // данные, которые отправляем на сервер
    dataType: "json", // тип данных загружаемых с сервера
    async: newIssueData.isAsync,
    success: function (data) {
    newIssueData.data_result = data;
    newIssueData.state_result = true;
},
    error: function(){
    Smart_log(`${ln} Ошибка выполнения GET запроса url: ${newIssueData.url}`);
}
})
    );
    $.when.apply($, deferreds).then(
    // все запросы успешно выполнены
    function () {
    //Smart_log(`${ln} все запросы успешно выполнены `);
    //Smart_log(ln+`data ${JSON.stringify(newIssueData.data_result)}`);
    if (newIssueData.state_result == true && CreateNewSystemParseEpic(newIssueData.data_result)) { CreateNewSystemCreateTasks() }
},
    // часть запросов выполнена с ошибкой
    function () {
    Smart_log(`${ln} часть запросов выполнена с ошибкой `);
    AJS.banner({ body: `Не удалось получить данные по задаче <strong>${current_issue_data.key}</strong>. Попробуйте перезагрузить страницу.`});
}
    );

    log_level--;
}
    function CreateNewSystemParseEpic(obj){
    var ln = "CreateNewSystemParseEpic: ";
    log_level++;

    var notifyMessage = "";
    if (obj) {
    if ('fields' in obj) {
    // получаем название
    if ('summary' in obj.fields && obj.fields.summary != null) {
    current_issue_data["summary"] = obj.fields.summary;
} else {
    current_issue_data["summary"] = "";
    Smart_log(ln+`Нет наименования`);
}
    if ('description' in obj.fields && obj.fields.description != null) {
    current_issue_data["description"] = obj.fields.description;
} else {
    current_issue_data["description"] = "Описание см. в инициативе";
    Smart_log(ln+`Нет описания`);
}
    // имя эпика
    if (vGlobal.jira.fields.epicName in obj.fields && obj.fields.customfield_10102 != null) {
    current_issue_data[vGlobal.jira.fields.epicName] = obj.fields[vGlobal.jira.fields.epicName];
} else {
    current_issue_data[vGlobal.jira.fields.epicName] = "Новая система";
    Smart_log(ln+`Ошибка. В задаче отсутствует имя эпика`);
}
} else notifyMessage=`Ошибка. Отсутствуют данные по объекту эпика`;
} else notifyMessage+=`Ошибка. Данные не переданы на вход`;

    log_level--;
    if (notifyMessage) {
    Smart_log(ln+notifyMessage);
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: 'Внимание!',
    body: notifyMessage,
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
    return false;
} else return true
}
    function uLinkIssue(issueFrom, issueTo, linkType, urlParams){
    var ln = "uLinkIssue: ";
    log_level++;
    let urlLink = new URL(vGlobal.jira.postIssueLink);
    if (urlParams.length > 0) {
    for (let x of urlParams) {
    urlLink.searchParams.set(x.key, x.value);
}
}
    var issurLinkData = {
    "type": {
    "name": linkType
},
    "inwardIssue": {
    "key": issueFrom
},
    "outwardIssue": {
    "key": issueTo
}
};
    fetch(urlLink, {
    method: 'post',
    headers: {
    "Content-type": "application/json; charset=utf-8"
},
    body: JSON.stringify(issurLinkData)
})
    .then(resolve => {
    if ( resolve.status != "201") { Smart_log(ln+`Ошибка при создании связи с инициативой status = ${resolve.status}`); }
})
    .catch(function (error) { Smart_log(ln+`Ошибка при создании связи с инициативой ${error}`); });
    log_level--;
}
    function CreateNewSystemTaskBySupportEpic(value){
    var ln = "CreateNewSystemTaskBySupportEpic: ";
    log_level++;
    Smart_log(ln+`Создаем эпик в проекте поддержки ${value.summary}`);

    var newIssueData = {
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.dev.epic},
    "summary": current_issue_data.summary,
    "description": "Пул задач для новой системы/издания",
    "project":{"key":"OAM"},
    [vGlobal.jira.fields.epicName]:current_issue_data[vGlobal.jira.fields.epicName]
}
}

    let url = new URL(vGlobal.jira.postIssue);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'CreateSys');
    url.searchParams.set('ADetail', 'CreateIssue');
    fetch(url, {
    method: 'post',
    headers: {
    "Content-type": "application/json; charset=utf-8"
},
    body: JSON.stringify(newIssueData)
})
    .then(
    function(response) {
    if (response.status != "201") {
    Smart_log(ln+`Ошибка при создании эпика поддержки status = ${response.status}`);
    response.json().then(function(data) {
    Smart_log(ln+`error ${JSON.stringify(data)}`);
});
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: `Внимание!`,
    body: "Ошибка при создании эпика поддержки",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
} else {
    response.json().then(function(data) {
    // {"id":"500252","key":"OAM-2230","self":"https://jira.action-media.ru/rest/api/2/issue/500252"}
    Smart_log(ln+`Эпик поддержки успешно создан - ${data.key}`);
    // создаем линк с эпиком в SS
    var urlParams = [{"key":"AProcess", "value":"ABanner"},
{"key":"ABProcess", "value":"CreateSys"},
{"key":"ADetail", "value":"CreateIssueLink"}]
    uLinkIssue(value.devEpic.response.data.key, data.key, "Relates",urlParams)
    //Smart_log(ln+`value ${JSON.stringify(data)}`);
    CreateNewSystemTaskBySupportEpicTasks(data.key);
})
}
}
    )
    .catch(function (error) { Smart_log(ln+`Ошибка при создании эпика поддержки ${error}`); });

    log_level--;
}
    function CreateNewSystemTaskBySupportEpicTasks(value){
    var ln = "CreateNewSystemTaskBySupportEpicTasks: ";
    log_level++;
    Smart_log(ln+`Создаем задачи в эпике поддержки ${value}`);

    var epicTeamTasks = [];
    epicTeamTasks.push({ "summary":"Завести код счетчика GTM",
    "description":`Прошу предоставить код GTM для встраивания в новую систему/издание`
});
    epicTeamTasks.push({ "summary":"Настроить GA",
    "description":`Требуется для нового издания\
                                    # Встроить код счетчиков GA в GTM
                                    # Создать представления для Системы в GA\n
                                    После ввода Системы в промышленную эксплуатацию:
                                    # Провести тестирование Системы в рамках задачи
                                    # Зарегистрировать найденные дефекты
                                    # Выдать необходимые доступы к Системе
                                    # Включить обработку системы на сервере статистики и для CRM`
});
    epicTeamTasks.push({ "summary":"Подключить горячую линию",
    "description":`Для новой системы/издания необходимо подключить сервис Горячей линии [Инструкция|https://conf.action-media.ru/x/GBc_CQ]
                                    # Подключить серверную часть ГЛ
                                    # Настроить ссылку на документ с правилами ГЛ
                                    # Настроить примеры ответов ГЛ
                                    # Настроить ссылку на документ по готовым ответам от редакции\n
                                    Данные, необходимые для подключения ГЛ, указаны в чек-листе [Чек-листы по подключаемому функционалу|https://conf.action-media.ru/pages/viewpage.action?pageId=91669138]`
});
    epicTeamTasks.push({ "summary":"Подключить онлайн-помощника",
    "description":`Для новой системы/издания необходимо подключить сервис ОП`
});
    epicTeamTasks.push({ "summary":"Подключить автописьма",
    "description":`Для новой Системы необходимо подключить отправку автописем через Сендсей
                                    # Запросить у бизнеса данные по шаблонам писем (бизнес заводит шаблоны в Сендсей самостоятельно)
                                    # Добавить шаблоны в почтовый сервис Платформы
                                    # Добавить шаблоны в базу SS
                                    # Прописать ID шаблонов в реестре, опубликовать реестр\n
                                    Описание процесса подключения автописем и список необходимых шаблонов в [регламенте|https://conf.action-media.ru/pages/viewpage.action?pageId=126354103]`
});
    epicTeamTasks.push({ "summary":"Подключить возможность переноса избранного",
    "description":`Для новой Системы необходимо настроить перенос избранного
                                    # В узле реестра (actiondigital|systemSite|fav|transfer) прописать идентификаторы изданий Системы через запятую к остальным идентификаторам изданий
                                    # Провести тестирование Системы в рамках задачи`
});
    epicTeamTasks.push({ "summary":"Подключить мониторинг Аптайминспектор",
    "description":`Для новой Системы необходимо подключить мониторинг Аптайминспектор
                                    # ОЭ (Леденева Е.)
                                    ## Подключить сайты Системы к мониторингу Аптайминспектор
                                    ## Обновить документацию (http://conf.action-media.ru/pages/viewpage.action?pageId=65378956)
                                    ### Сервисы и сайты, подключенные к проверкам через АИ
                                    ### Сотрудники, подключенные к смс-оповещениям от АИ
                                    ### Шаблон письма для экстренного оповещения о проблемах`
});
    epicTeamTasks.push({ "summary":"Подключить адресатов для оценок редакционных материалов и поиска",
    "description":`Для новой Системы необходимо прописать e-mail-ы ответственных от редакции Системы по обработке оценок редакционных материалов и поиска
                                    # Запросить у редакции адрес эл. почты для получения оценок редакционных материалов и поиска
                                    # Настроить получателя в реестре:
                                    ## Оценки ред. Материалов (actiondigital|serviceLetters|docsRating)
                                    ## Оценки поиска (actiondigital|serviceLetters|searchEval)`
});
    epicTeamTasks.push({ "summary":"Подключить сервисные письма",
    "description":`# Настроить отправку сервисных писем с указанных адресов в реестре
                                    ## В реестре есть узел Актион диджитал/Сервисные письма
                                    ## В нем надо посмотреть все дочерние узлы и, там где есть перегрузка по изданиям, добавить перегрузку для системы
                                    # Подключаются письма:
                                    ## Подтверждение регистрации
                                    ## Получение доступа (демо, оплаченный, ознакомительный, предемо, бонусный)
                                    ## Изменение адреса эл.почты / Изменение телефона / Изменение пароля
                                    ## Письмо коллеге с промостраницы`
});
    epicTeamTasks.push({ "summary":"Настроить HTTPS",
    "description":`# Для доменов новой Системы необходимо купить и установить SSL-сертификат [инструкция|http://conf.action-media.ru/x/NYrXAg]
                                    # Сгенерировать файл CSR
                                    # Настроить почту администратора домена
                                    # Если сертификат отсутствует
                                    ## Заказать сертификат [инструкция|http://conf.action-media.ru/x/NYrXAg]
                                    ## Оплатить счет
                                    ## Отправить заказ
                                    ## Получить файл сертификата
                                    ## Установить сертификат на площадке
                                    ## Проверить установленный сертификат [инструкция|https://habrahabr.ru/company/hosting-cafe/blog/280442]
                                    # прописать ssl-сертификаты в ИИС`
});
    epicTeamTasks.push({ "summary":"Добавить Пользовательское соглашение, Политику обработки данных, Положения",
    "description":`Необходимо добавить информацию о новой системе для отображения её на странице 3 в 1: Пользовательское соглашение, Политика обработки данных, Положение [инструкция|http://conf.action-media.ru/x/WI18Aw]
                                    # Добавить правки по новой системе через реестр Актион диджитал/Сайт системы/Пользовательское соглашение:
                                    ## Название
                                    ## Информация`
});
    epicTeamTasks.push({ "summary":"Завести данные в БО ID2",
    "description":`Необходимо завести данные в БО ID2
                                    Информация по AppID и урлам приложений находится в эпике разработки команды SS\n
                                    # Если данные нужно прописать для новой системы:
                                    ## Решить задачу в соответствии с руководством [Добавить домен к Приложению (прописать сайт в БО ID2)|https://conf.action-media.ru/pages/viewpage.action?pageId=65382812#id-%D0%A0%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE%D0%BF%D0%BE%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B5%D0%98%D0%942%D0%B4%D0%BB%D1%8F%D0%92%D0%A1%D0%A1-%D0%94%D0%BE%D0%B1%D0%B0%D0%B2%D0%B8%D1%82%D1%8C%D0%B4%D0%BE%D0%BC%D0%B5%D0%BD%D0%BA%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8E(%D0%BF%D1%80%D0%BE%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%D1%81%D0%B0%D0%B9%D1%82%D0%B2%D0%91%D0%9EID2)]
                                    ## Appid и Secret Key прописывает в реестре, путь к основному узлу (actiondigital|systemSite|id2Info)
                                    ## Проверить на прототипе
                                    # Если данные нужно прописать для нового издания существующей системы:
                                    ## Решить задачу в соответствии с [руководством|https://conf.action-media.ru/pages/viewpage.action?pageId=65382812#id-%D0%A0%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE%D0%BF%D0%BE%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B5%D0%98%D0%942%D0%B4%D0%BB%D1%8F%D0%92%D0%A1%D0%A1-%D0%94%D0%BE%D0%B1%D0%B0%D0%B2%D0%B8%D1%82%D1%8C%D0%B4%D0%BE%D0%BC%D0%B5%D0%BD%D0%BA%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8E(%D0%BF%D1%80%D0%BE%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%D1%81%D0%B0%D0%B9%D1%82%D0%B2%D0%91%D0%9EID2)]
                                    # Прописать publication code в событиях для ID2 в реестре`
});
    epicTeamTasks.push({ "summary":"Реализовать стандартную клиентскую часть. Изменение реестра",
    "description":`Необходимо в реестре произвести настройку изданий\n
                                    * [Перечень узлов для изменения|https://docs.google.com/spreadsheets/d/1sO4FJNMtkUt_ynPhs-yj8gCSBnNEkE8MjFxJxIHCWIs/edit?copiedFromTrash#gid=0]
                                    ** В каких-то случаях нужно добавить копию узла, в каких-то случаях добавить перезагрузку.
                                    * Настроить плашку доступа к другому изданию (добавить в реестр actiondigital|systemSite|authorization|anotherPubAccess|settings|pubs все издания системы через пробел, выставить соответствующую перегрузку)`
});
    epicTeamTasks.push({ "summary":"Реализовать стандартную клиентскую часть. Название системы для СМС",
    "description":`Необходимо добавить название системы для СМС в узел actiondigital|services|sms-service|sender|title`
});
    epicTeamTasks.push({ "summary":"Универсальный сервис ссылок. Добавить новые продукты",
    "description":`Необходимо добавить новые продукты в соответствии с [регламентом|https://conf.action-media.ru/pages/viewpage.action?pageId=259693465#id-Универсальныйсервисссылок-Регламентдобавленияновыхпродуктов]`
});
    epicTeamTasks.push({ "summary":"Заведение виджетов ЛК. Проверка",
    "description":`Добавить продукту виджеты в БО ЛК в соответствии с инструкцией: https://conf.action-media.ru/pages/viewpage.action?pageId=208914315`
});
    var newIssuesData = {
    "issueUpdates": []
}
    // собираем итоговые данные для запроса
    for (let x of epicTeamTasks) {
    var newIssueData = {
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.support.dev},
    "summary": x.summary,
    "description": x.description,
    [vGlobal.jira.fields.epicLink]: value,
    "project":{"key":"OAM"},
    "priority": {"id":vGlobal.jira.fields.issuePriorities.support.high}
}
}
    newIssuesData.issueUpdates.push(newIssueData);
}

    let url = new URL(vGlobal.jira.postIssueBulk);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'CreateSys');
    url.searchParams.set('ADetail', 'CreateIssue');
    fetch(url, {
    method: 'post',
    headers: {
    "Content-type": "application/json; charset=utf-8"
},
    body: JSON.stringify(newIssuesData)
})
    .then(
    function(response) {
    if (response.status != "201") {
    Smart_log(ln+`Ошибка при создании задач в эпике поддержки status = ${response.status}`);
    response.json().then(function(data) {
    Smart_log(ln+`error ${JSON.stringify(data)}`);
});
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: `Внимание!`,
    body: "Ошибка при создании задач в эпике поддержки",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
} else {
    response.json().then(function(data) {
    Smart_log(ln+`Задачи в эпике поддержки успешно созданы`);
    AJS.flag({
    type: 'success', // success, info, warning, error
    title: `Эпик ${value}`,
    body: "Задачи в эпике поддержки успешно созданы",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
    //Smart_log(ln+`value ${JSON.stringify(data)}`);
})
}
}
    )
    .catch(function (error) { Smart_log(ln+`Ошибка при создании задач в эпике поддержки ${error}`); });

    log_level--;
}
    function CreateNewSystemTaskByTeamEpic(value){
    var ln = "CreateNewSystemTaskByTeamEpic: ";
    log_level++;
    Smart_log(ln+`Создаем эпик в проекте разработки для инициативы ${value.summary}`);
    const requests = [];
    /*
    "teams":{
                     "SS":"11830", // vGlobal.jira.fields.teams.SS
                     "SEARCH":"11855",
                     "WARM":"11856"
    */
    var newIssueData = {
    "data":{
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.dev.epic},
    "summary": current_issue_data.summary,
    "description": "Необходимо реализовать функционал согласно требованиям",
    [vGlobal.jira.fields.epicName]:current_issue_data[vGlobal.jira.fields.epicName]
}
},
    "url":value.request.url
}

    switch(value.team) {
    case "11830": { // SS
    newIssueData.data.fields["project"] = {"key":"SS"}
    break; }
    case "11855": { // SEARCH
    newIssueData.data.fields["project"] = {"key":"SRCH"}
    break; }
    case "11856": { // WARM
    newIssueData.data.fields["project"] = {"key":"WARM"}
    break; }
}
    value.devEpic["request"] = newIssueData;
    //Smart_log(ln+`response ${JSON.stringify(newIssueData)}`);
    requests.push(uRequestPost(value.devEpic));

    Promise.all(requests).then((values) => {
    //Smart_log(ln+`value.devEpic ${JSON.stringify(value.devEpic)}`);
    if (value.devEpic.response.stateCode == "201"){
    // создаем линк с инициативой
    var urlParams = [{"key":"AProcess", "value":"ABanner"},
{"key":"ABProcess", "value":"CreateSys"},
{"key":"ADetail", "value":"CreateIssueLink"}]
    uLinkIssue(value.response.data.key, value.devEpic.response.data.key, "Developes",urlParams)

    // создаем задачи в команды
    CreateNewSystemTaskByTeamEpicTasks(value)

    // если эпик в проекте SS успешно создался, то
    if (value.devEpic.request.data.fields.project.key == "SS"){
    // создаем эпик в проекте поддержки и задачи в нем
    CreateNewSystemTaskBySupportEpic(value);
    // создаем ресурсные задачи в портфеле проектов
    CreateNewSystemIniciatuveSubTask(value);
}
} else {
    Smart_log(ln+`Ошибка при создании эпика разработки status = ${value.devEpic.response.stateCode}`);
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: `Эпик в проекте ${value.devEpic.request.data.fields.project}`,
    body: "Ошибка при создании эпика разработки",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
}
});

    log_level--;
}
    function CreateNewSystemIniciatuveSubTask(value){
    var ln = "CreateNewSystemIniciatuveSubTask: ";
    log_level++;
    Smart_log(ln+`Создаем подзадачи в инициативе SS`);

    var epicTasks = [];
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.backendSub},
    "summary":"[B] Разработка 1/2",
    "timetracking": {"originalEstimate":"12"}}
});
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.backendSub},
    "summary":"[B] Разработка 2/2",
    "timetracking": {"originalEstimate":"8"}}
});
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.backendSub},
    "summary":"[B] Публикация",
    "timetracking": {"originalEstimate":"4"}}
});
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.frontendSub},
    "summary":"[F] Разработка",
    "timetracking": {"originalEstimate":"12"}}
});
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.frontendSub},
    "summary":"[F] Публикация",
    "timetracking": {"originalEstimate":"2"}}
});
    epicTasks.push({
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.bcklg.testSub},
    "summary":"[T] Тестирование",
    "timetracking": {"originalEstimate":"6"}}
});

    var newIssuesData = {
    "issueUpdates": []
}
    // собираем итоговые данные для запроса
    for (let x of epicTasks) {
    x.fields["project"] = {"key":"BCKLG"}
    x.fields["description"] = "Учет времени"
    x.fields["parent"] = {"key":value.response.data.key},
    x.fields["components"] = [{"id": vGlobal.jira.fields.components.SS}]
    x.fields[vGlobal.jira.fields.team]= {"id":vGlobal.jira.fields.teams.SS}
    x.fields[vGlobal.jira.fields.businessCase] = {"id":vGlobal.jira.fields.businessCases.bigPicture}
    newIssuesData.issueUpdates.push(x);
}

    let url = new URL(vGlobal.jira.postIssueBulk);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'CreateSys');
    url.searchParams.set('ADetail', 'CreateIssue');
    fetch(url, {
    method: 'post',
    headers: {
    "Content-type": "application/json; charset=utf-8"
},
    body: JSON.stringify(newIssuesData)
})
    .then(
    function(response) {
    if (response.status != "201") {
    Smart_log(ln+`Ошибка при создании подзадач в инициативе SS status = ${response.status}`);
    response.json().then(function(data) {
    Smart_log(ln+`error ${JSON.stringify(data)}`);
});
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: `Внимание!`,
    body: "Ошибка при создании подзадач в инициативе SS",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
} else {
    response.json().then(function(data) {
    Smart_log(ln+`Подзадачи в инициативе SS успешно созданы`);
    //Smart_log(ln+`value ${JSON.stringify(data)}`);
})
}
}
    )
    .catch(function (error) { Smart_log(ln+`Ошибка при создании подзадач в инициативе SS ${error}`); });

    log_level--;
}
    function CreateNewSystemTaskByTeamEpicTasks(value){
    var ln = "CreateNewSystemTaskByTeamEpicTasks: ";
    log_level++;
    Smart_log(ln+`Создаем задачи в эпике разработки ${value.summary} - ${value.devEpic.response.data.key}`);

    // создаем задачи в команды
    //const requests = [];
    var epicTeamTasks = [];
    switch(value.team) {
    case "11830": { // SS
    epicTeamTasks.push({ "summary":"Завести издания для рассылок",
    "description":`# Завести издания для рассылок (Подключить механизм подписки/отписки в БО и на сайтах СС)\n
# Прописать издания для отписок\n
# Обеспечить корректное формирование файла для Сендсей и отправку корректных подписок`
    ,"estimate":2
});
    epicTeamTasks.push({ "summary":"Подключить оценочную нападалку",
    "description":`Подключить оценочную нападалку\n
1) добавить в forsiteservice\Xml\Survey\GetSurvey\NN.xml например 42.xml\n
2) добавить номера новых нападалок для новых Систем sitess\App_Code\SiteCore\BLL\Requests\Site\Survey\CreateResponse.cs\n
список Id оценочных нападалок npsList = new[] { 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 31, 32, 33, 34, 35, 36, 37 };\n
3) в \\sitess\\xml\\bll\\site\\letter\\common.xml прописать новые системы`
    ,"estimate":3
});
    epicTeamTasks.push({ "summary":"Сделать страницу о системе",
    "description":`Для новой системы/издания необходимо создать промо-страницу для подключения iFrame\n
# Обязательные пути реестра (https://docs.google.com/spreadsheets/d/1sO4FJNMtkUt_ynPhs-yj8gCSBnNEkE8MjFxJxIHCWIs/edit?copiedFromTrash#gid=0)`
});
    epicTeamTasks.push({ "summary":"Добавить клиентские изменения:  js, xsl и реестр",
    "description":`Необходимо:\n
# Проверить\\дополнить реестр (если будет нужно) после того, как поддержка его заполнит\n
# Внести общие правки в клиентский код: добавить настройки, добавить промо, правки xsl\\js \n
# Не забыть подключить счетчик (задача в эпике поддержки)`
    ,"estimate":8
});
    epicTeamTasks.push({ "summary":"Наполнить метаданными реестр, конфиг, БД, ДНС",
    "description":`Необходимо:\n
* развернуть ветку реестра на отдельном прототипе\n
* занести в реестр\n
** номер издания, название издания, хосты\n
** коды публикации добавить в actiondigital|systemSite|preferences|publicationCodes\n
** версию продукта добавить в actiondigital|services|customer-service|accessMap|versionsVsPubs (добавить до версий продукта Актион360)\n
** добавить алиасы систем/изданий и флаги хоста в actiondigital|systemSite|meta|systAndPubsAndHostFlags\n
** в реестре в разделе Схема аутентификации добавить перегрузку системы на значение ad\n
** вызвать метод http://customer-service/admin/apply-registry-to-meta\n
** проверить в БД customer/accessmap/versionVsPub что появилось значение\n
** настройка customercontent-serviceM на соответствующий registryN\n
** настройка SiteSS на customercontent-serviceM и customercontent-serviceM на соответствующий registryN\n
* сформировать хосты с помощью консольной программы [https://gitlab.action-media.ru/ss/prokcreater/-/merge_requests/1] для всех 100 dev прототипов и настроить биндинги для всех 100 dev прототипов в C:/Windows/System32/inetsrv/config/applicationHost.config.  Прописать биндинги для ТБД, ПБД SRV17\n
* Занести биндинги в [https://docs.google.com/spreadsheets/d/19pTgU58Q69-AWLjHsD2xHc5fUYQEg9KnHSQJ2stuWZQ/edit#gid=0]                                вызвать метод синхронизации в БД из реестра в customer-service (только для прок1 [http://customer-service/admin/apply-registry-to-meta])\n
* Настроить прототип сайта СС (в appSettings.config <add key="cs.registry" value="http://registry2"/>), customer-service, customer-service-new на registry2\n
* Добавить продукты в (srv15)sqld8.NBSERVICE_MP/dbo.LOT по аналогии с pub_id= 83\n
** ДД_[код издания], ДДП_[код издания], ДДПР_[код издания], ОЗ_[код издания], ПОД[код издания]`
    ,"estimate":6
});
    epicTeamTasks.push({ "summary":"Подключить заведенные ресурсы в метабазе PG",
    "description":`Для нового издания необходимо подключить заведенные ресурсы в метабазе PG sps_content_backend_meta\n
Данные добавлять через миграции в sps-content-service.\n
Добавить соответствующие строки (скопировать с системы донора) в Meta/DbPub.cs, Meta/DbPubDiv.cs, Meta/DbPubDivRubricatorLnk.cs, Meta/DbPubModuleLnk.cs, Meta/DbPubPubDivLnk.cs \n
+ склонировать документы согласно требованиям\n
\n
{code:java}\n
update "public".pub_group_lnk\n
Set pub_ids = array_append(pub_ids,203)\n
where pub_ids @> ARRAY[210];\n
\n
insert INTO "public".doc_lnk_exclude (pub_id, module_id, id, link_id)\n
select 203 as pub_id\n
, module_id, id, link_id\n
from "public".doc_lnk_exclude p --limit 10\n
where p.pub_id = 210\n
and not exists (select * from "public".doc_lnk_exclude e where e.pub_id = p.pub_id and e.module_id=p.module_id and e.id=p.id and e.link_id=p.link_id );\n
\n
SELECT REPLACE(p.properties::text, ', 68,', ', 68, 200,') newprop,*\n
-- drop table JBTEST\n
into JBTEST\n
from "public".document_toc p\n
CROSS JOIN LATERAL json_to_recordset((p.properties::json -> 'TopicList')::json)\n
AS list("Topic" TEXT, "TopicId" INT, "PubIds" INTEGER[])\n
where p.properties is not NULL\n
and 210=ANY(list."PubIds"::INTEGER[])\n
\n
UPDATE JBTEST p\n
SET properties = p1.newprop::json\n
From JBTEST p1\n
where p.module_id = p1.module_id and p.id=p1.id --and p."TopicId"=p1."TopicId"\n
\n
UPDATE "public".document_toc d\n
SET properties =jsonb_set(p1.properties, '{TopicList ,0, PubIds}', p1.newpubs)\n
From JBTEST p1\n
where d.module_id = p1.module_id and d.id=p1.id\n
\n
drop table JBTEST\n
------------------\n
insert INTO "public".sp_doc_statistics_data (pub_id, statistics_id, total_documents_count, new_documents_count, updated_on)\n
select 70 as pub_id\n
, statistics_id, total_documents_count, new_documents_count, now()\n
from "public".sp_doc_statistics_data p\n
where p.pub_id = 23;\n
update "public".pub_group_lnk\n
Set pub_ids = array_append(pub_ids,220)\n
where pub_ids @> ARRAY[9];\n
insert INTO "public".doc_lnk_exclude (pub_id, module_id, id, link_id)\n
select 220 as pub_id\n
, module_id, id, link_id\n
from "public".doc_lnk_exclude p --limit 10\n
where p.pub_id = 9\n
{code}\n`
    ,"estimate":3
});
    epicTeamTasks.push({ "summary":"Доработать публикатор контента",
    "description":`Для нового издания необходимо доработать публикатор контента`
    ,"estimate":1
});
    epicTeamTasks.push({ "summary":"Доработать публикатор поискового индекса",
    "description":`Для нового издания необходимо доработать публикатор поискового индекса`
    ,"estimate":1
});
    epicTeamTasks.push({ "summary":"Прописать названия разделов в реестре",
    "description":`Для нового издания необходимо прописать названия разделов в реестре`
    ,"estimate":1
});
    epicTeamTasks.push({ "summary":"Оценить эпик. Фронт",
    "description":`Произвести декомпозицию и оценку эпика с учетом уже заведенных задач\n
                                Распределить задачи по разработчикам`
});
    epicTeamTasks.push({ "summary":"Оценить эпик. Бэк",
    "description":`Произвести декомпозицию и оценку эпика с учетом уже заведенных задач\n
                                Распределить задачи по разработчикам`
});
    epicTeamTasks.push({ "summary":"Слияние и публикация. Бэк",
    "description":`Слияние и публикация`
    ,"estimate":4
});
    epicTeamTasks.push({ "summary":"Слияние и публикация. Фронт",
    "description":`Слияние и публикация`
    ,"estimate":2
});
    epicTeamTasks.push({ "summary":"Закрыть издание заглушкой",
    "description":`Перенести систему в ssgag`
});
    epicTeamTasks.push({ "summary":"Снять заглушку у системы",
    "description":`Перенести систему из ssgag`
});
    epicTeamTasks.push({ "summary":"Завести боевые url и биндинги",
    "description":`Завести боевые url и биндинги для нового издания`
});
    epicTeamTasks.push({ "summary":"Настроить отчеты в программе статистики (ПС)",
    "description":`Проверить, что данные пишутся в программу статистики. Настроить и проверить основные отчёты (Ковалева Т.)`
});
    break; }
    case "11855": { // SEARCH точно нужна задача на включение поиска, и две задачи на индексацию - экспертных, и нпд
    epicTeamTasks.push({ "summary":"Подключить поиск",
    "description":`Для нового издания необходимо подключить поиск по документам и в судебной практике\n
                                # Подключить на сайте поиск по документам\n
                                # Завести в БД поисковые теги, подсказки, эталоны\n\n
                                Если запускаем несколько систем/изданий одновременно, то для них подключение поиска на каждую по задаче, а индексацию делаем одну ЭМ и одну НПД `
});
    epicTeamTasks.push({ "summary":"Индексация экспертных материалов",
    "description":`Необходимо провести индексацию ЭМ`
});
    epicTeamTasks.push({ "summary":"Индексация НПД",
    "description":`Необходимо провести индексацию НПД`
});
    break; }
    case "11856": { // WARM
    epicTeamTasks.push({ "summary":"Завести метаданные для новой системы/издания",
    "description":`Завести метаданные для новой системы/издания`
});
    epicTeamTasks.push({ "summary":"Настроить стартовые для новой системы/издания",
    "description":`Настроить стартовые страницы для новой системы/издания`
});
    epicTeamTasks.push({ "summary":"Настроить контент для новой системы/издания",
    "description":`Настроить контент для новой системы/издания`
});
    break; }
}

    var newIssuesData = {
    "issueUpdates": []
}
    // собираем итоговые данные для запроса
    for (let x of epicTeamTasks) {
    var newIssueData = {
    "fields": {
    "issuetype": {"id": vGlobal.jira.fields.issueTypes.dev.task},
    "summary": x.summary,
    "description": x.description,
    [vGlobal.jira.fields.epicLink]: value.devEpic.response.data.key
}
}
    switch(value.team) {
    case "11830": { // SS
    newIssueData.fields["project"] = {"key":"SS"}
    break; }
    case "11855": { // SEARCH
    newIssueData.fields["project"] = {"key":"SRCH"}
    break; }
    case "11856": { // WARM
    newIssueData.fields["project"] = {"key":"WARM"}
    break; }
}
    newIssuesData.issueUpdates.push(newIssueData);
}

    let url = new URL(vGlobal.jira.postIssueBulk);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'CreateSys');
    url.searchParams.set('ADetail', 'CreateIssuesBulk');
    fetch(url, {
    method: 'post',
    headers: {
    "Content-type": "application/json; charset=utf-8"
},
    body: JSON.stringify(newIssuesData)
})
    .then(resolve => {
    if ( resolve.status != "201") {
    Smart_log(ln+`Ошибка при создании задач в эпике разработки status = ${resolve.status}, ${value.devEpic.response.data.key}`);
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: `Эпик ${value.devEpic.response.data.key}`,
    body: "Ошибка при создании задач в эпике разработки",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
} else {
    Smart_log(ln+`Задачи в эпике ${value.devEpic.response.data.key} успешно созданы`);
    AJS.flag({
    type: 'success', // success, info, warning, error
    title: `Эпик ${value.devEpic.response.data.key}`,
    body: "Задачи упешно созданы",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
}
})
    .catch(function (error) { Smart_log(ln+`Ошибка при создании задач в эпике разработки ${error}`); });

    log_level--;
}
    function CreateNewSystemCreateTasks(){
    var ln = "CreateNewSystemCreateTasks: ";
    log_level++;

    const requests = [];
    // подготовка массива данных для создания задач
    // создание инициатив
    var newSysTasksDataIniciative = [
{ // инициатива в справочные системы
    "project":"BCKLG",
    "issueTypeId":vGlobal.jira.fields.issueTypes.bcklg.iniciative,
    "epicLink":current_issue_data.key, // указываем эпик
    "summary":"[SS] "+current_issue_data.summary,
    "description":"Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания. Каждая команда самостоятельно осуществляет DoD-инг свой части.",
    "componentId":vGlobal.jira.fields.components.SS,
    "businessCaseId":vGlobal.jira.fields.businessCases.bigPicture,
    "team":vGlobal.jira.fields.teams.SS,
    "request":{},
    "response":{
    "data":{},
    "stateCode":""
},
    "devEpic":{}
},
{ // инициатива в команду поиска
    "project":"BCKLG",
    "issueTypeId":vGlobal.jira.fields.issueTypes.bcklg.iniciative,
    "epicLink":current_issue_data.key, // указываем эпик
    "summary":"[SEARCH] "+current_issue_data.summary,
    "description":"Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания. Каждая команда самостоятельно осуществляет DoD-инг свой части.",
    "componentId":vGlobal.jira.fields.components.SEARCH,
    "businessCaseId":vGlobal.jira.fields.businessCases.bigPicture,
    "team":vGlobal.jira.fields.teams.SEARCH,
    "request":{},
    "response":{
    "data":{},
    "stateCode":""
},
    "devEpic":{}
},
{ // инициатива в команду вебарма
    "project":"BCKLG",
    "issueTypeId":vGlobal.jira.fields.issueTypes.bcklg.iniciative,
    "epicLink":current_issue_data.key, // указываем эпик
    "summary":"[WARM] "+current_issue_data.summary,
    "description":"Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания. Каждая команда самостоятельно осуществляет DoD-инг свой части.",
    "componentId":vGlobal.jira.fields.components.WARM,
    "businessCaseId":vGlobal.jira.fields.businessCases.bigPicture,
    "team":vGlobal.jira.fields.teams.WARM,
    "request":{},
    "response":{
    "data":{},
    "stateCode":""
},
    "devEpic":{}
}
    ];
    var url = new URL(vGlobal.jira.postIssue);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'CreateSys');
    url.searchParams.set('ADetail', 'CreateIniciative');
    // запускаем создание инициатив
    for (let x of newSysTasksDataIniciative) {
    var newIssueData = {
    "data":{
    "fields": {
    "issuetype": {"id": x.issueTypeId},
    "summary": x.summary,
    "project": {"key":x.project},
    "description": x.description,
    "components": [{"id": x.componentId}],
    [vGlobal.jira.fields.team]:{"id":x.team},
    [vGlobal.jira.fields.businessCase]:{"id":x.businessCaseId},
    [vGlobal.jira.fields.epicLink]: x.epicLink
}
},
    "url":url
}
    x.request = newIssueData;
    requests.push(uRequestPost(x));
    /*
    const response = fetch(url, {
        method: 'POST', // или 'PUT'
        body: JSON.stringify(newIssueData.data), // данные могут быть 'строкой' или {объектом}!
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        Smart_log(ln+`data ${JSON.stringify(result)}`);
    });*/
    /*deferreds.push($.ajax({
        url: url, // указываем URL
        type: "POST",
        data: JSON.stringify(newIssueData.data), // данные, которые отправляем на сервер
        contentType: "application/json; charset=utf-8",
        async: newIssueData.isAsync,
        //dataType: "json", // тип данных загружаемых с сервера
        //processData: false,
        success: function (data) {
            x.result.data = data;
            x.result.state = true;
            x.result.stateId = "1";
            Smart_log(`${ln} deferreds success`);
        },
        error: function(dataError){
            x.result.data = dataError;
            x.result.stateId = "2";
            Smart_log(`${ln} deferreds error`);
            //Smart_log(`${ln} ${JSON.stringify(data)}`);
        },
        complete: function(){
        }
    }));*/
}
    Promise.all(requests).then((values) => {
    /*values.forEach((response) => {
        if (response.response !== null) {
            response.json().then((data) => {
                Smart_log(ln+`response ${JSON.stringify(data)}`);
                Smart_log(ln+`response ... ${response.status}`);
            });
            //Smart_log(ln+`summary ${response.data.fields.summary}`);

        } else {
            Smart_log(ln+`Возникла фатальная ошибка при создании инициатив`);
             AJS.flag({
                 type: 'error', // success, info, warning, error
                 title: 'Возникла фатальная ошибка при создании инициатив',
                 body: "",
                 close: "manual", //  "manual", "auto" and "never"
                 persistent: false
             });
        }
    });*/
    //Smart_log(ln+`response ALL`);
    // для каждой инициативы мы создаем задачи по командам
    for (let x of newSysTasksDataIniciative) {
    if (x.response.stateCode == "201") CreateNewSystemTaskByTeamEpic(x);
}
});

    /*    $.when.apply($, deferreds).then(
            // все запросы успешно выполнены
            function () {
                Smart_log(`${ln} все запросы успешно выполнены done`);
                //Smart_log(ln+`data ${JSON.stringify(newIssueData.data_result)}`);
                for (let x of newSysTasksDataIniciative) {
                    //if (x.result.state == false) { messageError+=`${x.summary} <br> ${JSON.stringify(x.result.data.responseText)} <br>` }
                    //Smart_log(ln+`done data ${x.summary}  state=${x.result.state} stateId=${x.result.stateId}`);
                    //Smart_log(ln+`done data ${JSON.stringify(x.result.data)}`);
                }
            },
            // часть запросов выполнена с ошибкой
            function (defData) {
                Smart_log(`${ln} часть запросов выполнена с ошибкой fail`);
                var messageError = "";
                //Smart_log(ln+`fail defData ${JSON.stringify(defData)}`);
                //for (let x of newSysTasksDataIniciative) {
                    //if (x.result.state == false) { messageError+=`${x.summary} <br> ${JSON.stringify(x.result.data.responseText)} <br>` }
                    //Smart_log(ln+`fail data ${x.summary} state=${x.result.state} stateId=${x.result.stateId}`);
                    //Smart_log(ln+`fail data ${JSON.stringify(x.result.data)}`);
                    //Smart_log(ln+`fail defData ${JSON.stringify(defData)}`);
                //}
                AJS.flag({
                    type: 'error', // success, info, warning, error
                    title: 'Не удалось создать часть инициатив',
                    body: messageError,
                    close: "manual", //  "manual", "auto" and "never"
                    persistent: false
                });
                //return $.when();
            });
    */
    //newSysTasksData["SS"]
    log_level--;
}

    function AddBodyHTML(){
    var ln = "AddBodyHTML: ";
    log_level++;


    var dialog = `
<section id="demo-dialog" class="aui-dialog2 aui-dialog2-xlarge aui-layer demo-dialog-smart" role="dialog" aria-hidden="true">
<header class="aui-dialog2-header">
    <h2 id="smart-dlg-initiative-key">...</h2>
</header>
<aui-progressbar id="smart-dialog-progress" value="0" max="0"></aui-progressbar>
<div class="aui-dialog2-content">

    <fieldset id="fieldset_backend" class="smart-fieldset">
        <legend>Backend</legend>
        <button id="btn_backend_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"backend">Добавить</button>
    </fieldset>
    <fieldset id="fieldset_frontend" class="smart-fieldset">
        <legend>Frontend</legend>
        <button id="btn_frontend_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"frontend">Добавить</button>
    </fieldset>
    <fieldset id="fieldset_req" class="smart-fieldset">
        <legend>Requirements</legend>
        <button id="btn_req_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"req">Добавить</button>
    </fieldset>
    <fieldset id="fieldset_test" class="smart-fieldset">
        <legend>Testing</legend>
        <button id="btn_test_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"test">Добавить</button>
    </fieldset>
    <fieldset id="fieldset_design" class="smart-fieldset">
        <legend>Design</legend>
        <button id="btn_design_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"design">Добавить</button>
    </fieldset>
    <fieldset id="fieldset_other" class="smart-fieldset">
        <legend>Прочее</legend>
        <form class="aui">
            <div class="checkbox">
                <input id="smart_can_create_epic" class="checkbox" type="checkbox" name="checkBoxOne" id="checkBoxOne">
                <label for="checkBoxOne">Создать эпик в проекте разработки</label>
            </div>
            <input id="smart_epic_short_name" class="text medium-field" type="text" name="EpicTaskName" placeholder="Короткое имя" value="">
        </form>
    </fieldset>

</div>
<footer class="aui-dialog2-footer">
    <div class="aui-dialog2-footer-actions">
        <button id="smart-dialog-create-button" class="aui-button aui-button-primary">Make it so</button>
        <button id="smart-dialog-cancel-button" class="aui-button aui-button-link">Отмена</button>
    </div>
</footer>
</section>

<style>
.demo-dialog-smart {
   width: 900px;
}

.smart-fieldset{
	border-width: 1px;
    margin-bottom: 15px;
}

</style>
`;

    $("body").append(dialog);
    log_level--;
}
    function SmartDlgSetButtonStateDisable(value){
    $("#smart-dialog-create-button").prop('disabled', value);
    $("#smart-dialog-cancel-button").prop('disabled', value);
}
    function SmartDlgGetIniciativeDataFromObj(obj){
    var ln = "SmartDlgGetIniciativeDataFromObj: ";
    log_level++;

    var notifyMessage = "";

    //Smart_log(ln+`data input ${JSON.stringify(obj)}`);

    if (obj) {
    if ('fields' in obj) {
    if ('components' in obj.fields && obj.fields.components != null) {
    current_issue_data["components"] = obj.fields.components;
    // чистим данные для последеюущего прозрачного использования при создании задачи
    for (let component of current_issue_data.components) {
    delete component.self;
    delete component.name;
}
    /*
    fields."components": [
      {
        "self": "https://jira.action-media.ru/rest/api/2/component/10014",
        "id": "10014",
        "name": "Справочные системы"
      },
      {
        "self": "https://jira.action-media.ru/rest/api/2/component/10014",
        "id": "10014",
        "name": "Справочные системы"
      }
    ]
    */
} else {
    notifyMessage += "<br>В инициативе не заданы компоненты";
    Smart_log(ln+`В инициативе не заданы компоненты`);
}
    // получаем название
    if ('summary' in obj.fields && obj.fields.summary != null) {
    current_issue_data["summary"] = obj.fields.summary;
} else {
    current_issue_data["summary"] = "";
    notifyMessage += "<br>В инициативе нет наименования"
    Smart_log(ln+`В инициативе нет наименования`);
}
    // получаем команду
    if ('customfield_11601' in obj.fields && obj.fields.customfield_11601 != null) {
    current_issue_data["customfield_11601"] = obj.fields.customfield_11601;
    current_issue_data["teamCode"] = obj.fields.customfield_11601.value;
    delete current_issue_data.customfield_11601.self;
    delete current_issue_data.customfield_11601.value;
    /*
    fields."customfield_11601": {
      "self": "https://jira.action-media.ru/rest/api/2/customFieldOption/11830",
      "value": "SS",
      "id": "11830"
    }
    */
} else {
    current_issue_data["teamCode"] = "";
    notifyMessage += "<br>В инициативе не задана команда"
    Smart_log(ln+`В инициативе не задана команда`);
}
    // получаем значение поля "Добавить в"
    if ('customfield_11610' in obj.fields && obj.fields.customfield_11610 != null) {
    current_issue_data["customfield_11610"] = obj.fields.customfield_11610;
    delete current_issue_data.customfield_11610.self;
    delete current_issue_data.customfield_11610.value;
    /*
    fields."добавить в"
        "customfield_11610": {
          "self": "https://jira.action-media.ru/rest/api/2/customFieldOption/11851",
          "value": "портфель проектов",
          "id": "11851"
        }
    */
} else {
    notifyMessage += "<br>Не определен портфель проектов"
    Smart_log(ln+`Не определен портфель проектов`);
}
    // дата начала задачи
    if ('customfield_11504' in obj.fields && obj.fields.customfield_11504 != null) {
    current_issue_data["customfield_11504"] = obj.fields.customfield_11504; // "customfield_11504": "2020-09-28"
} else {
    Smart_log(ln+`Ошибка. В инициативе отсутствует дата старта obj.fields.customfield_11504 == null`);
}
    //Smart_log(ln+`Parsing complete`);
    if (notifyMessage) {
    AJS.flag({
    type: 'warning', // success, info, warning, error
    title: 'Внимание!',
    body: notifyMessage,
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
}
    //Smart_log(ln+`data ${JSON.stringify(current_issue_data)}`);
} else Smart_log(ln+`Ошибка. obj.fields == null`);
} else Smart_log(ln+`Ошибка. Данные не переданы на вход`);

    //Smart_log(ln+`data ${JSON.stringify(current_issue_data)}`);

    log_level--;
}
    function SmartDlgDisableCreateEpic(value){
    if (value) {
    var createEpicCheckBox = $('#smart_can_create_epic');
    createEpicCheckBox.prop('checked',false);
    createEpicCheckBox.prop('disabled',true);
    $("#smart_epic_short_name").prop('disabled',true);
} else {
    $('#smart_can_create_epic').prop('disabled',false);
    $("#smart_epic_short_name").prop('disabled',false);
}
}
    function SmartDlgShow() {
    var ln = "SmartDlgShow: ";
    log_level++;
    // считываем данные инициативы для дальнейшего использования
    let url = new URL(jiraAPIGetIssue+current_issue_data.key);
    url.searchParams.set('fields', 'summary,components,customfield_11601,customfield_11610,customfield_11504');
    //url.searchParams.set('ABDetail', 'AB_SmartDlgShow');
    //url.searchParams.set('CustomSource', 'AnnouncementBanner');
    $.ajax({
    url: url, // указываем URL
    type: "GET", // HTTP метод, по умолчанию GET
    data: {"AProcess": 'ABanner', 'ABProcess':'SmartDlg', 'ADetail':'GetIniciative'}, // данные, которые отправляем на сервер CustomSource=AnnouncementBanner ABDetail=AB_SmartDlgShow
    dataType: "json", // тип данных загружаемых с сервера
    async: false,
    success: function (data) {
    //Smart_log(ln+`data ${JSON.stringify(data)}`);
    SmartDlgGetIniciativeDataFromObj(data);
    // разблокируем кнопку создания задач
    SmartDlgSetButtonStateDisable(false);
    //Smart_log(ln+`Данные по инициативе ${current_issue_data.key} успешно получены`);
},
    error: function(){
    AJS.banner({
    body: `Не удалось получить данные по задаче <strong>${current_issue_data.key}</strong>. Попробуйте перезагрузить страницу.`
});
    Smart_log(`${ln} Ошибка выполнения GET запроса`);
    Smart_log(`${ln} url: ${url}`);
}
});

    // очищаем список созданых ранее задач
    current_issue_data["newIssueList"] = []
    // добавляем в описание код задачи
    $("#smart-dlg-initiative-key").text(`Добавление подзадач в инициативу ${current_issue_data.key}`);
    // блокируем кнопку до получения данных по задаче
    // отключили async
    //SmartDlgSetButtonStateDisable(true);
    // скрываем прогресс бар
    $("#smart-dialog-progress").hide();
    // проверяем, что команда задана, иначе блокируем создание эпика
    if (current_issue_data.teamCode.length == 0) {
    SmartDlgDisableCreateEpic(true);
} else {
    // проверяем, что у нас есть маппинг команды на код проекта
    if (SmartDlgGetProjectByTeam(current_issue_data.teamCode).length == 0) {
    SmartDlgDisableCreateEpic(true);
    AJS.flag({
    type: 'warning', // success, info, warning, error
    title: 'Нет маппинга для команды',
    body: "Не удалось определить проект разработки по коду команды. Создание эпика невозможно",
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});
} else {
    SmartDlgDisableCreateEpic(false);
}
}

    // проверяем, что диалог еще не отображался и навешиваем обработчки
    if (current_issue_data.isSmartDlgFirst) {
    // назначаем обработчики кнопкам диалога
    AJS.$("#smart-dialog-cancel-button").click(function (e) {
    e.preventDefault();
    AJS.dialog2("#demo-dialog").hide();
});
    $("#smart-dialog-create-button").click(function() { SmartDlgCreateTasks(); });
    $("#btn_backend_add").click(function() { SmartDlgAddNewTask("backend"); });
    $("#btn_frontend_add").click(function() { SmartDlgAddNewTask("frontend"); });
    $("#btn_req_add").click(function() { SmartDlgAddNewTask("req"); });
    $("#btn_test_add").click(function() { SmartDlgAddNewTask("test"); });
    $("#btn_design_add").click(function() { SmartDlgAddNewTask("design"); });

    current_issue_data.isSmartDlgFirst = false;
}
    // отображаем диалог
    AJS.dialog2("#demo-dialog").show();

    log_level--;
}
    function SmartDlgCreateTasks(){
    var ln = "CreateSmartTasks: ";
    log_level++;
    // формируем массив данных для создания задач
    var tasks_data = [];
    // получаем все елементы с данными (кроме эпика в проекте разработки)
    var $newTaskNameElemenst = $(".smart-task-name");
    if ($newTaskNameElemenst.length>0) {
    // обходим только элементы с именем задачи и уже на основе их индекса работаем с другими
    $newTaskNameElemenst.each(function(indx){
    var index = $(this).attr("data-smart-id");
    var issue_type = $(this).attr("data-issue-type");
    var task_name = $(this).val(); if (task_name.length == 0) task_name = "Имя задачи не задано";
    var task_estimate = $(`.${issue_type} .smart-task-estimate[data-smart-id="${index}"]`).val(); if (task_estimate.length == 0) task_estimate = 0; // $newTaskEstimateElemenst.find("#input_estm_subtask_backend*").length; //$(".edit-element[smart-index2='2']").length;   [data-smart-id="${index}"]
    var task_assignee = $(`.${issue_type} .smart-task-assignee[data-smart-id="${index}"]`).val();
    //Smart_log(`${ln} index ${index} task_name ${task_name} task_estimate ${task_estimate}`);
    tasks_data.push({"issue_type":issue_type, "task_name":task_name, "task_estimate":task_estimate, "task_assignee":task_assignee, "params":{"project_type":"backlog"}});
});
}
    // проверяем, не надо ли создать эпик в проекте разработки
    if ($('#smart_can_create_epic').prop('checked')) {
    var shortEpicName = $("#smart_epic_short_name").val();
    if (shortEpicName.length == 0) shortEpicName = "Не задано";
    tasks_data.push({"issue_type":"epic", "task_name":current_issue_data.summary, "task_estimate":0, "params":{"project_type":"develop", "epicName":shortEpicName}});
}
    // если есть задачи для создания
    if (tasks_data.length >0 ) {
    // блокируем кнопки до завершения создания задач
    SmartDlgSetButtonStateDisable(true);
    // отображаем прогресс бар и устанавливаем максимум
    var smartDlgProgress = $("#smart-dialog-progress");
    smartDlgProgress.attr("max",tasks_data.length);
    smartDlgProgress.attr("value",0);
    smartDlgProgress.show();

    // считываем данные инициативы для дальнейшего использования в подзадачах
    for (let task_data of tasks_data) {
    // создаем сабтаски в инициативе и эпик в проекте разработки
    SmartDlgCreateTask(task_data);
}
} else {
    AJS.flag({
    type: 'info', // success, info, warning, error
    title: 'Внимание!',
    body: "Добавьте данные для создания задач",
    close: "auto", //  "manual", "auto" and "never"
    persistent: false
});
}

    log_level--;
}
    function SmartDlgGetProjectByTeam(value){
    var ln = "SmartDlgGetProjectByTeam: ";
    log_level++;
    var result = "";

    // определяем код проекта разработки Jira по коду команды
    switch(value) {
    case "SS": { result = "SS"; break; }
    case "WARM": { result = "WARM"; break; }
    case "SRCH": { result = "SRCH"; break; }
    case "PLAT": { result = "PLAT"; break; }
    case "SCHL": { result = "SCHL"; break; }
    case "ESITE": { result = "ESITE"; break; }
    case "DataPlatform": { result = "DP"; break; }
    case "ERM": { result = "ARMSEL"; break; }
    case "ARM": { result = "ARMAP"; break; }
    case "SERVICE": { result = "FIRE"; break; }
    case "PRNT": { result = "PRNT"; break; }
    case "SEG": { result = "MP"; break; }
    case "PERM": { result = "KONT"; break; }
    case "XSUD": { result = "XSUD"; break; }
}

    log_level--;
    return result;
}
    function SmartDlgCreateTask(value){
    var ln = "CreateSmartTask: ";
    log_level++;

    var issueTypeId = "11001"
    switch(value.issue_type) {
    case "backend": {
    issueTypeId = "11001";
    break; }
    case "frontend": {
    issueTypeId = "11002";
    break; }
    case "req": {
    issueTypeId = "11004";
    break; }
    case "test": {
    issueTypeId = "11005";
    break; }
    case "design": {
    issueTypeId = "11000";
    break; }
    case "epic": {
    issueTypeId = "10000";
    break; }
}

    var newIssueData = {
    "fields": {
    "issuetype": {
    "id": issueTypeId
},
    "summary":value.task_name
}
};
    /*
    ======================================================================================================================================================
        TODO
    ======================================================================================================================================================
    5. почему то при смене команды повторно диалог не вызывается
    */
    /*
// маппинг компонентов на проекты Jira
        def componentsProjectMap = [
"Справочные системы" : "SS",
"Горячая линия" : "PLAT",
"Календарь" : "PLAT",
"Личный кабинет" : "PLAT",
"Онлайн-помощник" : "PLAT",
"Актион 360" : "PLAT",
"ВебАРМ" : "WARM",
"ЕРМ Продавца" : "ARMSEL",
"Корпоративный портал" : "BITRIX",
"ГИС Контроль" : "GISCONTROL",
"Ассистент Поставщика" : "ARMPRO",
"Ассистент Заказчика" : "ARMCLIENT",
"Охрана Труда" : "AWFHSE",
"Рейтинг Поставщика" : "RGC",
"Проверка Контрагента" : "KONT",
"Поиск" : "SRCH",
"Правобот" : "FIRE",
"Школы" : "SCHL",
"Е-издания" : "ESITE",
"DataPlatform" :"DP",
"CRM" :"ARMAP"
 "Маркетинговые сайты":"PRNT":"PRNT, GLAVBUKH, ERGLAV, DBAN, DIEGO, ASEH, ALEJANDRO, EJTOOL, TAGPROXY, MMT"
"Маркетинговая платформа":"SEG":"MP, PABLO, SEG, SUBSCR"
    		]
    */

    switch(value.params.project_type) {
    case "develop": {
    newIssueData.fields["project"] = {"key": SmartDlgGetProjectByTeam(current_issue_data.teamCode)};
    newIssueData.fields["description"] = "Необходимо реализовать требования инициативы и конфлюенса";
    //newIssueData.fields["priority"] = {"id": "10102"};
    newIssueData.fields[vGlobal.jira.fields.epicName] = value.params.epicName;
    break; }
    case "backlog": {
    newIssueData.fields["project"] = {"key": current_issue_data.projectKey};
    newIssueData.fields["parent"] = {"key": current_issue_data.key};
    newIssueData.fields["timetracking"] = {"originalEstimate": value.task_estimate};
    newIssueData.fields["description"] = "Планирование активности и ресурсов";
    if (value.task_assignee.length > 0) newIssueData.fields["assignee"] = {"name": value.task_assignee};
    if ('components' in current_issue_data && current_issue_data.components != null) newIssueData.fields["components"] = current_issue_data.components;
    if ('customfield_11601' in current_issue_data && current_issue_data.customfield_11601 != null) newIssueData.fields["customfield_11601"] = current_issue_data.customfield_11601;
    if ('customfield_11610' in current_issue_data && current_issue_data.customfield_11610 != null) newIssueData.fields["customfield_11610"] = current_issue_data.customfield_11610;
    if ('customfield_11504' in current_issue_data && current_issue_data.customfield_11504 != null) newIssueData.fields["customfield_11504"] = current_issue_data.customfield_11504;
    break; }
}

    // создаем подзадачу
    let url = new URL(vGlobal.jira.postIssue);
    url.searchParams.set('AProcess', 'ABanner');
    url.searchParams.set('ABProcess', 'SmartDlg');
    url.searchParams.set('ADetail', 'CreateIssue');
    $.ajax({
    url: url, // указываем URL
    type: "POST",
    data: JSON.stringify(newIssueData), // данные, которые отправляем на сервер
    //headers: headers,
    //username: "",
    //password: "",
    contentType: "application/json; charset=utf-8",
    //async: false,
    //dataType: "json", // тип данных загружаемых с сервера
    //processData: false,
    success: function (data) {
    //Smart_log(ln+`Результаты создания задачи`);
    //Smart_log(ln+`data ${JSON.stringify(data)}`);
    // Добавляем информацию по задаче
    current_issue_data.newIssueList.push({value, data});

    // если успешно создали эпик, то надо его связать с инициативой
    // напрашивается использование промисов, но не в этот раз
    if (value.params.project_type == "develop") {
    var ajaxData = {};
    var searchParams = [];
    searchParams.push({"key":"AProcess", "value":"ABanner"});
    searchParams.push({"key":"ABProcess", "value":"SmartDlg"});
    searchParams.push({"key":"ADetail", "value":"CreateIssueLink"});
    var ajaxDataBody = {
    "type": {
    "name": "Developes"
},
    "inwardIssue": {
    "key": current_issue_data.key
},
    "outwardIssue": {
    "key": data.key
}
};

    ajaxData["searchParams"] = searchParams;
    ajaxData["ajaxDataBody"] = ajaxDataBody;
    UCreateIssueLink(ajaxData);
}
},
    error: function(textStatus){
    AJS.banner({
    body: `Что-то пошло не так`
});
    Smart_log(`${ln} Ошибка выполнения POST запроса`);
    Smart_log(`${ln} url: ${url}`);
    Smart_log(`${ln} ${JSON.stringify(textStatus)}`);
},
    complete: function(){
    // актуализируем результат
    SmartDlgProgressControl();
}
});
    /*
{
    "fields": {
        "assignee": {
            "name": "homer"
        },
        "reporter": {
            "name": "smithers"
        },
        "priority": {
            "id": "20000"
        },
        "labels": [
            "bugfix",
            "blitz_test"
        ],
        "timetracking": {
            "originalEstimate": "10",
            "remainingEstimate": "5"
        },
        "security": {
            "id": "10000"
        },
        "versions": [
            {
                "id": "10000"
            }
        ],
        "environment": "environment",
        "description": "description",
        "duedate": "2011-03-11",
        "fixVersions": [
            {
                "id": "10001"
            }
        ],
        "customfield_30000": [
            "10000",
            "10002"
        ],
        "customfield_80000": {
            "value": "red"
        },
        "customfield_20000": "06/Jul/11 3:25 PM",
        "customfield_40000": "this is a text field",
        "customfield_70000": [
            "jira-administrators",
            "jira-software-users"
        ],
        "customfield_60000": "jira-software-users",
        "customfield_50000": "this is a text area. big text.",
        "customfield_10000": "09/Jun/81"
    }
}
    */
    log_level--;
}
    function UCreateIssueLink(value){
    var ln = "UCreateIssueLink: ";
    log_level++;

    let url = new URL(vGlobal.jira.postIssueLink);
    // добавляем параметры запроса, в том числе для идентификации в елке
    if (value.searchParams.length > 0) {
    for (let x of value.searchParams) {
    url.searchParams.set(x.key, x.value);
}
}

    $.ajax({
    url: url, // указываем URL
    type: "POST",
    data: JSON.stringify(value.ajaxDataBody), // данные, которые отправляем на сервер
    contentType: "application/json; charset=utf-8",
    //async: false,
    success: function (data) {
},
    error: function(textStatus){
    AJS.flag({
    type: 'error', // success, info, warning, error
    title: 'Не удаось связать эпик с инициативой',
    body: "",
    close: "auto", //  "manual", "auto" and "never"
    persistent: false
});
    Smart_log(`${ln} Ошибка выполнения POST запроса. Не удаось связать эпик с инициативой`);
    Smart_log(`${ln} url: ${url}`);
    Smart_log(`${ln} ${JSON.stringify(textStatus)}`);
},
    complete: function(){
}
});

    log_level--;
}
    function SmartDlgProgressControl(){
    var ln = "SmartDlgProgressControl: ";
    log_level++;

    var smartDlgProgress = $("#smart-dialog-progress");
    smartDlgProgress.attr("value",smartDlgProgress.attr("value")+1);

    // если заполнили шкалу, то скрываем диалог и показываем результат
    if (smartDlgProgress.attr("value") == smartDlgProgress.attr("max")) {
    AJS.dialog2("#demo-dialog").hide();
    Smart_log(ln+`data ${JSON.stringify(current_issue_data)}`);

    // собираем задачки в список
    var messageBody = '<ul>';
    for (let task of current_issue_data.newIssueList) {
    messageBody += `<li><a href="${jiraTaskURL}${task.data.key}">${task.data.key} (${task.value.issue_type})</a></li>`;
}

    messageBody += "</ul>";

    AJS.flag({
    type: 'success', // success, info, warning, error
    title: 'Успешно созданы задачи',
    body: messageBody,
    close: "manual", //  "manual", "auto" and "never"
    persistent: false
});

    // очистка данных для подготовки к следующему запуску
    current_issue_data.newIssueList = [];
    current_issue_data.components = [];
    current_issue_data.summary = "";
    current_issue_data.customfield_11601 = {};
    current_issue_data.customfield_11610 = {};
    current_issue_data.customfield_11504 = "";

    // удаляем динамические элементы диалога
    $(`.subtask`).remove();
    // сбрасываем чекбокс эпика
    $('#smart_can_create_epic').prop('checked',false);
}

    log_level--;
}
    function SmartDlgAddNewTask(taskType) {
    var index = 0;
    var preffix = '[X]';
    switch(taskType) {
    case "backend": {
    vGlobal.process.iniciativeSubtask.backend_count++;
    index = vGlobal.process.iniciativeSubtask.backend_count;
    preffix = "[B]";
    break; }
    case "frontend": {
    vGlobal.process.iniciativeSubtask.frontend_count++;
    index = vGlobal.process.iniciativeSubtask.frontend_count;
    preffix = "[F]";
    break; }
    case "req": {
    vGlobal.process.iniciativeSubtask.req_count++;
    index = vGlobal.process.iniciativeSubtask.req_count;
    preffix = "[R]";
    break; }
    case "test": {
    vGlobal.process.iniciativeSubtask.test_count++;
    index = vGlobal.process.iniciativeSubtask.test_count;
    preffix = "[T]";
    break; }
    case "design": {
    vGlobal.process.iniciativeSubtask.design_count++;
    index = vGlobal.process.iniciativeSubtask.design_count;
    preffix = "[D]";
    break; }
}
    SmartDlgAddAnyTasks("subtask",taskType,index,`${preffix} ${current_issue_data.summary}`);
}
    function SmartDlgAddAnyTasks(classSubtask, classSubtaskDetail, count, taskName){
    var id_postfix = `_${classSubtask}_${classSubtaskDetail}_${count}`
    var class_name = `${classSubtask} ${classSubtaskDetail} ${classSubtaskDetail}_${count}`
    // определяем группу полей
    var $fieldset = $(`#fieldset_${classSubtaskDetail}`);
    // добавляем общий div
    //<form class="aui">
    var $div = $('<form>').attr({
    'id': 'form' + id_postfix,
    'class': class_name+" aui"
});
    $fieldset.append($div);
    // добавляем в div строку ввода имени задачи
    $div.append( SmartDlgCreateTaskNameElement(id_postfix, class_name+" edit-element smart-task-name", `${taskName} (${count})`,count,classSubtaskDetail) );
    // добавляем в div строку ввода оценки задачи
    $div.append( SmartDlgCreateTaskEstimateElement(id_postfix, class_name+" edit-element smart-task-estimate", count,classSubtaskDetail) );
    // добавляем в div строку ввода ответственного за задачу
    $div.append( SmartDlgCreateTaskAssigneeElement(id_postfix, class_name+" edit-element smart-task-assignee", count,classSubtaskDetail) );
    // добавляем кнопку удаления группы элементов
    $div.append( SmartDlgCreateBtnDeleteElement(id_postfix, class_name) );
}
    function SmartDlgCreateTaskNameElement(postfix, className, taskName, index, issueType) {
    var $element = $('<input>').attr({
    'id': 'input_name' + postfix,
    'class': className+" text long-field",
    'type': 'text',
    'value': taskName,
    "data-smart-id":index,
    "data-issue-type":issueType
})
    .css({
    'margin-right':'5px'
});;
    return $element;
}
    function SmartDlgCreateTaskEstimateElement(postfix, className, index, issueType) {
    var $element = $('<input>').attr({
    'id': 'input_estm' + postfix,
    'class': className+" text short-field",
    'type': 'number',
    'min': '0',
    'max': '240',
    'placeholder': 'Оценка в часах',
    "data-smart-id":index,
    "data-issue-type":issueType
})
    .css({
    'margin-right':'5px'
});
    return $element;
}
    function SmartDlgCreateTaskAssigneeElement(postfix, className, index, issueType) {
    var $element = $('<input>').attr({
    'id': 'input_assignee' + postfix,
    'class': className+" text medium-field",
    'type': 'text',
    'placeholder': 'Ответственный',
    "data-smart-id":index,
    "data-issue-type":issueType
})
    .css({
    'margin-right':'5px'
})
    .attr({'autocomplete': 'on'
});
    return $element;
}
    function SmartDlgCreateBtnDeleteElement(postfix, className) {

    var $element = $('<input>').attr({
    id: 'btn' + postfix,
    class: className + " btnDelete aui-button",
    type: 'button',
    value: 'Удалить'
})
    .click(function() {
    SmartDlgDeleteTaskElements(postfix);
});
    /*var $div = $('<div>').attr({
        'id': 'div' + postfix,
        'class': className+" aui-buttons"
    });
    $div.append($element);*/
    return $element;
}
    function SmartDlgDeleteTaskElements(value) {
    //alert(`${index} ${type}`);
    $(`form#form${value}`).remove()
}

    function GetIssueStates (){
    var ln = "GetIssueStates: ";

    var canIncrement = false;

    // ищем блоки с активными спринтами
    /*var activeSprintGrids = document.getElementsByClassName(activeSprintGridClass);
    if (activeSprintGrids.length < 1) {
        Log(ln+"Не найдены активные спринты");
    }
    else
    {*/
    //Log(ln+"Найдены активные спринты ("+activeSprintGrids.length+")");
    // обходим активные спринты
    //for( var activeSprintGrid, i = 0; activeSprintGrid = activeSprintGrids[i++]; ) {
    var activeSprintGridIssues = document.getElementsByClassName(activeSprintGridIssueClass);
    //Log(ln+"Найдено элементов в активном спринте ("+activeSprintGridIssues.length+")");
    // обходим задачи в спринте
    for( var activeSprintGridIssue, j = 0; activeSprintGridIssue = activeSprintGridIssues[j++]; ) {
    var issueKey = activeSprintGridIssue.getAttribute(activeSprintGridIssueAttribute);
    //Log(ln+"issueKey "+issueKey);

    // ищем расширение информации по задаче в гриде
    var extraFieldsParent = activeSprintGridIssue.children[0].getElementsByClassName(extraFieldsParentClass);
    //Log(ln+"extraFieldsParent "+extraFieldsParent.length);
    if (extraFieldsParent.length <1) {
    //Log(ln+"Наш класс отсутствует"+extraFieldsParentClass);
} else
{
    //Log(ln+"Наш класс на месте "+extraFieldsParentClass);
    var extraFieldsClasses = activeSprintGridIssue.children[0].getElementsByClassName("ghx-extra-field");
    // ищем дочерние с данными
    if (extraFieldsClasses.length >0) {
    var stateName;
    // ищем статус
    for( var extraFieldsClassChildren, k = 0; extraFieldsClassChildren = extraFieldsClasses[k++]; ) {
    var extraFieldAttribute = extraFieldsClassChildren.getAttribute("data-tooltip");
    if (extraFieldAttribute.indexOf("Status:")>=0) {
    stateName = extraFieldAttribute.slice(8);
    //Log(ln+"stateName = "+stateName);
    break;
}
    Log(ln+"Атрибуты "+extraFieldAttribute);
}
    // если нашли статус
    if (stateName) {
    // ищем кастомный класс со статусом
    var stateCustomClasses = activeSprintGridIssue.children[0].children[1].getElementsByClassName(stateCustomClass);
    if (stateCustomClasses.length >=1) {
    // статус мы уже добавили
    // хорошо бы обновлять статус
} else
{
    // есть задачи без fix version и epic, у них другая структура классов
    // надо в ghx-issue-content
    // создать ghx-end ghx-row ghx-row-version-epic-subtasks
    // и переместить туда ghx-end ghx-extra-field-estimate
    //
    // статус еще не добавляли, делаем
    var e = document.createElement('span');
    e.className = "aui-label ghx-label ghx-label-double ghx-label-4 "+stateCustomClass;
    e.innerHTML = stateName;
    e.style.marginLeft = "10px";

    var extraEpicPanel = activeSprintGridIssue.children[0].getElementsByClassName(extraEpicPanelClass);
    //Log(ln+"epicPanel.length "+extraEpicPanel.length);
    if (extraEpicPanel.length > 0) {
    activeSprintGridIssue.children[0].children[1].appendChild(e);
} else{
    var newPanel = document.createElement('div');
    newPanel.className = "ghx-row-version-epic-subtasks";
    //newPanel.innerHTML = stateName;
    newPanel.style.display = "inline";
    activeSprintGridIssue.children[0].appendChild(newPanel);
    //
    var extraFieldEstimate = activeSprintGridIssue.children[0].children[1].getElementsByClassName(extraFieldEstimateClass);
    extraFieldEstimate[0].style.display = "inline";
    newPanel.append(extraFieldEstimate[0]);

    activeSprintGridIssue.children[0].children[2].children[0].appendChild(e);
}
    canIncrement = true;
}
}
}
}
}
    //}
    //}
    if (canIncrement) countUpdate++;
    refreshStopped = false;
}
    function GetFirstFutureSprintByHtmlAsElement(){
    var ln = "GetFirstFutureSprintByHtmlAsElement: ";
    log_level++;
    const start= new Date().getTime();

    var result = null;
    var elFutureSprints = document.getElementsByClassName("ghx-backlog-container ghx-sprint-planned js-sprint-container");
    if (elFutureSprints !== null && elFutureSprints.length>0) {
    result = elFutureSprints[0];
} else Smart_log(ln+"Будущий спринт не найден 2");

    const end = new Date().getTime();
    Smart_log(ln+`Время работы: ${end - start} мс`);
    log_level--;

    return result;
}
    function GetIssueTimetracking(issueKey){
    log_level++;
    var ln = "GetIssueTimetracking: ";

    var result;
    //Smart_log(ln+JIRA.Issue.getIssueKey());
    //Smart_log(ln+AJS.Meta.get("issue-key"));

    let url = new URL(jiraURL+"/rest/adweb/2/timetracking/"+issueKey); // "/rest/api/2/issue/"
    url.searchParams.set('fields', 'description');
    url.searchParams.set('CustomSource', 'AB_GetIssueTimetracking');

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    //xhr.setRequestHeader('SOAPAction', 'AnnouncementBanner');

    xhr.send();
    //document.getElementById("customfield_10800").value = obj.badges[1].id;
    //Smart_log(ln+xhr.status); // Равен кодам HTTP (200 - успешно, 404 не найдено, 301 - перенесено навсегда)
    //Smart_log(ln+xhr.statusText);
    //Smart_log(ln+xhr.responseText);

    // 4. Этот код сработает после того, как мы получим ответ сервера
    //xhr.onload = function() { // только для асинхронки
    if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
    //Smart_log(ln+`Ошибка ${xhr.status}: ${xhr.statusText}`);
} else { // если всё прошло гладко, выводим результат
    //Smart_log(ln+`Готово, получили ${xhr.response.length/1024} Kбайт`);
    result = xhr.responseText;
}
    //};

    log_level--;
    return result;
}
    function GetIssue(issueKey){
    log_level++;
    var ln = "GetIssue: ";

    var result;
    //Smart_log(ln+JIRA.Issue.getIssueKey());
    //Smart_log(ln+AJS.Meta.get("issue-key"));

    let url = new URL(jiraURL+"/rest/api/2/issue/"+issueKey);
    url.searchParams.set('fields', 'assignee');
    url.searchParams.set('CustomSource', 'AB_GetIssue'); // CustomSource=AnnouncementBanner CustomSource=AB_GetIssueTimetracking CustomSource=AB_GetIssue

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    //xhr.setRequestHeader('SOAPAction', 'AnnouncementBanner');


    xhr.send();
    //document.getElementById("customfield_10800").value = obj.badges[1].id;
    //Smart_log(ln+xhr.status); // Равен кодам HTTP (200 - успешно, 404 не найдено, 301 - перенесено навсегда)
    //Smart_log(ln+xhr.statusText);
    //Smart_log(ln+xhr.responseText);

    // 4. Этот код сработает после того, как мы получим ответ сервера
    //xhr.onload = function() { // только для асинхронки
    if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
    //Smart_log(ln+`Ошибка ${xhr.status}: ${xhr.statusText}`);
} else { // если всё прошло гладко, выводим результат
    //Smart_log(ln+`Готово, получили ${xhr.response.length/1024} Kбайт`);
    result = xhr.responseText;
}
    //};

    log_level--;
    return result;
}
    function GetProjectByURL(){
    log_level++;

    var ln = "GetProjectByURL ";
    var projectCode = ""
    // https://jira.action-media.ru/browse/SS-7549
    // убеждаемся, что открыта задача
    if ( window.location.href.includes(jiraTaskURL) ) {
    var lineIndex = window.location.href.indexOf("-",jiraTaskURL.length)
    projectCode = window.location.href.substring(jiraTaskURL.length,lineIndex);
    Smart_log(ln+"projectCode = "+projectCode);
} else Smart_log(ln+"URL "+window.location+" не совпадает с паттерном задачи "+jiraTaskURL);

    log_level--;
    return projectCode;
}
    function UpdateEpicInfoSmart(){
    var ln = "UpdateEpicInfoSmart: ";
    log_level++;

    var epicKey = JIRA.Issue.getIssueKey();

    var epicTaskListElemSpan = document.getElementById(epicTaskListElemSpanId);
    if (epicTaskListElemSpan) {
    epicTaskListElemSpan.style.backgroundColor = "#FF7A83"
}
    var tDelay = 0; setTimeout(UpdateEpicInfoSmartEnd, tDelay, epicKey);

    log_level--;
}
    function UpdateEpicInfoSmartEnd(epicKey){
    var ln = "UpdateEpicInfoSmartEnd: ";
    log_level++;
    const start= new Date().getTime();

    var epicTable = document.getElementById("ghx-issues-in-epic-table");
    if (epicTable == null) { Smart_log(ln+"Не нашли epicTable в документе")
} else {
    if (epicTable.rows.length < 1) { Smart_log(ln+"В эпике нет задач")
} else {
    //var epicTasks = [];
    var estimateDevSummary = 0;
    var estimateQASummary = 0;

    // обходим таблицу задач и получаем трудозатраты по ролям
    for(var i=0; i<epicTable.rows.length; i++) {
    if (epicTable.rows[i].id != epicTableNewRowHeaderId && epicTable.rows[i].id != epicTableNewRowBottomId) {
    var issueKey = epicTable.rows[i].getAttribute("data-issuekey");
    var epicTaskInfo = {
    issueKey:issueKey,
    elIssueId:'elIssueId'+issueKey.replace('-',''),
    roles :[{key:"Developers", estimate:0},{key:"QA", estimate:0}]
}
    var objIssueTimetracking = JSON.parse(GetIssueTimetracking(issueKey));
    if (objIssueTimetracking) {
    //Smart_log(`${ln} objIssueTimetracking = ${JSON.stringify(objIssueTimetracking)}`);
    if ('estimates' in objIssueTimetracking) {
    if (objIssueTimetracking.estimates.length > 0) {
    // обходим имеющиеся оценки
    for(var r=0; r<objIssueTimetracking.estimates.length; r++) {
    for(var ro=0; ro<epicTaskInfo.roles.length; ro++) {
    //Smart_log(ln+` ${epicTaskInfo.issueKey} ${objIssueTimetracking.estimates[r].role} ${epicTaskInfo.roles[ro].key}`);
    if (objIssueTimetracking.estimates[r].role == epicTaskInfo.roles[ro].key)
{
    if ("remainingEstimateSeconds" in objIssueTimetracking.estimates[r]) { // originalEstimateSeconds
    var estimate = objIssueTimetracking.estimates[r].remainingEstimateSeconds/60/60;
    var templateValue = +estimate.toFixed(1);
    epicTaskInfo.roles[ro].estimate = templateValue;

    switch(epicTaskInfo.roles[ro].key) {
    case "Developers": {
    estimateDevSummary+=objIssueTimetracking.estimates[r].remainingEstimateSeconds;
    break;
}
    case "QA": {
    estimateQASummary+=objIssueTimetracking.estimates[r].remainingEstimateSeconds;
    break;
}
}
}
}
}
}
} else Smart_log(ln+`отсутствуют данные objIssueTimetracking`);
} else Smart_log(ln+`отсутствуют данные estimates (issueKey=${objIssueTimetracking.key})`);
} else Smart_log(ln+`GetIssueTimetracking - данные не были получены (issueKey=${issueKey})`);
    //epicTasks.push(epicTaskInfo);
    var newCellDev = document.getElementById('newCellDev'+epicTaskInfo.elIssueId);
    if (newCellDev) {
    newCellDev.innerHTML = epicTaskInfo.roles[0].estimate;
} else {
    newCellDev = epicTable.rows[i].insertCell(-1);
    newCellDev.className ='nav ghx-minimal';
    newCellDev.id='newCellDev'+epicTaskInfo.elIssueId;
    newCellDev.innerHTML = epicTaskInfo.roles[0].estimate;
}

    var newCellQA = document.getElementById('newCellQA'+epicTaskInfo.elIssueId);
    if (newCellQA) {
    newCellQA.innerHTML = epicTaskInfo.roles[1].estimate;
} else {
    newCellQA = epicTable.rows[i].insertCell(-1);
    newCellQA.className ='nav ghx-minimal';
    newCellQA.id='newCellQA'+epicTaskInfo.elIssueId;
    newCellQA.innerHTML = epicTaskInfo.roles[1].estimate;
}
}
}
    // добавляем шапку
    var elNewRowHeader = document.getElementById(epicTableNewRowHeaderId);
    if (!elNewRowHeader) {
    var newRowHeader = epicTable.insertRow(0);
    newRowHeader.id = epicTableNewRowHeaderId;
    var newRowHeaderCell = newRowHeader.insertCell(0); newRowHeaderCell.innerHTML = 'V';
    newRowHeaderCell = newRowHeader.insertCell(1); newRowHeaderCell.innerHTML = 'Key';
    newRowHeaderCell = newRowHeader.insertCell(2); newRowHeaderCell.innerHTML = 'Summary';
    newRowHeaderCell = newRowHeader.insertCell(3); newRowHeaderCell.innerHTML = 'Type';
    newRowHeaderCell = newRowHeader.insertCell(4); newRowHeaderCell.innerHTML = 'State';
    newRowHeaderCell = newRowHeader.insertCell(5); newRowHeaderCell.innerHTML = 'Assignee';
    newRowHeaderCell = newRowHeader.insertCell(6); newRowHeaderCell.innerHTML = 'A';
    newRowHeaderCell = newRowHeader.insertCell(7); newRowHeaderCell.innerHTML = 'Dev';
    newRowHeaderCell = newRowHeader.insertCell(8); newRowHeaderCell.innerHTML = 'QA';
}

    // добавляем футер
    var elNewRowBottom = document.getElementById(epicTableNewRowBottomId);
    if (!elNewRowBottom) {
    var newRowBottom = epicTable.insertRow(-1);
    newRowBottom.id = epicTableNewRowBottomId;
    var newRowBottomCell = newRowBottom.insertCell(0); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(1); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(2); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(3); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(4); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(5); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(6); newRowBottomCell.innerHTML = '';
    newRowBottomCell = newRowBottom.insertCell(7); newRowBottomCell.innerHTML = (estimateDevSummary/60/60).toFixed(1);
    newRowBottomCell = newRowBottom.insertCell(8); newRowBottomCell.innerHTML = (estimateQASummary/60/60).toFixed(1);
} else {
    elNewRowBottom.cells[7].innerHTML = (estimateDevSummary/60/60).toFixed(1);
    elNewRowBottom.cells[8].innerHTML = (estimateQASummary/60/60).toFixed(1);
}
}
}

    var epicTaskListElemSpan = document.getElementById(epicTaskListElemSpanId);
    if (epicTaskListElemSpan) {
    epicTaskListElemSpan.style.backgroundColor = "white"
}

    const end = new Date().getTime();
    Smart_log(`${ln} Время работы: ${end - start} мс`);
    log_level--;
}
    function AddEpicTaskListButtonCalc(){
    var ln = "AddEpicTaskListButtonCalc: ";
    log_level++;

    var epicPanel = document.getElementById("greenhopper-epics-issue-web-panel");
    if (epicPanel == null) { Smart_log(ln+"Не нашли epicPanel в документе")
} else {
    var epicPanelHeader = document.getElementById("greenhopper-epics-issue-web-panel_heading");
    if (epicPanelHeader == null) {Smart_log(ln+"Не нашли epicPanelHeader в документе")
} else {
    var epicTaskList = epicPanelHeader.querySelector('ul');
    if (epicTaskList == null) {Smart_log(ln+"Не нашли epicTaskList в документе")
} else {
    // создаем кнопку
    let epicTaskListElemSpan = document.createElement('span');
    epicTaskListElemSpan.id = epicTaskListElemSpanId;
    epicTaskListElemSpan.classList.add('aui-icon', 'aui-icon-small', 'aui-iconfont-time');
    epicTaskListElemSpan.onclick = UpdateEpicInfoSmart;

    // добавляем кнопку в список
    let epicTaskListElem = document.createElement('li');
    epicTaskListElem.append(epicTaskListElemSpan);// = '<span class="aui-icon aui-icon-small aui-iconfont-time"></span>';
    epicTaskList.append(epicTaskListElem);
}
}
}

    log_level--;
}
    /*
    function UpdateEpicInfo(){
        log_level++;
        var ln = "UpdateEpicInfo:";

        Smart_log(ln+"Запускаем обогащение эпика");

        var canChangeEpicInfo = false;
        var projectCode = GetProjectByURL();

        switch(projectCode) {
            case 'SS': { canChangeEpicInfo = true; break; } // GISCONTROL
            case 'SCHL': { canChangeEpicInfo = true; break; }
            case 'ESITE': { canChangeEpicInfo = true; break; }
            case 'SRCH': { canChangeEpicInfo = true; break; }
            case 'GISCONTROL': { canChangeEpicInfo = true; break; }
            case 'PRD': { canChangeEpicInfo = true; break; }
            case 'ARMCLIENT': { canChangeEpicInfo = true; break; }
            case 'AWFHSE': { canChangeEpicInfo = true; break; }
            case 'KONT': { canChangeEpicInfo = true; break; }
            case 'ARMPRO': { canChangeEpicInfo = true; break; }
            case 'WARM': { canChangeEpicInfo = true; break; }
        }

        if (canChangeEpicInfo) {
            var epicTable = document.getElementById("ghx-issues-in-epic-table");
            if (epicTable == null) { Smart_log(ln+"Не нашли epicTable в документе");
                                   } else {
                                       Smart_log(ln+"Строк в таблице "+epicTable.rows.length);
                                       if (epicTable.rows.length > 0) {
                                           for(var i=0; i<epicTable.rows.length; i++) {
                                               var issueKey = epicTable.rows[i].getAttribute("data-issuekey");
                                               var newCell = epicTable.rows[i].insertCell(-1);

                                               var remainingEstimate = "n/a"

                                               //Smart_log(ln+" "+epicTable.rows[i].cells[2].innerHTML);
                                               //Smart_log(ln+"issueKey "+issueKey);
                                               //if (i==0) {
                                               // запрашиваем данные по задаче
                                               var obj = JSON.parse(GetIssueTimetracking(issueKey));
                                               if (obj) {
                                                   // проверяем наличие данных по ролям
                                                   if ('estimates' in obj) {
                                                       if (obj.estimates.length > 0) {
                                                           for(var r=0; r<obj.estimates.length; r++) {
                                                               if (obj.estimates[r].role == "Developers") {
                                                                   if ("remainingEstimate" in obj.estimates[r]) remainingEstimate = obj.estimates[r].remainingEstimate;
                                                                   //Smart_log(ln+"obj.estimates[r].remainingEstimate = "+obj.estimates[r].remainingEstimate);
                                                               }
                                                           }
                                                       }
                                                       //Smart_log(ln+"obj.estimates.length = "+obj.estimates.length);
                                                   }// else Smart_log(ln+"obj.estimates нет в данных");

                                               }
                                               //}
                                               newCell.className ='nav ghx-minimal';
                                               newCell.innerHTML = remainingEstimate;
                                           }
                                       }
                                   }
        }

        log_level--;
    }*/


    /*
        А. спринты: с понедельника по четверг
        1. получаем информацию по всем задачам активного спринта в статусах OPEN, IN PROGRESS, SUSPEND, REOPENED
        2. суммируем оставшееся по роли время по Assigne
        3. считаем рабочие часы до конца спринта
        4. отображаем оставшиеся часы на разработку и признак наличия проблемы с часами на работу

        Б. планирование времени
        ...

        var roleInfo = {
                                    key:role.key,
                                    estimate:0,
                                    unnassigneeDev:0,
                                    dataFilterId:role.dataFilterId
                                }
        */
    function UpdateEstimateInfoByRole(rolesEstimates) {
    var ln = "UpdateEstimateInfoByRole: ";
    log_level++;

    if ( rolesEstimates.length > 0 ) {
    // выводим оценки на панель в рамках социальной ответственности
    for (let roleEstimate of rolesEstimates) {
    var estimate = (roleEstimate.estimate > 0) ? (roleEstimate.estimate/60/60).toFixed(0) : "0";
    var templateValue = "";
    switch(roleEstimate.key) {
    case "QA": {
    templateValue = estimate;
    break; }
    case "Developers": {
    var estimateUnnassigneeDev = (roleEstimate.unnassigneeDev > 0) ? (roleEstimate.unnassigneeDev/60/60).toFixed(0) : "0";
    templateValue = `${estimate}/${estimateUnnassigneeDev}`;
    break; }
}
    var color = "black";
    //if (estimate > 25) color = "red";
    //Smart_log(`${ln} roleEstimate.key = ${roleEstimate.key},roleEstimate.estimate = ${roleEstimate.estimate},roleEstimate.unnassigneeDev = ${roleEstimate.unnassigneeDev}`);
    SetElementEstimateInfoByDeveloper(roleEstimate.dataFilterId,templateValue, color,"");
}
}
    log_level--;
}
    function SetElementEstimateInfoByDeveloper(elParentAttr,value,color, bgColor){
    var ln = "SetElementEstimateInfoByDeveloper: ";
    log_level++;
    var elParent = document.querySelector(`[data-filter-id="${elParentAttr}"]`);
    //Smart_log(ln+`[data-filter-id=${elem_attribyte_value}]`);
    if (elParent) {
    var templateDIVId = `div${elParentAttr}`;
    var elCustomEstimation = document.getElementById(templateDIVId);
    if (elCustomEstimation === null) {
    elCustomEstimation = document.createElement('div');
    elCustomEstimation.id = templateDIVId;
    elCustomEstimation.innerHTML = value;
    //elCustomEstimation.style.display = "inline";
    elCustomEstimation.style.border = "1px solid black";
    elCustomEstimation.style.marginTop = "5px"
    elCustomEstimation.style.padding = "5px"
    elCustomEstimation.style.color = "black"
    //elCustomEstimation.style.backgroundColor = bgColor;
    elParent.appendChild(elCustomEstimation);
} else {
    elCustomEstimation.innerHTML = value;

}
    elCustomEstimation.style.color = color;
    elCustomEstimation.style.backgroundColor = bgColor;
} else {
    Smart_log(ln+`Элемент [data-filter-id="${elParentAttr}"] не найден`);
}
    log_level--;
}
    function UpdateEstimateInfoByDeveloper(developersEstimates) {
    var ln = "UpdateEstimateInfoByDeveloper: ";
    log_level++;
    //const start= performance.now();//new Date().getTime();

    if ( developersEstimates.length > 0 ) {
    // выводим оценки на панель в рамках социальной ответственности
    for (let developerEstimate of developersEstimates) {
    var estimate = developerEstimate.estimate/60/60;
    var templateValue = estimate.toFixed(1);
    var color = "black";
    var bgColor = "";
    // если превышено доступное время
    if (estimate > 25) color = "red";
    // если есть задачи без оценки
    if (developerEstimate.hasTaskWithoutEstimate) bgColor = "yellow";

    SetElementEstimateInfoByDeveloper(developerEstimate.dataFilterId,templateValue, color,bgColor);
}
}
    log_level--;
}
// устарела, но выкинуть пока жалко
    function ShowEstimateInFutureSprint(){
    var ln = "ShowEstimateInFutureSprint: ";
    log_level++;
    const start= new Date().getTime();

    Smart_log(ln+"Старт");

    let futureSprintTasks = [];
    var elFutureSprints, elFutureSprint;


    // получить спринт и сохранить его, в дальнейшем проверять наличие
    // получить список фильтров и сохранить, в дальнейшем проверять наличие
    // пробежаться по дереву компонентов, определить список задач
    // новые задачи добавить в массив и запросить по ним данные
    // обновить фильтры

    elFutureSprint = GetFutureSprintByHtmlAsElement();

    if (elFutureSprint != null) {
    var elFutureSprintTasks = elFutureSprint.getElementsByClassName("js-issue");
    Smart_log(ln+"Найдено элементов elFutureSprintTasks = "+elFutureSprintTasks.length);
    //Smart_log(ln+"Найдено элементов futureSprintTasks = "+futureSprintTasks.length);
    if (elFutureSprintTasks.length > 0) {
    for(var i=0; i<elFutureSprintTasks.length; i++) {
    var key = elFutureSprintTasks[i].getAttribute("data-issue-key");
    //Smart_log(ln+"Найдено элементов data-issue-key = "+ key);

    let issueFind = futureSprintTasks.find(issue => issue.issueKey === key)
    if (!!!issueFind) {
    var sprintTaskInfo = {
    issueKey:key,
    assignee:'',
    remainingEstimate:0,
    isNewTask: true
}
    // добавляем новую задачу будущего спринта в массив
    futureSprintTasks.push(sprintTaskInfo);
    //Smart_log(ln+"нет в массиве");
} //else Smart_log(ln+"есть в массиве");
}
    if (futureSprintTasks.length>0) {
    // получаем новые задачи, по которым нужно запросить данные
    var futureSprintTasksFiltered = futureSprintTasks.filter(issue => issue.isNewTask === true)
    if (!!!futureSprintTasksFiltered) { Smart_log(ln+"массив futureSprintTasksFiltered не создан"); }
    else {
    Smart_log(ln+"futureSprintTasksFiltered.length = "+futureSprintTasksFiltered.length);
    for (let newTask of futureSprintTasksFiltered) {
    var hasAssignee = false;
    var hasEstimaton = false;

    var obj = JSON.parse(GetIssue(newTask.issueKey));
    if (obj) {
    // проверяем наличие данных по ролям
    if ('fields' in obj) {
    if ('assignee' in obj.fields && obj.fields.assignee != null) {
    if ("key" in obj.fields.assignee) {
    Smart_log(ln+"assignee.displayName = "+obj.fields.assignee.displayName +` (issueKey=${obj.key})`);
    newTask.assignee = obj.fields.assignee.key;
    hasAssignee = true;
}
} else Smart_log(ln+`отсутствуют данные assignee (issueKey=${obj.key})`);
} else Smart_log(ln+`отсутствуют данные fields (issueKey=${obj.key})`);
} else Smart_log(ln+`GetIssue - данные не были получены (issueKey=${newTask.issueKey})`);

    obj = null;
    obj = JSON.parse(GetIssueTimetracking(newTask.issueKey));
    if (obj) {
    if ('estimates' in obj) {
    if (obj.estimates.length > 0) {
    for(var r=0; r<obj.estimates.length; r++) {
    if (obj.estimates[r].role == "Developers") {
    if ("remainingEstimate" in obj.estimates[r]) {
    newTask.remainingEstimate = obj.estimates[r].remainingEstimateSeconds;
    Smart_log(ln+"obj.estimates[r].remainingEstimate = "+obj.estimates[r].remainingEstimate);
    hasEstimaton = true;
}
}
}
}
} else Smart_log(ln+`отсутствуют данные estimates (issueKey=${obj.key})`);
} else Smart_log(ln+`GetIssueTimetracking - данные не были получены (issueKey=${newTask.issueKey})`);

    if (hasAssignee && hasEstimaton) {
    newTask.isNewTask = false;
}

}
}

    var developers = [{family:'Красноштанов',key:'krasnoshtanov',estimate:0,dataFilterId:582},{family:'Шилов',key:'shilov',estimate:0,dataFilterId:0},
{family:'Аленин',key:'alenin',estimate:0,dataFilterId:1888},
{family:'Гринштейн',key:'grinshtein',estimate:0,dataFilterId:2052},
{family:'Лукавенко',key:'lukavenko',estimate:0,dataFilterId:2414},
{family:'Кабоев',key:'kaboev',estimate:0,dataFilterId:2497},
{family:'Калашников',key:'a.kalashnikov',estimate:0,dataFilterId:2050},
{family:'Черкасов',key:'cherkasov',estimate:0,dataFilterId:2379},
{family:'Мартынов',key:'martynov',estimate:0,dataFilterId:2679},
{family:'Корончик',key:'koronchik',estimate:0,dataFilterId:2051}]
    for (let x of developers) {
    var assigneeTasksFiltered = futureSprintTasks.filter(issue => issue.assignee === x.key)
    if (!!assigneeTasksFiltered && assigneeTasksFiltered.length>0) {
    //Smart_log(ln+`найдено задач: ${assigneeTasksFiltered.length}`);
    for (let task of assigneeTasksFiltered) {
    x.estimate+=task.remainingEstimate;
}
}
    Smart_log(ln+`Developer ${x.family} (${x.key}), задач на ${x.estimate/60/60} ч.`);
    UpdateEstimateInfoByDeveloper(x); // {family:'Красноштанов',key:'krasnoshtanov',estimate:0,dataFilterId:582}
}
}
}
}


    const end = new Date().getTime();
    Smart_log(ln+`Время работы: ${end - start} мс`);
    log_level--;
}

    function FajaxComplete(){
    if (canUseScriptForUpdateStates) {
    if (!refreshStopped) {
    setTimeout(GetIssueStates, 200);
    refreshStopped = true;
}
}
    // проверяем подписки на события
    AddEventToButton();
}

//AJS.$(document).ajaxSuccess(FajaxSuccess);
    AJS.$(document).ajaxComplete(FajaxComplete);


})(AJS.$);
</script>