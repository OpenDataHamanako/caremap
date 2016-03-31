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

    // 介護の検索元データを取得
    var kaigoFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "介護施設") return true;
        });
    Array.prototype.push.apply(kaigoFeatures, _features);

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

        kaigoFeatures = kaigoFeatures.filter(filterfunc);
    }
    // 戻り値の作成
    var features = [];
    Array.prototype.push.apply(features, kaigoFeatures);
    newGeoJson.features = features;
    return newGeoJson;
};
