// 地図表示時の中心座標
var init_center_coords = [137.53162, 34.718471];

// map
var map;

// 保育施設JSON格納用オブジェクト
var nurseryFacilities = {};

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// マップサーバ一覧
var mapServerList = {
    'osm': {
        label: "OSM",
        source_type: "osm",
        source: new ol.source.OSM({
            url: "http://{a-c}.tile.osm.org/{z}/{x}/{y}.png",
            attributions: [
                ol.source.OSM.DATA_ATTRIBUTION,
                new ol.Attribution({ html: "'&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors" })
            ]
        })
    }

};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
    var screenHeight = $.mobile.getScreenHeight();
    var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
    var contentHeight = screenHeight - contentCurrentHeight;
    var navHeight = $("#nav1").outerHeight();
    $(".ui-content").height(contentHeight);
    $("#map").height(contentHeight - navHeight);
}

$(window).on("orientationchange", function() {
    resizeMapDiv();
    map.setTarget('null');
    map.setTarget('map');
});


$('#mainPage').on('pageshow', function() {
    resizeMapDiv();

    // 地図レイヤー定義
    var papamamap = new Papamamap();
    papamamap.viewCenter = init_center_coords;
    papamamap.generate(mapServerList['osm']);
    map = papamamap.map;

    // 施設の読み込みとレイヤーの追加
    papamamap.loadNurseryFacilitiesJson(function(data) {
        nurseryFacilities = data;
    }).then(function() {
        papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
    });

    // ポップアップ定義
    var popup = new ol.Overlay({
        element: $('#popup')
    });
    map.addOverlay(popup);

    // 背景地図一覧リストを設定する
    for (var item in mapServerList) {
        option = $('<option>').html(mapServerList[item].label).val(item);
        $('#changeBaseMap').append(option);
    }

    // 施設クリック時の挙動を定義
    map.on('click', function(evt) {
        if ($('#popup').is(':visible')) {
            // ポップアップを消す
            $('#popup').hide();
            return;
        }

        // クリック位置の施設情報を取得
        obj = map.forEachFeatureAtPixel(
            evt.pixel,
            function(feature, layer) {
                return { feature: feature, layer: layer };
            }
        );

        var feature = null;
        var layer = null;
        if (obj !== undefined) {
            feature = obj.feature;
            layer = obj.layer;
        }
        // クリックした場所に要素がなんにもない場合、クリック位置に地図の移動を行う
        if (feature === null) {
            coord = map.getCoordinateFromPixel(evt.pixel);
            view = map.getView();
            papamamap.animatedMove(coord[0], coord[1], false);
            view.setCenter(coord);
        }

        // クリックした場所に既に描いた同心円がある場合、円を消す
        if (feature && layer.get('name') === 'layerCircle' &&
            feature.getGeometry().getType() === "Polygon") {
            $('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
            clearCenterCircle();
        }

        // クリックした場所に施設がある場合、ポップアップダイアログを出力する
        if (feature && "Point" == feature.getGeometry().getType()) {
            var type = feature.get('種別') ? feature.get('種別') : feature.get('Type');
            if (type === undefined) {
                return;
            }
            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();
            popup.setPosition(coord);

            // タイトル部
            var title = papamamap.getPopupTitle(feature);
            $("#popup-title").html(title);

            // 内容部
            papamamap.animatedMove(coord[0], coord[1], false);
            var content = papamamap.getPopupContent(feature);
            $("#popup-content").html(content);
            $('#popup').show();
            view = map.getView();
            view.setCenter(coord);
        }
    });

    // 中心座標変更セレクトボックス操作イベント定義
    $('#moveTo').change(function() {
        // $('#markerTitle').hide();
        // $('#marker').hide();

        // 指定した最寄り駅に移動
        papamamap.moveToSelectItem(moveToList[$(this).val()]);

        // 地図上にマーカーを設定する
        var lon = moveToList[$(this).val()].lon;
        var lat = moveToList[$(this).val()].lat;
        var label = moveToList[$(this).val()].name;
        var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
        // Vienna marker
        drawMarker(pos, label);
    });

    // 歯科医院チェックボックスのイベント設定
    $('#cbDental').click(function() {
        papamamap.switchLayer(this.id, $(this).prop('checked'));
    });

    // 介護施設チェックボックスのイベント設定
    $('#cbKaigo').click(function() {
        papamamap.switchLayer(this.id, $(this).prop('checked'));
    });

    // 地域の居場所チェックボックスのイベント設定
    $('#cbIbasho').click(function() {
        papamamap.switchLayer(this.id, $(this).prop('checked'));
    });

    // 自治会チェックボックスのイベント定義
    $('#cbJichikai').click(function() {
        layer = map.getLayers().item(2);
        layer.setVisible($(this).prop('checked'));
    });

    // 病院チェックボックスのイベント定義
    $('#cbHospital').click(function() {

        papamamap.switchLayer(this.id, $(this).prop('checked'));
    });

    // いきいきサロンチェックボックスのイベント定義
    $('#cbSalon').click(function() {

        papamamap.switchLayer(this.id, $(this).prop('checked'));
    });

    // 現在地に移動するボタンのイベント定義
    $('#moveCurrentLocation').click(function(evt) {
        control = new MoveCurrentLocationControl();
        control.getCurrentPosition(
            function(pos) {
                var coordinate = ol.proj.transform(
                    [pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857');
                view = map.getView();
                view.setCenter(coordinate);
                drawMarker(coordinate, "現在地");
            },
            function(err) {
                alert('位置情報が取得できませんでした。');
            }
        );
    });

    // 半径セレクトボックスのイベント定義
    $('#changeCircleRadius').change(function(evt) {
        radius = $(this).val();
        if (radius === "") {
            clearCenterCircle();
            $('#cbDisplayCircle').prop('checked', false).checkboxradio('refresh');
            return;
        } else {
            $('#cbDisplayCircle').prop('checked', true).checkboxradio('refresh');
            drawCenterCircle(radius);
        }
    });

    // 円表示ボタンのイベント定義
    $('#cbDisplayCircle').click(function(evt) {
        radius = $('#changeCircleRadius').val();
        if ($('#cbDisplayCircle').prop('checked')) {
            drawCenterCircle(radius);
        } else {
            clearCenterCircle();
        }
    });

    // 地図変更選択ボックス操作時のイベント
    $('#changeBaseMap').change(function(evt) {
        if ($(this).val() === "背景") {
            $(this).val($(this).prop("selectedIndex", 1).val());
        }
        papamamap.changeMapServer(
            mapServerList[$(this).val()], $('#changeOpacity option:selected').val()
        );
    });

    // ポップアップを閉じるイベント
    $('#popup-closer').click(function(evt) {
        $('#popup').hide();
        return;
    });

    // ポップアップを閉じる
    $('.ol-popup').parent('div').click(function(evt) {
        $('#popup').hide();
        return;
    });

    // 親要素へのイベント伝播を停止する
    $('.ol-popup').click(function(evt) {
        evt.stopPropagation();
    });

    // 検索フィルターを有効にする
    $('#filterApply').click(function(evt) {
        // 条件作成処理
        conditions = [];
        kaigo = ibasho = dental = salon = hospital = false;
        // 介護施設
        if ($('#subtype option:selected').val() !== "") {
            conditions['subtype'] = $('#subtype option:selected').val();
            kaigo = true;
        }
        // フィルター適用時
        if (Object.keys(conditions).length > 0) {
            filter = new FacilityFilter();
            newGeoJson = filter.getFilteredFeaturesGeoJson(conditions, nurseryFacilities);
            papamamap.addNurseryFacilitiesLayer(newGeoJson);
            $('#btnFilter').css('background-color', '#3388cc');
        } else {
            papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
            $('#btnFilter').css('background-color', '#f6f6f6');
            kaigo = ibasho = dental = salon = hospital = true;
        }

        // レイヤー表示状態によって施設の表示を切り替える
        updateLayerStatus({ kaigo: kaigo, ibasho: ibasho, dental: dental, salon: salon, hospital: hospital });
    });

    // 絞込条件のリセット
    $('#filterReset').click(function(evt) {
        // チェックボックスをリセット
        $(".filtercb").each(function() {
            $(this).prop('checked', false).checkboxradio('refresh');
        });
        // セレクトボックスをリセット
        $('.filtersb').each(function() {
            $(this).selectmenu(); // これを実行しないと次の行でエラー発生
            $(this).val('').selectmenu('refresh');
        });
        // 施設情報をリセット
        papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
        $('#btnFilter').css('background-color', '#f6f6f6');

        // レイヤー表示状態によって施設の表示を切り替える
        updateLayerStatus({ kaigo: true, ibasho: true, dental: true, salon: true, hospital: true });
    });

    /**
     * レイヤー状態を切り替える
     *
     * @param  {[type]} checkObj [description]
     * @return {[type]}               [description]
     */
    function updateLayerStatus(checkObj) {
        papamamap.switchLayer($('#cbKaigo').prop('id'), checkObj.kaigo);
        papamamap.switchLayer($('#cbIbasho').prop('id'), checkObj.ibasho);
        papamamap.switchLayer($('#cbDental').prop('id'), checkObj.dental);
        papamamap.switchLayer($('#cbHospital').prop('id'), checkObj.hospital);
        papamamap.switchLayer($('#cbSalon').prop('id'), checkObj.salon);
        $('#cbKaigo').prop('checked', checkObj.kaigo).checkboxradio('refresh');
        $('#cbIbasho').prop('checked', checkObj.ibasho).checkboxradio('refresh');
        $('#cbDental').prop('checked', checkObj.dental).checkboxradio('refresh');
        $('#cbHospital').prop('checked', checkObj.hospital).checkboxradio('refresh');
        $('#cbSalon').prop('checked', checkObj.salon).checkboxradio('refresh');

    }

    /**
     * 円を描画する 関数内関数
     *
     * @param  {[type]} radius    [description]
     * @return {[type]}           [description]
     */
    function drawCenterCircle(radius) {
        if ($('#cbDisplayCircle').prop('checked')) {
            papamamap.drawCenterCircle(radius);

            $('#center_markerTitle').hide();
            $('#center_marker').hide();

            var center = map.getView().getCenter();
            var coordinate = center;
            var marker = new ol.Overlay({
                position: coordinate,
                positioning: 'center-center',
                element: $('#center_marker'),
                stopEvent: false
            });
            map.addOverlay(marker);

            // 地図マーカーラベル設定
            $('#center_markerTitle').html("");
            var markerTitle = new ol.Overlay({
                position: coordinate,
                element: $('#center_markerTitle')
            });
            map.addOverlay(markerTitle);
            $('#center_markerTitle').show();
            $('#center_marker').show();
        }
    }

    /**
     * 円を消す
     *
     * @return {[type]} [description]
     */
    function clearCenterCircle() {
        papamamap.clearCenterCircle();
        $('#center_markerTitle').hide();
        $('#center_marker').hide();
        $('#changeCircleRadius').val('').selectmenu('refresh');
        return;
    }

    /**
     * 指定座標にマーカーを設定する
     * @param  {[type]} coordinate [description]
     * @return {[type]}            [description]
     */
    function drawMarker(coordinate, label) {
        $('#markerTitle').hide();
        $('#marker').hide();
        var marker = new ol.Overlay({
            position: coordinate,
            positioning: 'center-center',
            element: $('#marker'),
            stopEvent: false
        });
        map.addOverlay(marker);

        // 地図マーカーラベル設定
        $('#markerTitle').html(label);
        var markerTitle = new ol.Overlay({
            position: coordinate,
            element: $('#markerTitle')
        });
        map.addOverlay(markerTitle);
        $('#markerTitle').show();
        $('#marker').show();
        return;
    }

});
