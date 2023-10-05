/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict';

const { St, Gio, Clutter, Soup, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

let panelButton;
let panelButtonText;
let session;
let dollarQuotation;
let sourceId = null;

// Start application
function init() {
    log(`initializing ${Me.metadata.name}`);
}

// Add the button to the panel
function enable() {
    log(`enabling ${Me.metadata.name}`);
    panelButton = new St.Bin({
        style_class: "panel-button",
    });

    handle_request_dollar_api();
    Main.panel._centerBox.insert_child_at_index(panelButton, 0);
    sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        handle_request_dollar_api();
        return GLib.SOURCE_CONTINUE;
    });
}

// Remove the added button from panel
function disable() {
    log(`disabling ${Me.metadata.name}`);
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
async function handle_request_dollar_api() {
    let upDown = null;
    let upDownIcon = null;

    try {
        // Create a new Soup Session
        if (!session) {
            session = new Soup.Session({ timeout: 10 });
        }

        // Create body of Soup request
        let message = Soup.Message.new_from_encoded_form(
            "GET", "https://economia.awesomeapi.com.br/last/USD-BRL", Soup.form_encode_hash({}));

        // Send Soup request to API Server
        await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, r0) => {
            let text = session.send_and_read_finish(r0);
            let response = new TextDecoder().decode(text.get_data());
            const body_response = JSON.parse(response);

            // Get the value of Dollar Quotation
            upDown = body_response["USDBRL"]["varBid"];
            dollarQuotation = body_response["USDBRL"]["bid"];
            dollarQuotation = dollarQuotation.split(".");
            dollarQuotation = dollarQuotation[0] + "," + dollarQuotation[1].substring(0, 2);

            parseFloat(upDown) > 0 ? upDownIcon = "⬆" : upDownIcon = "⬇";

            // Set text in Widget
            panelButtonText = new St.Label({
                text: "(U$: 1,00) = (R$: " + dollarQuotation + ") " + upDownIcon,
                y_align: Clutter.ActorAlign.CENTER,
            });
            panelButton.set_child(panelButtonText);

            // Finish Soup Session
            session.abort();
            text = undefined;
            response = undefined;
        });
    } catch (error) {
        log(`Traceback Error in [handle_request_dollar_api]: ${error}`);
        panelButtonText = new St.Label({
            text: "(USD: 1,00) = (BRL: " + _dollarQuotation + ")" + " * ",
            y_align: Clutter.ActorAlign.CENTER,
        });
        panelButton.set_child(panelButtonText);
        session.abort();
    }
}
