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

const {St, Gio, Clutter, Soup, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

let panelButton;
let panelButtonText;
let _httpSession;
let _dollarQuotation;
let sourceId = null;

// Start application
function init(){
    log(`initializing ${Me.metadata.name}`);
}

// Add the button to the panel
function enable() {
    log(`enabling ${Me.metadata.name}`);
    panelButton = new St.Bin({
        style_class : "panel-button",
    });

    load_json_async();
    Main.panel._centerBox.insert_child_at_index(panelButton, 0);
    sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        load_json_async();
        return GLib.SOURCE_CONTINUE;
    });
}

// Remove the added button from panel
function disable(){
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

// Requests API Dollar
function load_json_async(){
    if (_httpSession === undefined) {
        _httpSession = new Soup.Session();
    } 
        else {
        _httpSession.abort();
    }

    let message = Soup.form_request_new_from_hash(
        'GET', 
        "https://economia.awesomeapi.com.br/last/USD-BRL", 
        {});
    
    _httpSession.queue_message(message, () => {
        try {
            if (!message.response_body.data) {
                panelButtonText = new St.Label({
                    text : "(USD: 1,00) = (BRL: " + _dollarQuotation + ")" + " * ",
                    y_align: Clutter.ActorAlign.CENTER,
                });
                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;
            }

            let jp = JSON.parse(message.response_body.data);
            _dollarQuotation = jp["USD"]["bid"];
            _dollarQuotation = _dollarQuotation.split(".");
            _dollarQuotation = _dollarQuotation[0] + "," + _dollarQuotation[1].substring(0,2);
   
            panelButtonText = new St.Label({
                text : "(USD: 1,00) = (BRL: " + _dollarQuotation + ")",
                y_align: Clutter.ActorAlign.CENTER,
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;

        } catch (e) {
            panelButtonText = new St.Label({
                text : "(USD: 1,00) = (BRL: " + _dollarQuotation + ")" + " * ",
                y_align: Clutter.ActorAlign.CENTER,
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;
        }
    });
    return;
}
