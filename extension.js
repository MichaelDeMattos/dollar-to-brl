const {St, Clutter, Soup} = imports.gi;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

let panelButton;
let _httpSession;
let _dollarQuatation;

panelButton = new St.Bin({
    style_class : "panel-button",
});

// Requests API Dollar to Real
function load_json_async(url) {
    if (_httpSession === undefined) {
        _httpSession = new Soup.Session();
        _httpSession.user_agent = "https://okubo.com.br";
    } 
        else {
        _httpSession.abort();
    }

    let message = Soup.form_request_new_from_hash('GET', "http://economia.awesomeapi.com.br/json/last/USD-BRL", {});
    
    _httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) {
        
        try {
            if (!message.response_body.data) {
                let panelButtonText = new St.Label({
                    text : "Not content body",
                    y_align: Clutter.ActorAlign.CENTER,
                });
                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;
            }

            let jp = JSON.parse(message.response_body.data);
            _dollarQuatation = jp["USDBRL"]["bid"];
            _dollarQuatation = _dollarQuatation.split(".");
            _dollarQuatation = _dollarQuatation[0] + "," + _dollarQuatation[1].substring(0,3);
            
            let panelButtonText = new St.Label({
                text : "R$: " + _dollarQuatation,
                y_align: Clutter.ActorAlign.CENTER,
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;

        } catch (e) {
            let panelButtonText = new St.Label({
                text : "Request error",
                y_align: Clutter.ActorAlign.CENTER,
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;
        }
    }));
    return;
}

// Interval to execute function
function setInterval(func, delay) {
    const wrappedFunc = () => {
        return func.apply(this) || true;
    };
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, wrappedFunc);
}

// Start application
function init(){
    load_json_async();
    setInterval(load_json_async, 30000);
}

// Add the button to the panel
function enable () {
    Main.panel._centerBox.insert_child_at_index(panelButton, 0);
}

// Remove the added button from panel
function disable () {
    Main.panel._centerBox.remove_child(panelButton);
}
