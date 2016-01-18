window.FacilityFilter = function () {
};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJsonを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function (conditions, nurseryFacilities)
{
    // 絞り込んだ条件に一致する施設を格納するgeoJsonを準備
    var newGeoJson = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };

    // 通所介護の検索元データを取得
    var ninkaFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "介護施設") return true;
        });
    Array.prototype.push.apply(ninkaFeatures, _features);

    // 認可外保育園の検索元データを取得
    var ninkagaiFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "地域の居場所") return true;
        });
    Array.prototype.push.apply(ninkagaiFeatures, _features);

    // 幼稚園の検索元データを取得
    var youchienFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "歯科医院") return true;
        });
    Array.prototype.push.apply(youchienFeatures, _features);

    // 幼稚園の検索元データを取得
    var hospitalFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "医院") return true;
        });
    Array.prototype.push.apply(hospitalFeatures, _features);

    // いきいきサロンの検索元データを取得
    var salonFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "いきいきサロン") return true;
        });
    Array.prototype.push.apply(salonFeatures, _features);

    // ----------------------------------------------------------------------
    // 介護施設向けフィルター
    // ----------------------------------------------------------------------
    if(conditions['subtype']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var subtype = conditions['subtype'];
                var type =  item.properties['SubType'];
                if(subtype == type) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // 戻り値の作成
    var features = [];
    Array.prototype.push.apply(features, ninkaFeatures);
    Array.prototype.push.apply(features, ninkagaiFeatures);
    Array.prototype.push.apply(features, youchienFeatures);
    Array.prototype.push.apply(features, hospitalFeatures);
    Array.prototype.push.apply(features, salonFeatures);
    newGeoJson.features = features;
    return newGeoJson;
};
