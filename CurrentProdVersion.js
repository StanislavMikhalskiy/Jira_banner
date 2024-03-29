//<script type='text/javascript'>
(function() {
    // Автор: Михальский Станислав, 2019-2021

    const script_version = '1.15.0'
    const environment = "PROD"; // DEV TEST PROD
    let log_preffix = `${environment} Banner: `
    // глобальный конфиг разных процессов
    let gc = {}

    //log('начальный readyState:' + document.readyState);
    //document.addEventListener('readystatechange', () => log('readyState:' + document.readyState));
    //document.addEventListener('DOMContentLoaded', () => log('DOMContentLoaded'));

    window.onload = () => setTimeout(setup,500);

    function log(value){
        let dt = new Date();
        console.log(`${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}.${dt.getMilliseconds()} ${log_preffix}${value}`);
    }
    // функция задержки и ожидания выполнения
    function defer(f, ms) {
        return function() {
            setTimeout(() => f.apply(this, arguments), ms)
        };
    }
    // базовые установки
    function setup(){
        let url = "";
        switch (environment) {
            case "DEV": {
                url = "https://jira.action-media.ru"
                break
            }
            case "PROD": {
                url = "https://jira.action-media.ru"
                break
            }
            case "TEST": {
                url = "https://jira.dev.aservices.tech"
                break
            }
        }
        // заполняем конфиг
        gc['jira'] = {mainUrl:url}
        gc.jira['urls'] = {
            "viewIssue":gc.jira.mainUrl+"/browse/", // gc.jira.urls.viewIssue
            "getIssue":gc.jira.mainUrl+"/rest/api/2/issue/", // gc.jira.urls.getIssue
            "postIssue":gc.jira.mainUrl+"/rest/api/2/issue/", // gc.jira.urls.postIssue
            "searchIssue":gc.jira.mainUrl+"/rest/api/2/search", // gc.jira.urls.searchIssue
            "postIssueBulk":gc.jira.mainUrl+"/rest/api/2/issue/bulk/", // gc.jira.urls.postIssueBulk
            "postIssueLink":gc.jira.mainUrl+"/rest/api/2/issueLink/", // gc.jira.urls.postIssueLink
            "postTimeTracking":gc.jira.mainUrl+"/rest/adweb/2/timetracking/",
            "getTimeTracking":gc.jira.mainUrl+"/rest/adweb/2/timetracking/",
            "getUserForPicker":gc.jira.mainUrl+"/rest/api/2/user/picker/" // gc.jira.urls.getUserForPicker
        }
        gc.jira['elements'] = { // gc.jira.elements.
            "epicTaskListElemSpanId":"epicTaskListElemSpanId",
            "epicTableNewRowHeaderId":"epicTableNewRowHeaderId",
            "epicTableNewRowBottomId":"epicTableNewRowBottomId",
            "activeSprintGridIssueClass":"js-issue",
            "activeSprintGridIssueAttribute":"data-issue-key",
            "extraFieldsParentClass":"ghx-plan-extra-fields",
            "stateCustomClass":"sfaulunsad",
            "extraEpicPanelClass":"ghx-row-version-epic-subtasks",
            "extraFieldEstimateClass":"ghx-extra-field-estimate"
        }
        gc.jira['fields'] = {
            "epicLink":"customfield_10100", // gc.jira.fields.epicLink
            "epicName":"customfield_10102",
            "taskMetaDataSprint":"customfield_10104",
            "taskMetaDataEstimateByRole":"customfield_11303",
            "taskMetaDataAssigneeByRole":"customfield_11304",
            "businessCase":"customfield_11610",
            "team":"customfield_11601",
            "components":{
                "SS":"10014",
                "SEARCH":"10006",
                "WARM":"10010"
            },
            "businessCases":{
                "bigPicture":"11851"
            },
            "teams":{
                "SS":"11830",
                "SEARCH":"11855",
                "WARM":"11856"
            },
            "projectKeyByTeam" :{
                "SS":"SS",
                "SEARCH":"SRCH",
                "WARM":"WARM",
                "SUPPORT":"OAM"
            },
            "issueTypes":{
                "bcklg":{
                    "iniciative":"10903",
                    "backendSub":"11001",
                    "frontendSub":"11002",
                    "testSub":"11005"
                },
                "dev":{
                    "epic":"10000",
                    "task":"10214",
                    "bug":"10200",
                    "simple":"10900",
                    "process":"11700"
                },
                "support":{
                    "dev":"10902"
                }
            },
            "IssueLinkTypes":{
                "Developers" : "Developes",
                "Relates":"Relates"
            },
            "issuePriorities":{
                "support":{
                    "high":"2"
                }
            },
            "timeTracking":{
                "Role":{
                    "Developer":{
                        "id":10206,
                        "key":"Developers"
                    },
                    "QA":{
                        "id":10404,
                        "key":"QA"
                    },
                    "Reviewer":{
                        "id":10900,
                        "key":"Reviewers"
                    }
                }
            }
        }
        gc['current_issue_data'] = {}
        // фиксируем параметры URL
        gc['urlParams'] = new URLSearchParams(document.location.search);
        // кнопки, которые добавлены через ScriptRunner и на которые вешаем обработчики
        gc['jiraButton'] = [
            { "key":"addNewSystem", "value":"ss-new-system-js", "isEventAdded":false, "tryAddEventCount":0},
            { "key":"addSmartTasks", "value":"bcklg-tools-menu-sub-tasks_v3", "isEventAdded":false, "tryAddEventCount":0},
            { "key":"addEpicSmartTasks", "value":"btn-smart-epic", "isEventAdded":false, "tryAddEventCount":0}]
        gc['process'] = {}
        gc['boardTeamConfigUrl']="https://dev.gitlab-pages.aservices.tech/jira-automatizator-scripts/planningConfig.json"

        // настройки процесса загрузки спринта
        gc.process["sprintResourceCalc"] = {
            "toolsTableButtonStartCalculationId":'toolsTableButtonStartCalculation'+environment,
            "started":false,
            "objPermission":{},
            "report":{}, // для расчета загрузки будущего спринта CalcWorkloadFutureSprintMain
            "reportAllFutureSprints":{ // для расчета загрузки всех будущих спринтов CalcWorkloadFutureSprintReportShowFutureWorkload2
                "btnReload_id":"calcWorkloadFutureSprintReport-ShowFutureWorkload-reload-button",
                "btnReloadSpan_id":"calcWorkloadFutureSprintReport-ShowFutureWorkload-reload-button-span",
                "content_id":"calcWorkloadFutureSprintReport-ShowFutureWorkload-content",
                "futureSprints":[],
                "futureSprints_jql":"",
                "developers":[],
                "tasks":[],
                "role":[]
            }
        } //
        // настройки процесса заливки фона задач
        gc.process["fillBackgroundIssues"] = {
            "canFill":false
        }
        // настройки для процесса отображения статусов задач на доске бэклога для первого активного спринта
        gc.process["showStatesOnBacklogBoard"] = {
            "canShow":false,
            "allSprints":false,
            "issues":[]
        }

        // получаем метаданные из Jira
        gc.current_issue_data["key"] = JIRA.Issue.getIssueKey();
        gc.current_issue_data["projectKey"] = JIRA.API.Projects.getCurrentProjectKey();
        log(`gc.current_issue_data.key = ${gc.current_issue_data.key}`);

        $(document).ajaxComplete(FajaxComplete);
        if (gc.urlParams.has("rapidView")) {
            //log('Мы на доске, требуется получение разрешений');
            getPermissions();
        } //else log('Мы не на доске, получение разрешений не требуется');

        // если это среда разработки, то добавляем боковое меню для запуска фич для отладки
        if (environment == "DEV") createDebugMenu();

        let deferredSetup = defer(setupLazyLoad, 2000);
        deferredSetup();

    }
    // установки, которын можно загружать после полной загрузки страницы
    function setupLazyLoad(){

        // добавляем кнопку на эпик для получения оценки по задачам
        setTimeout(EpicTasksAddListButtonCalc, 500); log(`Запуск setTimeout(EpicTasksAddListButtonCalc)`);
        log(`Скрипт успешно подключен. Версия ${script_version}`);
    }

    // построение меню отладки для разработки
    function createDebugMenu(){
        let styles = `
/* Dropdown Button */
.dropbtn {
  background-color: #3498DB;
  color: white;
  padding: 6px;
  font-size: 12px;
  border: none;
  cursor: pointer;
}

/* Dropdown button on hover & focus */
.dropbtn:hover, .dropbtn:focus {
  background-color: #2980B9;
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  position: relative;
  display: inline-block;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 260px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 100;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {background-color: #ddd}

/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
.show {display:block;}
`

        let styleSheet = document.createElement("style")
        styleSheet.type = "text/css"
        styleSheet.innerText = styles
        document.head.appendChild(styleSheet);

        let html1 = `
            <div class="dropdown">
              <button onclick="DropdownFunction()" class="dropbtn">Меню отладки</button>
              <div id="myDropdown" class="dropdown-content">
              </div>
            </div>
        `
        //document.body.innerHTML += html;
        let div = document.createElement('div');
        div.innerHTML = html1;
        //document.body.prepend(div);
        $("#announcement-banner").append(div);

        let newScript = document.createElement("script");
        newScript.type = "text/javascript";
        newScript.text = `
        function DropdownFunction() {
        document.getElementById("myDropdown").classList.toggle("show");
        }
            window.onclick = function(event) {
          if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
              var openDropdown = dropdowns[i];
              if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
              }
            }
          }
        }
        `;
        document.getElementsByTagName('head')[0].appendChild(newScript);

        let $menu = $(`#myDropdown`);

        // добавляем кастомные элемены в меню для отладки процессов
        // тестовый элемент
        let $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                testAlert();
            });
        $element.text("Test");
        $menu.append($element);

        // запустить создание новой системы
        $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                cns_createNewSystem();
            });
        $element.text("Создать новую систему");
        $menu.append($element);

        // запустить расчет спринта
        $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                CalcWorkloadFutureSprint(gc.process.sprintResourceCalc.objPermission);
            });
        $element.text("Расчет спринта");
        $menu.append($element);

        // запустить SMART диалог
        $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                SmartDlgShow();
            });
        $element.text("Запустить SMART диалог");
        $menu.append($element);

        // запустить SMART диалог для эпиков
        $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                EpicSmartDlgShow();
            });
        $element.text("Запустить SMART диалог для эпиков");
        $menu.append($element);

        // загрузить скрипт
        $element = $('<a>').attr({
            class: "drophref",
            href : "#"
        })
            .click(function() {
                $.getScript("https://dev.gitlab-pages.aservices.tech/jira-automatizator-scripts/epicCreateManyTasks.js");
            });
        $element.text("Загрузить скрипт");
        $menu.append($element);

    }
    // добавляем обработчики кнопкам, которые добавлены через ScriptRunner
    function AddEventToButton(){
        // количество попыток навесить события на элементы при срабатывании ajaxComplete
        let tryCountMax = 50;

        for(let x of gc.jiraButton) {
            // проверяем, была ли подписка
            if (!x.isEventAdded && x.tryAddEventCount < tryCountMax) {
                // ищем элемент
                let $jButton = $(`#${x.value}`)
                if ($jButton.length) {
                    // нашли элемент
                    switch (x.key){
                        case "addSmartTasks": {
                            SmartDlgAddBodyHTML();
                            $jButton.click(function() { SmartDlgShow() });
                            gc.current_issue_data['isSmartDlgFirst'] = true;
                            gc.process["iniciativeSubtask"] = {
                                "backend_count":0,
                                "frontend_count":0,
                                "req_count":0,
                                "test_count":0,
                                "design_count":0
                            }
                            break; }
                        case "addNewSystem": {
                            //$jButton.click(function() { showFlag('message', 'title'); });
                            $jButton.click(function() { cns_createNewSystem() });
                            break; }
                        case "addEpicSmartTasks": {
                            $jButton.click(function() { EpicSmartDlgShow() });
                            break; }
                    }
                    x.isEventAdded = true;
                    $jButton.css({"backgroundColor": "#c6d9f8"});
                    log("Найдена кнопка $jButton = "+x.key);
                } else {
                    // не нашли элемент
                    x.tryAddEventCount++;
                    //Smart_log(ln+"Кнопка не найдена $jButton = "+x.key);
                }
            }
        }
    }

    // отобразить пользователю флаг
    function showFlag(message, title, type = "info", typeClose = "manual"){
        AJS.flag({
            type: type, // success, info, warning, error
            title: title,
            body: message,
            close: typeClose, //  "manual", "auto" and "never"
            persistent: false
        });
    }
    // запуск обработчиков при ajax-изменения на странице
    function FajaxComplete(){
        if (gc.process.fillBackgroundIssues.canFill){
            setTimeout(fillKanbanCard, 10);
        }
        // проверяем подписки на события
        setTimeout(AddEventToButton, 10);

        // отображение статусов задач на доске бэклога для первого активного спринта
        //log("FajaxComplete");
        if (gc.process.showStatesOnBacklogBoard.canShow) {
            setTimeout(showStatesOnBacklogBoard, 10);
            //log("showStatesOnBacklogBoard");
        }
    }
    // получить разрешения для команд
    function getPermissions(){
        // считываем настройки по командам
        console.time('getBoardTeamConfig');
        let prBoardTeamConfigData =  getBoardTeamConfig();
        prBoardTeamConfigData.then(
            result => {
                console.timeEnd('getBoardTeamConfig'); //
                //log(`${JSON.stringify(result)} `);
                let objTeamPermissions = [];
                let teamsData = result;//JSON.parse(x);
                // обходим полученный массив комманд
                for (let teamData of teamsData) {
                    //log(`teamData.rapidView ${teamData.rapidView}`);

                    if ('rapidView' in teamData && teamData.rapidView != null && gc.urlParams.has("rapidView") && teamData.rapidView == gc.urlParams.get("rapidView")) {
                        objTeamPermissions.push(teamData);
                    }
                }
                // если разрешения были получены - запускаем обработчики правил
                if (objTeamPermissions.length>0) {
                    setTimeout(ApplyRules, 200, objTeamPermissions); log(`Запуск setTimeout(ApplyRules)`);
                }
                //log.warn(`Данные по команде не получены`);
            },
            error => {
                log(`Не удалось считать настройки по командам`);
            }
        )
    }
    // возвращает конфиг досок команд
    function getBoardTeamConfig(){
        return new Promise(function(resolve,reject){
            let url = new URL(gc.boardTeamConfigUrl);
            fetch(url).then(response => {
                    //log(`getBoardTeamConfig, response.status = ${response.status} `);
                    if (response.status != "200") {
                        log(`Ошибка выполнения запроса getBoardTeamConfig, response.status = ${response.status} `);
                        response.json().then(function(data) {
                            //log(`${JSON.stringify(data)} `);
                            reject(JSON.stringify(data));
                        });
                    } else {
                        response.json().then(function(data) {
                            //resolve(JSON.stringify(data));
                            resolve(data);
                        })
                    }
                }
            )
        })
    }
    function ApplyRules(objTeamPermissions){
        for (let objPermission of objTeamPermissions) {
            let tDelay = 200;
            if ( 'processes' in objPermission && objPermission.processes !== null && objPermission.processes.length > 0) {
                // обходим массив процессов
                for (let process of objPermission.processes) {
                    //Smart_log(`${ln} process.key= ${process.key}`);
                    switch(process.key) {
                        case "ViewEstimationsOnPlaning": {
                            setTimeout(ApplyRule_ViewEstimationsOnPlaning, tDelay, objPermission);
                            log(`Процесс разрешен: ${process.key}`);
                            break; }
                        case "FillBackgroundIssues": {
                            gc.process.fillBackgroundIssues.canFill = true;
                            log(`Процесс разрешен: ${process.key}`);
                            break; }
                        case "ShowStatesOnBacklogBoard": {
                            gc.process.showStatesOnBacklogBoard.canShow = true;
                            log(`Процесс разрешен: ${process.key}`);
                            if ("showAllSprints" in process & process.showAllSprints == "true") {
                                gc.process.showStatesOnBacklogBoard.showAllSprints = true;
                                log(`Процесс разрешен: showAllSprints = true`)
                            }
                            break; }
                    }
                }
            } else log(`Данные по доступным процессам не получены. Проверьте в конфиге секцию process`);
        }
    }
    function ApplyRule_ViewEstimationsOnPlaning(objPermission){
        // добавляем на панель кнопку запуска расчета
        let toolsTable = $('#ghx-modes-tools'); //document.getElementById("ghx-modes-tools");
        if (toolsTable !== null) {
            let btnCaption = "Расчет"
            switch (environment) {
                case "DEV": {
                    btnCaption +=` (${environment})`
                    break
                }
                case "TEST": {
                    btnCaption +=` (${environment})`
                    break
                }
            }
            let toolsTableButtonStartCalculation_html = `
<div class="aui-buttons" style="margin-left: 5px">
    <button class="aui-button aui-button-split-main" id="${gc.process.sprintResourceCalc.toolsTableButtonStartCalculationId}">${btnCaption}</button>
    <button class="aui-button aui-dropdown2-trigger aui-button-split-more" aria-controls="split-container-dropdown-sprintResourceCalc">Split more</button>
</div>
<aui-dropdown-menu id="split-container-dropdown-sprintResourceCalc">
    <aui-item-link id="item-sprintResourceCalc-showTaskWithoutEstimate">Задачи без оценки</aui-item-link>
    <aui-item-link id="item-sprintResourceCalc-showFutureWorkload2">Расчет будущих спринтов</aui-item-link>
</aui-dropdown-menu>`
            toolsTable.append(toolsTableButtonStartCalculation_html);
            // добавляем запуск основного расчета
            let toolsTableButtonStartCalculation = $(`#${gc.process.sprintResourceCalc.toolsTableButtonStartCalculationId}`);
            if (toolsTableButtonStartCalculation) {
                toolsTableButtonStartCalculation.click(function(){
                    CalcWorkloadFutureSprint(objPermission);
                });
            }
            // добавляем запуск к элементу выпадающего меню
            let toolsTableButtonStartCalculation_item = $(`#item-sprintResourceCalc-showTaskWithoutEstimate`);
            if (toolsTableButtonStartCalculation_item) {
                toolsTableButtonStartCalculation_item.click(function(){
                    CalcWorkloadFutureSprintReportIssuesWithoutEstimate();
                });
            }
            // добавляем запуск к элементу выпадающего меню
            let toolsTableButtonStartCalculation_item_showFutureWorkload2 = $(`#item-sprintResourceCalc-showFutureWorkload2`);
            if (toolsTableButtonStartCalculation_item_showFutureWorkload2) {
                toolsTableButtonStartCalculation_item_showFutureWorkload2.click(function(){
                    CalcWorkloadFutureSprintReportShowFutureWorkload2();
                });
            }
            // заносим данные для debug-меню и теперь для процесса
            gc.process.sprintResourceCalc.objPermission = objPermission;
        }
    }
    // возвращает объект запрошенной задачи
    function getIssue(issueCode,fields){
        return new Promise(function(resolve,reject){
            let url = new URL(gc.jira.urls.getIssue+issueCode);
            url.searchParams.set('AProcess', 'ABanner');
            if (fields) url.searchParams.set("fields", fields);
            fetch(url, {
                method: 'get',
                headers: {
                    "Content-type": "application/json; charset=utf-8"
                    //,"Authorization":credentials.jira.Authorization
                }
            }).then(response => {
                    if (response.status != "200") {
                        log(`Ошибка выполнения запроса для ${issueCode}, response.status = ${response.status} `);
                        response.json().then(function(data) {
                            //log(`${JSON.stringify(data)} `);
                            reject(JSON.stringify(data));
                        });
                    } else {
                        response.json().then(function(data) {
                            resolve(JSON.stringify(data));
                        })
                    }
                }
            )
        })
    }
    // создает новую задачу
    function createIssue(value,process="Unknown"){
        return new Promise(function(resolve,reject){
            let url = new URL(gc.jira.urls.postIssue);
            url.searchParams.set('AProcess', 'ABanner');
            url.searchParams.set('ABProcess', process);

            fetch(url, {
                method: 'post',
                body: JSON.stringify(value),
                headers: {
                    "Content-type": "application/json; charset=utf-8"
                }
            }).then(response => {
                    if (response.status != "201") {
                        log(`Ошибка выполнения запроса, response.status = ${response.status} `);
                        response.json().then(function(data) {
                            log(`${JSON.stringify(data)} `);
                            reject(JSON.stringify(data));
                        });
                    } else {
                        response.json().then(function(data) {
                            resolve(JSON.stringify(data));
                        })
                    }
                }
            )
        })
    }
    // создает новые задачи балком
    function createIssuesBulk(value,process="Unknown"){
        return new Promise(function(resolve,reject){
            let url = new URL(gc.jira.urls.postIssueBulk);
            url.searchParams.set('AProcess', 'ABanner');
            url.searchParams.set('ABProcess', process);

            fetch(url, {
                method: 'post',
                body: JSON.stringify(value),
                headers: {
                    "Content-type": "application/json; charset=utf-8"
                }
            }).then(response => {
                    if (response.status != "201") {
                        log(`Ошибка выполнения запроса, response.status = ${response.status} `);
                        response.json().then(function(data) {
                            log(`${JSON.stringify(data)} `);
                            reject(JSON.stringify(data));
                        });
                    } else {
                        response.json().then(function(data) {
                            resolve(JSON.stringify(data));
                        })
                    }
                }
            )
        })
    }
    // создает связь между задачами
    function createIssueLink(issueFrom, issueTo, linkType, process="Unknown"){
        let url = new URL(gc.jira.urls.postIssueLink);
        url.searchParams.set('AProcess', 'ABanner');
        url.searchParams.set('ABProcess', process);
        let data = {
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
        fetch(url, {
            method: 'post',
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json; charset=utf-8"
            }
        }).then(response => {
                if (response.status != "201") {
                    log(`Ошибка выполнения запроса, response.status = ${response.status} `);
                    response.json().then(function(data) {
                        log(`${JSON.stringify(data)} `);
                    });
                }
            }
        )
    }
    // выставляет оценку стоимости задачи
    function setTimeTracking(issueKey, roleId, originalEstimate,process="Unknown"){
        return new Promise(function(resolve,reject){
            let url = new URL(gc.jira.urls.postTimeTracking+issueKey);
            url.searchParams.set('AProcess', 'ABanner');
            url.searchParams.set('ABProcess', process);
            let value = {
                "key" : issueKey,
                "estimates":[
                    {
                        "id":roleId,
                        "originalEstimate": originalEstimate,
                        "remainingEstimate":originalEstimate
                    }
                ]
            }

            fetch(url, {
                method: 'put',
                body: JSON.stringify(value),
                headers: {
                    "Content-type": "application/json; charset=utf-8"
                }
            }).then(response => {
                    if (response.status != "200") {
                        log(`Ошибка выполнения запроса, response.status = ${response.status} `);
                        response.json().then(function(data) {
                            log(`${JSON.stringify(data)} `);
                            reject(JSON.stringify(data));
                        });
                    } else {
                        //log(`Время успешно добавлено 2`);
                        resolve(response.statusText);
                        /*response.json().then(function(data) {
                            resolve(JSON.stringify(data));
                        })*/
                    }
                }
            )
        })
    }
    // запрашиваем список задач на основании фильтра синхронно
    function GetIssuesByQueryAjax(jqlQuery, searchParams){
        let result = '';
        // считываем данные инициативы для дальнейшего использования
        let url = new URL(gc.jira.urls.searchIssue);
        if (searchParams) {
            for (let x of searchParams) {
                url.searchParams.set(x.key, x.value);
            }
        }
        //url.searchParams.set('fields', 'summary,components,customfield_11601,customfield_11610,customfield_11504');
        $.ajax({
            url: url, // указываем URL
            type: "GET", // HTTP метод, по умолчанию GET
            data: {}, // данные, которые отправляем на сервер CustomSource=AnnouncementBanner ABDetail=AB_SmartDlgShow
            dataType: "json", // тип данных загружаемых с сервера
            async: false,
            success: function (data) {
                //log(`data ${JSON.stringify(data)}`);
                //SmartDlgGetIniciativeDataFromObj(data);
                result = data;
            },
            error: function(){
                showFlag(`Не удалось получить данные по запросу <strong>${jqlQuery}</strong>. Попробуйте перезагрузить страницу.`,"Внимание!","error");
                log(`Ошибка выполнения GET запроса ${jqlQuery}`);
                log(`url: ${url}`);
                return result;
            }
        });
        return result;
    }
    // непоянтно - общая задача или нет
    // ToDo: Выпилить!
    function GetIssueTimetracking(issueKey){
        let result;

        let url = new URL(gc.jira.urls.getTimeTracking+issueKey); // "/rest/api/2/issue/"
        url.searchParams.set('fields', 'description');
        url.searchParams.set('CustomSource', 'AB_GetIssueTimetracking');

        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        //xhr.setRequestHeader('SOAPAction', 'AnnouncementBanner');

        xhr.send();
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
        return result;
    }
    // ToDo: Выпилить!
    function GetIssuesByQuery(jqlQuery, searchParams){
        let result = null;
        let url = new URL(gc.jira.urls.searchIssue );
        if (searchParams) {
            for (let x of searchParams) {
                url.searchParams.set(x.key, x.value);
                //Smart_log(ln+`x.key: ${x.key} x.value: ${x.value}`);
            }
        }
        url.searchParams.set('CustomSource', 'AB_GetIssuesByQuery'); // CustomSource=AnnouncementBanner CustomSource=AB_GetIssueTimetracking CustomSource=AB_GetIssue CustomSource=AB_GetIssueByParams CustomSource=AB_GetIssuesByQuery
        //Smart_log(ln+`url: ${url}`);

        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
            //Smart_log(ln+`Ошибка ${xhr.status}: ${xhr.statusText}`);
        } else { // если всё прошло гладко, выводим результат
            //Smart_log(ln+`Готово, получили ${xhr.response.length/1024} Kбайт`);
            result = xhr.responseText;
        }
        return result;
    }

    function testAlert(){
        alert("0");
        /*let prDevTaskTime = setTimeTracking("SS-13484", "10206", "5m","test");
        prDevTaskTime.then(
            result => {
                log(`Время успешно добавлено`);
            },
            error => {
                log(`Ошибка корректировки времени`);
                showFlag(`Ошибка корректировки времени`,"Внимание!","error");
            })*/
    }

    /*
        Расчет загрузки будущего спринта
    */
    // получаем будущий спринт I
    function GetFirstFutureSprintByHtmlAsElement(){
        let result = null;
        let elFutureSprints = document.getElementsByClassName("ghx-backlog-container ghx-sprint-planned js-sprint-container");
        if (elFutureSprints !== null && elFutureSprints.length>0) {
            result = elFutureSprints[0];
        } else log("Будущий спринт не найден");
        return result;
    }
    // получаем текущий активный спринт I
    function GetFirstCurrentActiveSprintId(){
        let result = 0;
        let $elCurrentSprints = $(".ghx-backlog-container.ghx-sprint-active.js-sprint-container.ghx-open").first();
        if ($elCurrentSprints.length>0) {
            result = $elCurrentSprints.attr("data-sprint-id");
        }
        return result;
    }
    // получаем будущий спринт II
    function GetFutureSprintId(){
        let result = -1;
        let elFutureSprint = GetFirstFutureSprintByHtmlAsElement();
        if (elFutureSprint !== null) {
            let futureSprintId = elFutureSprint.getAttribute("data-sprint-id");
            if (futureSprintId !== null) {
                result = futureSprintId
            }
        }
        return result
    }
    // старт расчета, делаем индикацию начала работы
    function CalcWorkloadFutureSprint(objPermission){
        let toolsTableButtonStartCalculation = document.getElementById(gc.process.sprintResourceCalc.toolsTableButtonStartCalculationId);
        if (toolsTableButtonStartCalculation !== null) {
            toolsTableButtonStartCalculation.style.backgroundColor = "#ff7a83"
        }
        setTimeout(CalcWorkloadFutureSprintMain, 200, objPermission);
    }
    function ParseRoleLogin(value){ // value: "Role: 10206 (cherkasov)"
        let result='';

        let posBegin = value.indexOf("(");
        if ( posBegin > 0) {
            let posEnd = value.indexOf(")");
            if ( (posEnd-posBegin) > 1 ) {
                result = value.substring(posBegin+1,posEnd);
            }
        }

        return result;
    }
    function ParseRoleCode(value){ // value: "Role: 10206 (cherkasov)"
        let result='';

        let posBegin = value.indexOf(":");
        if ( posBegin > 0) {
            let posEnd = value.indexOf("(");
            result = (value.substring(posBegin+1,posEnd)).trim();
        }

        return result;
    }
    function ParseRoleEstimateFromTask(value, role){
        let result = 0;
        for (let x of value) {
            //log(`${x} ${role}`);
            if (x.indexOf(role)>-1) {
                if (x.indexOf('null') == -1) {
                    let pos1 = x.indexOf('|');
                    let pos2 = x.indexOf('(',pos1);
                    result = (x.substring(pos1+1,pos2)).trim()
                    //log(`result(${result})`)
                }
            }
        }
        /*
"customfield_11303": [
"Role: Developers (18000(5h) | 18000(5h))",
"Role: QA (null | null)",
"Role: Reviewers (0(0h) | 0(0h))"
]
* */
        return result;
    }
    function UpdateEstimateInfoByDeveloper() {
        let sprintId = gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints[0].sprintId;
        //log(`UpdateEstimateInfoByDeveloper sprintId = ${sprintId}`);
        // // developer.sprints[sprint.sprintId]={estimate:0,hasTaskWithoutEstimate:false,tasks:[]}
        // выводим оценки на панель в рамках социальной ответственности
        for (let developer of gc.process.sprintResourceCalc.reportAllFutureSprints.developers) {
            let estimate = 0;
            let color = "black";
            let bgColor = "";
            let maxCapacity = 30;

            if (sprintId in developer.sprints) {
                estimate = (developer.sprints[sprintId].estimate/60/60).toFixed(0);
                if (developer.sprints[sprintId].hasTaskWithoutEstimate) bgColor = "yellow";
            }
            //log(`${JSON.stringify(developer)}`);
            // если превышено доступное время
            // обходим массив процессов
            for (let process of gc.process.sprintResourceCalc.objPermission.processes) {
                //Smart_log(`${ln} process.key= ${process.key}`);
                switch(process.key) {
                    case "ViewEstimationsOnPlaning": {
                        if (process.capacity) {
                            maxCapacity = process.capacity;
                        }
                        break; }
                }
            }
            // if ('team' in objPermission && objPermission.team != null && objPermission.team.length > 0) {
            // let channel_url = credentials.zoom[room] && credentials.zoom[room].url;
            if (estimate > maxCapacity) color = "red";
            // если есть задачи без оценки
            SetElementEstimateInfoByDeveloper(developer.dataFilterId,estimate, color,bgColor);
        }
    }
    function SetElementEstimateInfoByDeveloper(elParentAttr,value,color, bgColor){
        let elParent = document.querySelector(`[data-filter-id="${elParentAttr}"]`);
        //Smart_log(ln+`[data-filter-id=${elem_attribyte_value}]`);
        if (elParent) {
            let templateDIVId = `div${elParentAttr}`;
            let elCustomEstimation = document.getElementById(templateDIVId);
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
            log(`Элемент [data-filter-id="${elParentAttr}"] не найден`);
            gc.process.sprintResourceCalc.report.message+=`<br>Элемент [data-filter-id="${elParentAttr}"] не найден`
        }
    }
    function UpdateEstimateInfoByRole() {
        let rolesEstimates = gc.process.sprintResourceCalc.reportAllFutureSprints.role
        if ( rolesEstimates.length > 0 ) {
            // выводим оценки на панель в рамках социальной ответственности
            for (let roleEstimate of rolesEstimates) {
                let estimate = (roleEstimate.estimate > 0) ? (roleEstimate.estimate/60/60).toFixed(0) : "0";
                let templateValue = "";
                switch(roleEstimate.key) {
                    case "QA": {
                        templateValue = estimate;
                        break; }
                    case "Developers": {
                        let estimateUnnassigneeDev = (roleEstimate.unnassigneeDev > 0) ? (roleEstimate.unnassigneeDev/60/60).toFixed(0) : "0";
                        templateValue = `${estimate}/${estimateUnnassigneeDev}`;
                        break; }
                }
                let color = "black";
                //if (estimate > 25) color = "red";
                SetElementEstimateInfoByDeveloper(roleEstimate.dataFilterId,templateValue, color,"");
            }
        }
    }
    // расчет загрузки
    function CalcWorkloadFutureSprint_GetIssue(){
        let jqlQuery = `Sprint in (${gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints_jql}) and status != Closed ORDER BY Sprint ASC`;
        log(jqlQuery);
        let requestParams = [{key:'maxResults',value:'1000'},{key:'jql',value:jqlQuery},{key:'fields',value:`assignee,summary,${gc.jira.fields.taskMetaDataAssigneeByRole},${gc.jira.fields.taskMetaDataEstimateByRole},${gc.jira.fields.taskMetaDataSprint}`},{key:'Detail',value:'CalcWorkloadfutureSprint'}];
        let obj = JSON.parse(GetIssuesByQuery(jqlQuery,requestParams));
        return obj
    }
    function CalcWorkloadFutureSprint_GetTeam(){
        let result = true;
        // проверяем - были ли уже сформированы первичные данные по команде
        if (gc.process.sprintResourceCalc.reportAllFutureSprints.developers.length == 0) {
            if ('team' in gc.process.sprintResourceCalc.objPermission && gc.process.sprintResourceCalc.objPermission.team != null && gc.process.sprintResourceCalc.objPermission.team.length > 0) {
                for (let x of gc.process.sprintResourceCalc.objPermission.team) {
                    let developer = {
                        key:x.key,
                        sprints:{},
                        dataFilterId:x.dataFilterId,
                        role:x.role,
                        displayName:""
                    }
                    gc.process.sprintResourceCalc.reportAllFutureSprints.developers.push(developer);
                }
            } else result = false;
        }
        return result
    }
    function CalcWorkloadFutureSprint_GetSprints(isOne){
        let result = false
        gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints.length = 0;
        gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints_jql = ""
        let futureSprints_el;
        if (isOne) {
            futureSprints_el = $('.ghx-backlog-container.ghx-sprint-planned.js-sprint-container').first();
        } else {
            futureSprints_el = $('.ghx-backlog-container.ghx-sprint-planned.js-sprint-container');
        }

        if (futureSprints_el) {
            log(`Найдено будущих спринтов: ${futureSprints_el.length}`);
            $(futureSprints_el).each(function(indx){
                let pref = ","
                if (indx == 0) { pref = "" }
                let sprintId = $(this).attr('data-sprint-id');
                let sprintName = $(this).find('.js-edit-sprintName-trigger').attr('data-fieldvalue');
                log(`sprintId ${sprintId} sprintName ${sprintName}`);

                gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints.push({"sprintId":sprintId,"sprintName":sprintName, "tasks":[]});
                gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints_jql+=`${pref}${sprintId}`
            });
            result = true;
        } else log(`Не найдено ни одного будущего спринта`)
        return result
    }
    function CalcWorkloadFutureSprint_ParseTasks(objIssues){
        let result = false;
        if (objIssues) {
            if ('total' in objIssues && objIssues.total > 0) {
                log(`Найдено задач: ${objIssues.total}`);
                gc.process.sprintResourceCalc.started = true;
                gc.process.sprintResourceCalc.report = {"issuesWithoutAssignee":[], "issuesWithoutEstimate": {}, "message":""}
                gc.process.sprintResourceCalc.reportAllFutureSprints.tasks.length = 0
                for (let objIssue of objIssues.issues) {
                    let summary = ""
                    if ( 'summary' in objIssue.fields && objIssue.fields.summary !== null) {
                        summary = objIssue.fields.summary;
                    }
                    let assignee = "";
                    let assigneeDisplayName = "";
                    if ( 'assignee' in objIssue.fields && objIssue.fields.assignee !== null && 'key' in objIssue.fields.assignee ) {
                        assignee=objIssue.fields.assignee.name;
                        assigneeDisplayName = objIssue.fields.assignee.displayName;
                    } else {
                        gc.process.sprintResourceCalc.report.issuesWithoutAssignee.push({"issueKey":objIssue.key, "summary":summary});
                    }
                    let sprint = ""
                    if ( gc.jira.fields.taskMetaDataSprint in objIssue.fields && objIssue.fields[gc.jira.fields.taskMetaDataSprint] !== null && objIssue.fields[gc.jira.fields.taskMetaDataSprint].length>0 ) {
                        /*
"customfield_10104": [
"com.atlassian.greenhopper.service.sprint.Sprint@346e5a82[id=4511,rapidViewId=479,state=CLOSED,name=ASE Sprint 21.25,startDate=2021-06-21T11:43:43.410+03:00,endDate=2021-06-26T11:43:00.000+03:00,completeDate=2021-06-28T10:05:50.640+03:00,sequence=4511,goal=1. Сайты - отказ от sendsayDD на PROD\n2. ГБ - синк редблоков на PROD (сам синк может быть не закончен)\n3. ГБ - сервис учетная политика на PROD]",
"com.atlassian.greenhopper.service.sprint.Sprint@29e76da8[id=4512,rapidViewId=479,state=CLOSED,name=ASE Sprint 21.26,startDate=2021-06-28T11:36:39.785+03:00,endDate=2021-07-03T11:36:00.000+03:00,completeDate=2021-07-04T20:16:10.135+03:00,sequence=4512,goal=1. Сайты - автописьма СС на RC \n2. Реестры - скрытие навыков на PROD]",
"com.atlassian.greenhopper.service.sprint.Sprint@7d0d2a37[id=4513,rapidViewId=479,state=CLOSED,name=ASE Sprint 21.27,startDate=2021-07-05T11:35:21.161+03:00,endDate=2021-07-10T11:35:00.000+03:00,completeDate=2021-07-09T19:03:00.767+03:00,sequence=4513,goal=Автописьма на прод (релиз 90)]",
"com.atlassian.greenhopper.service.sprint.Sprint@2f67c41[id=4580,rapidViewId=479,state=FUTURE,name=ASE Sprint 21.28,startDate=<null>,endDate=<null>,completeDate=<null>,sequence=4580,goal=1. Сервисы ГБ на бою (контент + переключение трафика)  2. Печатка. Деплой по сегментам. На проде.]"
]
                        * */
                        for (let sprintTaskData of objIssue.fields[gc.jira.fields.taskMetaDataSprint]) {
                            if (sprintTaskData.indexOf('state=FUTURE')>-1) {
                                let ind1 = sprintTaskData.indexOf('id=');
                                if (ind1 > -1) {
                                    let ind2 = sprintTaskData.indexOf(',', ind1);
                                    sprint = sprintTaskData.slice(ind1+3,ind2)
                                }
                                break;
                            }
                        }

                    }
                    let sprintTaskInfo = {
                        issueKey:objIssue.key,
                        assignee:assignee,
                        summary:summary,
                        sprintId:sprint,
                        displayName:assigneeDisplayName,
                        roles :[{key:"Developers", assignee:"", estimate:0},{key:"QA", assignee:"", estimate:0}]
                    }
                    // обрабатывам роли из задачи
                    if ( gc.jira.fields.taskMetaDataAssigneeByRole in objIssue.fields && objIssue.fields[gc.jira.fields.taskMetaDataAssigneeByRole] !== null) {
                        for (let roleCustomField of objIssue.fields[gc.jira.fields.taskMetaDataAssigneeByRole]) {
                            let roleLogin = ParseRoleLogin(roleCustomField);
                            //Smart_log(`${ln} ParseRoleLogin = ${roleLogin}, roleCustomField = ${roleCustomField}`);
                            let roleCode = ParseRoleCode(roleCustomField);
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
                    // для каждой задачи получаем информацию по оценке
                    if ( gc.jira.fields.taskMetaDataEstimateByRole in objIssue.fields && objIssue.fields[gc.jira.fields.taskMetaDataEstimateByRole] !== null) {
                        for (let role of sprintTaskInfo.roles) {
                            role.estimate = ParseRoleEstimateFromTask(objIssue.fields[gc.jira.fields.taskMetaDataEstimateByRole],role.key);
                        }
                    } else log(`Нет данных по оценкам ролей ${gc.jira.fields.taskMetaDataEstimateByRole}`);
                    log(`objIssues.issues: ${sprintTaskInfo.issueKey} ${sprintTaskInfo.assignee} ${sprintTaskInfo.roles[0].estimate/60/60}`);
                    //log(`data ${JSON.stringify(objIssue)}`);
                    // добавляем данные по задачам в массив
                    gc.process.sprintResourceCalc.reportAllFutureSprints.tasks.push(sprintTaskInfo);
                }

                // привязываем задачи к спринтам
                // gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints.push({"sprintId":sprintId,"sprintName":sprintName, "tasks":[]});
                for (let sprint of gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints) {
                    let sprintTasks = gc.process.sprintResourceCalc.reportAllFutureSprints.tasks.filter(issue => issue.sprintId === sprint.sprintId);
                    // удаляем данные прошлого расчета
                    //sprint.task.length=0;
                    sprint.tasks = sprintTasks;
                    //log(`${sprint.sprintName} ${sprintTasks.length}`);
                    // для каждого разработчика определяем нагрузку в спринт
                    for (let developer of gc.process.sprintResourceCalc.reportAllFutureSprints.developers) {
                        // удаляем данные прошлого расчета
                        delete developer.sprints[sprint.sprintId];
                        // получаем массив задач, назначенный на разработчика
                        let assigneeTasks = sprint.tasks.filter(issue => issue.assignee === developer.key)
                        if (!!assigneeTasks && assigneeTasks.length>0) {
                            developer.sprints[sprint.sprintId]={estimate:0,hasTaskWithoutEstimate:false,tasks:[]}
                            // обходим массив отфильтрованных задач по assignee
                            for (let task of assigneeTasks) {
                                if (developer.displayName == "" && task.displayName != "" ) {
                                    let fio = task.displayName.split(" ")
                                    developer.displayName = `${fio[0]} ${fio[1]}`;
                                }
                                // roles :[{key:"Developers", assignee:"", estimate:0},{key:"QA", assignee:"", estimate:0}]
                                let task_info = {
                                    issueKey:task.issueKey,
                                    summary:task.summary,
                                    estimate:0
                                }
                                // обходим массив ролей в задаче
                                for (let taskRole of task.roles) {
                                    if (taskRole.key == developer.role) {
                                        if (taskRole.estimate>0) {
                                            developer.sprints[sprint.sprintId].estimate += Number(taskRole.estimate);
                                            task_info.estimate=Number(taskRole.estimate);
                                            //log(`${task.issueKey} ${developer.key} ${taskRole.estimate}`);
                                        } else {
                                            developer.sprints[sprint.sprintId].hasTaskWithoutEstimate = true;
                                            if (!(task.assignee in gc.process.sprintResourceCalc.report.issuesWithoutEstimate)) {
                                                gc.process.sprintResourceCalc.report.issuesWithoutEstimate[task.assignee] = {"issues":[]};
                                            }
                                            gc.process.sprintResourceCalc.report.issuesWithoutEstimate[task.assignee].issues.push({"issueKey":task.issueKey, "summary":task.summary});
                                        }
                                    }
                                }
                                developer.sprints[sprint.sprintId].tasks.push(task_info);
                                log(`assigneeTasks: ${developer.key} ${task.issueKey} ${task_info.estimate/60/60}`);
                            }
                            log(`sprint estimate: ${developer.key} ${developer.sprints[sprint.sprintId].estimate/60/60}`);
                        }
                    }
                }

                result = true;
            }
        }
        return result
    }
    function CalcWorkloadFutureSprint_ParseRole(objPermission){
        let result = false;
        if (gc.process.sprintResourceCalc.reportAllFutureSprints.role.length == 0) {
            // формируем данные по ролям
            if ('summaryByRoles' in objPermission && objPermission.summaryByRoles != null && objPermission.summaryByRoles.length > 0) {
                for (let role of objPermission.summaryByRoles) { // TO-DO: лишний цикл, кажись. Можно сразу по объекту идти в цикле ниже и там уже заполнять массив
                    let roleInfo = {
                        key: role.key,
                        estimate: 0,
                        unnassigneeDev: 0,
                        dataFilterId: role.dataFilterId
                    }
                    //Smart_log(ln+`roleInfo.key = ${roleInfo.key}, roleInfo.dataFilterId = ${roleInfo.dataFilterId}`);
                    gc.process.sprintResourceCalc.reportAllFutureSprints.role.push(roleInfo);
                }
            }
        }
        if (gc.process.sprintResourceCalc.reportAllFutureSprints.role.length > 0) {
            result = true;
            let sprintId = gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints[0].sprintId;
            let futureSprintTasks = gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints[0].tasks;
            let rolesEstimates = gc.process.sprintResourceCalc.reportAllFutureSprints.role
            for (let futureSprintTask of futureSprintTasks) {
                for (let roleEstimates of rolesEstimates) {
                    for (let taskRole of futureSprintTask.roles) {
                        if (taskRole.key == roleEstimates.key) {
                            if (taskRole.estimate > 0) roleEstimates.estimate += Number(taskRole.estimate);
                            // обработка задач для роли Developers, у которых не назначен assignee
                            // считаем сумму часов для этой роли
                            if (taskRole.key == "Developers") {
                                if (futureSprintTask.assignee == "") {
                                    roleEstimates.unnassigneeDev += Number(taskRole.estimate);
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
    function CalcWorkloadFutureSprintMain(objPermission){
        // получаем будущий спринт
        if (CalcWorkloadFutureSprint_GetSprints(true)) {
            // получаем результаты запроса - массив задач
            if ( CalcWorkloadFutureSprint_GetTeam() ) {
                let objIssues = CalcWorkloadFutureSprint_GetIssue();
                if (CalcWorkloadFutureSprint_ParseTasks(objIssues)) {
                    UpdateEstimateInfoByDeveloper();
                    if (CalcWorkloadFutureSprint_ParseRole(objPermission)) {
                        // выводим результат
                        UpdateEstimateInfoByRole();
                    }
                }
            }
        } else log(`Не найден будущий спринт`);
        // удаляем индикатор
        let toolsTableButtonStartCalculation = document.getElementById(gc.process.sprintResourceCalc.toolsTableButtonStartCalculationId);
        if (toolsTableButtonStartCalculation !== null) {
            toolsTableButtonStartCalculation.style.backgroundColor = "#ECEDF0"
        }
    }
    function CalcWorkloadFutureSprintReportIssuesWithoutEstimate(){
        if (gc.process.sprintResourceCalc.started) {
            //alert("Функционал находится в разработке.");
            // ищем наш диалог, если нет - добавляем
            if ( !($('*').is("#calcWorkloadFutureSprintReport-dialog")) ) {
                let dialog = `
<section id="calcWorkloadFutureSprintReport-dialog" class="aui-dialog2 aui-dialog2-xlarge aui-layer calcWorkloadFutureSprintReport-dialog" role="dialog" aria-hidden="true">
<header class="aui-dialog2-header">
Отчет по последнему расчету
</header>
<div id="calcWorkloadFutureSprintReport-content" class="aui-dialog2-content">
</div>
<footer class="aui-dialog2-footer">
    <div class="aui-dialog2-footer-actions">
        <button id="calcWorkloadFutureSprintReport-submit-button" class="aui-button aui-button-primary">Ok</button>
    </div>
</footer>
</section>

<style>
.calcWorkloadFutureSprintReport-dialog {
   width: 900px;
}
</style>
`;
                $("body").append(dialog);
                $("#calcWorkloadFutureSprintReport-submit-button").on('click', function (e) {
                    e.preventDefault();
                    AJS.dialog2("#calcWorkloadFutureSprintReport-dialog").hide();
                });
            }
            // удаляем контент, если он был
            $('#calcWorkloadFutureSprintReport-content').empty();
            let content = `<dl>`
            // проверяем неназначенные задачи
            if (gc.process.sprintResourceCalc.report.issuesWithoutAssignee.length > 0) {
                content+='<dt>Неназначенные задачи</dt>'
                for (let x of gc.process.sprintResourceCalc.report.issuesWithoutAssignee) {
                    content+=`<dd><a href="${gc.jira.urls.viewIssue}${x.issueKey}">${x.issueKey} ${x.summary}</a></dd>`
                }
            }
            // gc.process.sprintResourceCalc.report.issuesWithoutEstimate[task.assignee] = {"issues":[]};
            // gc.process.sprintResourceCalc.report.issuesWithoutEstimate[task.assignee].issues.push({"issueKey":task.issueKey});
            if (Object.keys(gc.process.sprintResourceCalc.report.issuesWithoutEstimate).length > 0) {
                content+='<dt>Задачи без оценки ( remainingEstimate=0 )</dt>'
            }
            for (let assignee in gc.process.sprintResourceCalc.report.issuesWithoutEstimate) {
                content+=`<dt>${assignee}</dt>`
                for (let task of gc.process.sprintResourceCalc.report.issuesWithoutEstimate[`${assignee}`].issues) {
                    content+=`<dd><a href="${gc.jira.urls.viewIssue}${task.issueKey}">${task.issueKey} ${task.summary}</a></dd>`
                }
            }
            if (gc.process.sprintResourceCalc.report.message.length>0) {
                content+=`<dt>Прочее</dt>`
                content+=`<dd>${gc.process.sprintResourceCalc.report.message}</dd>`
            }
            content+='</dl>'
            $('#calcWorkloadFutureSprintReport-content').append(content);
            AJS.dialog2("#calcWorkloadFutureSprintReport-dialog").show();
        } else {
            alert("Необходимо сначала запустить расчет");
        }
    }
    function CalcWorkloadFutureSprintReportShowFutureWorkload2(){
        let dialog_id="calcWorkloadFutureSprintReport-dialog-ShowFutureWorkload"
        let dialog_jq=`#${dialog_id}`
        let btnOk_id="calcWorkloadFutureSprintReport-ShowFutureWorkload-submit-button"
        let btnOk_jq=`#${btnOk_id}`
        // ищем наш диалог, если нет - добавляем table[class~="SFWl_table"] tr:first-child
        if ( !($('*').is(dialog_jq)) ) {
            let dialog = `
<section id="${dialog_id}" class="aui-dialog2 aui-dialog2-xlarge aui-layer ${dialog_id}" role="dialog" aria-hidden="true">
<header class="aui-dialog2-header">
    Расчет будущих спринтов
    <button class="aui-button" id="${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}" style="width: 38px">
        <span id="${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReloadSpan_id}" class="aui-icon aui-icon-small aui-iconfont-refresh"></span>
    </button>
</header>
<div id="${gc.process.sprintResourceCalc.reportAllFutureSprints.content_id}" class="aui-dialog2-content">
</div>
<footer class="aui-dialog2-footer">
    <div class="aui-dialog2-footer-actions">
        <button id="${btnOk_id}" class="aui-button aui-button-primary">Ok</button>
    </div>
</footer>
</section>

<style>
.${dialog_id} {
   width: 100%;
}
.SFWl_table {
    font-family: "Lucida Sans Unicode", "Lucida Grande", Sans-Serif;
    font-size: 14px;
    text-align: center;
    border-collapse: collapse;
    background: #ffffff;
    margin: 10px;
    /*width: 100%;*/
}
.SFWl_table th {
    color: #0263b7;
    border-bottom: 2px solid #377bb5;
    padding: 12px 17px;
    /*writing-mode: vertical-lr;
    text-orientation: upright;*/
    /*display: block;*/
}
.SFWl_table td {
    /*color: #CAD4D6;*/
    /*border-bottom: 1px solid #37B5A5;*/
    border-right:1px solid #c6daef;
    padding: 7px 17px;
}
.SFWl_table td:first-child {
    text-align: left;
    /*width: 200px;*/
}
.SFWl_table tr:last-child td {
  border-bottom: none;
}
.SFWl_table tr:first-child td {
  width: 200px;
}
.SFWl_table tr:nth-child(even) {
  background: #eceeef;
}
.SFWl_table td:last-child {
  border-right: none;
}
.SFWl_table tr:hover td {
  color: #e51f1f;
  font-weight: bold;
}
</style>
`;
            $("body").append(dialog);
            $(btnOk_jq).on('click', function (e) {
                e.preventDefault();
                AJS.dialog2(dialog_jq).hide();
            });
            $(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}`).on('click', function (e) {
                CalcWorkloadFutureSprintReportShowFutureWorkload_Start();
            });
            AJS.$(document).on('btnReloadStart', `#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}`, function() {
                let that = this;
                if (!that.isBusy()) {
                    $(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReloadSpan_id}`).hide();
                    that.busy();
                }
            });
            AJS.$(document).on('btnReloadStop', `#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}`, function() {
                let that = this;
                if (that.isBusy()) {
                    that.idle();
                    $(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReloadSpan_id}`).show();
                }
            });
        }

        AJS.dialog2(dialog_jq).show();
        CalcWorkloadFutureSprintReportShowFutureWorkload_Start();
    }
    function CalcWorkloadFutureSprintReportShowFutureWorkload_Start(){
        let content_report="";
        let content_error_report="";

        setTimeout(function() {
            AJS.$(document).find(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}`).trigger('btnReloadStart');
        }, 0);
        setTimeout(function() {
            $(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.content_id}`).empty();
        }, 0);
        setTimeout(function() {
            if (!CalcWorkloadFutureSprint_GetSprints(false)) {
                content_error_report+=`Не найдено ни одного будущего спринта. Необходимо обновить страницу`;
            } else {
                if (!CalcWorkloadFutureSprint_GetTeam()) {
                    content_error_report+=`</br>Нет данных по разработчикам. Проверьте конфиг команды`;
                } else {
                    // получаем список задач по всем спринтам
                    let objIssues = CalcWorkloadFutureSprint_GetIssue();
                    if (CalcWorkloadFutureSprint_ParseTasks(objIssues)) {
                        // формируем данные для отчета
                        let content_table = `<table class="SFWl_table">` //style="width: 100%"
                        // добавляем заголовки
                        content_table += `<tr>`
                        content_table += `<th>Разработчик</th>`
                        for (let sprint of gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints) {
                            content_table += `<th>${sprint.sprintName}</th>`
                        }
                        content_table += `</tr>`
                        // Добавляем строки
                        for (let developer of gc.process.sprintResourceCalc.reportAllFutureSprints.developers) {
                            content_table += `<tr>`
                            let name = developer.key;
                            if (developer.displayName !="") {
                                name = developer.displayName
                            }
                            content_table += `<td>${name}</td>`
                            for (let sprint of gc.process.sprintResourceCalc.reportAllFutureSprints.futureSprints) {
                                let estimate = "";
                                if (sprint.sprintId in developer.sprints) {
                                    estimate = (developer.sprints[sprint.sprintId].estimate/60/60).toFixed(0);
                                }
                                content_table += `<td>${estimate}</td>`
                            }
                            content_table += `</tr>`
                        }
                        content_table += `</table>`
                        content_report+=content_table;
                    } else {
                        content_error_report+=`</br>Не удалось получить данные по запросу ${jqlQuery}`;
                    }
                }
            }
            // content_error_report+=`</br>Не найдено спринтов`
            //content_report+=`Найдено будущих спринтов: ${futureSprints_el.length}`;
            content_report+=`</br>${content_error_report}`
            $(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.content_id}`).append(content_report);

            setTimeout(function() {
                AJS.$(document).find(`#${gc.process.sprintResourceCalc.reportAllFutureSprints.btnReload_id}`).trigger('btnReloadStop');
            }, 0);

        }, 500);
    }

    // скрываем расширения для задачи списка задач бэклога
    function HideExtendedBacklogTasksPanel(){
        // скрываем доп. информацию в строке задачи
        $("head").append($("<style type='text/css'>.ghx-issue-compact .ghx-plan-extra-fields.ghx-plan-extra-fields.ghx-row {display: none;} .ghx-extra-field {display: none;} </style>"));
        //$("head").append($("<style type='text/css'> ghx-extra-field {display: none;} </style>"));

        // в задачах без фикс и эпика добавляем div и и переносим узел с assigne и оценкой

    }
    // цветовая заливка карточек на канбан-доске
    function fillKanbanCard(){
        // проверяем, что мы на доске
        // https://jira.action-media.ru/secure/RapidBoard.jspa?rapidView=746&view=detail&selectedIssue=SS-11463
        if (!gc.urlParams.has("rapidView")) {
            return;
        } /*else {
            // проверяем, что мы на нужной доске
            if ( gc.urlParams.get("rapidView") !== "136") return; // 746
        }*/

        // ищем карты по agile доске
        let $cards = $(".js-detailview");
        //log(`cards.length ${$cards.length} `);
        if ($cards.length > 0) {
            $cards.each(function(indx){
                // ищем элемент ghx-grabber
                let cardGrabberColor = $(this).children(".ghx-grabber").css('background-color');
                if ( cardGrabberColor !== 'rgb(238, 238, 238)' ) {
                    $(this).css('background-color',cardGrabberColor)
                };
            })
        }

        // ищем карты по backlog доске
        // берем только активный спринт
        let $activeSprintContainer = $(".ghx-backlog-container.ghx-sprint-active.js-sprint-container.ghx-open");
        let $listTasks = $activeSprintContainer.find(".js-issue"); // ghx-row js-issue ghx-end
        //log(`cards.length ${$cards.length} `);
        if ($listTasks.length > 0) {
            $listTasks.each(function(indx){
                // ищем элемент ghx-grabber
                let cardGrabberColor = $(this).children(".ghx-grabber").css('background-color');
                if ( cardGrabberColor !== 'rgb(238, 238, 238)' ) {
                    $(this).css('background-color',cardGrabberColor);
                    $(this).find(".ghx-end").css('background-color',cardGrabberColor);
                };
            })
        }
    }
    function showStatesOnBacklogBoardLoadTasks(){
        let sprints_el;
        let sprints_jql = ""
        if (!gc.process.showStatesOnBacklogBoard.showAllSprints) {
            sprints_el = $('.ghx-backlog-container.ghx-sprint-active.js-sprint-container').first();
        } else {
            sprints_el = $('.ghx-backlog-container.js-sprint-container');
        }
        if (sprints_el) {
            log(`Найдено будущих спринтов: ${sprints_el.length}`);
            $(sprints_el).each(function(indx){
                let pref = ","
                if (indx == 0) { pref = "" }
                let sprintId = $(this).attr('data-sprint-id');
                //let sprintName = $(this).find('.js-edit-sprintName-trigger').attr('data-fieldvalue');
                log(`sprintId ${sprintId}`);
                sprints_jql+=`${pref}${sprintId}`
            });
            if (sprints_jql.length > 0) {
                log(`Считываем задачи спринтов ${sprints_jql}`);
                let jqlQuery = `Sprint in (${sprints_jql})  `;
                let requestParams = [{key:'maxResults',value:'2000'},{key:'jql',value:jqlQuery},{key:'fields',value:'key,id,status'}];
                // получаем результаты запроса - массив задач
                //let objIssues = JSON.parse(GetIssuesByQueryAjax(jqlQuery,requestParams));
                let objIssues = GetIssuesByQueryAjax(jqlQuery,requestParams);
                //log(`${JSON.stringify(objIssues)}`);
                if (objIssues) {
                    if ('total' in objIssues && objIssues.total > 0) {
                        let sprintTasks = [];
                        // обходим полученные задачи
                        for (let objIssue of objIssues.issues) {
                            // результаты кладем в массив процесса
                            gc.process.showStatesOnBacklogBoard.issues.push({"id":objIssue.id,"key":objIssue.key,"statusName":objIssue.fields.status.name});
                        }
                        // разрешаем отображение статусов по данным массива
                        //gc.process.showStatesOnBacklogBoard.canShow = true;
                        //setTimeout(showStatesOnBacklogBoard, 10);
                        log(`Считано ${objIssues.total} задач`);
                    } else log('Считано 0 задач');
                } else log('Ошибка получения объекта с задачами');
            }
        } else log(`Не найдено ни одного спринта`)
    }
    // отображение статусов задач на доске бэклога для первого активного спринта
    function showStatesOnBacklogBoard(){
        // отключаем обновление
        gc.process.showStatesOnBacklogBoard.canShow = false;

        // проверяем, что у нас есть задачи для обновления
        // если нет, то пытаемся их получить
        if (gc.process.showStatesOnBacklogBoard.issues.length <1) {
            showStatesOnBacklogBoardLoadTasks();
        }
        // если у нас есть уже задачи или мы только что их получили, то обновляем статусы
        if (gc.process.showStatesOnBacklogBoard.issues.length >0) {
            // находим первый активный спринт
            let $elCurrentSprints = $(".ghx-backlog-container.js-sprint-container");
            if ($elCurrentSprints.length>0) {
                // обходим все элементы задач в списке
                let $elTasks = $elCurrentSprints.find(".js-issue");
                $elTasks.each(function(indx){
                    let taskKey = $(this).attr("data-issue-key");
                    // ищем наш элемент, если наши, то ничего не делаем
                    // если не нашли, то ищем его статус и добавляем к задаче
                    let $customEl = $(this).find(`.${gc.jira.elements.stateCustomClass}`)
                    if ($customEl.length < 1) {
                        // ищем статус задачи
                        let dataTask = gc.process.showStatesOnBacklogBoard.issues.find(x => x.key == taskKey);
                        if (dataTask) {
                            let $stateSpan = $('<span/>', {
                                //id: 'foo',
                                //href: 'http://google.com',
                                //title: 'Become a Googler',
                                //rel: 'external',
                                text: dataTask.statusName,
                                'class': "aui-label ghx-label ghx-label-double ghx-label-4 "+gc.jira.elements.stateCustomClass
                            })
                                .css({
                                    'margin-right':'5px',
                                    'margin-left':'5px',
                                    'display':"inline"
                                })
                            let $span = $(this).find('span.ghx-end.ghx-estimate');//.find(`.ghx-end.ghx-extra-field-estimate`).insertAfter($stateSpan); ghx-end ghx-extra-field-estimate
                            if ($span.length > 0 ) {
                                $span.after($stateSpan)
                            } else {
                                $span = $(this).find('span.ghx-end.ghx-extra-field-estimate').find('.ghx-statistic-badge');
                                if ($span.length > 0 ) {
                                    $span.after($stateSpan)
                                }
                            }
                        }
                    }
                });
            }
        }

        // включаем обновление
        gc.process.showStatesOnBacklogBoard.canShow = true;
    }
    /*
        Пул задач для заведения новой справочной системы
        Цель процесса - автоматизированное заведение скопа задач в несколько команд для создания новой системы/издания в Справочных
        Процесс запускается из эпика бэклога при условии, что в компоненте указаны "Справочные системы"
    */
    function cns_createNewSystem(){
        log(`Запускаем создание новой системы ${gc.current_issue_data.key}`);
        // считываем настройки по командам
        var prEpicIniciative =  getIssue(gc.current_issue_data.key,`summary, description, ${gc.jira.fields.epicName}`);
        prEpicIniciative.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                // переменная, в которой будет содержаться вся необходимая информация для разворачивания системы
                let  epic_data = {}; epic_data["self"] = { "key": gc.current_issue_data.key };
                epic_data["process"] = `createNewSystem ${gc.current_issue_data.key}`
                // парсим данные
                let msgParseResult = "";
                if (obj) {
                    if ('fields' in obj) {
                        // получаем название
                        if ('summary' in obj.fields && obj.fields.summary != null) {
                            epic_data.self["summary"] = obj.fields.summary;
                        } else {
                            epic_data.self["summary"] = "";
                            log(`Нет наименования эпика`);
                        }
                        if ('description' in obj.fields && obj.fields.description != null) {
                            epic_data.self["description"] = obj.fields.description;
                        } else {
                            epic_data.self["description"] = "Описание см. в инициативе";
                            log(`Нет описания эпика`);
                        }
                        // имя эпика
                        if (gc.jira.fields.epicName in obj.fields && obj.fields[gc.jira.fields.epicName] != null) {
                            epic_data.self[gc.jira.fields.epicName] = obj.fields[gc.jira.fields.epicName];
                        } else {
                            epic_data.self[gc.jira.fields.epicName] = "Новая система";
                            log(`Ошибка. В задаче отсутствует имя эпика`);
                        }
                    } else msgParseResult=`Ошибка. Отсутствуют данные по объекту эпика`;
                } else msgParseResult+=`Ошибка. Данные не переданы на вход`;
                if (msgParseResult) {
                    showFlag(`msgParseResult ${gc.current_issue_data.key}`,"Внимание","error");
                    return false;
                }
                log(`Парсинг данных успешно завершен`);
                //log(`${JSON.stringify(epic_data)}`);
                // переходим к созданию инициатив по командам
                cns_createIniciativeSSTeam(epic_data);
            },
            error => {
                log(`Не удалось считать настройки эпика ${gc.current_issue_data.key}`);
                showFlag(`Не удалось считать настройки эпика ${gc.current_issue_data.key}`,"Внимание!","error");
            }
        )
    }
    // создание инициативы в SS
    function cns_createIniciativeSSTeam(value){
        let team = "SS";
        value[team] = {
            "keyIniciative":"",
            "data":{
                "fields": {
                    "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.iniciative},
                    "summary": `[${team}] ${value.self.summary}`,
                    "project": {"key":"BCKLG"},
                    "description": "Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания.\nКаждая команда самостоятельно осуществляет DoD-инг свой части.",
                    "components": [{"id": gc.jira.fields.components[team]}],
                    [gc.jira.fields.team]:{"id":gc.jira.fields.teams[team]},
                    [gc.jira.fields.businessCase]:{"id":gc.jira.fields.businessCases.bigPicture},
                    [gc.jira.fields.epicLink]: value.self.key
                }
            }
        }

        let prIniciative =  createIssue(value[team].data,value.process);
        prIniciative.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].keyIniciative = obj.key;
                    showFlag(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`,"Внимание!","success","auto");
                    log(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`);
                    cns_createIniciativeWARMTeam(value);
                } else {
                    log(`Ошибка обработки данных по инициативе в команду ${team}`);
                    showFlag(`Ошибка обработки данных по инициативе в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания инициативы в бэклоге для команды ${team}`);
                showFlag(`Ошибка создания инициативы в бэклоге для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создание инициативы в WARM
    function cns_createIniciativeWARMTeam(value){
        let team = "WARM";
        value[team] = {
            "keyIniciative":"",
            "data":{
                "fields": {
                    "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.iniciative},
                    "summary": `[${team}] ${value.self.summary}`,
                    "project": {"key":"BCKLG"},
                    "description": "Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания.\nКаждая команда самостоятельно осуществляет DoD-инг свой части.",
                    "components": [{"id": gc.jira.fields.components[team]}],
                    [gc.jira.fields.team]:{"id":gc.jira.fields.teams[team]},
                    [gc.jira.fields.businessCase]:{"id":gc.jira.fields.businessCases.bigPicture},
                    [gc.jira.fields.epicLink]: value.self.key
                }
            }
        }

        let prIniciative =  createIssue(value[team].data,value.process);
        prIniciative.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].keyIniciative = obj.key;
                    showFlag(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`,"Внимание!","success","auto");
                    log(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`);
                    cns_createIniciativeSEARCHTeam(value);
                } else {
                    log(`Ошибка обработки данных по инициативе в команду ${team}`);
                    showFlag(`Ошибка обработки данных по инициативе в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания инициативы в бэклоге для команды ${team}`);
                showFlag(`Ошибка создания инициативы в бэклоге для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создание инициативы в SEARCH
    function cns_createIniciativeSEARCHTeam(value){
        let team = "SEARCH";
        value[team] = {
            "keyIniciative":"",
            "data":{
                "fields": {
                    "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.iniciative},
                    "summary": `[${team}] ${value.self.summary}`,
                    "project": {"key":"BCKLG"},
                    "description": `Необходимо реализовать требования инициативы бэклога по созданию новой системы/издания.\n
Каждая команда самостоятельно осуществляет DoD-инг свой части.\n
3ч подключение новой системы + 1ч переиндексация ЭМ + 1ч переиндексация НПД\n\n
В риски заложена повторная индексация, если что-то пошло не так`,
                    "components": [{"id": gc.jira.fields.components[team]}],
                    [gc.jira.fields.team]:{"id":gc.jira.fields.teams[team]},
                    [gc.jira.fields.businessCase]:{"id":gc.jira.fields.businessCases.bigPicture},
                    [gc.jira.fields.epicLink]: value.self.key
                }
            }
        }

        let prIniciative =  createIssue(value[team].data,value.process);
        prIniciative.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].keyIniciative = obj.key;
                    showFlag(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`,"Внимание!","success","auto");
                    log(`Инициатива для команды ${team} успешно создана (${value[team].keyIniciative})`);
                    // создаем задачи в инициативах
                    cns_createIniciativeTasks(value);
                } else {
                    log(`Ошибка обработки данных по инициативе в команду ${team}`);
                    showFlag(`Ошибка обработки данных по инициативе в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания инициативы в бэклоге для команды ${team}`);
                showFlag(`Ошибка создания инициативы в бэклоге для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создаем задачи в инициативах бэклога для планирования
    function cns_createIniciativeTasks(value){
        // задаем описания задач для SS
        let team_ss = "SS";
        value[team_ss]["iniciativeTasks"] = {
            "data": { "issueUpdates": [
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.backendSub},
                            "summary":"[B] Разработка 1/2",
                            "timetracking": {"originalEstimate":"12"}}
                    },
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.backendSub},
                            "summary":"[B] Разработка 2/2",
                            "timetracking": {"originalEstimate":"8"}}
                    },
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.backendSub},
                            "summary":"[B] Публикация",
                            "timetracking": {"originalEstimate":"4"}}
                    },
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.frontendSub},
                            "summary":"[F] Разработка",
                            "timetracking": {"originalEstimate":"12"}}
                    },
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.frontendSub},
                            "summary":"[F] Публикация",
                            "timetracking": {"originalEstimate":"2"}}
                    }/*,
                { "fields": {
                        "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.testSub},
                        "summary":"[T] Тестирование",
                        "timetracking": {"originalEstimate":"6"}}
                }*/
                ]
            }
        }
        // готовим финальный вариант данных для запроса
        for (let x of value[team_ss].iniciativeTasks.data.issueUpdates) {
            x.fields["project"] = {"key":"BCKLG"}
            x.fields["description"] = "Учет времени"
            x.fields["parent"] = {"key":value[team_ss].keyIniciative}
            x.fields["components"] = [{"id": gc.jira.fields.components[team_ss]}]
            x.fields[gc.jira.fields.team]= {"id":gc.jira.fields.teams[team_ss]}
            x.fields[gc.jira.fields.businessCase] = {"id":gc.jira.fields.businessCases.bigPicture}
        }
        let prIniciativeTasks =  createIssuesBulk(value[team_ss].iniciativeTasks.data,value.process);
        prIniciativeTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj) {
                    showFlag(`Подзадачи для инициативы ${value[team_ss].keyIniciative} успешно созданы`,"Внимание!","success","auto");
                    log(`Подзадачи для инициативы ${value[team_ss].keyIniciative} успешно созданы`);
                    // создаем эпик в SS
                    //cns_createDevEpicSSTeam(value);
                } else {
                    log(`Ошибка обработки данных по задачам инициативы`);
                    showFlag(`Ошибка обработки данных по задачам инициативы`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания подзадач для инициативы ${value[team_ss].keyIniciative}`);
                showFlag(`Ошибка создания подзадач для инициативы ${value[team_ss].keyIniciative}`,"Внимание!","error");
            }
        )

        // задаем описания задач для SS
        let team_search = "SEARCH";
        value[team_search]["iniciativeTasks"] = {
            "data": { "issueUpdates": [
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.backendSub},
                            "summary":"[B] Подключение поиска",
                            "description":"Подключение поиска",
                            "timetracking": {"originalEstimate":"3"}}
                    },
                    { "fields": {
                            "issuetype": {"id": gc.jira.fields.issueTypes.bcklg.backendSub},
                            "summary":"[веха] Индексация завершена",
                            "description":`веха - индексация завершена\n
индексация по плану`}
                    }
                ]
            }
        }
        // готовим финальный вариант данных для запроса
        for (let x of value[team_search].iniciativeTasks.data.issueUpdates) {
            x.fields["project"] = {"key":"BCKLG"}
            //x.fields["description"] = "Учет времени"
            x.fields["parent"] = {"key":value[team_search].keyIniciative}
            x.fields["components"] = [{"id": gc.jira.fields.components[team_search]}]
            x.fields[gc.jira.fields.team]= {"id":gc.jira.fields.teams[team_search]}
            x.fields[gc.jira.fields.businessCase] = {"id":gc.jira.fields.businessCases.bigPicture}
        }
        prIniciativeTasks =  createIssuesBulk(value[team_search].iniciativeTasks.data,value.process);
        prIniciativeTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj) {
                    showFlag(`Подзадачи для инициативы ${value[team_search].keyIniciative} успешно созданы`,"Внимание!","success","auto");
                    log(`Подзадачи для инициативы ${value[team_search].keyIniciative} успешно созданы`);
                    // создаем эпик в SS
                    //cns_createDevEpicSSTeam(value);
                } else {
                    log(`Ошибка обработки данных по задачам инициативы`);
                    showFlag(`Ошибка обработки данных по задачам инициативы`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания подзадач для инициативы ${value[team_search].keyIniciative}`);
                showFlag(`Ошибка создания подзадач для инициативы ${value[team_search].keyIniciative}`,"Внимание!","error");
            }
        )

        cns_createDevEpicSSTeam(value);
    }
    // создаем эпик в SS
    function cns_createDevEpicSSTeam(value){
        let team = "SS";
        value[team]["dev"] = {
            "keyDevEpic": "",
            "data": {
                "fields": {
                    "project": {"key":gc.jira.fields.projectKeyByTeam[team]},
                    "issuetype": {"id": gc.jira.fields.issueTypes.dev.epic},
                    "summary": value.self.summary,
                    "description": "Необходимо реализовать функционал согласно требованиям",
                    [gc.jira.fields.epicName]: value.self[gc.jira.fields.epicName]
                }
            }
        }

        let prDevEpic =  createIssue(value[team].dev.data,value.process);
        prDevEpic.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].dev.keyDevEpic = obj.key;
                    showFlag(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`,"Внимание!","success","auto");
                    log(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`);
                    // создаем линк для эпика с инициативой
                    createIssueLink(value[team].keyIniciative, value[team].dev.keyDevEpic, gc.jira.fields.IssueLinkTypes.Developers, value.process);
                    cns_createDevEpicWARMTeam(value);
                } else {
                    log(`Ошибка обработки данных по эпику в команду ${team}`);
                    showFlag(`Ошибка обработки данных по эпику в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания эпика в проекте разработки для команды ${team}`);
                showFlag(`Ошибка создания эпика в проекте разработки для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создаем эпик в WARM
    function cns_createDevEpicWARMTeam(value){
        let team = "WARM";
        value[team]["dev"] = {
            "keyDevEpic": "",
            "data": {
                "fields": {
                    "project": {"key":gc.jira.fields.projectKeyByTeam[team]},
                    "issuetype": {"id": gc.jira.fields.issueTypes.dev.epic},
                    "summary": value.self.summary,
                    "description": "Необходимо реализовать функционал согласно требованиям",
                    [gc.jira.fields.epicName]: value.self[gc.jira.fields.epicName]
                }
            }
        }

        let prDevEpic =  createIssue(value[team].dev.data,value.process);
        prDevEpic.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].dev.keyDevEpic = obj.key;
                    showFlag(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`,"Внимание!","success","auto");
                    log(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`);
                    // создаем линк для эпика с инициативой
                    createIssueLink(value[team].keyIniciative, value[team].dev.keyDevEpic, gc.jira.fields.IssueLinkTypes.Developers, value.process);
                    cns_createDevEpicSUPPORTTeam(value);
                } else {
                    log(`Ошибка обработки данных по эпику в команду ${team}`);
                    showFlag(`Ошибка обработки данных по эпику в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания эпика в проекте разработки для команды ${team}`);
                showFlag(`Ошибка создания эпика в проекте разработки для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создаем эпик в поддержке
    function cns_createDevEpicSUPPORTTeam(value){
        let team = "SUPPORT";
        value[team] = {};
        value[team]["dev"] = {
            "keyDevEpic": "",
            "data": {
                "fields": {
                    "project": {"key":gc.jira.fields.projectKeyByTeam[team]},
                    "issuetype": {"id": gc.jira.fields.issueTypes.dev.epic},
                    "summary": value.self.summary,
                    "description": "Пул задач для новой системы/издания",
                    [gc.jira.fields.epicName]: value.self[gc.jira.fields.epicName]
                }
            }
        }

        let prDevEpic =  createIssue(value[team].dev.data,value.process);
        prDevEpic.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)} `);
                if (obj && 'key' in obj && obj.key != null) {
                    value[team].dev.keyDevEpic = obj.key;
                    showFlag(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`,"Внимание!","success","auto");
                    log(`Эпик для команды ${team} успешно создан (${value[team].dev.keyDevEpic})`);
                    // создаем линк для эпика с инициативой
                    createIssueLink(value["SS"].keyIniciative, value[team].dev.keyDevEpic, gc.jira.fields.IssueLinkTypes.Developers, value.process);
                    createIssueLink(value["SS"].dev.keyDevEpic, value[team].dev.keyDevEpic, gc.jira.fields.IssueLinkTypes.Relates, value.process);
                    cns_createDevTasksSS(value);
                } else {
                    log(`Ошибка обработки данных по эпику в команду ${team}`);
                    showFlag(`Ошибка обработки данных по эпику в команду ${team}`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания эпика в проекте разработки для команды ${team}`);
                showFlag(`Ошибка создания эпика в проекте разработки для команды ${team}`,"Внимание!","error");
            }
        )
    }
    // создаем задачи в проекте разработки SS
    function cns_createDevTasksSS(value){
        let team = "SS"
        // задаем описания задач
        value[team].dev["devTasks"] = {
            "data": { "issueUpdates": [
                    { "fields": {
                            "summary": "[B] Доработать публикатор контента",
                            "description": "Для нового издания необходимо доработать публикатор контента",
                            "timetracking": "90m",
                            "assignee": { "name": "grinshtein"}}
                    },
                    { "fields": {
                            "summary": "[B] Доработать публикатор поискового индекса",
                            "description": "Для нового издания необходимо доработать публикатор поискового индекса",
                            "timetracking": "30m",
                            "assignee": { "name": "grinshtein"}}
                    },
                    { "fields": {
                            "summary": "[F] Прописать названия разделов в реестре",
                            "description": "Для нового издания необходимо прописать названия разделов в реестре",
                            "timetracking": "1",
                            "assignee": { "name": "bulbaaleksey"}}
                    },
                    { "fields": {
                            "summary": "Оценить эпик",
                            "description": `Произвести декомпозицию и оценку эпика с учетом уже заведенных задач\n
                                            Распределить задачи по разработчикам`,
                            "timetracking": "",
                            "assignee": { "name": "zarubin"}}
                    },
                    { "fields": {
                            "summary": "[SA] Снять заглушку у системы",
                            "timetracking": "",
                            "description": "Перенести систему из ssgag"}
                    },
                    { "fields": {
                            "summary": "[SA] Завести боевые url и биндинги",
                            "timetracking": "",
                            "description": "Завести боевые url и биндинги"}
                    },
                    { "fields": {
                            "summary": "[ПО] Настроить отчеты в программе статистики (ПС)",
                            "timetracking": "",
                            "description": "Проверить, что данные пишутся в программу статистики. Настроить и проверить основные отчёты (Ковалева Т.)"}
                    },
                    { "fields": {
                            "summary": "[T] Тестирование эпика",
                            "description": `Тестирование эпика`,
                            "timetracking": "",
                            "assignee": { "name": "zarubin"}}
                    },
                    { "fields": {
                            "summary": "[B] Завести издания для рассылок",
                            "description": `# Завести издания для рассылок (Подключить механизм подписки/отписки в БО и на сайтах СС)\n
                                            # Прописать издания для отписок\n
                                            # Обеспечить корректное формирование файла для Сендсей и отправку корректных подписок`,
                            "timetracking": "1",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[Back/Front Sitess] Обновить ветку эпика из основной ветки разработки",
                            "description": "Обновить ветку эпика из основной ветки разработки",
                            "timetracking": "30m",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[B] Исправление ошибок эпика",
                            "description": "Исправление ошибок эпика",
                            "timetracking": "2",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[Front Sitess] Исправление ошибок эпика",
                            "description": "Исправление ошибок эпика",
                            "timetracking": "2",
                            "assignee": { "name": "bulbaaleksey"}}
                    },
                    { "fields": {
                            "summary": "[Back/Front Sitess] Слить ветку эпика в основную ветку разработки",
                            "description": "Слить ветку эпика в основную ветку разработки",
                            "timetracking": "30m",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[B] Подключить оценочную нападалку",
                            "description": `Подключить оценочную нападалку\n
# добавить в forsiteservice\Xml\Survey\GetSurvey\NN.xml например 42.xml
# добавить номера новых нападалок для новых Систем sitess\App_Code\SiteCore\BLL\Requests\Site\Survey\CreateResponse.cs
список Id оценочных нападалок npsList = new[] { 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 31, 32, 33, 34, 35, 36, 37 };
# в \\sitess\\xml\\bll\\site\\letter\\common.xml прописать новые системы`,
                            "timetracking": "2",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[F] Добавить клиентские изменения:  js, xsl и реестр",
                            "description": `Необходимо:\n
# Проверить\\дополнить реестр (если будет нужно) после того, как поддержка его заполнит
# Внести общие правки в клиентский код: добавить настройки, добавить промо, правки xsl\\js
# Не забыть подключить счетчик (задача в эпике поддержки)\n
Для новой системы/издания необходимо создать промо-страницу для подключения iFrame\n
# Обязательные пути реестра (https://docs.google.com/spreadsheets/d/1sO4FJNMtkUt_ynPhs-yj8gCSBnNEkE8MjFxJxIHCWIs/edit?copiedFromTrash#gid=0)`,
                            "timetracking": "8",
                            "assignee": { "name": "bulbaaleksey"}}
                    },
                    { "fields": {
                            "summary": "[B] Наполнить метаданными реестр, конфиг, БД, ДНС",
                            "description": `Необходимо:\n
* развернуть ветку реестра на отдельном прототипе
* занести в реестр
** номер издания, название издания, хосты
** коды публикации добавить в actiondigital|systemSite|preferences|publicationCodes
** версию продукта добавить в actiondigital|services|customer-service|accessMap|versionsVsPubs (добавить до версий продукта Актион360)
** добавить алиасы систем/изданий и флаги хоста в actiondigital|systemSite|meta|systAndPubsAndHostFlags
** в реестре в разделе Схема аутентификации добавить перегрузку системы на значение ad
** вызвать метод http://customer-service/admin/apply-registry-to-meta
** проверить в БД customer/accessmap/versionVsPub что появилось значение
** настройка customercontent-serviceM на соответствующий registryN
** настройка SiteSS на customercontent-serviceM и customercontent-serviceM на соответствующий registryN
* сформировать хосты с помощью консольной программы [https://gitlab.action-media.ru/ss/prokcreater/-/merge_requests/1] для всех 100 dev прототипов и настроить биндинги для всех 100 dev прототипов в C:/Windows/System32/inetsrv/config/applicationHost.config. Прописать биндинги для ТБД, ПБД SRV17
* Занести биндинги в [https://docs.google.com/spreadsheets/d/19pTgU58Q69-AWLjHsD2xHc5fUYQEg9KnHSQJ2stuWZQ/edit#gid=0] вызвать метод синхронизации в БД из реестра в customer-service (только для прок1 [http://customer-service/admin/apply-registry-to-meta])
* Настроить прототип сайта СС (в appSettings.config <add key="cs.registry" value="http://registry2"/>), customer-service, customer-service-new на registry2
* Добавить продукты в (srv15) sqld8.NBSERVICE_MP/dbo.LOT по аналогии с pub_id= 83
** ДД_[код издания], ДДП_[код издания], ДДПР_[код издания], ОЗ_[код издания], ПОД[код издания]`,
                            "timetracking": "3",
                            "assignee": { "name": "kharitonov"}}
                    },
                    { "fields": {
                            "summary": "[B] Подключить заведенные ресурсы в метабазе PG",
                            "description": `Для нового издания необходимо подключить заведенные ресурсы в метабазе PG sps_content_backend_meta\n
Данные добавлять через миграции в sps-content-service.\\n
Добавить соответствующие строки (скопировать с системы донора) в Meta/DbPub.cs, Meta/DbPubDiv.cs, Meta/DbPubDivRubricatorLnk.cs, Meta/DbPubModuleLnk.cs, Meta/DbPubPubDivLnk.cs \n
+ склонировать документы согласно требованиям\n\n
{code:java}\n
update "public".pub_group_lnk\n
Set pub_ids = array_append(pub_ids,203)\n
where pub_ids @> ARRAY[210];\n\n
insert INTO "public".doc_lnk_exclude (pub_id, module_id, id, link_id)\n
select 203 as pub_id\n
, module_id, id, link_id\n
from "public".doc_lnk_exclude p --limit 10\n
where p.pub_id = 210\n
and not exists (select * from "public".doc_lnk_exclude e where e.pub_id = p.pub_id and e.module_id=p.module_id and e.id=p.id and e.link_id=p.link_id );\n\n
SELECT REPLACE(p.properties::text, ', 68,', ', 68, 200,') newprop,*\n
-- drop table JBTEST\n
into JBTEST\n
from "public".document_toc p\n
CROSS JOIN LATERAL json_to_recordset((p.properties::json -> 'TopicList')::json)\n
AS list("Topic" TEXT, "TopicId" INT, "PubIds" INTEGER[])\n
where p.properties is not NULL\n
and 210=ANY(list."PubIds"::INTEGER[])\n\n
UPDATE JBTEST p\n
SET properties = p1.newprop::json\n
From JBTEST p1\n
where p.module_id = p1.module_id and p.id=p1.id --and p."TopicId"=p1."TopicId"\n\n
UPDATE "public".document_toc d\n
SET properties =jsonb_set(p1.properties, '{TopicList ,0, PubIds}', p1.newpubs)\n
From JBTEST p1\n
where d.module_id = p1.module_id and d.id=p1.id\n\n
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
{code}\n`,
                            "timetracking": "3",
                            "assignee": { "name": "grinshtein"}}
                    }
                ]
            }
        }
        let issueTimeTracking = [];
        // готовим финальный вариант данных для запроса
        for (let x of value[team].dev.devTasks.data.issueUpdates) {
            x.fields["project"] = {"key":gc.jira.fields.projectKeyByTeam[team]}
            x.fields["issuetype"] = {"id": gc.jira.fields.issueTypes.dev.task}
            x.fields[gc.jira.fields.epicLink] = value[team].dev.keyDevEpic
            // добавляем данные для задания времени
            let time = { "key" : "", "estimatesRoleId":gc.jira.fields.timeTracking.Role.Developer.id,"originalEstimate": x.fields.timetracking};
            issueTimeTracking.push(time);
            // удаляем параметр из исходного массива, иначе произойдет ошибка при создании задачи
            delete x.fields.timetracking;
        }

        let prDevTasks =  createIssuesBulk(value[team].dev.devTasks.data,value.process);
        prDevTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)}`);
                if (obj && 'issues' in obj && obj.issues != null) {
                    showFlag(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`,"Внимание!","success","auto");
                    log(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`);
                    // готовим данные для задания времени
                    for (let i = 0; i < obj.issues.length; i++) {
                        issueTimeTracking[i].key = obj.issues[i].key;
                    }
                    //log(`${JSON.stringify(issueTimeTracking)}`);
                    // запускаем обновление времени по задачам
                    setTimeout(cns_setTimeTrackingRecurse,100,issueTimeTracking,value.process);
                    // создаем задачи в проекте разработки WARM
                    //cns_createDevTasksWARM(value);
                } else {
                    log(`Ошибка обработки данных по задачам эпика`);
                    showFlag(`Ошибка обработки данных по задачам эпика`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`);
                showFlag(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`,"Внимание!","error");
            }
        )
        cns_createDevTasksWARM(value);
    }
    // создаем задачи в проекте разработки WARM
    function cns_createDevTasksWARM(value){
        let team = "WARM"
        // задаем описания задач
        value[team].dev["devTasks"] = {
            "data": { "issueUpdates": [
                    { "fields": {
                            "summary": "Завести метаданные для новой системы/издания",
                            "description": "Завести метаданные для новой системы/издания"}
                    },
                    { "fields": {
                            "summary": "Настроить стартовые для новой системы/издания",
                            "description": "Настроить стартовые для новой системы/издания"}
                    },
                    { "fields": {
                            "summary": "Настроить контент для новой системы/издания",
                            "description": `* Настроить контент для новой системы/издания
* прописать конструктор документов после появления publication_code`
                        }
                    }
                ]
            }
        }
        // готовим финальный вариант данных для запроса
        for (let x of value[team].dev.devTasks.data.issueUpdates) {
            x.fields["project"] = {"key":gc.jira.fields.projectKeyByTeam[team]}
            x.fields["issuetype"] = {"id": gc.jira.fields.issueTypes.dev.task}
            x.fields[gc.jira.fields.epicLink] = value[team].dev.keyDevEpic
        }

        let prDevTasks =  createIssuesBulk(value[team].dev.devTasks.data,value.process);
        prDevTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)}`);
                if (obj && 'issues' in obj && obj.issues != null) {
                    showFlag(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`,"Внимание!","success","auto");
                    log(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`);
                    //log(`${JSON.stringify(issueTimeTracking)}`);
                    //cns_createDevTasksSUPPORT(value);
                } else {
                    log(`Ошибка обработки данных по задачам эпика`);
                    showFlag(`Ошибка обработки данных по задачам эпика`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`);
                showFlag(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`,"Внимание!","error");
            }
        )
        cns_createDevTasksSUPPORT(value);
    }
    // создаем задачи в проекте разработки поддержке
    function cns_createDevTasksSUPPORT(value){
        let team = "SUPPORT"
        // задаем описания задач
        value[team].dev["devTasks"] = {
            "data": { "issueUpdates": [
                    { "fields": {
                            "summary": "Завести код счетчика GTM",
                            "description": `Прошу предоставить код GTM для встраивания в новую систему/издание\n
* для ПК версии
* для мобильной версии`}
                    },
                    { "fields": {
                            "summary": "Настроить GA",
                            "description": `Требуется для нового издания\n
# Встроить код счетчиков GA в GTM
# Создать представления для Системы в GA\n
После ввода Системы в промышленную эксплуатацию:
# Провести тестирование Системы в рамках задачи
# Зарегистрировать найденные дефекты
# Выдать необходимые доступы к Системе
# Включить обработку системы на сервере статистики и для CRM`}
                    },
                    { "fields": {
                            "summary": "Подключить горячую линию",
                            "description": `Для новой системы/издания необходимо подключить сервис Горячей линии [Инструкция|https://conf.action-media.ru/x/GBc_CQ]
# Подключить серверную часть ГЛ
# Настроить ссылку на документ с правилами ГЛ
# Настроить примеры ответов ГЛ
# Настроить ссылку на документ по готовым ответам от редакции\n
Данные, необходимые для подключения ГЛ, указаны в чек-листе [Чек-листы по подключаемому функционалу|https://conf.action-media.ru/pages/viewpage.action?pageId=91669138]`}
                    },
                    { "fields": {
                            "summary": "Подключить онлайн-помощника",
                            "description": `Для новой системы/издания необходимо подключить сервис ОП`}
                    },
                    { "fields": {
                            "summary": "Подключить возможность переноса избранного",
                            "description": `Для новой Системы необходимо настроить перенос избранного\n
# В узле реестра (actiondigital|systemSite|fav|transfer) прописать идентификаторы изданий Системы через запятую к остальным идентификаторам изданий
# Провести тестирование Системы в рамках задачи`}
                    },
                    { "fields": {
                            "summary": "Подключить мониторинг Аптайминспектор",
                            "description": `Для новой Системы необходимо подключить мониторинг Аптайминспектор\n
# ОЭ (Леденева Е.)
## Подключить сайты Системы к мониторингу Аптайминспектор
## Обновить документацию (http://conf.action-media.ru/pages/viewpage.action?pageId=65378956)
### Сервисы и сайты, подключенные к проверкам через АИ
### Сотрудники, подключенные к смс-оповещениям от АИ
### Шаблон письма для экстренного оповещения о проблемах`}
                    },
                    { "fields": {
                            "summary": "Подключить адресатов для оценок редакционных материалов и поиска",
                            "description": `Для новой Системы необходимо прописать e-mail-ы ответственных от редакции Системы по обработке оценок редакционных материалов и поиска\n
# Запросить у редакции адрес эл. почты для получения оценок редакционных материалов и поиска
# Настроить получателя в реестре:
## Оценки ред. Материалов (actiondigital|serviceLetters|docsRating)
## Оценки поиска (actiondigital|serviceLetters|searchEval)`}
                    },
                    { "fields": {
                            "summary": "Подключить сервисные письма",
                            "description": `# Настроить отправку сервисных писем с указанных адресов в реестре
## В реестре есть узел Актион диджитал/Сервисные письма
## В нем надо посмотреть все дочерние узлы и, там где есть перегрузка по изданиям, добавить перегрузку для системы
# Подключаются письма:
## Подтверждение регистрации
## Получение доступа (демо, оплаченный, ознакомительный, предемо, бонусный)
## Изменение адреса эл.почты / Изменение телефона / Изменение пароля
## Письмо коллеге с промостраницы`}
                    },
                    { "fields": {
                            "summary": "Настроить HTTPS",
                            "description": `# Для доменов новой Системы необходимо купить и установить SSL-сертификат [инструкция|http://conf.action-media.ru/x/NYrXAg]
# Сгенерировать файл CSR
# Настроить почту администратора домена
# Если сертификат отсутствует
## Заказать сертификат [инструкция|http://conf.action-media.ru/x/NYrXAg]
## Оплатить счет
## Отправить заказ
## Получить файл сертификата
## Установить сертификат на площадке
## Проверить установленный сертификат [инструкция|https://habrahabr.ru/company/hosting-cafe/blog/280442]
# прописать ssl-сертификаты в IIS`}
                    },
                    { "fields": {
                            "summary": "Добавить Пользовательское соглашение, Политику обработки данных, Положения",
                            "description": `Необходимо добавить информацию о новой системе для отображения её на странице 3 в 1: Пользовательское соглашение, Политика обработки данных, Положение [инструкция|http://conf.action-media.ru/x/WI18Aw]
# Добавить правки по новой системе через реестр Актион диджитал/Сайт системы/Пользовательское соглашение:
## Название
## Информация`}
                    },
                    { "fields": {
                            "summary": "Подключить автописьма",
                            "description": `Для новой Системы необходимо подключить отправку автописем через Сендсей
# Запросить у бизнеса данные по шаблонам писем (бизнес заводит шаблоны в Сендсей самостоятельно)
# Добавить шаблоны в почтовый сервис Платформы
# Добавить шаблоны в базу SS
# Прописать ID шаблонов в реестре, опубликовать реестр\n
Описание процесса подключения автописем и список необходимых шаблонов в [регламенте|https://conf.action-media.ru/pages/viewpage.action?pageId=126354103]`}
                    },
                    { "fields": {
                            "summary": "Завести данные в БО ID2",
                            "description": `Необходимо завести данные в БО ID2\n
Информация по AppID и урлам приложений находится в эпике разработки команды SS\n
# Если данные нужно прописать для новой системы:
## Решить задачу в соответствии с руководством [Добавить домен к Приложению (прописать сайт в БО ID2)|https://conf.action-media.ru/pages/viewpage.action?pageId=65382812#id-%D0%A0%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE%D0%BF%D0%BE%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B5%D0%98%D0%942%D0%B4%D0%BB%D1%8F%D0%92%D0%A1%D0%A1-%D0%94%D0%BE%D0%B1%D0%B0%D0%B2%D0%B8%D1%82%D1%8C%D0%B4%D0%BE%D0%BC%D0%B5%D0%BD%D0%BA%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8E(%D0%BF%D1%80%D0%BE%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%D1%81%D0%B0%D0%B9%D1%82%D0%B2%D0%91%D0%9EID2)]
## Appid и Secret Key прописывает в реестре, путь к основному узлу (actiondigital|systemSite|id2Info)
## Проверить на прототипе
# Если данные нужно прописать для нового издания существующей системы:
** Решить задачу в соответствии с [руководством|https://conf.action-media.ru/pages/viewpage.action?pageId=65382812#id-%D0%A0%D1%83%D0%BA%D0%BE%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE%D0%BF%D0%BE%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B5%D0%98%D0%942%D0%B4%D0%BB%D1%8F%D0%92%D0%A1%D0%A1-%D0%94%D0%BE%D0%B1%D0%B0%D0%B2%D0%B8%D1%82%D1%8C%D0%B4%D0%BE%D0%BC%D0%B5%D0%BD%D0%BA%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8E(%D0%BF%D1%80%D0%BE%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%D1%81%D0%B0%D0%B9%D1%82%D0%B2%D0%91%D0%9EID2)]
# Прописать publication code в событиях для ID2 в реестре
** actiondigital|systemSite|preferences|publicationCodes`}
                    },
                    { "fields": {
                            "summary": "Реализовать стандартную клиентскую часть. Изменение реестра",
                            "description": `Необходимо в реестре произвести настройку изданий\n
* [Перечень узлов для изменения|https://docs.google.com/spreadsheets/d/1sO4FJNMtkUt_ynPhs-yj8gCSBnNEkE8MjFxJxIHCWIs/edit?copiedFromTrash#gid=0]
** В каких-то случаях нужно добавить копию узла, в каких-то случаях добавить перезагрузку.
* Настроить плашку доступа к другому изданию (добавить в реестр actiondigital|systemSite|authorization|anotherPubAccess|settings|pubs все издания системы через пробел, выставить соответствующую перегрузку)`}
                    },
                    { "fields": {
                            "summary": "Реализовать стандартную клиентскую часть. Название системы для СМС",
                            "description": `Необходимо добавить название системы для СМС в узел actiondigital|services|sms-service|sender|title`}
                    },
                    { "fields": {
                            "summary": "Универсальный сервис ссылок. Добавить новые продукты",
                            "description": `Необходимо добавить новые продукты в соответствии с [регламентом|https://conf.action-media.ru/pages/viewpage.action?pageId=259693465#id-Универсальныйсервисссылок-Регламентдобавленияновыхпродуктов]`}
                    },
                    { "fields": {
                            "summary": "Заведение виджетов ЛК. Проверка",
                            "description": `Добавить продукту виджеты в БО ЛК в соответствии с инструкцией: https://conf.action-media.ru/pages/viewpage.action?pageId=208914315`}
                    },
                    { "fields": {
                            "summary": "Маппинг журналов. Назначить на Борисова",
                            "description": `В таблице для маппингов, необходимо указать\n
* название системы,
* номер версии продукта системы,
* название ешки (вип-тарифы нужно указывать дополнительно),
* виды доступа (демо или платный)\n
https://conf.action-media.ru/pages/viewpage.action?pageId=220281947 инструкция`}
                    }
                ]
            }
        }
        // готовим финальный вариант данных для запроса
        for (let x of value[team].dev.devTasks.data.issueUpdates) {
            x.fields["project"] = {"key":gc.jira.fields.projectKeyByTeam[team]}
            x.fields["issuetype"] = {"id": gc.jira.fields.issueTypes.support.dev}
            x.fields[gc.jira.fields.epicLink] = value[team].dev.keyDevEpic
        }

        let prDevTasks =  createIssuesBulk(value[team].dev.devTasks.data,value.process);
        prDevTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)}`);
                if (obj && 'issues' in obj && obj.issues != null) {
                    showFlag(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`,"Внимание!","success","auto");
                    log(`Задачи для эпика ${value[team].dev.keyDevEpic} успешно созданы`);
                    //log(`${JSON.stringify(issueTimeTracking)}`);
                    //cns_createDevTasksSEARCH(value);
                } else {
                    log(`Ошибка обработки данных по задачам эпика`);
                    showFlag(`Ошибка обработки данных по задачам эпика`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`);
                showFlag(`Ошибка создания подзадач для инициативы ${value.SS.keyIniciative}`,"Внимание!","error");
            }
        )
        cns_createDevTasksSEARCH(value);
    }
    // создаем задачи в проекте разработки SEARCH
    function cns_createDevTasksSEARCH(value){
        let team = "SEARCH"
        // задаем описания задач
        value[team]["dev"] = {
            "devTasks": {
                "data": {
                    "issueUpdates": [
                        {
                            "fields": {
                                "summary": "Подключить поиск",
                                "description": `Для нового издания необходимо подключить поиск по документам и в судебной практике
# Подключить на сайте поиск по документам
# Завести в БД поисковые теги, подсказки, эталоны
# Подключить систему/издание в АРМ Лингвиста\n
Если запускаем несколько систем/изданий одновременно, то для них подключение поиска на каждую по задаче, а индексацию делаем одну ЭМ и одну НПД\n
Подключение групп Эталонов (для новых систем)`
                            }
                        }
                    ]
                }
            }
        }
        // готовим финальный вариант данных для запроса
        for (let x of value[team].dev.devTasks.data.issueUpdates) {
            x.fields["project"] = {"key":gc.jira.fields.projectKeyByTeam[team]}
            x.fields["issuetype"] = {"id": gc.jira.fields.issueTypes.dev.task}
        }

        let prDevTasks =  createIssuesBulk(value[team].dev.devTasks.data,value.process);
        prDevTasks.then(
            result => {
                let obj = JSON.parse(result);
                //log(`${JSON.stringify(obj)}`);
                if (obj && 'issues' in obj && obj.issues != null) {
                    showFlag(`Задачи разработки без эпика в команде ${team} успешно созданы`,"Внимание!","success","auto");
                    log(`Задачи разработки без эпика в команде ${team} успешно созданы`);
                    // каждую задачу надо связать с инициативой
                    for (let i = 0; i < obj.issues.length; i++) {
                        createIssueLink(value[team].keyIniciative, obj.issues[i].key, gc.jira.fields.IssueLinkTypes.Developers, value.process);
                    }
                } else {
                    log(`Ошибка обработки данных по задачам разработки`);
                    showFlag(`Ошибка обработки данных по задачам разработки`,"Внимание!","error");
                }
            },
            error => {
                log(`Ошибка создания задач разработки ${value[team].keyIniciative}`);
                showFlag(`Ошибка создания задач разработки ${value[team].keyIniciative}`,"Внимание!","error");
            }
        )
    }
    // рекурсивно выставляем время в задачи
    function cns_setTimeTrackingRecurse(value, process){
        if ( value.length > 0 ) {
            let x = value.shift();
            log(`Корректировка времени для ${x.key} originalEstimate = ${x.originalEstimate}`);
            // если время не задавали - не проставляем его
            if (x.originalEstimate == -1) {
                cns_setTimeTrackingRecurse(value,process);
            } else {
                let prDevTaskTime = setTimeTracking(x.key, x.estimatesRoleId, x.originalEstimate, process);
                prDevTaskTime.then(
                    result => {
                        cns_setTimeTrackingRecurse(value,process);
                    },
                    error => {
                        log(`Ошибка корректировки времени для ${x.key}`);
                        showFlag(`Ошибка корректировки времени для ${x.key}`,"Внимание!","error");
                    })
            }
        } else {
            showFlag(`Оценки времени добавлены`,"Внимание!","success","auto");
            log(`Оценки времени добавлены`);
        }
    }

    /*
        SMART-диалог для создания подзадач в инициативе
    */
    function SmartDlgAddBodyHTML(){
        let dialog = `
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
    }
    function SmartDlgShow() {
        // считываем данные инициативы для дальнейшего использования
        let url = new URL(gc.jira.urls.getIssue+gc.current_issue_data.key);
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
                showFlag(`Не удалось получить данные по задаче <strong>${gc.current_issue_data.key}</strong>. Попробуйте перезагрузить страницу.`,"Внимание!","error");
                log(`Ошибка выполнения GET запроса`);
                log(`url: ${url}`);
            }
        });

        // очищаем список созданых ранее задач
        gc.current_issue_data["newIssueList"] = []
        // добавляем в описание код задачи
        $("#smart-dlg-initiative-key").text(`Добавление подзадач в инициативу ${gc.current_issue_data.key}`);
        // блокируем кнопку до получения данных по задаче
        // отключили async
        //SmartDlgSetButtonStateDisable(true);
        // скрываем прогресс бар
        $("#smart-dialog-progress").hide();
        // проверяем, что команда задана, иначе блокируем создание эпика
        if (gc.current_issue_data.teamCode.length == 0) {
            SmartDlgDisableCreateEpic(true);
        } else {
            // проверяем, что у нас есть маппинг команды на код проекта
            if (SmartDlgGetProjectByTeam(gc.current_issue_data.teamCode).length == 0) {
                SmartDlgDisableCreateEpic(true);
                showFlag(`Не удалось определить проект разработки по коду команды. Создание эпика невозможно.`,"Нет маппинга для команды","warning");
            } else {
                SmartDlgDisableCreateEpic(false);
            }
        }

        // проверяем, что диалог еще не отображался и навешиваем обработчки
        if (gc.current_issue_data.isSmartDlgFirst) {
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

            gc.current_issue_data.isSmartDlgFirst = false;
        }
        // отображаем диалог
        AJS.dialog2("#demo-dialog").show();
    }
    function SmartDlgGetIniciativeDataFromObj(obj){
        let notifyMessage = "";
        //Smart_log(ln+`data input ${JSON.stringify(obj)}`);

        if (obj) {
            if ('fields' in obj) {
                if ('components' in obj.fields && obj.fields.components != null) {
                    gc.current_issue_data["components"] = obj.fields.components;
                    // чистим данные для последеюущего прозрачного использования при создании задачи
                    for (let component of gc.current_issue_data.components) {
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
                    log(`В инициативе не заданы компоненты`);
                }
                // получаем название
                if ('summary' in obj.fields && obj.fields.summary != null) {
                    gc.current_issue_data["summary"] = obj.fields.summary;
                } else {
                    gc.current_issue_data["summary"] = "";
                    notifyMessage += "<br>В инициативе нет наименования"
                    log(`В инициативе нет наименования`);
                }
                // получаем команду
                if ('customfield_11601' in obj.fields && obj.fields.customfield_11601 != null) {
                    gc.current_issue_data["customfield_11601"] = obj.fields.customfield_11601;
                    gc.current_issue_data["teamCode"] = obj.fields.customfield_11601.value;
                    delete gc.current_issue_data.customfield_11601.self;
                    delete gc.current_issue_data.customfield_11601.value;
                    /*
                    fields."customfield_11601": {
                      "self": "https://jira.action-media.ru/rest/api/2/customFieldOption/11830",
                      "value": "SS",
                      "id": "11830"
                    }
                    */
                } else {
                    gc.current_issue_data["teamCode"] = "";
                    notifyMessage += "<br>В инициативе не задана команда"
                    log(`В инициативе не задана команда`);
                }
                // получаем значение поля "Добавить в"
                if ('customfield_11610' in obj.fields && obj.fields.customfield_11610 != null) {
                    gc.current_issue_data["customfield_11610"] = obj.fields.customfield_11610;
                    delete gc.current_issue_data.customfield_11610.self;
                    delete gc.current_issue_data.customfield_11610.value;
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
                    log(`Не определен портфель проектов`);
                }
                // дата начала задачи
                if ('customfield_11504' in obj.fields && obj.fields.customfield_11504 != null) {
                    gc.current_issue_data["customfield_11504"] = obj.fields.customfield_11504; // "customfield_11504": "2020-09-28"
                } else {
                    log(`Ошибка. В инициативе отсутствует дата старта obj.fields.customfield_11504 == null`);
                }
                //Smart_log(ln+`Parsing complete`);
                if (notifyMessage) {
                    showFlag(`${notifyMessage}`,"Внимание!","warning");
                }
                //Smart_log(ln+`data ${JSON.stringify(current_issue_data)}`);
            } else log(`Ошибка. obj.fields == null`);
        } else log(`Ошибка. Данные не переданы на вход`);

        //Smart_log(ln+`data ${JSON.stringify(current_issue_data)}`);
    }
    function SmartDlgSetButtonStateDisable(value){
        $("#smart-dialog-create-button").prop('disabled', value);
        $("#smart-dialog-cancel-button").prop('disabled', value);
    }
    function SmartDlgDisableCreateEpic(value){
        if (value) {
            let createEpicCheckBox = $('#smart_can_create_epic');
            createEpicCheckBox.prop('checked',false);
            createEpicCheckBox.prop('disabled',true);
            $("#smart_epic_short_name").prop('disabled',true);
        } else {
            $('#smart_can_create_epic').prop('disabled',false);
            $("#smart_epic_short_name").prop('disabled',false);
        }
    }
    function SmartDlgGetProjectByTeam(value){
        let result = "";

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
        return result;
    }
    function SmartDlgCreateTasks(){
        // формируем массив данных для создания задач
        let tasks_data = [];
        // получаем все елементы с данными (кроме эпика в проекте разработки)
        let $newTaskNameElemenst = $(".smart-task-name");
        if ($newTaskNameElemenst.length>0) {
            // обходим только элементы с именем задачи и уже на основе их индекса работаем с другими
            $newTaskNameElemenst.each(function(indx){
                let index = $(this).attr("data-smart-id");
                let issue_type = $(this).attr("data-issue-type");
                let task_name = $(this).val(); if (task_name.length == 0) task_name = "Имя задачи не задано";
                let task_estimate = $(`.${issue_type} .smart-task-estimate[data-smart-id="${index}"]`).val(); if (task_estimate.length == 0) task_estimate = 0; // $newTaskEstimateElemenst.find("#input_estm_subtask_backend*").length; //$(".edit-element[smart-index2='2']").length;   [data-smart-id="${index}"]
                let task_assignee = $(`.${issue_type} .smart-task-assignee[data-smart-id="${index}"]`).val();
                //Smart_log(`${ln} index ${index} task_name ${task_name} task_estimate ${task_estimate}`);
                tasks_data.push({"issue_type":issue_type, "task_name":task_name, "task_estimate":task_estimate, "task_assignee":task_assignee, "params":{"project_type":"backlog"}});
            });
        }
        // проверяем, не надо ли создать эпик в проекте разработки
        if ($('#smart_can_create_epic').prop('checked')) {
            let shortEpicName = $("#smart_epic_short_name").val();
            if (shortEpicName.length == 0) shortEpicName = "Не задано";
            tasks_data.push({"issue_type":"epic", "task_name":gc.current_issue_data.summary, "task_estimate":0, "params":{"project_type":"develop", "epicName":shortEpicName}});
        }
        // если есть задачи для создания
        if (tasks_data.length >0 ) {
            // блокируем кнопки до завершения создания задач
            SmartDlgSetButtonStateDisable(true);
            // отображаем прогресс бар и устанавливаем максимум
            let smartDlgProgress = $("#smart-dialog-progress");
            smartDlgProgress.attr("max",tasks_data.length);
            smartDlgProgress.attr("value",0);
            smartDlgProgress.show();

            // считываем данные инициативы для дальнейшего использования в подзадачах
            for (let task_data of tasks_data) {
                // создаем сабтаски в инициативе и эпик в проекте разработки
                SmartDlgCreateTask(task_data);
            }
        } else {
            showFlag(`Добавьте данные для создания задач`,"Внимание!","info","auto");
        }
    }
    function SmartDlgCreateTask(value){

        let issueTypeId = "11001"
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

        let newIssueData = {
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
                newIssueData.fields["project"] = {"key": SmartDlgGetProjectByTeam(gc.current_issue_data.teamCode)};
                newIssueData.fields["description"] = "Необходимо реализовать требования инициативы и конфлюенса";
                //newIssueData.fields["priority"] = {"id": "10102"};
                newIssueData.fields[gc.jira.fields.epicName] = value.params.epicName;
                break; }
            case "backlog": {
                newIssueData.fields["project"] = {"key": gc.current_issue_data.projectKey};
                newIssueData.fields["parent"] = {"key": gc.current_issue_data.key};
                newIssueData.fields["timetracking"] = {"originalEstimate": value.task_estimate};
                newIssueData.fields["description"] = "Планирование активности и ресурсов";
                if (value.task_assignee.length > 0) newIssueData.fields["assignee"] = {"name": value.task_assignee};
                if ('components' in gc.current_issue_data && gc.current_issue_data.components != null) newIssueData.fields["components"] = gc.current_issue_data.components;
                if ('customfield_11601' in gc.current_issue_data && gc.current_issue_data.customfield_11601 != null) newIssueData.fields["customfield_11601"] = gc.current_issue_data.customfield_11601;
                if ('customfield_11610' in gc.current_issue_data && gc.current_issue_data.customfield_11610 != null) newIssueData.fields["customfield_11610"] = gc.current_issue_data.customfield_11610;
                if ('customfield_11504' in gc.current_issue_data && gc.current_issue_data.customfield_11504 != null) newIssueData.fields["customfield_11504"] = gc.current_issue_data.customfield_11504;
                break; }
        }

        // создаем подзадачу
        let url = new URL(gc.jira.urls.postIssue);
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
                gc.current_issue_data.newIssueList.push({value, data});

                // если успешно создали эпик, то надо его связать с инициативой
                // напрашивается использование промисов, но не в этот раз
                if (value.params.project_type == "develop") {
                    let ajaxData = {};
                    let searchParams = [];
                    searchParams.push({"key":"AProcess", "value":"ABanner"});
                    searchParams.push({"key":"ABProcess", "value":"SmartDlg"});
                    searchParams.push({"key":"ADetail", "value":"CreateIssueLink"});
                    let ajaxDataBody = {
                        "type": {
                            "name": "Developes"
                        },
                        "inwardIssue": {
                            "key": gc.current_issue_data.key
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
                showFlag(`${JSON.stringify(textStatus)}`,"Что-то пошло не так","error");
                log(`Ошибка выполнения POST запроса`);
                log(`url: ${url}`);
                log(`${JSON.stringify(textStatus)}`);
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
    }
    function UCreateIssueLink(value){
        let url = new URL(gc.jira.urls.postIssueLink);
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
                showFlag(`${JSON.stringify(textStatus)}`,"Не удаось связать эпик с инициативой","error");
                log(`Ошибка выполнения POST запроса. Не удаось связать эпик с инициативой`);
                log(`url: ${url}`);
                log(`${JSON.stringify(textStatus)}`);
            },
            complete: function(){
            }
        });
    }
    function SmartDlgProgressControl(){
        let smartDlgProgress = $("#smart-dialog-progress");
        smartDlgProgress.attr("value",smartDlgProgress.attr("value")+1);

        // если заполнили шкалу, то скрываем диалог и показываем результат
        if (smartDlgProgress.attr("value") == smartDlgProgress.attr("max")) {
            AJS.dialog2("#demo-dialog").hide();
            log(`data ${JSON.stringify(gc.current_issue_data)}`);

            // собираем задачки в список
            let messageBody = '<ul>';
            for (let task of gc.current_issue_data.newIssueList) {
                messageBody += `<li><a href="${gc.jira.urls.viewIssue}${task.data.key}">${task.data.key} (${task.value.issue_type})</a></li>`;
            }

            messageBody += "</ul>";

            showFlag(`${messageBody}`,"Успешно созданы задачи","success","manual");

            // очистка данных для подготовки к следующему запуску
            gc.current_issue_data.newIssueList = [];
            gc.current_issue_data.components = [];
            gc.current_issue_data.summary = "";
            gc.current_issue_data.customfield_11601 = {};
            gc.current_issue_data.customfield_11610 = {};
            gc.current_issue_data.customfield_11504 = "";

            // удаляем динамические элементы диалога
            $(`.subtask`).remove();
            // сбрасываем чекбокс эпика
            $('#smart_can_create_epic').prop('checked',false);
        }
    }
    function SmartDlgAddNewTask(taskType) {
        let index = 0;
        let preffix = '[X]';
        switch(taskType) {
            case "backend": {
                gc.process.iniciativeSubtask.backend_count++;
                index = gc.process.iniciativeSubtask.backend_count;
                preffix = "[B]";
                break; }
            case "frontend": {
                gc.process.iniciativeSubtask.frontend_count++;
                index = gc.process.iniciativeSubtask.frontend_count;
                preffix = "[F]";
                break; }
            case "req": {
                gc.process.iniciativeSubtask.req_count++;
                index = gc.process.iniciativeSubtask.req_count;
                preffix = "[R]";
                break; }
            case "test": {
                gc.process.iniciativeSubtask.test_count++;
                index = gc.process.iniciativeSubtask.test_count;
                preffix = "[T]";
                break; }
            case "design": {
                gc.process.iniciativeSubtask.design_count++;
                index = gc.process.iniciativeSubtask.design_count;
                preffix = "[D]";
                break; }
        }
        SmartDlgAddAnyTasks("subtask",taskType,index,`${preffix} ${gc.current_issue_data.summary}`);
    }
    function SmartDlgAddAnyTasks(classSubtask, classSubtaskDetail, count, taskName){
        let id_postfix = `_${classSubtask}_${classSubtaskDetail}_${count}`
        let class_name = `${classSubtask} ${classSubtaskDetail} ${classSubtaskDetail}_${count}`
        // определяем группу полей
        let $fieldset = $(`#fieldset_${classSubtaskDetail}`);
        // добавляем общий div
        //<form class="aui">
        let $div = $('<form>').attr({
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
        let $element = $('<input>').attr({
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
        let $element = $('<input>').attr({
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
        let $element = $('<input>').attr({
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
        let $element = $('<input>').attr({
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

    // кнопка подсчета стоимости задач в эпике
    function EpicTasksAddListButtonCalc(){
        let epicPanel = document.getElementById("greenhopper-epics-issue-web-panel");
        if (epicPanel == null) { log("Не нашли epicPanel в документе")
        } else {
            let epicPanelHeader = document.getElementById("greenhopper-epics-issue-web-panel_heading");
            if (epicPanelHeader == null) { log("Не нашли epicPanelHeader в документе")
            } else {
                let epicTaskList = epicPanelHeader.querySelector('ul');
                if (epicTaskList == null) { log("Не нашли epicTaskList в документе")
                } else {
                    // создаем кнопку
                    let epicTaskListElemSpan = document.createElement('span');
                    epicTaskListElemSpan.id = gc.jira.elements.epicTaskListElemSpanId;
                    epicTaskListElemSpan.classList.add('aui-icon', 'aui-icon-small', 'aui-iconfont-time');
                    epicTaskListElemSpan.onclick = EpicTasksUpdateInfoSmart;

                    // добавляем кнопку в список
                    let epicTaskListElem = document.createElement('li');
                    epicTaskListElem.append(epicTaskListElemSpan);// = '<span class="aui-icon aui-icon-small aui-iconfont-time"></span>';
                    epicTaskList.append(epicTaskListElem);
                }
            }
        }
    }
    function EpicTasksUpdateInfoSmart(){
        let epicTaskListElemSpan = document.getElementById(gc.jira.elements.epicTaskListElemSpanId);
        if (epicTaskListElemSpan) {
            epicTaskListElemSpan.style.backgroundColor = "#ff7a83"
        }
        setTimeout(EpicTasksUpdateInfoSmartEnd, 0, gc.current_issue_data.key);
    }
    function EpicTasksUpdateInfoSmartEnd(epicKey){
        const start= new Date().getTime();

        let epicTable = document.getElementById("ghx-issues-in-epic-table");
        if (epicTable == null) { log("Не нашли epicTable в документе")
        } else {
            if (epicTable.rows.length < 1) { log("В эпике нет задач")
            } else {
                //var epicTasks = [];
                let estimateDevSummary = 0;
                let estimateQASummary = 0;

                // обходим таблицу задач и получаем трудозатраты по ролям
                for(let i=0; i<epicTable.rows.length; i++) {
                    if (epicTable.rows[i].id != gc.jira.elements.epicTableNewRowHeaderId && epicTable.rows[i].id != gc.jira.elements.epicTableNewRowBottomId) {
                        let issueKey = epicTable.rows[i].getAttribute("data-issuekey");
                        let epicTaskInfo = {
                            issueKey:issueKey,
                            elIssueId:'elIssueId'+issueKey.replace('-',''),
                            roles :[{key:"Developers", estimate:0},{key:"QA", estimate:0}]
                        }
                        let objIssueTimetracking = JSON.parse(GetIssueTimetracking(issueKey));
                        if (objIssueTimetracking) {
                            //Smart_log(`${ln} objIssueTimetracking = ${JSON.stringify(objIssueTimetracking)}`);
                            if ('estimates' in objIssueTimetracking) {
                                if (objIssueTimetracking.estimates.length > 0) {
                                    // обходим имеющиеся оценки
                                    for(let r=0; r<objIssueTimetracking.estimates.length; r++) {
                                        for(let ro=0; ro<epicTaskInfo.roles.length; ro++) {
                                            //Smart_log(ln+` ${epicTaskInfo.issueKey} ${objIssueTimetracking.estimates[r].role} ${epicTaskInfo.roles[ro].key}`);
                                            if (objIssueTimetracking.estimates[r].role == epicTaskInfo.roles[ro].key)
                                            {
                                                if ("remainingEstimateSeconds" in objIssueTimetracking.estimates[r]) { // originalEstimateSeconds
                                                    let estimate = objIssueTimetracking.estimates[r].remainingEstimateSeconds/60/60;
                                                    let templateValue = +estimate.toFixed(1);
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
                                } else log(`отсутствуют данные objIssueTimetracking`);
                            } else log(`отсутствуют данные estimates (issueKey=${objIssueTimetracking.key})`);
                        } else log(`GetIssueTimetracking - данные не были получены (issueKey=${issueKey})`);
                        //epicTasks.push(epicTaskInfo);
                        let newCellDev = document.getElementById('newCellDev'+epicTaskInfo.elIssueId);
                        if (newCellDev) {
                            newCellDev.innerHTML = epicTaskInfo.roles[0].estimate;
                        } else {
                            newCellDev = epicTable.rows[i].insertCell(-1);
                            newCellDev.className ='nav ghx-minimal';
                            newCellDev.id='newCellDev'+epicTaskInfo.elIssueId;
                            newCellDev.innerHTML = epicTaskInfo.roles[0].estimate;
                        }

                        let newCellQA = document.getElementById('newCellQA'+epicTaskInfo.elIssueId);
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
                let elNewRowHeader = document.getElementById(gc.jira.elements.epicTableNewRowHeaderId);
                if (!elNewRowHeader) {
                    let newRowHeader = epicTable.insertRow(0);
                    newRowHeader.id = gc.jira.elements.epicTableNewRowHeaderId;
                    let newRowHeaderCell = newRowHeader.insertCell(0); newRowHeaderCell.innerHTML = 'V';
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
                let elNewRowBottom = document.getElementById(gc.jira.elements.epicTableNewRowBottomId);
                if (!elNewRowBottom) {
                    let newRowBottom = epicTable.insertRow(-1);
                    newRowBottom.id = gc.jira.elements.epicTableNewRowBottomId;
                    let newRowBottomCell = newRowBottom.insertCell(0); newRowBottomCell.innerHTML = '';
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

        let epicTaskListElemSpan = document.getElementById(gc.jira.elements.epicTaskListElemSpanId);
        if (epicTaskListElemSpan) {
            epicTaskListElemSpan.style.backgroundColor = "white"
        }

        const end = new Date().getTime();
        log(`Время работы: ${end - start} мс`);
    }

    // массовое создание задач в эпиках
    function EpicSmartDlgAddNewTask(taskType) {
        let preffix = '';
        switch(taskType) {
            case "backend": {
                preffix = "[B] ";
                break; }
            case "frontend": {
                preffix = "[F] ";
                break; }
        }
        EpicSmartDlgAddAnyTasks("subtask",taskType,`${preffix}`);
    }
    function EpicSmartDlgAddAnyTasks(classSubtask, classSubtaskDetail, taskName){
        let count = gc.process.epicSmartDlg.task_count++;
        let id_postfix = `_${classSubtask}_${classSubtaskDetail}_${count}`
        let class_name = `${classSubtask} ${classSubtaskDetail} ${classSubtaskDetail}_${count}`
        // определяем группу полей
        let $fieldset = $(`#fieldset_${classSubtaskDetail}`);
        // добавляем общий div
        //<form class="aui">
        let $div = $('<form>').attr({
            'id': 'form' + id_postfix,
            'class': class_name+" aui"
        });
        $fieldset.append($div);
        $div.append(`<a id="a_input_desc_replace_trigger${id_postfix}" style="margin-right: 2px" data-replace-text="[-]" class="aui-expander-trigger" aria-controls="div_input_desc_expander${id_postfix}">[+]</a>`);
        // добавляем в div строку ввода имени задачи
        $div.append( EpicSmartDlgCreateTaskNameElement(id_postfix, class_name+" edit-element smart-task-name", `${taskName}`,count,classSubtaskDetail) );
        // добавляем в div строку ввода оценки задачи
        $div.append( EpicSmartDlgCreateTaskEstimateElement(id_postfix, class_name+" edit-element smart-task-estimate", count,classSubtaskDetail) );
        // добавляем в div строку ввода ответственного за задачу
        $div.append( EpicSmartDlgCreateTaskAssigneeElement(id_postfix, class_name+" edit-element smart-task-assignee", count,classSubtaskDetail) );
        // добавляем кнопку удаления группы элементов
        $div.append( EpicSmartDlgCreateBtnDeleteElement(id_postfix, class_name) );
        // добавляем в div строку ввода описания задачи
        $div.append( EpicSmartDlgCreateDescriptionElement(id_postfix, class_name+" edit-element smart-task-description", count,classSubtaskDetail) );
    }
    function EpicSmartDlgCreateTaskNameElement(postfix, className, taskName, index, issueType) {
        let $element = $('<input>').attr({
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
    function EpicSmartDlgCreateTaskEstimateElement(postfix, className, index, issueType) {
        let $element = $('<input>').attr({
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
    function EpicSmartDlgCreateTaskAssigneeElement(postfix, className, index, issueType) {
        let $div = $('<div>').attr({
            'id': 'div_input_assignee' + postfix,
            'class': className+" search_box"
        });
        let $div_search_result = $('<div>').attr({
            'id': 'div_input_assignee_result' + postfix,
            'class': className+""
        });
        let $element = $('<input>').attr({
            'id': 'input_assignee' + postfix,
            'class': className+" text medium-field search_box_empty",
            'type': 'text',
            'placeholder': 'Ответственный',
            "data-smart-id":index,
            "data-issue-type":issueType
        })
            .css({
                'margin-right':'5px'
            })
            .attr({'autocomplete': 'on'
            })
            .keyup(function() {
                let $result = $('#div_input_assignee_result'+ postfix);
                let search_text = $(this).val();
                //log(`search = ${search_text}`);
                let url = new URL(gc.jira.urls.getUserForPicker);
                let requestParams = [{key:'maxResults',value:'30'},{key:'query',value:search_text},{key:'showAvatar',value:'false'}];
                for (let x of requestParams) {
                    url.searchParams.set(x.key, x.value);
                }
                // подсветка
                if ((search_text != '') && (search_text.length > 0)){
                    $(this).css({
                        borderColor:"#fd4836"
                    })
                } else {
                    $(this).css({
                        borderColor:"#c1c7d0"
                    })
                }
                // search_box #fd4836 #5d9d20
                if ((search_text != '') && (search_text.length > 1)){
                    $.ajax({
                        type: "GET",
                        url: url,
                        data: {},
                        success: function(msg){
                            //log(`msg = ${JSON.stringify(msg)}`);
                            let obj = msg;
                            //log(`msg = ${JSON.stringify(obj)}`);
                            if ('total' in obj && obj.total > 0) {
                                let html = `<div class="search_result"> <table class="aui">`
                                for (let user of obj.users) {
                                    html+=`<tr>`
                                    html+=`<td class="search_result-name">
                                    <button class="aui-button aui-button-link search_result-btn" data-parent="input_assignee${postfix}" data-user="${user.name}">${user.displayName} (${user.name})</button>
                                    </td>`
                                    html+=`</tr>`
                                }
                                html+=`</table> </div>`
                                $result.html(html);
                                $result.fadeIn();
                                $(`.search_result-btn`).each(function(i,elem) {
                                    $(elem).click(function(){
                                        //log($(elem).attr("data-user"));
                                        //log($(elem).attr("data-parent"));
                                        let parent = $(`#${$(elem).attr("data-parent")}`)
                                        parent.attr("data-user",$(elem).attr("data-user"));
                                        parent.val($(elem).attr("data-user"));
                                        parent.css({
                                            borderColor:"#5d9d20"
                                        })
                                        $result.html('');
                                        $result.fadeOut(100);
                                    });
                                });
                            } else {
                                $result.fadeOut(100);
                            }
                        }
                    });
                } else {
                    $result.html('');
                    $result.fadeOut(100);
                }
            })

        $div.append($element);
        $div.append($div_search_result);
        return $div;
    }
    function EpicSmartDlgCreateDescriptionElement(postfix, className, index, issueType) {
        let $div = $('<div>').attr({
            'id': 'div_input_desc' + postfix,
            'class': className+""
        }).css({
            'margin-top':'4px',
            'margin-left':'19px'
        });
        let $div_expander = $('<div>').attr({
            'id': 'div_input_desc_expander' + postfix,
            'class': className+" aui-expander-content"
        });
        let $element = $('<textarea>').attr({
            'id': 'input_desc' + postfix,
            'class': className+" textarea",
            //'type': 'text',
            //'value': taskName,
            "data-smart-id":index,
            "data-issue-type":issueType
        })
            .css({
                //'margin-left':'5px'
                'max-width':'740px'
            });
        $div_expander.append($element);
        $div.append($div_expander);
        //$div.append(`<a id="a_input_desc_replace_trigger${postfix}" data-replace-text="Скрыть" class="aui-expander-trigger" aria-controls="div_input_desc_expander${postfix}">Еще</a>`);
        return $div;
    }
    function EpicSmartDlgCreateBtnDeleteElement(postfix, className) {
        let $element = $('<input>').attr({
            id: 'btn' + postfix,
            class: className + " btnDelete aui-button",
            type: 'button',
            value: 'Удалить'
        })
            .css({
                'margin-left':'5px'
            })
            .click(function() {
                EpicSmartDlgDeleteTaskElements(postfix);
            });
        /*var $div = $('<div>').attr({
            'id': 'div' + postfix,
            'class': className+" aui-buttons"
        });
        $div.append($element);*/
        return $element;
    }
    function EpicSmartDlgDeleteTaskElements(value) {
        //alert(`${index} ${type}`);
        $(`form#form${value}`).remove()
    }
    function EpicSmartDlgCreateTasks(){
        // формируем массив данных для создания задач
        let tasks_data = [];
        // получаем все елементы с данными (кроме эпика в проекте разработки)
        let $newTaskNameElemenst = $(".smart-task-name");
        if ($newTaskNameElemenst.length>0) {
            // обходим только элементы с именем задачи и уже на основе их индекса работаем с другими
            $newTaskNameElemenst.each(function(indx){
                let index = $(this).attr("data-smart-id");
                let issue_type = $(this).attr("data-issue-type");
                let task_name = $(this).val(); if (task_name.length == 0) task_name = "Имя задачи не задано";
                let task_estimate = $(`.${issue_type} .smart-task-estimate[data-smart-id="${index}"]`).val(); if (task_estimate.length == 0) task_estimate = -1; // $newTaskEstimateElemenst.find("#input_estm_subtask_backend*").length; //$(".edit-element[smart-index2='2']").length;   [data-smart-id="${index}"]
                let task_assignee = $(`.${issue_type} .smart-task-assignee[data-smart-id="${index}"]`).val();
                let task_desc = $(`.${issue_type} .smart-task-description[data-smart-id="${index}"]`).val();
                //log(`issue_type ${issue_type} index ${index} task_name ${task_name} task_estimate ${task_estimate}`);
                tasks_data.push({"issue_type":issue_type, "task_name":task_name, "task_estimate":task_estimate, "task_assignee":task_assignee, "task_desc":task_desc});
            });
            if (tasks_data.length >0 ) {
                let data = {"issueUpdates": []};
                let issueTimeTracking = [];
                for (let task of tasks_data) {
                    let issueTypeId = gc.jira.fields.issueTypes.dev.task;
                    switch(task.issue_type) {
                        case "backend": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.task;
                            break; }
                        case "frontend": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.task;
                            break; }
                        case "task": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.task;
                            break; }
                        case "bug": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.bug;
                            break; }
                        case "simple": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.simple;
                            break; }
                        case "process": {
                            issueTypeId = gc.jira.fields.issueTypes.dev.process;
                            break; }
                    }
                    let x = {"fields": {
                            "summary":task.task_name,
                            "description":task.task_desc,
                            "assignee": { "name": task.task_assignee},
                            "project": {"key":gc.current_issue_data.projectKey},
                            "issuetype": {"id": issueTypeId},
                            [gc.jira.fields.epicLink]:gc.current_issue_data.key//,
                            //"timetracking":{"originalEstimate": task.task_estimate}
                        }}
                    data.issueUpdates.push(x);
                    let time = { "key" : "", "estimatesRoleId":gc.jira.fields.timeTracking.Role.Developer.id,"originalEstimate": task.task_estimate};
                    issueTimeTracking.push(time);
                }
                //log(`${JSON.stringify(data)}`);
                let prTasks =  createIssuesBulk(data,"EpicSmartDlg");
                prTasks.then(
                    result => {
                        let obj = JSON.parse(result);
                        //log(`${JSON.stringify(obj)}`);
                        if (obj && 'issues' in obj && obj.issues != null) {
                            showFlag(`Задачи для эпика ${gc.current_issue_data.key} успешно созданы. Приступаем к корректировке оценок.`,"Внимание!","success","auto");
                            log(`Задачи для эпика ${gc.current_issue_data.key} успешно созданы`);
                            // готовим данные для задания времени
                            for (let i = 0; i < obj.issues.length; i++) {
                                issueTimeTracking[i].key = obj.issues[i].key;
                            }
                            //log(`${JSON.stringify(issueTimeTracking)}`);
                            // запускаем обновление времени по задачам
                            setTimeout(cns_setTimeTrackingRecurse,100,issueTimeTracking,"EpicSmartDlg");
                        } else {
                            log(`Ошибка обработки данных по задачам эпика`);
                            showFlag(`Ошибка обработки данных по задачам эпика`,"Внимание!","error");
                        }
                    },
                    error => {
                        log(`Ошибка создания задач для эпика ${gc.current_issue_data.key}`);
                        showFlag(`Ошибка создания задач для эпика ${gc.current_issue_data.key}`,"Внимание!","error");
                    }
                )
            }
        }
    }
    function EpicSmartDlgShow(){
        let dID = "epicSmart-dialog"
        if ( !($('*').is(`#${dID}`)) ) {
            // добавляем счетчик для элементов
            gc.process["epicSmartDlg"] = {"task_count":0}
            let dialog = `
<section id="${dID}" class="aui-dialog2 aui-dialog2-xlarge aui-layer ${dID}" role="dialog" aria-hidden="true">
<header class="aui-dialog2-header">
<h2 id="${dID}-epic-key">...</h2></br>
</header>
<div id="${dID}-content" class="aui-dialog2-content">
    <fieldset id="fieldset_backend" class="smart-fieldset">
        <button id="btn_backend_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"task">Backend</button>
    </fieldset>
    <fieldset id="fieldset_frontend" class="smart-fieldset">
        <button id="btn_frontend_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"task">Frontend</button>
    </fieldset>
    <fieldset id="fieldset_task" class="smart-fieldset">
        <button id="btn_task_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"task">Task</button>
    </fieldset>
    <fieldset id="fieldset_bug" class="smart-fieldset">
        <button id="btn_bug_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"bug">Bug</button>
    </fieldset>
    <fieldset id="fieldset_simple" class="smart-fieldset">
        <button id="btn_simple_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"simple">Simple</button>
    </fieldset>
    <fieldset id="fieldset_process" class="smart-fieldset">
        <button id="btn_process_add" type="button" class="aui-button aui-button-primary btn_add" data-issue-type:"process">Process</button>
    </fieldset>
</div>
<footer class="aui-dialog2-footer">
    <div class="aui-dialog2-footer-actions">
        <button id="epicSmart-submit-button" class="aui-button aui-button-primary">Ok</button>
        <button id="epicSmart-cancel-button" class="aui-button aui-button-link">Отмена</button>
    </div>
</footer>
</section>

<style>
.${dID} {
   width: 900px;
}
.smart-fieldset{
	border-width: 1px;
    margin-bottom: 15px;
}
.btn_add{
    width: 83px;
    position: sticky;
    top: -20px;
    z-index: 10;
}
body {
	font-size:14px;
	padding: 15px 20px;
}
.search_box {
	position: relative;
	display: inline-block;
}
.search_box input[type="text"] {
	display: block;
	width: 100%;    
	//height: 35px;
	//line-height: 35px;
	padding: 0;
	margin: 0;
	border: 1px solid #c1c7d0;
	//outline: none;
	overflow: hidden;
	border-radius: 4px;
	background-color: rgb(255, 255, 255);
	text-indent: 10px;
	font-size: 14px;
	color: #222;
}

/* Стили для плашки с результатами */
.search_result {
	position: absolute;
	top: 120%;
	left: -585px;
	border: 1px solid #ddd;
	background: #fff;
	padding: 10px;
	z-index: 9999;
	box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
}
.search_result table {
	border-collapse: collapse;
	border-spacing: 0;
	width: 100%;
	table-layout: fixed;
}
.search_result td {
	padding: 5px 10px;
	vertical-align: middle;
}
.search_result-name {
	font-weight: 600;
	font-size: 16px;
}
.search_result-btn {
	width: 150px;
	text-align: right;
}
.search_result-btn a {
	border-width: 1px;
	background-color: rgb(253, 72, 54);
	display: inline-block;
	font-size: 13px;
	color: rgb(255, 255, 255);
	text-decoration: none;
	padding: 5px;
}
</style>
`;
            $("body").append(dialog);
            $("#epicSmart-cancel-button").on('click', function (e) {
                e.preventDefault();
                AJS.dialog2(`#${dID}`).hide();
            });
            $("#epicSmart-submit-button").on('click', function (e) {
                e.preventDefault();
                showFlag(`Запускаем создание задач`,"Внимание!","info","auto");
                EpicSmartDlgCreateTasks();
                AJS.dialog2(`#${dID}`).hide();

            });
            $("#btn_backend_add").click(function() { EpicSmartDlgAddNewTask("backend"); });
            $("#btn_frontend_add").click(function() { EpicSmartDlgAddNewTask("frontend"); });
            $("#btn_task_add").click(function() { EpicSmartDlgAddNewTask("task"); });
            $("#btn_bug_add").click(function() { EpicSmartDlgAddNewTask("bug"); });
            $("#btn_simple_add").click(function() { EpicSmartDlgAddNewTask("simple"); });
            $("#btn_process_add").click(function() { EpicSmartDlgAddNewTask("process"); });
        }
        if (gc.current_issue_data.key) {
            $(`#${dID}-epic-key`).text(`Добавление задач в эпик ${gc.current_issue_data.key} (${gc.current_issue_data.projectKey})`);

            AJS.dialog2(`#${dID}`).show();
        } else {
            alert("Не удалось определить номер задачи. Перезагрузите страницу и попробуйте снова.");
        }



    }
})();
//</script>