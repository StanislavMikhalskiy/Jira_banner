(function() {
    /*var s = document.createElement("script");
    s.async = false;
    s.defer = true;
    s.src = "https://<путь-к-скрипту>.jsAJS";
    document.head.appendChild(s);*/
    //window.alert("Все получилось");

    const script_version = '1.2'
    const environment = "LOCAL"; // LOCAL DEV PROD
    let log_preffix = `${environment} Banner: `
    // глобальный конфиг разных процессов
    var gc = {}

    function log(value){
        var dt = new Date();
        console.log(`${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}.${dt.getMilliseconds()} ${log_preffix}${value}`);
    }
    // функция задержки выполнения
    function defer(f, ms) {
        return function() {
            setTimeout(() => f.apply(this, arguments), ms)
        };
    }
    // базовые установки
    function setup(){
        let url = "";
        switch (environment) {
            case "LOCAL": {
                url = "https://jira.action-media.ru"
                break
            }
            case "PROD": {
                url = "https://jira.action-media.ru"
                break
            }
            case "DEV": {
                url = "https://jira.dev.aservices.tech/"
                break
            }
        }
        // заполняем конфиг
        gc['jira'] = {mainUrl:url}
        gc.jira['urls'] = {
            "viewIssue":gc.jira.mainUrl+"/browse/",
            "getIssue":gc.jira.mainUrl+"/rest/api/2/issue/", // gc.jira.urls.getIssue
            "postIssue":gc.jira.mainUrl+"/rest/api/2/issue/", // gc.jira.urls.postIssue
            "searchIssue":gc.jira.mainUrl+"/rest/api/2/search", // gc.jira.urls.searchIssue
            "postIssueBulk":gc.jira.mainUrl+"/rest/api/2/issue/bulk/", // gc.jira.urls.postIssueBulk
            "postIssueLink":gc.jira.mainUrl+"/rest/api/2/issueLink/", // gc.jira.urls.postIssueLink
            "postTimeTracking":gc.jira.mainUrl+"/rest/adweb/2/timetracking/"
        }
        gc.jira['fields'] = {
            "epicLink":"customfield_10100", // gc.jira.fields.epicLink
            "epicName":"customfield_10102",
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
                    "task":"10214"
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
        urlParams();
        // подписываемся на события
        document.addEventListener("DOMContentLoaded", DOMContentLoaded());
        $(document).ajaxComplete(FajaxComplete);
        log(`Скрипт успешно подключен. Версия ${script_version}`);
        /*
        $(document).ajaxComplete(function(event, xhr, settings) {
        if ( settings.url === "ajax/test.html" ) {
            $( ".log" ).text( "Triggered ajaxComplete handler. The result is " +
                     xhr.responseHTML );}});
        */
    }
    function DOMContentLoaded(){
        getPermissions();
        // получаем метаданные из Jira
        gc.current_issue_data["key"] = JIRA.Issue.getIssueKey();//AJS.Meta.get("issue-key");
        gc.current_issue_data["projectKey"] = JIRA.API.Projects.getCurrentProjectKey();
        // если это среда разработки, то добавляем боковое меню для запуска фич для отладки
        if (environment == "LOCAL") createDebugMenu();
    }
    function urlParams(){
        //var paramsString = document.location.search;
        // var searchParams = new URLSearchParams(paramsString);
        gc['urlParams'] = new URLSearchParams(document.location.search);
    }
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

        var newScript = document.createElement("script");
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

        var $menu = $(`#myDropdown`);

        // добавляем кастомные элемены в меню для отладки процессов
        // тестовый элемент
        var $element = $('<a>').attr({
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

    }

    // запускаем базовые установки
    let deferredSetup = defer(setup, 1000);
    deferredSetup();

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
    function FajaxComplete(){
        //log(`FajaxComplete`);
        fillKanbanCard();
    }
    // получить разрешения для команд
    function getPermissions(){
        // считываем настройки по командам
        var prTeamsConfigData =  getIssue("PSQL-222","description");
        prTeamsConfigData.then(
            result => {
                var obj = JSON.parse(result);
                if ('fields' in obj && obj.fields != null) {
                    if ('description' in obj.fields && obj.fields.description != null) {
                        // очистка данных
                        var x = JSON.stringify(obj.fields.description).replace(/{code:json}|{code}|\\r|\\n|\\/g, '');
                        x = x.replace(/"\[{/g, '[{');
                        x = x.replace(/}\]"/g, '}]');
                        var teamsData = JSON.parse(x);
                        // обходим полученный массив комманд
                        for (let teamData of teamsData) {
                            //log(`teamData.rapidView ${teamData.rapidView}`);
                            /*if ('rapidView' in teamData && teamData.rapidView != null && teamData.rapidView==config.rapidView) {
                                //log.info(`Нашли команду ${JSON.stringify(teamData.team)}`);
                                getWorkTime(teamData.team);
                                break;
                            }*/
                        }
                        //log.warn(`Данные по команде не получены`);
                    } else log(`Нет данных по полю "description"`);
                } else log(`Нет данных по полю "fields"`);
            },
            error => {
                log(`Не удалось считать настройки по командам`);
            }
        )
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
    // создает новую задачу
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

    function testAlert(){
        alert("Test");
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
    // цветовая заливка карточек на канбан-доске
    function fillKanbanCard(){
        // проверяем, что мы на доске
        // https://jira.action-media.ru/secure/RapidBoard.jspa?rapidView=746&view=detail&selectedIssue=SS-11463
        if (!gc.urlParams.has("rapidView")) {
            return;
        } else {
            // проверяем, что мы на нужной доске
            if ( gc.urlParams.get("rapidView") !== "746") return; // 746
        }

        // ищем карты по доске
        var $cards = $(".js-detailview");
        //log(`cards.length ${$cards.length} `);
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

    // пул задач для заведения новой справочной системы
    /*
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
                            "assignee": { "name": "a.ivanov"}}
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
                            "summary": "[T] Регресс эпика",
                            "description": "Регресс эпика",
                            "timetracking": "",
                            "assignee": { "name": "a.ivanov"}}
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
                            "description": `Требуется для но����ого издания\n
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
            log(`Корректировка времени для ${x.key}`);
            let prDevTaskTime = setTimeTracking(x.key, x.estimatesRoleId, x.originalEstimate, process);
            prDevTaskTime.then(
                result => {
                    cns_setTimeTrackingRecurse(value,process);
                },
                error => {
                    log(`Ошибка корректировки времени для ${x.key}`);
                    showFlag(`Ошибка корректировки времени для ${x.key}`,"Внимание!","error");
                })
        } else {
            showFlag(`Оценки времени добавлены`,"Внимание!","success","auto");
            log(`Оценки времени добавлены`);
        }
    }
})();
