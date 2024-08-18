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

import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import getCoinConversion from './services/AwesomeApi.js';

// consts
var panelButton;
var panelButtonText;
var sourceId = null;


export default class DollarToBrlExtension extends Extension {
    // Update Extension Widgets
    _update(coinConversion = null) {
        let upDownIcon = null;

        if (coinConversion) {
            parseFloat(coinConversion["varBid"]) > 0 ? upDownIcon = "⬆" : upDownIcon = "⬇";
            // Set text in Widget
            panelButtonText = new St.Label({
                text: "(U$: 1,00) = (R$: " + coinConversion["coinBid"] + ") " + upDownIcon,
                y_align: Clutter.ActorAlign.CENTER,
            });
            panelButton.set_child(panelButtonText);

        } else {
            panelButtonText = new St.Label({
                text: "(U$: 1,00) = (R$: ?",
                y_align: Clutter.ActorAlign.CENTER,
            });
            panelButton.set_child(panelButtonText);
        }
    }

    // Start Extension
    init() {
        console.log(`[dollar-to-brl][extension.js][init] start extension`);
    }

    // Enable Extension
    enable() {
        console.log('[dollar-to-brl][extension.js][enable] enable extension');
        panelButton = new St.Bin({
            style_class: "panel-button",
        });
        this._update(getCoinConversion());
        Main.panel._centerBox.insert_child_at_index(panelButton, 0);
        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
            this._update(getCoinConversion());
            return GLib.SOURCE_CONTINUE;
        });
    }

    // Disable Extension
    disable() {
        console.log('[dollar-to-brl][extension.js][disable] disable extension');

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

}
