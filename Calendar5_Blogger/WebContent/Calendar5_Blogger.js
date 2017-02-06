// Calendar5_Bloggerモジュール
var Calendar5_Blogger = Calendar5_Blogger || function() {
    var cl = {
        callback: {  // コールバック関数。
            getArticles: function(json) {  // 指定した月のフィードを受け取る。
                Array.prototype.push.apply(vars.posts, json.feed.entry);// 投稿のフィードデータを配列に追加。
                if (json.feed.openSearch$totalResults.$t < vars.max) {  // 取得投稿数がvars.maxより小さい時はすべて取得できたと考える。
                    var re = /\d\d(?=T\d\d:\d\d:\d\d\.\d\d\d.\d\d:\d\d)/i;  //  フィードの日時データから日を取得するための正規表現パターン。
                    vars.posts.forEach(function(e){  // 投稿のフィードデータについて
                        var d = Number(re.exec(e[vars.order].$t));  // 投稿の日を取得。
                        vars.dic[d] = vars.dic[d] || [];  // 辞書の値の配列を初期化する。
                        var url = (e.media$thumbnail)?e.media$thumbnail.url:null;  // サムネイルのurl。
                        vars.dic[d].push([e.link[4].href, e.link[4].title, url]);  // 辞書の値の配列に[投稿のURL, 投稿タイトル, サムネイルのURL]の配列を入れて2次元配列にする。
                        }
                    );
                    cal.createCalendar();  // フィードデータからカレンダーを作成する。
                } else {  // 未取得のフィードを再取得する。最新の投稿が先頭に来る。
                    var m = /(\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d)\.\d\d\d(.\d\d:\d\d)/i.exec(json.feed.entry[json.feed.entry.length-1][vars.order].$t);  // フィードの最終投稿（最古）データの日時を取得。
                    var dt = new Date;  // 日付オブジェクトを生成。
                    dt.setTime(new Date(m[1] + m[2]).getTime() - 1 * 1000);  // 最古の投稿の日時より1秒早めるた日時を取得。ミリ秒に変換して計算。
                    if (vars.m==dt.getMonth()+1) {  // 1秒早めても同じ月ならば
                        var max = vars.y + "-" + cal.fm(vars.m) + "-" + cal.fm(dt.getDate()) + "T" + cal.fm(dt.getHours()) + ":" + cal.fm(dt.getMinutes()) + ":" + cal.fm(dt.getSeconds()) + "%2B09:00";  // フィード取得のための最新日時を作成。
                        cal.createURL(max);  // フィード取得のURLを作成。                       
                    }
                }  
            }
        },
        all: function(elemID) {  // ここから開始する。
            vars.elem = document.getElementById(elemID);  // idから追加する対象の要素を取得。
            if (vars.elem) {  // 追加対象の要素が存在するとき
                vars.L10N = (/.jp$/i.test(location.hostname))?false:true;  // jpドメイン以外のときフラグを立てる。
                var dt; // 日付オブジェクト。
                var mc = /\/(20\d\d)\/([01]\d)\//.exec(document.URL);  // URLから年と月を正規表現で得る。
                if (mc) {  // URLから年と月を取得できた時
                    var m = Number(mc[2]) - 1;  // 月ひく1を取得
                    dt = new Date(mc[1],m,1);
                } else {  // アイテムページ以外の時は今日の日付を取得。
                    dt = new Date();
                };
                cal.getFeed(dt);
            } 
        }        
    };  // end of cl
    var vars = {  // モジュール内の"グローバル"変数。
        y: null,  // 表示カレンダーの年。
        m: null,  // 表示カレンダーの月。
        em: null,  //表示カレンダーの末日。
        max: 150,  // Bloggerのフィードで取得できる最大投稿数を設定。
        posts: [],  // 投稿のフィードデータを収納する配列。
        dic: {},  // キーを日、値を投稿のURLと投稿タイトルの配列、とする辞書。
        order: "published",  // publishedかupdatedが入る。
        elem: null,  // 置換するdiv要素。
        dataPostsID: "datePosts",  // 日の投稿の一覧を表示するdivのID
        days: [],  // 曜日の配列。
        init: function (dt) {  // 日付オブジェクトからカレンダーのデータを作成.
            vars.y = dt.getFullYear();  // 表示カレンダーの年を取得。
            vars.m = dt.getMonth() + 1;  // 表示カレンダーの月を取得。
            vars.em = new Date(vars.y, vars.m, 0).getDate();  // 表示カレンダーの末日を取得。
            vars.posts = [];  // フィードデータをリセットする。
            vars.dic = {};  // 投稿データをリセットする。
            vars.days = (vars.L10N)?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]: ["日","月","火","水","木","金","土"];  // 曜日の配列。
        },
        L10N: false,  // 日本語以外かのフラグ。
        enM: ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sept.","Oct.","Nov.","Dec."]
    };  // end of vars
    var cal = {  // カレンダーを作成するオブジェクト。
        _holidayC: "rgb(255, 0, 0)",  // 休日の文字色
        _SatC: "rgb(0, 51, 255)",  //  土曜日の文字色 
        getFeed: function(dt) {  // 日付オブジェクトからフィードを得てカレンダーを作成する。
            vars.init(dt);  // 日付オブジェクトからカレンダーのデータを作成。
            var max = vars.y + "-" + cal.fm(vars.m) + "-" + cal.fm(vars.em) + "T23:59:59%2B09:00";  // 表示カレンダーの最終日23時59分59秒までのフィードを得るための日時を作成。
            cal.createURL(max);  // フィードを取得するためのURLを作成。            
        },
        createCalendar:  function() {  // カレンダーのHTML要素を作成。 
            var calflxC = nd.calflxC();  // カレンダーのflexコンテナを得る。
            calflxC.appendChild(nd.leftarrowflxI());  // 左向き矢印のflexアイテム。flexBasis14%。
            var title =  (vars.L10N)?((vars.order=="published")?"":"updated"):((vars.order=="published")?"":"更新");
            title = (vars.L10N)?vars.enM[vars.m-1] + " " + vars.y + " " + title:vars.y + "年" + vars.m + "月" + title;
            calflxC.appendChild(nd.titleflxI(title));  // カレンダータイトルのflexアイテム。flexBasis 72%。
            calflxC.appendChild(nd.rightarrowflxI());  // 右向き矢印のflexアイテム。flexBasis14%。
            vars.days.forEach(function(e,i){  // 1行目に曜日を表示させる。2番目の引数は配列のインデックス。
                var node = nd.calflxI(e);  // 曜日のflexアイテムを取得。
                node.s = i;  // 曜日番号を取得。
                cal._getDayC(node);  // 曜日の色をつける。
                if (vars.L10N) {
                    node.style.fontSize = "80%";  // 英語表記では1行に収まらないのでフォントサイズを縮小。
                }
                calflxC.appendChild(node);  // カレンダーのflexコンテナに追加。
            });
            var day =  new Date(vars.y, vars.m-1, 1).getDay();  // 1日の曜日を取得。日曜日は0、土曜日は6になる。
            for(var i = 0; i < day; i++) { // 1日までの空白となるflexアイテムを開始曜日分まで取得。
                calflxC.appendChild(nd.calflxI());  // 空白のカレンダーのflexアイテムをflexコンテナに追加。
            }
            var dateflxI;  // 日のflexアイテム。
            for(var i = 1; i < vars.em+1; i++) {  // 1日から末日まで。
                if (i in vars.dic) {  // 辞書のキーに日があるとき
                    dateflxI = nd.dateflxIWithPost(i); // 投稿のある日のカレンダーのflexアイテム。
                    vars.dic[i].forEach(function(arr) {  // title属性に投稿タイトルのみ入れる。
                        dateflxI.title += (dateflxI.title)?"\n" + "\u30fb" + arr[1]:"\u30fb" + arr[1];
                    });
                } else {  // 辞書のキーに日がないとき
                    dateflxI = nd.calflxI(i); // 投稿のない日のカレンダーのflexアイテム。  
                    dateflxI.className = "nopost"; 
                } 
                dateflxI.s = (day+i-1) % 7;  // 7で割ったあまりを取得。0が日曜日、6が土曜日。これは曜日番号になる。
                cal._getDayC(dateflxI);  // 曜日の色をつける。
                cal._getHolidayC(dateflxI);  // 祝日に色をつける。
                calflxC.appendChild(dateflxI);  // カレンダーのflexコンテナに追加。
            }
            var s = (day+vars.em) % 7;  // 7で割ったあまりを取得。
            if (s > 0) {  // 7で割り切れない時。
                for(var i = 0; i < 7-s; i++) { // 末日以降の空白を取得。
                    calflxC.appendChild(nd.calflxI());  //  空白のカレンダーのflexアイテムをflexコンテナに追加。
                }        
            } 
            calflxC.addEventListener( 'mousedown', eh.mouseDown, false );  // カレンダーのflexコンテナでイベントバブリングを受け取る。マウスが要素をクリックしたとき。
            calflxC.addEventListener( 'mouseover', eh.mouseOver, false );  // マウスポインタが要素に入った時。
            calflxC.addEventListener( 'mouseout', eh.mouseOut, false );  // マウスポインタが要素から出た時。
            vars.elem.textContent = null;  // 追加する対象の要素の子ノードを消去する。
            vars.elem.appendChild(calflxC);  // 追加する対象の要素の子ノードにカレンダーのflexコンテナを追加。
            vars.elem.appendChild(nd.datePostsNode());  // 日の投稿データを表示させるflexコンテナを追加。
        },
        _getHolidayC: function(node) {  // 祝日に色をつける。JSON文字列はhttps://p--q.blogspot.jp/2016/12/blogger10json.htmlを作成。
            // キーは年、値は二元元配列。1次が月数、二次が祝日の配列。
            var holidays = {"2013":[[1,14],[11],[20],[29],[3,4,5,6],[],[15],[],[16,23],[14],[3,4,23],[23]],"2014":[[1,13],[11],[21],[29],[3,4,5,6],[],[21],[],[15,23],[13],[3,23,24],[23]],"2015":[[1,12],[11],[21],[29],[3,4,5,6],[],[20],[],[21,22,23],[12],[3,23],[23]],"2016":[[1,11],[11],[20,21],[29],[3,4,5],[],[18],[11],[19,22],[10],[3,23],[23]],"2017":[[1,9],[11],[20],[29],[3,4,5],[],[17],[11],[18,23],[9],[3,23],[23]],"2018":[[1,8],[11,12],[21],[29,30],[3,4,5],[],[16],[11],[17,23,24],[8],[3,23],[23,24]],"2019":[[1,14],[11],[21],[29],[3,4,5,6],[],[15],[11,12],[16,23],[14],[3,4,23],[23]],"2020":[[1,13],[11],[20],[29],[3,4,5,6],[],[20],[11],[21,22],[12],[3,23],[23]],"2021":[[1,11],[11],[20],[29],[3,4,5],[],[19],[11],[20,23],[11],[3,23],[23]],"2022":[[1,10],[11],[21],[29],[3,4,5],[],[18],[11],[19,23],[10],[3,23],[23]],"2023":[[1,9],[11],[21],[29],[3,4,5],[],[17],[11],[18,23],[9],[3,23],[23]],"2024":[[1,8],[11,12],[20],[29],[3,4,5,6],[],[15],[11,12],[16,22,23],[14],[3,4,23],[23]],"2025":[[1,13],[11],[20],[29],[3,4,5,6],[],[21],[11],[15,23],[13],[3,23,24],[23]],"2026":[[1,12],[11],[20],[29],[3,4,5,6],[],[20],[11],[21,22,23],[12],[3,23],[23]],"2027":[[1,11],[11],[21,22],[29],[3,4,5],[],[19],[11],[20,23],[11],[3,23],[23]],"2028":[[1,10],[11],[20],[29],[3,4,5],[],[17],[11],[18,22],[9],[3,23],[23]],"2029":[[1,8],[11,12],[20],[29,30],[3,4,5],[],[16],[11],[17,23,24],[8],[3,23],[23,24]],"2030":[[1,14],[11],[20],[29],[3,4,5,6],[],[15],[11,12],[16,23],[14],[3,4,23],[23]]};
            var arr = holidays[vars.y][vars.m-1];  // 祝日の配列を取得。
            var d = Number(node.textContent);  // 数値に変換
            if (arr.indexOf(d) != -1) {  // 祝日配列に日付があるとき。in演算子はインデックスの有無の確認をするだけ。
                node.style.color = cal._holidayC;
            }
        },
        _getDayC: function(node){  // 曜日の色をつける。オブジェクトの参照渡しを利用。
            if (node.s==0) {  // 日曜日のとき
                node.style.color = cal._holidayC;
            } else if (node.s==6) {  // 土曜日のとき
                node.style.color = cal._SatC;
            }            
        },
        _writeScript: function(url) {  // スクリプト注入。
            var ws = eh.createElem('script');
            ws.type = 'text/javascript';
            ws.src = url;
            document.getElementsByTagName('head')[0].appendChild(ws);
        },    
        createURL: function(max) {  // フィードを取得するためのURLを作成。
            var url = "/feeds/posts/summary?alt=json-in-script&orderby=" + vars.order + "&" + vars.order + "-min=" + vars.y + "-" + cal.fm(vars.m) + "-01T00:00:00%2B09:00&" + vars.order + "-max=" + max;  // 1日0時0分0秒からmaxの日時までの投稿フィードを取得。データは最新の投稿から返ってくる。
            url += "&callback=Calendar5_Blogger.callback.getArticles&max-results=" + vars.max;  // コールバック関数と最大取得投稿数を設定。
            cal._writeScript(url);  // スクリプト注入でフィードを取得。。
        },        
        fm: function(m) {  // 数値を2桁の固定長にする。
            return ("0" + m).slice(-2);
        }
    };  // end of cal
    var nd = {  // HTML要素のノードを作成するオブジェクト。
        calflxC: function() {  // カレンダーのflexコンテナを返す。
            var node = eh.createElem("div");  // flexコンテナになるdiv要素を生成。
            node.style.display = "flex";  // flexコンテナにする。
            node.style.flexWrap = "wrap";  // flexコンテナの要素を折り返す。 
            return node;
        },
        calflxI: function(text) {  // カレンダーのflexアイテムを返す。
            var node = eh.createElem("div");  // flexアイテムになるdiv要素を生成。
            node.textContent = text;
            node.style.flex = "1 0 14%";  // flexアイテムの最低幅を1/7弱にして均等に拡大可能とする。
            node.style.textAlign = "center";  // flexアイテムの内容を中央寄せにする。  
            return node;
        },
        dateflxIWithPost: function(date) {  // 投稿の日のflexアイテムを返す。
            var node = nd.calflxI(); // カレンダーのflexアイテムを取得。  
            node.className = "post";  // クラス名をpostにする。
            node.textContent = date;  // 日をtextノードに取得。textContentで代入すると子ノードは消えてしまうので注意。
            node.style.backgroundColor = "rgba(128,128,128,.4)";  // 背景色
            node.style.borderRadius = "50%";  // 背景の角を丸める
            node.style.cursor = "pointer";  // マウスポインタの形状を変化させる。
            return node;
        },
        datePostsNode: function() {  // 日の投稿データを表示させるflexコンテナを返す。
            var node = eh.createElem("div");  // flexコンテナになるdiv要素を生成。
            node.style.display = "flex";  // flexコンテナにする。
            node.id = vars.dataPostsID;  // idを設定。
            node.style.flexDirection = "column";  // flexアイテムを縦並びにする。
            return node;
        },
        _postflxC: function() {  // 日の投稿のdiv要素を返す。
            var node = eh.createElem("div");  // div要素を生成。
            node.style.borderTop = "dashed 1px rgba(128,128,128,.5)";
            node.style.paddingTop = "5px";       
            return node;
        },
        _imgflxI: function(arr) {  // サムネイル画像の投稿のdiv要素を返す。引数は配列。
            var node = eh.createElem("div");  // div要素を生成。
            var img = eh.createElem("img");
            img.src = arr[2];  // 配列からサムネイル画像のurlを取得。
            var a = nd._a(arr);  // 投稿のurlを入れたa要素を取得。
            a.appendChild(img);  // サムネイル画像のノードをa要素に追加。
            node.appendChild(a);            
            return node;
        },
        _a: function(arr) {  // 投稿のurlを入れたa要素を返す。
            var node = eh.createElem("a"); 
            node.href = arr[0];  // 配列から投稿のurlを取得。
            return node;
        },
        _titleflxI: function(arr) {  // 投稿タイトルの投稿のdiv要素を返す。
            var node = eh.createElem("div");  //div要素を生成。
            var a = nd._a(arr);
            a.textContent = arr[1];
            node.appendChild(a);            
            return node;
        },
        postNode: function(arr) {  // 引数は[投稿のURL, 投稿タイトル, サムネイルのURL]の配列。
            var node = nd._postflxC(); // 日の投稿のflexコンテナを取得。
            if (arr[2]) {  // サムネイルがあるとき
                var imgflxI = nd._imgflxI(arr);  // サムネイル画像を入れる投稿のdiv要素。引数は配列。
                imgflxI.style.float = "left";  // 画像の周りのテキストを右から下に回りこませる。
                imgflxI.style.padding = "0 5px 5px 0";  // 右と下に5px空ける。
                node.appendChild(imgflxI);
            }
            var titleflxI = nd._titleflxI(arr);
            node.appendChild(titleflxI);
            return node;
        },
        _arrowflxI: function(text,id) {  // 月を移動するボタンを返す。
            var node = eh.createElem("div");  // flexアイテムになるdiv要素を生成。
            node.textContent = text;
            node.id = id;
            node.style.flex = "0 0 14%";  // 1/7幅で伸縮しない。
            node.style.textAlign = "center";
            return node;
        },
        leftarrowflxI: function() {  // 左向き矢印のflexアイテム。flexBasis14%。
            var dt = new Date();  // 今日の日付オブジェクトを取得。
            var now = new Date(dt.getFullYear(), dt.getMonth(),1);  // 今月の1日のミリ秒を取得。
            var caldate = new Date(vars.y, vars.m-1,1);  // カレンダーの1日のミリ秒を取得。
            if (now > caldate) {  // 表示カレンダーの月が現在より過去のときのみ左矢印を表示させる。
                var node = nd._arrowflxI('\u00ab',"left_calendar");
                node.style.cursor = "pointer";  // マウスポインタの形状を変化させる。
                node.title = (vars.L10N)?"Newer":"翌月へ";
                return node;
            } else {
                return nd._arrowflxI(null,null);
            }
        },
        rightarrowflxI: function() {  // 右向き矢印のflexアイテム。flexBasis14%。
            var dt = new Date(2013,3,1);  // 最初の投稿月の日付オブジェクトを取得。
            var firstpost = new Date(dt.getFullYear(), dt.getMonth(),1);  // 今月の1日のミリ秒を取得。
            var caldate = new Date(vars.y, vars.m-1,1);  // カレンダーの1日のミリ秒を取得。
            if (firstpost > caldate) {  // 表示カレンダーの月が初投稿より未来のときのみ右矢印を表示させる。
                return nd._arrowflxI(null,null);
            } else {
                var node = nd._arrowflxI('\u00bb',"right_calendar");
                node.style.cursor = "pointer";  // マウスポインタの形状を変化させる。
                node.title = (vars.L10N)?"Older":"前月へ";
                return node;
            }
        },        
        titleflxI: function(title) {
            var node = eh.createElem("div");  // flexアイテムになるdiv要素を生成。
            node.textContent = title;
            node.id = "title_calendar";
            node.style.flex = "1 0 72%";
            node.style.textAlign = "center";
            node.style.cursor = "pointer";  // マウスポインタの形状を変化させる。
            node.title = (vars.L10N)?"Switching between published and updated":"公開日と更新日を切り替える";
            return node;
        }
    };  // end of nd
    var eh = {  // イベントハンドラオブジェクト。
        _node: null,  // 投稿一覧を表示しているノード。
        _timer: null,  // ノードのハイライトを消すタイマーID。
        _rgbaC: null, // 背景色。styleオブジェクトで取得すると参照渡しになってしまう。
        _fontC: null,  // 文字色。
        mouseDown: function(e) {  // 要素をクリックしたときのイベントを受け取る関数。
            var target = e.target;  // イベントを発生したオブジェクト。
            switch (target.className) {
                case "post":  // 投稿がある日のとき
                    if (eh._node) {  // 投稿一覧を表示させているノードがあるとき。
                        eh._node.style.backgroundColor = eh._rgbaC; // そのノードの背景色を元に戻す。
                        eh._node.style.textDecoration = null;  // 文字の下線を消す。
                    }
                    eh._node = target;  // 投稿を表示させるノードを新たに取得。
                    var elem = document.getElementById(vars.dataPostsID);  // idから追加する対象の要素を取得。
                    if (vars.L10N) {
                        elem.textContent = vars.order + ": " + vars.enM[vars.m-1] + " " + target.textContent;
                    } else {
                        var order = (vars.order=="published")?"公開":"更新";
                        elem.textContent = vars.m + "月" + target.textContent + "日(" + vars.days[target.s] + ") " + order;
                    }
                    elem.style.paddingTop = "5px";
                    vars.dic[target.textContent].forEach(function(e) {
                        elem.appendChild(nd.postNode(e));
                    });                  
                    break;
                case "nopost":  // 投稿がない日のとき
                    var elem = document.getElementById(vars.dataPostsID);  // idから追加する対象の要素を取得。
                    elem.textContent = null;  // 表示を消す。
                    if (eh._node) {  // 投稿一覧を表示させているノードがあるとき。
                        eh._node.style.textDecoration = null;  // 文字の下線を消す。
                        eh._node.style.backgroundColor = eh._rgbaC; // そのノードの背景色を元に戻す。
                        eh._node = null;  // 取得しているノードを消去。
                    }
                    break;
                default:
                    var dt;
                    switch (target.id) {
                        case "title_calendar":  // 公開日と更新日を切り替える。
                            vars.order = (vars.order=="published")?"updated":"published";
                            dt = new Date(vars.y, vars.m-1, 1);
                            cal.getFeed(dt);
                            break;
                        case "left_calendar":
                            dt = new Date(vars.y,vars.m,1);  // 翌月の日付オブジェクト。
                            cal.getFeed(dt);
                            break;
                        case "right_calendar":  
                            dt = new Date(vars.y,vars.m-2,1);  // 前月の日付オブジェクト。
                            cal.getFeed(dt);
                            break;
                    }
            }
        },
        mouseOver: function(e) {
            var target = e.target;  // イベントを発生したオブジェクト。
            if (target.className=="post") {  // 投稿がある日のとき
                target.style.textDecoration = "underline";  // 文字に下線をつける。
                eh._fontC = window.getComputedStyle(e.target, '').color;  // 文字色を取得。
                target.style.color = "#33aaff";  // 文字色を変える。
                eh._rgbaC = window.getComputedStyle(e.target, '').backgroundColor;  // 背景色のRGBAを取得。
                var mc = /\d+\.\d+/.exec(eh._rgbaC);  // 透明度を正規表現で取得。
                if (mc) {  // 取得できた時。
                    var alpha = Number(mc[0]);  // 透明度を取得。
                    var alpha2 = alpha + 0.3;  // 透明度を加える。
                    alpha2 = (alpha2>1)?1:alpha2;  // 透明度が1より大きければ1にする。
                    target.style.backgroundColor = eh._rgbaC.replace(alpha,alpha2); // 透明度を変更する。                    
                }
            } else {
                switch (target.id) {
                    case "title_calendar":
                    case "left_calendar":
                    case "right_calendar":
                        target.style.textDecoration = "underline";  // 文字に下線をつける。
                        eh._fontC = window.getComputedStyle(e.target, '').color;  // 文字色を取得。
                        target.style.color = "#33aaff";  // 文字色を変える。 
                        break;
                }
            }
        },
        mouseOut: function(e) {
            var target = e.target;  // イベントを発生したオブジェクト。
            if (target.className=="post") {  // 投稿がある日のとき
                target.style.color = eh._fontC;  // 変更前の文字色に戻す。
                if (target!==eh._node) {  // そのノードの投稿一覧を表示させていないとき。
                    target.style.textDecoration = null;  // 文字の下線を消す。
                    target.style.backgroundColor = eh._rgbaC; // 背景色を元に戻す。
                }
            } else {
                switch (target.id) {
                    case "title_calendar":
                    case "left_calendar":
                    case "right_calendar":
                        target.style.textDecoration = null;  // 文字の下線を消す。 
                        target.style.color = eh._fontC;  // 変更前の文字色に戻す。                             
                }
            }            
        },
        createElem: function(tag){  // tagの要素を作成して返す。
            return document.createElement(tag); 
        }       
    };  // end of eh
    return cl;  // グローバルスコープにオブジェクトを出す。
}();
Calendar5_Blogger.all("calendar5_blogger");  // idがcalendar_bloggerの要素にカレンダーを表示させる。
