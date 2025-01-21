import HomescreenSettings from '../../../components/homeScreenSettings/homeScreenSettings';
import * as userSettings from '../../../scripts/settings/userSettings';
import autoFocuser from '../../../components/autoFocuser';
import '../../../components/listview/listview.scss';

/* eslint-disable indent */

// Shortcuts
export default function (view, params) {
    view.addEventListener('viewshow', function () {
        const pageUrl = params.pageUrl;

        if (pageUrl) {
            const container = view.querySelector('.userPluginSettingsContainer');

            ApiClient.ajax({
                type: 'GET',
                url: pageUrl
            }).then(function(response) {
                console.log(response);

                const fragment = document.createRange().createContextualFragment(response);
                container.append(fragment);
            });
        }
    });
}

/* eslint-enable indent */
