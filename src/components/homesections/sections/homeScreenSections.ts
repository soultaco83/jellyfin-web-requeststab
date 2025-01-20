/// File Added - Paradox - Adding support for server provided home screen section types.
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type {ApiClient} from "jellyfin-apiclient";

import cardBuilder from 'components/cardbuilder/cardBuilder';
import layoutManager from "../../layoutManager";
import { appRouter } from 'components/router/appRouter';
import ServerConnections from 'components/ServerConnections';
import globalize from "../../../lib/globalize";
import type {UserSettings} from "../../../scripts/settings/userSettings";
import { getBackdropShape } from 'utils/card';

import {type SectionContainerElement, SectionOptions} from "./section";

import Dashboard from "../../../utils/dashboard";
import {resume} from "../homesections";
import browser from "../../../scripts/browser";

function getHomeScreenSectionFetchFn(
    serverId: string,
    sectionInfo: HomeScreenSectionData
) {
    return function() {
        const apiClient = ServerConnections.getApiClient(serverId);
        const getUrl = apiClient.getUrl('HomeScreen/Section/' + sectionInfo.Section, {
            UserId: apiClient.getCurrentUserId(),
            AdditionalData: sectionInfo.AdditionalData
        });

        return apiClient.getJSON(getUrl);
    };
}

function getHomeScreenSectionItemsHtmlFn(
    useEpisodeImages: boolean,
    { enableOverflow }: SectionOptions,
    sectionKey: string,
) {
    return function (items : BaseItemDto[]) {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            inheritThumb: !useEpisodeImages,
            shape: getBackdropShape(enableOverflow),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            showDetailsMenu: true,
            overlayPlayButton: sectionKey !== 'MyMedia',
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: false,
            cardLayout: cardLayout,
            showYear: true,
            lines: sectionKey === 'MyMedia' ? 1 : 2
        });
    };
}

function getHomeScreenSections(apiClient : ApiClient, options : HomeScreenSectionsOptions) : Promise<HomeScreenSectionsData> {
    const getUrl = apiClient.getUrl('HomeScreen/Sections', options);

    return apiClient.getJSON(getUrl);
}

function loadHomeSection(
    page: HTMLElement,
    apiClient: ApiClient,
    user: Object,
    userSettings : UserSettings,
    sectionInfo: HomeScreenSectionData,
    options: SectionOptions
) {

    let sectionClass = sectionInfo.Section;
    if (sectionInfo.Limit > 1) {
        sectionClass += '-' + sectionInfo.AdditionalData;
    }
    const elem : HTMLElement | null = page.querySelector('.' + sectionClass);

    if (elem !== null) {
        let html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv && sectionInfo.Route !== undefined) {
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(sectionInfo.Route, {
                serverId: apiClient.serverId()
            }) + '" class="button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += sectionInfo.DisplayText;
            html += '</h2>';
            html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
            html += '</a>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += sectionInfo.DisplayText;
            html += '</h2>';
        }
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="videoplayback,markplayed">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="videoplayback,markplayed">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        const itemsContainer : SectionContainerElement | null = elem.querySelector('.itemsContainer');

        if (itemsContainer !== null) {
            itemsContainer.fetchData = getHomeScreenSectionFetchFn(apiClient.serverId(), sectionInfo);
            itemsContainer.getItemsHtml = getHomeScreenSectionItemsHtmlFn(userSettings.useEpisodeImagesInNextUpAndResume(), options, sectionInfo.Section);
            itemsContainer.parentContainer = elem;
        }
    }

    return Promise.resolve();
}

function enableScrollX() {
    return true;
}

// Exported data
export class HomeScreenSectionsOptions {
    UserId: string | undefined;
}

export class HomeScreenSectionsData {
    TotalRecordCount: number = 0;
    Items: Array<HomeScreenSectionData> | undefined;
}

export class HomeScreenSectionData {
    Section: string = "";
    Limit: number = 1;
    AdditionalData: any;
    Route: string | undefined;
    DisplayText: string | undefined;
}

export function isUserUsingHomeScreenSections(userSettings : UserSettings) : boolean {
    return userSettings &&
        userSettings.getData() &&
        userSettings.getData().CustomPrefs &&
        userSettings.getData().CustomPrefs['useModularHome'] === 'true';
}

export async function loadHomeScreenSections(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: any,
    userSettings: UserSettings
) {
    const homeScreenSections = await getHomeScreenSections(apiClient, {
        UserId: apiClient.getCurrentUserId()
    });
    const options = { enableOverflow: enableScrollX() };
    let html = '';
    const promises = [];
    if (homeScreenSections.Items !== undefined) {
        for (let i = 0; i < homeScreenSections.TotalRecordCount; i++) {
            let sectionClass = homeScreenSections.Items[i].Section;
            if (homeScreenSections.Items[i].Limit > 1) {
                sectionClass += '-' + homeScreenSections.Items[i].AdditionalData;
            }
            html += '<div class="verticalSection ' + sectionClass + '"></div>';
        }

        elem.innerHTML = html;
        elem.classList.add('homeSectionsContainer');

        if (homeScreenSections.TotalRecordCount > 0) {
            for (let i_1 = 0; i_1 < homeScreenSections.Items.length; i_1++) {
                let s = homeScreenSections.Items[i_1];
                promises.push(loadHomeSection(elem, apiClient, user, userSettings, s, options));
            }
        }
    }
    if (homeScreenSections.TotalRecordCount > 0) {

        return Promise.all(promises).then(function () {
            return resume(elem, {
                refresh: true
            });
        });
    } else {
        let noLibDescription;
        if (user.Policy?.IsAdministrator) {
            noLibDescription = globalize.translate('NoCreatedLibraries', '<br><a id="button-createLibrary" class="button-link">', '</a>');
        } else {
            noLibDescription = globalize.translate('AskAdminToCreateLibrary');
        }

        html += '<div class="centerMessage padded-left padded-right">';
        html += '<h2>' + globalize.translate('MessageNothingHere') + '</h2>';
        html += '<p>' + noLibDescription + '</p>';
        html += '</div>';
        elem.innerHTML = html;

        const createNowLink = elem.querySelector('#button-createLibrary');
        if (createNowLink) {
            createNowLink.addEventListener('click', function () {
                Dashboard.navigate('dashboard/libraries');
            });
        }
    }
}