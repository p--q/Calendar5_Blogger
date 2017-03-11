// Calendar5_Bloggerモジュール
var Calendar5_Blogger = Calendar5_Blogger || function() {
    var cl = {
        defaults : {},  // デフォルト値を入れるオブジェクト。    		
        callback: {  // コールバック関数。
            getArticles: function(json) {  // 指定した月のフィードを受け取る。
                Array.prototype.push.apply(g.posts, json.feed.entry);// 投稿のフィードデータを配列に追加。
                if (json.feed.openSearch$totalResults.$t < g.max) {  // 取得投稿数がg.maxより小さい時はすべて取得できたと考える。
                    var re = /\d\d(?=T\d\d:\d\d:\d\d\.\d\d\d.\d\d:\d\d)/i;  //  フィードの日時データから日を取得するための正規表現パターン。
                    g.posts.forEach(function(e){  // 投稿のフィードデータについて
                        var d = Number(re.exec(e[g.order].$t));  // 投稿の日を取得。
                        g.dic[d] = g.dic[d] || [];  // 辞書の値の配列を初期化する。
                        var url = (e.media$thumbnail)?e.media$thumbnail.url:null;  // サムネイルのurl。
                        g.dic[d].push([e.link[4].href, e.link[4].title, url]);  // 辞書の値の配列に[投稿のURL, 投稿タイトル, サムネイルのURL]の配列を入れて2次元配列にする。
                        }
                    );
                    var m = cal.createCalendar();  // フィードデータからカレンダーを作成する。
                    m.addEventListener( 'mousedown', eh.mouseDown, false );  // カレンダーのflexコンテナでイベントバブリングを受け取る。マウスが要素をクリックしたとき。
                    m.addEventListener( 'mouseover', eh.mouseOver, false );  // マウスポインタが要素に入った時。
                    m.addEventListener( 'mouseout', eh.mouseOut, false );  // マウスポインタが要素から出た時。
                    g.elem.textContent = null;  // 追加する対象の要素の子ノードを消去する。
                    g.elem.appendChild(m);  // 追加する対象の要素の子ノードにカレンダーのflexコンテナを追加。
                    g.elem.appendChild(pt.elem);  // 投稿リストを表示するノードを追加。
                    if (!g.d&&g.mc) {pt.expandPostList()}; // g.dがnullかつアイテムページの時のみアイテムページの投稿リストを展開する。
                } else {  // 未取得のフィードを再取得する。最新の投稿が先頭に来る。
                    var m = /(\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d)\.\d\d\d(.\d\d:\d\d)/i.exec(json.feed.entry[json.feed.entry.length-1][g.order].$t);  // フィードの最終投稿（最古）データの日時を取得。
                    var dt = new Date;  // 日付オブジェクトを生成。
                    dt.setTime(new Date(m[1] + m[2]).getTime() - 1 * 1000);  // 最古の投稿の日時より1秒早めるた日時を取得。ミリ秒に変換して計算。
                    if (g.m==dt.getMonth()+1) {  // 1秒早めても同じ月ならば
                        var max = g.y + "-" + fd.fm(g.m) + "-" + cal.fd.fm(dt.getDate()) + "T" + fd.fm(dt.getHours()) + ":" + fd.fm(dt.getMinutes()) + ":" + fd.fm(dt.getSeconds()) + "%2B09:00";  // フィード取得のための最新日時を作成。
                        fd.createURL(max);  // フィード取得のURLを作成。                       
                    }
                }  
            },
        },
        all: function(elemID) {  // ここから開始する。
            g.elem = document.getElementById(elemID);  // idから追加する対象の要素を取得。
            if (g.elem) {  // 追加対象の要素が存在するとき
                g.L10N = (/.jp$/i.test(location.hostname))?false:true;  // jpドメイン以外のときフラグを立てる。
                g.init();  // 日付オブジェクトからカレンダーのデータを作り直す。
                cal.init();  // カレンダーのノードの不変部分を作成しておく。
                pt.init();  // 投稿リストのノードの不変部分を作成しておく。
                var dt; // 日付オブジェクト。
                g.mc = /\/(20\d\d)\/([01]\d)\//.exec(document.URL);  // URLから年と月を正規表現で得る。
                if (g.mc) {  // URLから年と月を取得できた時。つまりアイテムページの時。
                    var m = Number(g.mc[2]) - 1;  // 月ひく1を取得
                    dt = new Date(g.mc[1],m,1);  // 投稿月の日付オブジェクトを取得。
                } else {  // アイテムページ以外の時は今日の日付を取得。
                    dt = new Date();
                };
                fd.getFeed(dt);
            } 
        }        
    };  // end of cl
    var g = {  // モジュール内の"グローバル"変数。
        max: 150,  // Bloggerのフィードで取得できる最大投稿数を設定。
        order: "published",  // publishedかupdatedが入る。
        elem: null,  // 置換するdiv要素。
        init: function() {
        	g.days = (g.L10N)?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]: ["日","月","火","水","木","金","土"];  // 曜日の配列。
        },
        init_d: function (dt) {  // 日付オブジェクトからカレンダーのデータを作り直す。
            g.y = dt.getFullYear();  // 表示カレンダーの年を取得。
            g.m = dt.getMonth() + 1;  // 表示カレンダーの月を取得。
            g.em = new Date(g.y, g.m, 0).getDate();  // 表示カレンダーの末日を取得。
            g.posts = [];  // フィードデータをリセットする。投稿のフィードデータを収納する配列。
            g.dic = {};  // 投稿データをリセットする。キーを日、値を投稿のURLと投稿タイトルの配列の配列、とする辞書。
        },
        L10N: false,  // 日本語以外かのフラグ。
        enM: ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sept.","Oct.","Nov.","Dec."],
        mc: false,  // アイテムページの年[1]と月[2]の配列。
        d: null  // アイテムページの日付を取得。
    };  // end of g
    var cal = {  // カレンダーを作成するオブジェクト。
        _holidayC: "rgb(255, 0, 0)",  // 休日の文字色
        _SatC: "rgb(0, 51, 255)",  //  土曜日の文字色 
        _nodes: null,
        init: function() {  // カレンダーのノードの不変部分の取得。
        	cal._nodes = cal._createNodes();
        },
        _createNodes: function() {  // カレンダーのノードの不変部分を作成しておく。
        	var m = nd.createElem("div");
        	m.setAttribute("style","display:flex;flex-wrap:wrap;");
        	var a = nd.createElem("div");
        	a.setAttribute("style","flex:0 0 14%;text-align:center;");
        	m.appendChild(a);
        	var t =  nd.createElem("div");
        	t.setAttribute("style","flex:1 0 72%;text-align:center;cursor:pointer;")
        	m.appendChild(t);
        	m.appendChild(a.cloneNode(true));
        	var d = nd.createElem("div");
        	d.setAttribute("style","flex:1 0 14%;text-align:center;");
        	g.days.forEach(function(e,i){  // 1行目に曜日を表示させる。2番目の引数は配列のインデックス。
        		var node = d.cloneNode(true);
        		node.appendChild(nd.createTxt(g.days[i]));
                cal._getDayC(node,i);  // 曜日の色をつける。
                if (g.L10N) {
                    node.style.fontSize = "80%";  // 英語表記では1行に収まらないのでフォントサイズを縮小。
                }
                m.appendChild(node);  // カレンダーのflexコンテナに追加。
            });
        	for (i=0;i<42;i++) {  // カレンダーの5行目まで作成。
        		cal._createDateNodes(m,d);
        	}
        	d.style.display = "none";  // カレンダーの6行目はデフォルトでは表示させない。
        	for (i=0;i<7;i++) {
        		cal._createDateNodes(m,d);
        	}
        	return m;
        },
        _createDateNodes: function(m,d) {
    		var node = d.cloneNode(true);
    		cal._getDayC(node,i%7);  // 曜日の色をつける。
    		node.className = "nopost";
    		m.appendChild(node); 
        },
        createCalendar:  function() {  // カレンダーのHTML要素を作成。 
        	var m = cal._nodes.cloneNode(true);
        	var dt = new Date();  // 今日の日付オブジェクトを取得。
        	var now = new Date(dt.getFullYear(), dt.getMonth(),1).getTime();  // 今月の1日のミリ秒を取得。
        	var caldt = new Date(g.y, g.m-1,1);
        	var caldate = caldt.getTime();  // カレンダーの1日のミリ秒を取得。
        	if (now > caldate) {  // 表示カレンダーの月が現在より過去のときのみ左矢印を表示させる。
        		m.childNodes[0].appendChild(nd.createTxt('\u00ab'));
        		m.childNodes[0].style.cursor = "pointer";  // マウスポインタの形状を変化させる。
        		m.childNodes[0].title = (g.L10N)?"Newer":"翌月へ";
        		m.childNodes[0].id = "left_calendar";
        	}
            var titleText =  (g.L10N)?((g.order=="published")?"":"updated"):((g.order=="published")?"":"更新");
            titleText = (g.L10N)?g.enM[g.m-1] + " " + g.y + " " + titleText:g.y + "年" + g.m + "月" + titleText;
            m.childNodes[1].appendChild(nd.createTxt(titleText));
            m.childNodes[1].title = (g.L10N)?"Switching between published and updated":"公開日と更新日を切り替える";
            m.childNodes[1].id = "title_calendar";
            dt = new Date(cl.defaults.StartYear,cl.defaults.StartMonth-1,1);  // 最初の投稿月の日付オブジェクトを取得。
            var firstpost = new Date(dt.getFullYear(), dt.getMonth(),1).getTime();  // 1日のミリ秒を取得。
            if (firstpost < caldate) {  // 表示カレンダーの月が初投稿月より未来のときのみ右矢印を表示させる。
        		m.childNodes[2].appendChild(nd.createTxt('\u00bb'));
        		m.childNodes[2].style.cursor = "pointer";  // マウスポインタの形状を変化させる。
        		m.childNodes[2].title = (g.L10N)?"Older":"前月へ";   
        		m.childNodes[2].id = "right_calendar";
            }
            var day =  caldt.getDay();  // 1日の曜日を取得。日曜日は0、土曜日は6になる。
            var c = 9 + day;  // 1日の要素番号−１。
            pt.dic = {};  // 日付、とカレンダーノードの辞書をリセットする。
            for(var i = 1; i < 1+g.em; i++) { // 1日から末日まで。
            	var d = m.childNodes[c+i];
            	d.appendChild(nd.createTxt(i));
            	var t = "";  // nullはundefinedと表示されるのでだめ。
                if (i in g.dic) {  // 辞書のキーに日があるとき
                	pt.dic[i] = d;  // アイテムページで投稿リストを展開するための辞書。keyが日付、値はカレンダーのノード。 
                    g.dic[i].forEach(function(arr) {  // title属性に投稿タイトルのみ入れる。
                    	t += (t)?"\n" + "\u30fb" + arr[1]:"\u30fb" + arr[1];
                    });
                    d.title = t;
                    d.className = "post"; 
                    d.setAttribute("style",d.style.cssText + "background-color:rgba(128,128,128,.4);border-radius:50%;cursor:pointer;");
                } 
                cal._getHolidayC(d,i);  // 祝日に色をつける。        	
            }
           if (day+g.em>35) {  // 最終行の表示。
               for (var i = 45;i<52 ;i++) {
            	   m.childNodes[i].style.display = null;
               }          	   
           }
           return m;
        },
        _getHolidayC: function(node,i) {  // 祝日に色をつける。JSON文字列はhttps://p--q.blogspot.jp/2016/12/blogger10json.htmlを作成。
            // キーは年、値は二元元配列。1次が月数、二次が祝日の配列。
        	var holidays = {"2013":[[1,14],[11],[20],[29],[3,4,5,6],[],[15],[],[16,23],[14],[3,4,23],[23]],"2014":[[1,13],[11],[21],[29],[3,4,5,6],[],[21],[],[15,23],[13],[3,23,24],[23]],"2015":[[1,12],[11],[21],[29],[3,4,5,6],[],[20],[],[21,22,23],[12],[3,23],[23]],"2016":[[1,11],[11],[20,21],[29],[3,4,5],[],[18],[11],[19,22],[10],[3,23],[23]],"2017":[[1,2,9],[11],[20],[29],[3,4,5],[],[17],[11],[18,23],[9],[3,23],[23]],"2018":[[1,8],[11,12],[21],[29,30],[3,4,5],[],[16],[11],[17,23,24],[8],[3,23],[23,24]],"2019":[[1,14],[11],[21],[29],[3,4,5,6],[],[15],[11,12],[16,23],[14],[3,4,23],[23]],"2020":[[1,13],[11],[20],[29],[3,4,5,6],[],[20],[11],[21,22],[12],[3,23],[23]],"2021":[[1,11],[11],[20],[29],[3,4,5],[],[19],[11],[20,23],[11],[3,23],[23]],"2022":[[1,10],[11],[21],[29],[3,4,5],[],[18],[11],[19,23],[10],[3,23],[23]],"2023":[[1,9],[11],[21],[29],[3,4,5],[],[17],[11],[18,23],[9],[3,23],[23]],"2024":[[1,8],[11,12],[20],[29],[3,4,5,6],[],[15],[11,12],[16,22,23],[14],[3,4,23],[23]],"2025":[[1,13],[11],[20],[29],[3,4,5,6],[],[21],[11],[15,23],[13],[3,23,24],[23]],"2026":[[1,12],[11],[20],[29],[3,4,5,6],[],[20],[11],[21,22,23],[12],[3,23],[23]],"2027":[[1,11],[11],[21,22],[29],[3,4,5],[],[19],[11],[20,23],[11],[3,23],[23]],"2028":[[1,10],[11],[20],[29],[3,4,5],[],[17],[11],[18,22],[9],[3,23],[23]],"2029":[[1,8],[11,12],[20],[29,30],[3,4,5],[],[16],[11],[17,23,24],[8],[3,23],[23,24]],"2030":[[1,14],[11],[20],[29],[3,4,5,6],[],[15],[11,12],[16,23],[14],[3,4,23],[23]]};
        	var arr = holidays[g.y][g.m-1];  // 祝日の配列を取得。
            if (arr.indexOf(i) != -1) {  // 祝日配列に日付があるとき。in演算子はインデックスの有無の確認をするだけ。
                node.style.color = cal._holidayC;
            }
        },
        _getDayC: function(node,r){  // 曜日の色をつける。オブジェクトの参照渡しを利用。
        	node.setAttribute("data-remainder",r);  // ノードに曜日番号を付ける。data-から始まるプロパティにしないとNode.cloneNode(true)で消えてしまう。
            if (r==0) {  // 日曜日のとき
                node.style.color = cal._holidayC;
            } else if (r==6) {  // 土曜日のとき
                node.style.color = cal._SatC;
            }            
        }
    };  // end of cal
    var fd = {
        _writeScript: function(url) {  // スクリプト注入。
            var ws = nd.createElem('script');
            ws.type = 'text/javascript';
            ws.src = url;
            document.getElementsByTagName('head')[0].appendChild(ws);
        },    
        createURL: function(max) {  // フィードを取得するためのURLを作成。
            var url = "/feeds/posts/summary?alt=json-in-script&orderby=" + g.order + "&" + g.order + "-min=" + g.y + "-" + fd.fm(g.m) + "-01T00:00:00%2B09:00&" + g.order + "-max=" + max;  // 1日0時0分0秒からmaxの日時までの投稿フィードを取得。データは最新の投稿から返ってくる。
            url += "&callback=Calendar5_Blogger.callback.getArticles&max-results=" + g.max;  // コールバック関数と最大取得投稿数を設定。
            fd._writeScript(url);  // スクリプト注入でフィードを取得。。
        },        
        fm: function(m) {  // 数値を2桁の固定長にする。
            return ("0" + m).slice(-2);
        },
        getFeed: function(dt) {  // 日付オブジェクトからフィードを得てカレンダーを作成する。
            g.init_d(dt);  // 日付オブジェクトからカレンダーのデータを作成。
            var max = g.y + "-" + fd.fm(g.m) + "-" + fd.fm(g.em) + "T23:59:59%2B09:00";  // 表示カレンダーの最終日23時59分59秒までのフィードを得るための日時を作成。
            fd.createURL(max);  // フィードを取得するためのURLを作成。            
        },
        removeParam: function(thisUrl) {
        	return thisUrl.replace(/\?m=[01][&\?]/,"?").replace(/[&\?]m=[01]/,"");  // ウェブバージョンとモバイルサイトのパラメータを削除。
        }
    };  // end of fd
    var nd = {  // ノード関連。
		createElem: function(tag) {  // tagの要素を作成して返す関数。
			return document.createElement(tag); 
		},
		createTxt: function(txt) {  // テキストノードを返す関数。
			return document.createTextNode(txt);
		},
    };  // end of nd   
    var pt = {  // その日の投稿リストを表示
		dic: {},  // keyが日付、値がカレンダーのノードの辞書。
		elem: null,  // 投稿リストを表示させるノード。
		_nodes: null,  // 投稿リストのノードの不変部分
		init: function() {
			pt._nodes = pt._createNodes();  // 投稿リストのノードの不変部分の取得。
			pt.elem = nd.createElem("div");  // 投稿リストの年月日を表示する要素の作成。
			pt.elem.setAttribute("style","display:flex;flex-direction:column;padding-top:5px;text-align:center;");
		},
		_createNodes: function() {  // 投稿リストのノードの不変部分を作成しておく。
			var p = nd.createElem("div");	
			p.setAttribute("style","border-top:dashed 1px rgba(128,128,128,.5);padding-top:5px;");
			p.appendChild(nd.createElem("div"));
			p.childNodes[0].setAttribute("style","float:left;padding:0 5px 5px 0;");
			p.childNodes[0].appendChild(nd.createElem("a"));
			p.childNodes[0].childNodes[0].target = "_blank";
			p.childNodes[0].childNodes[0].appendChild(nd.createElem("img"));
			p.appendChild(nd.createElem("div"));
			p.childNodes[1].setAttribute("style","text-align:left;");
			p.childNodes[1].appendChild(nd.createElem("a"));
			p.childNodes[1].childNodes[0].target = "_blank";
			return p;
		},
		_postNode: function(arr) {  // 引数は[投稿のURL, 投稿タイトル, サムネイルのURL]の配列。
			var p = pt._nodes.cloneNode(true);
			if (arr[2]) {  // サムネイルがあるとき
				p.childNodes[0].childNodes[0].href = arr[0];  // 投稿のurlを取得。
				p.childNodes[0].childNodes[0].childNodes[0].src = arr[2];  // サムネイル画像のurlを取得。
			} else {
				p.childNodes[0].setAttribute("style","display:none");  // サムネイルがないときはノードを非表示にする。
			}
			p.childNodes[1].childNodes[0].href = arr[0];  // 投稿のurlを取得。 
			p.childNodes[1].childNodes[0].appendChild(nd.createTxt(arr[1]))  // 投稿タイトルを取得。
			return p;
		},
		createPostList: function(target,j) {  // 投稿リストのタイトルを作成。2番目の引数はハイライトする投稿の要素番号。
            if (g.L10N) {
                pt.elem.textContent = g.order + ": " + g.enM[g.m-1] + " " + target.textContent + " " + g.y;
            } else {
                var order = (g.order=="published")?"公開":"更新";
                pt.elem.textContent = g.y + "/" + g.m + "/" + target.textContent + "(" + g.days[target.getAttribute("data-remainder")] + ") " + order;
            }
            g.dic[target.textContent].forEach(function(e,i) {  // 選択している日付の投稿リストを作成。
            	pt.elem.appendChild(pt._postNode(e));
            	if (i==j) {  // ハイライトする投稿のとき
            		var p = pt.elem.lastChild;  // ハイライトする投稿のリストのノードを取得。
            		p.setAttribute("style",p.style.cssText + "background-color:#eee;border:solid 1px #dddddd;border-radius:5px;pointer-events:none;");  // アンカータグのリンクも無効にする。
            	}
            });    			
		},
		expandPostList: function() {  // 投稿リストを展開して現在のアイテムページの投稿のリストのノードをハイライトする。
			var thisUrl = fd.removeParam(document.URL);  // URLからパラメータを除去する。
			var reF = /\w+\.html/  // htmlファイル名を抽出する正規表現パターン。
			var keys = Object.keys(pt.dic);  // 投稿のある日付の配列を取得。
			for (i=0;i<keys.length;i++) {  // forEachメソッドでは途中で抜けれないのでfor文を使う。
				key = keys[i];  // 投稿のある日付を取得。
				g.dic[key].forEach(function(arr,j) {  // 日付の[投稿のURL, 投稿タイトル, サムネイルのURL]の配列の配列の各配列について。
					if (reF.exec(thisUrl)[0] == reF.exec(arr[0])[0]) {  // 投稿のhtmlファイル名が一致するとき。フィードは.comで返ってきてTDLが異なるのでURL直接は比較できない。
						g.d = key;  // アイテムページの日付を記録する。
		            	eh.node =  pt.dic[key];  // カレンダーの日付のノードを取得。
		            	pt.createPostList(eh.node,j);  // 投稿リストの作成。ハイライトする投稿の要素番号も渡す。
		            	return;  // for文を抜ける。
		            }
				});
			}	
		}
    };  // end of pt
    var eh = {  // イベントハンドラオブジェクト。
        node: null,  // 投稿一覧を表示している日付のノード。
        _timer: null,  // ノードのハイライトを消すタイマーID。
        _rgbaC: null, // 背景色。styleオブジェクトで取得すると参照渡しになってしまう。
        _fontC: null,  // 文字色。
        mouseDown: function(e) {  // 要素をクリックしたときのイベントを受け取る関数。
            var target = e.target;  // イベントを発生したオブジェクト。
            switch (target.className) {
                case "post":  // 投稿がある日のとき
                    if (eh.node) {  // 投稿一覧を表示させているノードがあるとき。
                        eh.node.style.backgroundColor = eh._rgbaC; // そのノードの背景色を元に戻す。
                        eh.node.style.textDecoration = null;  // 文字の下線を消す。
                    }
                    eh.node = target;  // 投稿を表示させるノードを新たに取得。
                    var flag = false;  // ハイライトつけて展開するかのフラグ。
                    if (g.mc) {  // アイテムページの時
                    	if (g.mc[1] == g.y && g.mc[2] == g.m && target.textContent == g.d) {flag = true;};  // targetがアイテムページの投稿の年月日と一致するときflagを立てる。 
                    } 
                    if (flag) {
                    	pt.expandPostList();  // ハイライト付きで投稿リストを展開する。
                    } else {
                    	pt.createPostList(target,null);  // ハイライトなしで投稿リストを展開する。
                    }
                    break;
                case "nopost":  // 投稿がない日のとき
                    pt.elem.textContent = null;  // 表示を消す。
                    if (eh.node) {  // 投稿一覧を表示させているノードがあるとき。
                        eh.node.style.textDecoration = null;  // 文字の下線を消す。
                        eh.node.style.backgroundColor = eh._rgbaC; // そのノードの背景色を元に戻す。
                        eh.node = null;  // 取得しているノードを消去。
                    }
                    break;
                default:
                    switch (target.id) {
                        case "title_calendar":  // 公開日と更新日を切り替える。
                            g.order = (g.order=="published")?"updated":"published";
                            var dt = new Date(g.y, g.m-1, 1);
                            fd.getFeed(dt);
                            break;
                        case "left_calendar":
                        	target.style.pointerEvents = "none";  // 連続クリックできないようにする。
                            var dt = new Date(g.y,g.m,1);  // 翌月の日付オブジェクト。
                            fd.getFeed(dt);
                            break;
                        case "right_calendar":  
                        	target.style.pointerEvents = "none";  // 連続クリックできないようにする。
                            var dt = new Date(g.y,g.m-2,1);  // 前月の日付オブジェクト。
                            fd.getFeed(dt);
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
                if (target!==eh.node) {  // そのノードの投稿一覧を表示させていないとき。
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
        }   
    };  // end of eh
    return cl;  // グローバルスコープにオブジェクトを出す。
}();
Calendar5_Blogger.defaults["StartYear"] = 2013; // 遡る最大年。
Calendar5_Blogger.defaults["StartMonth"] = 3; //  遡る最大月。
Calendar5_Blogger.all("calendar5_blogger");  // idがcalendar5_bloggerの要素にカレンダーを表示させる。
