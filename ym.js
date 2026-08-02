(function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})
    (window, document, "script", "#", "ym");

window.log_ym = function (event_name) {
    window.event_sent = true;
    for (var key in window.YM_IDS) {
        window.ym(window.YM_IDS[key], 'reachGoal', event_name, {
            title: window.YM_TITLE,
            params: {
                api_type: window.API_TYPE,
            }
        });
    }
};

window.dataLayer = window.dataLayer || [];


window.log_ym_params = function (event_name, params) {
    window.event_sent = true;
    params = JSON.parse(params);
    params.api_type = window.API_TYPE;

    for (var key in window.YM_IDS) {
        window.ym(window.YM_IDS[key], 'reachGoal', event_name, {
            title: window.YM_TITLE,
            params: params
        });
    }
};

window.push_ecommerce = function (data_json) {
    var params = JSON.parse(data_json);
    window.dataLayer.push(
        {
            "ecommerce": params
        }
    );
};

for (var key in window.YM_IDS) {
    ym(window.YM_IDS[key], "init", {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        ecommerce: true,
        params: {
            api_type: window.API_TYPE,
        }
    });

    ym(window.YM_IDS[key], 'hit', window.location.protocol + '//' + window.location.host + window.location.pathname, {
        title: window.YM_TITLE,
        params: {
            api_type: window.API_TYPE,
        }
    });
    ym(window.YM_IDS[key], 'reachGoal', 'page_open', {
        title: window.YM_TITLE,
        params: {
            api_type: window.API_TYPE,
        }
    });
}

setTimeout((event) => {
    if (!window.event_sent) {
        window.log_ym("long_loading")
    }
}, 30000);