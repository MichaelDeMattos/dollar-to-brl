/* AwesomeApi.js
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

import Soup from 'gi://Soup?version=3.0';

// Get coin conversion
async function getCoinConversion(conversionFrom = "USD-BRL") {
    let varBid = null;
    let coinBid = null;
    let session = null;

    try {
        // Create a new Soup Session
        if (!session) {
            session = new Soup.Session({ timeout: 10 });
        }

        // Create body of Soup request
        let message = Soup.Message.new_from_encoded_form(
            "GET", `https://economia.awesomeapi.com.br/last/${conversionFrom}`, Soup.form_encode_hash({}));

        // Send Soup request to API Server
        await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, r0) => {
            let text = session.send_and_read_finish(r0);
            let response = new TextDecoder().decode(text.get_data());
            const body_response = JSON.parse(response);

            // Get the value from coin quotation
            varBid = body_response[conversionFrom.replace("-", "")]["varBid"];
            coinBid = body_response[conversionFrom.replace("-", "")]["bid"];
            coinBid = coinBid.split(".");
            coinBid = coinBid[0] + "," + coinBid[1].substring(0, 2);

            // Finish Soup Session
            session.abort();
            text = undefined;
            response = undefined;

            // Return Values
            return { "varBid": varBid, "coinBid": coinBid };

        });
    } catch (error) {
        console.log(`[dollar-to-brl][services][AwesomeApi.js][getCoinConversion] raised the following error: ${error}`);
        if (session) {
            session.abort();
        }
        return null;
    }
}


export default getCoinConversion;
