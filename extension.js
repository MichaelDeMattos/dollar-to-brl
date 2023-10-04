'use strict';

const { St, Soup, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;

let panelButton;
let panelButtonText;
let sourceId = null;

// Start application
function init() {
    log(`Initializing ${Me.metadata.name}`);
}

// Add the button to the panel
function enable() {
    log(`Enabling ${Me.metadata.name}`);
    panelButton = new St.Bin({
        style_class: 'panel-button',
    });

    // Initial request to fetch the dollar API data
    handleRequestDollarAPI();
    Main.panel._centerBox.insert_child_at_index(panelButton, 0);

    // Schedule periodic updates
    sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        handleRequestDollarAPI();
        return GLib.SOURCE_CONTINUE;
    });
}

// Remove the added button from the panel
function disable() {
    log(`Disabling ${Me.metadata.name}`);
    Main.panel._centerBox.remove_child(panelButton);

    if (panelButton) {
        panelButton.destroy();
        panelButton = null;
    }

    if (sourceId) {
        GLib.Source.remove(sourceId);
        sourceId = null;
    }
}

// Handle Requests API Dollar
async function handleRequestDollarAPI() {
    try {
        // Create a new Soup Session if it doesn't exist
        const session = new Soup.Session({ timeout: 10 });

        // Create the Soup request
        const message = Soup.Message.new_from_uri('https://economia.awesomeapi.com.br/last/USD-BRL');
        message.method = Soup.Method.GET;

        // Send Soup request to API Server
        await session.send_message(message);

        if (message.status_code === Soup.Status.OK) {
            const responseBody = message.response_body.data;
            const bodyResponse = JSON.parse(responseBody);

            const upDown = parseFloat(bodyResponse.USDBRL.varBid);
            const upDownIcon = upDown > 0 ? '⬆' : '⬇';
            const dollarQuotation = bodyResponse.USDBRL.bid.replace('.', ',');

            // Set text in Widget
            panelButtonText = new St.Label({
                text: `(USD: 1,00) = (BRL: ${dollarQuotation}) ${upDownIcon}`,
                y_align: St.Align.MIDDLE,
            });
            panelButton.set_child(panelButtonText);
        }
    } catch (error) {
        log(`Error in handleRequestDollarAPI: ${error}`);
        panelButtonText = new St.Label({
            text: '(Error fetching data)',
            y_align: St.Align.MIDDLE,
        });
        panelButton.set_child(panelButtonText);
    }
}
